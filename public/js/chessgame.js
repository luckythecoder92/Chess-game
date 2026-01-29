const socket = io();
const chess = new Chess();

const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";
    
    board.forEach((row, rowindex) => {
        row.forEach((square, squareindex) => {
            const squareElement = document.createElement('div');
            squareElement.classList.add("square",
                (rowindex + squareindex) % 2 === 0 ? "light" : "dark"
            );
            squareElement.dataset.row = rowindex;
            squareElement.dataset.col = squareindex;

            if (square) {
                const pieceElement = document.createElement('div');
                pieceElement.classList.add(
                    "piece",
                    square.color === "w" ? "white" : "black"
                );
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        pieceElement.classList.add("dragging");
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowindex, col: squareindex };
                        e.dataTransfer.setData("text/plain", "");
                    }
                });

                pieceElement.addEventListener("dragend", (e) => {
                    draggedPiece = null;
                    sourceSquare = null;
                    pieceElement.classList.remove("dragging");
                });

                squareElement.appendChild(pieceElement);
            }

            // Add dragover event listener (CRITICAL - was missing)
            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col)
                    };
                    handleMove(sourceSquare, targetSquare);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });

    // Flip board if player is black
    if (playerRole === 'b') {
        boardElement.classList.add("flipped");
    } else {
        boardElement.classList.remove("flipped");
    }
};

const handleMove = (source, target) => {
    // Convert board coordinates to chess notation
    const from = `${String.fromCharCode(97 + source.col)}${8 - source.row}`;
    const to = `${String.fromCharCode(97 + target.col)}${8 - target.row}`;
    
    const move = {
        from: from,
        to: to,
        promotion: 'q'  // Default promotion to queen
    };
    
    console.log('Attempting move:', move);
    
    // Validate move locally before sending
    const testMove = chess.move(move);
    if (testMove) {
        // Move is valid, undo it and let server handle it
        chess.undo();
        socket.emit("move", move);
    } else {
        console.log('Invalid move attempted');
    }
};

const getPieceUnicode = (piece) => {
    const unicodePieces = {
        'wK': "♔",  // White King
        'wQ': "♕",  // White Queen
        'wR': "♖",  // White Rook
        'wB': "♗",  // White Bishop
        'wN': "♘",  // White Knight
        'wP': "♙",  // White Pawn
        'bK': "♚",  // Black King
        'bQ': "♛",  // Black Queen
        'bR': "♜",  // Black Rook
        'bB': "♝",  // Black Bishop
        'bN': "♞",  // Black Knight
        'bP': "♟"   // Black Pawn
    };
    
    // Create key from color and type
    const key = piece.color + piece.type.toUpperCase();
    return unicodePieces[key] || "";
};

// Socket event listeners
socket.on("playerRole", (role) => {
    console.log('Player role assigned:', role);
    playerRole = role;
    renderBoard();
});

socket.on("spectatorRole", function() {
    console.log("Spectator role enabled");
    playerRole = null;
    renderBoard();
});

socket.on("boardState", function(fen) {
    console.log('Board state received:', fen);
    chess.load(fen);
    renderBoard();
});

socket.on("move", (move) => {
    console.log('Move received:', move);
    const result = chess.move(move);
    if (result) {
        renderBoard();
    } else {
        console.error('Invalid move received from server:', move);
    }
});

// Handle connection events
socket.on("connect", () => {
    console.log("Connected to server");
});

socket.on("disconnect", () => {
    console.log("Disconnected from server");
});

// Handle errors
socket.on("error", (error) => {
    console.error("Socket error:", error);
});

socket.on("invalidMove", (data) => {
    console.log("Invalid move:", data);
    // Optionally show user feedback
});

// Initial render
renderBoard();