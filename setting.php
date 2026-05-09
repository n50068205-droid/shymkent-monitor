<?php
/**
 * API: /api/settings.php — GET жалпы статистика + параметрлер
 * API: /api/stats.php alias
 */

require_once __DIR__ . '/../includes/db.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

$pdo = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Параметрлер
    $settingsStmt = $pdo->query("SELECT key_name, val FROM settings");
    $settings = [];
    foreach ($settingsStmt->fetchAll() as $row) {
        $settings[$row['key_name']] = $row['val'];
    }

    // Жалпы санақ
    $totalInc  = (int)$pdo->query("SELECT COUNT(*) FROM incidents")->fetchColumn();
    $totalBld  = (int)$pdo->query("SELECT COUNT(*) FROM buildings")->fetchColumn();
    $totalCam  = (int)$pdo->query("SELECT COUNT(*) FROM cameras")->fetchColumn();
    $manualInc = (int)$pdo->query("SELECT COUNT(*) FROM incidents WHERE source='manual'")->fetchColumn();
    $autoInc   = (int)$pdo->query("SELECT COUNT(*) FROM incidents WHERE source='auto'")->fetchColumn();

    // Сағат бойынша
    $byHour = array_fill(0, 24, 0);
    $hourStmt = $pdo->query("SELECT HOUR(created_at) as h, COUNT(*) as cnt FROM incidents GROUP BY h");
    foreach ($hourStmt->fetchAll() as $row) {
        $byHour[(int)$row['h']] = (int)$row['cnt'];
    }

    // Аудан бойынша
    $byDistrict = [];
    $distStmt = $pdo->query("SELECT district, COUNT(*) as cnt FROM incidents GROUP BY district");
    foreach ($distStmt->fetchAll() as $row) {
        $byDistrict[$row['district']] = (int)$row['cnt'];
    }

    jsonResponse([
        'settings'   => $settings,
        'incidents'  => ['total' => $totalInc, 'manual' => $manualInc, 'auto' => $autoInc],
        'buildings'  => ['total' => $totalBld],
        'cameras'    => ['total' => 42 + $totalCam], // 42 = базалық камералар
        'byHour'     => $byHour,
        'byDistrict' => $byDistrict,
    ]);
}

if ($method === 'POST') {
    $body = getBody();
    if (empty($body['key']) || !isset($body['value'])) {
        jsonResponse(['error' => 'key және value міндетті'], 400);
    }

    $allowedKeys = ['theme', 'autoMode'];
    if (!in_array($body['key'], $allowedKeys)) {
        jsonResponse(['error' => 'Бұл кілт рұқсат етілмеген'], 400);
    }

    $stmt = $pdo->prepare("
        INSERT INTO settings (key_name, val) VALUES (:k, :v)
        ON DUPLICATE KEY UPDATE val = :v2
    ");
    $stmt->execute([':k' => $body['key'], ':v' => $body['value'], ':v2' => $body['value']]);
    jsonResponse(['success' => true]);
}