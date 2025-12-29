<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

$dataFile = 'jobs_data.json';
$applicationsFile = 'applications_data.json';
$uploadsDir = 'uploads/';
$jobImagesDir = 'job_images/';

// Create directories if they don't exist
if (!file_exists($dataFile)) {
    file_put_contents($dataFile, json_encode([]));
}
if (!file_exists($applicationsFile)) {
    file_put_contents($applicationsFile, json_encode([]));
}
if (!is_dir($uploadsDir)) {
    mkdir($uploadsDir, 0777, true);
}
if (!is_dir($jobImagesDir)) {
    mkdir($jobImagesDir, 0777, true);
}

// Email function
function sendApplicationEmail($applicantEmail, $applicantName, $jobTitle) {
    $to = $applicantEmail;
    $subject = "Application Received - $jobTitle Position";
    $message = "Dear $applicantName,\n\nThank you for applying for the position of $jobTitle at Brighters. We have successfully received your application. Our team will review it and contact shortlisted candidates.\n\nBest wishes,\nBrighters Recruitment Team";
    $headers = "From: noreply@brighters.com\r\n";
    $headers .= "Reply-To: hr@brighters.com\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    
    return mail($to, $subject, $message, $headers);
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['type']) && $_GET['type'] === 'applications') {
            $applications = json_decode(file_get_contents($applicationsFile), true);
            echo json_encode($applications);
        } else {
            $jobs = json_decode(file_get_contents($dataFile), true);
            echo json_encode($jobs);
        }
        break;
        
    case 'POST':
        if (isset($_POST['action']) && $_POST['action'] === 'apply') {
            $applications = json_decode(file_get_contents($applicationsFile), true);
            $jobs = json_decode(file_get_contents($dataFile), true);
            
            $jobTitle = 'Unknown Position';
            foreach ($jobs as $job) {
                if ($job['id'] == $_POST['job_id']) {
                    $jobTitle = $job['title'];
                    break;
                }
            }
            
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
                'cv_file' => $cvFileName,
                'applied_date' => date('Y-m-d H:i:s')
            ];
            
            $applications[] = $newApplication;
            file_put_contents($applicationsFile, json_encode($applications));
            
            sendApplicationEmail($_POST['email'], $_POST['name'], $jobTitle);
            
            echo json_encode(['success' => true, 'message' => 'Application submitted successfully']);
            
        } else if (isset($_POST['action']) && $_POST['action'] === 'add') {
            if (isset($_POST['password']) && $_POST['password'] === 'admin123') {
                $jobs = json_decode(file_get_contents($dataFile), true);
                
                $imageFileName = '';
                if (isset($_FILES['job_image']) && $_FILES['job_image']['error'] === 0) {
                    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
                    $fileType = $_FILES['job_image']['type'];
                    
                    if (in_array($fileType, $allowedTypes)) {
                        $extension = pathinfo($_FILES['job_image']['name'], PATHINFO_EXTENSION);
                        $imageFileName = time() . '_job.' . $extension;
                        move_uploaded_file($_FILES['job_image']['tmp_name'], $jobImagesDir . $imageFileName);
                    }
                }
                
                $newJob = [
                    'id' => time(),
                    'title' => $_POST['title'],
                    'company' => $_POST['company'],
                    'location' => $_POST['location'],
                    'salary' => $_POST['salary'],
                    'deadline' => $_POST['deadline'],
                    'description' => $_POST['description'],
                    'image' => $imageFileName,
                    'postedDate' => date('Y-m-d')
                ];
                
                $jobs[] = $newJob;
                file_put_contents($dataFile, json_encode($jobs));
                echo json_encode(['success' => true, 'message' => 'Job posted successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Invalid password']);
            }
        } else {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (isset($input['action']) && $input['action'] === 'clear_all' && isset($input['password']) && $input['password'] === 'admin123') {
                file_put_contents($dataFile, json_encode([]));
                file_put_contents($applicationsFile, json_encode([]));
                
                $files = glob($uploadsDir . '*');
                foreach($files as $file) {
                    if(is_file($file)) unlink($file);
                }
                
                $files = glob($jobImagesDir . '*');
                foreach($files as $file) {
                    if(is_file($file)) unlink($file);
                }
                
                echo json_encode(['success' => true, 'message' => 'All data cleared successfully']);
            }
        }
        break;
        
    case 'DELETE':
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
?>