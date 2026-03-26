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
const loginLogo = document.getElementById('loginLogo');
const adminName = document.getElementById('adminName');
const notificationIcon = document.getElementById('notificationIcon');
const profileIcon = document.getElementById('profileIcon');

// Login Modal
const loginModal = document.getElementById('loginModal');
const loginTabBtn = document.getElementById('loginTabBtn');
const signupTabBtn = document.getElementById('signupTabBtn');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginSubmitBtn = document.getElementById('loginSubmitBtn');
const signupSubmitBtn = document.getElementById('signupSubmitBtn');
const loginCancelBtn = document.getElementById('loginCancelBtn');
const signupCancelBtn = document.getElementById('signupCancelBtn');

// Login Fields
const loginPhone = document.getElementById('loginPhone');
const loginPassword = document.getElementById('loginPassword');
const loginPhoneError = document.getElementById('loginPhoneError');
const loginPasswordError = document.getElementById('loginPasswordError');
const toggleLoginPassword = document.getElementById('toggleLoginPassword');

// Signup Fields
const signupName = document.getElementById('signupName');
const signupPhone = document.getElementById('signupPhone');
const signupPassword = document.getElementById('signupPassword');
const signupRePassword = document.getElementById('signupRePassword');
const signupNameError = document.getElementById('signupNameError');
const signupPhoneError = document.getElementById('signupPhoneError');
const signupPasswordError = document.getElementById('signupPasswordError');
const signupRePasswordError = document.getElementById('signupRePasswordError');
const toggleSignupPassword = document.getElementById('toggleSignupPassword');
const toggleSignupRePassword = document.getElementById('toggleSignupRePassword');

// Stats Elements
const totalProducts = document.getElementById('totalProducts');
const totalOrders = document.getElementById('totalOrders');
const totalUsers = document.getElementById('totalUsers');
const pendingOrders = document.getElementById('pendingOrders');

// Action Buttons
const addItemsBtn = document.getElementById('addItemsBtn');
const showItemsBtn = document.getElementById('showItemsBtn');
const addBannerBtn = document.getElementById('addBannerBtn');
const userDetailsBtn = document.getElementById('userDetailsBtn');
const userHistoryBtn = document.getElementById('userHistoryBtn');
const userOrdersBtn = document.getElementById('userOrdersBtn');
const userAlertsBtn = document.getElementById('userAlertsBtn');
const adminTrackingBtn = document.getElementById('adminTrackingBtn');
const navItems = document.querySelectorAll('.nav-item');

// Modal
const customModal = document.getElementById('customModal');
const modalIcon = document.getElementById('modalIcon');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const modalButtons = document.getElementById('modalButtons');

// Toast
const toast = document.getElementById('toast');

// Global Variables
let currentAdmin = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin page loaded');
    loadLogo();
    checkLoginStatus();
    loadStats();
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
        loginLogo.src = url;
    } catch (error) {
        console.log('Using default logo');
        adminLogo.src = '/IMG_20260313_225034.png';
        loginLogo.src = '/IMG_20260313_225034.png';
    }
}

// Check login status
function checkLoginStatus() {
    const admin = localStorage.getItem('currentAdmin');
    if (admin) {
        currentAdmin = JSON.parse(admin);
        console.log('Admin logged in:', currentAdmin);
        adminName.textContent = currentAdmin.name || 'Admin';
        loginModal.classList.remove('show');
        mainContent.style.display = 'block';
    } else {
        showLoginModal();
    }
}

// Show login modal
function showLoginModal() {
    loginModal.classList.add('show');
    mainContent.style.display = 'none';
}

// Load stats
async function loadStats() {
    try {
        // Products count
        const productsSnap = await db.collection('items').get();
        totalProducts.textContent = productsSnap.size;

        // Orders count
        const ordersSnap = await db.collection('orders').get();
        totalOrders.textContent = ordersSnap.size;

        // Users count
        const usersSnap = await db.collection('users').get();
        totalUsers.textContent = usersSnap.size;

        // Pending orders
        const pendingSnap = await db.collection('orders').where('status', '==', 'pending').get();
        pendingOrders.textContent = pendingSnap.size;

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Validate Sri Lankan phone
function validatePhone(phone) {
    const phoneRegex = /^[0-9]{9}$/;
    return phoneRegex.test(phone);
}

// Validate password
function validatePassword(password) {
    // At least 1 capital letter, 4 small letters, 4 numbers, optional @
    const capitalRegex = /[A-Z]/;
    const smallRegex = /[a-z]{4,}/;
    const numberRegex = /[0-9]{4,}/;
    
    return capitalRegex.test(password) && 
           smallRegex.test(password) && 
           numberRegex.test(password);
}

// Password strength indicator
function getPasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[@]/.test(password)) strength++;
    
    if (strength <= 2) return 'Weak';
    if (strength <= 4) return 'Medium';
    return 'Strong';
}

// Toggle password visibility
toggleLoginPassword.addEventListener('click', function() {
    const type = loginPassword.type === 'password' ? 'text' : 'password';
    loginPassword.type = type;
    this.classList.toggle('fa-eye');
    this.classList.toggle('fa-eye-slash');
});

toggleSignupPassword.addEventListener('click', function() {
    const type = signupPassword.type === 'password' ? 'text' : 'password';
    signupPassword.type = type;
    this.classList.toggle('fa-eye');
    this.classList.toggle('fa-eye-slash');
});

toggleSignupRePassword.addEventListener('click', function() {
    const type = signupRePassword.type === 'password' ? 'text' : 'password';
    signupRePassword.type = type;
    this.classList.toggle('fa-eye');
    this.classList.toggle('fa-eye-slash');
});

// Handle login
async function handleLogin() {
    console.log('Login attempt');
    
    // Validate phone
    const phone = loginPhone.value.replace(/\s/g, '');
    if (!phone) {
        loginPhoneError.textContent = 'Phone number is required';
        return;
    } else if (!validatePhone(phone)) {
        loginPhoneError.textContent = 'Enter a valid 9-digit number';
        return;
    } else {
        loginPhoneError.textContent = '';
    }
    
    // Validate password
    if (!loginPassword.value) {
        loginPasswordError.textContent = 'Password is required';
        return;
    } else {
        loginPasswordError.textContent = '';
    }
    
    try {
        const adminsRef = db.collection('admins');
        const snapshot = await adminsRef
            .where('phone', '==', phone)
            .where('password', '==', loginPassword.value)
            .get();
        
        if (snapshot.empty) {
            // Check if phone exists with different password
            const phoneCheck = await adminsRef.where('phone', '==', phone).get();
            
            if (!phoneCheck.empty) {
                const userData = phoneCheck.docs[0].data();
                
                if (userData.status === 'pending') {
                    showModal(
                        'warning',
                        'Pending Approval',
                        'This account is already registered and pending verification. Please wait for agent to contact you.',
                        [ { text: 'OK', type: 'primary', action: closeModal } ]
                    );
                } else if (userData.status === 'active') {
                    showModal(
                        'error',
                        'Invalid Password',
                        'The password you entered is incorrect.',
                        [ { text: 'Try Again', type: 'primary', action: closeModal } ]
                    );
                }
            } else {
                showModal(
                    'error',
                    'Not Registered',
                    'This number is not registered. Please sign up first.',
                    [
                        { text: 'Try Again', type: 'primary', action: closeModal },
                        { text: 'Sign Up', type: 'secondary', action: () => {
                            closeModal();
                            signupTabBtn.click();
                        }}
                    ]
                );
            }
            return;
        }
        
        const adminData = snapshot.docs[0].data();
        
        if (adminData.status === 'pending') {
            showModal(
                'warning',
                'Pending Approval',
                'This account is pending verification. Please wait for agent to contact you.',
                [ { text: 'OK', type: 'primary', action: closeModal } ]
            );
            return;
        }
        
        // Login successful
        currentAdmin = {
            id: snapshot.docs[0].id,
            name: adminData.name,
            phone: adminData.phone,
            status: adminData.status
        };
        
        localStorage.setItem('currentAdmin', JSON.stringify(currentAdmin));
        
        showModal(
            'success',
            'Login Successful!',
            'Welcome to CZone Admin Panel',
            [ { text: 'OK', type: 'primary', action: () => {
                closeModal();
                loginModal.classList.remove('show');
                mainContent.style.display = 'block';
                adminName.textContent = adminData.name;
                loadStats();
            }} ]
        );
        
        // Clear login fields
        loginPhone.value = '';
        loginPassword.value = '';
        
    } catch (error) {
        console.error('Login error:', error);
        showToast('Error during login');
    }
}

// Handle signup
async function handleSignup() {
    console.log('Signup attempt');
    
    // Validate name
    const name = signupName.value.trim();
    if (!name) {
        signupNameError.textContent = 'Username is required';
        return;
    } else if (name.length < 3) {
        signupNameError.textContent = 'Name must be at least 3 characters';
        return;
    } else {
        signupNameError.textContent = '';
    }
    
    // Validate phone
    const phone = signupPhone.value.replace(/\s/g, '');
    if (!phone) {
        signupPhoneError.textContent = 'Phone number is required';
        return;
    } else if (!validatePhone(phone)) {
        signupPhoneError.textContent = 'Enter a valid 9-digit number';
        return;
    } else {
        signupPhoneError.textContent = '';
    }
    
    // Validate password
    const password = signupPassword.value;
    if (!password) {
        signupPasswordError.textContent = 'Password is required';
        return;
    } else if (!validatePassword(password)) {
        signupPasswordError.textContent = 'Password must have: 1 capital, 4 small, 4 numbers';
        return;
    } else {
        signupPasswordError.textContent = '';
    }
    
    // Validate re-password
    if (password !== signupRePassword.value) {
        signupRePasswordError.textContent = 'Passwords do not match';
        return;
    } else {
        signupRePasswordError.textContent = '';
    }
    
    try {
        const adminsRef = db.collection('admins');
        
        // Check if phone already exists
        const existing = await adminsRef.where('phone', '==', phone).get();
        
        if (!existing.empty) {
            const userData = existing.docs[0].data();
            
            if (userData.status === 'pending') {
                showModal(
                    'info',
                    'Pending Registration',
                    'This number is already registered and pending verification.',
                    [ { text: 'OK', type: 'primary', action: closeModal } ]
                );
            } else if (userData.status === 'active') {
                showModal(
                    'info',
                    'Already Registered',
                    'This number is already registered. Please login instead.',
                    [ { text: 'Go to Login', type: 'primary', action: () => {
                        closeModal();
                        loginTabBtn.click();
                        loginPhone.value = phone;
                    }} ]
                );
            }
            return;
        }
        
        // Create new admin with pending status
        await adminsRef.add({
            name: name,
            phone: phone,
            password: password,
            status: 'pending',
            role: 'admin',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showModal(
            'success',
            'Registration Successful!',
            'Your information has been submitted. Agent will verify and activate your account soon.',
            [ { text: 'OK', type: 'primary', action: () => {
                closeModal();
                loginTabBtn.click();
                clearSignupFields();
            }} ]
        );
        
    } catch (error) {
        console.error('Signup error:', error);
        showToast('Error during registration');
    }
}

// Clear signup fields
function clearSignupFields() {
    signupName.value = '';
    signupPhone.value = '';
    signupPassword.value = '';
    signupRePassword.value = '';
}

// Show custom modal
function showModal(type, title, message, buttons) {
    let iconHtml = '';
    if (type === 'success') {
        iconHtml = '<i class="fas fa-check-circle" style="color: #28a745;"></i>';
    } else if (type === 'error') {
        iconHtml = '<i class="fas fa-times-circle" style="color: #dc3545;"></i>';
    } else if (type === 'warning') {
        iconHtml = '<i class="fas fa-exclamation-triangle" style="color: #ffc107;"></i>';
    } else if (type === 'info') {
        iconHtml = '<i class="fas fa-info-circle" style="color: #17a2b8;"></i>';
    }
    
    modalIcon.innerHTML = iconHtml;
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    
    modalButtons.innerHTML = '';
    buttons.forEach(btn => {
        const button = document.createElement('button');
        button.className = `modal-btn ${btn.type}`;
        button.textContent = btn.text;
        button.addEventListener('click', btn.action);
        modalButtons.appendChild(button);
    });
    
    customModal.classList.add('show');
}

// Close modal
function closeModal() {
    customModal.classList.remove('show');
}

// Show toast
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

// Setup event listeners
function setupEventListeners() {
    // Tab switching
    loginTabBtn.addEventListener('click', () => {
        loginTabBtn.classList.add('active');
        signupTabBtn.classList.remove('active');
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
    });
    
    signupTabBtn.addEventListener('click', () => {
        signupTabBtn.classList.add('active');
        loginTabBtn.classList.remove('active');
        signupForm.classList.add('active');
        loginForm.classList.remove('active');
    });
    
    // Login submit
    loginSubmitBtn.addEventListener('click', handleLogin);
    
    // Signup submit
    signupSubmitBtn.addEventListener('click', handleSignup);
    
    // Cancel buttons
    loginCancelBtn.addEventListener('click', () => {
        showModal(
            'question',
            'Confirm Exit',
            'Are you sure you want to cancel?',
            [
                { text: 'Yes', type: 'danger', action: () => {
                    closeModal();
                    loginPhone.value = '';
                    loginPassword.value = '';
                }},
                { text: 'No', type: 'secondary', action: closeModal }
            ]
        );
    });
    
    signupCancelBtn.addEventListener('click', () => {
        showModal(
            'question',
            'Confirm Exit',
            'Are you sure you want to cancel?',
            [
                { text: 'Yes', type: 'danger', action: () => {
                    closeModal();
                    clearSignupFields();
                }},
                { text: 'No', type: 'secondary', action: closeModal }
            ]
        );
    });
    
    // Enter key for login
    loginPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
    
    // Navigation buttons
    addItemsBtn.addEventListener('click', () => {
        window.location.href = 'add-items.html';
    });
    
    showItemsBtn.addEventListener('click', () => {
        window.location.href = 'show-items.html';
    });
    
    addBannerBtn.addEventListener('click', () => {
        window.location.href = 'add-banner.html';
    });
    
    userDetailsBtn.addEventListener('click', () => {
        window.location.href = 'user-details.html';
    });
    
    userHistoryBtn.addEventListener('click', () => {
        window.location.href = 'admin-user-history.html';
    });
    
    userOrdersBtn.addEventListener('click', () => {
        window.location.href = 'user-orders.html';
    });
    
    userAlertsBtn.addEventListener('click', () => {
        window.location.href = 'admin-alert.html';
    });
    
    adminTrackingBtn.addEventListener('click', () => {
        window.location.href = 'admin-tracking.html';
    });
    
    profileIcon.addEventListener('click', () => {
        window.location.href = 'admin-account.html';
    });
    
    notificationIcon.addEventListener('click', () => {
        showToast('No new notifications');
    });
    
    // Bottom navigation
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.dataset.page;
            if (page) {
                window.location.href = page;
            }
        });
    });
    
    // Close modal when clicking outside
    customModal.addEventListener('click', (e) => {
        if (e.target === customModal) {
            closeModal();
        }
    });
}

// Password strength checker (optional)
signupPassword.addEventListener('input', function() {
    const strength = getPasswordStrength(this.value);
    if (this.value.length > 0) {
        let hint = document.querySelector('.password-hint small');
        if (!hint) {
            hint = document.createElement('small');
            document.querySelector('.password-hint').appendChild(hint);
        }
        hint.textContent = `Password strength: ${strength}`;
        hint.style.color = strength === 'Weak' ? '#dc3545' : 
                          strength === 'Medium' ? '#ffc107' : '#28a745';
    }
});
