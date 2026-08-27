// Oberfläche für die eigenen Listen ("Bierzelt", "Exotische Drinks" …):
// eine Chip-Leiste zum Umschalten und ein Dialog zum Anlegen/Bearbeiten.
// Die Daten liegen in shared/data.js, diese Datei wird von allen drei
// Seiten gemeinsam genutzt. Die Seite ruft initLists(onChange) auf und
// baut in onChange ihre Karten neu auf.

let listsChangeHandler = null;
let listBarEl = null;

let editingListId = null;          // null = neue Liste
let editSelection = new Set();     // Namen, die in der Liste stehen sollen
let editFilter = "";

let listOverlay = null;
let listFormTitleEl, listNameInput, listEmojiInput, listErrorEl,
    listFilterInput, listPickerEl, listCountEl, listDeleteBtn;

const LIST_DIALOG_HTML = `
<div class="add-form list-form" role="dialog" aria-modal="true" aria-labelledby="listFormTitle">
  <div class="add-form-header">
    <h2 id="listFormTitle">Neue Liste</h2>
    <button class="modal-close" data-role="close" type="button" aria-label="Schließen">&times;</button>
  </div>
  <div class="list-name-row">
    <div class="list-emoji-field">
      <label for="listEmoji">Symbol</label>
      <input type="text" id="listEmoji" class="emoji-input" maxlength="2" placeholder="🍺" autocomplete="off">
    </div>
    <div class="list-name-field">
      <label for="listName">Name der Liste</label>
      <input type="text" id="listName" placeholder="z. B. Bierzelt" autocomplete="off">
    </div>
  </div>
  <div class="form-error" data-role="error">Bitte einen Namen eingeben.</div>

  <label class="list-picker-label">
    Cocktails in dieser Liste
    <span class="list-pick-count" data-role="count"></span>
  </label>
  <input type="search" class="filter-input list-picker-filter" data-role="filter" placeholder="Cocktail suchen…" autocomplete="off">
  <div class="list-picker" data-role="picker"></div>
  <div class="list-picker-actions">
    <button class="card-action-btn" data-role="selectAll" type="button">Angezeigte auswählen</button>
    <button class="card-action-btn" data-role="clearSel" type="button">Auswahl leeren</button>
  </div>

  <button class="card-action-btn delete-btn list-delete-btn" data-role="delete" type="button">Liste löschen</button>

  <div class="add-form-actions">
    <button class="cancel-cocktail-btn" data-role="cancel" type="button">Abbrechen</button>
    <button class="save-cocktail-btn" data-role="save" type="button">Speichern</button>
  </div>
</div>`;

function buildListDialog() {
  listOverlay = document.createElement("div");
  listOverlay.className = "modal-overlay";
  listOverlay.id = "listOverlay";
  listOverlay.innerHTML = LIST_DIALOG_HTML;
  document.body.appendChild(listOverlay);

  const q = role => listOverlay.querySelector('[data-role="' + role + '"]');
  listFormTitleEl = listOverlay.querySelector("#listFormTitle");
  listNameInput = listOverlay.querySelector("#listName");
  listEmojiInput = listOverlay.querySelector("#listEmoji");
  listErrorEl = q("error");
  listFilterInput = q("filter");
  listPickerEl = q("picker");
  listCountEl = q("count");
  listDeleteBtn = q("delete");

  q("close").addEventListener("click", closeListForm);
  q("cancel").addEventListener("click", closeListForm);
  q("save").addEventListener("click", saveListForm);
  listDeleteBtn.addEventListener("click", deleteEditedList);

  listFilterInput.addEventListener("input", () => {
    editFilter = listFilterInput.value.trim().toLowerCase();
    renderListPicker();
  });

  // Nur die gerade angezeigten (gefilterten) Cocktails auswählen bzw. die
  // komplette Auswahl leeren - praktisch bei langen Listen.
  q("selectAll").addEventListener("click", () => {
    pickerNames().forEach(name => editSelection.add(name));
    renderListPicker();
  });
  q("clearSel").addEventListener("click", () => {
    editSelection.clear();
    renderListPicker();
  });

  listOverlay.addEventListener("click", (e) => {
    if (e.target === listOverlay) closeListForm();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isListFormOpen()) closeListForm();
  });
}

// --- Chip-Leiste ---

function makeChip(list, isActive) {
  const wrap = document.createElement("span");
  wrap.className = "list-chip-wrap" + (isActive ? " active" : "");

  const chip = document.createElement("button");
  chip.className = "list-chip";
  chip.type = "button";
  if (list) {
    chip.textContent = (list.emoji ? list.emoji + " " : "") + list.name;
    const count = document.createElement("span");
    count.className = "chip-count";
    count.textContent = list.items.length;
    chip.appendChild(count);
  } else {
    chip.textContent = "Alle";
  }
  chip.addEventListener("click", () => selectList(list ? list.id : null));
  wrap.appendChild(chip);

  // Die aktive Liste lässt sich direkt über den Stift bearbeiten.
  if (list && isActive) {
    const edit = document.createElement("button");
    edit.className = "chip-edit";
    edit.type = "button";
    edit.title = "Liste bearbeiten";
    edit.setAttribute("aria-label", list.name + " bearbeiten");
    edit.textContent = "✎";
    edit.addEventListener("click", (e) => {
      e.stopPropagation();
      openListForm(list.id);
    });
    wrap.appendChild(edit);
  }
  return wrap;
}

function renderListBar() {
  if (!listBarEl) return;
  listBarEl.innerHTML = "";
  listBarEl.appendChild(makeChip(null, activeListId === null));
  sortedLists().forEach(list => listBarEl.appendChild(makeChip(list, list.id === activeListId)));

  const addChip = document.createElement("button");
  addChip.className = "list-chip add-chip";
  addChip.type = "button";
  addChip.textContent = "+ Liste";
  addChip.title = "Neue Liste anlegen";
  addChip.addEventListener("click", () => openListForm(null));
  listBarEl.appendChild(addChip);
}

async function selectList(id) {
  if (activeListId === id) return;
  activeListId = id;
  renderListBar();
  if (listsChangeHandler) listsChangeHandler();
  await saveActiveList();
}

// --- Dialog ---

function isListFormOpen() {
  return listOverlay && listOverlay.classList.contains("open");
}

// Alle Cocktails, die im Dialog zur Auswahl stehen (immer die komplette
// Sammlung, unabhängig davon, welche Liste gerade aktiv ist).
function pickerNames() {
  const names = Object.keys(getAllRecipes());
  const filtered = editFilter ? names.filter(n => n.toLowerCase().includes(editFilter)) : names;
  return filtered.sort((a, b) => a.localeCompare(b, "de"));
}

function renderListPicker() {
  const names = pickerNames();
  listPickerEl.innerHTML = "";

  if (names.length === 0) {
    const hint = document.createElement("div");
    hint.className = "empty-hint";
    hint.textContent = editFilter ? "Kein Treffer." : "Es gibt noch keine Cocktails.";
    listPickerEl.appendChild(hint);
  } else {
    names.forEach(name => {
      const row = document.createElement("label");
      row.className = "pick-row";

      const box = document.createElement("input");
      box.type = "checkbox";
      box.checked = editSelection.has(name);
      box.addEventListener("change", () => {
        if (box.checked) editSelection.add(name);
        else editSelection.delete(name);
        row.classList.toggle("checked", box.checked);
        updatePickCount();
      });

      const text = document.createElement("span");
      text.className = "pick-text";

      const nameEl = document.createElement("span");
      nameEl.className = "pick-name";
      nameEl.textContent = name;

      const cat = categoryOf(name);
      const catEl = document.createElement("span");
      catEl.className = "pick-cat";
      catEl.textContent = cat.emoji + " " + cat.label;

      text.appendChild(nameEl);
      text.appendChild(catEl);
      row.classList.toggle("checked", box.checked);
      row.appendChild(box);
      row.appendChild(text);
      listPickerEl.appendChild(row);
    });
  }
  updatePickCount();
}

function updatePickCount() {
  const n = editSelection.size;
  listCountEl.textContent = n === 1 ? "1 ausgewählt" : n + " ausgewählt";
}

function openListForm(id) {
  const list = id ? cocktailLists.find(l => l.id === id) : null;
  editingListId = list ? list.id : null;
  editSelection = new Set(list ? list.items : []);
  editFilter = "";

  listFormTitleEl.textContent = list ? "Liste bearbeiten" : "Neue Liste";
  listNameInput.value = list ? list.name : "";
  listEmojiInput.value = list ? (list.emoji || "") : "";
  listFilterInput.value = "";
  listErrorEl.classList.remove("show");
  listDeleteBtn.hidden = !list;
  renderListPicker();

  listOverlay.classList.add("open");
  document.body.classList.add("modal-open");
  listNameInput.focus();
}

function closeListForm() {
  listOverlay.classList.remove("open");
  document.body.classList.remove("modal-open");
}

function showListError(text) {
  listErrorEl.textContent = text;
  listErrorEl.classList.add("show");
}

async function saveListForm() {
  const name = listNameInput.value.trim();
  if (!name) {
    showListError("Bitte einen Namen eingeben.");
    listNameInput.focus();
    return;
  }
  const duplicate = cocktailLists.some(l =>
    l.id !== editingListId && l.name.toLowerCase() === name.toLowerCase());
  if (duplicate) {
    showListError("Eine Liste mit diesem Namen gibt es schon.");
    return;
  }

  const emoji = listEmojiInput.value.trim();
  const items = [...editSelection];

  if (editingListId) {
    const list = cocktailLists.find(l => l.id === editingListId);
    if (list) {
      list.name = name;
      list.emoji = emoji;
      list.items = items;
      list.ts = Date.now();
    }
  } else {
    const list = { id: newListId(), name: name, emoji: emoji, items: items, ts: Date.now() };
    cocktailLists.push(list);
    activeListId = list.id; // neue Liste gleich anzeigen
    await saveActiveList();
  }

  closeListForm();
  renderListBar();
  if (listsChangeHandler) listsChangeHandler();
  await saveCocktailLists();
}

async function deleteEditedList() {
  const list = cocktailLists.find(l => l.id === editingListId);
  if (!list) return;
  if (!confirm('Liste "' + list.name + '" wirklich löschen? Die Cocktails selbst bleiben erhalten.')) return;

  cocktailLists = cocktailLists.filter(l => l.id !== list.id);
  if (activeListId === list.id) {
    activeListId = null;
    await saveActiveList();
  }
  closeListForm();
  renderListBar();
  if (listsChangeHandler) listsChangeHandler();
  await saveCocktailLists();
}

// Wird von den Seiten nach dem Laden der Daten aufgerufen.
function initLists(onChange) {
  listsChangeHandler = onChange || null;
  listBarEl = document.getElementById("listBar");
  buildListDialog();
  renderListBar();
}
