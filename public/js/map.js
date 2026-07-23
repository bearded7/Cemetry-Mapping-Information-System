(function () {
  'use strict';

  const OSRM_BASE = 'https://router.project-osrm.org/route/v1/foot';

  let map, clusterGroup, userMarker, userAccuracyCircle, routeLayer;
  let watchId = null;
  let routeRecalcTimer = null;
  let activeGrave = null;
  const graveMarkers = new Map(); // grave id -> marker

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function formatYears(g) {
    const b = g.date_of_birth ? g.date_of_birth.slice(0, 4) : '?';
    const d = g.date_of_death ? g.date_of_death.slice(0, 4) : '?';
    if (b === '?' && d === '?') return '';
    return `${b} – ${d}`;
  }

  function graveIcon() {
    return L.divIcon({
      className: 'grave-marker',
      html: `<svg width="26" height="34" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 1C6 1 1 6.4 1 12.8 1 21 13 33 13 33s12-12 12-20.2C25 6.4 20 1 13 1z" fill="#3F5D48" stroke="#22262A" stroke-width="0.5"/>
        <circle cx="13" cy="13" r="5.4" fill="#F4F2ED"/>
      </svg>`,
      iconSize: [26, 34],
      iconAnchor: [13, 34],
      popupAnchor: [0, -30],
    });
  }

  function userIcon() {
    return L.divIcon({
      className: 'user-marker',
      html: `<div style="width:18px;height:18px;border-radius:50%;background:#2E6BE6;border:3px solid #fff;box-shadow:0 0 0 2px rgba(46,107,230,0.35);"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
  }

  function popupHtml(g) {
    const years = formatYears(g);
    return `
      <div class="grave-popup">
        <div class="name">${escapeHtml(g.first_name)} ${escapeHtml(g.last_name)}</div>
        <div class="dates">${escapeHtml(years)}${g.plot_reference ? ' · ' + escapeHtml(g.plot_reference) : ''}</div>
        <div class="actions">
          <button class="btn btn-primary btn-sm" data-directions="${g.id}">Get directions</button>
          <a class="btn btn-ghost btn-sm" href="/grave.html?id=${g.id}">Details</a>
        </div>
      </div>`;
  }

  function addOrUpdateGraveMarker(g) {
    if (graveMarkers.has(g.id)) return;
    const marker = L.marker([g.latitude, g.longitude], { icon: graveIcon() });
    marker.bindPopup(popupHtml(g));
    marker.on('popupopen', (e) => {
      const btn = e.popup._contentNode.querySelector('[data-directions]');
      if (btn) btn.addEventListener('click', () => startDirections(g));
    });
    graveMarkers.set(g.id, marker);
    clusterGroup.addLayer(marker);
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  const loadGravesInView = debounce(async () => {
    const b = map.getBounds();
    try {
      const { graves } = await Api.get(
        `/api/graves?minLat=${b.getSouth()}&maxLat=${b.getNorth()}&minLng=${b.getWest()}&maxLng=${b.getEast()}&limit=1000`
      );
      graves.forEach(addOrUpdateGraveMarker);
    } catch (err) {
      console.error('Failed to load graves for map view:', err);
    }
  }, 350);

  function renderResults(graves) {
    const body = document.getElementById('resultsBody');
    if (graves.length === 0) {
      body.innerHTML = `<div class="empty-state"><p>No matching graves found. Try a different spelling, or check the record has been approved yet.</p></div>`;
      return;
    }
    body.innerHTML = graves.map((g) => `
      <div class="grave-result" data-id="${g.id}" tabindex="0" role="button">
        <div class="name">${escapeHtml(g.first_name)} ${escapeHtml(g.last_name)}</div>
        <div class="dates">${escapeHtml(formatYears(g))}</div>
        ${g.plot_reference ? `<div class="plot">${escapeHtml(g.plot_reference)}</div>` : ''}
      </div>
    `).join('');

    body.querySelectorAll('.grave-result').forEach((el) => {
      const go = () => {
        const g = graves.find((x) => String(x.id) === el.dataset.id);
        if (!g) return;
        addOrUpdateGraveMarker(g);
        map.setView([g.latitude, g.longitude], 19, { animate: true });
        setTimeout(() => graveMarkers.get(g.id).openPopup(), 300);
      };
      el.addEventListener('click', go);
      el.addEventListener('keypress', (e) => { if (e.key === 'Enter') go(); });
    });
  }

  async function runSearch(q) {
    if (!q.trim()) return;
    try {
      const { graves } = await Api.get(`/api/graves/search?q=${encodeURIComponent(q)}`);
      renderResults(graves);
    } catch (err) {
      document.getElementById('resultsBody').innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
    }
  }

  // ---- Geolocation (live position) -------------------------------------
  function startLiveLocation() {
    if (!navigator.geolocation) {
      alert('Your browser does not support geolocation.');
      return;
    }
    if (watchId !== null) return; // already watching

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (!userMarker) {
          userMarker = L.marker([latitude, longitude], { icon: userIcon(), zIndexOffset: 1000 }).addTo(map);
          userAccuracyCircle = L.circle([latitude, longitude], { radius: accuracy, color: '#2E6BE6', weight: 1, fillOpacity: 0.08 }).addTo(map);
          map.setView([latitude, longitude], 18);
        } else {
          userMarker.setLatLng([latitude, longitude]);
          userAccuracyCircle.setLatLng([latitude, longitude]);
          userAccuracyCircle.setRadius(accuracy);
        }
        if (activeGrave) maybeRecalculateRoute(latitude, longitude);
      },
      (err) => {
        alert('Could not get your location: ' + err.message);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }

  function getCurrentPositionOnce() {
    return new Promise((resolve, reject) => {
      if (userMarker) {
        const ll = userMarker.getLatLng();
        return resolve({ lat: ll.lat, lng: ll.lng });
      }
      if (!navigator.geolocation) return reject(new Error('Geolocation is not supported by your browser.'));
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(new Error('Could not get your location: ' + err.message)),
        { enableHighAccuracy: true, timeout: 15000 }
      );
    });
  }

  // ---- Directions / routing ---------------------------------------------
  let lastRouteCalc = 0;
  function maybeRecalculateRoute(lat, lng) {
    const now = Date.now();
    if (now - lastRouteCalc < 12000) return; // throttle live recalculation
    lastRouteCalc = now;
    computeRoute({ lat, lng }, activeGrave);
  }

  async function computeRoute(from, grave) {
    const url = `${OSRM_BASE}/${from.lng},${from.lat};${grave.longitude},${grave.latitude}?overview=full&geometries=geojson&steps=true`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Routing service unavailable');
      const data = await res.json();
      if (!data.routes || data.routes.length === 0) throw new Error('No walking route found');
      const route = data.routes[0];

      if (routeLayer) map.removeLayer(routeLayer);
      routeLayer = L.geoJSON(route.geometry, { style: { color: '#3F5D48', weight: 5, opacity: 0.85 } }).addTo(map);

      const minutes = Math.round(route.duration / 60);
      const meters = Math.round(route.distance);
      const distanceStr = meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${meters} m`;

      const banner = document.getElementById('routeBanner');
      banner.hidden = false;
      document.getElementById('routeSummary').textContent =
        `${distanceStr} · about ${minutes < 1 ? '1' : minutes} min walk to ${grave.first_name} ${grave.last_name}`;

      const nextStep = route.legs[0] && route.legs[0].steps && route.legs[0].steps[1];
      document.getElementById('routeSteps').textContent = nextStep
        ? `Next: ${describeStep(nextStep)}`
        : 'Follow the highlighted path.';
    } catch (err) {
      const banner = document.getElementById('routeBanner');
      banner.hidden = false;
      document.getElementById('routeSummary').textContent = 'Could not calculate a walking route.';
      document.getElementById('routeSteps').textContent = err.message;
    }
  }

  function describeStep(step) {
    const type = step.maneuver && step.maneuver.type;
    const modifier = step.maneuver && step.maneuver.modifier;
    const name = step.name ? ` onto ${step.name}` : '';
    if (type === 'arrive') return 'You will arrive at the grave.';
    if (modifier) return `${modifier.replace('_', ' ')}${name}`;
    return `Continue${name}`;
  }

  async function startDirections(grave) {
    activeGrave = grave;
    startLiveLocation();
    try {
      const from = await getCurrentPositionOnce();
      lastRouteCalc = Date.now();
      await computeRoute(from, grave);
      map.fitBounds(L.latLngBounds([[from.lat, from.lng], [grave.latitude, grave.longitude]]), { padding: [60, 60] });
    } catch (err) {
      alert(err.message);
    }
  }

  function closeRoute() {
    activeGrave = null;
    if (routeLayer) { map.removeLayer(routeLayer); routeLayer = null; }
    document.getElementById('routeBanner').hidden = true;
  }

  // ---- Init ---------------------------------------------------------------
  async function init() {
    map = L.map('map', { zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 20,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    clusterGroup = L.markerClusterGroup({ maxClusterRadius: 45 });
    map.addLayer(clusterGroup);

    let center = [4.8594, 31.5713];
    let zoom = 17;
    try {
      const { cemeteries } = await Api.get('/api/cemeteries');
      if (cemeteries.length > 0) {
        center = [cemeteries[0].center_lat, cemeteries[0].center_lng];
        zoom = cemeteries[0].default_zoom || 18;
      }
    } catch (_) { /* fall back to default center */ }

    map.setView(center, zoom);
    map.on('moveend', loadGravesInView);
    loadGravesInView();

    document.getElementById('searchForm').addEventListener('submit', (e) => {
      e.preventDefault();
      runSearch(document.getElementById('mapSearchInput').value);
    });

    document.getElementById('locateBtn').addEventListener('click', startLiveLocation);
    document.getElementById('closeRoute').addEventListener('click', closeRoute);

    // Deep link support: /map.html?graveId=123
    const params = new URLSearchParams(window.location.search);
    const graveId = params.get('graveId');
    const q = params.get('q');
    if (graveId) {
      Api.get(`/api/graves/${graveId}`).then(({ grave }) => {
        addOrUpdateGraveMarker(grave);
        map.setView([grave.latitude, grave.longitude], 19);
        setTimeout(() => graveMarkers.get(grave.id).openPopup(), 400);
      }).catch(() => {});
    }
    if (q) {
      document.getElementById('mapSearchInput').value = q;
      runSearch(q);
    }
  }

  init();
})();
