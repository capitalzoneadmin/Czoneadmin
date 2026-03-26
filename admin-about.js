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

console.log('🚀 About page loaded');

// ========== Force Hide Loading ==========
setTimeout(() => {
    const loading = document.getElementById('loading');
    if (loading) loading.classList.add('hide');
    const mainContent = document.getElementById('mainContent');
    if (mainContent) mainContent.style.display = 'block';
}, 2000);

// ========== DOM Elements ==========
const loading = document.getElementById('loading');
const mainContent = document.getElementById('mainContent');
const backBtn = document.getElementById('backBtn');
const homeIcon = document.getElementById('homeIcon');
const heroImage = document.getElementById('heroImage');
const heroTitle = document.getElementById('heroTitle');
const heroSubtitle = document.getElementById('heroSubtitle');
const contentSections = document.getElementById('contentSections');
const teamGrid = document.getElementById('teamGrid');
const customerCount = document.getElementById('customerCount');
const orderCount = document.getElementById('orderCount');
const deliveryCount = document.getElementById('deliveryCount');
const contactAddress = document.getElementById('contactAddress');
const contactPhone = document.getElementById('contactPhone');
const contactEmail = document.getElementById('contactEmail');
const contactHours = document.getElementById('contactHours');
const navItems = document.querySelectorAll('.nav-item');
const toast = document.getElementById('toast');

// ========== Initialize ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('About page initializing...');
    loadAboutContent();
    loadStats();
    setupEventListeners();
});

// ========== Load About Content from Firebase ==========
async function loadAboutContent() {
    console.log('Loading about content...');
    
    try {
        // Load about document
        const aboutDoc = await db.collection('settings').doc('about').get();
        
        if (aboutDoc.exists) {
            const data = aboutDoc.data();
            console.log('About data loaded:', data);
            
            // Update hero section
            if (data.heroImage) {
                heroImage.src = data.heroImage;
            } else {
                heroImage.src = '/IMG_20260313_225034.png';
            }
            
            if (data.heroTitle) heroTitle.textContent = data.heroTitle;
            if (data.heroSubtitle) heroSubtitle.textContent = data.heroSubtitle;
            
            // Update content sections
            if (data.sections && data.sections.length > 0) {
                renderContentSections(data.sections);
            } else {
                // Default content
                renderDefaultContent();
            }
            
            // Update team members
            if (data.team && data.team.length > 0) {
                renderTeamMembers(data.team);
            } else {
                renderDefaultTeam();
            }
            
            // Update contact info
            if (data.contact) {
                if (data.contact.address) contactAddress.textContent = data.contact.address;
                if (data.contact.phone) contactPhone.textContent = data.contact.phone;
                if (data.contact.email) contactEmail.textContent = data.contact.email;
                if (data.contact.hours) contactHours.textContent = data.contact.hours;
            }
        } else {
            console.log('No about document found, using defaults');
            renderDefaultContent();
            renderDefaultTeam();
        }
        
    } catch (error) {
        console.error('Error loading about content:', error);
        renderDefaultContent();
        renderDefaultTeam();
        showToast('Error loading content');
    }
}

// ========== Render Content Sections ==========
function renderContentSections(sections) {
    let html = '';
    
    sections.forEach(section => {
        html += `
            <div class="content-block">
                <h2>${escapeHtml(section.title || '')}</h2>
                ${section.content ? `<p>${escapeHtml(section.content)}</p>` : ''}
                ${section.list ? renderList(section.list) : ''}
            </div>
        `;
    });
    
    contentSections.innerHTML = html;
}

function renderList(items) {
    if (!items || items.length === 0) return '';
    
    let listHtml = '<ul>';
    items.forEach(item => {
        listHtml += `<li>${escapeHtml(item)}</li>`;
    });
    listHtml += '</ul>';
    
    return listHtml;
}

// ========== Render Team Members ==========
function renderTeamMembers(team) {
    let html = '';
    
    team.forEach(member => {
        html += `
            <div class="team-card">
                <div class="team-avatar">
                    <img src="${member.image || 'https://via.placeholder.com/80'}" alt="${member.name}">
                </div>
                <div class="team-name">${escapeHtml(member.name || '')}</div>
                <div class="team-position">${escapeHtml(member.position || '')}</div>
                <div class="team-social">
                    ${member.facebook ? `<a href="${member.facebook}" target="_blank"><i class="fab fa-facebook"></i></a>` : ''}
                    ${member.instagram ? `<a href="${member.instagram}" target="_blank"><i class="fab fa-instagram"></i></a>` : ''}
                    ${member.linkedin ? `<a href="${member.linkedin}" target="_blank"><i class="fab fa-linkedin"></i></a>` : ''}
                </div>
            </div>
        `;
    });
    
    teamGrid.innerHTML = html;
}

// ========== Load Stats ==========
async function loadStats() {
    try {
        // Get user count
        const usersSnap = await db.collection('users').get();
        customerCount.textContent = usersSnap.size;
        
        // Get order count
        const ordersSnap = await db.collection('orders').get();
        orderCount.textContent = ordersSnap.size;
        
        // Delivery cities count (example)
        deliveryCount.textContent = '25+';
        
    } catch (error) {
        console.error('Error loading stats:', error);
        customerCount.textContent = '1000+';
        orderCount.textContent = '500+';
        deliveryCount.textContent = '25+';
    }
}

// ========== Default Content ==========
function renderDefaultContent() {
    const defaultSections = [
        {
            title: 'Our Story',
            content: 'Capital Zone was founded in 2020 with a mission to provide the best online shopping experience in Sri Lanka. We offer a wide range of products including electronics, fashion, home appliances, and more.'
        },
        {
            title: 'Our Mission',
            content: 'To deliver quality products at affordable prices with exceptional customer service. We believe in making shopping easy, convenient, and enjoyable for everyone in Sri Lanka.'
        },
        {
            title: 'Why Choose Us',
            list: [
                'Wide selection of products',
                'Competitive prices',
                'Fast delivery across Sri Lanka',
                'Secure payments',
                '24/7 customer support',
                'Easy returns'
            ]
        }
    ];
    
    renderContentSections(defaultSections);
}

function renderDefaultTeam() {
    const defaultTeam = [
        {
            name: 'John Doe',
            position: 'Founder & CEO',
            image: 'https://via.placeholder.com/80',
            facebook: '#',
            instagram: '#',
            linkedin: '#'
        },
        {
            name: 'Jane Smith',
            position: 'Operations Manager',
            image: 'https://via.placeholder.com/80',
            facebook: '#',
            instagram: '#',
            linkedin: '#'
        },
        {
            name: 'Mike Johnson',
            position: 'Customer Support',
            image: 'https://via.placeholder.com/80',
            facebook: '#',
            instagram: '#',
            linkedin: '#'
        },
        {
            name: 'Sarah Williams',
            position: 'Marketing Head',
            image: 'https://via.placeholder.com/80',
            facebook: '#',
            instagram: '#',
            linkedin: '#'
        }
    ];
    
    renderTeamMembers(defaultTeam);
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

// ========== Setup Event Listeners ==========
function setupEventListeners() {
    // Navigation
    backBtn.addEventListener('click', () => window.location.href = 'account.html');
    homeIcon.addEventListener('click', () => window.location.href = 'index.html');
    
    // Bottom navigation
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.dataset.page;
            if (page) {
                window.location.href = page;
            }
        });
    });
}