<?php
/**
 * API: /api/incidents.php
 * GET    — тізімді алу
 * POST   — жаңа оқиға қосу
 * DELETE — оқиғаны жою (?id=...)
 */

require_once __DIR__ . '/../includes/db.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

$pdo = getDB();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    case 'GET':
        $district = $_GET['district'] ?? '';
        $limit    = min((int)($_GET['limit'] ?? 200), 500);
        $offset   = (int)($_GET['offset'] ?? 0);

        $where = $district ? "WHERE district = :district" : "";
        $params = $district ? [':district' => $district] : [];

        $sql = "SELECT * FROM incidents $where ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
        $stmt = $pdo->prepare($sql);
        foreach ($params as $k => $v) $stmt->bindValue($k, $v);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll();

        // Кері үйлесімділік үшін поле атауларын map-таймыз
        $result = array_map(function($r) {
            return [
                'id'       => $r['id'],
                'type'     => $r['type'],
                'loc'      => $r['loc'],
                'district' => $r['district'],
                'sev'      => $r['sev'],
                'time'     => $r['time_val'],
                'desc'     => $r['description'],
                'lat'      => $r['lat'] ? (float)$r['lat'] : null,
                'lng'      => $r['lng'] ? (float)$r['lng'] : null,
                'source'   => $r['source'],
                'created'  => $r['created_at'],
            ];
        }, $rows);

        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM incidents $where");
        foreach ($params as $k => $v) $countStmt->bindValue($k, $v);
        $countStmt->execute();
        $total = (int)$countStmt->fetchColumn();

        jsonResponse(['data' => $result, 'total' => $total, 'limit' => $limit, 'offset' => $offset]);
        break;

    case 'POST':
        $body = getBody();
        if (empty($body['type'])) {
            jsonResponse(['error' => 'type міндетті өріс'], 400);
        }

        $id = 'inc_' . time() . '_' . bin2hex(random_bytes(3));
        $stmt = $pdo->prepare("
            INSERT INTO incidents (id, type, loc, district, sev, time_val, description, lat, lng, source)
            VALUES (:id, :type, :loc, :district, :sev, :time_val, :desc, :lat, :lng, :source)
        ");
        $stmt->execute([
            ':id'       => $id,
            ':type'     => substr($body['type'] ?? '', 0, 100),
            ':loc'      => substr($body['loc'] ?? '', 0, 255),
            ':district' => substr($body['district'] ?? '', 0, 50),
            ':sev'      => in_array($body['sev'] ?? '', ['high','med','low']) ? $body['sev'] : 'med',
            ':time_val' => substr($body['time'] ?? '', 0, 10),
            ':desc'     => $body['desc'] ?? '',
            ':lat'      => isset($body['lat']) ? (float)$body['lat'] : null,
            ':lng'      => isset($body['lng']) ? (float)$body['lng'] : null,
            ':source'   => in_array($body['source'] ?? '', ['manual','auto']) ? $body['source'] : 'manual',
        ]);

        $newRow = $pdo->query("SELECT * FROM incidents WHERE id = '$id'")->fetch();
        jsonResponse([
            'success' => true,
            'incident' => [
                'id'      => $newRow['id'],
                'type'    => $newRow['type'],
                'loc'     => $newRow['loc'],
                'district'=> $newRow['district'],
                'sev'     => $newRow['sev'],
                'time'    => $newRow['time_val'],
                'desc'    => $newRow['description'],
                'lat'     => $newRow['lat'] ? (float)$newRow['lat'] : null,
                'lng'     => $newRow['lng'] ? (float)$newRow['lng'] : null,
                'source'  => $newRow['source'],
                'created' => $newRow['created_at'],
            ]
        ], 201);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? '';
        if (!$id) jsonResponse(['error' => 'id міндетті'], 400);

        $stmt = $pdo->prepare("DELETE FROM incidents WHERE id = :id");
        $stmt->execute([':id' => $id]);

        if ($stmt->rowCount() === 0) {
            jsonResponse(['error' => 'Табылмады'], 404);
        }
        jsonResponse(['success' => true, 'deleted' => $id]);
        break;

    default:
        jsonResponse(['error' => 'Рұқсат етілмеген метод'], 405);
}