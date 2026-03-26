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
const navItems = document.querySelectorAll('.nav-item');

// Form Elements
const alertTypeRadios = document.querySelectorAll('input[name="alertType"]');
const alertTitle = document.getElementById('alertTitle');
const alertMessage = document.getElementById('alertMessage');
const alertLink = document.getElementById('alertLink');
const linkGroup = document.getElementById('linkGroup');
const imageGroup = document.getElementById('imageGroup');
const imageUploadArea = document.getElementById('imageUploadArea');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const targetSelect = document.getElementById('targetSelect');
const userSelection = document.getElementById('userSelection');
const usersList = document.getElementById('usersList');
const sendAlertBtn = document.getElementById('sendAlertBtn');
const alertsListDiv = document.getElementById('alertsList');

// Edit Modal
const editModal = document.getElementById('editModal');
const closeEditModal = document.getElementById('closeEditModal');
const closeEditModalBtn = document.getElementById('closeEditModalBtn');
const editModalBody = document.getElementById('editModalBody');

// Toast
const toast = document.getElementById('toast');

// Global variables
let currentAdmin = null;
let allUsers = [];
let filteredUsers = [];
let selectedImageBase64 = null;
let editingAlertId = null;

// ---------- Init ----------
setTimeout(() => {
    loading.classList.add('hide');
    mainContent.style.display = 'block';
}, 2000);

document.addEventListener('DOMContentLoaded', function() {
    checkAdminLogin();
    loadLogo();
    loadUsers();
    loadAlerts();
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
        adminLogo.src = '/admin/IMG_20260313_225034.png';
    }
}

async function loadUsers() {
    try {
        const snapshot = await db.collection('users').get();
        allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        filteredUsers = [...allUsers]; // Initially show all users
        renderUserList();
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// ========== Render User List with Search ==========
function renderUserList() {
    if (allUsers.length === 0) {
        usersList.innerHTML = '<p>No users found</p>';
        return;
    }

    // Create search input
    const searchHtml = `
        <div style="margin-bottom: 15px;">
            <input type="text" id="userSearchInput" placeholder="Search by phone number..." style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px;">
        </div>
        <div id="userCheckboxes"></div>
    `;
    usersList.innerHTML = searchHtml;

    const searchInput = document.getElementById('userSearchInput');
    const checkboxesContainer = document.getElementById('userCheckboxes');

    // Function to render checkboxes based on filtered users
    function renderCheckboxes(users) {
        let html = '';
        users.forEach(user => {
            const value = user.phone || user.id;
            html += `
                <div style="margin-bottom: 8px;">
                    <label style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" class="user-checkbox" value="${value}">
                        <span>${user.name || 'Unknown'} (${user.phone || 'No phone'})</span>
                    </label>
                </div>
            `;
        });
        checkboxesContainer.innerHTML = html;
    }

    // Initial render
    renderCheckboxes(filteredUsers);

    // Search functionality
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.trim().toLowerCase();
        if (searchTerm === '') {
            filteredUsers = [...allUsers];
        } else {
            filteredUsers = allUsers.filter(user => 
                (user.phone && user.phone.toLowerCase().includes(searchTerm))
            );
        }
        renderCheckboxes(filteredUsers);
    });
}

function setupEventListeners() {
    backBtn.addEventListener('click', () => window.location.href = 'index.html');
    refreshBtn.addEventListener('click', loadAlerts);

    alertTypeRadios.forEach(radio => {
        radio.addEventListener('change', handleAlertTypeChange);
    });

    targetSelect.addEventListener('change', () => {
        userSelection.style.display = targetSelect.value === 'specific' ? 'block' : 'none';
        if (targetSelect.value === 'specific') {
            // Reset filter when showing user selection
            filteredUsers = [...allUsers];
            renderUserList();
        }
    });

    imageUploadArea.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', handleImageUpload);

    sendAlertBtn.addEventListener('click', sendAlert);

    closeEditModal.addEventListener('click', () => editModal.classList.remove('show'));
    closeEditModalBtn.addEventListener('click', () => editModal.classList.remove('show'));
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) editModal.classList.remove('show');
    });

    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.dataset.page;
            if (page) window.location.href = page;
        });
    });
}

function handleAlertTypeChange() {
    const type = document.querySelector('input[name="alertType"]:checked').value;
    linkGroup.style.display = (type === 'offer' || type === 'banner') ? 'block' : 'none';
    imageGroup.style.display = (type === 'banner') ? 'block' : 'none';
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        showToast('Please select an image');
        return;
    }
    if (file.size > 500 * 1024) {
        showToast('Image too large (max 500KB)');
        return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
        selectedImageBase64 = event.target.result;
        imagePreview.src = selectedImageBase64;
        imagePreview.classList.add('show');
    };
    reader.readAsDataURL(file);
}

async function sendAlert() {
    const type = document.querySelector('input[name="alertType"]:checked').value;
    const title = alertTitle.value.trim();
    const message = alertMessage.value.trim();
    const link = alertLink.value.trim();
    const target = targetSelect.value;
    let deliveredTo = [];

    if (!title || !message) {
        showToast('Please enter title and message');
        return;
    }
    if ((type === 'offer' || type === 'banner') && !link) {
        showToast('Please enter a link');
        return;
    }
    if (type === 'banner' && !selectedImageBase64) {
        showToast('Please upload an image');
        return;
    }
    if (target === 'specific') {
        const checkboxes = document.querySelectorAll('.user-checkbox:checked');
        if (checkboxes.length === 0) {
            showToast('Please select at least one user');
            return;
        }
        checkboxes.forEach(cb => deliveredTo.push(cb.value));
    }

    const alertData = {
        type: type,
        title: title,
        message: message,
        time: new Date().toISOString(),
        forPhone: target === 'all' ? 'all' : null,
        deliveredTo: target === 'specific' ? deliveredTo : [],
        readBy: [],
        deleted: false
    };
    if (link) alertData.link = link;
    if (selectedImageBase64) alertData.image = selectedImageBase64;

    sendAlertBtn.disabled = true;
    sendAlertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    try {
        await db.collection('alerts').add(alertData);
        showToast('Alert sent successfully');
        // Reset form
        alertTitle.value = '';
        alertMessage.value = '';
        alertLink.value = '';
        selectedImageBase64 = null;
        imagePreview.src = '#';
        imagePreview.classList.remove('show');
        imageInput.value = '';
        targetSelect.value = 'all';
        userSelection.style.display = 'none';
        // Reset user filter and checkboxes
        filteredUsers = [...allUsers];
        renderUserList();
        loadAlerts();
    } catch (error) {
        console.error('Error sending alert:', error);
        showToast('Failed to send alert');
    } finally {
        sendAlertBtn.disabled = false;
        sendAlertBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Alert';
    }
}

function loadAlerts() {
    db.collection('alerts')
        .get()
        .then((snapshot) => {
            const alerts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().time ? new Date(doc.data().time) : new Date()
            }));
            alerts.sort((a, b) => b.timestamp - a.timestamp);
            renderAlerts(alerts);
        })
        .catch((error) => {
            console.error('Error loading alerts:', error);
            alertsListDiv.innerHTML = `<div class="no-alerts">Error loading alerts: ${error.message}</div>`;
        });
}

function renderAlerts(alerts) {
    if (alerts.length === 0) {
        alertsListDiv.innerHTML = '<div class="no-alerts">No alerts sent yet</div>';
        return;
    }

    let html = '';
    alerts.forEach(alert => {
        let iconClass = 'message';
        let icon = 'fas fa-envelope';
        if (alert.type === 'offer') {
            iconClass = 'offer';
            icon = 'fas fa-tag';
        } else if (alert.type === 'banner') {
            iconClass = 'banner';
            icon = 'fas fa-image';
        }

        const sentTime = alert.timestamp.toLocaleString();
        const targetText = alert.forPhone === 'all' ? 'All Users' : `${alert.deliveredTo?.length || 0} user(s)`;

        html += `
            <div class="alert-card" data-id="${alert.id}">
                <div class="alert-icon ${iconClass}">
                    <i class="${icon}"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-title">${escapeHtml(alert.title)}</div>
                    <div class="alert-message">${escapeHtml(alert.message)}</div>
                    <div class="alert-meta">
                        <span><i class="far fa-clock"></i> ${sentTime}</span>
                        <span><i class="fas fa-users"></i> ${targetText}</span>
                        ${alert.link ? '<span><i class="fas fa-link"></i> Has link</span>' : ''}
                        ${alert.image ? '<span><i class="fas fa-image"></i> Has image</span>' : ''}
                    </div>
                </div>
                <div class="alert-actions">
                    <button class="action-btn edit" onclick="openEditModal('${alert.id}')"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" onclick="deleteAlert('${alert.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    });
    alertsListDiv.innerHTML = html;
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

// ========== EDIT MODAL ==========
window.openEditModal = async function(alertId) {
    editingAlertId = alertId;
    try {
        const doc = await db.collection('alerts').doc(alertId).get();
        if (!doc.exists) {
            showToast('Alert not found');
            return;
        }
        const alert = doc.data();

        // Build form with current values
        const typeChecked = {
            message: alert.type === 'message' ? 'checked' : '',
            offer: alert.type === 'offer' ? 'checked' : '',
            banner: alert.type === 'banner' ? 'checked' : ''
        };
        const linkValue = alert.link || '';
        const imagePreviewHtml = alert.image ? `<img src="${alert.image}" class="image-preview show" style="width:100px;height:100px;object-fit:cover;">` : '';

        // User checkboxes (pre-select if deliveredTo contains phone)
        let userCheckboxes = '';
        allUsers.forEach(user => {
            const userPhone = user.phone || user.id;
            const checked = alert.deliveredTo && alert.deliveredTo.includes(userPhone) ? 'checked' : '';
            userCheckboxes += `
                <div style="margin-bottom: 8px;">
                    <label style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" class="edit-user-checkbox" value="${userPhone}" ${checked}>
                        <span>${user.name || 'User'} (${user.phone || ''})</span>
                    </label>
                </div>
            `;
        });

        const formHtml = `
            <div class="edit-form">
                <div class="radio-group">
                    <label class="radio-label"><input type="radio" name="editAlertType" value="message" ${typeChecked.message}> <i class="fas fa-envelope"></i> Message</label>
                    <label class="radio-label"><input type="radio" name="editAlertType" value="offer" ${typeChecked.offer}> <i class="fas fa-tag"></i> Offer</label>
                    <label class="radio-label"><input type="radio" name="editAlertType" value="banner" ${typeChecked.banner}> <i class="fas fa-image"></i> Banner</label>
                </div>

                <div class="form-group">
                    <label>Title</label>
                    <input type="text" id="editTitle" value="${escapeHtml(alert.title || '')}">
                </div>

                <div class="form-group">
                    <label>Message</label>
                    <textarea id="editMessage">${escapeHtml(alert.message || '')}</textarea>
                </div>

                <div class="form-group" id="editLinkGroup" style="display: ${alert.type === 'message' ? 'none' : 'block'};">
                    <label>Link URL</label>
                    <input type="url" id="editLink" value="${escapeHtml(linkValue)}">
                </div>

                <div class="form-group" id="editImageGroup" style="display: ${alert.type === 'banner' ? 'block' : 'none'};">
                    <label>Banner Image</label>
                    <div class="image-upload-area" id="editImageUploadArea">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <p>Click to change image</p>
                        <input type="file" id="editImageInput" accept="image/*" style="display: none;">
                    </div>
                    <div id="editImagePreview">${imagePreviewHtml}</div>
                </div>

                <div class="form-group">
                    <label>Target</label>
                    <select id="editTarget">
                        <option value="all" ${alert.forPhone === 'all' ? 'selected' : ''}>All Users</option>
                        <option value="specific" ${alert.forPhone !== 'all' ? 'selected' : ''}>Specific Users</option>
                    </select>
                </div>

                <div id="editUserSelection" style="display: ${alert.forPhone !== 'all' ? 'block' : 'none'};">
                    <label>Select Users</label>
                    <div class="user-list-container">${userCheckboxes}</div>
                </div>

                <button class="submit-btn" id="updateAlertBtn">Update Alert</button>
                <button class="submit-btn" style="background:#6c757d; margin-top:10px;" onclick="closeEditModal.click()">Cancel</button>
            </div>
        `;

        editModalBody.innerHTML = formHtml;
        editModal.classList.add('show');

        // Attach listeners
        document.querySelectorAll('input[name="editAlertType"]').forEach(r => r.addEventListener('change', handleEditTypeChange));
        document.getElementById('editTarget').addEventListener('change', handleEditTargetChange);
        document.getElementById('editImageUploadArea').addEventListener('click', () => document.getElementById('editImageInput').click());
        document.getElementById('editImageInput').addEventListener('change', handleEditImageUpload);
        document.getElementById('updateAlertBtn').addEventListener('click', () => updateAlert(alertId));

    } catch (error) {
        console.error('Error loading alert for edit:', error);
        showToast('Error loading alert');
    }
};

function handleEditTypeChange() {
    const type = document.querySelector('input[name="editAlertType"]:checked').value;
    document.getElementById('editLinkGroup').style.display = type === 'message' ? 'none' : 'block';
    document.getElementById('editImageGroup').style.display = type === 'banner' ? 'block' : 'none';
}

function handleEditTargetChange() {
    const target = document.getElementById('editTarget').value;
    document.getElementById('editUserSelection').style.display = target === 'specific' ? 'block' : 'none';
}

function handleEditImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Please select an image'); return; }
    if (file.size > 500 * 1024) { showToast('Image too large (max 500KB)'); return; }
    const reader = new FileReader();
    reader.onload = (event) => {
        const previewDiv = document.getElementById('editImagePreview');
        previewDiv.innerHTML = `<img src="${event.target.result}" class="image-preview show" style="width:100px;height:100px;object-fit:cover;">`;
        window.editNewImageBase64 = event.target.result;
    };
    reader.readAsDataURL(file);
}

async function updateAlert(alertId) {
    const type = document.querySelector('input[name="editAlertType"]:checked').value;
    const title = document.getElementById('editTitle').value.trim();
    const message = document.getElementById('editMessage').value.trim();
    const link = document.getElementById('editLink') ? document.getElementById('editLink').value.trim() : '';
    const target = document.getElementById('editTarget').value;
    let deliveredTo = [];

    if (!title || !message) {
        showToast('Title and message are required');
        return;
    }

    if (target === 'specific') {
        const checkboxes = document.querySelectorAll('.edit-user-checkbox:checked');
        if (checkboxes.length === 0) {
            showToast('Select at least one user');
            return;
        }
        checkboxes.forEach(cb => deliveredTo.push(cb.value));
    }

    const updateData = {
        type: type,
        title: title,
        message: message,
        forPhone: target === 'all' ? 'all' : null,
        deliveredTo: target === 'specific' ? deliveredTo : []
    };
    if (link) updateData.link = link;
    if (window.editNewImageBase64) {
        updateData.image = window.editNewImageBase64;
        delete window.editNewImageBase64;
    }

    try {
        await db.collection('alerts').doc(alertId).update(updateData);
        showToast('Alert updated');
        editModal.classList.remove('show');
        loadAlerts();
    } catch (error) {
        console.error('Update error:', error);
        showToast('Update failed: ' + error.message);
    }
}

// ========== DELETE (Hard Delete) ==========
window.deleteAlert = function(alertId) {
    if (confirm('Are you sure you want to permanently delete this alert?')) {
        db.collection('alerts').doc(alertId).delete()
            .then(() => {
                showToast('Alert deleted successfully');
                loadAlerts();
            })
            .catch(err => {
                console.error('Delete error:', err);
                showToast('Delete failed: ' + err.message);
            });
    }
};

function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}