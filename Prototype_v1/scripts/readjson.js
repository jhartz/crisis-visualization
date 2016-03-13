var DEFAULT_MEMBERS = 500;

var MIN_RADIUS = 10;
var MAX_RADIUS = 50;

var minMembers = Infinity,
    maxMembers = -Infinity;

/**
 * Escapes text so it can be used as HTML.
 *
 * @param {string} text - The text to escape.
 * @param {boolean} [convertNewlines=false] - Whether to convert newlines to
 *        HTML br tags.
 * @return {string} The text with HTML special characters removed.
 */
function escapeHTML(text, convertNewlines) {
    var escaped = String(text).replace(/&/g, "&amp;")
                              .replace(/</g, "&lt;")
                              .replace(/>/g, "&gt;")
                              .replace(/"/g, "&quot;");
    if (convertNewlines) escaped = escaped.replace(/\n/g, "<br>");
    return escaped;
}

/**
 * Represents a location on the map, generated from JSON data.
 *
 * @constructor
 *
 * @param {Object} jsonData - The JSON data representing this location.
 */
function Location(jsonData) {
    this.name = jsonData.name || "";
    this.enName = jsonData.en_name || "";
    this.date = new Date(jsonData.date);
    this.coordinates = jsonData.coordinates || null;

    this.members = jsonData.members || (this.isDefaultMembers = true, DEFAULT_MEMBERS);
    if (this.members < minMembers) minMembers = this.members;
    if (this.members > maxMembers) maxMembers = this.members;

    this.description = jsonData.description || "";
    this.media = jsonData.media || "";
    this.location = jsonData.location || "";
    this.country = jsonData.country || "";

    this.status = jsonData.status || "unknown";
    this.languages = jsonData.lang || [];
    this.url = jsonData.url || "";
}

/**
 * Generates an HTML description for the location.
 *
 * @return {string} The generated description.
 */
Location.prototype.getDescription = function () {
    var desc = '';
    desc += '<b>' + escapeHTML(this.name) + '</b><br>';
    if (this.enName && this.enName != this.name) {
        desc += escapeHTML(this.enName) + '<br>';
    }
    if (this.description) {
        desc += '<i>' + escapeHTML(this.description) + '</i><br>';
    }

    var fields = [
        // ["Label", value if truthy]
        ["English Name", this.enName],
        ["Location", [this.location, this.country].filter(function (i) { return !!i; }).join(", ")],
        ["Status", this.status],
        ["Date", this.date.getTime() && this.date.toDateString()],
        ["Languages", this.languages.join(", ")],
        ["Media", this.media],
        ["Members", !this.isDefaultMembers && this.members]
    ];
    desc += '<table><tbody>';
    for (var i = 0; i < fields.length; i++) {
        if (fields[i][1]) {
            desc += '<tr><th>' + escapeHTML(fields[i][0]) + '</th>';
            desc += '<td>' + escapeHTML(fields[i][1]) + '</td></tr>';
        }
    }
    desc += '</tbody></table>';

    if (this.url) {
        desc += '<p><a href="' + escapeHTML(this.url) + '" target="_blank">Link</a></p>';
    }

    return desc;
};

/**
 * Computes a scaled radius for the location based on the minimum/maximum
 * number of members. (Assumes that all the locations have already been created,
 * and thus minMembers and maxMembers have been set appropriately.)
 *
 * @return {number} A radius between MIN_RADIUS and MAX_RADIUS
 */
Location.prototype.getScaledRadius = function () {
    var ratio = (this.members - minMembers) / (maxMembers - minMembers);
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
        htmlDescription: this.getDescription(),
        radius: this.getScaledRadius(),
        fillKey: this.media,
        date: this.date
    };
    if (this.coordinates) {
        data.latitude = this.coordinates.lat;
        data.longitude = this.coordinates.lng;
    } else {
        console.log("WARNING: Using country:", this.country);
        data.country = this.country;
    }
    return data;
};

/**
 * Creates a bunch of Locations based on JSON data and adds them to the map.
 *
 * @param {Array.<Object>} jsonArray - An array of JSON objects representing
 *        locations.
 *
 * @return {Array.<Location>} The array of Location objects that we created
 *         from the JSON data.
 */
function createLocations(jsonArray) {
    var locations = jsonArray.map(function (item) {
        return new Location(item);
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
 */
function readJSON(jsonURL) {
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
                    createLocations(data);
                }
            } else {
                alert("JSON request failed (status " + xhr.status + ")");
            }
        }
    };
    xhr.send(null);
}
