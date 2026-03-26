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
const totalUsers = document.getElementById('totalUsers');
const activeUsers = document.getElementById('activeUsers');
const pendingUsers = document.getElementById('pendingUsers');
const usersList = document.getElementById('usersList');
const noUsers = document.getElementById('noUsers');
const navItems = document.querySelectorAll('.nav-item');

const editModal = document.getElementById('editModal');
const closeEditModal = document.getElementById('closeEditModal');
const closeEditModalBtn = document.getElementById('closeEditModalBtn');
const editModalBody = document.getElementById('editModalBody');

const toast = document.getElementById('toast');

// State
let allUsers = [];
let filteredUsers = [];
let currentFilter = 'all';
let searchTerm = '';
let currentUser = null;

// ---------- Init ----------
setTimeout(() => {
    loading.classList.add('hide');
    mainContent.style.display = 'block';
}, 2000);

document.addEventListener('DOMContentLoaded', () => {
    checkAdminLogin();
    loadLogo();
    loadUsers();
    setupEventListeners();
});

function checkAdminLogin() {
    const admin = localStorage.getItem('currentAdmin');
    if (!admin) window.location.href = 'index.html';
}

async function loadLogo() {
    try {
        const url = await storage.ref('logo/logo.png').getDownloadURL();
        adminLogo.src = url;
    } catch {
        adminLogo.src = '/admin/IMG_20260313_225034.png';
    }
}

async function loadUsers() {
    try {
        const snapshot = await db.collection('users').orderBy('registeredAt', 'desc').get();
        allUsers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            registeredAt: doc.data().registeredAt?.toDate() || null,
            lastLogin: doc.data().lastLogin?.toDate() || null
        }));
        applyFilters();
        updateStats();
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('Error loading users');
    }
}

function applyFilters() {
    // Start with all users
    let filtered = allUsers;

    // Apply status filter
    if (currentFilter === 'pending') {
        filtered = filtered.filter(u => u.status === 'pending');
    } else if (currentFilter === 'active') {
        filtered = filtered.filter(u => u.status === 'active');
    }

    // Apply search term
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(u =>
            (u.name && u.name.toLowerCase().includes(term)) ||
            (u.phone && u.phone.includes(term))
        );
    }

    filteredUsers = filtered;
    renderUsers();
}

function updateStats() {
    totalUsers.textContent = allUsers.length;
    activeUsers.textContent = allUsers.filter(u => u.status === 'active').length;
    pendingUsers.textContent = allUsers.filter(u => u.status === 'pending').length;
}

function renderUsers() {
    if (filteredUsers.length === 0) {
        noUsers.classList.add('show');
        usersList.innerHTML = '';
        return;
    }
    noUsers.classList.remove('show');

    let html = '';
    filteredUsers.forEach(user => {
        const statusClass = user.status === 'active' ? 'status-active' : 'status-pending';
        const statusText = user.status === 'active' ? 'ACTIVE' : 'PENDING';
        const regDate = user.registeredAt ? user.registeredAt.toLocaleDateString() : 'N/A';
        const lastLogin = user.lastLogin ? user.lastLogin.toLocaleString() : 'Never';

        html += `
            <div class="user-card" data-id="${user.id}">
                <div class="user-avatar"><i class="fas fa-user-circle"></i></div>
                <div class="user-info">
                    <div class="user-name">${escapeHtml(user.name || 'No name')}</div>
                    <div class="user-phone">${escapeHtml(user.phone || 'No phone')}</div>
                    <div class="user-meta">
                        <span class="user-status ${statusClass}">${statusText}</span>
                        <span><i class="far fa-calendar-alt"></i> ${regDate}</span>
                        <span><i class="fas fa-sign-in-alt"></i> ${lastLogin}</span>
                    </div>
                </div>
            </div>
        `;
    });
    usersList.innerHTML = html;

    // Add click listeners to cards
    document.querySelectorAll('.user-card').forEach(card => {
        card.addEventListener('click', () => {
            const userId = card.dataset.id;
            const user = allUsers.find(u => u.id === userId);
            if (user) openEditModal(user);
        });
    });
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

// ---------- Edit Modal ----------
function openEditModal(user) {
    currentUser = user;

    const regDate = user.registeredAt ? user.registeredAt.toLocaleString() : 'N/A';
    const lastLogin = user.lastLogin ? user.lastLogin.toLocaleString() : 'Never';

    const formHtml = `
        <form id="editUserForm">
            <div class="form-group">
                <label>User ID (read only)</label>
                <input type="text" class="readonly-field" value="${escapeHtml(user.id)}" readonly>
            </div>
            <div class="form-group">
                <label>Name</label>
                <input type="text" id="editName" value="${escapeHtml(user.name || '')}" required>
            </div>
            <div class="form-group">
                <label>Phone</label>
                <input type="text" id="editPhone" value="${escapeHtml(user.phone || '')}" required>
            </div>
            <div class="form-group">
                <label>Status</label>
                <select id="editStatus">
                    <option value="pending" ${user.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
                </select>
            </div>
            <div class="form-group">
                <label>Registered At</label>
                <input type="text" class="readonly-field" value="${regDate}" readonly>
            </div>
            <div class="form-group">
                <label>Last Login</label>
                <input type="text" class="readonly-field" value="${lastLogin}" readonly>
            </div>
            <div class="modal-actions">
                <button type="submit" class="submit-btn"><i class="fas fa-save"></i> Save</button>
                <button type="button" class="reset-btn" onclick="closeEditModal.click()">Cancel</button>
            </div>
        </form>
    `;

    editModalBody.innerHTML = formHtml;
    editModal.classList.add('show');

    document.getElementById('editUserForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveUser(user.id);
    });
}

async function saveUser(userId) {
    const name = document.getElementById('editName').value.trim();
    const phone = document.getElementById('editPhone').value.trim();
    const status = document.getElementById('editStatus').value;

    if (!name || !phone) {
        showToast('Name and phone are required');
        return;
    }

    try {
        await db.collection('users').doc(userId).update({
            name,
            phone,
            status,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showToast('User updated');
        editModal.classList.remove('show');
        loadUsers(); // refresh list
    } catch (error) {
        console.error('Update error:', error);
        showToast('Update failed');
    }
}

// ---------- Event Listeners ----------
function setupEventListeners() {
    backBtn.addEventListener('click', () => window.location.href = 'index.html');
    refreshBtn.addEventListener('click', loadUsers);

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