// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDuU-1WguuPfKh6hTTvd7BzHeBNJanSNiI",
    authDomain: "capital-e817c.firebaseapp.com",
    projectId: "capital-e817c",
    storageBucket: "capital-e817c.firebasestorage.app",
    messagingSenderId: "733831738797",
    appId: "1:733831738797:web:d945b8f3c7a34146e35d24"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

console.log('🚀 COD Management page loaded');

// DOM Elements
const loading = document.getElementById('loading');
const mainContent = document.getElementById('mainContent');
const backBtn = document.getElementById('backBtn');
const homeIcon = document.getElementById('homeIcon');
const searchPhone = document.getElementById('searchPhone');
const searchBtn = document.getElementById('searchBtn');
const searchResult = document.getElementById('searchResult');
const userSelect = document.getElementById('userSelect');
const userPhone = document.getElementById('userPhone');
const userName = document.getElementById('userName');
const codLimit = document.getElementById('codLimit');
const userStatus = document.getElementById('userStatus');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const deleteBtn = document.getElementById('deleteBtn');
const totalUsersEl = document.getElementById('totalUsers');
const activeUsersEl = document.getElementById('activeUsers');
const codUsersList = document.getElementById('codUsersList');

// Modal Elements
const confirmModal = document.getElementById('confirmModal');
const confirmMessage = document.getElementById('confirmMessage');
const cancelConfirmBtn = document.getElementById('cancelConfirmBtn');
const confirmActionBtn = document.getElementById('confirmActionBtn');
const successModal = document.getElementById('successModal');
const successMessage = document.getElementById('successMessage');
const closeSuccessBtn = document.getElementById('closeSuccessBtn');

// Toast
const toast = document.getElementById('toast');

// State
let allUsers = []; // All registered users from Firebase
let codUsers = []; // Users eligible for COD
let selectedUserId = null;
let pendingAction = null;

// ========== Initialize ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing COD Management...');
    loadAllUsers();
    loadCODUsers();
    setupEventListeners();

    setTimeout(() => {
        loading.classList.add('hide');
    }, 2000);
});

// ========== Load All Users from Firebase ==========
async function loadAllUsers() {
    console.log('Loading all users...');
    try {
        const usersSnapshot = await db.collection('users').get();
        allUsers = [];
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            allUsers.push({
                id: doc.id,
                ...userData
            });
        });
        
        console.log('Users loaded:', allUsers.length);
        populateUserSelect();
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('Error loading users');
    }
}

// ========== Populate User Select Dropdown ==========
function populateUserSelect() {
    if (!userSelect) return;
    
    userSelect.innerHTML = '<option value="">-- Select a user --</option>';
    
    allUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        const phone = user.phone || '';
        const name = user.name || 'Unknown';
        option.textContent = `${name} (+94 ${phone})`;
        userSelect.appendChild(option);
    });
}

// ========== Load COD Eligible Users ==========
async function loadCODUsers() {
    console.log('Loading COD eligible users...');
    try {
        const codSnapshot = await db.collection('codEligibleUsers').get();
        codUsers = [];
        codSnapshot.forEach(doc => {
            codUsers.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log('COD users loaded:', codUsers.length);
        updateStats();
        renderCODUsersTable();
    } catch (error) {
        console.error('Error loading COD users:', error);
        showToast('Error loading COD users');
    }
}

// ========== Update Statistics ==========
function updateStats() {
    const total = codUsers.length;
    const active = codUsers.filter(user => user.status === 'active').length;
    
    totalUsersEl.textContent = total;
    activeUsersEl.textContent = active;
}

// ========== Render COD Users Table ==========
function renderCODUsersTable() {
    if (!codUsersList) return;
    
    if (codUsers.length === 0) {
        codUsersList.innerHTML = '<tr><td colspan="5" class="text-center">No COD eligible users found</td></tr>';
        return;
    }
    
    let html = '';
    codUsers.forEach(user => {
        const userInfo = allUsers.find(u => u.id === user.userId) || {};
        const phone = userInfo.phone || user.phone || 'N/A';
        const name = userInfo.name || user.userName || 'Unknown';
        const statusClass = user.status === 'active' ? 'status-active' : 'status-inactive';
        const statusText = user.status === 'active' ? 'Active' : 'Inactive';
        
        html += `
            <tr data-userid="${user.userId}">
                <td>+94 ${phone}</td>
                <td>${escapeHtml(name)}</td>
                <td>Rs. ${Number(user.limitPrice).toLocaleString('en-LK')}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="action-btn edit-btn" onclick="editCODUser('${user.userId}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteCODUser('${user.userId}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `;
    });
    
    codUsersList.innerHTML = html;
}

// ========== Search User by Mobile Number ==========
async function searchUserByPhone() {
    const phone = searchPhone.value.trim();
    
    if (!phone) {
        showSearchResult('Please enter a mobile number', 'error');
        return;
    }
    
    if (!/^[0-9]{9}$/.test(phone)) {
        showSearchResult('Please enter a valid 9-digit mobile number', 'error');
        return;
    }
    
    // Search in allUsers
    const foundUser = allUsers.find(user => user.phone === phone);
    
    if (!foundUser) {
        showSearchResult(`No user found with mobile number +94 ${phone}`, 'error');
        return;
    }
    
    // Check if user is already COD eligible
    const existingCOD = codUsers.find(cod => cod.userId === foundUser.id);
    
    if (existingCOD) {
        showSearchResult(`User found: ${foundUser.name} (Already COD eligible - Limit: Rs. ${existingCOD.limitPrice})`, 'info');
        // Auto-fill the form
        fillUserForm(foundUser.id, foundUser);
    } else {
        showSearchResult(`User found: ${foundUser.name}. You can add this user to COD eligible list.`, 'success');
        // Auto-fill the form
        fillUserForm(foundUser.id, foundUser);
    }
}

// ========== Show Search Result ==========
function showSearchResult(message, type) {
    searchResult.textContent = message;
    searchResult.className = `search-result show ${type}`;
    
    setTimeout(() => {
        searchResult.classList.remove('show');
    }, 5000);
}

// ========== Fill User Form ==========
function fillUserForm(userId, user) {
    selectedUserId = userId;
    userPhone.value = user.phone || '';
    userName.value = user.name || '';
    
    // Check if user already has COD settings
    const existingCOD = codUsers.find(cod => cod.userId === userId);
    
    if (existingCOD) {
        codLimit.value = existingCOD.limitPrice;
        userStatus.value = existingCOD.status;
        deleteBtn.style.display = 'inline-flex';
    } else {
        codLimit.value = '';
        userStatus.value = 'active';
        deleteBtn.style.display = 'none';
    }
    
    // Scroll to form
    document.querySelector('.user-management-section').scrollIntoView({ behavior: 'smooth' });
}

// ========== User Select Change Handler ==========
function onUserSelect() {
    const userId = userSelect.value;
    if (!userId) {
        clearForm();
        return;
    }
    
    const user = allUsers.find(u => u.id === userId);
    if (user) {
        fillUserForm(userId, user);
    }
}

// ========== Clear Form ==========
function clearForm() {
    selectedUserId = null;
    userSelect.value = '';
    userPhone.value = '';
    userName.value = '';
    codLimit.value = '';
    userStatus.value = 'active';
    deleteBtn.style.display = 'none';
    searchPhone.value = '';
    searchResult.classList.remove('show');
}

// ========== Save COD User ==========
function saveCODUser() {
    if (!selectedUserId) {
        showToast('Please select a user first');
        return;
    }
    
    const limitPrice = parseFloat(codLimit.value);
    if (!limitPrice || limitPrice <= 0) {
        showToast('Please enter a valid limit price');
        return;
    }
    
    const user = allUsers.find(u => u.id === selectedUserId);
    if (!user) {
        showToast('User not found');
        return;
    }
    
    const existingCOD = codUsers.find(cod => cod.userId === selectedUserId);
    const action = existingCOD ? 'update' : 'add';
    const message = existingCOD 
        ? `Are you sure you want to update COD settings for ${user.name}?`
        : `Are you sure you want to add ${user.name} to COD eligible users?`;
    
    pendingAction = { type: action, userId: selectedUserId, userData: user, limitPrice, status: userStatus.value };
    confirmMessage.textContent = message;
    confirmModal.classList.add('show');
}

// ========== Confirm Save Action ==========
async function confirmSave() {
    if (!pendingAction) return;
    
    confirmModal.classList.remove('show');
    
    try {
        const { type, userId, userData, limitPrice, status } = pendingAction;
        
        if (type === 'add') {
            // Add new COD user
            await db.collection('codEligibleUsers').doc(userId).set({
                userId: userId,
                userName: userData.name,
                phone: userData.phone,
                limitPrice: limitPrice,
                status: status,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            successMessage.textContent = `${userData.name} has been added to COD eligible list!`;
        } else {
            // Update existing COD user
            await db.collection('codEligibleUsers').doc(userId).update({
                limitPrice: limitPrice,
                status: status,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            successMessage.textContent = `COD settings for ${userData.name} have been updated!`;
        }
        
        // Reload data
        await loadCODUsers();
        showSuccessModal();
        clearForm();
        
    } catch (error) {
        console.error('Error saving COD user:', error);
        showToast('Error saving: ' + error.message);
    } finally {
        pendingAction = null;
    }
}

// ========== Delete COD User ==========
function deleteCODUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    
    pendingAction = { type: 'delete', userId: userId, userData: user };
    confirmMessage.textContent = `Are you sure you want to remove ${user.name} from COD eligible list?`;
    confirmModal.classList.add('show');
}

// ========== Confirm Delete Action ==========
async function confirmDelete() {
    if (!pendingAction || pendingAction.type !== 'delete') return;
    
    confirmModal.classList.remove('show');
    
    try {
        const { userId, userData } = pendingAction;
        await db.collection('codEligibleUsers').doc(userId).delete();
        
        successMessage.textContent = `${userData.name} has been removed from COD eligible list!`;
        await loadCODUsers();
        showSuccessModal();
        clearForm();
        
    } catch (error) {
        console.error('Error deleting COD user:', error);
        showToast('Error deleting: ' + error.message);
    } finally {
        pendingAction = null;
    }
}

// ========== Edit COD User (from table) ==========
window.editCODUser = function(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (user) {
        fillUserForm(userId, user);
        // Set select dropdown
        userSelect.value = userId;
        // Scroll to form
        document.querySelector('.user-management-section').scrollIntoView({ behavior: 'smooth' });
    }
};

// ========== Show Success Modal ==========
function showSuccessModal() {
    successModal.classList.add('show');
}

// ========== Show Toast ==========
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ========== Escape HTML ==========
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ========== Setup Event Listeners ==========
function setupEventListeners() {
    backBtn?.addEventListener('click', () => window.location.href = 'admin-dashboard.html');
    homeIcon?.addEventListener('click', () => window.location.href = 'index.html');
    
    searchBtn?.addEventListener('click', searchUserByPhone);
    searchPhone?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchUserByPhone();
    });
    
    userSelect?.addEventListener('change', onUserSelect);
    
    saveBtn?.addEventListener('click', saveCODUser);
    clearBtn?.addEventListener('click', clearForm);
    deleteBtn?.addEventListener('click', () => {
        if (selectedUserId) {
            deleteCODUser(selectedUserId);
        }
    });
    
    // Modal buttons
    cancelConfirmBtn?.addEventListener('click', () => {
        confirmModal.classList.remove('show');
        pendingAction = null;
    });
    
    confirmActionBtn?.addEventListener('click', () => {
        if (pendingAction?.type === 'delete') {
            confirmDelete();
        } else {
            confirmSave();
        }
    });
    
    closeSuccessBtn?.addEventListener('click', () => {
        successModal.classList.remove('show');
    });
    
    successModal?.addEventListener('click', (e) => {
        if (e.target === successModal) successModal.classList.remove('show');
    });
    
    confirmModal?.addEventListener('click', (e) => {
        if (e.target === confirmModal) {
            confirmModal.classList.remove('show');
            pendingAction = null;
        }
    });
    
    // Phone input formatting
    searchPhone?.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '');
    });
}