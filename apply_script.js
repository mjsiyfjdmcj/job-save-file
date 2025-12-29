// Get job ID from URL
const urlParams = new URLSearchParams(window.location.search);
const jobId = urlParams.get('job');

let jobs = [];

// Load job details
async function loadJobDetails() {
    // Track visitor when apply page loads
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
    
    try {
        const response = await fetch('jobs_api.php');
        jobs = await response.json();
        
        const job = jobs.find(j => j.id == jobId);
        
        if (job) {
            document.getElementById('apply-job-id').value = jobId;
            
            const jobInfo = document.getElementById('job-info');
            const imageHtml = job.image ? `<img src="job_images/${job.image}" alt="Job Image" style="width: 100%; max-width: 400px; height: auto; margin: 1rem 0; border-radius: 8px;">` : '';
            
            jobInfo.innerHTML = `
                <h2>${job.title}</h2>
                ${imageHtml}
                <p><strong>🏢 Organization:</strong> ${job.company}</p>
                <p><strong>📍 Location:</strong> ${job.location}</p>
                <p><strong>💰 Salary:</strong> ${job.salary}</p>
                <p><strong>📅 Deadline:</strong> ${new Date(job.deadline).toLocaleDateString()}</p>
                <div class="job-description">
                    <h3>📝 Job Description:</h3>
                    <p>${job.description}</p>
                </div>
            `;
        } else {
            document.getElementById('job-info').innerHTML = '<h2>Job not found</h2>';
        }
    } catch (error) {
        document.getElementById('job-info').innerHTML = '<h2>Error loading job details</h2>';
    }
}

// Handle form submission
document.addEventListener('DOMContentLoaded', function() {
    loadJobDetails();
    
    const applicationForm = document.getElementById('application-form');
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
                alert('Application submitted successfully! You will receive a confirmation email shortly.');
                window.location.href = 'index.html';
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            alert('Error submitting application. Please try again.');
        }
    });
});