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
const storage = firebase.storage();

// DOM Elements
const loading = document.getElementById('loading');
const mainContent = document.getElementById('mainContent');
const profileLogo = document.getElementById('profileLogo');
const backBtn = document.getElementById('backBtn');
const homeIcon = document.getElementById('homeIcon');
const logoutBtn = document.getElementById('logoutBtn');
const aboutUs = document.getElementById('aboutUs');
const privacyPolicy = document.getElementById('privacyPolicy');
const navItems = document.querySelectorAll('.nav-item');

// Display Elements
const usernameDisplay = document.getElementById('usernameDisplay');
const phoneDisplay = document.getElementById('phoneDisplay');

// Edit Elements
const usernameEdit = document.getElementById('usernameEdit');
const phoneEdit = document.getElementById('phoneEdit');
const usernameInput = document.getElementById('usernameInput');
const phoneInput = document.getElementById('phoneInput');

// Toast
const toast = document.getElementById('toast');

// State
let currentAdmin = null;
let currentField = null;
let originalValue = '';

// ========== Force Hide Loading ==========
setTimeout(() => {
    if (loading) loading.classList.add('hide');
    if (mainContent) mainContent.style.display = 'block';
}, 2000);

// ========== Initialize ==========
document.addEventListener('DOMContentLoaded', () => {
    checkAdminLogin();
    loadAdminData();
    loadLogo();
    setupEventListeners();
});

function checkAdminLogin() {
    const admin = localStorage.getItem('currentAdmin');
    if (!admin) {
        window.location.href = 'admin-index.html';
        return;
    }
    try {
        currentAdmin = JSON.parse(admin);
    } catch (e) {
        console.error('Error parsing admin:', e);
        window.location.href = 'admin-index.html';
    }
}

// ========== Load Admin Data from Firebase ==========
async function loadAdminData() {
    if (!currentAdmin || !currentAdmin.id) {
        showToast('Admin not found');
        return;
    }

    try {
        const doc = await db.collection('admins').doc(currentAdmin.id).get();
        if (doc.exists) {
            const data = doc.data();
            currentAdmin = { ...currentAdmin, ...data };
            
            // Update display
            if (usernameDisplay) usernameDisplay.textContent = data.name || 'Not set';
            if (phoneDisplay) phoneDisplay.textContent = data.phone || 'Not set';
            
            // Save to localStorage
            localStorage.setItem('currentAdmin', JSON.stringify(currentAdmin));
        }
    } catch (error) {
        console.error('Error loading admin data:', error);
        showToast('Failed to load profile');
    }
}

// ========== Load Logo from Storage ==========
async function loadLogo() {
    try {
        const url = await storage.ref('logo/logo.png').getDownloadURL();
        if (profileLogo) profileLogo.src = url;
    } catch (error) {
        console.log('Using default logo');
        if (profileLogo) profileLogo.src = '/IMG_20260313_225034.png';
    }
}

// ========== Edit Field ==========
window.editField = function(field) {
    currentField = field;
    
    if (field === 'username') {
        originalValue = usernameDisplay.textContent;
        usernameInput.value = originalValue;
        usernameDisplay.style.display = 'none';
        usernameEdit.style.display = 'block';
    } else if (field === 'phone') {
        originalValue = phoneDisplay.textContent;
        phoneInput.value = originalValue;
        phoneDisplay.style.display = 'none';
        phoneEdit.style.display = 'block';
    }
};

// ========== Save Field ==========
window.saveField = async function(field) {
    let newValue;
    
    if (field === 'username') {
        newValue = usernameInput.value.trim();
        if (!newValue) {
            showToast('Username cannot be empty');
            return;
        }
    } else if (field === 'phone') {
        newValue = phoneInput.value.trim();
        if (!newValue) {
            showToast('Phone number cannot be empty');
            return;
        }
        // Basic phone validation (Sri Lanka format)
        const phoneRegex = /^[0-9]{9}$/;
        if (!phoneRegex.test(newValue.replace(/\s/g, ''))) {
            showToast('Please enter a valid 9-digit number');
            return;
        }
    }

    try {
        // Update in Firestore
        const updateData = {};
        if (field === 'username') updateData.name = newValue;
        if (field === 'phone') updateData.phone = newValue;

        await db.collection('admins').doc(currentAdmin.id).update(updateData);

        // Update local state
        if (field === 'username') {
            currentAdmin.name = newValue;
            usernameDisplay.textContent = newValue;
        } else if (field === 'phone') {
            currentAdmin.phone = newValue;
            phoneDisplay.textContent = newValue;
        }

        // Update localStorage
        localStorage.setItem('currentAdmin', JSON.stringify(currentAdmin));

        // Hide edit mode
        cancelEdit(field);
        showToast('Updated successfully');
    } catch (error) {
        console.error('Update error:', error);
        showToast('Failed to update');
    }
};

// ========== Cancel Edit ==========
window.cancelEdit = function(field) {
    if (field === 'username') {
        usernameDisplay.style.display = 'block';
        usernameEdit.style.display = 'none';
        usernameInput.value = originalValue;
    } else if (field === 'phone') {
        phoneDisplay.style.display = 'block';
        phoneEdit.style.display = 'none';
        phoneInput.value = originalValue;
    }
    currentField = null;
};

// ========== Logout ==========
logoutBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentAdmin');
        showToast('Logged out successfully');
        setTimeout(() => {
            window.location.href = 'admin-index.html';
        }, 1000);
    }
});

// ========== Navigation ==========
backBtn.addEventListener('click', () => {
    window.location.href = 'admin-index.html';
});

homeIcon.addEventListener('click', () => {
    window.location.href = 'admin-index.html';
});

aboutUs.addEventListener('click', () => {
    window.location.href = 'about-us.html';
});

privacyPolicy.addEventListener('click', () => {
    window.location.href = 'privacy-policy.html';
});

navItems.forEach(item => {
    item.addEventListener('click', function() {
        const page = this.dataset.page;
        if (page) window.location.href = page;
    });
});

// ========== Toast ==========
function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}