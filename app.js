express = require('express');
app = express();


crypto = require('crypto');
var http = require('http').Server(app);
var io = require('socket.io')(http);

rooms = {};

// Endpoints setup
app.use(express.static('assets'));
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/pickups.html');
});

// Socket.io callbacks
io.on('connection', function(socket){
	console.log('a user connected');

	console.log(socket.handshake);

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
