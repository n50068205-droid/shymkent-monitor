<?php
/**
 * INSTALL.PHP — Орнату скрипті
 * Бір рет іске қосыңыз: http://localhost/shymkent/install.php
 * Орнатудан кейін бұл файлды жойыңыз немесе атын өзгертіңіз!
 */

$host = 'localhost';
$user = 'root';
$pass = '';
$dbName = 'shymkent_db';

try {
    // Базаны жасаймыз
    $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `$dbName`");

    // Оқиғалар кестесі
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS incidents (
            id          VARCHAR(40) PRIMARY KEY,
            type        VARCHAR(100) NOT NULL,
            loc         VARCHAR(255) NOT NULL DEFAULT '',
            district    VARCHAR(50)  NOT NULL DEFAULT '',
            sev         ENUM('high','med','low') NOT NULL DEFAULT 'med',
            time_val    VARCHAR(10)  NOT NULL DEFAULT '',
            description TEXT,
            lat         DOUBLE,
            lng         DOUBLE,
            source      ENUM('manual','auto') NOT NULL DEFAULT 'manual',
            created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_district (district),
            INDEX idx_created  (created_at),
            INDEX idx_sev      (sev)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Ғимараттар кестесі
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS buildings (
            id          VARCHAR(40) PRIMARY KEY,
            name        VARCHAR(255) NOT NULL,
            type        VARCHAR(100) NOT NULL DEFAULT '',
            district    VARCHAR(50)  NOT NULL DEFAULT '',
            description TEXT,
            emoji       VARCHAR(10)  NOT NULL DEFAULT '🏢',
            lat         DOUBLE,
            lng         DOUBLE,
            created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_district (district)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Камералар кестесі
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS cameras (
            id          VARCHAR(40) PRIMARY KEY,
            name        VARCHAR(255) NOT NULL,
            district    VARCHAR(50)  NOT NULL DEFAULT '',
            quality     VARCHAR(20)  NOT NULL DEFAULT 'HD',
            loc         VARCHAR(255) NOT NULL DEFAULT '',
            status      ENUM('ok','repair','off') NOT NULL DEFAULT 'ok',
            lat         DOUBLE,
            lng         DOUBLE,
            created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_district (district),
            INDEX idx_status   (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Параметрлер кестесі
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS settings (
            key_name    VARCHAR(50) PRIMARY KEY,
            val         TEXT NOT NULL,
            updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Әдепкі параметрлер
    $pdo->exec("
        INSERT IGNORE INTO settings (key_name, val) VALUES
        ('theme', 'light'),
        ('autoMode', 'false')
    ");

    echo '<!DOCTYPE html>
<html lang="kk">
<head><meta charset="UTF-8"><title>Орнату</title>
<style>
  body{font-family:sans-serif;background:#f0f2f5;display:flex;justify-content:center;align-items:center;height:100vh;margin:0}
  .box{background:#fff;border-radius:12px;padding:32px 40px;box-shadow:0 4px 24px rgba(0,0,0,.1);max-width:460px;width:100%}
  h2{color:#2e7d32;margin-bottom:16px}
  p{color:#4a5568;font-size:14px;line-height:1.6}
  .ok{color:#2e7d32;font-weight:700}
  .warn{color:#e65100;font-weight:700}
  a{display:inline-block;margin-top:20px;padding:10px 24px;background:#1565c0;color:#fff;border-radius:8px;text-decoration:none;font-weight:600}
  a:hover{background:#0d47a1}
</style>
</head>
<body>
<div class="box">
  <h2>✅ Орнату сәтті аяқталды!</h2>
  <p><span class="ok">shymkent_db</span> деректер базасы жасалды.<br>
  Барлық кестелер (<code>incidents</code>, <code>buildings</code>, <code>cameras</code>, <code>settings</code>) сәтті жасалды.</p>
  <p class="warn">⚠️ Қауіпсіздік үшін install.php файлын жойыңыз!</p>
  <a href="index.php">🚀 Жүйеге өту →</a>
</div>
</body>
</html>';

} catch (PDOException $e) {
    echo '<!DOCTYPE html>
<html lang="kk"><head><meta charset="UTF-8"><title>Қате</title>
<style>body{font-family:sans-serif;background:#fff0f0;display:flex;justify-content:center;align-items:center;height:100vh}
.box{background:#fff;border-radius:12px;padding:32px 40px;box-shadow:0 4px 24px rgba(0,0,0,.1);max-width:500px}
h2{color:#e53935}pre{background:#fce4ec;padding:12px;border-radius:6px;font-size:12px;overflow:auto}</style>
</head><body>
<div class="box">
  <h2>❌ Қосылу қатесі</h2>
  <p>MySQL-ге қосыла алмадым. <strong>includes/db.php</strong> файлындағы деректерді тексеріңіз:</p>
  <pre>' . htmlspecialchars($e->getMessage()) . '</pre>
  <p>XAMPP-та MySQL іске қосылғанын тексеріңіз (Apache + MySQL).</p>
</div>
</body></html>';
}