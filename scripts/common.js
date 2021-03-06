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
 * Make an HTML table from some name/value data.
 *
 * @param {Array.<Array>} fields - An array where each item is an array whose
 *        first item is the name and second is the value. If the value is
 *        falsy, that item is skipped.
 *
 * @return {string} The HTML representing the table.
 */
function makeHTMLTable(fields) {
    var html = '<table><tbody>';
    for (var i = 0; i < fields.length; i++) {
        if (fields[i][1]) {
            html += '<tr><th>' + escapeHTML(fields[i][0]) + '</th>';
            html += '<td>' + escapeHTML(fields[i][1]) + '</td></tr>';
        }
    }
    html += '</tbody></table>';
    return html;
}

/**
 * Return whether something is truthy. (Useful for array filtering.)
 */
function exists(i) {
    return !!i;
}

/**
 * Read in JSON data from a URL.
 *
 * @param {string} jsonURL - The URL to read the JSON data from.
 * @param {Function} callback - A function to call when the data has been read.
 */
function readJSON(jsonURL, callback) {
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
                    callback(data);
                }
            } else {
                alert("JSON request failed (status " + xhr.status + ")");
            }
        }
    };
    xhr.send(null);
}


