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

// ========== HIDE LOADING IMMEDIATELY (MOST IMPORTANT) ==========
(function() {
    console.log('🔴 Force hide loading script started');
    
    // Method 1: Direct hide after 1 second
    setTimeout(() => {
        const loading = document.getElementById('loading');
        const mainContent = document.getElementById('mainContent');
        
        console.log('⏰ Timeout 1: Trying to hide loading');
        
        if (loading) {
            loading.classList.add('hide');
            console.log('✅ Loading hidden by timeout');
        } else {
            console.log('❌ Loading element not found');
            // Create style to hide it
            const style = document.createElement('style');
            style.textContent = '#loading { display: none !important; }';
            document.head.appendChild(style);
            console.log('✅ Fallback style added');
        }
        
        if (mainContent) {
            mainContent.style.display = 'block';
        }
    }, 1000);
    
    // Method 2: Backup hide after 3 seconds
    setTimeout(() => {
        const loading = document.getElementById('loading');
        if (loading && !loading.classList.contains('hide')) {
            loading.classList.add('hide');
            console.log('✅ Backup hide after 3s');
        }
    }, 3000);
    
    // Method 3: On DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            const loading = document.getElementById('loading');
            if (loading) loading.classList.add('hide');
            const mainContent = document.getElementById('mainContent');
            if (mainContent) mainContent.style.display = 'block';
            console.log('✅ Hide on DOM ready');
        }, 500);
    });
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
const selectedUserInfo = document.getElementById('selectedUserInfo');
const selectedUserName = document.getElementById('selectedUserName');
const selectedUserPhone = document.getElementById('selectedUserPhone');
const clearUserBtn = document.getElementById('clearUserBtn');
const filterTabs = document.querySelectorAll('.filter-tab');
const totalItems = document.getElementById('totalItems');
const uniqueItems = document.getElementById('uniqueItems');
const noData = document.getElementById('noData');
const historyList = document.getElementById('historyList');
const navItems = document.querySelectorAll('.nav-item');
const toast = document.getElementById('toast');

// ========== State ==========
let currentAdmin = null;
let allHistory = [];
let filteredHistory = [];
let allUsers = [];
let selectedUserId = null;
let currentFilter = 'all';
let searchTimeout = null;

// ========== Check Admin Login ==========
function checkAdminLogin() {
    const admin = localStorage.getItem('currentAdmin');
    if (!admin) {
        window.location.href = 'admin-index.html';
        return false;
    }
    try {
        currentAdmin = JSON.parse(admin);
        return true;
    } catch (e) {
        window.location.href = 'admin-index.html';
        return false;
    }
}

// ========== Load Logo ==========
async function loadLogo() {
    try {
        const url = await storage.ref('logo/logo.png').getDownloadURL();
        if (adminLogo) adminLogo.src = url;
    } catch {
        if (adminLogo) adminLogo.src = 'https://via.placeholder.com/40x40?text=CZ';
    }
}

// ========== Load All Users ==========
function loadAllUsers() {
    db.collection('users').get()
        .then(snapshot => {
            allUsers = snapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name || 'Unknown',
                phone: doc.data().phone || ''
            }));
            console.log('Users loaded:', allUsers.length);
        })
        .catch(err => console.error('Error loading users:', err));
}

// ========== Load All History ==========
function loadAllHistory() {
    console.log('Loading history...');
    let allHistoryData = [];
    
    // First try to get from localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('history_')) {
            try {
                const userId = key.replace('history_', '');
                const userHistory = JSON.parse(localStorage.getItem(key));
                
                // Get user details from allUsers (might be empty, so we'll fill later)
                userHistory.forEach(item => {
                    allHistoryData.push({
                        ...item,
                        userId: userId,
                        userName: 'Loading...',
                        userPhone: 'Loading...'
                    });
                });
            } catch (e) {
                console.log('Error parsing history:', e);
            }
        }
    }
    
    console.log('Initial history loaded:', allHistoryData.length);
    
    // If no history, create sample data
    if (allHistoryData.length === 0) {
        console.log('No history found, creating sample data');
        allHistoryData = [
            {
                id: 'sample1',
                title: 'Samsung Galaxy S21',
                price: 45000,
                category: 'electronics',
                image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=200',
                userId: 'sample1',
                userName: 'John Doe',
                userPhone: '0771234567',
                timestamp: new Date().toISOString()
            },
            {
                id: 'sample2',
                title: 'Casual T-Shirt',
                price: 1500,
                category: 'fashion',
                image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=200',
                userId: 'sample2',
                userName: 'Jane Smith',
                userPhone: '0772345678',
                timestamp: new Date(Date.now() - 86400000).toISOString()
            },
            {
                id: 'sample3',
                title: 'Wireless Headphones',
                price: 8500,
                category: 'electronics',
                image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200',
                userId: 'sample3',
                userName: 'Mike Johnson',
                userPhone: '0773456789',
                timestamp: new Date(Date.now() - 172800000).toISOString()
            }
        ];
    }
    
    // Load user details
    db.collection('users').get()
        .then(snapshot => {
            const userMap = {};
            snapshot.forEach(doc => {
                userMap[doc.id] = {
                    name: doc.data().name || 'Unknown',
                    phone: doc.data().phone || ''
                };
            });
            
            // Update user details
            allHistoryData = allHistoryData.map(item => ({
                ...item,
                userName: userMap[item.userId]?.name || item.userName || 'Unknown',
                userPhone: userMap[item.userId]?.phone || item.userPhone || 'No phone'
            }));
            
            allHistory = allHistoryData;
            filterAndDisplay();
        })
        .catch(err => {
            console.error('Error loading user details:', err);
            allHistory = allHistoryData;
            filterAndDisplay();
        });
}

// ========== Filter and Display ==========
function filterAndDisplay() {
    console.log('Filtering history, total:', allHistory.length);
    let filtered = allHistory;
    
    // Filter by selected user
    if (selectedUserId) {
        filtered = filtered.filter(item => item.userId === selectedUserId);
    }
    
    // Filter by time
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    switch(currentFilter) {
        case 'today':
            filtered = filtered.filter(item => new Date(item.timestamp) >= today);
            break;
        case 'week':
            filtered = filtered.filter(item => new Date(item.timestamp) >= weekAgo);
            break;
        case 'month':
            filtered = filtered.filter(item => new Date(item.timestamp) >= monthAgo);
            break;
        default:
            break;
    }
    
    // Sort by timestamp
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    filteredHistory = filtered;
    
    // Update stats
    if (totalItems) totalItems.textContent = filtered.length;
    const uniqueProducts = new Set(filtered.map(item => item.id)).size;
    if (uniqueItems) uniqueItems.textContent = uniqueProducts;
    
    // Render
    if (filtered.length === 0) {
        if (noData) noData.classList.add('show');
        if (historyList) historyList.innerHTML = '';
    } else {
        if (noData) noData.classList.remove('show');
        renderHistory();
    }
}

// ========== Render History ==========
function renderHistory() {
    if (!historyList) return;
    
    let html = '';
    
    filteredHistory.forEach(item => {
        const date = new Date(item.timestamp);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        const formattedTime = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        html += `
            <div class="history-card">
                <img src="${item.image || 'https://via.placeholder.com/70'}" class="history-image" onerror="this.src='https://via.placeholder.com/70'">
                <div class="history-info">
                    <div class="history-title">${escapeHtml(item.title || 'Unknown Product')}</div>
                    <div class="history-meta">
                        <span>Rs. ${item.price || 0}</span>
                        ${item.category ? `<span>${escapeHtml(item.category)}</span>` : ''}
                    </div>
                    <div class="history-user">
                        <i class="fas fa-user"></i> ${escapeHtml(item.userName || 'Unknown')} (${item.userPhone || 'No phone'})
                    </div>
                    <div class="history-time">
                        <i class="far fa-calendar"></i> ${formattedDate}
                        <i class="far fa-clock"></i> ${formattedTime}
                    </div>
                </div>
            </div>
        `;
    });
    
    historyList.innerHTML = html;
}

// ========== Search Suggestions ==========
if (searchInput) {
    searchInput.addEventListener('input', () => {
        const term = searchInput.value.trim();
        if (clearSearch) clearSearch.style.display = term ? 'block' : 'none';
        
        if (searchTimeout) clearTimeout(searchTimeout);
        
        searchTimeout = setTimeout(() => {
            if (term.length < 2 || !suggestions || allUsers.length === 0) {
                suggestions.classList.remove('show');
                return;
            }
            
            const filtered = allUsers.filter(user => 
                user.phone && user.phone.includes(term)
            );
            
            if (filtered.length === 0) {
                suggestions.classList.remove('show');
                return;
            }
            
            let html = '';
            filtered.forEach(user => {
                const userHistory = allHistory.filter(item => item.userId === user.id);
                html += `
                    <div class="suggestion-item" data-user-id="${user.id}" data-user-name="${escapeHtml(user.name)}" data-user-phone="${user.phone}">
                        <div class="suggestion-avatar">${user.name ? user.name.charAt(0).toUpperCase() : '?'}</div>
                        <div class="suggestion-info">
                            <span class="suggestion-name">${escapeHtml(user.name)}</span>
                            <span class="suggestion-phone">${user.phone}</span>
                        </div>
                        <span class="suggestion-count">${userHistory.length} views</span>
                    </div>
                `;
            });
            
            suggestions.innerHTML = html;
            suggestions.classList.add('show');
        }, 300);
    });
}

// ========== Select User ==========
if (suggestions) {
    suggestions.addEventListener('click', (e) => {
        const item = e.target.closest('.suggestion-item');
        if (!item) return;
        
        selectedUserId = item.dataset.userId;
        if (selectedUserName) selectedUserName.textContent = item.dataset.userName;
        if (selectedUserPhone) selectedUserPhone.textContent = item.dataset.userPhone;
        if (selectedUserInfo) selectedUserInfo.style.display = 'flex';
        
        if (searchInput) searchInput.value = '';
        if (clearSearch) clearSearch.style.display = 'none';
        suggestions.classList.remove('show');
        
        filterAndDisplay();
    });
}

// ========== Clear User ==========
if (clearUserBtn) {
    clearUserBtn.addEventListener('click', () => {
        selectedUserId = null;
        if (selectedUserInfo) selectedUserInfo.style.display = 'none';
        filterAndDisplay();
    });
}

// ========== Clear Search ==========
if (clearSearch) {
    clearSearch.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        clearSearch.style.display = 'none';
        if (suggestions) suggestions.classList.remove('show');
    });
}

// ========== Filter Tabs ==========
filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.dataset.filter;
        filterAndDisplay();
    });
});

// ========== Refresh ==========
if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
        loadAllHistory();
        showToast('History refreshed');
    });
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
function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ========== Close Suggestions ==========
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-section') && suggestions) {
        suggestions.classList.remove('show');
    }
});

// ========== Initialize ==========
if (checkAdminLogin()) {
    loadLogo();
    loadAllUsers();
    loadAllHistory();
}

// ========== Navigation ==========
if (backBtn) {
    backBtn.addEventListener('click', () => window.location.href = 'admin-index.html');
}

navItems.forEach(item => {
    item.addEventListener('click', function() {
        const page = this.dataset.page;
        if (page) window.location.href = page;
    });
});