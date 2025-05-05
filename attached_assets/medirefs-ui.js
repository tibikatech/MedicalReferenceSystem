/**
 * MediRefs UI - Direct DB Approach
 * 
 * This script recreates the original MediRefs UI while using
 * our Direct DB API with snake_case for reliable database access.
 */

const http = require('http');
const PORT = 5007;

// Helper function to call the API
async function callApi(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5003,
      path: endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`,
      method: 'GET'
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(new Error(`Invalid JSON: ${data}`));
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.end();
  });
}

// Generate CSS for the core app style matching the original
function getAppStyles() {
  return `
    :root {
      --primary-color: #4285F4;
      --secondary-color: #34A853;
      --accent-color: #FBBC05;
      --danger-color: #EA4335;
      --light-color: #F8F9FA;
      --dark-color: #202124;
      --gray-100: #F8F9FA;
      --gray-200: #E9ECEF;
      --gray-300: #DEE2E6;
      --gray-400: #CED4DA;
      --gray-500: #ADB5BD;
      --gray-600: #6C757D;
      --gray-700: #495057;
      --gray-800: #343A40;
      --gray-900: #212529;
      --border-radius: 0.5rem;
      --box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: var(--font-family);
      font-size: 1rem;
      line-height: 1.5;
      color: var(--gray-900);
      background-color: var(--gray-100);
    }
    
    .container {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      padding: 1rem;
    }
    
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 0;
      border-bottom: 1px solid var(--gray-300);
      margin-bottom: 1.5rem;
    }
    
    h1 {
      color: var(--primary-color);
      font-size: 1.75rem;
      font-weight: 700;
    }
    
    /* Search Bar */
    .search-container {
      position: relative;
      margin: 1.5rem 0;
    }
    
    .search-input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 2.5rem;
      font-size: 1rem;
      border: 1px solid var(--gray-300);
      border-radius: var(--border-radius);
      background-color: var(--gray-100);
      transition: all 0.2s ease;
    }
    
    .search-input:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.25);
    }
    
    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--gray-500);
    }
    
    /* Action Buttons */
    .actions {
      display: flex;
      margin-right: 0.5rem;
    }
    
    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      border: none;
      background-color: var(--gray-200);
      color: var(--gray-700);
      margin-left: 0.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .action-btn:hover {
      background-color: var(--gray-300);
    }
    
    .login-btn {
      background-color: var(--primary-color);
      color: white;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: var(--border-radius);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .login-btn:hover {
      background-color: #2b6dd7;
    }
    
    /* Hero Section */
    .hero {
      background-color: white;
      padding: 1.5rem;
      border-radius: var(--border-radius);
      box-shadow: var(--box-shadow);
      margin-bottom: 1.5rem;
    }
    
    .hero-title {
      font-size: 1.5rem;
      color: var(--dark-color);
      margin-bottom: 0.5rem;
    }
    
    .tests-count {
      display: inline-block;
      margin-bottom: 1rem;
      padding: 0.25rem 0.75rem;
      background-color: var(--gray-200);
      border-radius: 1rem;
      font-weight: 500;
      color: var(--gray-800);
    }
    
    .hero-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 1rem;
    }
    
    .hero-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.75rem;
      background-color: var(--primary-color);
      color: white;
      border: none;
      border-radius: var(--border-radius);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .hero-btn.secondary {
      background-color: #9c27b0;
    }
    
    .hero-btn:hover {
      opacity: 0.9;
    }
    
    .hero-btn i {
      margin-right: 0.5rem;
    }
    
    /* Category Tabs */
    .category-tabs {
      display: flex;
      overflow-x: auto;
      padding-bottom: 0.5rem;
      margin-bottom: 1.5rem;
      white-space: nowrap;
    }
    
    .category-tab {
      padding: 0.5rem 1rem;
      margin-right: 0.5rem;
      background-color: var(--gray-200);
      border-radius: 1.5rem;
      color: var(--gray-800);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .category-tab.active {
      background-color: var(--primary-color);
      color: white;
    }
    
    .category-tab:hover:not(.active) {
      background-color: var(--gray-300);
    }
    
    /* Test Cards */
    .test-card {
      background-color: white;
      border-radius: var(--border-radius);
      box-shadow: var(--box-shadow);
      margin-bottom: 1rem;
      overflow: hidden;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .test-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    
    .test-header {
      padding: 1rem 1rem 0.5rem;
      display: flex;
      justify-content: space-between;
    }
    
    .test-name {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--primary-color);
      text-decoration: none;
    }
    
    .bookmark-btn {
      background: none;
      border: none;
      color: var(--gray-400);
      cursor: pointer;
      font-size: 1.25rem;
      transition: color 0.2s ease;
    }
    
    .bookmark-btn:hover {
      color: var(--accent-color);
    }
    
    .test-codes {
      padding: 0.5rem 1rem;
      display: flex;
      font-size: 0.875rem;
    }
    
    .test-code {
      margin-right: 1.5rem;
    }
    
    .code-label {
      font-weight: 500;
      color: var(--gray-700);
    }
    
    .code-value {
      display: inline-block;
      padding: 0.125rem 0.375rem;
      background-color: var(--gray-200);
      border-radius: 0.25rem;
      margin-left: 0.25rem;
      font-family: monospace;
    }
    
    .test-categories {
      padding: 0.5rem 1rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    
    .category-tag {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background-color: var(--light-color);
      border-radius: 1rem;
      font-size: 0.875rem;
      color: var(--gray-700);
    }
    
    .description {
      padding: 0.5rem 1rem 1rem;
      color: var(--gray-700);
      font-size: 0.875rem;
      display: flex;
      align-items: flex-start;
    }
    
    .description i {
      margin-right: 0.5rem;
      margin-top: 0.25rem;
      color: var(--gray-500);
    }
    
    /* CSV Upload Modal */
    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      align-items: center;
      justify-content: center;
    }
    
    .modal.show {
      display: flex;
    }
    
    .modal-content {
      background-color: white;
      border-radius: var(--border-radius);
      max-width: 90%;
      width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--gray-200);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .modal-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--dark-color);
    }
    
    .close-modal {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: var(--gray-500);
      cursor: pointer;
      line-height: 1;
    }
    
    .modal-body {
      padding: 1.5rem;
    }
    
    .csv-form {
      margin-bottom: 1rem;
    }
    
    .form-group {
      margin-bottom: 1rem;
    }
    
    .form-label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: var(--gray-700);
    }
    
    .file-input {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid var(--gray-300);
      border-radius: var(--border-radius);
    }
    
    .submit-btn {
      display: block;
      width: 100%;
      padding: 0.75rem;
      background-color: var(--primary-color);
      color: white;
      border: none;
      border-radius: var(--border-radius);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .submit-btn:hover {
      background-color: #2b6dd7;
    }
    
    #upload-status {
      margin-top: 1rem;
      padding: 0.75rem;
      border-radius: var(--border-radius);
      font-size: 0.875rem;
    }
    
    .status-success {
      background-color: #e6f4ea;
      color: #34a853;
    }
    
    .status-error {
      background-color: #fce8e6;
      color: #ea4335;
    }
    
    /* Responsive Styles */
    @media (min-width: 768px) {
      .container {
        max-width: 800px;
      }
    }
    
    @media (min-width: 1024px) {
      .container {
        max-width: 1000px;
      }
    }
  `;
}

// Client-side scripts
function getClientScripts() {
  return `
    // Initialize state
    let currentCategory = 'all';
    let searchQuery = '';
    let tests = [];
    
    // DOM Elements
    const searchInput = document.getElementById('search-input');
    const categoryTabs = document.querySelectorAll('.category-tab');
    const testContainer = document.getElementById('test-container');
    const csvModal = document.getElementById('csv-modal');
    const uploadForm = document.getElementById('csv-upload-form');
    const fileInput = document.getElementById('csv-file');
    const uploadStatus = document.getElementById('upload-status');
    
    // Initialize the app
    document.addEventListener('DOMContentLoaded', function() {
      // Add event listeners
      searchInput.addEventListener('input', handleSearch);
      categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => setCategory(tab.dataset.category));
      });
      
      // Set initial state
      tests = Array.from(document.querySelectorAll('.test-card'));
      
      // Modal handlers
      document.getElementById('open-csv-modal').addEventListener('click', () => {
        csvModal.classList.add('show');
      });
      
      document.getElementById('close-modal').addEventListener('click', () => {
        csvModal.classList.remove('show');
      });
      
      // Close modal when clicking outside
      csvModal.addEventListener('click', (e) => {
        if (e.target === csvModal) {
          csvModal.classList.remove('show');
        }
      });
      
      // CSV upload form
      uploadForm.addEventListener('submit', handleCSVUpload);
    });
    
    // Search functionality
    function handleSearch(e) {
      searchQuery = e.target.value.toLowerCase();
      filterTests();
    }
    
    // Filter by category
    function setCategory(category) {
      currentCategory = category;
      
      // Update active tab
      categoryTabs.forEach(tab => {
        if (tab.dataset.category === category) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });
      
      filterTests();
    }
    
    // Filter tests by search and category
    function filterTests() {
      tests.forEach(test => {
        const testName = test.querySelector('.test-name').textContent.toLowerCase();
        const testCategories = Array.from(test.querySelectorAll('.category-tag')).map(tag => tag.textContent.toLowerCase());
        
        const matchesSearch = searchQuery === '' || testName.includes(searchQuery);
        const matchesCategory = currentCategory === 'all' || testCategories.some(cat => cat.includes(currentCategory.toLowerCase()));
        
        test.style.display = matchesSearch && matchesCategory ? 'block' : 'none';
      });
      
      // Update visible count
      const visibleCount = tests.filter(test => test.style.display !== 'none').length;
      document.getElementById('count-value').textContent = visibleCount;
    }
    
    // Handle bookmark toggling
    function toggleBookmark(btn) {
      btn.classList.toggle('bookmarked');
      if (btn.classList.contains('bookmarked')) {
        btn.innerHTML = '<i class="fas fa-bookmark"></i>';
        btn.style.color = '#FBBC05';
      } else {
        btn.innerHTML = '<i class="far fa-bookmark"></i>';
        btn.style.color = '';
      }
    }
    
    // Handle CSV upload
    function handleCSVUpload(e) {
      e.preventDefault();
      
      const file = fileInput.files[0];
      if (!file) {
        setUploadStatus('Please select a CSV file', 'error');
        return;
      }
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Show loading status
      setUploadStatus('Uploading file...', 'loading');
      
      // Send request
      fetch('http://localhost:5003/api/csv/upload', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setUploadStatus(data.message, 'success');
          // Refresh the page after successful upload
          setTimeout(() => window.location.reload(), 2000);
        } else {
          setUploadStatus('Error: ' + data.message, 'error');
        }
      })
      .catch(error => {
        setUploadStatus('Error: ' + error.message, 'error');
      });
    }
    
    // Set upload status message
    function setUploadStatus(message, type) {
      uploadStatus.textContent = message;
      uploadStatus.className = '';
      
      if (type === 'success') {
        uploadStatus.classList.add('status-success');
      } else if (type === 'error') {
        uploadStatus.classList.add('status-error');
      }
      uploadStatus.style.display = 'block';
    }
    
    // Download CSV
    function downloadCSV() {
      window.location.href = 'http://localhost:5003/api/csv/export';
    }
  `;
}

// Create the HTML response
async function createHtmlResponse() {
  try {
    // Fetch data from the Direct DB API
    const [testCount, testData, categories] = await Promise.all([
      callApi('/tests/count'),
      callApi('/tests'),
      callApi('/tests/categories')
    ]);
    
    // Generate HTML response
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MedTest Reference</title>
        <style>${getAppStyles()}</style>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <!-- FontAwesome for icons -->
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <header>
            <h1>MedTest Reference</h1>
            <div class="actions">
              <button class="action-btn">
                <i class="fas fa-bookmark"></i>
              </button>
              <button class="action-btn">
                <i class="fas fa-history"></i>
              </button>
              <button class="login-btn">Log In</button>
            </div>
          </header>
          
          <!-- Search Bar -->
          <div class="search-container">
            <i class="fas fa-search search-icon"></i>
            <input id="search-input" class="search-input" type="text" placeholder="Search tests...">
          </div>
          
          <!-- Hero Section -->
          <div class="hero">
            <h2 class="hero-title">Medical Test Reference</h2>
            <div class="tests-count">
              <span id="count-value">${testCount.count}</span>
              tests available
            </div>
            <div class="hero-actions">
              <button class="hero-btn">
                <i class="fas fa-cog"></i>
                Manage Tests
              </button>
              <button id="open-csv-modal" class="hero-btn secondary">
                <i class="fas fa-database"></i>
                Database Migration
              </button>
            </div>
          </div>
          
          <!-- Category Tabs -->
          <div class="category-tabs">
            <div class="category-tab active" data-category="all">All (${testCount.count})</div>
            ${categories.categories.map(cat => `
              <div class="category-tab" data-category="${cat.toLowerCase()}">${cat} (${testData.tests.filter(t => t.category === cat).length})</div>
            `).join('')}
          </div>
          
          <!-- Test Cards -->
          <div id="test-container">
            ${testData.tests.map(test => `
              <div class="test-card">
                <div class="test-header">
                  <a href="#" class="test-name">${test.name}</a>
                  <button class="bookmark-btn" onclick="toggleBookmark(this)">
                    <i class="far fa-bookmark"></i>
                  </button>
                </div>
                <div class="test-codes">
                  <div class="test-code">
                    <span class="code-label">CPT:</span>
                    <span class="code-value">${test.cpt_code || 'N/A'}</span>
                  </div>
                  <div class="test-code">
                    <span class="code-label">SNOMED:</span>
                    <span class="code-value">${test.snomed_code || '00000000'}</span>
                  </div>
                </div>
                <div class="test-categories">
                  <div class="category-tag">${test.category}</div>
                  ${test.sub_category ? `<div class="category-tag">${test.sub_category}</div>` : ''}
                </div>
                <div class="description">
                  <i class="fas fa-info-circle"></i>
                  <span>${test.description || 'No description available.'}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <!-- CSV Upload Modal -->
        <div id="csv-modal" class="modal">
          <div class="modal-content">
            <div class="modal-header">
              <h3 class="modal-title">CSV Import/Export</h3>
              <button id="close-modal" class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
              <form id="csv-upload-form" class="csv-form">
                <div class="form-group">
                  <label for="csv-file" class="form-label">Upload CSV File</label>
                  <input type="file" id="csv-file" class="file-input" accept=".csv">
                </div>
                <button type="submit" class="submit-btn">Upload CSV</button>
              </form>
              
              <div id="upload-status" style="display: none;"></div>
              
              <div style="margin-top: 1.5rem;">
                <div class="form-group">
                  <label class="form-label">Export Test Data</label>
                  <p style="margin-bottom: 0.75rem; font-size: 0.875rem; color: var(--gray-600);">
                    Download all tests as a CSV file for backup or editing.
                  </p>
                  <button onclick="downloadCSV()" class="submit-btn" style="background-color: var(--secondary-color);">Download CSV</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <script>${getClientScripts()}</script>
      </body>
      </html>
    `;
  } catch (error) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 20px; }
          .error { color: red; background: #ffeeee; padding: 10px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>Error connecting to API</h1>
        <div class="error">${error.message}</div>
        <p>Please make sure the Direct DB API is running on port 5003.</p>
      </body>
      </html>
    `;
  }
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  
  try {
    const html = await createHtmlResponse();
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end(`<h1>Server Error</h1><p>${error.message}</p>`);
  }
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MediRefs UI running at http://0.0.0.0:${PORT}`);
  console.log(`📊 Fetching data from Direct DB API at http://localhost:5003`);
});