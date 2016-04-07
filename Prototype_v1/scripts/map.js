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
 * @property {Array.<string>} [filterTitles] - Titles for any of the properties
 *           in filterProps.
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
 * @property {Object.<string, string>|Array.<string>} [fills] - Fill keys (and
 *           values, if an object is used) to pass as the `fills` property for
 *           the DataMap constructor. If an array is provided, (or if any
 *           object entry is missing a value), values are generated using
 *           d3.scale.categoryXX() scales.
 *
 * @property {Function} makeDescription - A function that is passed in the data
 *           and returns an HTML description of the location.
 *
 * @property {Function} makeLink - A function that is passed in the data and
 *           returns a URL to go to when the bubble is clicked (if applicable).
 */


// The D3 DataMap
var map;

// Internal data stored by configuration name
var dataByConfigName = {
/*
    "config name": {
        ... see props in initializer at top of Location constructor ...
    },
    ...
*/
};


/**
 * Initialize the D3 DataMap.
 *
 * @param {Configuration} config
 */
function initMap(config) {
    var fills = {
        defaultFill: "#efefef"
    };
    if (config.fills) {
        var keys = Array.isArray(config.fills) ?
                    config.fills : Object.keys(config.fills),
            cat = "category" + (keys.length <= 10 ? "10" : "20"),
            scale = d3.scale[cat]();
        keys.forEach(function (key) {
            fills[key] = config.fills[key] || scale(key);
        });
    }

    //MAP  - Specify bubbles, arcs & config in here
    var container = document.getElementById("worldMap");
    var mapZoom;

    map = new Datamap({
        scope: "world",
        element: container,
        projection: "mercator",
        responsive: true,
        fills: fills,
        geographyConfig: {
            borderColor: "#000",
            highlightFillColor: "#333",
            highlightBorderColor: "#666"
        },
        done: function (map) {
            // Set up zoom
            mapZoom = new Zoom(map, container,
                    document.querySelectorAll(".zoom-button"),
                    document.querySelector("#zoom-info"));

            // Set up onclick
            if (typeof config.makeLink == "function") {
                // TODO: Is there a better way to do this?
                map.svg[0][0].addEventListener("click", function (event) {
                    if (event.target.tagName.toLowerCase() == "circle") {
                        console.log("Item clicked: ", event.target);
                        var data = event.target.__data__;
                        if (data && data.link) {
                            window.open(data.link, "_blank");
                        }
                    }
                }, false);
            }
        }
    });

    // Make sure to resize the map when the window resizes
    window.addEventListener("resize", function (event) {
        map.resize();
    }, false);


    // Set up zoom
    /*
    var zoom = d3.behavior.zoom();
    map.svg.call(zoom.on("zoom", function () {
        var x = d3.event.translate[0];
        var y = d3.event.translate[1];
        map.svg.selectAll("g").style("transform",
                "translate(" + x + "px, " + y + "px) " + 
                "scale(" + (d3.event.scale) + ")");
    }));
    */
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
        // This is the first Location with this Configuration; initialize a
        // data object for it.
        dataByConfigName[config.name] = {
            // Arrays of values, organized by property index
            filterValuesByPropIndex: {
                /* property index: [value, value, value, ...] */
            },

            // Arrays of booleans, where each indicates whether the value in
            // the corresponding array from filterValuesByPropIndex is enabled
            filterEnabledByPropIndex: {
                /* property index: [true, true, false, true, ...] */
            },

            radiusPropMin: Infinity,
            radiusPropMax: -Infinity
        };
    }

    this.config = config;
    this.configData = dataByConfigName[config.name];
    this.data = jsonData;

    this.name = this.data[config.nameProp];
    this.coordinates = this.data[config.coordinatesProp] || config.coordinatesDefault;
    this.fillKey = this.data[config.fillKeyProp] || config.fillKeyDefault;

    this.radius = this.data[config.radiusProp] || config.radiusDefault;
    if (this.radius < this.configData.radiusPropMin)
        this.configData.radiusPropMin = this.radius;
    if (this.radius > this.configData.radiusPropMax)
        this.configData.radiusPropMax = this.radius;

    // For each property in config.filterProps with index i, this object
    // contains a property where the key is i and the value is the index in
    // configData.filterValuesByPropIndex[i] that is our value for the property
    this.filterIndexByPropIndex = {};
    var prop, defaultValue, values, valuesEnabled;
    for (var i = 0; i < config.filterProps.length; i++) {
        // The property that we're filtering by
        prop = config.filterProps[i];
        // The default value, in case we don't have a value for this property
        defaultValue = config.filterDefaults[i];
        // Check if this property index is in configData.filterValuesByPropIndex
        // (it won't be if this is the first Location we're creating with this
        // Configuration)
        if (!this.configData.filterValuesByPropIndex[i]) {
            this.configData.filterValuesByPropIndex[i] = [];
            this.configData.filterEnabledByPropIndex[i] = [];
        }
        // The array of possible values for this property
        values = this.configData.filterValuesByPropIndex[i];
        // The array of whether each value is enabled
        valuesEnabled = this.configData.filterEnabledByPropIndex[i];

        // Get our value for this property
        var filterItem = this.data[prop] || defaultValue;
        // Add our value to the array of possible values if it ain't there
        if (values.indexOf(filterItem) == -1) {
            values.push(filterItem);
            valuesEnabled.push(true);
        }
        // For this property, store which index our value is
        this.filterIndexByPropIndex[i] = values.indexOf(filterItem);
    }
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
    var makeLink = this.config.makeLink;
    var data = {
        name: this.name,
        htmlDescription: this.config.makeDescription(this.data),
        link: typeof makeLink == "function" ? makeLink(this.data) : null,
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
        // Create a label for this property
        var li = document.createElement("li"),
            label = document.createElement("label"),
            cbox = document.createElement("input");
        // Hidden checkbox for spacing
        cbox.setAttribute("type", "checkbox");
        cbox.style.visibility = "hidden";
        label.appendChild(cbox);
        var title = (config.filterTitles && config.filterTitles[index]) || prop;
        label.appendChild(document.createTextNode(title + ": "));
        li.appendChild(label);
        ul.appendChild(li);

        // These arrays are the same length, corresponding to the number of
        // values for thi property
        var filterValues = configData.filterValuesByPropIndex[index];
        var filterValuesEnabled = configData.filterEnabledByPropIndex[index];
        // Create checkboxes for each value of this property
        filterValues.forEach(function (value, valueIndex) {
            // This function is called whenever the checkbox is changed
            function filter(enabled) {
                filterValuesEnabled[valueIndex] = enabled;
                filterAndAddBubbles(locations, config);
            }

            var a = document.createElement("a");
            a.setAttribute("href", "#");
            var cbox = document.createElement("input");
            cbox.setAttribute("type", "checkbox");
            cbox.checked = filterValuesEnabled[valueIndex];
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
