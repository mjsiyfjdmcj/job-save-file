<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

$dataFile = 'jobs_data.json';
$applicationsFile = 'applications_data.json';
$visitorsFile = 'visitors_data.json';
$uploadsDir = 'uploads/';

// Create directories if they don't exist
if (!file_exists($dataFile)) {
    file_put_contents($dataFile, json_encode([]));
}
if (!file_exists($applicationsFile)) {
    file_put_contents($applicationsFile, json_encode([]));
}
if (!file_exists($visitorsFile)) {
    file_put_contents($visitorsFile, json_encode(['count' => 0, 'ips' => []]));
}
if (!is_dir($uploadsDir)) {
    mkdir($uploadsDir, 0777, true);
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['type']) && $_GET['type'] === 'applications') {
            // Get applications for admin
            $applications = json_decode(file_get_contents($applicationsFile), true);
            echo json_encode($applications);
        } else if (isset($_GET['type']) && $_GET['type'] === 'visitors') {
            // Get visitor count for admin
            $visitors = json_decode(file_get_contents($visitorsFile), true);
            echo json_encode($visitors);
        } else {
            // Get all jobs for public display
            $jobs = json_decode(file_get_contents($dataFile), true);
            echo json_encode($jobs);
        }
        break;
        
    case 'POST':
        if (isset($_POST['action']) && $_POST['action'] === 'apply') {
            // Handle job application
            $applications = json_decode(file_get_contents($applicationsFile), true);
            $jobs = json_decode(file_get_contents($dataFile), true);
            
            // Get job title for email
            $jobTitle = 'Unknown Position';
            foreach ($jobs as $job) {
                if ($job['id'] == $_POST['job_id']) {
                    $jobTitle = $job['title'];
                    break;
                }
            }
            
            // Handle file upload
            $cvFileName = '';
            if (isset($_FILES['cv']) && $_FILES['cv']['error'] === 0) {
                $allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
                $fileType = $_FILES['cv']['type'];
                
                if (in_array($fileType, $allowedTypes)) {
                    $extension = pathinfo($_FILES['cv']['name'], PATHINFO_EXTENSION);
                    $cvFileName = time() . '_' . uniqid() . '.' . $extension;
                    move_uploaded_file($_FILES['cv']['tmp_name'], $uploadsDir . $cvFileName);
                }
            }
            
            $newApplication = [
                'id' => time(),
                'job_id' => $_POST['job_id'],
                'name' => $_POST['name'],
                'email' => $_POST['email'],
                'phone' => $_POST['phone'],
                'address' => $_POST['address'],
                'institution' => $_POST['institution'],
                'cv_file' => $cvFileName,
                'applied_date' => date('Y-m-d H:i:s')
            ];
            
            $applications[] = $newApplication;
            file_put_contents($applicationsFile, json_encode($applications));
            
            // Send confirmation email
            $to = $_POST['email'];
            $subject = "Application Received - $jobTitle Position";
            $message = "Dear {$_POST['name']},\n\nThank you for applying for the position of $jobTitle at Brighters. We have successfully received your application. Our team will review it and contact shortlisted candidates.\n\nBest wishes,\nBrighters Recruitment Team";
            $headers = "From: noreply@brighters.com\r\n";
            $headers .= "Reply-To: hr@brighters.com\r\n";
            $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
            
            mail($to, $subject, $message, $headers);
            
            echo json_encode(['success' => true, 'message' => 'Application submitted successfully']);
            
        } else {
            // Add new job (admin only)
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (isset($input['action']) && $input['action'] === 'track_visitor') {
                // Track website visitor
                $visitors = json_decode(file_get_contents($visitorsFile), true);
                $clientIP = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
                
                // Only count unique IPs per day
                $today = date('Y-m-d');
                $ipKey = $clientIP . '_' . $today;
                
                if (!in_array($ipKey, $visitors['ips'])) {
                    $visitors['count']++;
                    $visitors['ips'][] = $ipKey;
                    
                    // Keep only last 1000 IP entries to prevent file from growing too large
                    if (count($visitors['ips']) > 1000) {
                        $visitors['ips'] = array_slice($visitors['ips'], -1000);
                    }
                    
                    file_put_contents($visitorsFile, json_encode($visitors));
                }
                
                echo json_encode(['success' => true, 'count' => $visitors['count']]);
            } else if (isset($input['action']) && $input['action'] === 'clear_all' && isset($input['password']) && $input['password'] === 'admin123') {
                // Clear all data
                file_put_contents($dataFile, json_encode([]));
                file_put_contents($applicationsFile, json_encode([]));
                file_put_contents($visitorsFile, json_encode(['count' => 0, 'ips' => []]));
                
                // Clear uploaded files
                if (is_dir($uploadsDir)) {
                    $files = glob($uploadsDir . '*');
                    foreach($files as $file) {
                        if(is_file($file)) {
                            unlink($file);
                        }
                    }
                }
                
                echo json_encode(['success' => true, 'message' => 'All data cleared successfully']);
            } else if (isset($input['action']) && $input['action'] === 'clear_applications' && isset($input['password']) && $input['password'] === 'admin123') {
                // Clear only applications data
                file_put_contents($applicationsFile, json_encode([]));
                
                // Clear uploaded CV files
                if (is_dir($uploadsDir)) {
                    $files = glob($uploadsDir . '*');
                    foreach($files as $file) {
                        if(is_file($file)) {
                            unlink($file);
                        }
                    }
                }
                
                echo json_encode(['success' => true, 'message' => 'Applications cleared successfully']);
            } else if (isset($input['action']) && $input['action'] === 'export_to_sheets' && isset($input['password']) && $input['password'] === 'admin123') {
                // Export data to Google Sheets
                $jobs = json_decode(file_get_contents($dataFile), true);
                $applications = json_decode(file_get_contents($applicationsFile), true);
                $visitors = json_decode(file_get_contents($visitorsFile), true);
                
                // Prepare data for Google Sheets
                $exportData = [
                    'jobs' => $jobs,
                    'applications' => $applications,
                    'visitors' => $visitors['count']
                ];
                
                // Call Google Sheets API function
                $result = exportToGoogleSheets($exportData);
                
                if ($result) {
                    echo json_encode(['success' => true, 'message' => 'Data exported successfully']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Export failed']);
                }
            } else if (isset($input['action']) && $input['action'] === 'delete_single_application' && isset($input['password']) && $input['password'] === 'admin123') {
                // Delete single application
                $applications = json_decode(file_get_contents($applicationsFile), true);
                $appToDelete = null;
                
                // Find and remove the application
                $applications = array_filter($applications, function($app) use ($input, &$appToDelete) {
                    if ($app['id'] == $input['app_id']) {
                        $appToDelete = $app;
                        return false;
                    }
                    return true;
                });
                
                if ($appToDelete) {
                    // Delete CV file if exists
                    if (!empty($appToDelete['cv_file']) && file_exists($uploadsDir . $appToDelete['cv_file'])) {
                        unlink($uploadsDir . $appToDelete['cv_file']);
                    }
                    
                    file_put_contents($applicationsFile, json_encode(array_values($applications)));
                    echo json_encode(['success' => true, 'message' => 'Application deleted successfully']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Application not found']);
                }
            } else if (isset($input['action']) && $input['action'] === 'add' && isset($input['password']) && $input['password'] === 'admin123') {
                $jobs = json_decode(file_get_contents($dataFile), true);
                
                $newJob = [
                    'id' => time(),
                    'category' => isset($input['category']) ? $input['category'] : 'Current Opportunity',
                    'title' => $input['title'],
                    'company' => $input['company'],
                    'location' => $input['location'],
                    'salary' => $input['salary'],
                    'deadline' => $input['deadline'],
                    'description' => $input['description'],
                    'postedDate' => date('Y-m-d')
                ];
                
                $jobs[] = $newJob;
                file_put_contents($dataFile, json_encode($jobs));
                echo json_encode(['success' => true, 'message' => 'Job posted successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Invalid password']);
            }
        }
        break;
        
    case 'DELETE':
        // Delete job (admin only)
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (isset($input['password']) && $input['password'] === 'admin123') {
            $jobs = json_decode(file_get_contents($dataFile), true);
            $jobs = array_filter($jobs, function($job) use ($input) {
                return $job['id'] != $input['id'];
            });
            
            file_put_contents($dataFile, json_encode(array_values($jobs)));
            echo json_encode(['success' => true, 'message' => 'Job deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid password']);
        }
        break;
}