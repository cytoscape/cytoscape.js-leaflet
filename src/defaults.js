module.exports = {
  container: undefined, // the container in which the map is put
  latitude: node => node.data('lat'), // get latitude field, lat is leaflet convention
  longitude: node => node.data('lng') // get longitude field, lng is leaflet convention
};