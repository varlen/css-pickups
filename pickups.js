const API_KEY = "9VOjI3WZVEclNIrSl6pLNpG592wAVH6G";
let TAG = "daft punk";
const RATING = "R";
const PERIOD_IN_MILLISECONDS = 5000;
let URL = "https://api.giphy.com/v1/gifs/random?api_key=" + API_KEY + "&tag=" + TAG + "&rating=" + RATING;

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

function updateTag() {
  TAG = $('.tag-input-container input')[0].value;
  URL = "https://api.giphy.com/v1/gifs/random?api_key=" + API_KEY + "&tag=" + TAG + "&rating=" + RATING;
  console.log(TAG);
}

// schedule the first invocation:
setTimeout(myPeriodicMethod, 1000);