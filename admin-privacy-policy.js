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

const POLICY_COLLECTION = 'pages';
const POLICY_DOC = 'privacy-policy';

setTimeout(() => {
  document.getElementById('loading').classList.add('hide');
  document.getElementById('mainContent').style.display = 'block';
}, 2000);

// DOM Elements
const backBtn = document.getElementById('backBtn');
const saveBtn = document.getElementById('saveBtn');
const previewBtn = document.getElementById('previewBtn');
const navItems = document.querySelectorAll('.nav-item');
const toast = document.getElementById('toast');

// Load existing policy
document.addEventListener('DOMContentLoaded', async () => {
  await loadPolicy();
  setupEventListeners();
});

async function loadPolicy() {
  try {
    const doc = await db.collection(POLICY_COLLECTION).doc(POLICY_DOC).get();
    
    if (doc.exists) {
      const data = doc.data();
      document.getElementById('introduction').value = data.introduction || '';
      document.getElementById('information').value = data.information || '';
      document.getElementById('usage').value = data.usage || '';
      document.getElementById('sharing').value = data.sharing || '';
      document.getElementById('security').value = data.security || '';
      document.getElementById('rights').value = data.rights || '';
      document.getElementById('contact').value = data.contact || '';
    }
  } catch (error) {
    console.error('Error loading policy:', error);
  }
}

async function savePolicy() {
  const policyData = {
    introduction: document.getElementById('introduction').value,
    information: document.getElementById('information').value,
    usage: document.getElementById('usage').value,
    sharing: document.getElementById('sharing').value,
    security: document.getElementById('security').value,
    rights: document.getElementById('rights').value,
    contact: document.getElementById('contact').value,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  
  try {
    await db.collection(POLICY_COLLECTION).doc(POLICY_DOC).set(policyData, { merge: true });
    showToast('Privacy policy saved successfully!');
  } catch (error) {
    console.error('Error saving:', error);
    showToast('Error saving policy');
  }
}

function previewPolicy() {
  const data = {
    introduction: document.getElementById('introduction').value,
    information: document.getElementById('information').value,
    usage: document.getElementById('usage').value,
    sharing: document.getElementById('sharing').value,
    security: document.getElementById('security').value,
    rights: document.getElementById('rights').value,
    contact: document.getElementById('contact').value
  };
  
  // Build preview HTML
  let preview = '<h1>Privacy Policy</h1>';
  preview += `<h2>Introduction</h2><p>${data.introduction}</p>`;
  preview += `<h2>Information We Collect</h2><p>${data.information}</p>`;
  preview += `<h2>How We Use Your Information</h2><p>${data.usage}</p>`;
  preview += `<h2>Information Sharing</h2><p>${data.sharing}</p>`;
  preview += `<h2>Data Security</h2><p>${data.security}</p>`;
  preview += `<h2>Your Rights</h2><p>${data.rights}</p>`;
  preview += `<h2>Contact Us</h2><p>${data.contact}</p>`;
  
  // Open preview window
  const win = window.open('', '_blank');
  win.document.write(`
        <html>
        <head>
            <title>Privacy Policy Preview</title>
            <style>
                body { font-family: Arial; padding: 30px; max-width: 800px; margin: 0 auto; }
                h1 { color: #f85606; }
                h2 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
                p { line-height: 1.6; color: #666; }
            </style>
        </head>
        <body>${preview}</body>
        </html>
    `);
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function setupEventListeners() {
  backBtn.addEventListener('click', () => window.location.href = 'admin-index.html');
  saveBtn.addEventListener('click', savePolicy);
  previewBtn.addEventListener('click', previewPolicy);
  
  navItems.forEach(item => {
    item.addEventListener('click', function() {
      const page = this.dataset.page;
      if (page) window.location.href = page;
    });
  });
}