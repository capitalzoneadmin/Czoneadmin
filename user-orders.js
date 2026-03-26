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

console.log('🚀 Admin Order Management page loaded');

// DOM Elements
const loading = document.getElementById('loading');
const mainContent = document.getElementById('mainContent');
const backBtn = document.getElementById('backBtn');
const homeIcon = document.getElementById('homeIcon');
const ordersList = document.getElementById('ordersList');
const noOrders = document.getElementById('noOrders');
const noOrdersMessage = document.getElementById('noOrdersMessage');
const tabBtns = document.querySelectorAll('.tab-btn');
const backToTop = document.getElementById('backToTop');

// Count elements
const pendingCount = document.getElementById('pendingCount');
const confirmedCount = document.getElementById('confirmedCount');
const deliveredCount = document.getElementById('deliveredCount');
const cancelledCount = document.getElementById('cancelledCount');

// Modal Elements
const orderModal = document.getElementById('orderModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const orderModalBody = document.getElementById('orderModalBody');

// Confirm Modal
const confirmModal = document.getElementById('confirmModal');
const trackingNumber = document.getElementById('trackingNumber');
const paymentStatus = document.getElementById('paymentStatus');
const paymentNote = document.getElementById('paymentNote');
const paymentNoteText = document.getElementById('paymentNoteText');
const cancelConfirmBtn = document.getElementById('cancelConfirmBtn');
const confirmOrderBtn = document.getElementById('confirmOrderBtn');

// Deliver Modal
const deliverModal = document.getElementById('deliverModal');
const cancelDeliverBtn = document.getElementById('cancelDeliverBtn');
const confirmDeliverBtn = document.getElementById('confirmDeliverBtn');

// Toast
const toast = document.getElementById('toast');

// State
let allOrders = [];
let currentFilter = 'pending';
let selectedOrder = null;
let selectedOrderId = null;

// ========== Initialize ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Order Management...');
    checkAdminLogin();
    setupEventListeners();
    loadOrders();

    setTimeout(() => {
        loading.classList.add('hide');
    }, 2000);
});

// ========== Check Admin Login ==========
function checkAdminLogin() {
    const admin = localStorage.getItem('currentAdmin');
    if (!admin) {
        window.location.href = 'index.html';
        return;
    }
    console.log('Admin logged in');
}

// ========== Load Orders ==========
async function loadOrders() {
    console.log('Loading orders...');
    showLoading();

    try {
        const ordersSnapshot = await db.collection('orders').get();
        
        allOrders = [];
        ordersSnapshot.forEach(doc => {
            const data = doc.data();
            allOrders.push({
                id: doc.id,
                ...data
            });
        });

        // Sort by date (newest first)
        allOrders.sort((a, b) => {
            if (a.createdAt && b.createdAt) {
                return b.createdAt.seconds - a.createdAt.seconds;
            }
            return 0;
        });

        console.log('Total orders loaded:', allOrders.length);
        updateCounts();
        filterAndDisplayOrders();

    } catch (error) {
        console.error('Error loading orders:', error);
        showToast('Error loading orders');
        showNoOrders('Error loading orders');
    }
}

// ========== Update Counts ==========
function updateCounts() {
    const pending = allOrders.filter(o => o.status === 'pending').length;
    const confirmed = allOrders.filter(o => o.status === 'confirmed').length;
    const delivered = allOrders.filter(o => o.status === 'delivered').length;
    const cancelled = allOrders.filter(o => o.status === 'cancelled').length;

    pendingCount.textContent = pending;
    confirmedCount.textContent = confirmed;
    deliveredCount.textContent = delivered;
    cancelledCount.textContent = cancelled;
}

// ========== Filter and Display Orders ==========
function filterAndDisplayOrders() {
    const filteredOrders = allOrders.filter(o => o.status === currentFilter);
    
    console.log(`Filtered orders (${currentFilter}):`, filteredOrders.length);
    
    if (filteredOrders.length === 0) {
        showNoOrders(getNoOrdersMessage());
    } else {
        noOrders.style.display = 'none';
        renderOrders(filteredOrders);
    }
}

// ========== Get No Orders Message ==========
function getNoOrdersMessage() {
    switch(currentFilter) {
        case 'pending': return 'No pending orders at the moment';
        case 'confirmed': return 'No confirmed orders';
        case 'delivered': return 'No delivered orders';
        case 'cancelled': return 'No cancelled orders';
        default: return 'No orders found';
    }
}

// ========== Show No Orders ==========
function showNoOrders(message) {
    noOrders.style.display = 'block';
    noOrdersMessage.textContent = message;
    ordersList.innerHTML = '';
}

// ========== Show Loading ==========
function showLoading() {
    ordersList.innerHTML = '<div style="text-align:center; padding:40px;"><i class="fas fa-spinner fa-spin"></i> Loading orders...</div>';
}

// ========== Render Orders ==========
function renderOrders(orders) {
    let html = '';
    
    orders.forEach(order => {
        const items = order.items || [];
        const firstItem = items[0] || {};
        const itemCount = items.length;
        
        // Get status class
        let statusClass = 'status-pending';
        let statusText = 'Pending';
        
        if (order.status === 'confirmed') {
            statusClass = 'status-confirmed';
            statusText = 'Confirmed';
        } else if (order.status === 'cancelled') {
            statusClass = 'status-cancelled';
            statusText = 'Cancelled';
        } else if (order.status === 'delivered') {
            statusClass = 'status-delivered';
            statusText = 'Delivered';
        }
        
        // Get payment status display
        const paymentBadge = order.paymentStatus === 'successful' ? 
            '<span class="payment-badge" style="background:#28a745;">✓ Payment Successful</span>' :
            order.paymentStatus === 'unsuccessful' ?
            '<span class="payment-badge" style="background:#dc3545;">✗ Payment Failed</span>' : '';
        
        html += `
            <div class="order-card" data-order-id="${order.id}">
                <div class="order-header">
                    <div class="order-user">
                        <i class="fas fa-user-circle"></i>
                        <div class="user-info">
                            <h4>${escapeHtml(order.customerName || 'Unknown')}</h4>
                            <p>${order.customerPhone || 'No phone'}</p>
                        </div>
                    </div>
                    <div class="order-id">
                        <span>Order ID</span>
                        <strong>#${order.id.slice(-8)}</strong>
                        <span class="order-status-badge ${statusClass}" style="margin-top: 5px; display: inline-block;">${statusText}</span>
                        ${paymentBadge}
                    </div>
                </div>
                
                <div class="order-items-preview">
                    <div class="preview-item">
                        <div class="preview-image">
                            <img src="${firstItem.image || 'https://via.placeholder.com/50'}" alt="${firstItem.title || 'Product'}">
                        </div>
                        <div class="preview-details">
                            <div class="preview-title">${firstItem.title || 'Product'}</div>
                            <div class="preview-price">${formatLKR(firstItem.price || 0)}</div>
                            ${firstItem.color || firstItem.size ? 
                                `<div class="preview-variation">${firstItem.color || ''} ${firstItem.size || ''}</div>` : ''}
                        </div>
                    </div>
                    ${itemCount > 1 ? `
                        <div class="more-items-badge">
                            +${itemCount - 1} more item${itemCount - 1 > 1 ? 's' : ''}
                        </div>
                    ` : ''}
                </div>
                
                <div class="order-summary">
                    <div class="summary-info">
                        <div class="summary-item">
                            <i class="fas fa-calendar"></i>
                            <span>${order.orderDate || 'N/A'}</span>
                        </div>
                        <div class="summary-item">
                            <i class="fas fa-box"></i>
                            <span>${itemCount} item${itemCount > 1 ? 's' : ''}</span>
                        </div>
                    </div>
                    <div class="order-total">
                        ${formatLKR(order.total || 0)}
                    </div>
                </div>
                
                <div class="order-actions">
                    <button class="action-btn view-btn" onclick="viewOrderDetails('${order.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${order.status === 'pending' ? `
                        <button class="action-btn confirm-btn" onclick="showConfirmModal('${order.id}')">
                            <i class="fas fa-check-circle"></i> Confirm
                        </button>
                    ` : ''}
                    ${order.status === 'confirmed' ? `
                        <button class="action-btn deliver-btn" onclick="showDeliverModal('${order.id}')">
                            <i class="fas fa-truck"></i> Deliver
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    ordersList.innerHTML = html;
}

// ========== View Order Details ==========
window.viewOrderDetails = function(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    selectedOrder = order;
    
    // Generate items HTML
    let itemsHtml = '';
    order.items.forEach(item => {
        itemsHtml += `
            <div class="detail-item">
                <div class="detail-item-image">
                    <img src="${item.image || 'https://via.placeholder.com/80'}" alt="${item.title}">
                </div>
                <div class="detail-item-info">
                    <div class="detail-item-title">${escapeHtml(item.title)}</div>
                    <div class="detail-item-price">
                        ${formatLKR(item.price)}
                        <span class="detail-item-quantity">x${item.quantity || 1}</span>
                    </div>
                    ${item.color || item.size ? 
                        `<div style="font-size: 12px; color: #666; margin-top: 5px;">
                            ${item.color ? `Color: ${item.color}` : ''} ${item.size ? `Size: ${item.size}` : ''}
                        </div>` : ''}
                </div>
            </div>
        `;
    });
    
    // Determine status class
    let statusClass = 'status-pending';
    let statusText = 'Pending';
    if (order.status === 'confirmed') {
        statusClass = 'status-confirmed';
        statusText = 'Confirmed';
    } else if (order.status === 'cancelled') {
        statusClass = 'status-cancelled';
        statusText = 'Cancelled';
    } else if (order.status === 'delivered') {
        statusClass = 'status-delivered';
        statusText = 'Delivered';
    }
    
    // Payment status display
    let paymentStatusHtml = '';
    if (order.paymentStatus === 'successful') {
        paymentStatusHtml = '<span style="color:#28a745; font-weight:600;">✓ Successful</span>';
        if (order.paymentMethod === 'Bank Transfer') {
            paymentStatusHtml += ' <span style="color:#667eea;">(Bank Transfer)</span>';
        }
    } else if (order.paymentStatus === 'unsuccessful') {
        paymentStatusHtml = '<span style="color:#dc3545; font-weight:600;">✗ Unsuccessful</span>';
    } else {
        paymentStatusHtml = '<span style="color:#ffc107;">⏳ Pending</span>';
    }
    
    // Tracking info
    const trackingHtml = order.trackingId ? `
        <div class="tracking-info">
            <i class="fas fa-map-marker-alt"></i>
            <strong>Tracking ID:</strong> ${order.trackingId}
        </div>
    ` : '';
    
    // Cancel reason
    const cancelHtml = order.cancelReason ? `
        <div class="cancel-reason">
            <i class="fas fa-info-circle"></i>
            <strong>Cancellation Reason:</strong> ${order.cancelReason}
        </div>
    ` : '';
    
    const modalHtml = `
        <div class="order-detail">
            <div class="detail-section">
                <h4><i class="fas fa-user"></i> Customer Information</h4>
                <div class="detail-row">
                    <span class="label">Name:</span>
                    <span class="value">${order.customerName || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Phone:</span>
                    <span class="value">${order.customerPhone || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Address:</span>
                    <span class="value">${order.customerAddress || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Town:</span>
                    <span class="value">${order.customerTown || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Postal Code:</span>
                    <span class="value">${order.customerPostalCode || 'N/A'}</span>
                </div>
            </div>
            
            <div class="detail-section">
                <h4><i class="fas fa-box"></i> Order Items (${order.items.length})</h4>
                ${itemsHtml}
            </div>
            
            <div class="detail-section">
                <h4><i class="fas fa-credit-card"></i> Payment Details</h4>
                <div class="detail-row">
                    <span class="label">Payment Method:</span>
                    <span class="value">${order.paymentMethod || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Payment Status:</span>
                    <span class="value">${paymentStatusHtml}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Order Status:</span>
                    <span class="value"><span class="order-status-badge ${statusClass}">${statusText}</span></span>
                </div>
            </div>
            
            <div class="detail-section">
                <h4><i class="fas fa-chart-line"></i> Price Summary</h4>
                <div class="detail-row">
                    <span class="label">Subtotal:</span>
                    <span class="value">${formatLKR(order.subtotal || 0)}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Delivery Fee:</span>
                    <span class="value">${formatLKR(order.deliveryFee || 350)}</span>
                </div>
                ${order.discount > 0 ? `
                    <div class="detail-row">
                        <span class="label">Discount:</span>
                        <span class="value">- ${formatLKR(order.discount)}</span>
                    </div>
                ` : ''}
                <div class="detail-row">
                    <span class="label"><strong>Total:</strong></span>
                    <span class="value"><strong>${formatLKR(order.total || 0)}</strong></span>
                </div>
            </div>
            
            <div class="detail-section">
                <h4><i class="fas fa-truck"></i> Delivery Information</h4>
                <div class="detail-row">
                    <span class="label">Order Date:</span>
                    <span class="value">${order.orderDate || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Expected Delivery:</span>
                    <span class="value">${order.deliveryDate || 'N/A'}</span>
                </div>
                ${trackingHtml}
            </div>
            
            ${cancelHtml}
        </div>
    `;
    
    orderModalBody.innerHTML = modalHtml;
    orderModal.classList.add('show');
}

// ========== Show Confirm Modal ==========
window.showConfirmModal = function(orderId) {
    selectedOrderId = orderId;
    const order = allOrders.find(o => o.id === orderId);
    
    trackingNumber.value = '';
    paymentStatus.value = 'pending';
    paymentNote.style.display = 'none';
    
    // Show note for bank transfer
    if (order && order.paymentMethod === 'Bank Transfer') {
        paymentNote.style.display = 'block';
        paymentNoteText.innerHTML = 'This is a Bank Transfer order. After confirmation, customer will be provided with bank details.';
    }
    
    confirmModal.classList.add('show');
}

// ========== Confirm Order ==========
async function confirmOrder() {
    const tracking = trackingNumber.value.trim();
    const paymentStat = paymentStatus.value;
    
    if (!tracking) {
        showToast('Please enter a tracking number');
        return;
    }
    
    if (!selectedOrderId) return;
    
    confirmModal.classList.remove('show');
    showToast('Processing...');
    
    try {
        await db.collection('orders').doc(selectedOrderId).update({
            status: 'confirmed',
            trackingId: tracking,
            paymentStatus: paymentStat,
            confirmedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('Order confirmed successfully!');
        
        // Reload orders
        await loadOrders();
        
    } catch (error) {
        console.error('Error confirming order:', error);
        showToast('Error confirming order');
    }
}

// ========== Show Deliver Modal ==========
window.showDeliverModal = function(orderId) {
    selectedOrderId = orderId;
    deliverModal.classList.add('show');
}

// ========== Deliver Order ==========
async function deliverOrder() {
    if (!selectedOrderId) return;
    
    deliverModal.classList.remove('show');
    showToast('Processing...');
    
    try {
        await db.collection('orders').doc(selectedOrderId).update({
            status: 'delivered',
            paymentStatus: 'successful', // Auto set to successful on delivery
            deliveredAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('Order marked as delivered!');
        
        // Reload orders
        await loadOrders();
        
    } catch (error) {
        console.error('Error delivering order:', error);
        showToast('Error updating order');
    }
}

// ========== Format LKR ==========
function formatLKR(amount) {
    return 'Rs. ' + Number(amount).toLocaleString('en-LK');
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

// ========== Show Toast ==========
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ========== Back to Top ==========
window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        backToTop.style.display = 'flex';
    } else {
        backToTop.style.display = 'none';
    }
});

backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ========== Setup Event Listeners ==========
function setupEventListeners() {
    // Navigation
    backBtn.addEventListener('click', () => window.location.href = 'index.html');
    homeIcon.addEventListener('click', () => window.location.href = 'index.html');
    
    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.status;
            filterAndDisplayOrders();
        });
    });
    
    // Modal close
    closeModalBtn.addEventListener('click', () => {
        orderModal.classList.remove('show');
    });
    
    orderModal.addEventListener('click', (e) => {
        if (e.target === orderModal) {
            orderModal.classList.remove('show');
        }
    });
    
    // Confirm modal
    cancelConfirmBtn.addEventListener('click', () => {
        confirmModal.classList.remove('show');
    });
    
    confirmOrderBtn.addEventListener('click', confirmOrder);
    
    confirmModal.addEventListener('click', (e) => {
        if (e.target === confirmModal) {
            confirmModal.classList.remove('show');
        }
    });
    
    // Deliver modal
    cancelDeliverBtn.addEventListener('click', () => {
        deliverModal.classList.remove('show');
    });
    
    confirmDeliverBtn.addEventListener('click', deliverOrder);
    
    deliverModal.addEventListener('click', (e) => {
        if (e.target === deliverModal) {
            deliverModal.classList.remove('show');
        }
    });
    
    // Payment status change
    paymentStatus.addEventListener('change', () => {
        if (paymentStatus.value === 'successful') {
            paymentNote.style.display = 'block';
            paymentNoteText.innerHTML = 'Payment marked as successful.';
        } else if (paymentStatus.value === 'unsuccessful') {
            paymentNote.style.display = 'block';
            paymentNoteText.innerHTML = 'Payment marked as unsuccessful. Customer will be notified.';
        } else {
            paymentNote.style.display = 'none';
        }
    });
}