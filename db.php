<?php
// db.php — Railway MySQL байланысы
define('DB_HOST',    getenv('MYSQLHOST')     ?: 'localhost');
define('DB_PORT',    getenv('MYSQLPORT')     ?: '3306');
define('DB_USER',    getenv('MYSQLUSER')     ?: 'root');
define('DB_PASS',    getenv('MYSQLPASSWORD') ?: '');
define('DB_NAME',    getenv('MYSQLDATABASE') ?: 'railway');
define('DB_CHARSET', 'utf8mb4');

function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            die(json_encode(['error' => 'DB connection failed: ' . $e->getMessage()]));
        }
    }
    return $pdo;
}

// JSON response helper
function jsonResponse(mixed $data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// Sanitize input
function clean(string $val): string {
    return htmlspecialchars(strip_tags(trim($val)), ENT_QUOTES, 'UTF-8');
}

// JSON body helper
function getBody(): array {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}
