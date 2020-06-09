const API_KEY = "9VOjI3WZVEclNIrSl6pLNpG592wAVH6G";
let TAG = "infinite";
const RATING = "R";
const PERIOD_IN_MILLISECONDS = 5000;
let URL = "https://api.giphy.com/v1/gifs/random?api_key=" + API_KEY + "&tag=" + TAG + "&rating=" + RATING;

let btnCreateRoom = document.getElementById("btn-create-room");
let btnJoinRoom = document.getElementById("btn-join-room");
let txtRoomCode = document.getElementById("txt-room-code");
let lblStatus = document.getElementById("lbl-status");

const room = {
  connected : false,
  code : "",
  creator: false
};

function updateBackground(gifUrl) {
  var backgroundImage = "url(\"" + gifUrl + "\")";
  $("div.bg").css("background-image", backgroundImage);
}

function myPeriodicMethod() {

  $.ajax({
    url: URL,
    success: function(data) {
      
      if (room.connected && room.creator) {
        socket.emit('bg_update', {
          url: data.data.images.downsized_large.url 
        });
        console.log("Emmited bg_update")
      } else {
        console.log("Not creator and not connected")
      }

      //updateBackground(data.data.images.downsized_large.url);

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
}

// schedule the first invocation:
setTimeout(myPeriodicMethod, 1000);

/*
 Rooms
*/

function createRoom() {
  if (!room.connected)
    socket.emit('room_create');
}

function joinRoom() {
  if (!room.connected)
    socket.emit('room_enter', txtRoomCode.value);
}

socket.on('connect', function (){
  
  btnCreateRoom = document.getElementById("btn-create-room");
  btnJoinRoom = document.getElementById("btn-join-room");
  txtRoomCode = document.getElementById("txt-room-code");
  lblStatus = document.getElementById("lbl-status");

  btnCreateRoom.removeAttribute("disabled");
  btnJoinRoom.removeAttribute("disabled");
  txtRoomCode.removeAttribute("disabled");

  btnCreateRoom.addEventListener("click", function (evt) {
    createRoom();
  });
  
  btnJoinRoom.addEventListener("click", function (evt) {
    joinRoom();
  })

  const urlParams = new URLSearchParams(window.location.search);

  const error = urlParams.get('error');
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const description = urlParams.get('description');

  if (!error) {
    if (code != null && state != null) {
      socket.emit('spotify', {
        code : code,
        state : state
      });
    } else {
      console.log("No errors and bad code/state")
    }
  } else {
    if (!!description) {
      console.error(description);
    }
  }

});

socket.on('bg_update', function (data) {

  console.log("bg_update recieved", data);

  updateBackground(data);

});

socket.on('room_entered', function (data) {
  btnCreateRoom.setAttribute("disabled", "true");
  btnJoinRoom.setAttribute("disabled", "true");
  txtRoomCode.value = data.room;
  room.code = data.room;
  room.creator = data.creator;
  room.connected = true;
});



