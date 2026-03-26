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

// DOM Elements
const loading = document.getElementById('loading');
const mainContent = document.getElementById('mainContent');
const adminLogo = document.getElementById('adminLogo');
const backBtn = document.getElementById('backBtn');
const refreshBtn = document.getElementById('refreshBtn');
const navItems = document.querySelectorAll('.nav-item');

// Form Elements
const imageUrlInput = document.getElementById('imageUrlInput');
const imagePreview = document.getElementById('imagePreview');
const previewContainer = document.getElementById('imagePreviewContainer');
const testImageBtn = document.getElementById('testImageBtn');
const clearImageBtn = document.getElementById('clearImageBtn');
const bannerLink = document.getElementById('bannerLink');
const bannerTitle = document.getElementById('bannerTitle');
const addBannerBtn = document.getElementById('addBannerBtn');
const bannersList = document.getElementById('bannersList');
const noBanners = document.getElementById('noBanners');

// Modals
const editModal = document.getElementById('editModal');
const closeEditModal = document.getElementById('closeEditModal');
const closeEditModalBtn = document.getElementById('closeEditModalBtn');
const editModalBody = document.getElementById('editModalBody');
const deleteModal = document.getElementById('deleteModal');
const cancelDelete = document.getElementById('cancelDelete');
const confirmDelete = document.getElementById('confirmDelete');

// Toast
const toast = document.getElementById('toast');

// State
let currentAdmin = null;
let allBanners = [];
let currentImageUrl = '';
let editingBannerId = null;
let deletingBannerId = null;

// ========== LOADING SCREEN - FORCE HIDE ==========
(function() {
    console.log('🚀 Script started - forcing loading hide');
    const loadingEl = document.getElementById('loading');
    const mainEl = document.getElementById('mainContent');
    
    if (loadingEl) {
        loadingEl.style.display = 'none';
        loadingEl.classList.add('hide');
    }
    if (mainEl) {
        mainEl.style.display = 'block';
    }
})();

// ========== Initialize ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 Add Banner page loaded');
    checkAdminLogin();
    loadLogo();
    loadBanners();
    setupEventListeners();
});

function checkAdminLogin() {
    const admin = localStorage.getItem('currentAdmin');
    if (!admin) {
        window.location.href = 'index.html';
        return;
    }
    try {
        currentAdmin = JSON.parse(admin);
    } catch (e) {
        window.location.href = 'index.html';
    }
}

async function loadLogo() {
    try {
        const url = await firebase.storage().ref('logo/logo.png').getDownloadURL();
        if (adminLogo) adminLogo.src = url;
    } catch {
        if (adminLogo) adminLogo.src = '/IMG_20260313_225034.png';
    }
}

// ========== Load Banners ==========
function loadBanners() {
    db.collection('banners')
        .orderBy('createdAt', 'desc')
        .get()
        .then((snapshot) => {
            allBanners = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            renderBanners();
        })
        .catch((error) => {
            console.error('Error loading banners:', error);
            showToast('Failed to load banners');
        });
}

// ========== Render Banners ==========
function renderBanners() {
    if (!bannersList || !noBanners) return;

    if (allBanners.length === 0) {
        noBanners.classList.add('show');
        bannersList.innerHTML = '';
        return;
    }

    noBanners.classList.remove('show');

    let html = '';
    allBanners.forEach(banner => {
        const linkDisplay = banner.link ? 
            `<a href="${banner.link}" target="_blank">${banner.link}</a>` : 
            'No link';
        const title = banner.title || 'Untitled Banner';
        const date = banner.createdAt?.toDate?.() 
            ? banner.createdAt.toDate().toLocaleDateString() 
            : 'N/A';

        html += `
            <div class="banner-card" data-id="${banner.id}">
                <img src="${banner.imageUrl}" class="banner-image" alt="${title}" onerror="this.src='https://via.placeholder.com/150?text=Error'">
                <div class="banner-info">
                    <div class="banner-title">${escapeHtml(title)}</div>
                    <div class="banner-link">
                        <i class="fas fa-link"></i> ${linkDisplay}
                    </div>
                    <div class="banner-meta">
                        <span><i class="far fa-calendar"></i> ${date}</span>
                    </div>
                </div>
                <div class="banner-actions">
                    <button class="banner-action-btn edit" onclick="openEditModal('${banner.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="banner-action-btn delete" onclick="openDeleteModal('${banner.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });

    bannersList.innerHTML = html;
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

// ========== Test Image URL ==========
function testImageUrl() {
    const url = imageUrlInput.value.trim();
    
    if (!url) {
        showToast('Please enter an image URL');
        return;
    }
    
    showToast('Testing image...');
    
    const img = new Image();
    img.onload = () => {
        currentImageUrl = url;
        imagePreview.src = url;
        previewContainer.style.display = 'inline-block';
        showToast('✅ Image loaded successfully');
    };
    img.onerror = () => {
        showToast('❌ Invalid image URL or image not accessible');
    };
    img.src = url;
}

// ========== Clear Image ==========
function clearImage() {
    currentImageUrl = '';
    imagePreview.src = '#';
    previewContainer.style.display = 'none';
    imageUrlInput.value = '';
}

// ========== Add Banner ==========
async function addBanner() {
    if (!currentImageUrl) {
        showToast('Please enter and test an image URL');
        return;
    }

    addBannerBtn.disabled = true;
    addBannerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';

    try {
        await db.collection('banners').add({
            imageUrl: currentImageUrl,
            link: bannerLink.value.trim() || null,
            title: bannerTitle.value.trim() || null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showToast('✅ Banner added successfully');
        clearImage();
        bannerLink.value = '';
        bannerTitle.value = '';
        loadBanners();
    } catch (error) {
        console.error('Error adding banner:', error);
        showToast('❌ Failed to add banner: ' + error.message);
    } finally {
        addBannerBtn.disabled = false;
        addBannerBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Add Banner';
    }
}

// ========== Open Edit Modal ==========
window.openEditModal = function(bannerId) {
    editingBannerId = bannerId;
    const banner = allBanners.find(b => b.id === bannerId);
    if (!banner) return;

    const formHtml = `
        <div class="edit-form">
            <div class="form-group">
                <label>Current Image</label>
                <img src="${banner.imageUrl}" style="width:100%; max-height:200px; object-fit:contain; border-radius:12px; margin-bottom:10px;" onerror="this.src='https://via.placeholder.com/200?text=Error'">
            </div>
            
            <div class="form-group">
                <label>New Image URL (Optional)</label>
                <input type="url" id="editImageUrl" class="edit-image-url" placeholder="https://example.com/image.jpg" value="${banner.imageUrl}">
                <button class="test-btn" id="editTestImageBtn" style="width:100%; margin-bottom:10px;">Test New Image</button>
                <div class="image-preview-container" id="editImagePreviewContainer" style="display: none; margin-top:10px;">
                    <img id="editImagePreview" class="image-preview" src="#" alt="Preview">
                    <button class="remove-image-btn" id="editRemoveImageBtn"><i class="fas fa-times"></i></button>
                </div>
            </div>

            <div class="form-group">
                <label>Banner Link</label>
                <input type="url" id="editBannerLink" value="${banner.link || ''}" placeholder="https://example.com">
            </div>

            <div class="form-group">
                <label>Banner Title</label>
                <input type="text" id="editBannerTitle" value="${banner.title || ''}" placeholder="e.g. Summer Sale">
            </div>

            <button class="submit-btn" id="updateBannerBtn">Update Banner</button>
            <button class="submit-btn" style="background:#6c757d; margin-top:10px;" onclick="closeEditModal.click()">Cancel</button>
        </div>
    `;

    editModalBody.innerHTML = formHtml;
    editModal.classList.add('show');

    // Setup edit image URL test
    const editImageUrl = document.getElementById('editImageUrl');
    const editTestImageBtn = document.getElementById('editTestImageBtn');
    const editImagePreviewContainer = document.getElementById('editImagePreviewContainer');
    const editImagePreview = document.getElementById('editImagePreview');
    const editRemoveImageBtn = document.getElementById('editRemoveImageBtn');

    let editNewImageUrl = null;

    editTestImageBtn.addEventListener('click', () => {
        const url = editImageUrl.value.trim();
        if (!url) {
            showToast('Please enter an image URL');
            return;
        }

        const img = new Image();
        img.onload = () => {
            editNewImageUrl = url;
            editImagePreview.src = url;
            editImagePreviewContainer.style.display = 'inline-block';
            showToast('✅ Image loaded successfully');
        };
        img.onerror = () => {
            showToast('❌ Invalid image URL');
        };
        img.src = url;
    });

    editRemoveImageBtn.addEventListener('click', () => {
        editNewImageUrl = null;
        editImagePreview.src = '#';
        editImagePreviewContainer.style.display = 'none';
        editImageUrl.value = '';
    });

    document.getElementById('updateBannerBtn').addEventListener('click', () => updateBanner(bannerId, editNewImageUrl));
};

// ========== Update Banner ==========
async function updateBanner(bannerId, newImageUrl) {
    const link = document.getElementById('editBannerLink').value.trim();
    const title = document.getElementById('editBannerTitle').value.trim();

    const updateData = {
        link: link || null,
        title: title || null,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (newImageUrl) {
        updateData.imageUrl = newImageUrl;
    }

    showToast('Updating...');

    try {
        await db.collection('banners').doc(bannerId).update(updateData);
        showToast('✅ Banner updated successfully');
        editModal.classList.remove('show');
        loadBanners();
    } catch (error) {
        console.error('Update error:', error);
        showToast('❌ Failed to update banner');
    }
}

// ========== Open Delete Modal ==========
window.openDeleteModal = function(bannerId) {
    deletingBannerId = bannerId;
    deleteModal.classList.add('show');
};

// ========== Delete Banner ==========
async function deleteBanner() {
    if (!deletingBannerId) return;

    showToast('Deleting...');

    try {
        await db.collection('banners').doc(deletingBannerId).delete();
        showToast('✅ Banner deleted successfully');
        deleteModal.classList.remove('show');
        loadBanners();
    } catch (error) {
        console.error('Delete error:', error);
        showToast('❌ Failed to delete banner');
    }
}

// ========== Show Toast ==========
function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ========== Setup Event Listeners ==========
function setupEventListeners() {
    backBtn.addEventListener('click', () => window.location.href = 'index.html');
    refreshBtn.addEventListener('click', loadBanners);

    // Test Image URL
    testImageBtn.addEventListener('click', testImageUrl);
    
    // Enter key in URL input
    imageUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            testImageUrl();
        }
    });

    // Clear Image button
    if (clearImageBtn) {
        clearImageBtn.addEventListener('click', clearImage);
    }

    // Add Banner
    addBannerBtn.addEventListener('click', addBanner);

    // Modal Close
    closeEditModal.addEventListener('click', () => editModal.classList.remove('show'));
    closeEditModalBtn.addEventListener('click', () => editModal.classList.remove('show'));
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) editModal.classList.remove('show');
    });

    // Delete Modal
    cancelDelete.addEventListener('click', () => deleteModal.classList.remove('show'));
    confirmDelete.addEventListener('click', deleteBanner);

    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.dataset.page;
            if (page) window.location.href = page;
        });
    });
}