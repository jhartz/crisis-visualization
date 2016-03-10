//MAP  - Specify bubbles, arcs & config in here
var map = new Datamap({
  scope: 'world',
  element: document.getElementById('worldMap'),
  projection: 'mercator',
  height: 500,
  fills: {
    defaultFill: '#FFF',
    Facebook: '#00F'
  },
  geographyConfig: {
      borderColor: '#000',
      highlightFillColor: '#333',
      highlightBorderColor: '#666'
  }
});

map.bubbles([{
        name: 'Test 1',
        radius: 50,
        fillKey: 'Facebook',
        latitude: 11.415,
        longitude: 105.1619,
    }], {
      popupTemplate: function(geo, data) {
        return '<div class="hoverinfo">'+data.name+''
      }
    });