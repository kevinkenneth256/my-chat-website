const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Configure server connection to accept large media objects up to 50MB
const io = new Server(server, {
    maxHttpBufferSize: 5e7 
});

// The central array storing your shared text and media messages
let globalMessageHistory = [];

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('A user joined the conversation.');

    // INSTANTLY send all saved past messages and media to the user who just connected
    socket.emit('load history', globalMessageHistory);

    socket.on('chat message', (data) => {
        // Save the raw text or base64 media asset into history
        globalMessageHistory.push(data);
        
        // Limit history to the last 30 entries to preserve free tier server memory
        if (globalMessageHistory.length > 30) {
            globalMessageHistory.shift();
        }

        // Broadcast the live update out to all open sessions
        io.emit('chat message', data);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected.');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Unified Media Chat Server running on port ${PORT}`);
});
