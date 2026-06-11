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
let activeTypingList = {};
// NEW: Dictionary tracking online users map: [socket.id] -> username
let onlineUsers = {};

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    let sessionUser = "";

    // Send history instantly on connect
    socket.emit('load history', globalMessageHistory);

    // NEW: Listen for when a user successfully enters their name
    socket.on('register user', (username) => {
        sessionUser = username;
        onlineUsers[socket.id] = username;
        // Broadcast the updated online list to everyone
        io.emit('update users', Object.values(onlineUsers));
    });

    // Listens for active typing reports from the frontend
    socket.on('user typing', (data) => {
        if (data.status) {
            activeTypingList[data.user] = true;
        } else {
            delete activeTypingList[data.user];
        }
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
        // Clean up user from typing list if they leave mid-type
        if (sessionUser && activeTypingList[sessionUser]) {
            delete activeTypingList[sessionUser];
            io.emit('display typing', activeTypingList);
        }
        // NEW: Clean up user from online list
        if (onlineUsers[socket.id]) {
            delete onlineUsers[socket.id];
            io.emit('update users', Object.values(onlineUsers));
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Feature-Rich Chat Server running on port ${PORT}`);
});
