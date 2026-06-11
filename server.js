const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve the index.html file when someone visits the website
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Manage real-time communication connections
io.on('connection', (socket) => {
    console.log('A user connected to the chat.');

    // Listen for a message from a user
    socket.on('chat message', (data) => {
        // Broadcast the message to everyone connected
        io.emit('chat message', data);
    });

    // Handle user disconnects
    socket.on('disconnect', () => {
        console.log('A user disconnected.');
    });
});

// Start the application on port 3000
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Chat application running at http://localhost:${PORT}`);
});
