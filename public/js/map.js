/**
 * Cemetery Mapping Information System - Map Controller
 */

class CemeteryMap {
  constructor() {
    this.map = null;
    this.markers = {
      cemeteries: [],
      graves: []
    };
    this.currentMarkers = [];
    this.selectedGrave = null;
    this.initMap();
    this.loadData();
    this.setupEventListeners();
  }

  initMap() {
    // Initialize map
    this.map = L.map('map', {
      center: [20.0, 0.0],
      zoom: 2,
      zoomControl: true,
      fadeAnimation: true
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Add scale control
    L.control.scale({
      position: 'bottomright',
      metric: true,
      imperial: true
    }).addTo(this.map);

    // Add geocoder control
    L.Control.geocoder({
      defaultMarkGeocode: false,
      position: 'topleft',
      placeholder: 'Search location...',
      errorMessage: 'Location not found'
    }).on('markgeocode', (e) => {
      const center = e.geocode.center;
      this.map.setView(center, 15);
    }).addTo(this.map);

    // Add fullscreen control
    const fullscreenControl = L.control.fullscreen({
      position: 'topleft',
      title: 'Toggle Fullscreen'
    });
    this.map.addControl(fullscreenControl);

    // Add locate control
    const locateControl = L.control.locate({
      position: 'topleft',
      strings: {
        title: 'Show my location'
      }
    });
    this.map.addControl(locateControl);
  }

  async loadData() {
    try {
      // Load cemeteries
      const cemeteriesResponse = await fetch('/api/cemeteries');
      const cemeteries = await cemeteriesResponse.json();
      
      // Load graves
      const gravesResponse = await fetch('/api/graves');
      const graves = await gravesResponse.json();

      // Populate cemetery dropdown
      this.populateCemeteryDropdown(cemeteries);

      // Add markers
      this.addCemeteryMarkers(cemeteries);
      this.addGraveMarkers(graves);

      // Fit map to show all markers
      if (this.currentMarkers.length > 0) {
        const group = L.featureGroup(this.currentMarkers);
        this.map.fitBounds(group.getBounds(), { padding: [50, 50] });
      }

    } catch (error) {
      console.error('Error loading data:', error);
      this.showError('Failed to load cemetery data');
    }
  }

  addCemeteryMarkers(cemeteries) {
    cemeteries.forEach(cemetery => {
      if (!cemetery.latitude || !cemetery.longitude) return;

      const marker = L.marker([cemetery.latitude, cemetery.longitude], {
        icon: this.getCemeteryIcon(),
        title: cemetery.name
      });

      // Create popup content
      const popupContent = `
        <div class="popup-content">
          <h6>${cemetery.name}</h6>
          <p>${cemetery.address || ''}</p>
          <p class="text-muted small">
            <i class="fas fa-grave"></i> ${cemetery.total_graves || 0} graves
          </p>
          <a href="/cemeteries/${cemetery.id}" class="btn btn-sm btn-primary">
            View Details
          </a>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'popup-cemetery'
      });

      marker.on('click', () => {
        this.loadGravesForCemetery(cemetery.id);
      });

      marker.addTo(this.map);
      this.currentMarkers.push(marker);
      this.markers.cemeteries.push(marker);
    });
  }

  addGraveMarkers(graves) {
    graves.forEach(grave => {
      if (!grave.latitude || !grave.longitude) return;

      const marker = L.marker([grave.latitude, grave.longitude], {
        icon: this.getGraveIcon(),
        title: grave.deceased_name
      });

      const popupContent = `
        <div class="popup-content">
          <h6>${grave.deceased_name}</h6>
          <p>${grave.birth_date || ''} - ${grave.death_date || ''}</p>
          <p class="text-muted small">${grave.section || ''} ${grave.plot_number || ''}</p>
          <button class="btn btn-sm btn-info" onclick="window.cemeteryMap.viewGrave('${grave.id}')">
            View Details
          </button>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'popup-grave'
      });

      marker.addTo(this.map);
      this.currentMarkers.push(marker);
      this.markers.graves.push(marker);
    });
  }

  getCemeteryIcon() {
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="marker-pin cemetery-pin"><i class="fas fa-church"></i></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30]
    });
  }

  getGraveIcon() {
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="marker-pin grave-pin"><i class="fas fa-cross"></i></div>`,
      iconSize: [25, 25],
      iconAnchor: [12, 25],
      popupAnchor: [0, -25]
    });
  }

  populateCemeteryDropdown(cemeteries) {
    const dropdown = document.getElementById('search-cemetery');
    if (!dropdown) return;

    cemeteries.forEach(cemetery => {
      const option = document.createElement('option');
      option.value = cemetery.id;
      option.textContent = cemetery.name;
      dropdown.appendChild(option);
    });
  }

  async loadGravesForCemetery(cemeteryId) {
    try {
      const response = await fetch(`/api/cemeteries/${cemeteryId}/graves`);
      const graves = await response.json();
      
      // Update results sidebar
      this.displaySearchResults(graves);
    } catch (error) {
      console.error('Error loading graves:', error);
    }
  }

  displaySearchResults(graves) {
    const container = document.getElementById('search-results');
    if (!container) return;

    if (!graves || graves.length === 0) {
      container.innerHTML = '<p class="text-muted">No graves found.</p>';
      return;
    }

    let html = '<ul class="list-unstyled">';
    graves.forEach(grave => {
      html += `
        <li class="search-result-item mb-2 p-2 border rounded" 
            onclick="window.cemeteryMap.viewGrave('${grave.id}')">
          <strong>${grave.deceased_name}</strong>
          <br>
          <small class="text-muted">
            ${grave.birth_date || ''} - ${grave.death_date || ''}
            ${grave.plot_number ? ` | Plot ${grave.plot_number}` : ''}
          </small>
        </li>
      `;
    });
    html += '</ul>';

    container.innerHTML = html;
  }

  async viewGrave(graveId) {
    try {
      const response = await fetch(`/api/graves/${graveId}`);
      const grave = await response.json();
      
      this.selectedGrave = grave;
      this.showGraveModal(grave);
      
      // Center map on grave
      if (grave.latitude && grave.longitude) {
        this.map.setView([grave.latitude, grave.longitude], 18);
      }
    } catch (error) {
      console.error('Error loading grave details:', error);
    }
  }

  showGraveModal(grave) {
    const modal = new bootstrap.Modal(document.getElementById('graveModal'));
    const content = document.getElementById('grave-info-content');

    content.innerHTML = `
      <div class="row">
        <div class="col-md-6">
          <h5>${grave.deceased_name}</h5>
          <p><strong>Born:</strong> ${grave.birth_date || 'Unknown'}</p>
          <p><strong>Died:</strong> ${grave.death_date || 'Unknown'}</p>
          <p><strong>Age:</strong> ${grave.age_at_death || 'Unknown'}</p>
          <p><strong>Location:</strong> ${grave.section || ''} ${grave.block || ''} ${grave.plot_number || ''}</p>
          <p><strong>Cemetery:</strong> ${grave.cemetery_name || 'Unknown'}</p>
        </div>
        <div class="col-md-6">
          ${grave.epitaph ? `<p><strong>Epitaph:</strong> "${grave.epitaph}"</p>` : ''}
          ${grave.image_url ? `<img src="${grave.image_url}" class="img-fluid rounded" alt="${grave.deceased_name}">` : ''}
          ${grave.occupation ? `<p><strong>Occupation:</strong> ${grave.occupation}</p>` : ''}
          ${grave.nationality ? `<p><strong>Nationality:</strong> ${grave.nationality}</p>` : ''}
        </div>
      </div>
      <div class="mt-3">
        <a href="/graves/${grave.id}" class="btn btn-primary">View Full Details</a>
        ${grave.latitude && grave.longitude ? `
          <a href="https://www.openstreetmap.org/?mlat=${grave.latitude}&mlon=${grave.longitude}" 
             target="_blank" class="btn btn-outline-secondary">
            <i class="fas fa-directions me-1"></i>Directions
          </a>
        ` : ''}
      </div>
    `;

    modal.show();
  }

  setupEventListeners() {
    // Search form
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
      searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('search-name').value;
        const cemeteryId = document.getElementById('search-cemetery').value;
        await this.searchGraves(name, cemeteryId);
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // 'F' for fullscreen
      if (e.key === 'f' && !e.ctrlKey && !e.metaKey) {
        if (this.map.fullscreen) {
          this.map.toggleFullscreen();
        }
      }
    });
  }

  async searchGraves(name, cemeteryId) {
    try {
      let url = '/api/graves/search?';
      const params = new URLSearchParams();
      if (name) params.append('name', name);
      if (cemeteryId) params.append('cemeteryId', cemeteryId);
      
      const response = await fetch(url + params.toString());
      const graves = await response.json();
      
      this.displaySearchResults(graves);
      
      // Highlight markers on map
      this.highlightGraveMarkers(graves);
    } catch (error) {
      console.error('Error searching graves:', error);
    }
  }

  highlightGraveMarkers(graves) {
    // Reset all markers
    this.markers.graves.forEach(marker => {
      marker.setIcon(this.getGraveIcon());
    });

    // Highlight found graves
    const foundIds = graves.map(g => g.id);
    this.markers.graves.forEach(marker => {
      if (foundIds.includes(marker.options.id)) {
        // Highlight marker
        marker.setIcon(this.getHighlightedGraveIcon());
      }
    });
  }

  getHighlightedGraveIcon() {
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="marker-pin grave-pin highlighted"><i class="fas fa-cross"></i></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30]
    });
  }

  showError(message) {
    const container = document.getElementById('search-results');
    if (container) {
      container.innerHTML = `<div class="alert alert-danger">${message}</div>`;
    }
  }
}

// Initialize map when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.cemeteryMap = new CemeteryMap();
});