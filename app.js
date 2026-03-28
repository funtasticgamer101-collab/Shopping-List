// App State
let lists = [];
let currentListId = null;

// DOM Elements
const mainView = document.getElementById('mainView');
const detailView = document.getElementById('detailView');
const listsContainer = document.getElementById('listsContainer');
const itemsContainer = document.getElementById('itemsContainer');
const emptyState = document.getElementById('emptyState');
const emptyItems = document.getElementById('emptyItems');
const modal = document.getElementById('modal');
const listTitle = document.getElementById('listTitle');
const itemInput = document.getElementById('itemInput');
const listNameInput = document.getElementById('listNameInput');
const progressText = document.getElementById('progressText');
const progressPercent = document.getElementById('progressPercent');
const progressFill = document.getElementById('progressFill');

// Event Listeners
document.getElementById('createListBtn').addEventListener('click', openModal);
document.getElementById('cancelBtn').addEventListener('click', closeModal);
document.getElementById('confirmBtn').addEventListener('click', createList);
document.getElementById('backBtn').addEventListener('click', showMainView);
document.getElementById('addItemBtn').addEventListener('click', addItem);
document.getElementById('deleteListBtn').addEventListener('click', deleteCurrentList);

// Enter key handlers
listNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') createList();
});

itemInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addItem();
});

// Initialize App
function init() {
    loadData();
    renderLists();
}

// Data Management
function loadData() {
    const savedLists = localStorage.getItem('shoppingLists');
    if (savedLists) {
        lists = JSON.parse(savedLists);
    }
}

function saveData() {
    localStorage.setItem('shoppingLists', JSON.stringify(lists));
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Modal Functions
function openModal() {
    modal.classList.add('active');
    listNameInput.value = '';
    listNameInput.focus();
}

function closeModal() {
    modal.classList.remove('active');
}

// List Management
function createList() {
    const name = listNameInput.value.trim();
    if (!name) return;

    const newList = {
        id: generateId(),
        name: name,
        items: [],
        createdAt: Date.now()
    };

    lists.unshift(newList);
    saveData();
    renderLists();
    closeModal();
}

function deleteList(listId) {
    if (!confirm('Are you sure you want to delete this list?')) return;

    lists = lists.filter(list => list.id !== listId);
    saveData();
    renderLists();
}

function deleteCurrentList() {
    if (!currentListId) return;
    
    if (!confirm('Are you sure you want to delete this list?')) return;

    lists = lists.filter(list => list.id !== currentListId);
    saveData();
    showMainView();
    renderLists();
}

function openList(listId) {
    currentListId = listId;
    const list = lists.find(l => l.id === listId);
    if (!list) return;

    listTitle.textContent = list.name;
    renderItems();
    updateProgress();
    showDetailView();
    itemInput.value = '';
    itemInput.focus();
}

// Item Management
function addItem() {
    const text = itemInput.value.trim();
    if (!text || !currentListId) return;

    const list = lists.find(l => l.id === currentListId);
    if (!list) return;

    const newItem = {
        id: generateId(),
        text: text,
        checked: false,
        createdAt: Date.now()
    };

    list.items.push(newItem);
    saveData();
    renderItems();
    renderLists();
    updateProgress();
    itemInput.value = '';
}

function toggleItem(listId, itemId) {
    const list = lists.find(l => l.id === listId);
    if (!list) return;

    const item = list.items.find(i => i.id === itemId);
    if (!item) return;

    item.checked = !item.checked;
    saveData();
    renderItems();
    renderLists();
    updateProgress();
}

function deleteItem(listId, itemId) {
    const list = lists.find(l => l.id === listId);
    if (!list) return;

    list.items = list.items.filter(i => i.id !== itemId);
    saveData();
    renderItems();
    renderLists();
    updateProgress();
}

// Rendering Functions
function renderLists() {
    listsContainer.innerHTML = '';

    if (lists.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    lists.forEach(list => {
        const totalItems = list.items.length;
        const completedItems = list.items.filter(i => i.checked).length;
        const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

        const card = document.createElement('div');
        card.className = 'list-card';
        card.innerHTML = `
            <div class="list-card-header">
                <div>
                    <div class="list-card-title">${escapeHtml(list.name)}</div>
                    <div class="list-card-count">${completedItems} of ${totalItems} items</div>
                </div>
                <button class="list-card-delete" data-list-id="${list.id}">🗑️</button>
            </div>
            <div class="list-card-progress">
                <div class="progress-bar-mini">
                    <div class="progress-fill-mini" style="width: ${progressPercentage}%"></div>
                </div>
            </div>
        `;

        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('list-card-delete')) {
                openList(list.id);
            }
        });

        const deleteBtn = card.querySelector('.list-card-delete');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteList(list.id);
        });

        listsContainer.appendChild(card);
    });
}

function renderItems() {
    itemsContainer.innerHTML = '';

    const list = lists.find(l => l.id === currentListId);
    if (!list) return;

    if (list.items.length === 0) {
        emptyItems.style.display = 'block';
        return;
    }

    emptyItems.style.display = 'none';

    list.items.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = `item ${item.checked ? 'checked' : ''}`;
        itemEl.innerHTML = `
            <div class="item-checkbox ${item.checked ? 'checked' : ''}" data-item-id="${item.id}"></div>
            <div class="item-text ${item.checked ? 'checked' : ''}">${escapeHtml(item.text)}</div>
            <button class="item-delete" data-item-id="${item.id}">×</button>
        `;

        const checkbox = itemEl.querySelector('.item-checkbox');
        checkbox.addEventListener('click', () => toggleItem(currentListId, item.id));

        const deleteBtn = itemEl.querySelector('.item-delete');
        deleteBtn.addEventListener('click', () => deleteItem(currentListId, item.id));

        itemsContainer.appendChild(itemEl);
    });
}

function updateProgress() {
    const list = lists.find(l => l.id === currentListId);
    if (!list) return;

    const totalItems = list.items.length;
    const completedItems = list.items.filter(i => i.checked).length;
    const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    progressText.textContent = `${completedItems} of ${totalItems} completed`;
    progressPercent.textContent = `${Math.round(progressPercentage)}%`;
    progressFill.style.width = `${progressPercentage}%`;
}

// View Management
function showMainView() {
    detailView.classList.remove('active');
    mainView.classList.add('active');
    currentListId = null;
}

function showDetailView() {
    mainView.classList.remove('active');
    detailView.classList.add('active');
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
