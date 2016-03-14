var MIN_RADIUS = 10;
var MAX_RADIUS = 50;


var map;
var dataByConfigName = {};


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

    // Make sure to resize the map when the window resizes
    window.addEventListener("resize", function (event) {
        map.resize();
    }, false);
}

/**
 * Add bubbles to the D3 DataMap.
 *
 * @param {Array.<Object>} bubbles - An array of the bubbles to add to the map.
 */
function addBubbles(bubbles) {
    map.bubbles(bubbles, {
        popupTemplate: function (geo, data) {
            return '<div class="hoverinfo">' + data.htmlDescription + '</div>';
        }
    });
}


/**
 * Represents a location on the map, generated from JSON data.
 *
 * @constructor
 *
 * @param {Object} jsonData - The JSON data representing this location.
 * @param {Object} config - The configuration for this location.
 */
function Location(jsonData, config) {
    if (!dataByConfigName.hasOwnProperty(config.name)) {
        dataByConfigName[config.name] = {
            filterByValues: [],
            radiusPropMin: Infinity,
            radiusPropMax: -Infinity
        };
    }

    this.config = config;
    this.configData = dataByConfigName[config.name];
    this.data = jsonData;

    this.name = this.data[config.nameProp];

    this.radius = this.data[config.radiusProp] || config.radiusDefault;
    if (this.radius < this.configData.radiusPropMin)
        this.configData.radiusPropMin = this.radius;
    if (this.radius > this.configData.radiusPropMax)
        this.configData.radiusPropMax = this.radius;

    this.filterBy = this.data[config.filterByProp] || config.filterByDefault;
    if (this.configData.filterByValues.indexOf(this.filterBy) == -1)
        this.configData.filterByValues.push(this.filterBy);

    this.coordinates = this.data[config.coordinatesProp] || config.coordinatesDefault;

    this.fillKey = this.data[config.fillKeyProp] || config.fillKeyDefault;
}

/**
 * Computes a scaled radius for the location based on the minimum/maximum of
 * the property being used for the radius. (Assumes that all the locations
 * have already been created, and thus we know the minimum and maximum.)
 *
 * @return {number} A radius between MIN_RADIUS and MAX_RADIUS
 */
Location.prototype.getScaledRadius = function () {
    var me = this.radius,
        min = this.configData.radiusPropMin,
        max = this.configData.radiusPropMax;

    var ratio = (me - min) / (max - min);
    if (isNaN(ratio)) ratio = 0.5;
    return ratio * (MAX_RADIUS - MIN_RADIUS) + MIN_RADIUS;
}

/**
 * Generates an object with this location's data that can be passed to a D3
 * Datamap.
 *
 * @return {Object} The object, ready to be passed to D3 Datamap.
 */
Location.prototype.getD3Object = function () {
    var data = {
        name: this.name,
        htmlDescription: this.config.makeDescription(this.data),
        radius: this.getScaledRadius(),
        fillKey: this.fillKey
    };
    if (this.coordinates) {
        data.latitude = this.coordinates.lat;
        data.longitude = this.coordinates.lng;
    } else {
        console.log("WARNING: No coordinates for:", this.name);
    }
    return data;
};

/**
 * Creates a bunch of Locations based on JSON data and a config and adds them
 * to the map.
 *
 * @param {Array.<Object>} jsonArray - An array of JSON objects representing
 *        locations.
 * @param {Object} config - A config that will be passed to the Location
 *        constructor.
 *
 * @return {Array.<Location>} The array of Location objects that we created
 *         from the JSON data.
 */
function createLocations(jsonArray, config) {
    var locations = jsonArray.map(function (item) {
        return new Location(item, config);
    });

    // Now, add them to the map
    addBubbles(locations.map(function (item) {
        //console.log(item.getD3Object());
        return item.getD3Object();
    }));

    return locations;
}

/**
 * Reads in JSON data from a URL and calls createLocations to add the data to
 * the map.
 *
 * @param {string} jsonURL - The URL to read the JSON data from.
 * @param {Object} config - A configuration that will be passed to the Location
 *        constructor.
 */
function readJSON(jsonURL, config) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", jsonURL, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                // All good!
                // Try to parse the JSON
                var data;
                try {
                    data = JSON.parse(xhr.responseText);
                } catch (err) {
                    console.log(err);
                    alert("Error parsing JSON:\n" + err);
                }
                if (data) {
                    createLocations(data, config);
                }
            } else {
                alert("JSON request failed (status " + xhr.status + ")");
            }
        }
    };
    xhr.send(null);
}
