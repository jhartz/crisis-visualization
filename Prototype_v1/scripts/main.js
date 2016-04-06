<<<<<<< Updated upstream
window.addEventListener("load", function (event) {
    // Initialize the D3 DataMap
    initMap(SOCIAL_MEDIA_CONFIG);
=======

//MAP  - Specify bubbles, arcs & config in here
var map = new Datamap({
  scope: 'world',
  element: document.getElementById('worldMap'),
  projection: 'mercator',
  height: 500,
  fills: {
    defaultFill: '#FFF',
    facebook: '#00F',
    twitter: '#0F0',
    website: '#F00'
  },
  geographyConfig: {
      borderColor: '#000',
      highlightFillColor: '#333',
      highlightBorderColor: '#666'
  },
  bubblesConfig: {
    borderColor: '#000'
  }
});

var zoom d3.behavior.zoom();
map.call.zoom();
map.on(".zoom", null);

>>>>>>> Stashed changes

    // Read the social media data in ../social.json
    readJSON("../social.json", SOCIAL_MEDIA_CONFIG);
}, false);
