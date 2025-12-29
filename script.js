// Admin password (in production, use proper authentication)
const ADMIN_PASSWORD = 'admin123';

// Job storage
let jobs = JSON.parse(localStorage.getItem('jobs')) || [];

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('admin.html')) {
        checkAdminAuth();
        loadAdminJobs();
    } else {
        loadJobs();
    }
});

// Admin authentication
function login() {
    const password = document.getElementById('admin-password').value;
    const errorElement = document.getElementById('login-error');
    
    if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem('adminAuth', 'true');
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
        loadAdminJobs();
    } else {
        errorElement.textContent = 'Invalid password';
    }
}

function logout() {
    sessionStorage.removeItem('adminAuth');
    document.getElementById('login-section').style.display = 'flex';
    document.getElementById('admin-panel').style.display = 'none';
    document.getElementById('admin-password').value = '';
}

function checkAdminAuth() {
    if (sessionStorage.getItem('adminAuth') === 'true') {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
    }
}

// Job management
function addJob() {
    const title = document.getElementById('job-title').value;
    const company = document.getElementById('company').value;
    const location = document.getElementById('location').value;
    const salary = document.getElementById('salary').value;
    const deadline = document.getElementById('deadline').value;
    const description = document.getElementById('description').value;
    
    if (!title || !company || !location || !salary || !deadline || !description) {
        alert('Please fill all fields');
        return;
    }
    
    const job = {
        id: Date.now(),
        title,
        company,
        location,
        salary,
        deadline,
        description,
        postedDate: new Date().toLocaleDateString()
    };
    
    jobs.push(job);
    localStorage.setItem('jobs', JSON.stringify(jobs));
    
    // Generate HTML code for public display
    generatePublicHTML();
    
    // Clear form
    document.getElementById('job-title').value = '';
    document.getElementById('company').value = '';
    document.getElementById('location').value = '';
    document.getElementById('salary').value = '';
    document.getElementById('deadline').value = '';
    document.getElementById('description').value = '';
    
    loadAdminJobs();
    alert('Job posted successfully! HTML code generated.');
}

function deleteJob(id) {
    if (confirm('Are you sure you want to delete this job?')) {
        jobs = jobs.filter(job => job.id !== id);
        localStorage.setItem('jobs', JSON.stringify(jobs));
        generatePublicHTML();
        loadAdminJobs();
    }
}

// Generate HTML code for public display
function generatePublicHTML() {
    const htmlCode = jobs.map(job => `
        <div class="job-card">
            <h3>${job.title}</h3>
            <p><strong>Company:</strong> ${job.company}</p>
            <p><strong>Location:</strong> ${job.location}</p>
            <p><strong>Salary:</strong> ${job.salary}</p>
            <p><strong>Deadline:</strong> ${new Date(job.deadline).toLocaleDateString()}</p>
            <div class="buttons">
                <button class="view-btn" onclick="viewJobDetails(${job.id})">View Details</button>
                <button class="apply-btn" onclick="applyJob(${job.id})">Apply Now</button>
            </div>
        </div>`).join('');
    
    const fullHTML = jobs.length === 0 ? 
        '<p id="no-jobs">No jobs available at the moment.</p>' : 
        htmlCode;
    
    // Display the generated code in admin panel
    showGeneratedCode(fullHTML);
}

// Show generated HTML code to admin
function showGeneratedCode(htmlCode) {
    const existingCodeDiv = document.getElementById('generated-code');
    if (existingCodeDiv) {
        existingCodeDiv.remove();
    }
    
    const codeDiv = document.createElement('div');
    codeDiv.id = 'generated-code';
    codeDiv.innerHTML = `
        <h3>Generated HTML Code (Copy to index.html):</h3>
        <textarea readonly style="width: 100%; height: 200px; font-family: monospace; font-size: 12px; margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">${htmlCode}</textarea>
        <button onclick="copyToClipboard()" style="padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">Copy Code</button>
        <p style="font-size: 12px; color: #666; margin-top: 10px;">Replace the content inside &lt;div id="jobs-container"&gt; in index.html with this code</p>
    `;
    
    document.querySelector('.jobs-list').appendChild(codeDiv);
}

// Copy generated code to clipboard
function copyToClipboard() {
    const textarea = document.querySelector('#generated-code textarea');
    textarea.select();
    document.execCommand('copy');
    alert('HTML code copied to clipboard!');
}

// Load jobs for homepage
function loadJobs() {
    const container = document.getElementById('jobs-container');
    const noJobsMsg = document.getElementById('no-jobs');
    
    if (jobs.length === 0) {
        noJobsMsg.style.display = 'block';
        return;
    }
    
    noJobsMsg.style.display = 'none';
    
    container.innerHTML = jobs.map(job => `
        <div class="job-card">
            <h3>${job.title}</h3>
            <p><strong>Company:</strong> ${job.company}</p>
            <p><strong>Location:</strong> ${job.location}</p>
            <p><strong>Salary:</strong> ${job.salary}</p>
            <p><strong>Deadline:</strong> ${new Date(job.deadline).toLocaleDateString()}</p>
            <div class="buttons">
                <button class="view-btn" onclick="viewJobDetails(${job.id})">View Details</button>
                <button class="apply-btn" onclick="applyJob(${job.id})">Apply Now</button>
            </div>
        </div>
    `).join('');
}

// Load jobs for admin panel
function loadAdminJobs() {
    const container = document.getElementById('admin-jobs-list');
    
    if (jobs.length === 0) {
        container.innerHTML = '<p>No jobs posted yet.</p>';
        return;
    }
    
    container.innerHTML = jobs.map(job => `
        <div class="admin-job-item">
            <h4>${job.title}</h4>
            <p><strong>Company:</strong> ${job.company}</p>
            <p><strong>Location:</strong> ${job.location}</p>
            <p><strong>Salary:</strong> ${job.salary}</p>
            <p><strong>Posted:</strong> ${job.postedDate}</p>
            <button onclick="deleteJob(${job.id})">Delete</button>
        </div>
    `).join('');
    
    // Generate HTML code when loading admin jobs
    generatePublicHTML();
}

// View job details modal
function viewJobDetails(id) {
    const job = jobs.find(j => j.id === id);
    if (!job) return;
    
    const modal = document.getElementById('job-modal');
    const details = document.getElementById('job-details');
    
    details.innerHTML = `
        <h2>${job.title}</h2>
        <p><strong>Company:</strong> ${job.company}</p>
        <p><strong>Location:</strong> ${job.location}</p>
        <p><strong>Salary:</strong> ${job.salary}</p>
        <p><strong>Application Deadline:</strong> ${new Date(job.deadline).toLocaleDateString()}</p>
        <p><strong>Posted:</strong> ${job.postedDate}</p>
        <h3>Job Description:</h3>
        <p>${job.description}</p>
        <button class="apply-btn" onclick="applyJob(${job.id})" style="margin-top: 1rem; padding: 0.8rem 2rem;">Apply Now</button>
    `;
    
    modal.style.display = 'block';
}

// Apply for job
function applyJob(id) {
    const job = jobs.find(j => j.id === id);
    if (!job) return;
    
    alert(`Thank you for your interest in the ${job.title} position at ${job.company}! Your application has been submitted.`);
    
    // Close modal if open
    const modal = document.getElementById('job-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Modal close functionality
document.addEventListener('click', function(e) {
    const modal = document.getElementById('job-modal');
    if (e.target === modal || e.target.classList.contains('close')) {
        modal.style.display = 'none';
    }
});

// Enter key login
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && document.getElementById('admin-password') === document.activeElement) {
        login();
    }
});