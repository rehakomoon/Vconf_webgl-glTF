<?php
ob_start(); // 出力バッファ開始

$allowed_origin = 'https://3dobjcttest.yashubustudioetc.com';

if (isset($_SERVER['HTTP_ORIGIN'])) {
    if ($_SERVER['HTTP_ORIGIN'] === $allowed_origin) {
        header("Access-Control-Allow-Origin: $allowed_origin");
        header("Access-Control-Allow-Methods: POST");
        header("Access-Control-Allow-Headers: Content-Type");
    } else {
        http_response_code(403);
        echo json_encode(['error' => 'CORS policy: origin not allowed']);
        ob_end_flush(); exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    ob_end_flush(); exit;
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded or upload error']);
    ob_end_flush(); exit;
}

$allowedExtensions = ['zip', 'glb'];
$originalName = $_FILES['file']['name'];
$ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

if (!in_array($ext, $allowedExtensions)) {
    http_response_code(400);
    echo json_encode(['error' => 'Unsupported file type']);
    ob_end_flush(); exit;
}

$uploadDir = __DIR__ . '/uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$uniqueName = uniqid() . '-' . bin2hex(random_bytes(4)) . '.' . $ext;
$savePath = $uploadDir . $uniqueName;

if (move_uploaded_file($_FILES['file']['tmp_name'], $savePath)) {
    echo json_encode(['fileName' => $uniqueName]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save file']);
}

ob_end_flush(); // バッファ終了
