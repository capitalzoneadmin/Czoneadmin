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
const adminLogo = document.getElementById('adminLogo');
const backBtn = document.getElementById('backBtn');
const navItems = document.querySelectorAll('.nav-item');

// Form Fields
const productTitle = document.getElementById('productTitle');
const regularPrice = document.getElementById('regularPrice');
const discountPrice = document.getElementById('discountPrice');
const stockQuantity = document.getElementById('stockQuantity');
const soldCount = document.getElementById('soldCount');
const productCategory = document.getElementById('productCategory');
const productStatus = document.getElementById('productStatus');
const productDescription = document.getElementById('productDescription');

// Images
const imageUploadArea = document.getElementById('imageUploadArea');
const imageInput = document.getElementById('imageInput');
const imagePreviewGrid = document.getElementById('imagePreviewGrid');
const imageError = document.getElementById('imageError');

// Colors
const colorPicker = document.getElementById('colorPicker');
const colorName = document.getElementById('colorName');
const addColorBtn = document.getElementById('addColorBtn');
const colorTags = document.getElementById('colorTags');

// Sizes
const sizeValue = document.getElementById('sizeValue');
const addSizeBtn = document.getElementById('addSizeBtn');
const sizeTags = document.getElementById('sizeTags');

// Delivery Fees
const globalDeliveryFee = document.getElementById('globalDeliveryFee');
const addDeliveryFeeBtn = document.getElementById('addDeliveryFeeBtn');
const deliveryFeeTags = document.getElementById('deliveryFeeTags');

// Promo Codes
const addPromoBtn = document.getElementById('addPromoBtn');
const promoTags = document.getElementById('promoTags');

// Buttons
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');

// Toast
const toast = document.getElementById('toast');

// Global Data
let uploadedImages = [];        // array of base64 strings
let colors = [];                // {code, name}
let sizes = [];                 // strings
let deliveryFees = [];          // {userId, userName, fee}
let promoCodes = [];            // {userId, userName, code, discountType, discountValue}
let allUsers = [];

// Admin check
document.addEventListener('DOMContentLoaded', function() {
    checkAdminLogin();
    loadLogo();
    loadUsers();
    setupEventListeners();
    setTimeout(() => loading.classList.add('hide'), 2000);
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

function setupEventListeners() {
    backBtn.addEventListener('click', () => window.location.href = 'index.html');

    // Image upload
    imageUploadArea.addEventListener('click', () => imageInput.click());
    imageUploadArea.addEventListener('dragover', e => e.preventDefault());
    imageUploadArea.addEventListener('drop', handleDrop);
    imageInput.addEventListener('change', handleFileSelect);

    // Colors
    addColorBtn.addEventListener('click', addColor);
    // Sizes
    addSizeBtn.addEventListener('click', addSize);
    // Delivery Fees
    addDeliveryFeeBtn.addEventListener('click', showDeliveryFeeInput);
    // Promo Codes
    addPromoBtn.addEventListener('click', showPromoInput);

    // Form submit
    document.getElementById('addItemForm').addEventListener('submit', handleSubmit);
    resetBtn.addEventListener('click', resetForm);

    // Bottom nav
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.dataset.page;
            if (page) window.location.href = page;
        });
    });
}

// ========== Image Handling with 13MB Limit ==========
function handleDrop(e) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    processImages(files);
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    processImages(files);
}

async function processImages(files) {
    for (const file of files) {
        if (!file.type.startsWith('image/')) {
            imageError.textContent = `${file.name} is not an image`;
            continue;
        }
        // ✅ 13MB limit (13 * 1024 * 1024 = 13,631,488 bytes)
        if (file.size > 13 * 1024 * 1024) {
            imageError.textContent = `${file.name} exceeds 13MB limit`;
            continue;
        }
        const base64 = await fileToBase64(file);
        uploadedImages.push(base64);
        addImagePreview(base64);
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
    });
}

function addImagePreview(base64) {
    const div = document.createElement('div');
    div.className = 'image-preview-item';
    div.innerHTML = `<img src="${base64}" style="width:100%;height:100%;object-fit:cover;"><button class="remove-image" onclick="removeImage(this)"><i class="fas fa-times"></i></button>`;
    imagePreviewGrid.appendChild(div);
}

window.removeImage = function(btn) {
    const item = btn.closest('.image-preview-item');
    const index = Array.from(imagePreviewGrid.children).indexOf(item);
    if (index !== -1) uploadedImages.splice(index, 1);
    item.remove();
};

// ========== Colors ==========
function addColor() {
    const code = colorPicker.value;
    const name = colorName.value.trim();
    if (!name) {
        showToast('Please enter a color name');
        return;
    }
    colors.push({ code, name });
    renderColorTags();
    colorName.value = '';
}

function renderColorTags() {
    colorTags.innerHTML = colors.map(c => `
        <span class="tag">
            <span class="color-dot" style="background:${c.code};"></span>
            ${c.name}
            <i class="fas fa-times remove" onclick="removeColor('${c.name}')"></i>
        </span>
    `).join('');
}

window.removeColor = function(name) {
    colors = colors.filter(c => c.name !== name);
    renderColorTags();
};

// ========== Sizes ==========
function addSize() {
    const size = sizeValue.value.trim().toUpperCase();
    if (!size) {
        showToast('Please enter a size');
        return;
    }
    sizes.push(size);
    renderSizeTags();
    sizeValue.value = '';
}

function renderSizeTags() {
    sizeTags.innerHTML = sizes.map(s => `
        <span class="tag">
            ${s}
            <i class="fas fa-times remove" onclick="removeSize('${s}')"></i>
        </span>
    `).join('');
}

window.removeSize = function(size) {
    sizes = sizes.filter(s => s !== size);
    renderSizeTags();
};

// ========== Delivery Fees ==========
function showDeliveryFeeInput() {
    // Create temporary input row
    const container = document.getElementById('deliveryFeeList');
    const row = document.createElement('div');
    row.className = 'promo-row';
    row.innerHTML = `
        <select class="delivery-user-select">
            <option value="">Select User</option>
            ${allUsers.map(u => `<option value="${u.id}">${u.name || 'User'} (${u.phone})</option>`).join('')}
        </select>
        <input type="number" class="delivery-fee-input" placeholder="Fee LKR" min="0">
        <button type="button" class="add-btn" onclick="addDeliveryFee(this)">Add</button>
    `;
    container.appendChild(row);
}

window.addDeliveryFee = function(btn) {
    const row = btn.closest('.promo-row');
    const select = row.querySelector('.delivery-user-select');
    const feeInput = row.querySelector('.delivery-fee-input');
    const userId = select.value;
    const fee = parseFloat(feeInput.value);
    if (!userId || isNaN(fee) || fee < 0) {
        showToast('Select user and enter valid fee');
        return;
    }
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    deliveryFees.push({ userId, userName: user.name || 'User', fee });
    renderDeliveryFeeTags();
    row.remove();
};

function renderDeliveryFeeTags() {
    deliveryFeeTags.innerHTML = deliveryFees.map(df => `
        <span class="tag">
            ${df.userName}: Rs. ${df.fee}
            <i class="fas fa-times remove" onclick="removeDeliveryFee('${df.userId}')"></i>
        </span>
    `).join('');
}

window.removeDeliveryFee = function(userId) {
    deliveryFees = deliveryFees.filter(df => df.userId !== userId);
    renderDeliveryFeeTags();
};

// ========== Promo Codes ==========
function showPromoInput() {
    const container = document.getElementById('promoList');
    const row = document.createElement('div');
    row.className = 'promo-row';
    row.innerHTML = `
        <select class="promo-user-select">
            <option value="">Select User</option>
            ${allUsers.map(u => `<option value="${u.id}">${u.name || 'User'} (${u.phone})</option>`).join('')}
        </select>
        <input type="text" class="promo-code-input" placeholder="Code e.g. SAVE10">
        <select class="promo-type-select">
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed</option>
        </select>
        <input type="number" class="promo-value-input" placeholder="Value" min="0">
        <button type="button" class="add-btn" onclick="addPromo(this)">Add</button>
    `;
    container.appendChild(row);
}

window.addPromo = function(btn) {
    const row = btn.closest('.promo-row');
    const select = row.querySelector('.promo-user-select');
    const codeInput = row.querySelector('.promo-code-input');
    const typeSelect = row.querySelector('.promo-type-select');
    const valueInput = row.querySelector('.promo-value-input');
    const userId = select.value;
    const code = codeInput.value.trim().toUpperCase();
    const type = typeSelect.value;
    const value = parseFloat(valueInput.value);
    if (!userId || !code || isNaN(value) || value <= 0) {
        showToast('Fill all fields correctly');
        return;
    }
    const user = allUsers.find(u => u.id === userId);
    promoCodes.push({ userId, userName: user.name || 'User', code, type, value });
    renderPromoTags();
    row.remove();
};

function renderPromoTags() {
    promoTags.innerHTML = promoCodes.map(p => `
        <span class="tag">
            ${p.userName}: ${p.code} (${p.type} ${p.value})
            <i class="fas fa-times remove" onclick="removePromo('${p.userId}')"></i>
        </span>
    `).join('');
}

window.removePromo = function(userId) {
    promoCodes = promoCodes.filter(p => p.userId !== userId);
    renderPromoTags();
};

// ========== Form Submit ==========
async function handleSubmit(e) {
    e.preventDefault();

    // Basic validation
    if (!productTitle.value.trim()) {
        showToast('Product title required');
        return;
    }
    if (!regularPrice.value || parseFloat(regularPrice.value) <= 0) {
        showToast('Valid price required');
        return;
    }
    if (uploadedImages.length === 0) {
        showToast('At least one image required');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';

    const itemData = {
        title: productTitle.value.trim(),
        price: parseFloat(regularPrice.value),
        discountPrice: discountPrice.value ? parseFloat(discountPrice.value) : null,
        available: parseInt(stockQuantity.value) || 0,
        sold: parseInt(soldCount.value) || 0,
        category: productCategory.value,
        status: productStatus.value,
        description: productDescription.value.trim(),
        images: uploadedImages,
        colors: colors,
        sizes: sizes,
        delivery: {
            global: parseFloat(globalDeliveryFee.value) || 350,
            customerFees: deliveryFees
        },
        promoCodes: promoCodes,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await db.collection('items').add(itemData);
        showToast('Item added successfully!');
        resetForm();
        setTimeout(() => window.location.href = 'show-items.html', 2000);
    } catch (error) {
        console.error(error);
        showToast('Error: ' + error.message);
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Add Item';
    }
}

// Reset form
function resetForm() {
    productTitle.value = '';
    regularPrice.value = '';
    discountPrice.value = '';
    stockQuantity.value = '0';
    soldCount.value = '0';
    productCategory.value = '';
    productStatus.value = 'available';
    productDescription.value = '';
    uploadedImages = [];
    imagePreviewGrid.innerHTML = '';
    colors = [];
    renderColorTags();
    colorName.value = '';
    sizes = [];
    renderSizeTags();
    sizeValue.value = '';
    deliveryFees = [];
    renderDeliveryFeeTags();
    promoCodes = [];
    renderPromoTags();
    globalDeliveryFee.value = '350';
    showToast('Form reset');
}

function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// In your add-items.js, when saving item
async function saveItem() {
    const itemData = {
        title: document.getElementById('title').value,
        price: parseFloat(document.getElementById('price').value),
        // ... other fields
        delivery: {
            global: parseFloat(document.getElementById('globalDelivery').value) || 350,
            customerFees: deliveryFees // Array of {userId, fee}
        },
        promoCodes: promoCodes // Array of {userId, code, type, value}
    };
    
    await db.collection('items').add(itemData);
}