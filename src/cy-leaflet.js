const assign = require('./assign');
const defaults = require('./defaults');

require('leaflet-providers');
const L = require('leaflet');

// prop names, uses leaflet names
const LAT = 'lat';
const LNG = 'lng';

const getNodeLatLng = n => {
  const lat = n.data(LAT);
  const lng = n.data(LNG);

  return L.latLng(lat, lng);
};

class CytoscapeLeaflet {
  constructor(cy, options) {
    this.cy = cy;
    this.options = assign({}, defaults, options);

    this.createMap();
    this.createToggleControl();
    this.configureCy();
    this.addListeners();
    this.onMapViewport(); // set initial node vp state
    this.enablePanMode(); // inital mode is pan
  }

  destroy() {
    this.destroyMap();
    this.destroyToggleControl();
    this.resetCyConfig();
    this.removeListeners();
  }

  createMap() {
    const cy = this.cy;
    const lCtr = this.options.container;

    const map = this.map = L.map(lCtr, {
      zoomControl: false,
      zoomSnap: 0
    }); 

    // fallback init vp state
    map.setView([43.83155486662417, -79.37278747558595], 10);
  
    this.fit();

    // TODO allow configuration
    this.defaultTileLayer = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      attribution: '<a href="https://js.cytoscape.org">Cytoscape</a> | &copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
    }).addTo(map);
  }

  destroyMap() {
    this.map.remove();
  }

  createToggleControl() {
    const container = document.createElement('div');
    const panButton = document.createElement('div');
    const editButton = document.createElement('div');

    container.classList.add('cy-leaflet-toggle');
    panButton.classList.add('cy-leaflet-toggle-button');
    panButton.classList.add('cy-leaflet-toggle-pan');
    editButton.classList.add('cy-leaflet-toggle-button');
    editButton.classList.add('cy-leaflet-toggle-edit');

    container.appendChild(panButton);
    container.appendChild(editButton);

    this.options.container.parentNode.appendChild(container);

    this.toggleContainer = container;
    this.panButton = panButton;
    this.editButton = editButton;
  }

  destroyToggleControl() {
    this.toggleContainer.parentNode.removeChild(this.toggleContainer);
  }

  configureCy() {
    this.orgZoomEnabled = this.cy.zoomingEnabled();
    this.orgPanningEnabled = this.cy.panningEnabled();

    this.cy.zoomingEnabled(false);
    this.cy.panningEnabled(false);

    this.cy.container().style.pointerEvents = 'none';
  }

  resetCyConfig() {
    this.cy.zoomingEnabled(this.orgZoomEnabled);
    this.cy.panningEnabled(this.orgPanningEnabled);

    this.cy.container().style.pointerEvents = '';
  }

  addListeners() {
    this.onViewport = () => {
      const cy = this.cy;

      cy.zoom(1);
      cy.pan({ x: 0, y: 0 });

      cy.nodes().forEach(node => this.setNodePosition(node));
    };

    this.onEnablePan = () => { this.enablePanMode(); };
    
    this.onEnabledEdit = () => { this.enableEditMode(); };

    this.onDrag = (e) => {
      const node = e.target;
      
      this.updateNodeGeo(node);
    };

    this.map.on('zoom', this.onViewport);
    this.map.on('move', this.onViewport);

    this.onViewportStart = () => {
      this.cy.elements().addClass('leaflet-viewport');
    }

    this.onMoveTimeout = null;

    this.onViewportEnd = () => {
      clearTimeout(this.onMoveTimeout);

      this.onMoveTimeout = setTimeout(() => {
        this.cy.elements().removeClass('leaflet-viewport');
      }, 250);
    }

    this.map.on('movestart', this.onViewportStart);
    this.map.on('moveend', this.onViewportEnd);
    this.map.on('zoomstart', this.onViewportStart);
    this.map.on('zoomend', this.onViewportEnd);

    this.panButton.addEventListener('click', this.onEnablePan);
    this.editButton.addEventListener('click', this.onEnabledEdit);

    this.cy.on('drag', this.onDrag);

    this.cy.on('add', this.onAddElement = (event) => {
      const ele = event.target;
  
      if (ele.isNode()) {
        this.setNodePosition(ele);
      }
    });

    window.addEventListener('keyup', this.onToggleShortcut = (event) => {
      switch (event.keyCode) {
      case 17: // control
      //case 93: // meta/apple/command
      //case 16: // shift
        this.toggleMode();
      default:
        break;
      }
    });

    this.cy.container().addEventListener('wheel', this.onWheel = (event) => {
      event.preventDefault();
    });
  }

  removeListeners() {
    this.map.off('zoom', this.onViewport);
    this.map.off('move', this.onViewport);

    this.panButton.removeEventListener('click', this.onEnablePan);
    this.editButton.renmoveEventListener('click', this.onEnabledEdit);

    this.cy.removeListener('drag', this.onDrag);

    this.cy.removeListener('add', this.onAddElement);

    window.renmoveEventListener('keyup', this.onToggleShortcut);

    this.cy.container().removeEventListener('wheel', this.onWheel);
  }

  setNodePosition(node) {
    const latlng = getNodeLatLng(node);
    const pt = this.map.latLngToContainerPoint(latlng);
    const { x, y } = pt;

    node.position({ x, y });
  }

  updateNodeGeo(node) {
    const { x, y } = node.position();
    const pt = L.point(x, y);
    const latlng = this.map.containerPointToLatLng(pt);
    const llObj = {};

    llObj[LAT] = latlng.lat;
    llObj[LNG] = latlng.lng;

    node.data(llObj);
  }

  onMapViewport() {
    const cy = this.cy;
    
    cy.zoom(1);
    cy.pan({ x: 0, y: 0 });

    cy.nodes().forEach(node => this.setNodePosition(node));
  }

  setZoomControlOpacity(opacity) {
    const zoomControl = document.querySelector('.leaflet-control-zoom');
    if (zoomControl) {
      zoomControl.style.opacity = opacity;
    }
  }

  enablePanMode() {
    this.panMode = true;
    this.editMode = false;

    this.panButton.classList.add('cy-leaflet-toggle-active');
    this.editButton.classList.remove('cy-leaflet-toggle-active');

    this.cy.container().style.pointerEvents = 'none';

    this.setZoomControlOpacity("");

    this.map.dragging.enable();
  }

  enableEditMode() {
    this.panMode = false;
    this.editMode = true;

    this.panButton.classList.remove('cy-leaflet-toggle-active');
    this.editButton.classList.add('cy-leaflet-toggle-active');

    this.cy.container().style.pointerEvents = '';

    this.setZoomControlOpacity(0.5);

    this.map.dragging.disable();
  }

  toggleMode() {
    if (this.panMode) {
      this.enableEditMode();
    } else {
      this.enablePanMode();
    }
  }

  fit() {
    const { cy, map } = this;

    if (cy.nodes().nonempty()) {
      const bounds = L.latLngBounds(cy.nodes().map(getNodeLatLng));

      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }
}

module.exports = CytoscapeLeaflet;
