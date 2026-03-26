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
const storage = firebase.storage(); // Keep for logo maybe, but not for promo images

// DOM Elements
const loading = document.getElementById('loading');
const mainContent = document.getElementById('mainContent');
const backBtn = document.getElementById('backBtn');
const adminLogo = document.getElementById('adminLogo');
const notificationIcon = document.getElementById('notificationIcon');
const profileIcon = document.getElementById('profileIcon');
const navItems = document.querySelectorAll('.nav-item');
const promoList = document.getElementById('promoList');
const addNewPromoBtn = document.getElementById('addNewPromoBtn');

// Modal Elements
const promoModal = document.getElementById('promoModal');
const modalTitle = document.getElementById('modalTitle');
const promoTitle = document.getElementById('promoTitle');
const promoImageUrl = document.getElementById('promoImageUrl'); // New URL input
const testImageBtn = document.getElementById('testImageBtn');
const promoImagePreview = document.getElementById('promoImagePreview');
const previewImg = document.getElementById('previewImg');
const removeImage = document.getElementById('removeImage');
const promoLink = document.getElementById('promoLink');
const promoColor = document.getElementById('promoColor');
const promoStatus = document.getElementById('promoStatus');
const savePromoBtn = document.getElementById('savePromoBtn');
const cancelPromoBtn = document.getElementById('cancelPromoBtn');
const closeModalBtn = document.getElementById('closeModalBtn');

// Delete Modal
const deleteModal = document.getElementById('deleteModal');
const deleteMessage = document.getElementById('deleteMessage');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

// Toast
const toast = document.getElementById('toast');

// Global Variables
let currentAdmin = null;
let promos = [];
let currentImageUrl = ''; // Store the image URL
let editingId = null;
let deletingId = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin Promo page loaded');
    
    // Check login status
    const admin = localStorage.getItem('currentAdmin');
    if (!admin) {
        window.location.href = 'admin-index.html';
        return;
    }
    currentAdmin = JSON.parse(admin);
    
    loadLogo();
    loadPromos();
    setupEventListeners();
    
    setTimeout(() => {
        loading.classList.add('hide');
    }, 2000);
});

// Load Logo
async function loadLogo() {
    try {
        const url = await storage.ref('logo/logo.png').getDownloadURL();
        adminLogo.src = url;
    } catch (error) {
        adminLogo.src = '/IMG_20260313_225034.png';
    }
}

// Load Promos from Firestore
async function loadPromos() {
    try {
        showToast('Loading promos...');
        
        const snapshot = await db.collection('promos').orderBy('createdAt', 'desc').get();
        
        promos = [];
        snapshot.forEach(doc => {
            promos.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log('✅ Promos loaded:', promos.length);
        displayPromos();
        
        // Save to localStorage for customer website
        localStorage.setItem('customer_promos', JSON.stringify(promos));
        
    } catch (error) {
        console.error('❌ Error loading promos:', error);
        showToast('Error loading promos', 'error');
    }
}

// Display Promos
function displayPromos() {
    if (!promoList) return;
    
    if (promos.length === 0) {
        promoList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bolt"></i>
                <h3>No Promo Links</h3>
                <p>Click "Add New Promo Link" to create one</p>
            </div>
        `;
        return;
    }
    
    promoList.innerHTML = promos.map(promo => `
        <div class="promo-card">
            <div class="promo-header" style="background: ${promo.color || 'linear-gradient(135deg, #2196f3, #64b5f6)'}">
                <i class="fas fa-${promo.icon || 'bolt'}"></i>
                <h3>${escapeHtml(promo.title)}</h3>
            </div>
            <div class="promo-body">
                <div class="promo-image">
                    <img src="${promo.imageUrl || 'https://via.placeholder.com/80x80'}" alt="${promo.title}" 
                         onerror="this.src='https://via.placeholder.com/80x80'">
                </div>
                <div class="promo-details">
                    <div class="promo-link">
                        <i class="fas fa-link"></i> ${escapeHtml(promo.link)}
                    </div>
                    <div class="promo-meta">
                        <span class="promo-status status-${promo.status}">
                            <i class="fas fa-${promo.status === 'active' ? 'eye' : 'eye-slash'}"></i>
                            ${promo.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                        <span class="promo-color-badge">
                            <i class="fas fa-palette"></i> Color
                        </span>
                    </div>
                    <div class="promo-actions">
                        <button class="btn-edit" onclick="editPromo('${promo.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-delete" onclick="deletePromo('${promo.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Escape HTML
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Open Add Modal
function openAddModal() {
    editingId = null;
    modalTitle.textContent = 'Add Promo Link';
    promoTitle.value = '';
    promoLink.value = '';
    promoColor.value = 'linear-gradient(135deg, #2196f3, #64b5f6)';
    promoStatus.value = 'active';
    
    // Reset image
    currentImageUrl = '';
    promoImageUrl.value = '';
    promoImagePreview.classList.remove('show');
    previewImg.src = '';
    
    promoModal.classList.add('show');
}

// Edit Promo
window.editPromo = function(id) {
    const promo = promos.find(p => p.id === id);
    if (!promo) return;
    
    editingId = id;
    modalTitle.textContent = 'Edit Promo Link';
    promoTitle.value = promo.title || '';
    promoLink.value = promo.link || '';
    promoColor.value = promo.color || 'linear-gradient(135deg, #2196f3, #64b5f6)';
    promoStatus.value = promo.status || 'active';
    
    // Show existing image URL
    if (promo.imageUrl) {
        currentImageUrl = promo.imageUrl;
        promoImageUrl.value = promo.imageUrl;
        previewImg.src = promo.imageUrl;
        promoImagePreview.classList.add('show');
    } else {
        currentImageUrl = '';
        promoImageUrl.value = '';
        promoImagePreview.classList.remove('show');
    }
    
    promoModal.classList.add('show');
};

// Delete Promo
window.deletePromo = function(id) {
    const promo = promos.find(p => p.id === id);
    if (!promo) return;
    
    deletingId = id;
    deleteMessage.textContent = `Are you sure you want to delete "${promo.title}"?`;
    deleteModal.classList.add('show');
};

// Test Image URL
function testImageUrl() {
    const url = promoImageUrl.value.trim();
    if (!url) {
        showToast('Please enter an image URL', 'error');
        return;
    }
    
    // Test if image loads
    const img = new Image();
    img.onload = () => {
        currentImageUrl = url;
        previewImg.src = url;
        promoImagePreview.classList.add('show');
        showToast('Image loaded successfully', 'success');
    };
    img.onerror = () => {
        showToast('Invalid image URL or image not accessible', 'error');
    };
    img.src = url;
}

// Remove selected image
function removeSelectedImage() {
    currentImageUrl = '';
    promoImageUrl.value = '';
    promoImagePreview.classList.remove('show');
    previewImg.src = '';
}

// Save Promo
async function savePromo() {
    const title = promoTitle.value.trim();
    const link = promoLink.value.trim();
    const color = promoColor.value;
    const status = promoStatus.value;
    const imageUrl = currentImageUrl; // Use the URL directly
    
    // Validation
    if (!title) {
        showToast('Please enter a title', 'error');
        return;
    }
    
    if (!link) {
        showToast('Please enter a link URL', 'error');
        return;
    }
    
    // Image URL is optional? If required, uncomment below
    // if (!imageUrl) {
    //     showToast('Please add an image URL', 'error');
    //     return;
    // }
    
    try {
        showToast('Saving...');
        
        const promoData = {
            title: title,
            link: link,
            color: color,
            status: status,
            imageUrl: imageUrl, // Save URL directly
            icon: 'bolt',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: currentAdmin.name || 'Admin'
        };
        
        console.log('Saving promo data:', promoData);
        
        if (!editingId) {
            // Add new
            promoData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            const docRef = await db.collection('promos').add(promoData);
            console.log('✅ New promo added with ID:', docRef.id);
            showToast('Promo added successfully!', 'success');
        } else {
            // Update existing
            await db.collection('promos').doc(editingId).update(promoData);
            console.log('✅ Promo updated:', editingId);
            showToast('Promo updated successfully!', 'success');
        }
        
        // Close modal and reload
        promoModal.classList.remove('show');
        
        setTimeout(async () => {
            await loadPromos();
        }, 500);
        
    } catch (error) {
        console.error('❌ Error saving promo:', error);
        showToast('Error saving promo: ' + error.message, 'error');
    }
}

// Confirm Delete
async function confirmDelete() {
    if (!deletingId) return;
    
    try {
        showToast('Deleting...');
        
        // Get promo (optional, to delete image from storage? Not needed with URL method)
        const promo = promos.find(p => p.id === deletingId);
        
        // Delete from Firestore
        await db.collection('promos').doc(deletingId).delete();
        console.log('✅ Promo deleted:', deletingId);
        
        // No need to delete image from storage as we don't use storage
        
        showToast('Promo deleted successfully!', 'success');
        deleteModal.classList.remove('show');
        
        setTimeout(async () => {
            await loadPromos();
        }, 500);
        
    } catch (error) {
        console.error('❌ Error deleting promo:', error);
        showToast('Error deleting promo', 'error');
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Back button
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'admin-index.html';
        });
    }
    
    // Add new promo
    if (addNewPromoBtn) {
        addNewPromoBtn.addEventListener('click', openAddModal);
    }
    
    // Test image URL
    if (testImageBtn) {
        testImageBtn.addEventListener('click', testImageUrl);
    }
    
    // Enter key in URL input
    if (promoImageUrl) {
        promoImageUrl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                testImageUrl();
            }
        });
    }
    
    // Remove image
    if (removeImage) {
        removeImage.addEventListener('click', removeSelectedImage);
    }
    
    // Save button
    if (savePromoBtn) {
        savePromoBtn.addEventListener('click', savePromo);
    }
    
    // Cancel buttons
    if (cancelPromoBtn) {
        cancelPromoBtn.addEventListener('click', () => {
            promoModal.classList.remove('show');
        });
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            promoModal.classList.remove('show');
        });
    }
    
    // Delete confirmation
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDelete);
    }
    
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            deleteModal.classList.remove('show');
        });
    }
    
    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.dataset.page;
            if (page) {
                window.location.href = page;
            }
        });
    });
    
    // Notification icon
    if (notificationIcon) {
        notificationIcon.addEventListener('click', () => {
            showToast('No new notifications');
        });
    }
    
    // Profile icon
    if (profileIcon) {
        profileIcon.addEventListener('click', () => {
            window.location.href = 'admin-account.html';
        });
    }
    
    // Close modals on outside click
    promoModal.addEventListener('click', (e) => {
        if (e.target === promoModal) {
            promoModal.classList.remove('show');
        }
    });
    
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) {
            deleteModal.classList.remove('show');
        }
    });
}

// Show toast
function showToast(message, type = '') {
    toast.textContent = message;
    toast.className = 'toast show';
    if (type) {
        toast.classList.add(type);
    }
    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.remove(type);
    }, 2000);
}