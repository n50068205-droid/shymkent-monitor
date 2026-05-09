<?php
/**
 * API: /api/buildings.php
 * GET    — тізімді алу
 * POST   — ғимарат қосу
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
        $stmt = $pdo->query("SELECT * FROM buildings ORDER BY created_at DESC LIMIT 200");
        $rows = $stmt->fetchAll();
        $result = array_map(fn($r) => [
            'id'       => $r['id'],
            'name'     => $r['name'],
            'type'     => $r['type'],
            'district' => $r['district'],
            'desc'     => $r['description'],
            'emoji'    => $r['emoji'],
            'lat'      => $r['lat'] ? (float)$r['lat'] : null,
            'lng'      => $r['lng'] ? (float)$r['lng'] : null,
            'created'  => $r['created_at'],
        ], $rows);
        jsonResponse(['data' => $result, 'total' => count($result)]);
        break;

    case 'POST':
        $body = getBody();
        if (empty($body['name'])) jsonResponse(['error' => 'name міндетті'], 400);
        if (empty($body['lat']) || empty($body['lng'])) jsonResponse(['error' => 'координаттар міндетті'], 400);

        $id = 'bld_' . time() . '_' . bin2hex(random_bytes(3));
        $stmt = $pdo->prepare("
            INSERT INTO buildings (id, name, type, district, description, emoji, lat, lng)
            VALUES (:id, :name, :type, :district, :desc, :emoji, :lat, :lng)
        ");
        $stmt->execute([
            ':id'       => $id,
            ':name'     => substr($body['name'] ?? '', 0, 255),
            ':type'     => substr($body['type'] ?? '', 0, 100),
            ':district' => substr($body['district'] ?? '', 0, 50),
            ':desc'     => $body['desc'] ?? '',
            ':emoji'    => mb_substr($body['emoji'] ?? '🏢', 0, 5),
            ':lat'      => (float)$body['lat'],
            ':lng'      => (float)$body['lng'],
        ]);

        $new = $pdo->query("SELECT * FROM buildings WHERE id = '$id'")->fetch();
        jsonResponse([
            'success' => true,
            'building' => [
                'id'      => $new['id'],
                'name'    => $new['name'],
                'type'    => $new['type'],
                'district'=> $new['district'],
                'desc'    => $new['description'],
                'emoji'   => $new['emoji'],
                'lat'     => (float)$new['lat'],
                'lng'     => (float)$new['lng'],
                'created' => $new['created_at'],
            ]
        ], 201);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? '';
        if (!$id) jsonResponse(['error' => 'id міндетті'], 400);

        $stmt = $pdo->prepare("DELETE FROM buildings WHERE id = :id");
        $stmt->execute([':id' => $id]);
        if ($stmt->rowCount() === 0) jsonResponse(['error' => 'Табылмады'], 404);
        jsonResponse(['success' => true, 'deleted' => $id]);
        break;

    default:
        jsonResponse(['error' => 'Рұқсат етілмеген метод'], 405);
}