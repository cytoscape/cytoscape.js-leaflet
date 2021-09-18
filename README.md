cytoscape-leaf
================================================================================

[![DOI](https://zenodo.org/badge/405766955.svg)](https://zenodo.org/badge/latestdoi/405766955)

## Description

A Cytoscape.js extension for integrating [Leaflet.js](https://leafletjs.com) ([demo](https://cytoscape.github.io/cytoscape.js-leaflet)).  The Cytoscape graph is displayed overtop a map, and the node positions are set automatically based on geographic coordinates.

## Dependencies

 * Cytoscape.js 3.x, >= 3.2.0
 * Leaflet.js 1.x, >= 1.7.1
 * Leaflet providers 1.x, >= 1.12.0


## Usage instructions

**Note that, aside from the ordinary JS imports, you must include `leaflet.css` and `cytoscape-leaf.css` in order for the map to display properly.**

Download the library:
 * via npm: `npm install cytoscape-leaf`,
 * via direct download in the repository (probably from a tag).

Import the library as appropriate for your project:

ES import:

```js
import cytoscape from 'cytoscape';
import leaflet from 'cytoscape-leaf';

cytoscape.use( leaflet );
```

CommonJS require:

```js
let cytoscape = require('cytoscape');
let leaflet = require('cytoscape-leaf');

cytoscape.use( leaflet ); // register extension
```

AMD:

```js
require(['cytoscape', 'cytoscape-leaf'], function( cytoscape, leaflet ){
  leaflet( cytoscape ); // register extension
});
```

Plain HTML/JS has the extension registered for you automatically, because no `require()` is needed.

## API

### Node positions

Because node positions should correspond to consistent geographic coordinates on the map, the `position` of each node is ignored in each element JSON object.  Instead, the position is automatically set based on the `lat` and `lng` within the node's `data`, e.g.:

```js
const someNodeJson = {
  position: {}, // ignored
  data: { id: 'foo', lat: 43.662402, lng: -79.388910 }
};
```

Node positions are automatically updated when the viewport is modified (i.e. via zoom and/or pan) to correspond to their specified geographic coordinates.

If you want to use use custom fields for geographic coordinates, you can set `options.latitude` and `options.longitude` accordingly.

### Instance creation

To create an instance of the extension, call `cy.leaflet(options)`.  The following options are supported:

```js
const options = {
  // the container in which the map should live, should be a sibling of the cytoscape container
  container: document.getElementById('cy-leaflet'),

  // a getter function for the node's longitude value, uses `lat` by default
  latitude: node => node.data('lat'),

  // a getter function for the node's longitude value, uses `lng` by default
  longitude: node => node.data('lng')
};

const leaf = cy.leaflet(options);
```

The Leaflet `map` instance can be accessed via `leaf.map`.  The ordinary [Leaflet Map API](https://leafletjs.com/reference-1.7.1.html) may be used on the `map` instance.  Additionally, the `L` static Leaflet API can be accessed via `leaf.L` -- though you may alternatively `import L` as normal.

### Interaction mode

The graph map has an interaction mode.  It can either be in pan mode or edit mode.  

When in pan mode, the user can zoom and pan about the map -- changing the viewport.  In pan mode, graph elements are non-interactive.  When the user manipulates the viewport in pan mode, the `leaflet-viewport` is applied to the elements.  This can be used to create a peek feature:  When the user is panning and zooming, the elements are faded out so that the user can see the street names underneath the elements.

When in edit mode, the user is unable to zoom or pan -- the viewport is static.  In edit mode, graph elements are interactive (e.g. edges can be clicked and nodes can be dragged).  The mode is toggled for the user when he or she presses the control (CTRL) key.

- `leaf.enablePanMode()` : Enables pan mode, disables edit mode
- `leaf.enableEditMode()` : Enabled edit mode, disables pan mode

### Other

- `leaf.fit()` : Fit the map to the nodes
- `leaf.defaultTileLayer` : The default tile layer (which can be removed via `leaf.map.removeLayer(leaf.defaultTileLayer)`)
- `leaf.destroy()` : Destroys the map

## Build targets

* `npm run test` : Run Mocha tests in `./test`
* `npm run build` : Build `./src/**` into `cytoscape-leaf.js`
* `npm run watch` : Automatically build on changes with live reloading (N.b. you must already have an HTTP server running)
* `npm run dev` : Automatically build on changes with live reloading with webpack dev server
* `npm run lint` : Run eslint on the source

N.b. all builds use babel, so modern ES features can be used in the `src`.


## Publishing instructions

This project is set up to automatically be published to npm and bower.  To publish:

1. Build the extension : `npm run build:release`
1. Commit the build : `git commit -am "Build for release"`
1. Bump the version number and tag: `npm version major|minor|patch`
1. Push to origin: `git push && git push --tags`
1. Publish to npm: `npm publish .`
1. [Make a new release](https://github.com/cytoscape/cytoscape.js-leadlet/releases/new) for Zenodo.
