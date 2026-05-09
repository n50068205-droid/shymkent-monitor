// app.js — Шымкент Мониторингі v7 (PHP/MySQL нұсқасы)
// Файл: htdocs/shymkent_monitor/app.js
// localStorage → MySQL API арқылы жұмыс жасайды

const API = 'api.php';

// ════════════════════════════════════════════════
// API HELPERS
// ════════════════════════════════════════════════
async function apiGet(resource, action, params = {}) {
  const url = new URL(API, window.location.href);
  url.searchParams.set('resource', resource);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const r = await fetch(url);
  return r.json();
}

async function apiPost(resource, action, body = {}) {
  const url = new URL(API, window.location.href);
  url.searchParams.set('resource', resource);
  url.searchParams.set('action', action);
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return r.json();
}

async function apiDelete(resource, action, params = {}) {
  const url = new URL(API, window.location.href);
  url.searchParams.set('resource', resource);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const r = await fetch(url, { method: 'DELETE' });
  return r.json();
}

// ════════════════════════════════════════════════
// DISTRICT DATA
// ════════════════════════════════════════════════
const districtData = {
  alfarabi: {
    name:'Аль-Фараби ауданы', osmName:'Аль-Фарабийский район',
    color:'#e53935',
    pop:261126, area:144, density:1813, popMale:127000, popFemale:134126,
    st190:170, st188:102, st1091:28, st296:25, st1081:16, st107:15, st139:7,
    total:402, patrol:3, crimes:62, dtp:31, murder:5,
    streets:['Тәуелсіздік даңғылы','Байтерек к-сі','Рысқұлов к-сі','Ордабасы базары маңы']
  },
  abay: {
    name:'Абай ауданы', osmName:'Абайский район',
    color:'#1565c0',
    pop:265615, area:497, density:534, popMale:129000, popFemale:136615,
    st190:204, st188:120, st1091:71, st296:28, st1081:31, st107:15,
    total:511, patrol:2, crimes:78, dtp:23, murder:3,
    streets:['Абай даңғылы','Таскешу жолы','Манкент тас жолы','Зоопарк маңы']
  },
  turan: {
    name:'Туран ауданы', osmName:'Туранский район',
    color:'#00838f',
    pop:231185, area:68, density:3400, popMale:112000, popFemale:119185,
    st190:147, st188:48, st296:44, st1091:32, st1081:16, st107:12,
    total:320, patrol:1, crimes:45, dtp:18, murder:2,
    streets:['Желтоқсан к-сі','Рысқұлов к-сі','Тәуелсіздік (батыс)','9 мкр']
  },
  karatau: {
    name:'Қаратау ауданы', osmName:'Каратауский район',
    color:'#7b1fa2',
    pop:338086, area:323, density:1046, popMale:165000, popFemale:173086,
    st190:160, st188:80, st1091:65, st296:22, st1081:20, st107:9,
    total:356, patrol:1, crimes:52, dtp:16, murder:2,
    streets:['Каратаевская к-сі','Байтерек (батыс)','Аэропорт жолы','Момышұлы к-сі']
  },
  enbekshi: {
    name:'Еңбекшілер ауданы', osmName:'Енбекшинский район',
    color:'#2e7d32',
    pop:206856, area:207, density:999, popMale:101000, popFemale:105856,
    st190:118, st188:43, st1091:43, st296:11, st1081:16, st107:5,
    total:236, patrol:1, crimes:55, dtp:19, murder:2,
    streets:['Манкент тас жолы','Карасу жолы','Ленгер жолы','Самал мкр']
  }
};

// ════════════════════════════════════════════════
// THEME
// ════════════════════════════════════════════════
let currentTheme = localStorage.getItem('shymkent_theme') || 'light';
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  document.getElementById('theme-toggle').textContent = t === 'dark' ? '☀️ Жарық' : '🌙 Қараңғы';
  localStorage.setItem('shymkent_theme', t);
  currentTheme = t;
}
function toggleTheme() { applyTheme(currentTheme === 'dark' ? 'light' : 'dark'); }
applyTheme(currentTheme);

// ════════════════════════════════════════════════
// MAP
// ════════════════════════════════════════════════
const map = L.map('map', { zoomControl: true }).setView([42.30, 69.59], 12);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap & CartoDB', maxZoom: 19
}).addTo(map);

// ════════════════════════════════════════════════
// DISTRICT POLYGONS
// ════════════════════════════════════════════════
const districtPolygons = {};
let activeDistrict = null;

async function loadOSMBoundaries() {
  const loader = document.getElementById('osm-loader');
  const loaderText = document.getElementById('osm-loader-text');
  // Резервтік шекаралар INIT-те жүктелген, OSM-ды ауыстыруды тырысамыз
  loaderText.textContent = '🗺 OSM жүктелуде...';

  // Содан кейін OSM-дан нақты шекараларды тырысамыз
  // Шымкент аудандарын іздейміз — кеңірек фильтр
  const query = `[out:json][timeout:25];(
    relation["boundary"="administrative"]["admin_level"~"^(7|8|9)$"]["name"~"Шымкент|Shymkent"](41.0,68.0,43.5,71.0);
    relation["boundary"="administrative"]["admin_level"~"^(7|8|9)$"](41.5,68.8,42.9,70.6);
  );out geom;`.replace(/\s+/g,' ').trim();
  try {
    loaderText.textContent = '🗺 OpenStreetMap сұрауы...';
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 20000);
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(query),
      signal: controller.signal
    });
    clearTimeout(tid);
    if (!response.ok) throw new Error('Network error');
    const data = await response.json();
    if (!data.elements || data.elements.length === 0) throw new Error('No data');
    let matched = 0;
    data.elements.forEach(el => {
      if (el.type !== 'relation' || !el.members) return;
      const name = el.tags?.name || '';
      let districtId = null;
      if (name.includes('Абайский')) districtId = 'abay';
      else if (name.includes('Аль-Фараби') || name.includes('Аль-Фарабийский')) districtId = 'alfarabi';
      else if (name.includes('Каратаус') || name.includes('Каратауский')) districtId = 'karatau';
      else if (name.includes('Енбекши') || name.includes('Енбекшинский')) districtId = 'enbekshi';
      else if (name.includes('Туранский') || name.includes('Туран')) districtId = 'turan';
      if (!districtId) return;
      const coords = buildPolygonFromRelation(el);
      if (coords && coords.length > 3) { addDistrictPolygon(districtId, coords, name); matched++; }
    });
    if (matched > 0) {
      loaderText.textContent = `✅ OSM: ${matched} аудан жүктелді`;
    } else {
      loaderText.textContent = '✅ Резервтік шекаралар';
    }
  } catch (err) {
    loaderText.textContent = '✅ Резервтік шекаралар';
  }
  setTimeout(() => loader.classList.add('hidden'), 2000);
}

function buildPolygonFromRelation(relation) {
  const outerWays = relation.members
    .filter(m => m.type === 'way' && m.role === 'outer' && m.geometry)
    .map(m => m.geometry.map(g => [g.lat, g.lon]));
  if (outerWays.length === 0) return null;
  let ring = [...outerWays[0]];
  const remaining = outerWays.slice(1);
  let changed = true;
  while (changed && remaining.length > 0) {
    changed = false;
    for (let i = 0; i < remaining.length; i++) {
      const way = remaining[i]; const lastPt = ring[ring.length - 1]; const firstPt = ring[0];
      if (dist(lastPt, way[0]) < 0.0001) { ring = ring.concat(way.slice(1)); remaining.splice(i, 1); changed = true; break; }
      if (dist(lastPt, way[way.length - 1]) < 0.0001) { ring = ring.concat(way.slice(0, -1).reverse()); remaining.splice(i, 1); changed = true; break; }
      if (dist(firstPt, way[way.length - 1]) < 0.0001) { ring = way.concat(ring.slice(1)); remaining.splice(i, 1); changed = true; break; }
      if (dist(firstPt, way[0]) < 0.0001) { ring = way.slice().reverse().concat(ring.slice(1)); remaining.splice(i, 1); changed = true; break; }
    }
  }
  if (remaining.length > 0) remaining.forEach(w => ring = ring.concat(w));
  return ring;
}
function dist(a, b) { return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2); }

function addDistrictPolygon(id, coords, osmName) {
  const d = districtData[id];
  if (districtPolygons[id]) { map.removeLayer(districtPolygons[id]); if (districtPolygons[id]._label) map.removeLayer(districtPolygons[id]._label); }
  const poly = L.polygon(coords, { color: d.color, weight: 2.5, fillColor: d.color, fillOpacity: 0.10, smoothFactor: 1 }).addTo(map);
  const center = poly.getBounds().getCenter();
  const label = L.marker(center, {
    interactive: false,
    icon: L.divIcon({ className: '', iconSize: [200, 44], iconAnchor: [100, 22],
      html: `<div style="text-align:center;pointer-events:none;user-select:none">
        <div style="font-family:'Rubik',sans-serif;font-size:11px;font-weight:700;color:${d.color};text-shadow:0 0 5px #fff,0 1px 3px rgba(255,255,255,.95);letter-spacing:.5px;white-space:nowrap">${d.name.toUpperCase()}</div>
        <div style="font-family:'JetBrains Mono',sans-serif;font-size:9px;color:#444;text-shadow:0 1px 3px rgba(255,255,255,.95);white-space:nowrap;margin-top:1px">👥 ${d.pop.toLocaleString('ru-RU')} · 🔍 ${d.total} іс</div>
      </div>`
    })
  }).addTo(map);
  poly._label = label;
  poly.on('click', () => { if (mapMode) return; document.getElementById('region-select').value = id; focusDistrict(id); switchTab('district', document.querySelectorAll('.tab-btn')[3]); });
  poly.on('mouseover', function () { if (mapMode) return; this.setStyle({ fillOpacity: 0.25, weight: 3.5 }); });
  poly.on('mouseout', function () { this.setStyle({ fillOpacity: activeDistrict === id ? 0.22 : 0.10, weight: activeDistrict === id ? 3.5 : 2.5 }); });
  districtPolygons[id] = poly;
}

function loadFallbackBoundaries() {
  // Image 2 (Map.html) - нақты Шымкент аудан шекаралары
  const fb = {
    turan: [
      [42.32789,69.52900],[42.32534,69.52329],[42.33090,69.51763],[42.33466,69.51030],
      [42.33707,69.50679],[42.33795,69.50133],[42.33858,69.49953],[42.34031,69.48852],
      [42.34107,69.48396],[42.34116,69.48137],[42.34209,69.47942],[42.34462,69.47944],
      [42.34622,69.46801],[42.34803,69.46463],[42.35030,69.45931],[42.35257,69.45271],
      [42.35386,69.44843],[42.35629,69.44368],[42.35846,69.43616],[42.36088,69.43282],
      [42.36290,69.42829],[42.36375,69.42451],[42.36310,69.42124],[42.36200,69.41055],
      [42.36253,69.40519],[42.36109,69.40134],[42.36094,69.39849],[42.36272,69.39335],
      [42.36453,69.39175],[42.36965,69.37812],[42.36958,69.37068],[42.36928,69.36409],
      [42.37667,69.36580],[42.37768,69.35678],[42.37565,69.32612],[42.36361,69.30299],
      [42.35634,69.30232],[42.35534,69.31243],[42.35202,69.31474],[42.35384,69.31945],
      [42.33863,69.31114],[42.32224,69.30379],[42.31044,69.32318],[42.29077,69.34960],
      [42.24931,69.36595],[42.22894,69.34020],[42.22164,69.40136],[42.19708,69.41134],
      [42.16302,69.42859],[42.14619,69.47555],[42.12522,69.48563],[42.12487,69.49167],
      [42.13642,69.51783],[42.13677,69.53619],[42.14713,69.53265],[42.15681,69.53472],
      [42.17357,69.53217],[42.18167,69.53460],[42.19495,69.52336],[42.21731,69.52893],
      [42.24797,69.54261],[42.28926,69.56485],[42.30809,69.57649],[42.31784,69.58152],
      [42.32059,69.58764],[42.32309,69.58976]
    ],
    abay: [
      [42.35954,69.61857],[42.37400,69.62736],[42.38842,69.62849],[42.41244,69.63413],
      [42.42193,69.63733],[42.43277,69.63529],[42.45176,69.63351],[42.45579,69.60863],
      [42.46469,69.56768],[42.47342,69.54170],[42.47834,69.53303],[42.47926,69.49755],
      [42.47843,69.46210],[42.47284,69.46257],[42.46906,69.45465],[42.46340,69.45107],
      [42.46065,69.45740],[42.45405,69.45839],[42.45157,69.46321],[42.44291,69.45818],
      [42.44048,69.44961],[42.43583,69.43498],[42.42351,69.44058],[42.41731,69.43408],
      [42.41716,69.42732],[42.41835,69.42002],[42.42052,69.41804],[42.41985,69.40928],
      [42.42060,69.40656],[42.42008,69.40255],[42.41715,69.39930],[42.41663,69.39470],
      [42.41447,69.39191],[42.41068,69.39083],[42.40590,69.38602],[42.39406,69.38844],
      [42.38311,69.38068],[42.37852,69.35108],[42.37452,69.35065],[42.37402,69.36505],
      [42.36953,69.36896],[42.36745,69.38296],[42.36535,69.38492],[42.36540,69.38911],
      [42.36149,69.39405],[42.36012,69.40024],[42.36196,69.40380],[42.36243,69.40860],
      [42.36285,69.41705],[42.36381,69.42497],[42.35845,69.43747],[42.35306,69.45349],
      [42.34870,69.46500],[42.34543,69.47076],[42.34079,69.48699],[42.33598,69.50197],
      [42.33445,69.51001],[42.32762,69.52022],[42.32110,69.53720],[42.33543,69.55421],
      [42.33928,69.55886],[42.34815,69.56685],[42.35267,69.57708],[42.35806,69.58555],
      [42.36254,69.60136],[42.35866,69.61801],[42.35962,69.61861]
    ],
    karatau: [
      [42.35873,69.61824],[42.37912,69.62926],[42.41944,69.63700],[42.45188,69.63322],
      [42.44473,69.67670],[42.43940,69.71499],[42.42904,69.72128],[42.41791,69.72497],
      [42.40855,69.74349],[42.39602,69.76407],[42.39071,69.77834],[42.37112,69.78994],
      [42.36515,69.80060],[42.35537,69.81823],[42.34867,69.81628],[42.33957,69.82769],
      [42.33701,69.83041],[42.33445,69.84004],[42.33754,69.84763],[42.33412,69.86480],
      [42.32051,69.89136],[42.30003,69.91229],[42.29588,69.92184],[42.28528,69.93691],
      [42.27572,69.93028],[42.29061,69.90941],[42.29560,69.89567],[42.29846,69.86386],
      [42.29814,69.85677],[42.30132,69.84262],[42.30061,69.82000],[42.29977,69.81315],
      [42.29884,69.80892],[42.29113,69.78794],[42.29572,69.77169],[42.28655,69.75567],
      [42.28188,69.73220],[42.28095,69.72334],[42.29682,69.72410],[42.31091,69.72383],
      [42.31559,69.71682],[42.32681,69.71567],[42.32954,69.71304],[42.33569,69.71099],
      [42.33827,69.70808],[42.34609,69.69970],[42.34731,69.68887],[42.33436,69.65044],
      [42.33684,69.65208],[42.34493,69.64610],[42.34608,69.64406],[42.34640,69.63371],
      [42.34800,69.62666],[42.35580,69.63002],[42.35874,69.61824]
    ],
    alfarabi: [
      [42.33256,69.59373],[42.32710,69.61737],[42.34797,69.62672],[42.34617,69.64481],
      [42.34493,69.64609],[42.33684,69.65208],[42.33426,69.65027],[42.32928,69.63392],
      [42.31562,69.63144],[42.30363,69.62643],[42.30018,69.61270],[42.28986,69.60346],
      [42.28412,69.59243],[42.27749,69.58885],[42.27431,69.59309],[42.26724,69.59503],
      [42.25527,69.59442],[42.24412,69.59161],[42.23070,69.59302],[42.22172,69.60819],
      [42.19316,69.63335],[42.16360,69.64747],[42.15393,69.65174],[42.13835,69.57755],
      [42.13112,69.55842],[42.12334,69.54120],[42.13668,69.53590],[42.14822,69.53283],
      [42.17839,69.53255],[42.19495,69.52336],[42.21731,69.52893],[42.24797,69.54261],
      [42.28926,69.56485],[42.30809,69.57649],[42.32085,69.58767],[42.32307,69.58977],
      [42.33256,69.59373]
    ],
    enbekshi: [
      [42.23001,69.59690],[42.22435,69.63430],[42.19997,69.63564],[42.17187,69.69303],
      [42.22570,69.70971],[42.22976,69.72211],[42.23221,69.75899],[42.20979,69.75656],
      [42.19851,69.76223],[42.21401,69.78600],[42.20432,69.79436],[42.22016,69.82691],
      [42.24225,69.81156],[42.26641,69.82475],[42.26653,69.84476],[42.26819,69.86590],
      [42.27952,69.87509],[42.28749,69.88668],[42.29059,69.90941],[42.29570,69.89572],
      [42.29846,69.86386],[42.29977,69.81315],[42.29113,69.78794],[42.29572,69.77169],
      [42.28655,69.75567],[42.28095,69.72334],[42.31091,69.72383],[42.31559,69.71682],
      [42.32681,69.71567],[42.33826,69.70808],[42.34582,69.68436],[42.32944,69.63367],
      [42.30517,69.61965],[42.30191,69.61672],[42.29853,69.61029],[42.28412,69.59243],
      [42.28072,69.58814],[42.27735,69.58889],[42.27421,69.59381],[42.26724,69.59503],
      [42.25527,69.59442],[42.23683,69.58990],[42.22979,69.59699]
    ]
  };
  Object.entries(fb).forEach(([id, coords]) => addDistrictPolygon(id, coords, districtData[id].osmName));
}

// ════════════════════════════════════════════════
// LAYERS
// ════════════════════════════════════════════════
const layers = { crimes: [], dtp: [], police: [], cameras: [], hospitals: [], schools: [], bazaars: [], posts: [], userBuildings: [] };
const layerVisible = { crimes: true, dtp: true, police: true, cameras: true, hospitals: true, schools: true, bazaars: true, posts: true, userBuildings: true };

function mkIcon(html, s = 22) { return L.divIcon({ className: '', iconSize: [s, s], iconAnchor: [s / 2, s / 2], html }); }

function isPointInPolygon(point, polygon) {
  let x = point[0], y = point[1], inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1], xj = polygon[j][0], yj = polygon[j][1];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

function getDistrictForPoint(lat, lng) {
  for (const [id, poly] of Object.entries(districtPolygons)) {
    if (poly.getBounds().contains([lat, lng])) {
      const coords = poly.getLatLngs()[0].map(ll => [ll.lat, ll.lng]);
      if (isPointInPolygon([lat, lng], coords)) return id;
    }
  }
  return null;
}

// ════════════════════════════════════════════════
// PREDEFINED MARKERS (cameras, posts, hospitals, schools, bazaars, dtp)
// ════════════════════════════════════════════════
[[42.3169,69.5874],[42.3201,69.5920],[42.3145,69.5810],[42.3089,69.5750],[42.3230,69.5960],[42.3280,69.6050],[42.3350,69.5880],[42.3190,69.5680],[42.3110,69.5840],[42.3410,69.5950],[42.3050,69.5950],[42.2980,69.5880],[42.3300,69.5600],[42.3480,69.5480],[42.3380,69.6200],[42.3150,69.6100],[42.3070,69.6000],[42.3230,69.5750],[42.3170,69.5950],[42.3420,69.5750],[42.3260,69.5830],[42.3190,69.5790],[42.3320,69.6100],[42.2920,69.5800],[42.3550,69.5700],[42.3650,69.5500],[42.3480,69.6000],[42.3090,69.5680],[42.3210,69.6050],[42.3340,69.5780],[42.3160,69.5920],[42.3410,69.5690],[42.3580,69.5850],[42.3050,69.6100],[42.3730,69.5200],[42.3850,69.5350],[42.2990,69.5700],[42.3240,69.5870],[42.3120,69.5760],[42.3370,69.5930],[42.3490,69.5580],[42.3270,69.6120]].forEach(([lat, lng], i) => {
  const m = L.marker([lat, lng], { icon: mkIcon(`<div style="width:10px;height:10px;background:#1565c0;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 5px rgba(21,101,192,.6)"></div>`, 14) }).bindPopup(`<div class="popup-inner"><div class="popup-title">📷 Камера #${i + 1}</div><div class="popup-row">✅ HD · Жұмыс істеп тұр</div></div>`);
  m._district = null; m.addTo(map); layers.cameras.push(m);
});

[[42.3350,69.5700],[42.3820,69.5600],[42.3100,69.5900],[42.2980,69.6050],[42.3700,69.6300],[42.3950,69.6200],[42.3600,69.5000],[42.3350,69.4700],[42.3180,69.5400],[42.3050,69.5300],[42.4050,69.5500],[42.3169,69.5820]].forEach(([lat, lng], i) => {
  const m = L.marker([lat, lng], { icon: mkIcon(`<div style="background:#fff;border:2px solid #2e7d32;border-radius:4px;width:16px;height:16px;display:flex;align-items:center;justify-content:center;font-size:9px">🏛</div>`, 18) }).bindPopup(`<div class="popup-inner"><div class="popup-title">🏛 Учаскелік пункт #${i + 1}</div></div>`);
  m._district = null; m.addTo(map); layers.posts.push(m);
});

[[42.3180,69.5950,'Қалалық аурухана №1'],[42.3050,69.5820,'БСМП'],[42.3320,69.6000,'Балалар ауруханасы'],[42.3450,69.5800,'Абай ауданы клиникасы'],[42.2950,69.5950,'Аль-Фараби ДМЦ'],[42.3600,69.6100,'Манкент клиникасы'],[42.3150,69.5650,'БСМП орталығы'],[42.3800,69.5200,'Қаратау ауруханасы'],[42.3070,69.6150,'Самал медорталық']].forEach(([lat, lng, name]) => {
  const m = L.marker([lat, lng], { icon: mkIcon(`<div style="background:#fff;border:2px solid #00897b;border-radius:4px;width:17px;height:17px;display:flex;align-items:center;justify-content:center;font-size:10px">🏥</div>`, 19) }).bindPopup(`<div class="popup-inner"><div class="popup-title" style="color:#00897b">🏥 ${name}</div></div>`);
  m._district = null; m.addTo(map); layers.hospitals.push(m);
});

[[42.3220,69.5880,'№1'],[42.3300,69.6050,'№5'],[42.3140,69.5780,'№12'],[42.3410,69.5760,'№18'],[42.3080,69.5950,'№23'],[42.3500,69.6050,'№31'],[42.3650,69.5400,'№44'],[42.3250,69.5500,'№52'],[42.3050,69.5700,'№67'],[42.3750,69.5800,'№74'],[42.3180,69.6100,'№88'],[42.2950,69.5850,'№93'],[42.3550,69.5600,'№101'],[42.3900,69.5450,'Абай мектебі']].forEach(([lat, lng, name]) => {
  const m = L.marker([lat, lng], { icon: mkIcon(`<div style="background:#fff;border:2px solid #f57f17;border-radius:4px;width:16px;height:16px;display:flex;align-items:center;justify-content:center;font-size:9px">🏫</div>`, 18) }).bindPopup(`<div class="popup-inner"><div class="popup-title" style="color:#f57f17">🏫 Мектеп ${name}</div></div>`);
  m._district = null; m.addTo(map); layers.schools.push(m);
});

[[42.3180,69.5870,'Ордабасы'],[42.3250,69.5930,'Аль-Фараби'],[42.3120,69.5820,'Байтерек'],[42.3380,69.5980,'Манкент'],[42.3500,69.5700,'Қаратаев'],[42.3050,69.6050,'Самал ТЦ'],[42.3290,69.5780,'Центральный'],[42.3080,69.5870,'Жедел']].forEach(([lat, lng, name]) => {
  const m = L.marker([lat, lng], { icon: mkIcon(`<div style="background:#fff;border:2px solid #6d4c41;border-radius:4px;width:16px;height:16px;display:flex;align-items:center;justify-content:center;font-size:9px">🛒</div>`, 18) }).bindPopup(`<div class="popup-inner"><div class="popup-title" style="color:#6d4c41">🛒 ${name}</div></div>`);
  m._district = null; m.addTo(map); layers.bazaars.push(m);
});

[[42.3169,69.5874,'Соқтығысу',1,'alfarabi'],[42.3280,69.6050,'Жаяу жүргіншіні басу',0,'alfarabi'],[42.3050,69.5950,'Аударылу',2,'alfarabi'],[42.3410,69.5950,'Соқтығысу',1,'abay'],[42.3230,69.5960,'Кері соқтығысу',0,'alfarabi'],[42.3089,69.5750,'Соқтығысу',1,'turan'],[42.3380,69.6200,'Жаяу жүргіншіні басу',1,'abay'],[42.3150,69.6100,'Аударылу',0,'alfarabi'],[42.3070,69.6000,'Соқтығысу',2,'alfarabi'],[42.3480,69.5480,'Соқтығысу',0,'turan'],[42.2920,69.5800,'Кері соқтығысу',1,'enbekshi'],[42.3550,69.5700,'Соқтығысу',0,'karatau'],[42.3650,69.5500,'Жаяу жүргіншіні басу',1,'karatau'],[42.3800,69.5200,'Аударылу',0,'karatau'],[42.3300,69.5600,'Соқтығысу',2,'karatau'],[42.3190,69.5680,'Кері соқтығысу',0,'turan'],[42.3110,69.5840,'Соқтығысу',1,'alfarabi'],[42.3200,69.5750,'Аударылу',0,'turan'],[42.3420,69.5750,'Жаяу жүргіншіні басу',1,'abay'],[42.3730,69.5200,'Соқтығысу',0,'abay'],[42.3490,69.5580,'Кері соқтығысу',2,'turan'],[42.4100,69.5400,'Соқтығысу',1,'abay'],[42.3850,69.5350,'Аударылу',0,'abay'],[42.3260,69.6120,'Жаяу жүргіншіні басу',1,'alfarabi'],[42.3170,69.5950,'Соқтығысу',0,'alfarabi']].forEach(([lat, lng, type, inj, district], i) => {
  const m = L.marker([lat, lng], { icon: mkIcon(`<div style="background:#fff;border:2px solid #fb8c00;border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;font-size:9px">💥</div>`, 18) }).bindPopup(`<div class="popup-inner"><div class="popup-title" style="color:#fb8c00">ЖКО #${i + 1}</div><div class="popup-row">Түрі: ${type}</div><div class="popup-row">Жарақат: ${inj} адам</div></div>`);
  m._district = district; m.addTo(map); layers.dtp.push(m);
});

// ════════════════════════════════════════════════
// PATROL CARS
// ════════════════════════════════════════════════
const carRoutes = [
  { name: 'ПМ-001', street: 'Абай даңғылы — Солтүстік', district: 'abay', path: [[42.374,69.627],[42.348,69.612],[42.345,69.609],[42.352,69.578],[42.345,69.559],[42.352,69.578],[42.345,69.609],[42.348,69.612]] },
  { name: 'ПМ-002', street: 'Абай — Манкент диагональ', district: 'abay', path: [[42.345,69.608],[42.338,69.640],[42.324,69.648],[42.338,69.640]] },
  { name: 'ПМ-003', street: 'Аль-Фараби — Орталық', district: 'alfarabi', path: [[42.307,69.640],[42.324,69.648],[42.338,69.640],[42.345,69.610],[42.338,69.640],[42.324,69.648]] },
  { name: 'ПМ-004', street: 'Каратаевская — Батыс', district: 'karatau', path: [[42.349,69.534],[42.344,69.540],[42.337,69.546],[42.334,69.556],[42.337,69.546],[42.344,69.540]] },
  { name: 'ПМ-005', street: 'Еңбекшілер — Солтүстік', district: 'enbekshi', path: [[42.318,69.596],[42.314,69.611],[42.327,69.617],[42.330,69.601],[42.323,69.598],[42.319,69.593]] },
  { name: 'ПМ-006', street: 'Туран — Аль-Фараби шекарасы', district: 'turan', path: [[42.379,69.595],[42.351,69.582]] },
  { name: 'ПМ-007', street: 'Еңбекшілер — Оңтүстік', district: 'enbekshi', path: [[42.320,69.588],[42.337,69.579],[42.347,69.568],[42.337,69.579]] },
  { name: 'ПМ-008', street: 'Абай — Солтүстік-шығыс', district: 'abay', path: [[42.405,69.550],[42.390,69.562],[42.375,69.575],[42.390,69.562]] },
  { name: 'ПМ-009', street: 'Аль-Фараби — ОБ', district: 'alfarabi', path: [[42.27290,69.57487],[42.27820,69.57903],[42.28042,69.57341],[42.28245,69.56719],[42.27852,69.56405],[42.27626,69.56650],[42.27576,69.56869],[42.27534,69.57178]] },
  { name: 'ПМ-010', street: 'Аль-Фараби — Оңтүстік', district: 'alfarabi', path: [[42.27185,69.57462],[42.24562,69.56191],[42.24302,69.56389],[42.24003,69.57342],[42.24302,69.56389],[42.24562,69.56191]] }
];

const policeMarkers = carRoutes.map(route => {
  const routeLine = L.polyline(route.path, { color: '#7b1fa2', weight: 3, opacity: 0.35, dashArray: '6,5' }).addTo(map);
  const m = L.marker(route.path[0], {
    icon: L.divIcon({ className: '', iconSize: [80, 22], iconAnchor: [40, 11], html: `<div class="car-label">🚔 ${route.name}</div>` }), zIndexOffset: 1000
  }).bindPopup(`<div class="popup-inner"><div class="popup-title" style="color:#7b1fa2">🚔 ${route.name}</div><div class="popup-row">📍 ${route.street}</div><div class="popup-row">🟢 Патруль</div></div>`);
  m._district = route.district; m.addTo(map); layers.police.push(m);
  m._routeLine = routeLine;
  return { marker: m, path: route.path, idx: 0, progress: 0, speed: 0.003 + Math.random() * 0.001, routeLine, name: route.name, district: route.district };
});

function animateCars() {
  policeMarkers.forEach(car => {
    car.progress += car.speed;
    if (car.progress >= 1) { car.progress = 0; car.idx = (car.idx + 1) % (car.path.length - 1); }
    const f = car.path[car.idx]; const t = car.path[car.idx + 1] || car.path[0];
    car.marker.setLatLng([f[0] + (t[0] - f[0]) * car.progress, f[1] + (t[1] - f[1]) * car.progress]);
  });
  requestAnimationFrame(animateCars);
}
animateCars();

// ════════════════════════════════════════════════
// HEATMAP
// ════════════════════════════════════════════════
let heatmapActive = false;
let heatCircles = [];

function toggleHeatmap() {
  heatmapActive = !heatmapActive;
  const btn = document.getElementById('heatmap-btn');
  const legend = document.getElementById('heatmap-legend');
  if (heatmapActive) { btn.classList.add('active'); btn.innerHTML = '🌡 Жылу ✓'; legend.classList.add('show'); renderHeatmap(); }
  else { btn.classList.remove('active'); btn.innerHTML = '🌡 Жылу'; legend.classList.remove('show'); heatCircles.forEach(c => map.removeLayer(c)); heatCircles = []; }
}

function renderHeatmap() {
  heatCircles.forEach(c => map.removeLayer(c)); heatCircles = [];
  const hotspots = [
    { lat: 42.318, lng: 69.587, i: 0.9 }, { lat: 42.325, lng: 69.593, i: 0.8 }, { lat: 42.308, lng: 69.596, i: 0.75 },
    { lat: 42.341, lng: 69.595, i: 0.7 }, { lat: 42.355, lng: 69.570, i: 0.65 }, { lat: 42.329, lng: 69.604, i: 0.6 },
    { lat: 42.315, lng: 69.565, i: 0.55 }, { lat: 42.365, lng: 69.550, i: 0.5 }, { lat: 42.295, lng: 69.580, i: 0.5 }
  ];
  hotspots.forEach(h => {
    const r = h.i > 0.7 ? '255' : h.i > 0.5 ? '255' : '0';
    const g = h.i > 0.7 ? '0' : h.i > 0.5 ? '165' : '128';
    const c = L.circle([h.lat, h.lng], { radius: 800 + h.i * 600, color: 'transparent', fillColor: `rgb(${r},${g},0)`, fillOpacity: h.i * 0.35 }).addTo(map);
    heatCircles.push(c);
  });
}

// ════════════════════════════════════════════════
// AUTO INCIDENTS
// ════════════════════════════════════════════════
let autoMode = false;
let autoTimer = null;
const incTypesList = ['ст.190', 'ст.188', 'ст.109-1', 'ст.296', 'ст.108-1', 'ст.293', 'ЖКО', 'ҰРЛЫҚ', 'ТОНАУ', 'БҰЗАҚЫЛЫҚ', 'АЛАЯҚТЫҚ'];
const incLocsByDistrict = {
  alfarabi: ['Тәуелсіздік даңғылы', 'Байтерек к-сі', 'Рысқұлов к-сі', 'Ордабасы базары маңы'],
  abay: ['Абай даңғылы', 'Таскешу жолы', 'Манкент тас жолы', 'Зоопарк маңы'],
  karatau: ['Каратаевская к-сі', 'Аэропорт жолы', 'Байтерек батыс', 'Момышұлы к-сі'],
  enbekshi: ['Манкент тас жолы', 'Карасу жолы', 'Самал мкр', 'Ленгер жолы'],
  turan: ['Желтоқсан к-сі', '9 мкр', '3 мкр', 'Рысқұлов к-сі']
};
const districtIds = ['alfarabi', 'abay', 'karatau', 'enbekshi', 'turan'];

function toggleAutoIncidents() {
  autoMode = !autoMode;
  const btn = document.getElementById('auto-btn');
  btn.classList.toggle('active', autoMode);
  btn.innerHTML = autoMode ? '🟢 Авто' : '🤖 Авто';
  if (autoMode) scheduleNextAuto();
  else if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
}

function scheduleNextAuto() {
  if (!autoMode) return;
  autoTimer = setTimeout(() => { addAutoIncident(); scheduleNextAuto(); }, 9000 + Math.random() * 6000);
}

async function addAutoIncident() {
  const n = new Date();
  const hh = n.getHours().toString().padStart(2, '0');
  const mm = n.getMinutes().toString().padStart(2, '0');
  const type = incTypesList[Math.floor(Math.random() * incTypesList.length)];
  const did = districtIds[Math.floor(Math.random() * districtIds.length)];
  const loc = incLocsByDistrict[did][Math.floor(Math.random() * incLocsByDistrict[did].length)];
  const sev = ['high', 'med', 'med', 'low'][Math.floor(Math.random() * 4)];
  let lat, lng;
  if (districtPolygons[did]) { const c = districtPolygons[did].getBounds().getCenter(); lat = c.lat + (Math.random() - .5) * 0.03; lng = c.lng + (Math.random() - .5) * 0.03; }
  else { lat = 42.30 + (Math.random() - .5) * 0.05; lng = 69.59 + (Math.random() - .5) * 0.05; }

  const result = await apiPost('incidents', 'add', { type, loc, district: did, time: `${hh}:${mm}`, sev, desc: 'Авто жазылым', lat, lng, source: 'auto' });
  if (!result.success) return;

  const c = sev === 'high' ? '#e53935' : sev === 'med' ? '#fb8c00' : '#fdd835';
  const m = L.marker([lat, lng], { icon: mkIcon(`<div style="background:#fff;border:3px solid ${c};border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,.3)">📌</div>`, 24) }).bindPopup(
    `<div class="popup-inner"><div class="popup-title" style="color:${c}">${type}</div><div class="popup-row">📍 ${loc}</div><div class="popup-row">⏰ ${hh}:${mm}</div><div class="popup-row" style="color:#2e7d32;font-size:9px">🤖 Авто</div><button class="popup-delete-btn" onclick="deleteIncident(${result.id},this)">🗑 Жою</button></div>`
  );
  m._incidentId = result.id; m._district = did; m.addTo(map); layers.crimes.push(m);
  allIncidents.unshift({ type, loc, time: `${hh}:${mm}`, sev, district: did, id: result.id, lat, lng, source: 'auto' });
  if (allIncidents.length > 500) allIncidents.pop();
  updateDBInfo(); renderFeed(activeDistrict); renderHourChart();
  if (sev === 'high') showToast('ЖАҢА ОҚИҒА', '#e53935', `${type} — ${loc}`);
}

// ════════════════════════════════════════════════
// MAP MODE
// ════════════════════════════════════════════════
let mapMode = null, pendingLat = null, pendingLng = null;

function toggleIncidentMode() {
  if (mapMode === 'incident') { cancelMode(); return; }
  cancelMode(); mapMode = 'incident';
  document.getElementById('map').classList.add('mode-incident');
  document.getElementById('place-inc-btn').classList.add('active');
  document.getElementById('place-inc-btn').innerHTML = '🔴 Картаны басыңыз...';
  showModeBanner('inc-mode', '🚨 Картадағы орынды басыңыз');
}
function toggleBuildingMode() {
  if (mapMode === 'building') { cancelMode(); return; }
  cancelMode(); mapMode = 'building';
  document.getElementById('map').classList.add('mode-building');
  document.getElementById('place-bld-btn').classList.add('active');
  document.getElementById('place-bld-btn').innerHTML = '🟣 Картаны басыңыз...';
  showModeBanner('bld-mode', '🏢 Картадағы орынды басыңыз');
}
function toggleCameraMode() {
  if (mapMode === 'camera') { cancelMode(); return; }
  cancelMode(); mapMode = 'camera';
  document.getElementById('map').classList.add('mode-camera');
  document.getElementById('place-cam-btn').classList.add('active');
  document.getElementById('place-cam-btn').innerHTML = '🔵 Картаны басыңыз...';
  showModeBanner('cam-mode', '📷 Картадағы орынды басыңыз');
}
function cancelMode() {
  mapMode = null;
  document.getElementById('map').classList.remove('mode-incident', 'mode-building', 'mode-camera');
  document.getElementById('place-inc-btn').classList.remove('active'); document.getElementById('place-inc-btn').innerHTML = '📍 Белгілеу';
  document.getElementById('place-bld-btn').classList.remove('active'); document.getElementById('place-bld-btn').innerHTML = '🏢 Ғимарат';
  document.getElementById('place-cam-btn').classList.remove('active'); document.getElementById('place-cam-btn').innerHTML = '📷 Камера';
  document.getElementById('mode-banner').classList.remove('show');
}
function showModeBanner(cls, text) {
  const b = document.getElementById('mode-banner');
  b.className = 'show ' + cls;
  document.getElementById('mode-banner-text').textContent = text;
}

map.on('click', function (e) {
  if (!mapMode) return;
  pendingLat = e.latlng.lat; pendingLng = e.latlng.lng;
  const det = getDistrictForPoint(pendingLat, pendingLng);
  if (mapMode === 'incident') { cancelMode(); openIncidentAtCoords(pendingLat, pendingLng, det); }
  else if (mapMode === 'building') { cancelMode(); openBuildingAtCoords(pendingLat, pendingLng, det); }
  else if (mapMode === 'camera') { cancelMode(); openCameraAtCoords(pendingLat, pendingLng, det); }
});

// ════════════════════════════════════════════════
// INCIDENT MODAL
// ════════════════════════════════════════════════
let currentSev = 'high';

function openIncidentAtCoords(lat, lng, det) {
  const n = new Date();
  document.getElementById('m-time').value = `${n.getHours().toString().padStart(2, '0')}:${n.getMinutes().toString().padStart(2, '0')}`;
  document.getElementById('modal-coords-display').style.display = 'flex';
  document.getElementById('modal-coords-text').textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}${det ? ' · ' + districtData[det].name : ''}`;
  if (det) document.getElementById('m-district').value = det;
  document.getElementById('m-loc').value = ''; document.getElementById('m-desc').value = '';
  setSev('high'); document.getElementById('modal-overlay').classList.add('show');
}
function openManualModal() {
  const n = new Date();
  document.getElementById('m-time').value = `${n.getHours().toString().padStart(2, '0')}:${n.getMinutes().toString().padStart(2, '0')}`;
  document.getElementById('modal-coords-display').style.display = 'none';
  pendingLat = null; pendingLng = null;
  document.getElementById('m-loc').value = ''; document.getElementById('m-desc').value = '';
  setSev('high'); document.getElementById('modal-overlay').classList.add('show');
}
function closeModal() { document.getElementById('modal-overlay').classList.remove('show'); pendingLat = null; pendingLng = null; }
document.getElementById('modal-overlay').addEventListener('click', function (e) { if (e.target === this) closeModal(); });

function setSev(s) {
  currentSev = s;
  ['high', 'med', 'low'].forEach(x => { document.getElementById('sev-' + x).className = 'sev-btn' + (x === s ? ' active-' + x : ''); });
}

async function saveIncident() {
  const type     = document.getElementById('m-type').value;
  const loc      = document.getElementById('m-loc').value.trim() || 'Мекенжай белгісіз';
  const district = document.getElementById('m-district').value;
  const time     = document.getElementById('m-time').value;
  const desc     = document.getElementById('m-desc').value.trim();
  let lat = pendingLat, lng = pendingLng;

  if (!lat || !lng) {
    if (districtPolygons[district]) { const c = districtPolygons[district].getBounds().getCenter(); lat = c.lat + (Math.random() - .5) * 0.02; lng = c.lng + (Math.random() - .5) * 0.02; }
    else { lat = 42.30; lng = 69.59; }
  }

  const result = await apiPost('incidents', 'add', { type, loc, district, time, sev: currentSev, desc, lat, lng, source: 'manual' });
  if (!result.success) { alert('Қате: ' + (result.error || 'Белгісіз')); return; }

  const c = currentSev === 'high' ? '#e53935' : currentSev === 'med' ? '#fb8c00' : '#fdd835';
  const m = L.marker([lat, lng], { icon: mkIcon(`<div style="background:#fff;border:3px solid ${c};border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,.3)">📌</div>`, 24) }).bindPopup(
    `<div class="popup-inner"><div class="popup-title" style="color:${c}">${type}</div><div class="popup-row">📍 ${loc}</div><div class="popup-row">⏰ ${time}</div>${desc ? `<div class="popup-row">📝 ${desc}</div>` : ''}<button class="popup-delete-btn" onclick="deleteIncident(${result.id},this)">🗑 Жою</button></div>`
  );
  m._incidentId = result.id; m._district = district; m.addTo(map); layers.crimes.push(m); m.openPopup();
  allIncidents.unshift({ type, loc, time, sev: currentSev, district, id: result.id, lat, lng, source: 'manual' });
  updateDBInfo(); renderFeed(activeDistrict);
  showToast('ЖАҢА ОҚИҒА', '#e53935', `${type} — ${loc}`);
  closeModal();
}

async function deleteIncident(id) {
  await apiDelete('incidents', 'delete', { id });
  const idx = allIncidents.findIndex(i => i.id === id);
  if (idx > -1) allIncidents.splice(idx, 1);
  const mIdx = layers.crimes.findIndex(m => m._incidentId === id);
  if (mIdx > -1) { map.removeLayer(layers.crimes[mIdx]); layers.crimes.splice(mIdx, 1); }
  updateDBInfo(); renderFeed(activeDistrict);
}

// ════════════════════════════════════════════════
// CAMERA MODAL
// ════════════════════════════════════════════════
let currentCamStatus = 'ok';

function openCameraAtCoords(lat, lng, det) {
  pendingLat = lat; pendingLng = lng;
  document.getElementById('cam-coords-display').style.display = 'flex';
  document.getElementById('cam-coords-text').textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}${det ? ' · ' + districtData[det].name : ''}`;
  if (det) document.getElementById('cam-district').value = det;
  document.getElementById('cam-name').value = ''; document.getElementById('cam-loc').value = '';
  currentCamStatus = 'ok'; setCamStatus('ok');
  document.getElementById('cam-modal-overlay').classList.add('show');
}
function closeCamModal() { document.getElementById('cam-modal-overlay').classList.remove('show'); pendingLat = null; pendingLng = null; }
document.getElementById('cam-modal-overlay').addEventListener('click', function (e) { if (e.target === this) closeCamModal(); });

function setCamStatus(s) {
  currentCamStatus = s;
  ['ok', 'repair', 'off'].forEach(x => {
    const btn = document.getElementById('cam-status-' + x);
    btn.className = 'sev-btn' + (x === s ? x === 'ok' ? ' active-low' : x === 'repair' ? ' active-med' : ' active-high' : '');
  });
}

async function saveCamera() {
  const name     = document.getElementById('cam-name').value.trim() || `Камера #${Date.now()}`;
  const district = document.getElementById('cam-district').value;
  const quality  = document.getElementById('cam-quality').value;
  const loc      = document.getElementById('cam-loc').value.trim();

  const result = await apiPost('cameras', 'add', { name, district, quality, loc, status: currentCamStatus, lat: pendingLat, lng: pendingLng });
  if (!result.success) { alert('Қате: ' + (result.error || 'Белгісіз')); return; }

  const statusColor = currentCamStatus === 'ok' ? '#1565c0' : currentCamStatus === 'repair' ? '#fb8c00' : '#e53935';
  const m = L.marker([pendingLat, pendingLng], { icon: mkIcon(`<div style="width:12px;height:12px;background:${statusColor};border-radius:50%;border:2px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.4)"></div>`, 16) }).bindPopup(
    `<div class="popup-inner"><div class="popup-title" style="color:#1565c0">📷 ${name}</div><div class="popup-row">${quality}</div>${loc ? `<div class="popup-row">📍 ${loc}</div>` : ''}<button class="popup-delete-btn" onclick="deleteCamera(${result.id},this)">🗑 Жою</button></div>`
  );
  m._cameraId = result.id; m._district = district; m.addTo(map); layers.cameras.push(m); m.openPopup();
  updateDBInfo(); closeCamModal();
  showToast('КАМЕРА ҚОСЫЛДЫ', '#0277bd', `📷 ${name}`);
}

async function deleteCamera(id) {
  await apiDelete('cameras', 'delete', { id });
  const mIdx = layers.cameras.findIndex(m => m._cameraId === id);
  if (mIdx > -1) { map.removeLayer(layers.cameras[mIdx]); layers.cameras.splice(mIdx, 1); }
  updateDBInfo();
}

// ════════════════════════════════════════════════
// BUILDING MODAL
// ════════════════════════════════════════════════
const buildingEmojis = ['🏫','🏥','🛒','🏛','🏦','🕌','🍽️','🏨','🏭','🏠','🏋️','🏟️','🎭','🎓','💒','🚒','🚓','🏗️','🌳','🏪'];
let selectedEmoji = '🏢';

function buildEmojiGrid() {
  const grid = document.getElementById('emoji-grid'); grid.innerHTML = '';
  buildingEmojis.forEach(e => {
    const div = document.createElement('div');
    div.className = 'emoji-option' + (e === selectedEmoji ? ' selected' : '');
    div.textContent = e;
    div.onclick = () => { selectedEmoji = e; document.querySelectorAll('.emoji-option').forEach(el => el.classList.remove('selected')); div.classList.add('selected'); };
    grid.appendChild(div);
  });
}

function openBuildingAtCoords(lat, lng, det) {
  pendingLat = lat; pendingLng = lng;
  document.getElementById('bld-coords-display').style.display = 'flex';
  document.getElementById('bld-coords-text').textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}${det ? ' · ' + districtData[det].name : ''}`;
  if (det) document.getElementById('b-district').value = det;
  document.getElementById('b-name').value = ''; document.getElementById('b-desc').value = '';
  selectedEmoji = '🏢'; buildEmojiGrid();
  document.getElementById('bld-modal-overlay').classList.add('show');
}
function closeBldModal() { document.getElementById('bld-modal-overlay').classList.remove('show'); pendingLat = null; pendingLng = null; }
document.getElementById('bld-modal-overlay').addEventListener('click', function (e) { if (e.target === this) closeBldModal(); });

async function saveBuilding() {
  const name = document.getElementById('b-name').value.trim();
  if (!name) { document.getElementById('b-name').focus(); document.getElementById('b-name').style.borderColor = '#e53935'; return; }
  document.getElementById('b-name').style.borderColor = '';
  const type     = document.getElementById('b-type').value;
  const district = document.getElementById('b-district').value;
  const desc     = document.getElementById('b-desc').value.trim();
  const emoji    = selectedEmoji;

  const result = await apiPost('buildings', 'add', { name, type, district, desc, emoji, lat: pendingLat, lng: pendingLng });
  if (!result.success) { alert('Қате: ' + (result.error || 'Белгісіз')); return; }

  // Кэшке қосамыз
  const newBld = { id: result.id, name, type, district, description: desc, emoji, lat: pendingLat, lng: pendingLng };
  allBuildings.unshift(newBld);
  _addBuildingMarker(newBld);

  updateDBInfo(); renderBuildingsTab(); closeBldModal();
  showToast('ҒИМАРАТ ҚОСЫЛДЫ', '#6a1b9a', `${emoji} ${name}`);
}

async function deleteBuilding(id) {
  await apiDelete('buildings', 'delete', { id });
  const idx = allBuildings.findIndex(b => b.id == id);
  if (idx > -1) allBuildings.splice(idx, 1);
  const mIdx = layers.userBuildings.findIndex(m => m._buildingId == id);
  if (mIdx > -1) { map.removeLayer(layers.userBuildings[mIdx]); layers.userBuildings.splice(mIdx, 1); }
  updateDBInfo(); renderBuildingsTab();
}

// ════════════════════════════════════════════════
// LOAD SAVED DATA FROM DB
// ════════════════════════════════════════════════
const allIncidents = [];
let allBuildings = []; // кэш

async function loadIncidents() {
  const result = await apiGet('incidents', 'list', { limit: 500 });
  (result.data || []).forEach(i => {
    allIncidents.push({ type: i.type, loc: i.location, time: i.time_val, sev: i.severity, district: i.district, id: i.id, lat: parseFloat(i.lat), lng: parseFloat(i.lng), source: i.source });
    if (i.lat && i.lng) {
      const c = i.severity === 'high' ? '#e53935' : i.severity === 'med' ? '#fb8c00' : '#fdd835';
      const m = L.marker([parseFloat(i.lat), parseFloat(i.lng)], { icon: mkIcon(`<div style="background:#fff;border:3px solid ${c};border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,.3)">📌</div>`, 24) }).bindPopup(
        `<div class="popup-inner"><div class="popup-title" style="color:${c}">${i.type}</div><div class="popup-row">📍 ${i.location}</div><div class="popup-row">⏰ ${i.time_val}</div>${i.source === 'auto' ? '<div class="popup-row" style="color:#2e7d32;font-size:9px">🤖 Авто</div>' : ''}<button class="popup-delete-btn" onclick="deleteIncident(${i.id},this)">🗑 Жою</button></div>`
      );
      m._incidentId = i.id; m._district = i.district; m.addTo(map); layers.crimes.push(m);
    }
  });
  renderFeed(null); updateDBInfo();
}

async function loadCameras() {
  const result = await apiGet('cameras', 'list');
  (result.data || []).forEach(cam => {
    if (!cam.lat || !cam.lng) return;
    const statusColor = cam.status === 'ok' ? '#1565c0' : cam.status === 'repair' ? '#fb8c00' : '#e53935';
    const m = L.marker([parseFloat(cam.lat), parseFloat(cam.lng)], { icon: mkIcon(`<div style="width:12px;height:12px;background:${statusColor};border-radius:50%;border:2px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.4)"></div>`, 16) }).bindPopup(
      `<div class="popup-inner"><div class="popup-title" style="color:#1565c0">📷 ${cam.name}</div><div class="popup-row">${cam.quality}</div><button class="popup-delete-btn" onclick="deleteCamera(${cam.id},this)">🗑 Жою</button></div>`
    );
    m._cameraId = cam.id; m._district = cam.district; m.addTo(map); layers.cameras.push(m);
  });
}

async function loadBuildings() {
  const result = await apiGet('buildings', 'list');
  allBuildings = result.data || [];
  allBuildings.forEach(bld => {
    if (!bld.lat || !bld.lng) return;
    _addBuildingMarker(bld);
  });
  renderBuildingsTab();
}

function _addBuildingMarker(bld) {
  const dColor = districtData[bld.district]?.color || '#6a1b9a';
  const emoji = bld.emoji || '🏢';
  const m = L.marker([parseFloat(bld.lat), parseFloat(bld.lng)], {
    icon: mkIcon(`<div style="background:#fff;border:2.5px solid ${dColor};border-radius:7px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,.2)">${emoji}</div>`, 30)
  }).bindPopup(
    `<div class="popup-inner"><div class="popup-title">${emoji} ${bld.name}</div><div class="popup-row">🏷 ${bld.type}</div>${bld.description ? `<div class="popup-row">📝 ${bld.description}</div>` : ''}<div class="popup-row">📍 ${districtData[bld.district]?.name || bld.district}</div><button class="popup-delete-btn" style="background:#ede7f6;color:#4a148c" onclick="deleteBuilding(${bld.id},this)">🗑 Жою</button></div>`
  );
  m._buildingId = bld.id; m._district = bld.district; m.addTo(map); layers.userBuildings.push(m);
  return m;
}

// ════════════════════════════════════════════════
// DB INFO UPDATE
// ════════════════════════════════════════════════
async function updateDBInfo() {
  const stats = await apiGet('stats', '');
  document.getElementById('stat-total').textContent = stats.total || 0;
  document.getElementById('lc-crimes').textContent = stats.total || 0;
  document.getElementById('lc-cameras').textContent = stats.cameras || 42;
  document.getElementById('lc-buildings').textContent = stats.buildings || 0;
  const el = document.getElementById('db-info');
  if (el) el.innerHTML = `Оқиғалар: <b style="color:var(--text-primary)">${stats.total || 0}</b> (қол: ${stats.source?.manual || 0}, авто: ${stats.source?.auto || 0})<br>Ғимараттар: <b style="color:#6a1b9a">${stats.buildings || 0}</b> · Камералар: <b style="color:#0277bd">${stats.cameras || 42}</b>`;
  const hint = document.getElementById('empty-hint');
  if (hint) hint.classList.toggle('hidden', (stats.total || 0) > 0);
  renderHourChart(stats.by_hour);
}

// ════════════════════════════════════════════════
// LAYERS
// ════════════════════════════════════════════════
function toggleLayer(name) {
  layerVisible[name] = !layerVisible[name];
  document.getElementById('l-' + name).checked = layerVisible[name];
  layers[name].forEach(m => {
    if (!layerVisible[name]) { if (map.hasLayer(m)) map.removeLayer(m); }
    else { if (!activeDistrict || m._district === activeDistrict || m._district === null) m.addTo(map); }
  });
}

// ════════════════════════════════════════════════
// DISTRICT FOCUS
// ════════════════════════════════════════════════
function focusDistrict(id) {
  activeDistrict = id;
  const d = districtData[id];
  Object.entries(districtPolygons).forEach(([k, p]) => {
    if (k === id) { p.setStyle({ fillOpacity: 0.25, weight: 4, color: d.color, fillColor: d.color }); p.bringToFront(); }
    else { p.setStyle({ fillOpacity: 0.03, weight: 1, color: '#bbb', fillColor: '#bbb' }); }
  });
  Object.keys(layers).forEach(ln => {
    if (!layerVisible[ln]) return;
    layers[ln].forEach(m => {
      if (m._district === id || m._district === null) { if (!map.hasLayer(m)) m.addTo(map); }
      else { if (map.hasLayer(m)) map.removeLayer(m); }
    });
  });
  if (districtPolygons[id]) map.fitBounds(districtPolygons[id].getBounds(), { padding: [50, 50] });
  document.getElementById('focus-banner').classList.add('show');
  document.getElementById('fb-dot').style.background = d.color;
  document.getElementById('fb-name').textContent = d.name;
  document.getElementById('fb-stats').textContent = `Халық: ${d.pop.toLocaleString('ru-RU')} · ст.190: ${d.st190} · ст.188: ${d.st188}`;
  document.getElementById('dc-name').textContent = d.name;
  document.getElementById('dc-st190').textContent = d.st190;
  document.getElementById('dc-st188').textContent = d.st188;
  document.getElementById('dc-st1091').textContent = d.st1091;
  document.getElementById('dc-total').textContent = d.total;
  document.getElementById('dc-streets').innerHTML = `
    <div class="pop-overlay">
      <div class="pop-overlay-title">👥 ХАЛЫҚ САНЫ</div>
      <div class="pop-overlay-val">${d.pop.toLocaleString('ru-RU')}</div>
      <div class="pop-overlay-row"><span>👨 ${d.popMale.toLocaleString('ru-RU')}</span><span>👩 ${d.popFemale.toLocaleString('ru-RU')}</span><span>📐 ${d.density}/км²</span></div>
    </div>
    <div style="margin-top:7px">
      ${[['ст.190', d.st190, '#fb8c00'], ['ст.188', d.st188, '#e53935'], ['ст.109-1', d.st1091, '#f9a825'], ['ст.296', d.st296 || 0, '#8e24aa'], ['ст.108-1', d.st1081 || 0, '#0288d1']].map(([k, v, c]) => `<div style="display:flex;justify-content:space-between;margin-bottom:3px"><span style="font-size:9px;color:rgba(255,255,255,.8)">${k}</span><span style="font-size:10px;font-weight:700;color:#fff;font-family:'JetBrains Mono',monospace">${v}</span></div>`).join('')}
    </div>
    <div style="margin-top:7px;font-size:8px;opacity:.75;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">НЕГІЗГІ КӨШЕЛЕР</div>
    <div style="font-size:9px;opacity:.85">${d.streets.join(' · ')}</div>`;
  document.getElementById('district-card').style.background = `linear-gradient(135deg,${d.color}ee,${d.color}aa)`;
  document.getElementById('district-card').classList.add('show');
  document.getElementById('district-hint').style.display = 'none';
  policeMarkers.forEach(car => {
    if (!car.routeLine) return;
    if (car.district === id) { if (!map.hasLayer(car.routeLine)) car.routeLine.addTo(map); }
    else { if (map.hasLayer(car.routeLine)) map.removeLayer(car.routeLine); }
  });
  renderFeed(id); renderUnits(id);
}

function resetFocus() {
  activeDistrict = null;
  Object.entries(districtPolygons).forEach(([k, p]) => { const d = districtData[k]; p.setStyle({ fillOpacity: 0.10, weight: 2.5, color: d.color, fillColor: d.color }); });
  Object.keys(layers).forEach(ln => { if (!layerVisible[ln]) return; layers[ln].forEach(m => { if (!map.hasLayer(m)) m.addTo(map); }); });
  policeMarkers.forEach(car => { if (car.routeLine && !map.hasLayer(car.routeLine)) car.routeLine.addTo(map); });
  document.getElementById('focus-banner').classList.remove('show');
  document.getElementById('district-card').classList.remove('show');
  document.getElementById('district-hint').style.display = 'block';
  document.getElementById('region-select').value = '';
  map.setView([42.30, 69.59], 12);
  renderFeed(null); renderUnits(null);
}

// ════════════════════════════════════════════════
// FEED / FILTER
// ════════════════════════════════════════════════
const districtColors = { karatau: '#7b1fa2', abay: '#1565c0', turan: '#00838f', alfarabi: '#e53935', enbekshi: '#2e7d32' };
let activeFilters = new Set();

function toggleFilter(type, el) {
  if (activeFilters.has(type)) { activeFilters.delete(type); el.classList.remove('active'); }
  else { activeFilters.add(type); el.classList.add('active'); }
  renderFeed(activeDistrict);
}
function filterIncidents(query) { renderFeed(activeDistrict, query); }

function renderFeed(districtId, query = '') {
  let list = districtId ? allIncidents.filter(i => i.district === districtId) : [...allIncidents];
  if (activeFilters.size > 0) list = list.filter(i => activeFilters.has(i.type));
  const q = (query || '').toLowerCase();
  if (q) list = list.filter(i => (i.loc || '').toLowerCase().includes(q) || (i.type || '').toLowerCase().includes(q));
  if (!list.length) {
    document.getElementById('incident-feed').innerHTML = `<div style="padding:28px 14px;text-align:center;color:var(--text-muted)"><div style="font-size:32px;margin-bottom:9px">📋</div><div style="font-size:12px;font-weight:600;margin-bottom:5px">Оқиғалар жоқ</div><div style="font-size:10px;line-height:1.6">📍 <strong>Белгілеу</strong> немесе<br>🤖 <strong>Авто</strong> режимін қосыңыз</div></div>`;
    return;
  }
  document.getElementById('incident-feed').innerHTML = list.slice(0, 100).map(i => `
    <div class="inc-item sev-${i.sev}" onclick="${i.lat ? `map.setView([${i.lat},${i.lng}],17)` : ''}" style="${i.lat ? 'cursor:pointer' : ''}">
      <div class="inc-type ${i.sev}">${i.type}${i.source === 'auto' ? '<span class="inc-auto-badge">авто</span>' : ''}</div>
      <div class="inc-loc">📍 ${i.loc || '—'}</div>
      <div class="inc-time">🕐 ${i.time || '—'}${!districtId && districtColors[i.district] ? `<span class="inc-district" style="background:${districtColors[i.district]}22;color:${districtColors[i.district]}">${districtData[i.district]?.name || ''}</span>` : ''}</div>
      ${i.id ? `<button class="inc-delete" onclick="event.stopPropagation();deleteIncident(${i.id},this)">🗑</button>` : ''}
    </div>`).join('');
}

function renderUnits(districtId) {
  const list = districtId ? carRoutes.filter(r => r.district === districtId) : carRoutes;
  document.getElementById('units-list').innerHTML = list.map(u => `<div class="unit-row"><div style="font-size:14px">🚔</div><div class="unit-info"><div class="unit-name">${u.name}</div><div class="unit-street">${u.street}</div></div><div class="badge badge-patrol">ПАТРУЛЬ</div></div>`).join('') || `<div style="padding:9px 0;font-size:10px;color:var(--text-muted)">Патруль жоқ</div>`;
}

function renderBuildingsTab() {
  const blds = allBuildings;
  const el = document.getElementById('buildings-feed');
  if (!blds.length) {
    el.innerHTML = `<div style="padding:22px 14px;text-align:center;color:var(--text-muted);font-size:11px"><div style="font-size:30px;margin-bottom:7px">🏢</div>Ғимараттар жоқ<br><small style="color:var(--text-muted)">🏢 Ғимарат → картаны басыңыз</small></div>`;
    return;
  }
  el.innerHTML = blds.map(b => `
    <div class="bld-item" onclick="map.setView([${b.lat},${b.lng}],16)">
      <div class="bld-emoji">${b.emoji || '🏢'}</div>
      <div class="bld-info">
        <div class="bld-name">${b.name}</div>
        <div class="bld-type">${b.type || ''}</div>
        <span class="bld-district-badge" style="background:${districtData[b.district]?.color || '#666'}">${districtData[b.district]?.name?.replace(' ауданы', '') || b.district}</span>
      </div>
      <button class="bld-delete" onclick="event.stopPropagation();deleteBuilding(${b.id},this)">🗑</button>
    </div>`).join('');
}

// ════════════════════════════════════════════════
// CHARTS
// ════════════════════════════════════════════════
const days = ['Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сб', 'Жк'];
function renderWeekChart(id, data, color) {
  const max = Math.max(...data);
  document.getElementById(id).innerHTML = data.map((v, i) => `<div class="chart-bar-wrap"><div class="chart-bar" style="height:${(v / max) * 46}px;background:${color};opacity:.8"></div><div class="chart-lbl">${days[i]}</div></div>`).join('');
}

function renderDistrictBar(elId, field) {
  const dists = Object.entries(districtData).sort((a, b) => b[1][field] - a[1][field]);
  const max = dists[0][1][field];
  document.getElementById(elId).innerHTML = dists.map(([id, d]) => `<div style="margin-bottom:6px"><div style="display:flex;justify-content:space-between;margin-bottom:2px"><span style="font-size:10px;color:var(--text-secondary)">${d.name.replace(' ауданы', '')}</span><span style="font-size:10px;font-weight:700;color:${d.color};font-family:'JetBrains Mono',monospace">${d[field]}</span></div><div style="height:4px;background:var(--bg-tertiary);border-radius:3px"><div style="height:100%;width:${Math.round(d[field] / max * 100)}%;background:${d.color};border-radius:3px;transition:width .6s"></div></div></div>`).join('');
}

function renderHourChart(byHour) {
  const h = byHour || new Array(24).fill(0);
  const max = Math.max(...h, 1);
  document.getElementById('chart-hours').innerHTML = h.map((v, i) => `<div class="h-bar-w"><div class="h-bar" style="height:${(v / max) * 44}px;background:${v === Math.max(...h) && v > 0 ? '#e53935' : '#1565c0'};opacity:.75"></div><div class="h-lbl">${i % 4 === 0 ? i : ''}</div></div>`).join('');
}

function renderRanking() {
  const dists = Object.entries(districtData).sort((a, b) => b[1].total - a[1].total);
  const max = dists[0][1].total;
  document.getElementById('district-ranking').innerHTML = dists.map(([id, d]) => `<div style="margin-bottom:7px"><div style="display:flex;justify-content:space-between;margin-bottom:2px"><span style="font-size:10px;color:var(--text-secondary)">${d.name.replace(' ауданы', '')}</span><span style="font-size:10px;font-weight:700;color:${d.color};font-family:'JetBrains Mono',monospace">${d.total}</span></div><div style="height:4px;background:var(--bg-tertiary);border-radius:3px"><div style="height:100%;width:${Math.round(d.total / max * 100)}%;background:${d.color};border-radius:3px;transition:width .6s"></div></div></div>`).join('');
}

// ════════════════════════════════════════════════
// ANALYTICS MODAL
// ════════════════════════════════════════════════
function openAnalytics() {
  document.getElementById('analytics-overlay').classList.add('show');
  renderAnalyticsBars(); renderAnalyticsTopCrimes();
  setTimeout(renderRadarChart, 100);
}
function closeAnalytics() { document.getElementById('analytics-overlay').classList.remove('show'); }
document.getElementById('analytics-overlay').addEventListener('click', function (e) { if (e.target === this) closeAnalytics(); });

function renderAnalyticsBars() {
  const dists = Object.entries(districtData).sort((a, b) => b[1].total - a[1].total);
  const max = dists[0][1].total;
  document.getElementById('analytics-bars').innerHTML = dists.map(([id, d]) => `
    <div class="a-bar-row">
      <div class="a-bar-label" style="color:${d.color}">${d.name.replace(' ауданы', '')}</div>
      <div class="a-bar-bg"><div class="a-bar-fill" style="width:${Math.round(d.total / max * 100)}%;background:${d.color};height:100%"></div></div>
      <div class="a-bar-val" style="color:${d.color}">${d.total}</div>
    </div>`).join('');
}

function renderAnalyticsTopCrimes() {
  const crimes = [['ст.190 Алаяқтық', 799, '#fb8c00'], ['ст.188 Ұрлық', 393, '#e53935'], ['ст.109-1', 239, '#f9a825'], ['ст.296', 130, '#8e24aa'], ['ст.108-1', 99, '#0288d1'], ['ст.345', 59, '#6d4c41'], ['ст.107', 56, '#c62828'], ['ст.293', 37, '#e65100'], ['ст.139', 36, '#b71c1c']];
  const max = crimes[0][1];
  document.getElementById('analytics-top-crimes').innerHTML = crimes.map(([name, val, color]) => `
    <div class="a-bar-row">
      <div class="a-bar-label" style="color:${color};font-size:10px;width:130px">${name}</div>
      <div class="a-bar-bg"><div class="a-bar-fill" style="width:${Math.round(val / max * 100)}%;background:${color};height:100%"></div></div>
      <div class="a-bar-val" style="color:${color}">${val}</div>
    </div>`).join('');
}

function renderRadarChart() {
  const canvas = document.getElementById('radar-canvas'); if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = 400, H = 220, cx = W / 2, cy = H / 2, R = 80;
  ctx.clearRect(0, 0, W, H);
  const districts = Object.values(districtData);
  const axes = [{ label: 'ст.190', key: 'st190', max: 204 }, { label: 'ст.188', key: 'st188', max: 120 }, { label: 'ст.109-1', key: 'st1091', max: 71 }, { label: 'ст.296', key: 'st296', max: 44 }, { label: 'ст.108-1', key: 'st1081', max: 31 }];
  const N = axes.length;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const textColor = isDark ? '#a0adb8' : '#4a5568';
  for (let r = 0.25; r <= 1; r += 0.25) {
    ctx.beginPath();
    for (let i = 0; i <= N; i++) { const angle = (i / N) * Math.PI * 2 - Math.PI / 2; const x = cx + Math.cos(angle) * R * r; const y = cy + Math.sin(angle) * R * r; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.closePath(); ctx.strokeStyle = gridColor; ctx.lineWidth = 1; ctx.stroke();
  }
  for (let i = 0; i < N; i++) {
    const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(angle) * R, cy + Math.sin(angle) * R);
    ctx.strokeStyle = gridColor; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = textColor; ctx.font = 'bold 10px Rubik'; ctx.textAlign = 'center';
    ctx.fillText(axes[i].label, cx + Math.cos(angle) * (R + 18), cy + Math.sin(angle) * (R + 18) + 4);
  }
  districts.forEach(d => {
    ctx.beginPath();
    axes.forEach((axis, i) => {
      const val = (d[axis.key] || 0) / axis.max;
      const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(angle) * R * val; const y = cy + Math.sin(angle) * R * val;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath(); ctx.fillStyle = d.color + '44'; ctx.fill(); ctx.strokeStyle = d.color; ctx.lineWidth = 1.5; ctx.stroke();
  });
  let lx = 10;
  districts.forEach(d => {
    ctx.fillStyle = d.color; ctx.fillRect(lx, H - 18, 10, 10);
    ctx.fillStyle = textColor; ctx.font = '9px Rubik'; ctx.textAlign = 'left';
    ctx.fillText(d.name.replace(' ауданы', ''), lx + 13, H - 10);
    lx += ctx.measureText(d.name.replace(' ауданы', '')).width + 28;
  });
}

// ════════════════════════════════════════════════
// TOAST
// ════════════════════════════════════════════════
function showToast(type, color, loc) {
  document.getElementById('toast-type').textContent = type;
  document.getElementById('toast').style.borderLeftColor = color;
  document.getElementById('toast-type').style.color = color;
  document.getElementById('toast-loc').textContent = loc;
  const t = document.getElementById('toast'); t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 4000);
}

// ════════════════════════════════════════════════
// EXPORT / CLEAR
// ════════════════════════════════════════════════
function exportCSV() {
  window.location.href = 'api.php?resource=export&action=';
}

async function clearDB() {
  if (confirm('Барлық сақталған деректерді өшіру керек пе?')) {
    await apiDelete('incidents', 'clear');
    while (allIncidents.length) allIncidents.pop();
    layers.crimes = layers.crimes.filter(m => { if (m._incidentId) { map.removeLayer(m); return false; } return true; });
    updateDBInfo(); renderFeed(activeDistrict); renderHourChart();
  }
}

function selectDistrict(id) { if (!id) { resetFocus(); return; } focusDistrict(id); }
function zoomToSelected() { const id = document.getElementById('region-select').value; if (!id) { resetFocus(); return; } focusDistrict(id); }

function switchTab(name, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.getElementById('tab-' + name).classList.add('active');
  if (name === 'stats') {
    renderWeekChart('chart-dtp', [12, 8, 15, 9, 11, 7, 14], '#fb8c00');
    renderWeekChart('chart-crime', [28, 22, 35, 18, 31, 25, 38], '#e53935');
    renderRanking();
    renderDistrictBar('district-st190', 'st190');
    renderDistrictBar('district-st188', 'st188');
    updateDBInfo();
  }
  if (name === 'buildings') renderBuildingsTab();
}

// ════════════════════════════════════════════════
// CLOCK
// ════════════════════════════════════════════════
function tick() {
  const n = new Date();
  document.getElementById('clock').textContent = `${n.getHours().toString().padStart(2, '0')}:${n.getMinutes().toString().padStart(2, '0')}:${n.getSeconds().toString().padStart(2, '0')} · ${n.toLocaleDateString('kk-KZ')}`;
}
setInterval(tick, 1000); tick();


// ════════════════════════════════════════════════
// INIT — шекараларды бірінші, дереу жүктейміз
// ════════════════════════════════════════════════

// 1) Резервтік шекараларды карта дайын болған бойда бірден саламыз
loadFallbackBoundaries();

// 2) Содан кейін барлығын асинхронды жүктейміз
(async () => {
  await loadIncidents();
  await loadCameras();
  await loadBuildings();
  renderUnits(null);
  await updateDBInfo();
  renderDistrictBar('district-st190', 'st190');
  renderDistrictBar('district-st188', 'st188');
  renderRanking();

  // 3) OSM-дан нақты шекараларды фоннан тырысамыз
  loadOSMBoundaries();
})();