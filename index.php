<?php
// index.php — Шымкент Қауіпсіздік Мониторингі v7
// XAMPP: htdocs/shymkent_monitor/index.php
require_once 'db.php';
?>
<!DOCTYPE html>
<html lang="kk" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Шымкент — Қауіпсіздік мониторингі v7</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>

<!-- ====== INCIDENT MODAL ====== -->
<div id="modal-overlay">
  <div id="modal">
    <div class="modal-title">🚨 Оқиға қосу
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div id="modal-coords-display" class="coords-display" style="margin-bottom:11px;display:none">
      <div class="coords-dot"></div>
      <span id="modal-coords-text">—</span>
    </div>
    <div class="form-group">
      <label class="form-label">Оқиға түрі (бап)</label>
      <select class="form-input" id="m-type">
        <option value="ст.190">ст.190 — Алаяқтық</option>
        <option value="ст.188">ст.188 — Ұрлық</option>
        <option value="ст.109-1">ст.109-1 — Денсаулыққа зиян</option>
        <option value="ст.296">ст.296 — Бұзақылық</option>
        <option value="ст.108-1">ст.108-1 — Зорлық</option>
        <option value="ст.345">ст.345 — Лауазымды тұлғаға қарсылық</option>
        <option value="ст.107">ст.107 — Қасақана дене жарақаты</option>
        <option value="ст.293">ст.293 — Тонау</option>
        <option value="ст.139">ст.139 — Кісі өлтіру</option>
        <option value="ст.297">ст.297 — Тәртіп бұзу</option>
        <option value="ЖКО">ЖКО — Жол-көлік оқиғасы</option>
        <option value="ҰРЛЫҚ">ҰРЛЫҚ</option>
        <option value="ТОНАУ">ТОНАУ</option>
        <option value="ЗОРЛЫҚ">ЗОРЛЫҚ</option>
        <option value="АЛАЯҚТЫҚ">АЛАЯҚТЫҚ</option>
        <option value="НАШАҚОРЛЫҚ">НАШАҚОРЛЫҚ</option>
        <option value="БҰЗАҚЫЛЫҚ">БҰЗАҚЫЛЫҚ</option>
        <option value="ШАБУЫЛ">ШАБУЫЛ</option>
        <option value="КІСІ ӨЛТІРУ">КІСІ ӨЛТІРУ</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Мекенжай</label>
      <input type="text" class="form-input" id="m-loc" placeholder="Мысалы: Тәуелсіздік к-сі, 45">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Аудан</label>
        <select class="form-input" id="m-district">
          <option value="alfarabi">Аль-Фараби</option>
          <option value="abay">Абай</option>
          <option value="karatau">Қаратау</option>
          <option value="enbekshi">Еңбекшілер</option>
          <option value="turan">Туран</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Уақыт</label>
        <input type="time" class="form-input" id="m-time">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Маңыздылық</label>
      <div class="sev-btns">
        <button class="sev-btn active-high" id="sev-high" onclick="setSev('high')">🔴 Жоғары</button>
        <button class="sev-btn" id="sev-med" onclick="setSev('med')">🟡 Орта</button>
        <button class="sev-btn" id="sev-low" onclick="setSev('low')">🟢 Төмен</button>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Сипаттама</label>
      <input type="text" class="form-input" id="m-desc" placeholder="Қысқаша сипаттама...">
    </div>
    <div class="modal-actions">
      <button class="btn-cancel" onclick="closeModal()">Бас тарту</button>
      <button class="btn-save" onclick="saveIncident()">💾 Сақтау</button>
    </div>
  </div>
</div>

<!-- ====== BUILDING MODAL ====== -->
<div id="bld-modal-overlay">
  <div id="bld-modal">
    <div class="modal-title">🏢 Ғимарат қосу
      <button class="modal-close" onclick="closeBldModal()">✕</button>
    </div>
    <div id="bld-coords-display" class="coords-display" style="margin-bottom:11px;display:none">
      <div class="coords-dot" style="background:#6a1b9a"></div>
      <span id="bld-coords-text">—</span>
    </div>
    <div class="form-group">
      <label class="form-label">Атауы</label>
      <input type="text" class="form-input" id="b-name" placeholder="Мысалы: Центральный рынок...">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Нысан түрі</label>
        <select class="form-input" id="b-type">
          <option>Мектеп</option><option>Аурухана</option><option>Базар</option>
          <option>Мекеме</option><option>Банк</option><option>Мешіт</option>
          <option>Мейрамхана</option><option>Қонақ үй</option><option>Зауыт</option>
          <option>Тұрғын үй</option><option>Спорт</option><option>Басқа</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Аудан</label>
        <select class="form-input" id="b-district">
          <option value="alfarabi">Аль-Фараби</option>
          <option value="abay">Абай</option>
          <option value="karatau">Қаратау</option>
          <option value="enbekshi">Еңбекшілер</option>
          <option value="turan">Туran</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Белгіше</label>
      <div class="emoji-grid" id="emoji-grid"></div>
    </div>
    <div class="form-group">
      <label class="form-label">Сипаттама</label>
      <input type="text" class="form-input" id="b-desc" placeholder="Қосымша ақпарат...">
    </div>
    <div class="modal-actions">
      <button class="btn-cancel" onclick="closeBldModal()">Бас тарту</button>
      <button class="btn-save" style="background:linear-gradient(135deg,#6a1b9a,#4a148c)" onclick="saveBuilding()">💾 Сақтау</button>
    </div>
  </div>
</div>

<!-- ====== CAMERA MODAL ====== -->
<div id="cam-modal-overlay">
  <div id="cam-modal">
    <div class="modal-title">📷 Камера қосу
      <button class="modal-close" onclick="closeCamModal()">✕</button>
    </div>
    <div id="cam-coords-display" class="coords-display" style="margin-bottom:11px;display:none">
      <div class="coords-dot" style="background:#0277bd"></div>
      <span id="cam-coords-text">—</span>
    </div>
    <div class="form-group">
      <label class="form-label">Камера атауы / №</label>
      <input type="text" class="form-input" id="cam-name" placeholder="Мысалы: Камера #43">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Аудан</label>
        <select class="form-input" id="cam-district">
          <option value="alfarabi">Аль-Фараби</option>
          <option value="abay">Абай</option>
          <option value="karatau">Қаратау</option>
          <option value="enbekshi">Еңбекшілер</option>
          <option value="turan">Туран</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Сапа</label>
        <select class="form-input" id="cam-quality">
          <option value="HD">HD</option>
          <option value="Full HD">Full HD</option>
          <option value="4K">4K</option>
          <option value="SD">SD</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Мекенжай</label>
      <input type="text" class="form-input" id="cam-loc" placeholder="Мысалы: Тәуелсіздік к-сі, 45">
    </div>
    <div class="form-group">
      <label class="form-label">Күй</label>
      <div class="sev-btns">
        <button class="sev-btn active-low" id="cam-status-ok" onclick="setCamStatus('ok')">🟢 Жұмыс жасайды</button>
        <button class="sev-btn" id="cam-status-repair" onclick="setCamStatus('repair')">🟡 Жөндеуде</button>
        <button class="sev-btn" id="cam-status-off" onclick="setCamStatus('off')">🔴 Сөндірілген</button>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn-cancel" onclick="closeCamModal()">Бас тарту</button>
      <button class="btn-save" style="background:linear-gradient(135deg,#0277bd,#01579b)" onclick="saveCamera()">💾 Сақтау</button>
    </div>
  </div>
</div>

<!-- ====== ANALYTICS MODAL ====== -->
<div id="analytics-overlay">
  <div id="analytics-modal">
    <div class="modal-title">📊 Қала статистикасы — Шымкент 2024
      <button class="modal-close" onclick="closeAnalytics()">✕</button>
    </div>
    <div class="analytics-grid">
      <div class="analytics-card"><div class="ac-val" style="color:#e53935">1431</div><div class="ac-lbl">Жалпы тіркелген іс (2024)</div><div class="ac-trend trend-up">▲ +4.2% өткен жылдан</div></div>
      <div class="analytics-card"><div class="ac-val" style="color:#fb8c00">799</div><div class="ac-lbl">ст.190 Алаяқтық — ең жиі</div><div class="ac-trend trend-up">▲ 55.8% үлесі</div></div>
      <div class="analytics-card"><div class="ac-val" style="color:#1565c0">68%</div><div class="ac-lbl">Ашылу коэффициенті</div><div class="ac-trend trend-down">▼ +2.1% өсім</div></div>
      <div class="analytics-card"><div class="ac-val" style="color:#7b1fa2">1 302 868</div><div class="ac-lbl">Халық саны</div><div class="ac-trend trend-up">▲ Өсімде</div></div>
    </div>
    <div style="margin-bottom:16px">
      <div class="analytics-section-title">Аудандар бойынша — барлық баптар</div>
      <div id="analytics-bars"></div>
    </div>
    <div style="margin-bottom:16px">
      <div class="analytics-section-title">Жетекші баптар рейтингі</div>
      <div id="analytics-top-crimes"></div>
    </div>
    <div>
      <div class="analytics-section-title">Аудан профилі (радар)</div>
      <canvas id="radar-canvas" width="400" height="220"></canvas>
    </div>
  </div>
</div>

<!-- ====== TOPBAR ====== -->
<div id="topbar">
  <div class="logo">
    <div class="logo-badge"><div class="logo-pulse"></div>🛡 ШҚМ</div>
    <span style="font-size:13px">Шымкент мониторингі</span>
    <span style="font-size:9px;color:var(--text-muted);font-weight:400">v7.0 PHP</span>
  </div>
  <div class="topbar-stats">
    <div class="ts-chip"><div class="dot" style="background:#e53935"></div>Тіркелді: <strong id="stat-total">0</strong></div>
    <div class="ts-chip"><div class="dot" style="background:#fb8c00"></div>ст.190: <strong>799</strong></div>
    <div class="ts-chip"><div class="dot" style="background:#8e24aa"></div>ст.188: <strong>393</strong></div>
    <div class="ts-chip"><div class="dot" style="background:#2e7d32"></div>ст.109-1: <strong>239</strong></div>
    <div class="ts-chip"><div class="dot" style="background:#1565c0"></div>Патруль: <strong>10</strong></div>
    <div class="ts-chip"><div class="dot" style="background:#00897b"></div>Халық: <strong>1.30М</strong></div>
  </div>
  <div class="topbar-right">
    <button class="auto-btn" id="auto-btn" onclick="toggleAutoIncidents()">🤖 Авто</button>
    <button class="heatmap-btn" id="heatmap-btn" onclick="toggleHeatmap()">🌡 Жылу</button>
    <button class="cam-btn" id="place-cam-btn" onclick="toggleCameraMode()">📷 Камера</button>
    <button class="place-btn" id="place-inc-btn" onclick="toggleIncidentMode()">📍 Белгілеу</button>
    <button class="bld-btn" id="place-bld-btn" onclick="toggleBuildingMode()">🏢 Ғимарат</button>
    <button class="add-btn" onclick="openManualModal()">＋ Оқиға</button>
    <button class="theme-btn" id="theme-toggle" onclick="toggleTheme()">🌙 Қараңғы</button>
    <div id="clock">00:00:00 · 00.00.0000</div>
  </div>
</div>

<div id="main">
  <!-- ====== LEFT SIDEBAR ====== -->
  <div id="sidebar">
    <div class="sidebar-scroll">
      <div class="s-section">
        <div class="s-title">Іздеу</div>
        <input type="text" class="search-box" id="search-input" placeholder="🔍 Мекенжай немесе бап..." oninput="filterIncidents(this.value)">
        <div class="filter-chips" id="filter-chips">
          <span class="filter-chip" onclick="toggleFilter('ЖКО',this)">ЖКО</span>
          <span class="filter-chip" onclick="toggleFilter('ст.190',this)">ст.190</span>
          <span class="filter-chip" onclick="toggleFilter('ст.188',this)">ст.188</span>
          <span class="filter-chip" onclick="toggleFilter('ст.109-1',this)">ст.109-1</span>
          <span class="filter-chip" onclick="toggleFilter('ст.296',this)">ст.296</span>
          <span class="filter-chip" onclick="toggleFilter('ст.139',this)">ст.139</span>
          <span class="filter-chip" onclick="toggleFilter('ҰРЛЫҚ',this)">Ұрлық</span>
          <span class="filter-chip" onclick="toggleFilter('ТОНАУ',this)">Тонау</span>
        </div>
      </div>

      <div class="s-section">
        <div class="s-title">Аймақты таңдау</div>
        <select id="region-select" onchange="selectDistrict(this.value)">
          <option value="">— Барлық аудандар —</option>
          <option value="abay">Абай ауданы</option>
          <option value="alfarabi">Аль-Фараби ауданы</option>
          <option value="enbekshi">Еңбекшілер ауданы</option>
          <option value="karatau">Қаратау ауданы</option>
          <option value="turan">Туран ауданы</option>
        </select>
        <button class="btn-show" onclick="zoomToSelected()">⊕ Картада көрсету</button>
        <button class="btn-reset" onclick="resetFocus()">✕ Барлығын көрсету</button>
        <div style="margin-top:7px;font-size:9px;color:var(--text-muted);display:flex;align-items:center;gap:4px">
          <span class="osm-badge">🗺 OpenStreetMap</span> нақты шекаралар
        </div>
      </div>

      <div class="s-section">
        <div class="s-title">Қабаттар</div>
        <div class="layer-row" onclick="toggleLayer('crimes')"><input type="checkbox" id="l-crimes" checked><span class="layer-icon">⚠️</span><span class="layer-label">Тіркелген оқиғалар</span><span class="layer-count" style="background:#e53935" id="lc-crimes">0</span></div>
        <div class="layer-row" onclick="toggleLayer('dtp')"><input type="checkbox" id="l-dtp" checked><span class="layer-icon">💥</span><span class="layer-label">ЖКО нүктелері</span><span class="layer-count" style="background:#fb8c00">25</span></div>
        <div class="layer-row" onclick="toggleLayer('police')"><input type="checkbox" id="l-police" checked><span class="layer-icon">🚔</span><span class="layer-label">Патруль</span><span class="layer-count" style="background:#7b1fa2">10</span></div>
        <div class="layer-row" onclick="toggleLayer('posts')"><input type="checkbox" id="l-posts" checked><span class="layer-icon">🏛</span><span class="layer-label">Учаскелік пункттер</span><span class="layer-count" style="background:#2e7d32">12</span></div>
        <div class="layer-row" onclick="toggleLayer('cameras')"><input type="checkbox" id="l-cameras" checked><span class="layer-icon">📷</span><span class="layer-label">Бейнебақылау</span><span class="layer-count" style="background:#1565c0" id="lc-cameras">42</span></div>
        <div class="layer-row" onclick="toggleLayer('hospitals')"><input type="checkbox" id="l-hospitals" checked><span class="layer-icon">🏥</span><span class="layer-label">Аурухана / СМП</span><span class="layer-count" style="background:#00897b">9</span></div>
        <div class="layer-row" onclick="toggleLayer('schools')"><input type="checkbox" id="l-schools" checked><span class="layer-icon">🏫</span><span class="layer-label">Мектептер</span><span class="layer-count" style="background:#f57f17">14</span></div>
        <div class="layer-row" onclick="toggleLayer('bazaars')"><input type="checkbox" id="l-bazaars" checked><span class="layer-icon">🛒</span><span class="layer-label">Базарлар / ТЦ</span><span class="layer-count" style="background:#6d4c41">8</span></div>
        <div class="layer-row" onclick="toggleLayer('userBuildings')"><input type="checkbox" id="l-userBuildings" checked><span class="layer-icon">🏢</span><span class="layer-label">Менің ғимараттарым</span><span class="layer-count" style="background:#6a1b9a" id="lc-buildings">0</span></div>
      </div>

      <div class="s-section">
        <div class="s-title">Шымкент статистика 2024</div>
        <div class="stat-item"><div class="stat-row"><span class="stat-name">ст.190 Алаяқтық</span><span class="stat-val" style="color:#fb8c00">799</span></div><div class="stat-bar-bg"><div class="stat-bar-fill" style="width:100%;background:#fb8c00"></div></div></div>
        <div class="stat-item"><div class="stat-row"><span class="stat-name">ст.188 Ұрлық</span><span class="stat-val" style="color:#e53935">393</span></div><div class="stat-bar-bg"><div class="stat-bar-fill" style="width:49%;background:#e53935"></div></div></div>
        <div class="stat-item"><div class="stat-row"><span class="stat-name">ст.109-1 Денсаулыққа зиян</span><span class="stat-val" style="color:#f9a825">239</span></div><div class="stat-bar-bg"><div class="stat-bar-fill" style="width:30%;background:#f9a825"></div></div></div>
        <div class="stat-item"><div class="stat-row"><span class="stat-name">ст.296 Бұзақылық</span><span class="stat-val" style="color:#8e24aa">130</span></div><div class="stat-bar-bg"><div class="stat-bar-fill" style="width:16%;background:#8e24aa"></div></div></div>
        <div class="stat-item"><div class="stat-row"><span class="stat-name">ст.108-1 Зорлық</span><span class="stat-val" style="color:#0288d1">99</span></div><div class="stat-bar-bg"><div class="stat-bar-fill" style="width:12%;background:#0288d1"></div></div></div>
        <div class="stat-item"><div class="stat-row"><span class="stat-name">ст.345 Қарсылық</span><span class="stat-val" style="color:#6d4c41">59</span></div><div class="stat-bar-bg"><div class="stat-bar-fill" style="width:7%;background:#6d4c41"></div></div></div>
        <div class="stat-item"><div class="stat-row"><span class="stat-name">ст.107 Дене жарақаты</span><span class="stat-val" style="color:#c62828">56</span></div><div class="stat-bar-bg"><div class="stat-bar-fill" style="width:7%;background:#c62828"></div></div></div>
        <div class="stat-item"><div class="stat-row"><span class="stat-name">ст.293 Тонау</span><span class="stat-val" style="color:#e65100">37</span></div><div class="stat-bar-bg"><div class="stat-bar-fill" style="width:5%;background:#e65100"></div></div></div>
        <div class="stat-item"><div class="stat-row"><span class="stat-name">ст.139 Кісі өлтіру</span><span class="stat-val" style="color:#b71c1c">36</span></div><div class="stat-bar-bg"><div class="stat-bar-fill" style="width:5%;background:#b71c1c"></div></div></div>
      </div>

      <div class="s-section">
        <div class="s-title">Деректер базасы (MySQL)</div>
        <div class="db-status"><div class="db-dot"></div>MySQL · XAMPP — белсенді</div>
        <div id="db-info" style="font-size:10px;color:var(--text-muted);margin-top:3px">Жүктелуде...</div>
        <button class="analytics-btn" onclick="openAnalytics()">📊 Толық аналитика</button>
        <button class="export-btn" onclick="exportCSV()">📤 CSV жүктеп алу</button>
        <button class="btn-reset" style="margin-top:4px" onclick="clearDB()">🗑 Базаны тазалау</button>
      </div>

      <div class="s-section">
        <div class="s-title">Патруль бірліктері</div>
        <div id="units-list"></div>
      </div>
    </div>
  </div>

  <!-- ====== MAP ====== -->
  <div style="flex:1;position:relative;">
    <div id="map" style="width:100%;height:100%;position:relative;"></div>
    <div id="osm-loader"><div class="osm-spin"></div><span id="osm-loader-text">Шекаралар жүктелуде...</span></div>
    <div id="mode-banner">
      <div class="mode-pulse"></div>
      <span id="mode-banner-text">Картадағы орынды басыңыз</span>
      <button class="mode-cancel-btn" onclick="cancelMode()">✕ Бас тарту</button>
    </div>
    <div id="focus-banner">
      <div class="fb-dot" id="fb-dot"></div>
      <span id="fb-name">Аудан</span>
      <span style="color:var(--text-muted);font-weight:400">·</span>
      <span id="fb-stats" style="color:var(--text-secondary);font-weight:400;font-size:10px"></span>
      <button class="fb-close" onclick="resetFocus()">✕</button>
    </div>
    <div id="empty-hint" class="hidden">
      <div class="hint-icon">📍</div>
      <div class="hint-title">Карта бос</div>
      <div class="hint-sub">Оқиға белгілеу үшін:<br><strong>📍 Белгілеу</strong> батырмасын басып,<br>картадағы орынды таңдаңыз<br><br>немесе <strong>🤖 Авто</strong> режимін қосыңыз</div>
    </div>
    <div id="heatmap-legend">
      <div class="hl-title">🌡 Қылмыс тығыздығы</div>
      <div class="hl-bar"></div>
      <div class="hl-labels"><span>Төмен</span><span>Орта</span><span>Жоғары</span></div>
    </div>
  </div>

  <!-- ====== RIGHT PANEL ====== -->
  <div id="panel-right">
    <div class="panel-tabs">
      <button class="tab-btn active" onclick="switchTab('feed',this)">Оқиғалар</button>
      <button class="tab-btn" onclick="switchTab('buildings',this)">Ғимараттар</button>
      <button class="tab-btn" onclick="switchTab('stats',this)">Статистика</button>
      <button class="tab-btn" onclick="switchTab('district',this)">Аудан</button>
    </div>
    <div class="tab-content active" id="tab-feed">
      <div id="incident-feed"></div>
    </div>
    <div class="tab-content" id="tab-buildings">
      <div style="padding:9px 12px;border-bottom:1px solid var(--border-light);">
        <div style="font-size:10px;color:var(--text-muted)">Жоғарыдағы <strong style="color:#6a1b9a">🏢 Ғимарат</strong> батырмасын басып, картада нысанды белгілеңіз</div>
      </div>
      <div id="buildings-feed"></div>
    </div>
    <div class="tab-content" id="tab-stats">
      <div class="mini-chart">
        <div class="chart-title">7 күн — ЖКО</div>
        <div class="chart-bars" id="chart-dtp"></div>
      </div>
      <div class="mini-chart" style="margin-top:10px">
        <div class="chart-title">7 күн — Қылмыс</div>
        <div class="chart-bars" id="chart-crime"></div>
      </div>
      <div style="padding:11px 12px">
        <div class="chart-title" style="margin-bottom:7px">Тіркелген оқиғалар (сағат бойынша)</div>
        <div class="hour-chart" id="chart-hours"></div>
      </div>
      <div style="padding:11px 12px">
        <div class="chart-title" style="margin-bottom:7px">Аудан бойынша — ст.190</div>
        <div id="district-st190"></div>
      </div>
      <div style="padding:11px 12px">
        <div class="chart-title" style="margin-bottom:7px">Аудан бойынша — ст.188</div>
        <div id="district-st188"></div>
      </div>
      <div style="padding:11px 12px">
        <div class="chart-title" style="margin-bottom:7px">Аудандар рейтингі</div>
        <div id="district-ranking"></div>
      </div>
    </div>
    <div class="tab-content" id="tab-district">
      <div id="district-card">
        <div id="dc-name">—</div>
        <div class="dc-grid">
          <div class="dc-item"><div class="dc-val" id="dc-st190">—</div><div class="dc-lbl">СТ.190</div></div>
          <div class="dc-item"><div class="dc-val" id="dc-st188">—</div><div class="dc-lbl">СТ.188</div></div>
          <div class="dc-item"><div class="dc-val" id="dc-st1091">—</div><div class="dc-lbl">СТ.109-1</div></div>
          <div class="dc-item"><div class="dc-val" id="dc-total">—</div><div class="dc-lbl">БАРЛЫҒЫ</div></div>
        </div>
        <div id="dc-streets"></div>
      </div>
      <div id="district-hint" style="padding:11px 13px;font-size:11px;color:var(--text-muted)">Картадан аудан шекарасын басыңыз немесе сол жақтан таңдаңыз.</div>
    </div>
  </div>
</div>

<div id="toast">
  <div style="font-size:16px">🚨</div>
  <div><div id="toast-type">ЖАҢА ОҚИҒА</div><div id="toast-loc"></div></div>
</div>

<script src="app.js"></script>
</body>
</html>