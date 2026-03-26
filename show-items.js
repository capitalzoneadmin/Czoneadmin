// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDuU-1WguuPfKh6hTTvd7BzHeBNJanSNiI",
    authDomain: "capital-e817c.firebaseapp.com",
    projectId: "capital-e817c",
    storageBucket: "capital-e817c.firebasestorage.app",
    messagingSenderId: "733831738797",
    appId: "1:733831738797:web:d945b8f3c7a34146e35d24"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

// DOM Elements
const loading = document.getElementById('loading');
const mainContent = document.getElementById('mainContent');
const adminLogo = document.getElementById('adminLogo');
const backBtn = document.getElementById('backBtn');
const refreshBtn = document.getElementById('refreshBtn');
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');
const filterTabs = document.querySelectorAll('.filter-tab');
const itemsGrid = document.getElementById('itemsGrid');
const noItems = document.getElementById('noItems');
const totalItems = document.getElementById('totalItems');
const availableItems = document.getElementById('availableItems');
const soldItems = document.getElementById('soldItems');
const lowStockItems = document.getElementById('lowStockItems');
const navItems = document.querySelectorAll('.nav-item');

const selectionHeader = document.getElementById('selectionHeader');
const selectedCount = document.getElementById('selectedCount');
const bulkDeliveryBtn = document.getElementById('bulkDeliveryBtn');
const bulkPromoBtn = document.getElementById('bulkPromoBtn');
const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
const cancelSelectBtn = document.getElementById('cancelSelectBtn');

const editModal = document.getElementById('editModal');
const closeEditModal = document.getElementById('closeEditModal');
const closeEditModalBtn = document.getElementById('closeEditModalBtn');
const editModalBody = document.getElementById('editModalBody');

// Add modals
const addDeliveryModal = document.getElementById('addDeliveryModal');
const deliveryUserSearch = document.getElementById('deliveryUserSearch');
const deliveryUserList = document.getElementById('deliveryUserList');
const deliveryFeeInput = document.getElementById('deliveryFeeInput');
const cancelAddDelivery = document.getElementById('cancelAddDelivery');
const saveAddDelivery = document.getElementById('saveAddDelivery');

const addPromoModal = document.getElementById('addPromoModal');
const promoUserSearch = document.getElementById('promoUserSearch');
const promoUserList = document.getElementById('promoUserList');
const promoCodeInput = document.getElementById('promoCodeInput');
const promoTypeSelect = document.getElementById('promoTypeSelect');
const promoValueInput = document.getElementById('promoValueInput');
const cancelAddPromo = document.getElementById('cancelAddPromo');
const saveAddPromo = document.getElementById('saveAddPromo');

// Bulk modals
const bulkDeliveryModal = document.getElementById('bulkDeliveryModal');
const bulkDeliveryFee = document.getElementById('bulkDeliveryFee');
const bulkDeliveryTarget = document.getElementById('bulkDeliveryTarget');
const bulkDeliveryUserGroup = document.getElementById('bulkDeliveryUserGroup');
const bulkDeliveryUserSearch = document.getElementById('bulkDeliveryUserSearch');
const bulkDeliveryUserList = document.getElementById('bulkDeliveryUserList');
const cancelBulkDelivery = document.getElementById('cancelBulkDelivery');
const applyBulkDelivery = document.getElementById('applyBulkDelivery');

const bulkPromoModal = document.getElementById('bulkPromoModal');
const bulkPromoCode = document.getElementById('bulkPromoCode');
const bulkPromoType = document.getElementById('bulkPromoType');
const bulkPromoValue = document.getElementById('bulkPromoValue');
const bulkPromoTarget = document.getElementById('bulkPromoTarget');
const bulkPromoUserGroup = document.getElementById('bulkPromoUserGroup');
const bulkPromoUserSearch = document.getElementById('bulkPromoUserSearch');
const bulkPromoUserList = document.getElementById('bulkPromoUserList');
const cancelBulkPromo = document.getElementById('cancelBulkPromo');
const applyBulkPromo = document.getElementById('applyBulkPromo');

const deleteConfirmModal = document.getElementById('deleteConfirmModal');
const deleteCountSpan = document.getElementById('deleteCount');
const cancelDelete = document.getElementById('cancelDelete');
const confirmDelete = document.getElementById('confirmDelete');

const toast = document.getElementById('toast');

// State
let allItems = [];
let filteredItems = [];
let selectedItems = new Set();
let isSelectMode = false;
let currentFilter = 'all';
let searchTerm = '';
let allUsers = [];
let currentAdmin = null;
let currentEditingItemId = null;
let selectedUserIds = new Set(); // for bulk modals

// ---------- Init ----------
setTimeout(() => {
    loading.classList.add('hide');
    mainContent.style.display = 'block';
}, 2000);

document.addEventListener('DOMContentLoaded', () => {
    checkAdminLogin();
    loadLogo();
    loadUsers();
    loadItems();
    setupEventListeners();
});

function checkAdminLogin() {
    const admin = localStorage.getItem('currentAdmin');
    if (!admin) window.location.href = 'index.html';
    else currentAdmin = JSON.parse(admin);
}

async function loadLogo() {
    try {
        const url = await storage.ref('logo/logo.png').getDownloadURL();
        adminLogo.src = url;
    } catch {
        adminLogo.src = '/IMG_20260313_225034.png';
    }
}

async function loadUsers() {
    try {
        const snap = await db.collection('users').get();
        allUsers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

async function loadItems() {
    try {
        const snap = await db.collection('items').get();
        allItems = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        applyFilters();
        updateStats();
    } catch (error) {
        console.error('Error loading items:', error);
        showToast('Error loading items');
    }
}

function applyFilters() {
    let filtered = allItems;

    if (currentFilter === 'available') {
        filtered = filtered.filter(i => i.status === 'available');
    } else if (currentFilter === 'sold') {
        filtered = filtered.filter(i => i.status === 'sold');
    } else if (currentFilter === 'lowstock') {
        filtered = filtered.filter(i => i.available < 10 && i.available > 0);
    }

    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(i =>
            (i.title && i.title.toLowerCase().includes(term)) ||
            (i.category && i.category.toLowerCase().includes(term))
        );
    }

    filteredItems = filtered;
    renderItems();
}

function renderItems() {
    if (filteredItems.length === 0) {
        noItems.classList.add('show');
        itemsGrid.innerHTML = '';
        return;
    }
    noItems.classList.remove('show');

    let html = '';
    filteredItems.forEach(item => {
        const image = item.images?.[0] || 'https://via.placeholder.com/200';
        const statusClass = item.status === 'available' ? 'badge-available' : 'badge-sold';
        const statusText = item.status === 'available' ? 'In Stock' : 'Sold Out';
        const totalStock = (item.available + item.sold) || 1;
        const stockPercent = Math.min(100, (item.sold / totalStock) * 100);
        const isSelected = selectedItems.has(item.id);

        const priceDisplay = `Rs. ${Number(item.price || 0).toLocaleString('en-LK')}`;
        const discountDisplay = item.discountPrice ? `Rs. ${Number(item.discountPrice).toLocaleString('en-LK')}` : '';

        html += `
            <div class="item-card ${isSelectMode ? 'select-mode' : ''} ${isSelected ? 'selected' : ''}" data-id="${item.id}">
                <div class="item-checkbox ${isSelected ? 'checked' : ''}" onclick="toggleSelectItem('${item.id}', event)">
                    ${isSelected ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="item-image" onclick="openEditModal('${item.id}')">
                    <img src="${image}" alt="${escapeHtml(item.title)}" loading="lazy">
                    <div class="item-badge ${statusClass}">${statusText}</div>
                    <div class="item-category">${escapeHtml(item.category || 'General')}</div>
                </div>
                <div class="item-info" onclick="openEditModal('${item.id}')">
                    <h4 class="item-title">${escapeHtml(item.title || 'No title')}</h4>
                    <div class="item-price">
                        <span class="current-price">${priceDisplay}</span>
                        ${discountDisplay ? `<span class="discount-price">${discountDisplay}</span>` : ''}
                    </div>
                    <div class="item-stats">
                        <span><i class="fas fa-shopping-bag"></i> ${item.sold || 0} sold</span>
                        <span><i class="fas fa-box"></i> ${item.available || 0} left</span>
                    </div>
                    <div class="stock-bar"><div class="stock-fill" style="width: ${stockPercent}%"></div></div>
                </div>
            </div>
        `;
    });
    itemsGrid.innerHTML = html;
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function updateStats() {
    totalItems.textContent = allItems.length;
    availableItems.textContent = allItems.filter(i => i.status === 'available').length;
    soldItems.textContent = allItems.filter(i => i.status === 'sold').length;
    lowStockItems.textContent = allItems.filter(i => i.available < 10 && i.available > 0).length;
}

// ---------- Selection Mode ----------
window.toggleSelectItem = function(itemId, event) {
    event.stopPropagation();
    if (!isSelectMode) enterSelectMode();
    if (selectedItems.has(itemId)) selectedItems.delete(itemId);
    else selectedItems.add(itemId);
    updateSelectedCount();
    renderItems();
};

function enterSelectMode() {
    isSelectMode = true;
    selectionHeader.style.display = 'flex';
    selectedItems.clear();
    updateSelectedCount();
    renderItems();
}

function exitSelectMode() {
    isSelectMode = false;
    selectionHeader.style.display = 'none';
    selectedItems.clear();
    renderItems();
}

function updateSelectedCount() {
    selectedCount.textContent = selectedItems.size;
}

cancelSelectBtn.addEventListener('click', exitSelectMode);

// ---------- Bulk Delete ----------
bulkDeleteBtn.addEventListener('click', () => {
    if (selectedItems.size === 0) return;
    deleteCountSpan.textContent = selectedItems.size;
    deleteConfirmModal.classList.add('show');
});

cancelDelete.addEventListener('click', () => deleteConfirmModal.classList.remove('show'));

confirmDelete.addEventListener('click', async () => {
    if (selectedItems.size === 0) return;
    showToast('Deleting...');
    try {
        const batch = db.batch();
        selectedItems.forEach(itemId => {
            batch.delete(db.collection('items').doc(itemId));
        });
        await batch.commit();
        deleteConfirmModal.classList.remove('show');
        exitSelectMode();
        loadItems();
        showToast('Items deleted');
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Error deleting items');
    }
});

// ---------- Bulk Delivery ----------
bulkDeliveryBtn.addEventListener('click', () => {
    if (selectedItems.size === 0) return;
    bulkDeliveryModal.classList.add('show');
    selectedUserIds.clear();
    renderUserList(bulkDeliveryUserList, bulkDeliveryUserSearch, selectedUserIds);
});

bulkDeliveryTarget.addEventListener('change', () => {
    bulkDeliveryUserGroup.style.display = bulkDeliveryTarget.value === 'selected' ? 'block' : 'none';
});

cancelBulkDelivery.addEventListener('click', () => {
    bulkDeliveryModal.classList.remove('show');
    selectedUserIds.clear();
});

applyBulkDelivery.addEventListener('click', async () => {
    const fee = parseFloat(bulkDeliveryFee.value);
    if (isNaN(fee) || fee < 0) return showToast('Enter valid fee');
    const target = bulkDeliveryTarget.value;
    const userIds = target === 'all' ? [] : Array.from(selectedUserIds);
    if (target === 'selected' && userIds.length === 0) return showToast('Select at least one user');

    showToast('Applying delivery fee...');
    try {
        const promises = Array.from(selectedItems).map(async (itemId) => {
            const itemRef = db.collection('items').doc(itemId);
            if (target === 'all') {
                await itemRef.update({ 'delivery.global': fee });
            } else {
                const doc = await itemRef.get();
                const currentFees = doc.data().delivery?.customerFees || [];
                const newFees = [...currentFees];
                userIds.forEach(userId => {
                    const existingIndex = newFees.findIndex(f => f.userId === userId);
                    const user = allUsers.find(u => u.id === userId);
                    const userName = user ? user.name : 'User';
                    if (existingIndex >= 0) {
                        newFees[existingIndex].fee = fee;
                    } else {
                        newFees.push({ userId, userName, fee });
                    }
                });
                await itemRef.update({ 'delivery.customerFees': newFees });
            }
        });
        await Promise.all(promises);
        showToast('Delivery fee applied');
        bulkDeliveryModal.classList.remove('show');
        selectedUserIds.clear();
        exitSelectMode();
        loadItems();
    } catch (error) {
        console.error(error);
        showToast('Error applying delivery fee');
    }
});

// ---------- Bulk Promo ----------
bulkPromoBtn.addEventListener('click', () => {
    if (selectedItems.size === 0) return;
    bulkPromoModal.classList.add('show');
    selectedUserIds.clear();
    renderUserList(bulkPromoUserList, bulkPromoUserSearch, selectedUserIds);
});

bulkPromoTarget.addEventListener('change', () => {
    bulkPromoUserGroup.style.display = bulkPromoTarget.value === 'selected' ? 'block' : 'none';
});

cancelBulkPromo.addEventListener('click', () => {
    bulkPromoModal.classList.remove('show');
    selectedUserIds.clear();
});

applyBulkPromo.addEventListener('click', async () => {
    const code = bulkPromoCode.value.trim().toUpperCase();
    const type = bulkPromoType.value;
    const value = parseFloat(bulkPromoValue.value);
    if (!code || isNaN(value) || value <= 0) return showToast('Enter valid promo');
    const target = bulkPromoTarget.value;
    const userIds = target === 'all' ? [] : Array.from(selectedUserIds);
    if (target === 'selected' && userIds.length === 0) return showToast('Select at least one user');

    showToast('Applying promo code...');
    try {
        const promises = Array.from(selectedItems).map(async (itemId) => {
            const itemRef = db.collection('items').doc(itemId);
            const doc = await itemRef.get();
            const currentPromos = doc.data().promoCodes || [];
            const newPromos = [...currentPromos];
            if (target === 'all') {
                // For "all users", we don't store per-user promos; maybe a global promo? For simplicity, we'll ignore.
                showToast('Global promo not implemented – use per‑user');
                return;
            } else {
                userIds.forEach(userId => {
                    const existingIndex = newPromos.findIndex(p => p.userId === userId && p.code === code);
                    const user = allUsers.find(u => u.id === userId);
                    const userName = user ? user.name : 'User';
                    if (existingIndex >= 0) {
                        newPromos[existingIndex].value = value;
                        newPromos[existingIndex].type = type;
                    } else {
                        newPromos.push({ userId, userName, code, type, value });
                    }
                });
            }
            await itemRef.update({ promoCodes: newPromos });
        });
        await Promise.all(promises);
        showToast('Promo code applied');
        bulkPromoModal.classList.remove('show');
        selectedUserIds.clear();
        exitSelectMode();
        loadItems();
    } catch (error) {
        console.error(error);
        showToast('Error applying promo');
    }
});

// ---------- User List Rendering ----------
function renderUserList(container, searchInput, selectedSet) {
    const filterUsers = () => {
        const term = searchInput.value.toLowerCase();
        const filtered = allUsers.filter(u => 
            (u.name && u.name.toLowerCase().includes(term)) ||
            (u.phone && u.phone.toLowerCase().includes(term))
        );
        container.innerHTML = filtered.map(user => {
            const checked = selectedSet.has(user.id) ? 'checked' : '';
            return `
                <div class="user-item" data-user-id="${user.id}">
                    <input type="checkbox" ${checked}>
                    <span>${escapeHtml(user.name || 'User')} (${escapeHtml(user.phone || '')})</span>
                </div>
            `;
        }).join('');

        container.querySelectorAll('.user-item').forEach(item => {
            const userId = item.dataset.userId;
            const checkbox = item.querySelector('input');
            item.addEventListener('click', (e) => {
                if (e.target !== checkbox) checkbox.click();
            });
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) selectedSet.add(userId);
                else selectedSet.delete(userId);
            });
        });
    };

    searchInput.addEventListener('input', filterUsers);
    filterUsers();
}

// ---------- Edit Modal ----------
window.openEditModal = async function(itemId) {
    currentEditingItemId = itemId;
    const item = allItems.find(i => i.id === itemId);
    if (!item) return;

    const imagesHtml = (item.images || []).map(url => `<img src="${url}" alt="">`).join('');

    const deliveryFeesHtml = (item.delivery?.customerFees || []).map(fee =>
        `<div class="fee-row" data-user="${fee.userId}">
            <span>${escapeHtml(fee.userName || 'User')}: Rs. ${fee.fee}</span>
            <i class="fas fa-trash remove-btn" onclick="removeDeliveryFee('${item.id}', '${fee.userId}')"></i>
        </div>`
    ).join('');

    const globalFee = item.delivery?.global || 350;

    const promosHtml = (item.promoCodes || []).map(p =>
        `<div class="promo-row" data-user="${p.userId}">
            <span>${escapeHtml(p.userName || 'User')}: ${p.code} (${p.type} ${p.value})</span>
            <i class="fas fa-trash remove-btn" onclick="removePromoCode('${item.id}', '${p.userId}')"></i>
        </div>`
    ).join('');

    const formHtml = `
        <form id="editItemForm">
            <div class="edit-image-preview">${imagesHtml}</div>
            <div class="form-group">
                <label>Product Title</label>
                <input type="text" id="editTitle" value="${escapeHtml(item.title || '')}" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Regular Price (LKR)</label>
                    <input type="number" id="editPrice" value="${item.price || 0}" min="0" required>
                </div>
                <div class="form-group">
                    <label>Discount Price</label>
                    <input type="number" id="editDiscount" value="${item.discountPrice || ''}" min="0">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Stock</label>
                    <input type="number" id="editStock" value="${item.available || 0}" min="0">
                </div>
                <div class="form-group">
                    <label>Sold</label>
                    <input type="number" id="editSold" value="${item.sold || 0}" min="0">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Category</label>
                    <input type="text" id="editCategory" value="${escapeHtml(item.category || '')}">
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select id="editStatus">
                        <option value="available" ${item.status === 'available' ? 'selected' : ''}>Available</option>
                        <option value="sold" ${item.status === 'sold' ? 'selected' : ''}>Sold Out</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea id="editDescription" rows="4">${escapeHtml(item.description || '')}</textarea>
            </div>

            <div class="delivery-fees-section">
                <h4><i class="fas fa-truck"></i> Delivery Fees</h4>
                <div class="form-group">
                    <label>Global Fee (LKR)</label>
                    <input type="number" id="editGlobalDelivery" value="${globalFee}" min="0">
                </div>
                <div class="customer-fees-list" id="customerFeesList">${deliveryFeesHtml}</div>
                <button type="button" class="add-fee-btn" onclick="showAddDeliveryModal()"><i class="fas fa-plus"></i> Add Customer Fee</button>
            </div>

            <div class="promo-codes-section">
                <h4><i class="fas fa-tag"></i> Promo Codes</h4>
                <div class="promo-list" id="promoList">${promosHtml}</div>
                <button type="button" class="add-promo-btn" onclick="showAddPromoModal()"><i class="fas fa-plus"></i> Add Promo Code</button>
            </div>

            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button type="submit" class="submit-btn"><i class="fas fa-save"></i> Save Changes</button>
                <button type="button" class="reset-btn" onclick="closeEditModal.click()">Cancel</button>
            </div>
        </form>
    `;

    editModalBody.innerHTML = formHtml;
    editModal.classList.add('show');

    document.getElementById('editItemForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveItem(item.id);
    });
};

async function saveItem(itemId) {
    const updatedData = {
        title: document.getElementById('editTitle').value.trim(),
        price: parseFloat(document.getElementById('editPrice').value),
        discountPrice: document.getElementById('editDiscount').value ? parseFloat(document.getElementById('editDiscount').value) : null,
        available: parseInt(document.getElementById('editStock').value) || 0,
        sold: parseInt(document.getElementById('editSold').value) || 0,
        category: document.getElementById('editCategory').value.trim(),
        status: document.getElementById('editStatus').value,
        description: document.getElementById('editDescription').value.trim(),
        delivery: {
            global: parseFloat(document.getElementById('editGlobalDelivery').value) || 350,
        }
    };

    try {
        await db.collection('items').doc(itemId).update(updatedData);
        showToast('Item updated');
        editModal.classList.remove('show');
        loadItems();
    } catch (error) {
        console.error(error);
        showToast('Update failed');
    }
}

// ---------- Add Delivery Fee (from edit modal) ----------
window.showAddDeliveryModal = function() {
    if (!currentEditingItemId) return;
    deliveryFeeInput.value = '';
    selectedUserIds.clear();
    renderUserList(deliveryUserList, deliveryUserSearch, selectedUserIds);
    addDeliveryModal.classList.add('show');
};

cancelAddDelivery.addEventListener('click', () => {
    addDeliveryModal.classList.remove('show');
    selectedUserIds.clear();
});

saveAddDelivery.addEventListener('click', async () => {
    const userIds = Array.from(selectedUserIds);
    const fee = parseFloat(deliveryFeeInput.value);
    if (userIds.length === 0 || isNaN(fee) || fee < 0) {
        showToast('Select at least one user and enter valid fee');
        return;
    }

    try {
        const itemRef = db.collection('items').doc(currentEditingItemId);
        const doc = await itemRef.get();
        const currentFees = doc.data().delivery?.customerFees || [];
        const newFees = [...currentFees];
        userIds.forEach(userId => {
            const existingIndex = newFees.findIndex(f => f.userId === userId);
            const user = allUsers.find(u => u.id === userId);
            const userName = user ? user.name : 'User';
            if (existingIndex >= 0) {
                newFees[existingIndex].fee = fee;
            } else {
                newFees.push({ userId, userName, fee });
            }
        });
        await itemRef.update({ 'delivery.customerFees': newFees });
        showToast('Delivery fee added');
        addDeliveryModal.classList.remove('show');
        openEditModal(currentEditingItemId); // refresh modal
    } catch (error) {
        console.error(error);
        showToast('Error adding fee');
    }
});

window.removeDeliveryFee = async function(itemId, userId) {
    try {
        const doc = await db.collection('items').doc(itemId).get();
        const fees = doc.data().delivery?.customerFees || [];
        const newFees = fees.filter(f => f.userId !== userId);
        await db.collection('items').doc(itemId).update({ 'delivery.customerFees': newFees });
        showToast('Removed');
        openEditModal(itemId);
    } catch (error) {
        console.error(error);
        showToast('Error removing fee');
    }
};

// ---------- Add Promo Code (from edit modal) ----------
window.showAddPromoModal = function() {
    if (!currentEditingItemId) return;
    promoCodeInput.value = '';
    promoValueInput.value = '';
    selectedUserIds.clear();
    renderUserList(promoUserList, promoUserSearch, selectedUserIds);
    addPromoModal.classList.add('show');
};

cancelAddPromo.addEventListener('click', () => {
    addPromoModal.classList.remove('show');
    selectedUserIds.clear();
});

saveAddPromo.addEventListener('click', async () => {
    const userIds = Array.from(selectedUserIds);
    const code = promoCodeInput.value.trim().toUpperCase();
    const type = promoTypeSelect.value;
    const value = parseFloat(promoValueInput.value);
    if (userIds.length === 0 || !code || isNaN(value) || value <= 0) {
        showToast('Select user(s), enter code and valid value');
        return;
    }

    try {
        const itemRef = db.collection('items').doc(currentEditingItemId);
        const doc = await itemRef.get();
        const currentPromos = doc.data().promoCodes || [];
        const newPromos = [...currentPromos];
        userIds.forEach(userId => {
            const existingIndex = newPromos.findIndex(p => p.userId === userId && p.code === code);
            const user = allUsers.find(u => u.id === userId);
            const userName = user ? user.name : 'User';
            if (existingIndex >= 0) {
                newPromos[existingIndex].value = value;
                newPromos[existingIndex].type = type;
            } else {
                newPromos.push({ userId, userName, code, type, value });
            }
        });
        await itemRef.update({ promoCodes: newPromos });
        showToast('Promo code added');
        addPromoModal.classList.remove('show');
        openEditModal(currentEditingItemId);
    } catch (error) {
        console.error(error);
        showToast('Error adding promo');
    }
});

window.removePromoCode = async function(itemId, userId) {
    try {
        const doc = await db.collection('items').doc(itemId).get();
        const promos = doc.data().promoCodes || [];
        const newPromos = promos.filter(p => p.userId !== userId);
        await db.collection('items').doc(itemId).update({ promoCodes: newPromos });
        showToast('Removed');
        openEditModal(itemId);
    } catch (error) {
        console.error(error);
        showToast('Error removing promo');
    }
};

// ---------- Event Listeners ----------
function setupEventListeners() {
    backBtn.addEventListener('click', () => window.location.href = 'index.html');
    refreshBtn.addEventListener('click', loadItems);

    searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value;
        clearSearch.style.display = searchTerm ? 'block' : 'none';
        applyFilters();
    });
    clearSearch.addEventListener('click', () => {
        searchInput.value = '';
        searchTerm = '';
        clearSearch.style.display = 'none';
        applyFilters();
    });

    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.filter;
            applyFilters();
        });
    });

    closeEditModal.addEventListener('click', () => editModal.classList.remove('show'));
    closeEditModalBtn.addEventListener('click', () => editModal.classList.remove('show'));

    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.dataset.page;
            if (page) window.location.href = page;
        });
    });
}

function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}



// In your show-items.js, when editing item
async function updateDeliveryFee(itemId, newGlobalFee) {
    try {
        await db.collection('items').doc(itemId).update({
            'delivery.global': newGlobalFee
        });
        showToast('Delivery fee updated');
        loadItems();
    } catch (error) {
        console.error('Error updating fee:', error);
        showToast('Error updating fee');
    }
}

async function addCustomerFee(itemId, userId, fee) {
    try {
        const itemRef = db.collection('items').doc(itemId);
        const doc = await itemRef.get();
        const currentFees = doc.data().delivery?.customerFees || [];
        
        // Add or update
        const existingIndex = currentFees.findIndex(f => f.userId === userId);
        if (existingIndex >= 0) {
            currentFees[existingIndex].fee = fee;
        } else {
            currentFees.push({ userId, fee });
        }
        
        await itemRef.update({
            'delivery.customerFees': currentFees
        });
        showToast('Customer fee added');
    } catch (error) {
        console.error('Error adding customer fee:', error);
        showToast('Error adding fee');
    }
}