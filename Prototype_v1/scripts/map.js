var MIN_RADIUS = 10;
var MAX_RADIUS = 50;

/**
 * @typedef {Object} Configuration
 * @description An object representing the configuration for a view that
 *              contains what is being represented.
 *
 * @property {string} name - The name of the config (must be unique).
 *
 * @property {string} nameProp - The name of the property on the data that
 *           contains the name of the individual property.
 *
 * @property {Array.<string>} filterProps - A list of properties on the data
 *           that the user should be allowed to filter by.
 * @property {Array.<string>} [filterDefaults] - Default values for any of
 *           the properties in filterProps that don't have a value.
 *
 * @property {string} radiusProp - The property on the data that should be used
 *           to compute the radius.
 * @property {number} [radiusDefault] - Default value for radiusProp.
 *
 * @property {string} coordinatesProp - The property on the data that contains
 *           the coordinates.
 * @property {Object} [coordinatesDefault] - Default value for coordinatesProp.
 *
 * @property {string} fillKeyProp - The property on the data that contains the
 *           value used for the fill key.
 * @property (string} [fillKeyDefault] - Default value for fillKeyProp.
 *
 * @property {Function} makeDescription - A function that is passed in the data
 *           and returns an HTML description of the location.
 */


// The D3 DataMap
var map;

// Internal data stored by configuration name
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
 * @param {Array.<Location>} locations - An array of the locations to add to
 *        the map as bubbles;
 */
function addBubbles(locations) {
    map.bubbles(locations.map(function (item) {
        return item.getD3Object();
    }), {
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
 * @param {Configuration} config
 */
function Location(jsonData, config) {
    if (!dataByConfigName.hasOwnProperty(config.name)) {
        dataByConfigName[config.name] = {
            filterValuesByPropIndex: [],
            filterEnabledByPropIndex: [],
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

    this.filterIndexByPropIndex = [];
    var prop, defaultValue, values, valuesEnabled;
    for (var i = 0; i < config.filterProps.length; i++) {
        prop = config.filterProps[i];
        defaultValue = config.filterDefaults[i];
        if (!this.configData.filterValuesByPropIndex[i]) {
            this.configData.filterValuesByPropIndex[i] = [];
            this.configData.filterEnabledByPropIndex[i] = [];
        }
        values = this.configData.filterValuesByPropIndex[i];
        valuesEnabled = this.configData.filterEnabledByPropIndex[i];

        var filterItem = this.data[prop] || defaultValue;
        if (values.indexOf(filterItem) == -1) {
            values.push(filterItem);
            valuesEnabled.push(true);
        }
        this.filterIndexByPropIndex[i] = values.indexOf(filterItem);
    }

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
 * Clear the filtering area.
 */
function clearFiltering() {
    document.getElementById("filter-container").innerHTML = "";
}

/**
 * Add bubbles after filtering.
 *
 * @param {Array.<Location>} locations - An array of Location objects
 *        representing the locations on the map.
 * @param {Configuration} config
 */
function filterAndAddBubbles(locations, config) {
    var configData = dataByConfigName[config.name];
    addBubbles(locations.filter(function (loc) {
        var foundDisabled = false;
        for (var i = 0; i < config.filterProps.length; i++) {
            // See if we're disabled for this one
            if (!configData.filterEnabledByPropIndex[i][loc.filterIndexByPropIndex[i]]) {
                foundDisabled = true;
                break;
            }
        }
        return !foundDisabled;
    }));
}

/**
 * Set up filtering checkboxes for locations on the map.
 *
 * @param {Array.<Location>} locations - An array of Location objects
 *        representing the locations currently on the map.
 * @param {Configuration} config
 */
function initFilteringCheckboxes(locations, config) {
    clearFiltering();
    var configData = dataByConfigName[config.name];

    var ul = document.createElement("ul");
    config.filterProps.forEach(function (prop, index) {
        configData.filterValuesByPropIndex[index].forEach(function (value, valueIndex) {
            function filter(enabled) {
                configData.filterEnabledByPropIndex[index][valueIndex] = enabled;
                filterAndAddBubbles(locations, config);
            }

            var a = document.createElement("a");
            a.setAttribute("href", "#");
            var cbox = document.createElement("input");
            cbox.setAttribute("type", "checkbox");
            cbox.checked = configData.filterEnabledByPropIndex[index];
            a.appendChild(cbox);
            a.appendChild(document.createTextNode(" " + value));
            a.addEventListener("click", function (event) {
                event.preventDefault();
                filter(cbox.checked = !cbox.checked);
            }, false);
            cbox.addEventListener("click", function (event) {
                event.stopPropagation();
                filter(cbox.checked);
            }, false);

            var li = document.createElement("li");
            li.appendChild(a);
            ul.appendChild(li);
        });
    });
    document.getElementById("filter-container").appendChild(ul);
}

/**
 * Set up filtering dropdown for locations on the map.
 * (Better than checkboxes if there are multiple things we can filter by.)
 *
 * @param {Array.<Location>} locations - An array of Location objects
 *        representing the locations currently on the map.
 * @param {Configuration} config
 */
function initFilteringDropdowns(locations, config) {
    clearFiltering();

    // TODO: implement
    // (just doing checkboxes for now.....)
    initFilteringCheckboxes(locations, config);
}

/**
 * Creates a bunch of Locations based on JSON data and a config and adds them
 * to the map.
 *
 * @param {Array.<Object>} jsonArray - An array of JSON objects representing
 *        locations.
 * @param {Configuration} config
 *
 * @return {Array.<Location>} The array of Location objects that we created
 *         from the JSON data.
 */
function createLocations(jsonArray, config) {
    var locations = jsonArray.map(function (item) {
        return new Location(item, config);
    });

    // Finally, set up filtering (based on how many things we're filtering by)
    // and add the bubbles to the map
    switch (config.filterProps.length) {
        case 0:
            clearFiltering();
            addBubbles(locations);
            break;
        case 1:
            initFilteringCheckboxes(locations, config);
            filterAndAddBubbles(locations, config);
            break;
        default:
            initFilteringDropdowns(locations, config);
            filterAndAddBubbles(locations, config);
    }

    return locations;
}

/**
 * Reads in JSON data from a URL and calls createLocations to add the data to
 * the map.
 *
 * @param {string} jsonURL - The URL to read the JSON data from.
 * @param {Configuration} config
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
