const express = require('express');
const app = express();
const uuid = require('node-uuid');
const uuidValidator = new RegExp('^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');

const crypto = require('crypto');
var http = require('http').Server(app);
var io = require('socket.io')(http);

const SPOTIFY_CLIENT_ID = "";
const SPOTIFY_SCOPES = [
    "user-read-playback-state",
    "user-read-playback-position",
    "user-modify-playback-state"
]
const REDIRECT_URI = "localhost:3000";

rooms = {};

spotifyUserHandles = {};

socketsToHandlersMap = {};



// Endpoints setup
app.use(express.static('assets'));
app.get('/authorize', function(req,res) {

    // First step of Spotify authorization

    let state = uuid.v4();

    var spotifyApi = new SpotifyWebApi({
        redirectUri: redirectUri,
        clientId: clientId
    });

    // Store spotify API handler for this user
    spotifyUserHandles[uuid] = spotifyApi;

    var authorizeURL = spotifyApi.createAuthorizeURL(SPOTIFY_SCOPES, state);

    res.redirect(authorizeURL);

});

app.get('/', function(req, res) {
    
    if (typeof(req.query.code) == "string") {
        res.set("code", req.query.code);
    }

    if (typeof(req.query.error) == "string") {
        res.set("error", req.query.error);
    }

    if (typeof(req.query.state) == "string") {
        res.set("state", req.query.state);
    }

    res.sendFile(__dirname + '/pickups.html');

});


// Socket.io callbacks
io.on('connection', function(socket){

	console.log('a user connected');

    console.log(socket.handshake);
    
    socket.on('spotify', function (data) {

        let individualSpotifyApiHandler;

        if (typeof(data.code) == "undefined") {
            console.error("Recieved 'spotify' message without authorization code");
            return;
        } 
        
        if (uuidValidator.test(data.state)) {

            if (data.state in spotifyUserHandles) {

                individualSpotifyApiHandler = spotifyUserHandles[data.state];

                socketsToHandlersMap[socket.id] = data.state;

            } else {

                console.warn("Spotify handler UUID unknown");
                return;

            }

        } else {
            console.warn("Bad spotify handler UUID");
            return;
        }

        // Retrieve an access token and a refresh token
        individualSpotifyApiHandler.authorizationCodeGrant(code).then(
            function(data) {

                console.log('The token expires in ' + data.body['expires_in']);
                console.log('The access token is ' + data.body['access_token']);
                console.log('The refresh token is ' + data.body['refresh_token']);
            
                // Set the access token on the API object to use it in later calls
                individualSpotifyApiHandler.setAccessToken(data.body['access_token']);
                individualSpotifyApiHandler.setRefreshToken(data.body['refresh_token']);

            },
            function(err) {
                
                console.error('Something went wrong while conneceting to spotify!', err);
                
            }
        );


    });

    socket.on('room_create', function () {

        let roomCode = crypto.randomBytes(4).toString('hex');

        rooms[roomCode] = {
            creator : socket.handshake.usercode
        };

        socket.join(roomCode);

        console.log( socket.id + " created room " + roomCode );

        socket.handshake.currentRoom = roomCode;

        io.sockets.connected[socket.id].emit('room_entered', { room: roomCode, creator: true });

    });

    socket.on('room_enter', function (roomCode) {

        if (roomCode in rooms) {

            socket.join(roomCode);

            io.sockets.connected[socket.id].emit('room_entered', { room: roomCode, creator: false });

        } else {

            io.sockets.connected[socket.id].emit('room_not_found');

        }

    });

	socket.on('disconnect', function(){

        console.log('a user disconnected');
        
        console.log(socket.rooms);
        
        // forEach( room => {

        //     if (room.id in rooms) {
                
        //         if (io.sockets.adapter.rooms[room.id].length == 0) {
        //             // Remove local data of room if last user in room disconnected
        //             delete rooms[room.id];
        //         }

        //     }
        // });

    });
    
    socket.on('bg_update', function(data) {

        const url = data.url;

        const roomInfo = rooms[socket.handshake.currentRoom];

        if (typeof(roomInfo) == "undefined") {
            console.log("bad room info");
            return;
        }

        if (roomInfo.creator == socket.handshake.usercode) {

            console.log("bg_update emmited to " + socket.handshake.currentRoom);

            io.in(socket.handshake.currentRoom)
              .emit('bg_update', url);

        } else {
            console.log("bg_update failed - User is not creator")
        }

    })

});

http.listen(3000, function(){

    console.log('listening on *:3000');
    
});
