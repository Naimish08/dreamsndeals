const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Admin credentials
const adminCredentials = {
    username: 'nisp',
    password: 'DND'
};

// Scoreboard data
let teams = [
    { name: 'Team A', points: 10 },
    { name: 'Team B', points: 20 },
    { name: 'Team C', points: 15 },
    { name: 'Team D', points: 25 }
];

// Admin login route
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === adminCredentials.username && password === adminCredentials.password) {
        res.status(200).send('Login successful');
    } else {
        res.status(401).send('Invalid credentials');
    }
});

// Route to get current teams data
app.get('/teams', (req, res) => {
    res.json(teams);
});

// Route to add points
app.post('/admin/add-points', (req, res) => {
    const { team, points } = req.body;
    const teamToUpdate = teams.find(t => t.name === team);

    if (teamToUpdate && typeof points === 'number') {
        teamToUpdate.points += points;
        io.emit('scoreUpdate', teams); // Emit updated scores to all clients
        res.status(200).send('Points added successfully');
    } else {
        res.status(400).send('Invalid team or points');
    }
});

// Socket.io setup for real-time updates
io.on('connection', (socket) => {
    console.log('A user connected');
    socket.emit('scoreUpdate', teams); // Send initial scores to client

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
