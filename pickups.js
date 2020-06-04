const API_KEY = "<insert giphy api key>";
const TAG = "party hard";
const RATING = "R";
const PERIOD_IN_MILLISECONDS = 5000;
const URL = "https://api.giphy.com/v1/gifs/random?api_key=" + API_KEY + "&tag=" + TAG + "&rating=" + RATING;

function updateBackground(gifUrl) {
  var backgroundImage = "url(\"" + gifUrl + "\")";
  $("div.bg").css("background-image", backgroundImage);
}

function myPeriodicMethod() {
  $.ajax({
    url: URL,
    success: function(data) {
      updateBackground(data.data.images.downsized_large.url);
    },
    complete: function() {
      // schedule the next request *only* when the current one is complete:
      setTimeout(myPeriodicMethod, PERIOD_IN_MILLISECONDS);
    }
  });
}

// schedule the first invocation:
setTimeout(myPeriodicMethod, 1000);