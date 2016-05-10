window.addEventListener("load", function (event) {
    // Initialize the D3 DataMap
    initMap(SOCIAL_MEDIA_CONFIG);

    // Read the social media data
    readJSON("data/social.json", SOCIAL_MEDIA_CONFIG);
}, false);
