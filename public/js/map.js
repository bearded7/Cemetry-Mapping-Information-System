/**
 * Cemetery Mapping System - Enhanced Map with GPS, Directions, and Thumbnails
 */

class CemeteryMap {
  constructor() {
    this.map = null;
    this.markers = [];
    this.routingControl = null;
    this.currentLocation = null;
    this.selectedGrave = null;
    this.userLocationMarker = null;
    this.initMap();
    this.loadData();
    this.setupEventListeners();
    this.getUserLocation();
  }

  initMap() {
    this.map = L.map('map', {
      center: [20.0, 0.0],
      zoom: 2,
      zoomControl: true,
      fadeAnimation: true
    });

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

    // Add geocoder
    L.Control.geocoder({
      defaultMarkGeocode: false,
      position: 'topleft',
      placeholder: 'Search location...',
      errorMessage: 'Location not found'
    }).on('markgeocode', (e) => {
      const center = e.geocode.center;
      this.map.setView(center, 15);
    }).addTo(this.map);

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
      const [cemeteriesResponse, gravesResponse] = await Promise.all([
        fetch('/api/cemeteries'),
        fetch('/api/graves')
      ]);
      
      const cemeteries = await cemeteriesResponse.json();
      const graves = await gravesResponse.json();

      this.addCemeteryMarkers(cemeteries);
      this.addGraveMarkers(graves);

      if (this.markers.length > 0) {
        const group = L.featureGroup(this.markers);
        this.map.fitBounds(group.getBounds(), { padding: [50, 50] });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      this.showError('Failed to load cemetery data');
    }
  }

  addGraveMarkers(graves) {
    graves.forEach(grave => {
      if (!grave.latitude || !grave.longitude) return;

      // Create custom popup with thumbnail
      const popupContent = `
        <div class="grave-popup">
          <div class="grave-thumbnail">
            ${grave.primary_photo ? 
              `<img src="${grave.primary_photo}" alt="${grave.deceased_name}" class="img-fluid rounded">` :
              `<div class="no-photo"><i class="fas fa-cross fa-2x"></i></div>`
            }
          </div>
          <div class="grave-info">
            <h6 class="grave-name">${grave.deceased_name}</h6>
            <p class="grave-dates">
              ${grave.birth_date ? new Date(grave.birth_date).toLocaleDateString() : '?'} - 
              ${grave.death_date ? new Date(grave.death_date).toLocaleDateString() : '?'}
            </p>
            <p class="grave-location small text-muted">
              ${grave.cemetery_name || ''} 
              ${grave.section ? `| Section ${grave.section}` : ''}
              ${grave.plot_number ? `| Plot ${grave.plot_number}` : ''}
            </p>
            <div class="grave-actions">
              <button class="btn btn-sm btn-primary" onclick="window.cemeteryMap.viewGrave('${grave.id}')">
                <i class="fas fa-info-circle me-1"></i>Details
              </button>
              <button class="btn btn-sm btn-success" onclick="window.cemeteryMap.getDirections('${grave.id}')">
                <i class="fas fa-directions me-1"></i>Directions
              </button>
            </div>
          </div>
        </div>
      `;

      const marker = L.marker([grave.latitude, grave.longitude], {
        icon: this.getGraveIcon(grave),
        title: grave.deceased_name
      });

      marker.bindPopup(popupContent, {
        maxWidth: 320,
        className: 'grave-popup-container'
      });

      marker.on('click', () => {
        this.selectedGrave = grave;
        this.highlightGrave(grave.id);
      });

      marker.addTo(this.map);
      this.markers.push(marker);
    });
  }

  getGraveIcon(grave) {
    const hasPhoto = grave.primary_photo ? true : false;
    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="marker-pin grave-pin ${hasPhoto ? 'has-photo' : ''}">
          ${hasPhoto ? 
            `<img src="${grave.primary_photo}" class="marker-thumbnail">` :
            `<i class="fas fa-cross"></i>`
          }
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    });
  }

  async getDirections(graveId) {
    try {
      const response = await fetch(`/api/graves/${graveId}`);
      const grave = await response.json();

      if (!grave.latitude || !grave.longitude) {
        this.showError('No GPS coordinates available for this grave');
        return;
      }

      const destination = [grave.latitude, grave.longitude];

      // Get user location
      if (!this.currentLocation) {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          this.currentLocation = [pos.coords.latitude, pos.coords.longitude];
        } catch (error) {
          // If user location not available, use map center
          this.currentLocation = this.map.getCenter();
        }
      }

      // Remove existing routing control
      if (this.routingControl) {
        this.map.removeControl(this.routingControl);
      }

      // Create routing control
      this.routingControl = L.Routing.control({
        waypoints: [
          L.latLng(this.currentLocation[0], this.currentLocation[1]),
          L.latLng(destination[0], destination[1])
        ],
        routeWhileDragging: true,
        lineOptions: {
          styles: [{ color: '#2c3e7a', weight: 4 }]
        },
        createMarker: function(i, waypoint, n) {
          if (i === 0) {
            return L.marker(waypoint.latLng, {
              icon: L.divIcon({
                className: 'custom-div-icon',
                html: '<div class="marker-pin start-pin"><i class="fas fa-play"></i></div>',
                iconSize: [30, 30],
                iconAnchor: [15, 30]
              })
            });
          }
          if (i === n - 1) {
            return L.marker(waypoint.latLng, {
              icon: L.divIcon({
                className: 'custom-div-icon',
                html: '<div class="marker-pin end-pin"><i class="fas fa-flag-checkered"></i></div>',
                iconSize: [30, 30],
                iconAnchor: [15, 30]
              })
            });
          }
        },
        showAlternatives: true,
        altLineOptions: {
          styles: [{ color: '#6c757d', weight: 2, opacity: 0.6 }]
        }
      });

      this.routingControl.addTo(this.map);

      // Log directions request
      await fetch('/api/directions/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          graveId: graveId,
          startLat: this.currentLocation[0],
          startLng: this.currentLocation[1],
          endLat: destination[0],
          endLng: destination[1]
        })
      });

    } catch (error) {
      console.error('Directions error:', error);
      this.showError('Failed to get directions');
    }
  }

  async viewGrave(graveId) {
    try {
      const response = await fetch(`/api/graves/${graveId}`);
      const grave = await response.json();
      
      this.selectedGrave = grave;
      this.showGraveModal(grave);
      
      if (grave.latitude && grave.longitude) {
        this.map.setView([grave.latitude, grave.longitude], 18);
      }
    } catch (error) {
      console.error('Error loading grave details:', error);
      this.showError('Failed to load grave details');
    }
  }

  showGraveModal(grave) {
    const modal = new bootstrap.Modal(document.getElementById('graveModal'));
    const content = document.getElementById('grave-info-content');

    content.innerHTML = `
      <div class="row">
        <div class="col-md-6">
          <h5 class="text-primary">${grave.deceased_name}</h5>
          <p><strong>Born:</strong> ${grave.birth_date ? new Date(grave.birth_date).toLocaleDateString() : 'Unknown'}</p>
          <p><strong>Died:</strong> ${grave.death_date ? new Date(grave.death_date).toLocaleDateString() : 'Unknown'}</p>
          <p><strong>Age:</strong> ${grave.age_at_death || 'Unknown'}</p>
          <p><strong>Gender:</strong> ${grave.gender || 'Unknown'}</p>
          <p><strong>Nationality:</strong> ${grave.nationality || 'Unknown'}</p>
          <p><strong>Occupation:</strong> ${grave.occupation || 'Unknown'}</p>
          <p><strong>Location:</strong> ${grave.section || ''} ${grave.block || ''} ${grave.plot_number || ''}</p>
          <p><strong>Cemetery:</strong> ${grave.cemetery_name || 'Unknown'}</p>
          ${grave.epitaph ? `<p><strong>Epitaph:</strong> "${grave.epitaph}"</p>` : ''}
          <div class="mt-3">
            <button class="btn btn-success" onclick="window.cemeteryMap.getDirections('${grave.id}')">
              <i class="fas fa-directions me-1"></i>Get Directions
            </button>
            <a href="/graves/${grave.id}" class="btn btn-primary">
              <i class="fas fa-edit me-1"></i>Full Details
            </a>
          </div>
        </div>
        <div class="col-md-6">
          ${grave.primary_photo ? `<img src="${grave.primary_photo}" class="img-fluid rounded mb-3" alt="${grave.deceased_name}">` : ''}
          <div id="grave-photos-container" class="row g-2">
            <!-- Additional photos loaded dynamically -->
          </div>
        </div>
      </div>
    `;

    // Load additional photos
    this.loadGravePhotos(grave.id);

    modal.show();
  }

  async loadGravePhotos(graveId) {
    try {
      const response = await fetch(`/api/graves/${graveId}/photos`);
      const photos = await response.json();
      const container = document.getElementById('grave-photos-container');
      
      if (container && photos.length > 0) {
        container.innerHTML = photos.map(photo => `
          <div class="col-4">
            <img src="${photo.photo_url}" class="img-fluid rounded" alt="${photo.caption || 'Grave photo'}" style="height: 100px; object-fit: cover;">
          </div>
        `).join('');
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  }

  getUserLocation() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentLocation = [position.coords.latitude, position.coords.longitude];
          this.addUserLocationMarker();
        },
        (error) => {
          console.log('User location not available:', error);
        }
      );
    }
  }

  addUserLocationMarker() {
    if (this.userLocationMarker) {
      this.map.removeLayer(this.userLocationMarker);
    }
    
    this.userLocationMarker = L.marker(this.currentLocation, {
      icon: L.divIcon({
        className: 'custom-div-icon',
        html: '<div class="marker-pin user-pin"><i class="fas fa-user"></i></div>',
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      })
    });
    this.userLocationMarker.addTo(this.map);
  }

  highlightGrave(graveId) {
    // Reset all markers
    this.markers.forEach(marker => {
      marker.setIcon(this.getGraveIcon(this.selectedGrave));
    });
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
    } catch (error) {
      console.error('Error searching graves:', error);
    }
  }

  displaySearchResults(graves) {
    const container = document.getElementById('search-results');
    if (!container) return;

    if (!graves || graves.length === 0) {
      container.innerHTML = '<p class="text-muted text-center">No graves found.</p>';
      return;
    }

    let html = '<div class="list-group">';
    graves.forEach(grave => {
      html += `
        <button class="list-group-item list-group-item-action" 
                onclick="window.cemeteryMap.viewGrave('${grave.id}')">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <strong>${grave.deceased_name}</strong>
              <br>
              <small class="text-muted">
                ${grave.birth_date ? new Date(grave.birth_date).toLocaleDateString() : '?'} - 
                ${grave.death_date ? new Date(grave.death_date).toLocaleDateString() : '?'}
              </small>
            </div>
            <span class="badge bg-primary">${grave.cemetery_name || 'Unknown'}</span>
          </div>
        </button>
      `;
    });
    html += '</div>';

    container.innerHTML = html;
  }

  showError(message) {
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-white bg-danger border-0 position-fixed bottom-0 end-0 m-3';
    toast.style.zIndex = '9999';
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    `;
    document.body.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    setTimeout(() => toast.remove(), 5000);
  }
}

// Initialize map
document.addEventListener('DOMContentLoaded', () => {
  window.cemeteryMap = new CemeteryMap();
});