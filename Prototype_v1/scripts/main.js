       //MAP  - Specify bubbles, arcs & config in here
      var map = new Datamap({
        scope: 'world',
        element: document.getElementById('worldMap'),
        projection: 'mercator',
        height: 500,
        fills: {
          defaultFill: '#FFF',
        },
        geographyConfig: {
            borderColor: '#000',
            highlightFillColor: '#333',
            highlightBorderColor: '#666'
        }
      });