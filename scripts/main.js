window.addEventListener("load", function (event) {
    // Initialize the D3 DataMap
    map.initMap(SOCIAL_MEDIA_CONFIG);

    // Read the social media data
    readJSON("data/social.json", function (data) {
        // Add the locations to the map
        map.createLocations(data, SOCIAL_MEDIA_CONFIG);
    });

    // Also read the refugee camp locations and put them on the map
    readJSON("data/syriancamps.json", function (data) {
        var camps = [];
        if (data.features) {
            for (var i = 0; i < data.features.length; i++) {
                camps.push({
                    name: data.features[i].properties.Name,
                    latitude: data.features[i].geometry.coordinates[0],
                    longitude: data.features[i].geometry.coordinates[1]
                });
            }
        }

        // Add the camps to the map
        map.addPoints(camps);
    });
}, false);




