// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDuU-1WguuPfKh6hTTvd7BzHeBNJanSNiI",
    authDomain: "capital-e817c.firebaseapp.com",
    projectId: "capital-e817c",
    storageBucket: "capital-e817c.firebasestorage.app",
    messagingSenderId: "733831738797",
    appId: "1:733831738797:web:d945b8f3c7a34146e35d24"
};

console.log('🚀 Admin Tracking starting...');

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized');
} catch (e) {
    console.error('❌ Firebase init error:', e);
}

const db = firebase.firestore();
const storage = firebase.storage();

// ========== FORCE HIDE LOADING IMMEDIATELY ==========
(function() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.add('hide');
        console.log('✅ Loading hidden immediately');
    }
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.style.display = 'block';
        console.log('✅ Main content shown');
    }
})();

// ========== DOM Elements ==========
const loading = document.getElementById('loading');
const mainContent = document.getElementById('mainContent');
const adminLogo = document.getElementById('adminLogo');
const backBtn = document.getElementById('backBtn');
const refreshBtn = document.getElementById('refreshBtn');
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');
const suggestions = document.getElementById('suggestions');
const noOrders = document.getElementById('noOrders');
const ordersList = document.getElementById('ordersList');
const navItems = document.querySelectorAll('.nav-item');

// Modals
const trackingModal = document.getElementById('trackingModal');
const closeModal = document.getElementById('closeModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalBody = document.getElementById('modalBody');
const addEventModal = document.getElementById('addEventModal');
const editEventModal = document.getElementById('editEventModal');
const deleteModal = document.getElementById('deleteModal');
const cancelAddEvent = document.getElementById('cancelAddEvent');
const saveEvent = document.getElementById('saveEvent');
const cancelEditEvent = document.getElementById('cancelEditEvent');
const saveEditEvent = document.getElementById('saveEditEvent');
const cancelDelete = document.getElementById('cancelDelete');
const confirmDelete = document.getElementById('confirmDelete');

// Toast
const toast = document.getElementById('toast');

// ========== State ==========
let currentAdmin = null;
let allOrders = [];
let filteredOrders = [];
let currentOrder = null;
let currentEventIndex = null;
let searchTimeout = null;

// ========== Initialize ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 DOM Content Loaded');
    checkAdminLogin();
    loadLogo();
    loadOrders();
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
        window.location.href = 'admin-index.html';
    }
}

async function loadLogo() {
    try {
        const url = await storage.ref('logo/logo.png').getDownloadURL();
        if (adminLogo) adminLogo.src = url;
    } catch {
        if (adminLogo) adminLogo.src = '/IMG_20260313_225034.png';
    }
}

// ========== Load Orders ==========
function loadOrders() {
    console.log('Loading orders...');
    
    // Try Firebase first
    db.collection('orders')
        .orderBy('createdAt', 'desc')
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                console.log('No orders found, loading sample data');
                loadSampleOrders();
                return;
            }
            
            allOrders = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            console.log('Orders loaded:', allOrders.length);
            filteredOrders = allOrders;
            renderOrders();
        })
        .catch(err => {
            console.error('Error loading orders:', err);
            loadSampleOrders();
        });
}

// ========== Load Sample Orders ==========
function loadSampleOrders() {
    console.log('Loading sample orders');
    allOrders = [
        {
            id: 'sample1',
            orderId: 'ORD123456',
            customerName: 'John Doe',
            customerPhone: '771234567',
            status: 'confirmed',
            trackingId: 'TRK123456',
            trackingEvents: [
                {
                    status: 'Order Placed',
                    location: 'Online',
                    time: new Date().toISOString(),
                    completed: true
                },
                {
                    status: 'Order Confirmed',
                    location: 'Admin',
                    time: new Date().toISOString(),
                    completed: true
                }
            ]
        },
        {
            id: 'sample2',
            orderId: 'ORD789012',
            customerName: 'Jane Smith',
            customerPhone: '772345678',
            status: 'shipped',
            trackingId: 'TRK789012',
            trackingEvents: [
                {
                    status: 'Order Placed',
                    location: 'Online',
                    time: new Date(Date.now() - 86400000).toISOString(),
                    completed: true
                },
                {
                    status: 'Order Confirmed',
                    location: 'Admin',
                    time: new Date(Date.now() - 86400000).toISOString(),
                    completed: true
                },
                {
                    status: 'Shipped',
                    location: 'Colombo Warehouse',
                    time: new Date().toISOString(),
                    completed: true
                }
            ]
        }
    ];
    
    filteredOrders = allOrders;
    renderOrders();
}

// ========== Render Orders ==========
function renderOrders() {
    if (!ordersList) return;
    
    if (filteredOrders.length === 0) {
        if (noOrders) noOrders.style.display = 'block';
        ordersList.innerHTML = '';
        return;
    }
    
    if (noOrders) noOrders.style.display = 'none';
    
    let html = '';
    filteredOrders.forEach(order => {
        const statusClass = `status-${order.status || 'pending'}`;
        const statusText = order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending';
        const orderIdDisplay = order.orderId || order.id.slice(-8);
        
        html += `
            <div class="order-card" onclick="openTrackingModal('${order.id}')">
                <div class="order-header">
                    <span class="order-id">#${orderIdDisplay}</span>
                    <span class="order-status ${statusClass}">${statusText}</span>
                </div>
                <div class="order-customer">
                    ${escapeHtml(order.customerName || 'Unknown')} - ${order.customerPhone || 'No phone'}
                </div>
                <div class="order-tracking">
                    <span>Tracking: ${order.trackingId || 'Not assigned'}</span>
                    <span class="tracking-number">${order.trackingEvents?.length || 0} events</span>
                </div>
            </div>
        `;
    });
    
    ordersList.innerHTML = html;
}

// ========== Open Tracking Modal ==========
window.openTrackingModal = function(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    currentOrder = order;
    
    let eventsHtml = '';
    if (order.trackingEvents && order.trackingEvents.length > 0) {
        order.trackingEvents.forEach((event, index) => {
            const time = event.time ? new Date(event.time).toLocaleString() : 'N/A';
            eventsHtml += `
                <div class="timeline-item-preview">
                    <div>
                        <strong>${escapeHtml(event.status)}</strong><br>
                        <small>${escapeHtml(event.location || '')} - ${time}</small>
                    </div>
                    <div class="timeline-actions">
                        <button class="edit-btn" onclick="editTrackingEvent(${index})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn" onclick="deleteTrackingEvent(${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
    } else {
        eventsHtml = '<p style="text-align:center; color:#999; padding:20px;">No tracking events yet</p>';
    }
    
    modalBody.innerHTML = `
        <div style="margin-bottom:20px;">
            <h4>Order #${order.orderId || order.id.slice(-8)}</h4>
            <p><strong>Customer:</strong> ${escapeHtml(order.customerName || 'N/A')}</p>
            <p><strong>Phone:</strong> ${order.customerPhone || 'N/A'}</p>
            <p><strong>Tracking ID:</strong> ${order.trackingId || 'Not assigned'}</p>
        </div>
        
        <div style="margin-bottom:20px;">
            <label>Tracking ID</label>
            <input type="text" id="editTrackingId" value="${order.trackingId || ''}" placeholder="Enter tracking ID">
        </div>
        
        <div class="timeline-preview">
            <h4 style="margin-bottom:10px;">Tracking Events</h4>
            ${eventsHtml}
        </div>
        
        <button class="icon-btn" style="width:100%; margin-top:10px; background:#28a745; color:white;" onclick="showAddEventModal()">
            <i class="fas fa-plus"></i> Add Tracking Event
        </button>
        <button class="icon-btn" style="width:100%; margin-top:10px; background:#667eea; color:white;" onclick="saveTrackingChanges()">
            <i class="fas fa-save"></i> Save Changes
        </button>
    `;
    
    trackingModal.classList.add('show');
};

// ========== Save Tracking Changes ==========
window.saveTrackingChanges = function() {
    if (!currentOrder) return;
    
    const newTrackingId = document.getElementById('editTrackingId').value.trim();
    
    const updates = {
        trackingId: newTrackingId || null
    };
    
    db.collection('orders').doc(currentOrder.id).update(updates)
        .then(() => {
            showToast('Tracking updated');
            currentOrder.trackingId = newTrackingId;
            loadOrders();
        })
        .catch(err => {
            console.error('Error updating tracking:', err);
            showToast('Error updating tracking');
        });
};

// ========== Show Add Event Modal ==========
window.showAddEventModal = function() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    document.getElementById('eventTime').value = `${year}-${month}-${day}T${hours}:${minutes}`;
    document.getElementById('eventStatus').value = '';
    document.getElementById('eventLocation').value = '';
    
    addEventModal.classList.add('show');
};

// ========== Save Event ==========
saveEvent.addEventListener('click', () => {
    if (!currentOrder) return;
    
    const status = document.getElementById('eventStatus').value.trim();
    const location = document.getElementById('eventLocation').value.trim();
    const time = document.getElementById('eventTime').value;
    
    if (!status || !location || !time) {
        showToast('Please fill all fields');
        return;
    }
    
    const events = currentOrder.trackingEvents || [];
    events.push({
        status,
        location,
        time: new Date(time).toISOString(),
        completed: true
    });
    
    db.collection('orders').doc(currentOrder.id).update({
        trackingEvents: events
    }).then(() => {
        addEventModal.classList.remove('show');
        currentOrder.trackingEvents = events;
        openTrackingModal(currentOrder.id);
        showToast('Event added');
        loadOrders();
    }).catch(err => {
        console.error('Error adding event:', err);
        showToast('Error adding event');
    });
});

// ========== Edit Event ==========
window.editTrackingEvent = function(index) {
    currentEventIndex = index;
    const event = currentOrder.trackingEvents[index];
    
    const time = new Date(event.time);
    const year = time.getFullYear();
    const month = String(time.getMonth() + 1).padStart(2, '0');
    const day = String(time.getDate()).padStart(2, '0');
    const hours = String(time.getHours()).padStart(2, '0');
    const minutes = String(time.getMinutes()).padStart(2, '0');
    
    document.getElementById('editEventStatus').value = event.status;
    document.getElementById('editEventLocation').value = event.location;
    document.getElementById('editEventTime').value = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    editEventModal.classList.add('show');
};

// ========== Save Edit Event ==========
saveEditEvent.addEventListener('click', () => {
    if (!currentOrder || currentEventIndex === null) return;
    
    const status = document.getElementById('editEventStatus').value.trim();
    const location = document.getElementById('editEventLocation').value.trim();
    const time = document.getElementById('editEventTime').value;
    
    if (!status || !location || !time) {
        showToast('Please fill all fields');
        return;
    }
    
    const events = [...currentOrder.trackingEvents];
    events[currentEventIndex] = {
        status,
        location,
        time: new Date(time).toISOString(),
        completed: true
    };
    
    db.collection('orders').doc(currentOrder.id).update({
        trackingEvents: events
    }).then(() => {
        editEventModal.classList.remove('show');
        currentOrder.trackingEvents = events;
        openTrackingModal(currentOrder.id);
        showToast('Event updated');
        loadOrders();
        currentEventIndex = null;
    }).catch(err => {
        console.error('Error updating event:', err);
        showToast('Error updating event');
    });
});

// ========== Delete Event ==========
window.deleteTrackingEvent = function(index) {
    currentEventIndex = index;
    deleteModal.classList.add('show');
};

confirmDelete.addEventListener('click', () => {
    if (!currentOrder || currentEventIndex === null) return;
    
    const events = currentOrder.trackingEvents.filter((_, i) => i !== currentEventIndex);
    
    db.collection('orders').doc(currentOrder.id).update({
        trackingEvents: events
    }).then(() => {
        deleteModal.classList.remove('show');
        currentOrder.trackingEvents = events;
        openTrackingModal(currentOrder.id);
        showToast('Event deleted');
        loadOrders();
        currentEventIndex = null;
    }).catch(err => {
        console.error('Error deleting event:', err);
        showToast('Error deleting event');
    });
});

// ========== Search ==========
searchInput.addEventListener('input', () => {
    const term = searchInput.value.trim();
    clearSearch.style.display = term ? 'block' : 'none';
    
    if (searchTimeout) clearTimeout(searchTimeout);
    
    searchTimeout = setTimeout(() => {
        if (term.length < 2) {
            filteredOrders = allOrders;
            renderOrders();
            suggestions.classList.remove('show');
            return;
        }
        
        const filtered = allOrders.filter(order => 
            (order.orderId && order.orderId.toLowerCase().includes(term.toLowerCase())) ||
            (order.trackingId && order.trackingId.toLowerCase().includes(term.toLowerCase())) ||
            (order.customerPhone && order.customerPhone.includes(term))
        );
        
        if (filtered.length === 0) {
            suggestions.classList.remove('show');
            filteredOrders = filtered;
            renderOrders();
            return;
        }
        
        let suggestionHtml = '';
        filtered.slice(0, 5).forEach(order => {
            const orderIdDisplay = order.orderId || order.id.slice(-8);
            suggestionHtml += `
                <div class="suggestion-item" onclick="selectOrder('${order.id}')">
                    <div class="suggestion-info">
                        <div class="suggestion-order">#${orderIdDisplay}</div>
                        <div class="suggestion-customer">${escapeHtml(order.customerName || 'Unknown')}</div>
                    </div>
                </div>
            `;
        });
        
        suggestions.innerHTML = suggestionHtml;
        suggestions.classList.add('show');
    }, 300);
});

// ========== Select Order ==========
window.selectOrder = function(orderId) {
    searchInput.value = '';
    clearSearch.style.display = 'none';
    suggestions.classList.remove('show');
    
    filteredOrders = allOrders.filter(o => o.id === orderId);
    renderOrders();
};

// ========== Clear Search ==========
clearSearch.addEventListener('click', () => {
    searchInput.value = '';
    clearSearch.style.display = 'none';
    suggestions.classList.remove('show');
    filteredOrders = allOrders;
    renderOrders();
});

// ========== Close Modals ==========
closeModal.addEventListener('click', () => trackingModal.classList.remove('show'));
closeModalBtn.addEventListener('click', () => trackingModal.classList.remove('show'));
trackingModal.addEventListener('click', (e) => {
    if (e.target === trackingModal) trackingModal.classList.remove('show');
});

cancelAddEvent.addEventListener('click', () => addEventModal.classList.remove('show'));
cancelEditEvent.addEventListener('click', () => editEventModal.classList.remove('show'));
cancelDelete.addEventListener('click', () => deleteModal.classList.remove('show'));

// ========== Refresh ==========
refreshBtn.addEventListener('click', () => {
    loadOrders();
    showToast('Refreshed');
});

// ========== Helper Functions ==========
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ========== Navigation ==========
backBtn.addEventListener('click', () => window.location.href = 'admin-index.html');

navItems.forEach(item => {
    item.addEventListener('click', function() {
        const page = this.dataset.page;
        if (page) window.location.href = page;
    });
});

console.log('✅ Admin Tracking ready');