<?php
// api.php — REST API (Incidents, Buildings, Cameras)
// URL: http://localhost/shymkent_monitor/api.php?resource=incidents&action=list
require_once 'db.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$resource = $_GET['resource'] ?? '';
$action   = $_GET['action']   ?? '';
$method   = $_SERVER['REQUEST_METHOD'];

// ─── ROUTER ──────────────────────────────────────────────
match ($resource) {
    'incidents' => handleIncidents($action, $method),
    'buildings' => handleBuildings($action, $method),
    'cameras'   => handleCameras($action, $method),
    'stats'     => handleStats(),
    'export'    => handleExport(),
    default     => jsonResponse(['error' => 'Unknown resource'], 404),
};

// ════════════════════════════════════════════════════════
// INCIDENTS
// ════════════════════════════════════════════════════════
function handleIncidents(string $action, string $method): void {
    $db = getDB();

    // GET: list
    if ($method === 'GET' && $action === 'list') {
        $district = $_GET['district'] ?? '';
        $search   = $_GET['search']   ?? '';
        $type     = $_GET['type']     ?? '';
        $limit    = (int)($_GET['limit']  ?? 200);
        $offset   = (int)($_GET['offset'] ?? 0);

        $where  = ['1=1'];
        $params = [];

        if ($district) {
            $where[]  = 'district = :district';
            $params[':district'] = $district;
        }
        if ($search) {
            $where[]  = '(location LIKE :search OR type LIKE :search2)';
            $params[':search']  = "%$search%";
            $params[':search2'] = "%$search%";
        }
        if ($type) {
            $where[]  = 'type = :type';
            $params[':type'] = $type;
        }

        $sql  = 'SELECT * FROM incidents WHERE ' . implode(' AND ', $where)
              . ' ORDER BY created_at DESC LIMIT :limit OFFSET :offset';
        $stmt = $db->prepare($sql);
        foreach ($params as $k => $v) $stmt->bindValue($k, $v);
        $stmt->bindValue(':limit',  $limit,  PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $rows = $stmt->fetchAll();
        jsonResponse(['data' => $rows, 'count' => count($rows)]);
    }

    // POST: add
    if ($method === 'POST' && $action === 'add') {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        $type     = clean($body['type']     ?? '');
        $location = clean($body['loc']      ?? '');
        $district = clean($body['district'] ?? '');
        $time_val = clean($body['time']     ?? date('H:i'));
        $severity = clean($body['sev']      ?? 'med');
        $descr    = clean($body['desc']     ?? '');
        $lat      = isset($body['lat'])  ? (float)$body['lat']  : null;
        $lng      = isset($body['lng'])  ? (float)$body['lng']  : null;
        $source   = in_array($body['source'] ?? '', ['manual','auto']) ? $body['source'] : 'manual';

        if (!$type || !$district) {
            jsonResponse(['error' => 'type and district are required'], 422);
        }

        $stmt = $db->prepare('
            INSERT INTO incidents (type, location, district, time_val, severity, description, lat, lng, source)
            VALUES (:type, :location, :district, :time_val, :severity, :description, :lat, :lng, :source)
        ');
        $stmt->execute([
            ':type'        => $type,
            ':location'    => $location,
            ':district'    => $district,
            ':time_val'    => $time_val,
            ':severity'    => $severity,
            ':description' => $descr,
            ':lat'         => $lat,
            ':lng'         => $lng,
            ':source'      => $source,
        ]);

        $id = $db->lastInsertId();
        jsonResponse(['success' => true, 'id' => $id, 'message' => 'Оқиға сақталды'], 201);
    }

    // DELETE: remove
    if ($method === 'DELETE' && $action === 'delete') {
        $id = (int)($_GET['id'] ?? 0);
        if (!$id) jsonResponse(['error' => 'id required'], 422);

        $stmt = $db->prepare('DELETE FROM incidents WHERE id = :id');
        $stmt->execute([':id' => $id]);
        jsonResponse(['success' => true, 'deleted_id' => $id]);
    }

    // DELETE: clear all
    if ($method === 'DELETE' && $action === 'clear') {
        $db->exec('DELETE FROM incidents');
        jsonResponse(['success' => true, 'message' => 'Барлық оқиғалар өшірілді']);
    }

    jsonResponse(['error' => 'Unknown action'], 400);
}

// ════════════════════════════════════════════════════════
// BUILDINGS
// ════════════════════════════════════════════════════════
function handleBuildings(string $action, string $method): void {
    $db = getDB();

    if ($method === 'GET' && $action === 'list') {
        $stmt = $db->query('SELECT * FROM buildings ORDER BY created_at DESC');
        jsonResponse(['data' => $stmt->fetchAll()]);
    }

    if ($method === 'POST' && $action === 'add') {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        $name     = clean($body['name']     ?? '');
        $type     = clean($body['type']     ?? 'Басқа');
        $district = clean($body['district'] ?? '');
        $descr    = clean($body['desc']     ?? '');
        $emoji    = clean($body['emoji']    ?? '🏢');
        $lat      = isset($body['lat']) ? (float)$body['lat'] : null;
        $lng      = isset($body['lng']) ? (float)$body['lng'] : null;

        if (!$name || !$lat || !$lng) {
            jsonResponse(['error' => 'name, lat, lng required'], 422);
        }

        $stmt = $db->prepare('
            INSERT INTO buildings (name, type, district, description, emoji, lat, lng)
            VALUES (:name, :type, :district, :description, :emoji, :lat, :lng)
        ');
        $stmt->execute([
            ':name'        => $name,
            ':type'        => $type,
            ':district'    => $district,
            ':description' => $descr,
            ':emoji'       => $emoji,
            ':lat'         => $lat,
            ':lng'         => $lng,
        ]);

        jsonResponse(['success' => true, 'id' => $db->lastInsertId()], 201);
    }

    if ($method === 'DELETE' && $action === 'delete') {
        $id = (int)($_GET['id'] ?? 0);
        if (!$id) jsonResponse(['error' => 'id required'], 422);
        $db->prepare('DELETE FROM buildings WHERE id = :id')->execute([':id' => $id]);
        jsonResponse(['success' => true]);
    }

    jsonResponse(['error' => 'Unknown action'], 400);
}

// ════════════════════════════════════════════════════════
// CAMERAS
// ════════════════════════════════════════════════════════
function handleCameras(string $action, string $method): void {
    $db = getDB();

    if ($method === 'GET' && $action === 'list') {
        $stmt = $db->query('SELECT * FROM cameras ORDER BY created_at DESC');
        jsonResponse(['data' => $stmt->fetchAll()]);
    }

    if ($method === 'POST' && $action === 'add') {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        $name     = clean($body['name']     ?? '');
        $district = clean($body['district'] ?? '');
        $quality  = clean($body['quality']  ?? 'HD');
        $location = clean($body['loc']      ?? '');
        $status   = in_array($body['status'] ?? '', ['ok','repair','off']) ? $body['status'] : 'ok';
        $lat      = isset($body['lat']) ? (float)$body['lat'] : null;
        $lng      = isset($body['lng']) ? (float)$body['lng'] : null;

        if (!$lat || !$lng) jsonResponse(['error' => 'lat, lng required'], 422);

        $stmt = $db->prepare('
            INSERT INTO cameras (name, district, quality, location, status, lat, lng)
            VALUES (:name, :district, :quality, :location, :status, :lat, :lng)
        ');
        $stmt->execute([
            ':name'     => $name,
            ':district' => $district,
            ':quality'  => $quality,
            ':location' => $location,
            ':status'   => $status,
            ':lat'      => $lat,
            ':lng'      => $lng,
        ]);

        jsonResponse(['success' => true, 'id' => $db->lastInsertId()], 201);
    }

    if ($method === 'DELETE' && $action === 'delete') {
        $id = (int)($_GET['id'] ?? 0);
        if (!$id) jsonResponse(['error' => 'id required'], 422);
        $db->prepare('DELETE FROM cameras WHERE id = :id')->execute([':id' => $id]);
        jsonResponse(['success' => true]);
    }

    jsonResponse(['error' => 'Unknown action'], 400);
}

// ════════════════════════════════════════════════════════
// STATS
// ════════════════════════════════════════════════════════
function handleStats(): void {
    $db = getDB();

    // Total incidents
    $total = (int)$db->query('SELECT COUNT(*) FROM incidents')->fetchColumn();

    // By severity
    $sevStmt = $db->query('SELECT severity, COUNT(*) as cnt FROM incidents GROUP BY severity');
    $bySev   = [];
    foreach ($sevStmt->fetchAll() as $row) $bySev[$row['severity']] = (int)$row['cnt'];

    // By district
    $distStmt = $db->query('SELECT district, COUNT(*) as cnt FROM incidents GROUP BY district ORDER BY cnt DESC');
    $byDist   = $distStmt->fetchAll();

    // By type
    $typeStmt = $db->query('SELECT type, COUNT(*) as cnt FROM incidents GROUP BY type ORDER BY cnt DESC LIMIT 10');
    $byType   = $typeStmt->fetchAll();

    // By hour
    $hourStmt = $db->query('SELECT HOUR(created_at) as h, COUNT(*) as cnt FROM incidents GROUP BY h ORDER BY h');
    $byHour   = array_fill(0, 24, 0);
    foreach ($hourStmt->fetchAll() as $row) $byHour[(int)$row['h']] = (int)$row['cnt'];

    // Buildings & Cameras count
    $bldCount = (int)$db->query('SELECT COUNT(*) FROM buildings')->fetchColumn();
    $camCount = (int)$db->query('SELECT COUNT(*) FROM cameras')->fetchColumn();

    // Source breakdown
    $manual = (int)$db->query("SELECT COUNT(*) FROM incidents WHERE source='manual'")->fetchColumn();
    $auto   = (int)$db->query("SELECT COUNT(*) FROM incidents WHERE source='auto'")->fetchColumn();

    jsonResponse([
        'total'      => $total,
        'by_severity'=> $bySev,
        'by_district'=> $byDist,
        'by_type'    => $byType,
        'by_hour'    => $byHour,
        'buildings'  => $bldCount,
        'cameras'    => 42 + $camCount,
        'source'     => ['manual' => $manual, 'auto' => $auto],
    ]);
}

// ════════════════════════════════════════════════════════
// EXPORT CSV
// ════════════════════════════════════════════════════════
function handleExport(): void {
    $db = getDB();
    $stmt = $db->query('SELECT * FROM incidents ORDER BY created_at DESC');
    $rows = $stmt->fetchAll();

    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="shymkent_monitor_' . date('Y-m-d') . '.csv"');
    header('Access-Control-Allow-Origin: *');

    $out = fopen('php://output', 'w');
    fprintf($out, chr(0xEF).chr(0xBB).chr(0xBF)); // UTF-8 BOM for Excel

    fputcsv($out, ['ID','Бап','Мекенжай','Аудан','Маңыздылық','Уақыт','Дата','Lat','Lng','Дереккөз'], ';');
    foreach ($rows as $r) {
        fputcsv($out, [
            $r['id'], $r['type'], $r['location'], $r['district'],
            $r['severity'], $r['time_val'],
            date('d.m.Y', strtotime($r['created_at'])),
            $r['lat'], $r['lng'], $r['source']
        ], ';');
    }
    fclose($out);
    exit;
}