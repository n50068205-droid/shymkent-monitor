<?php
/**
 * API: /api/cameras.php
 * GET    — тізімді алу
 * POST   — камера қосу
 * DELETE — жою (?id=...)
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
        $stmt = $pdo->query("SELECT * FROM cameras ORDER BY created_at DESC LIMIT 200");
        $rows = $stmt->fetchAll();
        $result = array_map(fn($r) => [
            'id'       => $r['id'],
            'name'     => $r['name'],
            'district' => $r['district'],
            'quality'  => $r['quality'],
            'loc'      => $r['loc'],
            'status'   => $r['status'],
            'lat'      => $r['lat'] ? (float)$r['lat'] : null,
            'lng'      => $r['lng'] ? (float)$r['lng'] : null,
            'created'  => $r['created_at'],
        ], $rows);
        jsonResponse(['data' => $result, 'total' => count($result)]);
        break;

    case 'POST':
        $body = getBody();
        if (empty($body['lat']) || empty($body['lng'])) jsonResponse(['error' => 'координаттар міндетті'], 400);

        $id = 'cam_' . time() . '_' . bin2hex(random_bytes(3));
        $stmt = $pdo->prepare("
            INSERT INTO cameras (id, name, district, quality, loc, status, lat, lng)
            VALUES (:id, :name, :district, :quality, :loc, :status, :lat, :lng)
        ");
        $stmt->execute([
            ':id'       => $id,
            ':name'     => substr($body['name'] ?? 'Камера', 0, 255),
            ':district' => substr($body['district'] ?? '', 0, 50),
            ':quality'  => in_array($body['quality'] ?? '', ['HD','Full HD','4K','SD']) ? $body['quality'] : 'HD',
            ':loc'      => substr($body['loc'] ?? '', 0, 255),
            ':status'   => in_array($body['status'] ?? '', ['ok','repair','off']) ? $body['status'] : 'ok',
            ':lat'      => (float)$body['lat'],
            ':lng'      => (float)$body['lng'],
        ]);

        $new = $pdo->query("SELECT * FROM cameras WHERE id = '$id'")->fetch();
        jsonResponse([
            'success' => true,
            'camera' => [
                'id'      => $new['id'],
                'name'    => $new['name'],
                'district'=> $new['district'],
                'quality' => $new['quality'],
                'loc'     => $new['loc'],
                'status'  => $new['status'],
                'lat'     => (float)$new['lat'],
                'lng'     => (float)$new['lng'],
                'created' => $new['created_at'],
            ]
        ], 201);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? '';
        if (!$id) jsonResponse(['error' => 'id міндетті'], 400);

        $stmt = $pdo->prepare("DELETE FROM cameras WHERE id = :id");
        $stmt->execute([':id' => $id]);
        if ($stmt->rowCount() === 0) jsonResponse(['error' => 'Табылмады'], 404);
        jsonResponse(['success' => true, 'deleted' => $id]);
        break;

    default:
        jsonResponse(['error' => 'Рұқсат етілмеген метод'], 405);
}