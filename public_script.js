// Public job display script - fetches jobs from server
let publicJobs = [];

// Track visitor
async function trackVisitor() {
    try {
        await fetch('jobs_api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'track_visitor'
            })
        });
    } catch (error) {
        console.error('Error tracking visitor:', error);
    }
}

// Load jobs from server
async function loadPublicJobs() {
    try {
        const response = await fetch('jobs_api.php');
        publicJobs = await response.json();
        displayJobs();
    } catch (error) {
        console.error('Error loading jobs:', error);
        document.getElementById('no-jobs').textContent = 'Error loading jobs. Please try again later.';
    }
}

// Display jobs on homepage
function displayJobs() {
    const container = document.getElementById('jobs-container');
    const noJobsMsg = document.getElementById('no-jobs');
    
    if (publicJobs.length === 0) {
        noJobsMsg.textContent = 'No jobs available at the moment.';
        noJobsMsg.style.display = 'block';
        return;
    }
    
    noJobsMsg.style.display = 'none';
    
    container.innerHTML = publicJobs.map(job => `
        <div class="job-card">
            <h3>${job.title}</h3>
            <p><strong>Company:</strong> ${job.company}</p>
            <p><strong>📍 Location:</strong> ${job.location}</p>
            <p><strong>💰 Salary:</strong> ${job.salary}</p>
            <p><strong>📅 Deadline:</strong> ${new Date(job.deadline).toLocaleDateString()}</p>
            <div class="buttons">
                <button class="view-btn" onclick="window.open('job-details.html?id=${job.id}', '_blank')">🔍 View Details</button>
                <button class="apply-btn" onclick="applyJob(${job.id})">📝 Apply Now</button>
            </div>
        </div>
    `).join('');
}

// View job details
function viewJobDetails(id) {
    const job = publicJobs.find(j => j.id == id);
    if (!job) return;
    
    const modal = document.getElementById('job-modal');
    const details = document.getElementById('job-details');
    
    details.innerHTML = `
        <h2>${job.title}</h2>
                    <p><strong>🏢 Organization:</strong> ${job.company}</p>
                    <p><strong>📍 Location:</strong> ${job.location}</p>
                    <p><strong>💰 Salary:</strong> ${job.salary}</p>
                    <p><strong>📅 Application Deadline:</strong> ${new Date(job.deadline).toLocaleDateString()}</p>
                    <p><strong>📅 Posted:</strong> ${job.postedDate}</p>
                        <h3>📝 Job Description:</h3>
        <p>${job.description}</p>
        <button class="apply-btn" onclick="applyJob(${job.id})" style="margin-top: 1rem; padding: 0.8rem 2rem;">Apply Now</button>
    `;
    
    modal.style.display = 'block';
}

// Apply for job
function applyJob(id) {
    window.location.href = `apply.html?job=${id}`;
}

// Handle application form submission
document.addEventListener('DOMContentLoaded', function() {
    // Track visitor when page loads
    trackVisitor();
    
    const applicationForm = document.getElementById('application-form');
    if (applicationForm) {
        applicationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData();
            formData.append('action', 'apply');
            formData.append('job_id', document.getElementById('apply-job-id').value);
            formData.append('name', document.getElementById('applicant-name').value);
            formData.append('email', document.getElementById('applicant-email').value);
            formData.append('phone', document.getElementById('applicant-phone').value);
            formData.append('address', document.getElementById('present-address').value);
            formData.append('institution', document.getElementById('institution').value);
            formData.append('cv', document.getElementById('cv-upload').files[0]);
            
            try {
                const response = await fetch('jobs_api.php', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('Application submitted successfully!');
                    document.getElementById('apply-modal').style.display = 'none';
                    applicationForm.reset();
                } else {
                    alert('Error: ' + result.message);
                }
            } catch (error) {
                alert('Error submitting application. Please try again.');
            }
        });
    }
    
    loadPublicJobs();
});
// Modal close functionality
document.addEventListener('click', function(e) {
    const jobModal = document.getElementById('job-modal');
    const applyModal = document.getElementById('apply-modal');
    
    if (e.target === jobModal || (e.target.classList.contains('close') && jobModal.contains(e.target))) {
        jobModal.style.display = 'none';
    }
    
    if (e.target === applyModal || (e.target.classList.contains('close') && applyModal.contains(e.target))) {
        applyModal.style.display = 'none';
    }
});
// Fix logo styling issues
document.addEventListener('DOMContentLoaded', function() {
    const logo = document.querySelector('.header-logo');
    const header = document.querySelector('header');
    
    if (logo) {
        // Force logo styles
        logo.style.height = '110px';
        logo.style.width = 'auto';
        logo.style.maxWidth = '350px';
        logo.style.objectFit = 'contain';
        logo.style.background = 'transparent';
        logo.style.display = 'block';
    }
    
    if (header) {
        // Force header styles
        header.style.background = 'white';
        header.style.padding = '1rem';
        header.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
    }
    
    // Check for mobile
    if (window.innerWidth <= 768) {
        if (logo) {
            logo.style.height = '85px';
            logo.style.maxWidth = '250px';
        }
    }
});

// Handle window resize
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
// Handle job description display with scroll
function formatJobDescription(description) {
    if (description.length > 300) {
        return `<div style="max-height: 200px; overflow-y: auto; padding: 0.5rem; background: #f8f9fa; border-radius: 4px; white-space: pre-wrap; word-wrap: break-word;">${description}</div>`;
    }
    return `<div style="white-space: pre-wrap; word-wrap: break-word;">${description}</div>`;
}

// Update viewJob function to use formatted description
function viewJob(id) {
    fetch('jobs_api.php')
        .then(response => response.json())
        .then(jobs => {
            const job = jobs.find(j => j.id === id);
            if (job) {
                document.getElementById('job-details').innerHTML = `
                    <h2>${job.title}</h2>
                    <p><strong>Category:</strong> ${job.category || 'Current Opportunity'}</p>
                    <p><strong>🏢 Organization:</strong> ${job.company}</p>
                    <p><strong>Location:</strong> ${job.location}</p>
                    <p><strong>Salary:</strong> ${job.salary}</p>
                    <p><strong>Deadline:</strong> ${job.deadline}</p>
                    <div><strong>Description:</strong></div>
                    ${formatJobDescription(job.description)}
                `;
                document.getElementById('job-modal').style.display = 'block';
            }
        });
}