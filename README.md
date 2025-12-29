# Job Portal Setup Instructions

## Required Files:
1. index.html - Main public page
2. admin.html - Admin panel
3. jobs_api.php - Server API
4. public_script.js - Public page script
5. admin_script.js - Admin panel script
6. style.css - Styling
7. apply.html - Job application page
8. apply_script.js - Application page script
9. apply-style.css - Application page styling

## Setup Steps:

### For Local Testing (XAMPP/WAMP):
1. Copy all files to htdocs folder
2. Start Apache server
3. Visit: http://localhost/your-folder/

### For Web Hosting:
1. Upload all files to public_html folder
2. Make sure PHP is enabled
3. Visit: http://yourdomain.com/

## File Permissions:
- jobs_data.json will be created automatically
- applications_data.json will be created automatically
- uploads/ and job_images/ folders will be created automatically
- Make sure PHP can write to the folder

## Admin Access:
- Password: admin123
- Login at: /admin.html

## Features:
1. **Job Management**: Post jobs with images, edit, delete
2. **Application System**: Complete application form with CV upload
3. **Real-time Updates**: Applications appear instantly in admin panel
4. **Email Notifications**: Automatic confirmation emails to applicants
5. **Live Counter**: Shows number of applications received
6. **Auto-refresh**: Admin panel updates every 30 seconds

## Application Form Fields:
- Full Name
- Email Address
- Phone Number
- Present Address
- Institution & Study Level
- CV Upload (PDF, JPG, PNG)

## How it Works:
1. Admin posts job → Saved to jobs_data.json → Appears live on website
2. User applies → Data saved to applications_data.json → Shows in admin panel
3. Real-time updates ensure admin sees applications immediately
4. All data persists and is accessible from any device