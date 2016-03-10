//MAP  - Specify bubbles, arcs & config in here
var map = new Datamap({
  scope: 'world',
  element: document.getElementById('worldMap'),
  projection: 'mercator',
  height: 500,
  fills: {
    defaultFill: '#FFF',
    Facebook: '#00F',
    Twitter: '#0AF'
  },
  geographyConfig: {
      borderColor: '#000',
      highlightFillColor: '#333',
      highlightBorderColor: '#666'
  }
});

function addBubbles(bubbles){
  map.bubbles(bubbles, {
    popupTemplate: function(geo, data){
      return '<div class="hoverinfo">'+data.name+''
    }
  });
}