const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// SQLite Database setup
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
    } else {
        console.log("Connected to SQLite database.");
        // Create the teams table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE,
            points INTEGER DEFAULT 0
        )`, (err) => {
            if (err) {
                console.error("Error creating teams table:", err.message);
            } else {
                console.log("Teams table created or already exists.");
            }
        });
    }
});

// Admin credentials
const adminCredentials = {
    username: 'nisp',
    password: 'DND'
};

// Admin login route
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === adminCredentials.username && password === adminCredentials.password) {
        res.status(200).send('Login successful');
    } else {
        res.status(401).send('Invalid credentials');
    }
});

// Route to get current teams data from the database
app.get('/teams', (req, res) => {
    db.all(`SELECT name, points FROM teams`, (err, rows) => {
        if (err) {
            console.error("Error retrieving teams:", err.message);
            res.status(500).send("Error retrieving teams");
        } else {
            res.json(rows);
        }
    });
});

// Route to get data after updating points to confirm
app.get('/team/:name', (req, res) => {
    const teamName = req.params.name;
    db.get(`SELECT name, points FROM teams WHERE name = ?`, [teamName], (err, row) => {
        if (err) {
            console.error("Error retrieving team data:", err.message);
            res.status(500).send("Error retrieving team data");
        } else if (!row) {
            res.status(404).send("Team not found");
        } else {
            res.json(row);
        }
    });
});

// Route to add points to a team
app.post('/admin/add-points', (req, res) => {
    const { team, points } = req.body;

    if (typeof points !== 'number') {
        return res.status(400).send('Points must be a number');
    }

    // Update points for the specified team
    db.run(`UPDATE teams SET points = points + ? WHERE name = ?`, [points, team], function (err) {
        if (err) {
            console.error("Error updating points:", err.message);
            res.status(500).send('Error updating points');
        } else if (this.changes === 0) {
            res.status(404).send('Team not found');
        } else {
            // Emit the updated scores to all clients
            db.all(`SELECT name, points FROM teams`, (err, rows) => {
                if (!err) {
                    io.emit('scoreUpdate', rows); // Emit updated scores to all clients
                }
            });
            res.status(200).send('Points added successfully');
        }
    });
});

// Route to add a new team
app.post('/admin/add-team', (req, res) => {
    const { name, points } = req.body;
    db.run(`INSERT INTO teams (name, points) VALUES (?, ?)`, [name, points || 0], function (err) {
        if (err) {
            console.error("Error adding team:", err.message);
            res.status(500).send('Error adding team');
        } else {
            res.status(201).send('Team added successfully');
        }
    });
});

// Socket.io setup for real-time updates
io.on('connection', (socket) => {
    console.log('A user connected');
    db.all(`SELECT name, points FROM teams`, (err, rows) => {
        if (!err) {
            socket.emit('scoreUpdate', rows); // Send initial scores to client
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
