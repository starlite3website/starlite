# starlite
<iframe src="" id="database" width="500" height="500"></iframe>
<script>
  var embed = document.getElementById("database");
  var s = [];
  function update(range, value) {
    embed.src="https://script.google.com/a/macros/gilbertschools.net/s/AKfycbwp4cBG-osQbiGUbuhq8nBrDyLUryqlP1IhZfxr6HqjWt67NbPb/exec?type=2&range="+range+"&value="+value;
  }
  function get(one, two) {
    getUrlJSON("https://spreadsheets.google.com/feeds/list/1bCZMrjfLvQbQ8C6LIqQMNjJ-Hofn9l5BbeRogBGjBjU/1/public/basic?alt=json");
    setTimeout(function() {console.log(s[one][0][two]);}, 1000);
  }
  function getUrlJSON(url) {
    getJSON(url, after); 
  }
  function after(err, data) {
    if (err !== null) {
      console.log('Something went wrong: ' + err);
    } else {
    var l = 0;
      while (l<data.feed.entry.length) {
        if (data.feed.entry[l].content.$t != "") {
          s.push(data.feed.entry[l].content.$t.split(", ")); 
        }
          l++;
        }
        l = 0;
        while (l<s.length) {
          var q = 0;
            while (q<s[l].length) {
              s[l][q] = s[l][q].split(": ");
              q++;
            }
          l++;
        }
      }
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
</script>
