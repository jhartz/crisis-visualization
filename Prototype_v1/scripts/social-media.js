var SOCIAL_MEDIA_CONFIG = {
    // "name" identifies this config, and must be unique
    name: "Social Media",

    // which property to use for the name
    nameProp: "name",

    // which properties to allow the user to filter by
    filterProps: ["media"],
    // the default value for the filter by properties
    filterDefaults: ["unknown"],

    // which property to use for the radius
    radiusProp: "members",
    // the default value if the property above is falsy
    radiusDefault: 500,

    // the property with the coordinates
    coordinatesProp: "coordinates",
    // the default value if no coordinates exist
    coordinatesDefault: {},

    // the property to use for the fill key
    fillKeyProp: "media",
    // the default value for the fill key
    fillKeyDefault: "",

    // a function that is passed the data for a location and should return an HTML description
    makeDescription: function (data) {
        var desc = '';
        desc += '<b>' + escapeHTML(data.name) + '</b><br>';
        if (data.enName && data.enName != data.name) {
            desc += escapeHTML(data.enName) + '<br>';
        }
        if (data.description) {
            desc += '<i>' + escapeHTML(data.description) + '</i><br>';
        }

        var date = new Date(data.date);
        desc += makeHTMLTable([
            // ["Label", value if truthy]
            ["English Name", data.enName],
            ["Location", [data.location, data.country].filter(exists).join(", ")],
            ["Status", data.status],
            ["Date", date.getTime() && date.toDateString()],
            ["Languages", data.lang.filter(exists).join(", ")],
            ["Media", data.media],
            ["Members", data.members]
        ]);

        if (data.url) {
            desc += '<p><a href="' + escapeHTML(data.url) + '" target="_blank">Link</a></p>';
        }

        return desc;
    }
};
