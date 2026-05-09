-- schema.sql
-- phpMyAdmin немесе XAMPP MySQL арқылы іске қосыңыз
-- http://localhost/phpmyadmin → SQL қойындысы

-- 1. Дерекқорды жасау
CREATE DATABASE IF NOT EXISTS shymkent_monitor
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE shymkent_monitor;

-- ──────────────────────────────────────────────────────
-- 2. INCIDENTS кестесі
-- ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS incidents (
  id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  type        VARCHAR(100)    NOT NULL COMMENT 'ст.190, ЖКО, ҰРЛЫҚ...',
  location    VARCHAR(255)    NOT NULL DEFAULT '' COMMENT 'Мекенжай',
  district    VARCHAR(50)     NOT NULL COMMENT 'alfarabi|abay|karatau|enbekshi|turan',
  time_val    VARCHAR(10)     NOT NULL DEFAULT '' COMMENT 'HH:MM',
  severity    ENUM('high','med','low') NOT NULL DEFAULT 'med',
  description TEXT            DEFAULT NULL,
  lat         DECIMAL(10,7)   DEFAULT NULL,
  lng         DECIMAL(10,7)   DEFAULT NULL,
  source      ENUM('manual','auto') NOT NULL DEFAULT 'manual',
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_district  (district),
  INDEX idx_severity  (severity),
  INDEX idx_type      (type),
  INDEX idx_created   (created_at),
  INDEX idx_source    (source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Тіркелген оқиғалар';

-- ──────────────────────────────────────────────────────
-- 3. BUILDINGS кестесі
-- ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS buildings (
  id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  name        VARCHAR(200)    NOT NULL,
  type        VARCHAR(100)    NOT NULL DEFAULT 'Басқа',
  district    VARCHAR(50)     NOT NULL DEFAULT '',
  description TEXT            DEFAULT NULL,
  emoji       VARCHAR(10)     NOT NULL DEFAULT '🏢',
  lat         DECIMAL(10,7)   NOT NULL,
  lng         DECIMAL(10,7)   NOT NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_district (district)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Пайдаланушы белгілеген ғимараттар';

-- ──────────────────────────────────────────────────────
-- 4. CAMERAS кестесі
-- ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cameras (
  id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100)    NOT NULL DEFAULT '',
  district    VARCHAR(50)     NOT NULL DEFAULT '',
  quality     ENUM('HD','Full HD','4K','SD') NOT NULL DEFAULT 'HD',
  location    VARCHAR(255)    NOT NULL DEFAULT '',
  status      ENUM('ok','repair','off')      NOT NULL DEFAULT 'ok',
  lat         DECIMAL(10,7)   NOT NULL,
  lng         DECIMAL(10,7)   NOT NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_district (district),
  INDEX idx_status   (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Пайдаланушы қосқан камералар';

-- ──────────────────────────────────────────────────────
-- 5. Тест деректері (кейін өшіруге болады)
-- ──────────────────────────────────────────────────────
INSERT INTO incidents (type, location, district, time_val, severity, description, lat, lng, source) VALUES
('ст.190',  'Тәуелсіздік даңғылы, 45',  'alfarabi', '10:30', 'high', 'Алаяқтық — онлайн аударым',  42.3190, 69.5870, 'manual'),
('ст.188',  'Абай даңғылы, 12',          'abay',     '14:15', 'med',  'Дүкеннен ұрлық',             42.3450, 69.6100, 'manual'),
('ЖКО',     'Байтерек к-сі, 88',         'karatau',  '08:00', 'high', 'Жеңіл соқтығысу, зиян жоқ', 42.3500, 69.5700, 'manual'),
('ст.296',  'Манкент тас жолы',          'enbekshi', '22:45', 'low',  'Бұзақылық, жастар',          42.3180, 69.6100, 'manual'),
('ст.109-1','Желтоқсан к-сі, 5',         'turan',    '16:00', 'med',  'Дене жарақаты',              42.3250, 69.5800, 'manual');

-- Камера тест
INSERT INTO cameras (name, district, quality, location, status, lat, lng) VALUES
('Камера #43', 'alfarabi', 'HD',      'Тәуелсіздік даңғылы, 45',  'ok',     42.3190, 69.5870),
('Камера #44', 'abay',     'Full HD', 'Абай даңғылы, 1',           'ok',     42.3410, 69.5950),
('Камера #45', 'karatau',  'HD',      'Каратаевская к-сі, 55',     'repair', 42.3500, 69.5600);

-- ──────────────────────────────────────────────────────
-- ДАЙЫН! Осыдан кейін:
-- http://localhost/shymkent_monitor/
-- ──────────────────────────────────────────────────────