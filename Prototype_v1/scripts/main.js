//MAP  - Specify bubbles, arcs & config in here
var map = new Datamap({
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


// Read the local data in ../social.json
window.addEventListener("load", function (event) {
    readJSON("../social.json");
}, false);

window.addEventListener("resize", function (event) {
    map.resize();
}, false);
