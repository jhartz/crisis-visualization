// hey world

var DEFAULT_MEMBERS = 500;

var MIN_RADIUS = 10;
var MAX_RADIUS = 50;

var minMembers = Infinity,
    maxMembers = -Infinity;

function Location(jsonData) {
    this.name = jsonData.name || "unnamed";
    this.enName = jsonData.en_name || "unnamed";
    this.date = new Date(jsonData.date);

    this.members = jsonData.members || DEFAULT_MEMBERS;
    if (this.members < minMembers) minMembers = this.members;
    if (this.members > maxMembers) maxMembers = this.members;
    
    this.media = jsonData.media || "";
    this.location = jsonData.location || {};

    this.status = jsonData.status || "unknown";
    this.languages = jsonData.lang || [];
    this.url = jsonData.url || "";

    this.country = jsonData.country || "";
    this.coverage = jsonData.coverage || "";
}

Location.prototype.getDescription = function () {
    return this.name + ((this.enName && this.enName != this.name) ? ("\n" + this.enName) : "");
};

Location.prototype.getScaledRadius = function () {
    // Assume that all the locations have already been read in,
    // and thus minMembers and maxMembers have been set appropriately
    var ratio = (this.members - minMembers) / (maxMembers - minMembers);
    return ratio * (MAX_RADIUS - MIN_RADIUS) + MIN_RADIUS;
}

Location.prototype.getD3Object = function () {
    return {
        name: this.name,
        radius: this.getScaledRadius(),
        fillKey: this.media,
        latitude: this.location.lat,
        longitude: this.location.lng,
        date: this.date,
        significance: this.getDescription()
    };
};

function createLocations(jsonArray) {
    var locations = jsonArray.map(function (item) {
        return new Location(item);
    });
    // Now, add them to the map
    addBubbles(locations.map(function (item) {
        return item.getD3Object();
    }));
}

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