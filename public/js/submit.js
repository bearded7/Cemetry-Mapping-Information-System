(function () {
  'use strict';

  const MAX_FILES = 5;
  const MAX_BYTES = 8 * 1024 * 1024;
  const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

  let pickerMap, pickerMarker;
  let selectedFiles = [];

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function setCoords(lat, lng) {
    document.getElementById('latitude').value = lat;
    document.getElementById('longitude').value = lng;
    document.getElementById('coordsLabel').textContent = `${lat.toFixed(6)}°, ${lng.toFixed(6)}°`;
  }

  function placeMarker(lat, lng) {
    if (!pickerMarker) {
      pickerMarker = L.marker([lat, lng], { draggable: true }).addTo(pickerMap);
      pickerMarker.on('dragend', () => {
        const ll = pickerMarker.getLatLng();
        setCoords(ll.lat, ll.lng);
      });
    } else {
      pickerMarker.setLatLng([lat, lng]);
    }
    setCoords(lat, lng);
  }

  async function init() {
    let user;
    try {
      const me = await Api.get('/api/auth/me');
      user = me.user;
    } catch (_) { user = null; }

    if (!user) {
      window.location.href = '/login.html?next=' + encodeURIComponent('/submit-grave.html');
      return;
    }

    document.getElementById('authGate').hidden = true;
    document.getElementById('formWrap').hidden = false;

    let center = [4.8594, 31.5713];
    let zoom = 18;
    let cemeteries = [];
    try {
      const data = await Api.get('/api/cemeteries');
      cemeteries = data.cemeteries;
    } catch (_) { /* ignore */ }

    const select = document.getElementById('cemeteryId');
    select.innerHTML = cemeteries.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
    if (cemeteries.length > 0) {
      center = [cemeteries[0].center_lat, cemeteries[0].center_lng];
      zoom = cemeteries[0].default_zoom || 18;
    }

    pickerMap = L.map('pickerMap').setView(center, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 20,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(pickerMap);
    pickerMap.on('click', (e) => placeMarker(e.latlng.lat, e.latlng.lng));

    document.getElementById('useGpsBtn').addEventListener('click', () => {
      const status = document.getElementById('gpsStatus');
      if (!navigator.geolocation) {
        status.textContent = 'Geolocation is not supported by your browser — drop a pin on the map instead.';
        return;
      }
      status.textContent = 'Getting your location…';
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          placeMarker(latitude, longitude);
          document.getElementById('gpsAccuracy').value = accuracy;
          pickerMap.setView([latitude, longitude], 19);
          status.textContent = `Location set from your device (±${Math.round(accuracy)}m accuracy). Drag the pin to fine-tune.`;
        },
        (err) => { status.textContent = 'Could not get your location: ' + err.message; },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    });

    // --- Photo handling -----------------------------------------------
    const drop = document.getElementById('photoDrop');
    const input = document.getElementById('photoInput');
    drop.addEventListener('click', () => input.click());
    drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('dragover'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('dragover'));
    drop.addEventListener('drop', (e) => {
      e.preventDefault();
      drop.classList.remove('dragover');
      addFiles(e.dataTransfer.files);
    });
    input.addEventListener('change', () => addFiles(input.files));

    function addFiles(fileList) {
      const alertBox = document.getElementById('formAlert');
      for (const file of fileList) {
        if (selectedFiles.length >= MAX_FILES) {
          alertBox.innerHTML = `<div class="alert alert-error">You can attach up to ${MAX_FILES} photos.</div>`;
          break;
        }
        if (!ALLOWED_TYPES.has(file.type)) {
          alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(file.name)} isn't a supported image type.</div>`;
          continue;
        }
        if (file.size > MAX_BYTES) {
          alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(file.name)} is larger than 8MB.</div>`;
          continue;
        }
        selectedFiles.push(file);
      }
      renderPreviews();
    }

    function renderPreviews() {
      const wrap = document.getElementById('photoPreviews');
      wrap.innerHTML = '';
      selectedFiles.forEach((file, idx) => {
        const url = URL.createObjectURL(file);
        const img = document.createElement('img');
        img.src = url;
        img.alt = file.name;
        img.title = 'Click to remove';
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => { selectedFiles.splice(idx, 1); renderPreviews(); });
        wrap.appendChild(img);
      });
    }

    // --- Submit ---------------------------------------------------------
    document.getElementById('graveForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const alertBox = document.getElementById('formAlert');
      alertBox.innerHTML = '';

      if (!document.getElementById('latitude').value) {
        alertBox.innerHTML = `<div class="alert alert-error">Please set the grave's location using GPS or by dropping a pin on the map.</div>`;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const btn = document.getElementById('submitBtn');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Submitting…';

      const form = document.getElementById('graveForm');
      const fd = new FormData();
      ['cemeteryId', 'firstName', 'lastName', 'maidenName', 'dateOfBirth', 'dateOfDeath',
        'plotReference', 'epitaph', 'biography', 'latitude', 'longitude', 'gpsAccuracy'].forEach((name) => {
        const el = form.elements[name];
        if (el && el.value) fd.append(name, el.value);
      });
      selectedFiles.forEach((f) => fd.append('photos', f));

      try {
        const result = await Api.post('/api/graves', fd, true);
        alertBox.innerHTML = `<div class="alert alert-success">${escapeHtml(result.message)}</div>`;
        form.reset();
        selectedFiles = [];
        renderPreviews();
        setTimeout(() => { window.location.href = '/my-submissions.html'; }, 1400);
      } catch (err) {
        alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } finally {
        btn.disabled = false;
        btn.textContent = 'Submit for review';
      }
    });
  }

  init();
})();
