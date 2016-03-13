var map;

/**
 * Initialize the D3 DataMap.
 */
function initMap() {
    //MAP  - Specify bubbles, arcs & config in here
    map = new Datamap({
        scope: "world",
        element: document.getElementById("worldMap"),
        projection: "mercator",
        responsive: true,
        fills: {
            defaultFill: "#FFF",
            facebook: "#00F",
            twitter: "#0F0",
            website: "#F00"
        },
        geographyConfig: {
            borderColor: "#000",
            highlightFillColor: "#333",
            highlightBorderColor: "#666"
        }
    });
}

/**
 * Add bubbles to the D3 DataMap.
 *
 * @param {Array.<Object>} bubbles - An array of the bubbles to add to the map.
 */
function addBubbles(bubbles) {
    map.bubbles(bubbles, {
        popupTemplate: function (geo, data) {
            return (
                '<div class="hoverinfo">' +
                data.name.replace(/\n/g, '<br>') +
                '</div>'
            );
        }
    });
}


window.addEventListener("load", function (event) {
    // Initialize the D3 DataMap
    initMap();

    // Make sure to resize the map when the window resizes
    window.addEventListener("resize", function (event) {
        map.resize();
    }, false);

    // Read the local data in ../social.json
    readJSON("../social.json");
}, false);
