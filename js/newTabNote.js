const initText = "# Welcome to NEW TAB NOTE!!\n\nThank you for downloading NEW TAB NOTE! 🎉\nNEW TAB NOTE a new tab extension for notes 📖\nLet's edit by pressing the pencil mark in the upper left!\n\n## Example\n\n### ■ Emphasis\n*This text will be italic.*\n**This text will be bold.**\n*You **can** combine them.*\n\n### ■ Lists\n\n####  Unordered\n* Item 1\n* Item 2\n  * Item 2a\n  * Item 2b\n\n#### Ordered\n1. Item 1\n2. Item 2\n3. Item 3\n\n### ■ Link\n[Chrome Web Store](https://chrome.google.com/webstore/category/extensions?hl=en&)\n\n### ■ Task Lists\n- [ ] Task 1\n- [X] Task 2\n\n### ■ Blockquote\n> **note**\n> element is used to indicate the quotation of a large section of text from another source.\n\n### ■ Code\n```\nif (isAwesome) {\n  return true\n}\n```\n";
// Input
const editInput = document.getElementById('edit-input');
const editInputLineHeight = parseInt(editInput.style.lineHeight);
// Window
const editWindow = document.getElementById('edit-window');
const previewWindow = document.getElementById('preview-window');
// Mode Buttons
const modeButtons = Array.from(document.getElementsByClassName('mode-button'));
const modeEditButton = document.getElementById('mode-edit');
const modeSplitButton = document.getElementById('mode-split');
const modePreviewButton = document.getElementById('mode-preview');
// Filter
const filterDisplay = document.getElementById('filter-display');
const filterButton = document.getElementById('filter-button');
const filterActiveButton = document.getElementById('filter-active');
const filterNoActiveButton = document.getElementById('filter-no-active');
// Side Menu
const sideButtons = Array.from(document.getElementsByClassName('side-button'));
const sideFileButton = document.getElementById('side-file');
const sideContentWindow = document.getElementById('side-bar-content');
// Note
const noteList = document.getElementById('note-list');
const addNote = document.getElementById('add-note');

window.onload = () => {
  const height = window.innerHeight - 70;
  editInput.style.height = height + 'px';
  previewWindow.style.height = height + 35 + 'px';
  let notes = []

  if (localStorage.hasOwnProperty('new_tab_note:notes')) {
    try {
      notes = JSON.parse(localStorage.getItem('new_tab_note:notes'));
      const targetIndex = notes.findIndex(note => note.id === localStorage.getItem('new_tab_note:target_note_id'));
      editInput.value = notes[targetIndex !== -1 ? targetIndex : 0].text.replace(/\s+$/, '');
      previewWindow.innerHTML = marked(notes[targetIndex !== -1 ? targetIndex : 0].text);
      localStorage.setItem('new_tab_note:target_note_id', notes[targetIndex !== -1 ? targetIndex : 0].id);
    } catch {
      const id = uuidv4();
      notes.push({
        id,
        text: localStorage.getItem('new_tab_note:notes')
      });
      editInput.value = notes[0].text.replace(/\s+$/, '');
      previewWindow.innerHTML = marked(notes[0].text);
      localStorage.setItem('new_tab_note:notes', JSON.stringify(notes));
      localStorage.setItem('new_tab_note:target_note_id', id);
    }
  } else {
    const id = uuidv4();
    notes.push({
      id,
      text: initText.replace(/\s+$/, '')
    });
    localStorage.setItem('new_tab_note:notes', JSON.stringify(notes));

    editInput.value = notes[0].text;
    previewWindow.innerHTML = marked(notes[0].text);
    localStorage.setItem('new_tab_note:target_note_id', id);

    localStorage.removeItem('new_tab_note_init');
  }

  modeHandler.setModeFromSavedMode();
  filterStatusHandler.setFilterStatus();

  // li作成
  notes = JSON.parse(localStorage.getItem('new_tab_note:notes'));
  notes.forEach(note => {
    createNoteList(note.id, note.text);
  });

  if (notes.length <= 1) {
    document.getElementById(localStorage.getItem('new_tab_note:target_note_id')).classList.add('delete-disabled');
  }
};

editInput.addEventListener('input', () => {
  if (!localStorage.hasOwnProperty('new_tab_note:notes')) {
    const id = uuidv4();
    localStorage.setItem('new_tab_note:notes', JSON.stringify([
      {
        id,
        text: ''
      }
    ]));
    localStorage.setItem('new_tab_note:target_note_id', id);
  }
  saveToLocalStorage(editInput.value);
  const listItem = document.getElementById(localStorage.getItem('new_tab_note:target_note_id')).getElementsByTagName('p')[0];
  listItem.innerHTML = (editInput.value.trim() || 'new note').substr(0, 20);

  // 改行でテキストエリア の高さ自動調整
  const lines = (editInput.value + '\n').match(/\n/g).length;
  editInput.style.height = lines * editInputLineHeight;
});

// 他のタブが更新されたら現在のタブの情報も更新するように
window.addEventListener('storage', (event) => {
  // ノート内容
  if (event.key === 'new_tab_note:notes') {
    try {
      const notes = JSON.parse(event.newValue);
      const targetIndex = notes.findIndex(note => note.id === localStorage.getItem('new_tab_note:target_note_id'));
      editInput.value = notes[targetIndex].text.replace(/\s+$/, '');
      previewWindow.innerHTML = marked(notes[targetIndex].text);

      // リストの文言更新
      const listItem = document.getElementById(localStorage.getItem('new_tab_note:target_note_id')).getElementsByTagName('p');
      listItem.innerHTML = (notes[targetIndex].text.trim() || 'new note').substr(0, 20);
    } catch {
      editInput.value = event.newValue;
      previewWindow.innerHTML = marked(event.newValue);
    }
    // フィルター
  } else if (event.key === 'new_tab_note:filter') {
    if (event.newValue === 'true') {
      onFilter();
    } else {
      offFilter();
    }
    // 表示モード
  } else if (event.key === 'new_tab_note:mode') {
    if (event.newValue === 'mode-edit') {
      editWindow.classList.remove('none');
      editWindow.classList.add('edit-only');
      previewWindow.classList.add('none');
      modeHandler.saveMode('mode-edit');
    } else if (event.newValue === 'mode-split') {
      editWindow.classList.remove('none');
      editWindow.classList.remove('edit-only');
      previewWindow.classList.remove('none');
      modeHandler.saveMode('mode-split');
    } else if (event.newValue === 'mode-preview') {
      editWindow.classList.add('none');
      editWindow.classList.remove('edit-only');
      previewWindow.classList.remove('none');
      modeHandler.saveMode('mode-preview');
    }
    modeButtonStatus(event.newValue);
  } else if (event.key === 'new_tab_note:target_note_id') {
    changeNote(event.newValue);
  }
});

editInput.addEventListener('keydown', (e) => {
  if (!e) return;

  // Tab
  if (e.keyCode === 9) {
    e.preventDefault();
    // 現在のカーソルの位置
    const cursorPosition = editInput.selectionStart;
    // カーソルの左右の文字列を取得
    const cursorLeft = editInput.value.substr(0, cursorPosition);
    const cursorRight = editInput.value.substr(cursorPosition, editInput.value.length);
    editInput.value = cursorLeft + '  ' + cursorRight;
    // カーソルの位置を入力したタブの後ろにする
    editInput.selectionEnd = cursorPosition + 2;
    saveToLocalStorage(editInput.value);
  }

  // Enter
  if (e.keyCode === 13) {
    // 現在のカーソルの位置
    const cursorPosition = editInput.selectionStart;
    // カーソル位置までの文字を取得
    const text = editInput.value.substr(0, cursorPosition);
    const targetSentence = text.split('\n').pop();

    // list
    const regexList = /^[*-]\s+/;
    // listの小要素
    const regexListChild = /^\s+[*-]\s+/;
    // 数字のlist
    const regexNumberList = /^[0-9]+.\s+/;
    if (regexList.test(targetSentence)) {
      e.preventDefault();
      setListPoint(regexList, targetSentence, cursorPosition);
    } else if (regexListChild.test(targetSentence)) {
      e.preventDefault();
      setListPoint(regexListChild, targetSentence, cursorPosition);
    }
  }
})

function setListPoint(regex, targetSentence, cursorPosition) {
  const listPoint = targetSentence.match(regex)[0];
  editInput.value = editInput.value.substr(0, cursorPosition) + '\n' + listPoint + editInput.value.substr(cursorPosition, editInput.value.length);
  editInput.focus();
  var newCaret = cursorPosition + '\n'.length + listPoint.length;

  // カーソル位置
  editInput.setSelectionRange(newCaret, newCaret);

  // リスト入力リセット
  const regexBlankList = /[\n]\s*[*-]\s+[\n]*\s*?[*-]\s+\n+/;
  const blankList = editInput.value.match(regexBlankList);
  if (blankList) {
    const idx = blankList.index
    editInput.value = editInput.value.replace(blankList[0], '\n\n')
    // カーソル位置
    editInput.setSelectionRange(idx + 1, idx + 1);
  }
  saveToLocalStorage(editInput.value);
}

// Mode button
modeEditButton.addEventListener('click', (e) => {
  editWindow.classList.remove('none');
  editWindow.classList.add('edit-only');
  previewWindow.classList.add('none');
  modeHandler.saveMode('mode-edit');
  modeButtonStatus(e.target.id);
});
modeSplitButton.addEventListener('click', (e) => {
  editWindow.classList.remove('none');
  editWindow.classList.remove('edit-only');
  previewWindow.classList.remove('none');
  modeHandler.saveMode('mode-split');
  modeButtonStatus(e.target.id);
});
modePreviewButton.addEventListener('click', (e) => {
  editWindow.classList.add('none');
  editWindow.classList.remove('edit-only');
  previewWindow.classList.remove('none');
  modeHandler.saveMode('mode-preview');
  modeButtonStatus(e.target.id);
});

function modeButtonStatus(id) {
  modeButtons.forEach((buttonLabel) => {
    if (buttonLabel.htmlFor === id) {
      buttonLabel.classList.add('active');
    } else {
      buttonLabel.classList.remove('active');
    }
  });
}

function saveToLocalStorage(value) {
  const notes = JSON.parse(localStorage.getItem('new_tab_note:notes'));

  // 現在選択ページに格納
  const targetIndex = notes.findIndex(note => note.id === localStorage.getItem('new_tab_note:target_note_id'));
  if (targetIndex === -1) return;
  notes[targetIndex].text = value;

  // ローカルストレージに保存
  localStorage.setItem('new_tab_note:notes', JSON.stringify(notes));

  // マークダウンに変換
  const convertedText = marked(value);
  // - [] , - [x] をチェックボックス変換
  previewWindow.innerHTML = convertedText.replace(
    /\[x\]/g,
    "<input type='checkbox' checked='checked'>"
  );
  previewWindow.innerHTML = convertedText.replace(
    /\[ \]/g,
    "<input type='checkbox'>"
  );
}

// モード状態の保持
const createModeHandler = () => {
  const MODE_KEY = 'new_tab_note:mode';

  const getSavedMode = () => {
    if (localStorage.hasOwnProperty(MODE_KEY)) {
      return localStorage.getItem(MODE_KEY)
    }
    return null;
  }

  // modeには'mode-edit', 'mode-split', 'mode-preview'を使う
  const saveMode = (mode) => {
    localStorage.setItem(MODE_KEY, mode);
  }

  const clickModeElement = (modeElementId) => {
    document.getElementById(modeElementId).click()
  }

  const setModeFromSavedMode = () => {
    const currentMode = getSavedMode()
    if (currentMode === null) return;
    clickModeElement(currentMode);
  }

  return {
    saveMode,
    setModeFromSavedMode
  }
}

const modeHandler = createModeHandler();

// フィルター状態の保持
const createFilterStatusHandler = () => {
  const FILTER_KEY = 'new_tab_note:filter';

  const getSavedFilterStatus = () => {
    if (localStorage.hasOwnProperty(FILTER_KEY)) {
      return localStorage.getItem(FILTER_KEY)
    }
    return null;
  }

  const saveFilterStatus = (status) => {
    localStorage.setItem(FILTER_KEY, status);
  }

  const setFilterStatus = () => {
    const status = getSavedFilterStatus();
    if (status === 'true') {
      onFilter();
    } else {
      offFilter();
    }
  }

  return {
    saveFilterStatus,
    setFilterStatus
  }
}

const filterStatusHandler = createFilterStatusHandler();

// Window risize
window.addEventListener(
  'resize',
  function () {
    const height = window.innerHeight - 35;
    editInput.style.height = height + 'px';
    previewWindow.style.height = height + 35 + 'px';
  },
  false
);

marked.setOptions({
  breaks: true,
  langPrefix: '',
});

// filter
filterButton.addEventListener('change', (e) => {
  if (e.target.checked) {
    onFilter();
    filterStatusHandler.saveFilterStatus(true);
  } else {
    offFilter();
    filterStatusHandler.saveFilterStatus(false);
  }
});

function onFilter() {
  filterActiveButton.style.display = 'none';
  filterNoActiveButton.style.display = 'block';
  editInput.classList.add('filter');
  editInput.readOnly = true;
  previewWindow.classList.add('filter');
  filterDisplay.style.display = 'block';
  filterButton.checked = true;
}

function offFilter() {
  filterNoActiveButton.style.display = 'none';
  filterActiveButton.style.display = 'block';
  editInput.classList.remove('filter');
  editInput.readOnly = false;
  previewWindow.classList.remove('filter');
  filterDisplay.style.display = 'none';
  filterButton.checked = false;
}

// Side button
sideFileButton.addEventListener('click', (e) => {
  if (sideContentWindow.classList.contains('none')) {
    sideContentWindow.classList.remove('none');
  } else {
    sideContentWindow.classList.add('none');
  }
  sideButtonStatus(e.target.id);
});

function sideButtonStatus(id) {
  sideButtons.forEach((buttonLabel) => {
    if (buttonLabel.htmlFor === id) {
      buttonLabel.classList.add('active');
    } else {
      buttonLabel.classList.remove('active');
    }
  });
};

addNote.addEventListener('click', () => {
  const notes = JSON.parse(localStorage.getItem('new_tab_note:notes'));
  const newId = uuidv4();
  notes.push({
    id: newId,
    text: ''
  });

  document.getElementById(notes[0].id).classList.remove('delete-disabled');

  localStorage.setItem('new_tab_note:notes', JSON.stringify(notes));

  createNoteList(newId, '');
  document.getElementById(newId).getElementsByTagName('p')[0].click();
});

// ノート選択
function changeNote(id) {
  const noteListItem = Array.from(document.getElementsByClassName('note-list__item'));

  const notes = JSON.parse(localStorage.getItem('new_tab_note:notes'));
  const targetIndex = notes.findIndex(note => note.id === id);

  if (targetIndex === -1) return;
  localStorage.setItem('new_tab_note:target_note_id', id);
  noteListItem.forEach((note) => note.classList.remove('active'));

  noteListItem[targetIndex].classList.add('active');
  editInput.value = notes[targetIndex].text ? notes[targetIndex].text.replace(/\s+$/, '') : '';
  previewWindow.innerHTML = marked(notes[targetIndex].text);
}

// uuid生成
function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
};

// <li>作成
function createNoteList(id, text) {
  const listItem = document.createElement('li');
  listItem.setAttribute('id', id);
  listItem.setAttribute('class', 'note-list__item');
  noteList.appendChild(listItem).addEventListener('click', (e) => {
    changeNote(e.target.parentElement.id);
  });

  const textItem = document.createElement('p');
  listItem.appendChild(textItem).innerHTML = (text.trim() || 'new note').substr(0, 20);

  const deleteItem = document.createElement('span');
  listItem.appendChild(deleteItem).addEventListener('click', (e) => deleteNote(e.target.parentElement.id));

  if (id === localStorage.getItem('new_tab_note:target_note_id')) {
    listItem.classList.add('active');
  }
}

// ノート削除
function deleteNote(id) {
  const notes = JSON.parse(localStorage.getItem('new_tab_note:notes'));
  if (notes.length <= 1) return;

  if (window.confirm('本当に削除しますか？')) {
    const targetIndex = notes.findIndex(note => note.id === id);

    const remainNotes = notes.filter(note => note.id !== id);
    // ストレージ更新
    localStorage.setItem('new_tab_note:notes', JSON.stringify(remainNotes));

    // li削除
    document.getElementById(id).remove();
    const noteListItem = Array.from(document.getElementsByClassName('note-list__item'));
    noteListItem.forEach((note) => note.classList.remove('active'));

    // 削除後に表示するノート
    if (remainNotes[targetIndex]) {
      localStorage.setItem('new_tab_note:target_note_id', remainNotes[targetIndex].id);
      noteListItem[targetIndex].classList.add('active');

      editInput.value = remainNotes[targetIndex].text.replace(/\s+$/, '');
      previewWindow.innerHTML = marked(remainNotes[targetIndex].text);
    } else if (remainNotes[targetIndex - 1]) {
      localStorage.setItem('new_tab_note:target_note_id', remainNotes[targetIndex - 1].id);
      noteListItem[targetIndex - 1].classList.add('active');

      editInput.value = remainNotes[targetIndex - 1].text.replace(/\s+$/, '');
      previewWindow.innerHTML = marked(remainNotes[targetIndex - 1].text);
    } else {
      localStorage.setItem('new_tab_note:target_note_id', remainNotes[0].id);
      noteListItem[0].classList.add('active');

      editInput.value = remainNotes[0].text.replace(/\s+$/, '');
      previewWindow.innerHTML = marked(remainNotes[0].text);
    }

    if (remainNotes.length <= 1) {
      document.getElementById(remainNotes[0].id).classList.add('delete-disabled');
    }
  }
}