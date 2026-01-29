const express = require('express');
const socket = require('socket.io');
const http = require('http');
const { Chess } = require('chess.js');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();

let players = {};  // { white: socketId, black: socketId }
let currentPlayer = "w";

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, "public")));

app.get('/', (req, res) => {
    res.render('index', { title: "Chess game" });
});

io.on("connection", function (uniqueSocket) {
    console.log("Player connected:", uniqueSocket.id);

    // Assign roles on connection:
    if (!players.white) {
        players.white = uniqueSocket.id;
        uniqueSocket.emit("playerRole", "w");
        console.log(`Assigned WHITE to ${uniqueSocket.id}`);
    } else if (!players.black) {
        players.black = uniqueSocket.id;
        uniqueSocket.emit("playerRole", "b");
        console.log(`Assigned BLACK to ${uniqueSocket.id}`);
    } else {
        uniqueSocket.emit("spectatorRole");
        console.log(`Assigned SPECTATOR to ${uniqueSocket.id}`);
    }

    // Handle disconnection:
    uniqueSocket.on("disconnect", () => {
        console.log("Player disconnected:", uniqueSocket.id);
        if (uniqueSocket.id === players.white) {
            delete players.white;
            console.log("White player left");
        } else if (uniqueSocket.id === players.black) {
            delete players.black;
            console.log("Black player left");
        }
    });

    // Handle moves:
    uniqueSocket.on("move", function (move) {
        try {
            if (chess.turn() === "w" && uniqueSocket.id !== players.white) return;
            if (chess.turn() === "b" && uniqueSocket.id !== players.black) return;

            const result = chess.move(move);

            if (result) {
                currentPlayer = chess.turn();
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            } else {
                console.log("Invalid Move:", move);
                uniqueSocket.emit("invalidMove", move);
            }
        } catch (error) {
            console.error("Error processing move:", error);
        }
    });
});

server.listen(5000, function () {
    console.log('The server is running on port 5000');
});
