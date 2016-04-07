var SOCIAL_MEDIA_CONFIG = {
    // "name" identifies this config, and must be unique
    name: "Social Media",

    // which property to use for the name
    nameProp: "name",

    // which properties to allow the user to filter by
    filterProps: ["media"],
    // the default value for the filter by properties
    filterDefaults: ["unknown"],
    // titles for the properties we're filtering by
    filterTitles: ["Media"],

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

    /*
    fills: {
        defaultFill: "#FFF",
        facebook: "#00F",
        twitter: "#0F0",
        website: "#F00"
    },
    */

    fills: [
        "facebook", "twitter", "website",
        "google maps",
        "blog",
        "newssite",
        "wordpress.com",
        "down",
        "unknown",
        "map"
    ],


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
            desc += '<p><a href="' + escapeHTML(data.url) + '" target="_blank">' + escapeHTML(data.url) + '</a></p>';
        }

        return desc;
    },


    makeLink: function (data) {
        if (data.url) {
            return data.url;
        }
    }
};
