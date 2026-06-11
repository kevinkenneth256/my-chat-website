const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Configure server connection to accept large media objects up to 50MB
const io = new Server(server, {
    maxHttpBufferSize: 5e7 
});

let globalMessageHistory = [];
// Keeps a dictionary list of all currently typing users
let activeTypingList = {};

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    // Keep track of the username associated with this specific connection slot
    let sessionUser = "";

    socket.emit('load history', globalMessageHistory);

    // Listens for active typing reports from the frontend
    socket.on('user typing', (data) => {
        sessionUser = data.user;
        if (data.status) {
            activeTypingList[data.user] = true;
        } else {
            delete activeTypingList[data.user];
        }
        // Broadcast the active list layout to everyone
        io.emit('display typing', activeTypingList);
    });

    socket.on('chat message', (data) => {
        globalMessageHistory.push(data);
        if (globalMessageHistory.length > 30) {
            globalMessageHistory.shift();
        }
        io.emit('chat message', data);
    });

    socket.on('disconnect', () => {
        // If a user disconnects mid-sentence, clean them up out of the typing array
        if (sessionUser && activeTypingList[sessionUser]) {
            delete activeTypingList[sessionUser];
            io.emit('display typing', activeTypingList);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Typing Tracker Chat Server running on port ${PORT}`);
});
