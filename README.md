# starlite
function getUrlJSON(url) {
  getJSON(url, function(err, data) {
    if (err !== null) {
      console.log('Something went wrong: ' + err);
    } else {
    var l = 0, t = [];
      while (l<data.feed.entry.length) {
        if (data.feed.entry[l].content.$t != "") {
          t.push(data.feed.entry[l].content.$t.split(", ")); 
        }
        l++;
      }
      l = 0;
      while (l<t.length) {
        var q = 0;
          while (q<t[l].length) {
            t[l][q] = t[l][q].split(": ");
            q++;
          }
        l++;
      }
      console.log(t);
    }
  });
}
var getJSON = function(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'json';
    xhr.onload = function() {
      var status = xhr.status;
      if (status === 200) {
        callback(null, xhr.response);
      } else {
        callback(status, xhr.response);
      }
    };
    xhr.send();
};
getUrlJSON('https://spreadsheets.google.com/feeds/list/1jtE4qOR4AF0MFWkJ17iwdnMsHBV-ZNq0A-ODYe2zh4M/1/public/basic?alt=json');e
