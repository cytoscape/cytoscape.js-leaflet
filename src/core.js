const CytoscapeLeaflet = require('./cy-leaflet');

const coreImpl = function(options) {
  const cy = this;

  return new CytoscapeLeaflet(cy, options);
};

module.exports = coreImpl;
