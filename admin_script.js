// Admin password
const ADMIN_PASSWORD = 'admin123';

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('admin.html')) {
        checkAdminAuth();
        loadAdminJobs();
        loadApplications();
        updateDataStats();
        // Auto-refresh stats every 10 seconds for live updates
        setInterval(() => {
            updateDataStats();
            loadApplications();
        }, 10000);
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
        // Load all data immediately after login
        setTimeout(() => {
            loadAdminJobs();
            loadApplications();
            updateDataStats();
        }, 100);
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
        // Load data immediately after showing admin panel
        setTimeout(() => {
            loadAdminJobs();
            loadApplications();
            updateDataStats();
        }, 100);
    }
}

// Job management with server API
async function addJob() {
    const title = document.getElementById('job-title').value;
    const company = document.getElementById('company').value;
    const location = document.getElementById('location').value;
    const salary = document.getElementById('salary').value;
    const deadline = document.getElementById('deadline').value;
    const description = document.getElementById('description').value;
    
    if (!title || !company || !location || !salary || !deadline || !description) {
        alert('Please fill all fields including organization name');
        return;
    }
    
    try {
        const response = await fetch('jobs_api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'add',
                password: ADMIN_PASSWORD,
                title,
                company,
                location,
                salary,
                deadline,
                description
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Clear form
            document.getElementById('job-title').value = '';
            document.getElementById('company').value = '';
            document.getElementById('location').value = '';
            document.getElementById('salary').value = '';
            document.getElementById('deadline').value = '';
            document.getElementById('description').value = '';
            
            loadAdminJobs();
            alert('Job posted successfully and is now live on the website!');
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        alert('Error posting job. Please try again.');
    }
}

async function deleteJob(id) {
    if (confirm('Are you sure you want to delete this job?')) {
        try {
            const response = await fetch('jobs_api.php', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: id,
                    password: ADMIN_PASSWORD
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                loadAdminJobs();
                alert('Job deleted successfully!');
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            alert('Error deleting job. Please try again.');
        }
    }
}

// Load jobs for admin panel
async function loadAdminJobs() {
    try {
        const response = await fetch('jobs_api.php');
        const jobs = await response.json();
        
        const container = document.getElementById('admin-jobs-list');
        
        if (jobs.length === 0) {
            container.innerHTML = '<p>No jobs posted yet.</p>';
        } else {
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
        }
        
        // Load applications
        loadApplications();
        
        // Update stats
        updateDataStats();
    } catch (error) {
        document.getElementById('admin-jobs-list').innerHTML = '<p>Error loading jobs.</p>';
    }
}

// Update data statistics
async function updateDataStats() {
    try {
        const jobsResponse = await fetch('jobs_api.php');
        const jobs = await jobsResponse.json();
        
        const appsResponse = await fetch('jobs_api.php?type=applications');
        const applications = await appsResponse.json();
        
        const visitorsResponse = await fetch('jobs_api.php?type=visitors');
        const visitorsData = await visitorsResponse.json();
        
        const totalJobsElement = document.getElementById('total-jobs');
        const totalAppsElement = document.getElementById('total-applications');
        const totalVisitorsElement = document.getElementById('total-visitors');
        
        if (totalJobsElement) totalJobsElement.textContent = jobs.length;
        if (totalAppsElement) totalAppsElement.textContent = applications.length;
        if (totalVisitorsElement) {
            totalVisitorsElement.textContent = visitorsData.count || 0;
            // Add animation for new visitors
            if (visitorsData.count > (window.lastVisitorCount || 0)) {
                totalVisitorsElement.style.color = '#27ae60';
                setTimeout(() => totalVisitorsElement.style.color = '#667eea', 1000);
            }
            window.lastVisitorCount = visitorsData.count;
        }
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Load applications for admin panel
let lastAppCount = 0;

async function loadApplications() {
    try {
        const response = await fetch('jobs_api.php?type=applications');
        const applications = await response.json();
        
        const container = document.getElementById('admin-applications-list');
        const counter = document.getElementById('app-count');
        
        // Update counter with animation for new applications
        if (counter) {
            if (applications.length > lastAppCount && lastAppCount > 0) {
                counter.classList.add('new');
                setTimeout(() => counter.classList.remove('new'), 3000);
            }
            counter.textContent = applications.length;
            counter.style.background = applications.length > 0 ? '#27ae60' : '#95a5a6';
            lastAppCount = applications.length;
        }
        
        if (applications.length === 0) {
            container.innerHTML = '<div class="no-applications">No applications received yet.</div>';
        } else {
            // Get job titles for reference
            const jobsResponse = await fetch('jobs_api.php');
            const jobs = await jobsResponse.json();
            
            // Sort applications by date (newest first)
            applications.sort((a, b) => new Date(b.applied_date) - new Date(a.applied_date));
            
            container.innerHTML = applications.map(app => {
                const job = jobs.find(j => j.id == app.job_id);
                const jobTitle = job ? job.title : 'Unknown Job';
                const applicationDate = new Date(app.applied_date).toLocaleDateString();
                const applicationTime = new Date(app.applied_date).toLocaleTimeString();
                
                return `
                    <div class="application-item">
                        <div class="application-date">${applicationDate} ${applicationTime}</div>
                        <button class="delete-single-app" onclick="deleteSingleApplication('${app.id}')" title="Delete this application">🗑️</button>
                        <h4>${app.name}</h4>
                        <div class="application-info">
                            <div class="info-item">
                                <strong>Position</strong>
                                <span>${jobTitle}</span>
                            </div>
                            <div class="info-item">
                                <strong>Email</strong>
                                <span>${app.email}</span>
                            </div>
                            <div class="info-item">
                                <strong>Phone</strong>
                                <span>${app.phone}</span>
                            </div>
                            <div class="info-item">
                                <strong>Address</strong>
                                <span>${app.address || 'Not provided'}</span>
                            </div>
                            <div class="info-item">
                                <strong>Institution</strong>
                                <span>${app.institution || 'Not provided'}</span>
                            </div>
                        </div>
                        ${app.cv_file ? `
                            <div class="cv-download">
                                <a href="uploads/${app.cv_file}" target="_blank" class="cv-link">Download CV</a>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        document.getElementById('admin-applications-list').innerHTML = '<div class="no-applications">Error loading applications.</div>';
    }
}

// Enter key login
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && document.getElementById('admin-password') === document.activeElement) {
        login();
    }
});
// Clear all data function
async function clearAllData() {
    if (confirm('Are you sure you want to delete ALL jobs and applications? This action cannot be undone!')) {
        if (confirm('This will permanently delete everything. Are you absolutely sure?')) {
            try {
                const response = await fetch('jobs_api.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'clear_all',
                        password: ADMIN_PASSWORD
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Immediately update all displays
                    loadAdminJobs();
                    loadApplications();
                    updateDataStats();
                    
                    // Clear job list display
                    document.getElementById('admin-jobs-list').innerHTML = '<p>No jobs posted yet.</p>';
                    
                    // Clear applications display
                    document.getElementById('admin-applications-list').innerHTML = '<div class="no-applications">No applications received yet.</div>';
                    
                    // Reset counters
                    const appCounter = document.getElementById('app-count');
                    if (appCounter) {
                        appCounter.textContent = '0';
                        appCounter.style.background = '#95a5a6';
                    }
                    
                    // Reset stats
                    const totalJobs = document.getElementById('total-jobs');
                    const totalApps = document.getElementById('total-applications');
                    if (totalJobs) totalJobs.textContent = '0';
                    if (totalApps) totalApps.textContent = '0';
                    
                    alert('All data cleared successfully! The website is now empty.');
                } else {
                    alert('Error: ' + result.message);
                }
            } catch (error) {
                alert('Error clearing data. Please try again.');
            }
        }
    }
}


// Section navigation
function showSection(sectionId) {
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(sectionId).classList.add('active');
    
    // Find and activate the correct button
    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach(btn => {
        if (btn.textContent.includes('Applications') && sectionId === 'data-collect') {
            btn.classList.add('active');
        } else if (btn.textContent.includes('Post Jobs') && sectionId === 'post-jobs') {
            btn.classList.add('active');
        }
    });
    
    if (sectionId === 'data-collect') {
        loadApplications();
        updateDataStats();
        // Force visibility
        setTimeout(() => {
            const appsList = document.querySelector('.applications-list');
            const dataManagement = document.querySelector('.data-management');
            if (appsList) {
                appsList.style.display = 'block';
                appsList.style.visibility = 'visible';
                appsList.style.opacity = '1';
            }
            if (dataManagement) {
                dataManagement.style.display = 'block';
                dataManagement.style.visibility = 'visible';
                dataManagement.style.opacity = '1';
            }
        }, 50);
    }
}

// Chrome browser fix for data management styling
function fixChromeStyles() {
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    
    if (isChrome) {
        const dataManagement = document.querySelector('.data-management');
        if (dataManagement) {
            // Apply inline styles for Chrome compatibility
            dataManagement.style.cssText = `
                background: #fff !important;
                border-radius: 20px !important;
                box-shadow: 0 10px 40px rgba(0,0,0,0.1) !important;
                margin: 2rem 0 !important;
                overflow: hidden !important;
                border: 1px solid #e9ecef !important;
            `;
        }
        
        const dataHeader = document.querySelector('.data-header');
        if (dataHeader) {
            dataHeader.style.cssText = `
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                padding: 2rem !important;
                text-align: center !important;
            `;
        }
        
        const dataStats = document.querySelector('.data-stats');
        if (dataStats) {
            dataStats.style.cssText = `
                display: flex !important;
                padding: 2rem !important;
                gap: 2rem !important;
                justify-content: center !important;
                background: #f8f9fa !important;
                flex-wrap: wrap !important;
            `;
        }
        
        const statItems = document.querySelectorAll('.stat-item');
        statItems.forEach(item => {
            item.style.cssText = `
                background: white !important;
                padding: 2rem 1.5rem !important;
                border-radius: 15px !important;
                text-align: center !important;
                box-shadow: 0 5px 15px rgba(0,0,0,0.08) !important;
                border: 2px solid #e9ecef !important;
                transition: all 0.3s ease !important;
                min-width: 150px !important;
                flex: 1 !important;
                max-width: 200px !important;
            `;
        });
        
        const actionSection = document.querySelector('.action-section');
        if (actionSection) {
            actionSection.style.cssText = `
                padding: 2rem !important;
                text-align: center !important;
                background: white !important;
            `;
        }
        
        const clearBtn = document.querySelector('.clear-btn');
        if (clearBtn) {
            clearBtn.style.cssText = `
                background: linear-gradient(135deg, #ff6b6b, #ee5a52) !important;
                color: white !important;
                border: none !important;
                padding: 1rem 2.5rem !important;
                border-radius: 50px !important;
                font-size: 1rem !important;
                font-weight: 700 !important;
                cursor: pointer !important;
                transition: all 0.3s ease !important;
                box-shadow: 0 5px 15px rgba(255, 107, 107, 0.3) !important;
                margin-bottom: 1rem !important;
            `;
        }
    }
}

// Run Chrome fix when page loads
document.addEventListener('DOMContentLoaded', fixChromeStyles);

// Also run when switching to data-collect section
const originalShowSection = showSection;
showSection = function(sectionId) {
    originalShowSection.call(this, sectionId);
    if (sectionId === 'data-collect') {
        setTimeout(fixChromeStyles, 100);
    }
};

// Clear applications only function
async function clearApplicationsOnly() {
    if (confirm('Are you sure you want to delete ALL applications? Jobs will remain.')) {
        try {
            const response = await fetch('jobs_api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'clear_applications',
                    password: ADMIN_PASSWORD
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Update applications display
                loadApplications();
                updateDataStats();
                
                // Clear applications display
                document.getElementById('admin-applications-list').innerHTML = '<div class="no-applications">No applications received yet.</div>';
                
                // Reset application counter
                const appCounter = document.getElementById('app-count');
                if (appCounter) {
                    appCounter.textContent = '0';
                    appCounter.style.background = '#95a5a6';
                }
                
                // Reset application stats
                const totalApps = document.getElementById('total-applications');
                if (totalApps) totalApps.textContent = '0';
                
                alert('All applications cleared successfully! Jobs remain intact.');
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            alert('Error clearing applications. Please try again.');
        }
    }
}

// Force visibility of all admin sections
function forceVisibility() {
    const elements = [
        '.applications-list',
        '.data-management', 
        '#data-collect',
        '.application-item',
        '.data-stats',
        '.stat-item'
    ];
    
    elements.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            element.style.display = 'block';
            element.style.visibility = 'visible';
            element.style.opacity = '1';
            element.style.width = '100%';
        }
        
        // Apply to all matching elements
        const allElements = document.querySelectorAll(selector);
        allElements.forEach(el => {
            el.style.display = selector === '.data-stats' ? 'flex' : 'block';
            el.style.visibility = 'visible';
            el.style.opacity = '1';
            if (selector !== '.stat-item') {
                el.style.width = '100%';
            }
        });
    });
}

// Run force visibility on page load and section changes
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(forceVisibility, 500);
});

// Override the original showSection to include force visibility
const originalShowSectionFunc = window.showSection;
window.showSection = function(sectionId) {
    if (originalShowSectionFunc) {
        originalShowSectionFunc(sectionId);
    }
    
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(sectionId).classList.add('active');
    
    // Find and activate the correct button
    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach(btn => {
        if (btn.textContent.includes('Applications') && sectionId === 'data-collect') {
            btn.classList.add('active');
        } else if (btn.textContent.includes('Post Jobs') && sectionId === 'post-jobs') {
            btn.classList.add('active');
        }
    });
    
    if (sectionId === 'data-collect') {
        loadApplications();
        updateDataStats();
        setTimeout(forceVisibility, 100);
    }
};
// Delete single application function
async function deleteSingleApplication(appId) {
    if (confirm('Are you sure you want to delete this application?')) {
        try {
            const response = await fetch('jobs_api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'delete_single_application',
                    app_id: appId,
                    password: ADMIN_PASSWORD
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                loadApplications();
                updateDataStats();
                alert('Application deleted successfully!');
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            alert('Error deleting application. Please try again.');
        }
    }
}
// Fix admin panel logo styling issues
document.addEventListener('DOMContentLoaded', function() {
    const logo = document.querySelector('.header-logo');
    const header = document.querySelector('header');
    
    if (logo) {
        // Force logo styles for admin panel
        logo.style.height = '110px';
        logo.style.width = 'auto';
        logo.style.maxWidth = '350px';
        logo.style.objectFit = 'contain';
        logo.style.background = 'transparent';
        logo.style.display = 'block';
    }
    
    if (header) {
        // Force header styles for admin panel
        header.style.background = 'white';
        header.style.padding = '1rem';
        header.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
    }
    
    // Check for mobile in admin panel
    if (window.innerWidth <= 768) {
        if (logo) {
            logo.style.height = '85px';
            logo.style.maxWidth = '250px';
        }
    }
});

// Handle window resize for admin panel
window.addEventListener('resize', function() {
    const logo = document.querySelector('.header-logo');
    if (logo) {
        if (window.innerWidth <= 768) {
            logo.style.height = '85px';
            logo.style.maxWidth = '250px';
        } else {
            logo.style.height = '110px';
            logo.style.maxWidth = '350px';
        }
    }
});