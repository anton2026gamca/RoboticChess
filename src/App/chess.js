/**
 * Main Chess class containing all chess game logic
 * Handles board state, move generation, game rules, and position evaluation
 */
export default class Chess {
    /**
     * Piece type constants for representing different chess pieces
     * Uses numeric values for efficient storage and comparison
     */
    static Piece = class {
        /** Empty square */
        static NONE = 0;          
        /** White pawn */
        static WHITE_PAWN = 1;    
        /** White rook */
        static WHITE_ROOK = 2;    
        /** White knight */
        static WHITE_KNIGHT = 3;  
        /** White bishop */
        static WHITE_BISHOP = 4;  
        /** White queen */
        static WHITE_QUEEN = 5;   
        /** White king */
        static WHITE_KING = 6;    
        /** Black pawn */
        static BLACK_PAWN = 7;    
        /** Black rook */
        static BLACK_ROOK = 8;    
        /** Black knight */
        static BLACK_KNIGHT = 9;  
        /** Black bishop */
        static BLACK_BISHOP = 10; 
        /** Black queen */
        static BLACK_QUEEN = 11;  
        /** Black king */
        static BLACK_KING = 12;   
    };

    /**
     * Represents a chess move from one square to another
     * Uses algebraic notation (e.g., "E2" to "E4")
     */
    static Move = class {
        /**
         * Create a new chess move
         * @param {string} from The starting square (e.g., "E2")
         * @param {string} to The destination square (e.g., "E4")
         * @param {number|null} promotion The promotion piece (Chess.Piece.WHITE_QUEEN, etc.) for pawn promotion moves
         */
        constructor(from, to, promotion = null) {
            /** Starting square (e.g., "E2") */
            this.from = from; 
            /** Destination square (e.g., "E4") */
            this.to = to;     
            /** Promotion piece (Chess.Piece.WHITE_QUEEN, etc.) for pawn promotion moves */
            this.promotion = promotion; 
        }
    };

    /**
     * Get the display name of a piece for UI purposes
     * @param {number} piece The piece type constant
     * @returns {string} Human-readable name of the piece
     */
    static getPieceName(piece) {
        switch (piece) {
            case Chess.Piece.WHITE_PAWN:
            case Chess.Piece.BLACK_PAWN:
                return "Pawn";
            case Chess.Piece.WHITE_ROOK:
            case Chess.Piece.BLACK_ROOK:
                return "Rook";
            case Chess.Piece.WHITE_KNIGHT:
            case Chess.Piece.BLACK_KNIGHT:
                return "Knight";
            case Chess.Piece.WHITE_BISHOP:
            case Chess.Piece.BLACK_BISHOP:
                return "Bishop";
            case Chess.Piece.WHITE_QUEEN:
            case Chess.Piece.BLACK_QUEEN:
                return "Queen";
            case Chess.Piece.WHITE_KING:
            case Chess.Piece.BLACK_KING:
                return "King";
            default:
                return "Unknown";
        }
    }

    /**
     * Get the FEN character representation of a piece
     * @param {number} piece The piece type constant
     * @returns {string} FEN character for the piece
     */
    static getPieceFEN(piece) {
        switch (piece) {
            case Chess.Piece.WHITE_PAWN: return "P";
            case Chess.Piece.WHITE_ROOK: return "R";
            case Chess.Piece.WHITE_KNIGHT: return "N";
            case Chess.Piece.WHITE_BISHOP: return "B";
            case Chess.Piece.WHITE_QUEEN: return "Q";
            case Chess.Piece.WHITE_KING: return "K";
            case Chess.Piece.BLACK_PAWN: return "p";
            case Chess.Piece.BLACK_ROOK: return "r";
            case Chess.Piece.BLACK_KNIGHT: return "n";
            case Chess.Piece.BLACK_BISHOP: return "b";
            case Chess.Piece.BLACK_QUEEN: return "q";
            case Chess.Piece.BLACK_KING: return "k";
            default: return "";
        }
    }

    /**
     * Get all available promotion pieces for a given color
     * @param {boolean} isWhite True for white pieces, false for black
     * @returns {Array<number>} Array of piece constants for promotion
     */
    static getPromotionPieces(isWhite) {
        return isWhite ? 
            [Chess.Piece.WHITE_QUEEN, Chess.Piece.WHITE_ROOK, Chess.Piece.WHITE_BISHOP, Chess.Piece.WHITE_KNIGHT] :
            [Chess.Piece.BLACK_QUEEN, Chess.Piece.BLACK_ROOK, Chess.Piece.BLACK_BISHOP, Chess.Piece.BLACK_KNIGHT];
    }

    /** Pre-computed coordinate conversion arrays for performance optimization */
    static _files = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    /** Pre-computed rank conversion array for performance optimization */
    static _ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    
    /**
     * Convert board coordinates to algebraic notation
     * @param {number} r Row index (0-7)
     * @param {number} c Column index (0-7)
     * @returns {string} Square in algebraic notation (e.g., "E4")
     */
    static coordsToSquare(r, c) {
        return Chess._files[c] + Chess._ranks[r];
    }
    
    /**
     * Convert algebraic notation to board coordinates
     * @param {string} square Square in algebraic notation (e.g., "E4")
     * @returns {Object} Object with r (row) and c (column) properties
     */
    static squareToCoords(square) {
        return {
            r: 8 - parseInt(square[1]),
            c: square.charCodeAt(0) - 65 // 'A'.charCodeAt(0)
        };
    }

    /**
     * Chess board class that handles the game state and board operations
     * Manages piece positions, game rules, move validation, and position evaluation
     */
    static Board = class {
        /** Standard starting position in FEN notation */
        static DefaultFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

        /**
         * Initialize a new chess board
         * @param {string} fen FEN string representing the board position (optional)
         */
        constructor(fen = Chess.Board.DefaultFEN) {
            // Pre-allocate board array more efficiently
            /** 8x8 board array containing piece constants */
            this.board = new Array(8);
            for (let i = 0; i < 8; i++) {
                this.board[i] = new Array(8);
            }
            
            // Initialize caches
            /** Cache for generated moves to avoid recalculation */
            this._movesCache = { fen: null, moves: null };
            /** Cache for king positions for performance */
            this._kingPositions = { white: null, black: null };
            
            this.loadFEN(fen);
        }
    
        /**
         * Load a chess position from FEN (Forsyth-Edwards Notation)
         * FEN format: pieces activeColor castling enPassant halfmove fullmove
         * @param {string} fen The FEN string to load
         * @example
         * // Load starting position
         * board.loadFEN("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
         */
        loadFEN(fen) {
            // Parse the FEN string into its components
            const parts = fen.split(' ');
            const [piecePlacement, activeColor, castling, enPassant] = parts;
            
            // Set whose turn it is to move
            /** Boolean indicating if it's white's turn to move */
            this.whiteToPlay = activeColor === 'w';
            
            // Use bitwise operations for castling rights (more efficient)
            /** Castling rights using bitwise flags: 1=K, 2=Q, 4=k, 8=q */
            this.castlingRights = 0;
            if (castling.includes('K')) this.castlingRights |= 1;  // White king-side
            if (castling.includes('Q')) this.castlingRights |= 2;  // White queen-side  
            if (castling.includes('k')) this.castlingRights |= 4;  // Black king-side
            if (castling.includes('q')) this.castlingRights |= 8;  // Black queen-side
            
            // Set en passant target square (if any)
            /** En passant target square in algebraic notation, or null if none */
            this.enPassant = (enPassant === '-') ? null : enPassant;
            
            // Set move counters
            /** Number of half-moves since last pawn move or capture (for 50-move rule) */
            this.halfmove = parseInt(parts[4]) || 0;
            /** Current full-move number (increments after black's move) */
            this.fullmove = parseInt(parts[5]) || 1;
    
            // Clear board efficiently
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    this.board[r][c] = Chess.Piece.NONE;
                }
            }
            
            // Parse piece placement with optimized lookup
            const pieceMap = {
                'P': Chess.Piece.WHITE_PAWN, 'N': Chess.Piece.WHITE_KNIGHT, 'B': Chess.Piece.WHITE_BISHOP,
                'R': Chess.Piece.WHITE_ROOK, 'Q': Chess.Piece.WHITE_QUEEN, 'K': Chess.Piece.WHITE_KING,
                'p': Chess.Piece.BLACK_PAWN, 'n': Chess.Piece.BLACK_KNIGHT, 'b': Chess.Piece.BLACK_BISHOP,
                'r': Chess.Piece.BLACK_ROOK, 'q': Chess.Piece.BLACK_QUEEN, 'k': Chess.Piece.BLACK_KING
            };
            
            const rows = piecePlacement.split('/');
            for (let r = 0; r < 8; r++) {
                let c = 0;
                for (let i = 0; i < rows[r].length && c < 8; i++) {
                    const ch = rows[r][i];
                    const num = parseInt(ch);
                    if (!isNaN(num)) {
                        c += num; // Skip empty squares
                    } else {
                        this.board[r][c] = pieceMap[ch] || Chess.Piece.NONE;
                        c++;
                    }
                }
            }
            
            // Update king positions cache
            this._updateKingPositions();
            
            // Initialize position history for threefold repetition tracking
            /** Array of position hashes for detecting threefold repetition */
            if (!this.positionHistory) this.positionHistory = [];
            this.positionHistory.push(this._getPositionHash());
        }

        /**
         * Helper method to update king positions cache for performance optimization
         * @private
         */
        _updateKingPositions() {
            this._kingPositions.white = null;
            this._kingPositions.black = null;
            
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const piece = this.board[r][c];
                    if (piece === Chess.Piece.WHITE_KING) {
                        this._kingPositions.white = { r, c };
                    } else if (piece === Chess.Piece.BLACK_KING) {
                        this._kingPositions.black = { r, c };
                    }
                }
            }
        }

        /**
         * Generate FEN (Forsyth-Edwards Notation) string from current board position
         * @returns {string} Complete FEN string representing the current position
         */
        getFEN() {
            // Build piece placement string
            let fen = "";
            for (let r = 0; r < 8; r++) {
                let empty = 0; // Count consecutive empty squares
                for (let c = 0; c < 8; c++) {
                    const piece = this.board[r][c];
                    let ch = "";
                    // Convert piece constants to FEN characters
                    switch (piece) {
                        case Chess.Piece.WHITE_PAWN: ch = "P"; break;
                        case Chess.Piece.WHITE_ROOK: ch = "R"; break;
                        case Chess.Piece.WHITE_KNIGHT: ch = "N"; break;
                        case Chess.Piece.WHITE_BISHOP: ch = "B"; break;
                        case Chess.Piece.WHITE_QUEEN: ch = "Q"; break;
                        case Chess.Piece.WHITE_KING: ch = "K"; break;
                        case Chess.Piece.BLACK_PAWN: ch = "p"; break;
                        case Chess.Piece.BLACK_ROOK: ch = "r"; break;
                        case Chess.Piece.BLACK_KNIGHT: ch = "n"; break;
                        case Chess.Piece.BLACK_BISHOP: ch = "b"; break;
                        case Chess.Piece.BLACK_QUEEN: ch = "q"; break;
                        case Chess.Piece.BLACK_KING: ch = "k"; break;
                        default: ch = "";
                    }
                    if (ch === "") {
                        empty++; // Count empty squares
                    } else {
                        if (empty > 0) {
                            fen += empty; // Add empty square count
                            empty = 0;
                        }
                        fen += ch; // Add piece character
                    }
                }
                if (empty > 0) fen += empty; // Add remaining empty squares
                if (r < 7) fen += "/"; // Add rank separator
            }

            // Add active color (whose turn it is)
            fen += " " + (this.whiteToPlay ? "w" : "b");

            // Add castling rights
            let castling = "";
            if (this.castlingRights & 1) castling += "K";  // White king-side
            if (this.castlingRights & 2) castling += "Q";  // White queen-side
            if (this.castlingRights & 4) castling += "k";  // Black king-side
            if (this.castlingRights & 8) castling += "q";  // Black queen-side
            fen += " " + (castling === "" ? "-" : castling);

            // Add en passant target square
            fen += " " + (this.enPassant ? this.enPassant.toLowerCase() : "-");

            // Add halfmove clock (moves since last pawn move or capture)
            fen += " " + (this.halfmove || 0);

            // Add fullmove number
            fen += " " + (this.fullmove || 1);

            return fen;
        }
    
        /**
         * Place a piece on a specific square
         * @param {number} piece The piece type to place
         * @param {string} square Square in algebraic notation (e.g., "E4")
         */
        setPiece(piece, square) {
            if (!square) return;
            const coords = Chess.squareToCoords(square);
            if (coords.r >= 0 && coords.r < 8 && coords.c >= 0 && coords.c < 8) {
                this.board[coords.r][coords.c] = piece;
                // Update king position cache if needed
                if (piece === Chess.Piece.WHITE_KING) {
                    this._kingPositions.white = coords;
                } else if (piece === Chess.Piece.BLACK_KING) {
                    this._kingPositions.black = coords;
                }
            }
        }
    
        /**
         * Get the piece on a specific square
         * @param {string} square Square in algebraic notation (e.g., "E4")
         * @returns {number} The piece type on that square, or NONE if empty/invalid
         */
        getPiece(square) {
            if (!square) return Chess.Piece.NONE;
            const coords = Chess.squareToCoords(square);
            if (coords.r >= 0 && coords.r < 8 && coords.c >= 0 && coords.c < 8) {
                return this.board[coords.r][coords.c];
            }
            return Chess.Piece.NONE;
        }

        /**
         * Make a move using a Move object
         * @param {Chess.Move} move The move to make
         * @param {boolean} check_legal Whether to validate move legality (Used for internal reasons)
         * @returns {Object} Result object containing:
         *   - {boolean} over - Whether the game is over
         *   - {string|null} [reason] - Reason for game over
         *   - {string|null} [winner] - Winner of the game
         *   - {boolean} requireSync - Whether UI needs to be synchronized for special moves
         */
        makeMove(move, check_legal = true) {
            // Check if game is already over
            const initialGameOverState = this.isGameOver();
            if (initialGameOverState.over) {
                return { 
                    ...initialGameOverState, 
                    requireSync: false
                };
            }

            // Validate move legality if requested
            if (check_legal) {
                const legalMoves = this.getMoves();
                const isLegal = legalMoves.some(m => m.from.toLowerCase() === move.from.toLowerCase() && m.to.toLowerCase() === move.to.toLowerCase());
                if (!isLegal) {
                    return { 
                        over: true,
                        reason: "illegal move",
                        winner: this.whiteToPlay ? "black" : "white",
                        requireSync: false
                    };
                }
            }

            let requireSync = false; // Flag for special moves that need UI sync

            // Get pieces involved in the move
            const fromPiece = this.getPiece(move.from);
            const toPiece = this.getPiece(move.to);

            // Save current castling rights for move history
            const oldCastlingRights = this.castlingRights;

            // Initialize move history if needed
            if (!this.moveHistory) this.moveHistory = [];

            // Handle castling moves
            let castlingMove = false;
            if (fromPiece === Chess.Piece.WHITE_KING && move.from === "E1") {
                if (move.to === "G1" && (this.castlingRights & 1)) {
                    // White king-side castling
                    this.setPiece(Chess.Piece.WHITE_KING, "G1");
                    this.setPiece(Chess.Piece.NONE, "E1");
                    this.setPiece(Chess.Piece.WHITE_ROOK, "F1");
                    this.setPiece(Chess.Piece.NONE, "H1");
                    castlingMove = true;
                } else if (move.to === "C1" && (this.castlingRights & 2)) {
                    // White queen-side castling
                    this.setPiece(Chess.Piece.WHITE_KING, "C1");
                    this.setPiece(Chess.Piece.NONE, "E1");
                    this.setPiece(Chess.Piece.WHITE_ROOK, "D1");
                    this.setPiece(Chess.Piece.NONE, "A1");
                    castlingMove = true;
                }
                // King move removes all castling rights for that side
                this.castlingRights &= ~3; // Clear bits 0 and 1
            } else if (fromPiece === Chess.Piece.BLACK_KING && move.from === "E8") {
                if (move.to === "G8" && (this.castlingRights & 4)) {
                    // Black king-side castling
                    this.setPiece(Chess.Piece.BLACK_KING, "G8");
                    this.setPiece(Chess.Piece.NONE, "E8");
                    this.setPiece(Chess.Piece.BLACK_ROOK, "F8");
                    this.setPiece(Chess.Piece.NONE, "H8");
                    castlingMove = true;
                } else if (move.to === "C8" && (this.castlingRights & 8)) {
                    // Black queen-side castling
                    this.setPiece(Chess.Piece.BLACK_KING, "C8");
                    this.setPiece(Chess.Piece.NONE, "E8");
                    this.setPiece(Chess.Piece.BLACK_ROOK, "D8");
                    this.setPiece(Chess.Piece.NONE, "A8");
                    castlingMove = true;
                }
                // King move removes all castling rights for that side
                this.castlingRights &= ~12; // Clear bits 2 and 3
            }

            // Update castling rights when rooks move or are captured
            if (fromPiece === Chess.Piece.WHITE_ROOK && move.from === "A1") this.castlingRights &= ~2;
            if (fromPiece === Chess.Piece.WHITE_ROOK && move.from === "H1") this.castlingRights &= ~1;
            if (fromPiece === Chess.Piece.BLACK_ROOK && move.from === "A8") this.castlingRights &= ~8;
            if (fromPiece === Chess.Piece.BLACK_ROOK && move.from === "H8") this.castlingRights &= ~4;
            if (move.to === "A1" && toPiece === Chess.Piece.WHITE_ROOK) this.castlingRights &= ~2;
            if (move.to === "H1" && toPiece === Chess.Piece.WHITE_ROOK) this.castlingRights &= ~1;
            if (move.to === "A8" && toPiece === Chess.Piece.BLACK_ROOK) this.castlingRights &= ~8;
            if (move.to === "H8" && toPiece === Chess.Piece.BLACK_ROOK) this.castlingRights &= ~4;

            // Handle en passant captures and pawn double moves
            let enPassantCapture = false;
            let prevEnPassant = this.enPassant;
            this.enPassant = null; // Reset en passant target
            
            if (fromPiece === Chess.Piece.WHITE_PAWN) {
                // Check for pawn double move (creates en passant target)
                if (move.from[1] === "2" && move.to[1] === "4") {
                    this.enPassant = move.from[0] + "3";
                }
                // Check for en passant capture
                if (move.to === prevEnPassant && move.from[0] !== move.to[0]) {
                    const capSq = move.to[0] + (parseInt(move.to[1]) - 1);
                    this.setPiece(Chess.Piece.NONE, capSq);
                    enPassantCapture = true;
                }
            }
            if (fromPiece === Chess.Piece.BLACK_PAWN) {
                // Check for pawn double move (creates en passant target)
                if (move.from[1] === "7" && move.to[1] === "5") {
                    this.enPassant = move.from[0] + "6";
                }
                // Check for en passant capture
                if (move.to === prevEnPassant && move.from[0] !== move.to[0]) {
                    const capSq = move.to[0] + (parseInt(move.to[1]) + 1);
                    this.setPiece(Chess.Piece.NONE, capSq);
                    enPassantCapture = true;
                }
            }

            // Handle pawn promotion
            let promotion = null;
            if (fromPiece === Chess.Piece.WHITE_PAWN && move.to[1] === "8") {
                promotion = move.promotion || Chess.Piece.WHITE_QUEEN;
            } else if (fromPiece === Chess.Piece.BLACK_PAWN && move.to[1] === "1") {
                promotion = move.promotion || Chess.Piece.BLACK_QUEEN;
            }

            // Mark special moves that require UI synchronization
            if (castlingMove || enPassantCapture || promotion) {
                requireSync = true;
            }

            // Execute the actual piece movement (unless it's castling, already handled)
            if (!castlingMove) {
                if (promotion) {
                    this.setPiece(promotion, move.to);
                    this.setPiece(Chess.Piece.NONE, move.from);
                } else {
                    this.setPiece(fromPiece, move.to);
                    this.setPiece(Chess.Piece.NONE, move.from);
                }
            }
            
            // Record the move in history for undo functionality
            this.moveHistory.push({
                move: new Chess.Move(move.from, move.to),
                fromPiece: fromPiece,
                toPiece: toPiece,
                castlingMove,
                enPassantCapture,
                prevEnPassant,
                castlingRights: oldCastlingRights,
                halfmove: this.halfmove,
                fullmove: this.fullmove,
                promotion: promotion
            });

            // Update halfmove clock (50-move rule counter)
            if (
                fromPiece === Chess.Piece.WHITE_PAWN ||
                fromPiece === Chess.Piece.BLACK_PAWN ||
                (toPiece !== Chess.Piece.NONE) ||
                enPassantCapture
            ) {
                this.halfmove = 0; // Reset on pawn move or capture
            } else {
                this.halfmove++; // Increment for other moves
            }

            // Update fullmove counter (increments after black's move)
            if (!this.whiteToPlay) {
                this.fullmove++;
            }

            // Switch turns
            this.whiteToPlay = !this.whiteToPlay;
            
            // Track position for threefold repetition detection
            if (!this.positionHistory) {
                this.positionHistory = [];
            }
            this.positionHistory.push(this._getPositionHash());
            
            // Check if game is over after the move
            const finalGameOverState = this.isGameOver();
            if (finalGameOverState.over) {
                return { 
                    ...finalGameOverState, 
                    requireSync: requireSync
                };
            }
            
            // Game continues
            return { 
                over: false,
                reason: null,
                winner: null,
                requireSync: requireSync
            };
        }
        
        /**
         * Undo the last move made on the board
         * Restores all game state including special moves (castling, en passant, promotion)
         * @returns {void}
         */
        undoMove() {
            /** Array storing the history of moves for undo functionality */
            if (!this.moveHistory || this.moveHistory.length === 0) return;
            const last = this.moveHistory.pop();

            // Restore pieces to their original positions
            if (last.promotion) {
                // Undo pawn promotion: restore pawn and captured piece
                this.setPiece(last.fromPiece, last.move.from);
                this.setPiece(last.toPiece, last.move.to);
            } else {
                // Normal move: restore both pieces
                this.setPiece(last.fromPiece, last.move.from);
                this.setPiece(last.toPiece, last.move.to);
            }

            // Undo castling: restore rook to original position
            if (last.castlingMove) {
                if (last.move.from === "E1" && last.move.to === "G1") {
                    // White king-side castling
                    this.setPiece(Chess.Piece.WHITE_ROOK, "H1");
                    this.setPiece(Chess.Piece.NONE, "F1");
                } else if (last.move.from === "E1" && last.move.to === "C1") {
                    // White queen-side castling
                    this.setPiece(Chess.Piece.WHITE_ROOK, "A1");
                    this.setPiece(Chess.Piece.NONE, "D1");
                } else if (last.move.from === "E8" && last.move.to === "G8") {
                    // Black king-side castling
                    this.setPiece(Chess.Piece.BLACK_ROOK, "H8");
                    this.setPiece(Chess.Piece.NONE, "F8");
                } else if (last.move.from === "E8" && last.move.to === "C8") {
                    // Black queen-side castling
                    this.setPiece(Chess.Piece.BLACK_ROOK, "A8");
                    this.setPiece(Chess.Piece.NONE, "D8");
                }
            }

            // Undo en passant capture: restore captured pawn
            if (last.enPassantCapture) {
                if (last.fromPiece === Chess.Piece.WHITE_PAWN) {
                    const capSq = last.move.to[0] + (parseInt(last.move.to[1]) - 1);
                    this.setPiece(Chess.Piece.BLACK_PAWN, capSq);
                } else if (last.fromPiece === Chess.Piece.BLACK_PAWN) {
                    const capSq = last.move.to[0] + (parseInt(last.move.to[1]) + 1);
                    this.setPiece(Chess.Piece.WHITE_PAWN, capSq);
                }
            }

            // Restore castling rights
            this.castlingRights = last.castlingRights;

            // Restore en passant target square
            this.enPassant = last.prevEnPassant;

            // Restore move counters
            this.halfmove = last.halfmove;
            this.fullmove = last.fullmove;

            // Restore turn
            this.whiteToPlay = !this.whiteToPlay;
            
            // Remove position from history for threefold repetition tracking
            if (this.positionHistory && this.positionHistory.length > 0) {
                this.positionHistory.pop();
            }
        }

        /**
         * Check if the current position has insufficient material for checkmate
         * Returns true if neither side can possibly deliver checkmate
         * @returns {boolean} True if insufficient material for checkmate
         */
        isInsufficientMaterial() {
            let whiteBishops = 0, blackBishops = 0;
            let whiteKnights = 0, blackKnights = 0;
            let whiteOther = 0, blackOther = 0; // Pawns, rooks, queens

            // Count all pieces on the board
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const piece = this.board[r][c];
                    switch (piece) {
                        case Chess.Piece.WHITE_PAWN:
                        case Chess.Piece.WHITE_ROOK:
                        case Chess.Piece.WHITE_QUEEN:
                            whiteOther++;
                            break;
                        case Chess.Piece.BLACK_PAWN:
                        case Chess.Piece.BLACK_ROOK:
                        case Chess.Piece.BLACK_QUEEN:
                            blackOther++;
                            break;
                        case Chess.Piece.WHITE_BISHOP:
                            whiteBishops++;
                            break;
                        case Chess.Piece.BLACK_BISHOP:
                            blackBishops++;
                            break;
                        case Chess.Piece.WHITE_KNIGHT:
                            whiteKnights++;
                            break;
                        case Chess.Piece.BLACK_KNIGHT:
                            blackKnights++;
                            break;
                        default:
                            break;
                    }
                }
            }

            // King vs king - definite draw
            if (
                whiteOther === 0 && blackOther === 0 &&
                whiteBishops === 0 && blackBishops === 0 &&
                whiteKnights === 0 && blackKnights === 0
            ) {
                return true;
            }

            // King and bishop vs king - definite draw
            if (
                whiteOther === 0 && blackOther === 0 &&
                ((whiteBishops === 1 && whiteKnights === 0 && blackBishops === 0 && blackKnights === 0) ||
                 (blackBishops === 1 && blackKnights === 0 && whiteBishops === 0 && whiteKnights === 0))
            ) {
                return true;
            }

            // King and knight vs king - definite draw
            if (
                whiteOther === 0 && blackOther === 0 &&
                ((whiteKnights === 1 && whiteBishops === 0 && blackBishops === 0 && blackKnights === 0) ||
                 (blackKnights === 1 && blackBishops === 0 && whiteBishops === 0 && whiteKnights === 0))
            ) {
                return true;
            }

            // King and bishop(s) vs king and bishop(s) with same color square bishops
            if (
                whiteOther === 0 && blackOther === 0 &&
                whiteKnights === 0 && blackKnights === 0 &&
                whiteBishops + blackBishops > 1
            ) {
                // Check if all bishops are on the same color squares
                let bishopColors = [];
                for (let r = 0; r < 8; r++) {
                    for (let c = 0; c < 8; c++) {
                        const piece = this.board[r][c];
                        if (piece === Chess.Piece.WHITE_BISHOP || piece === Chess.Piece.BLACK_BISHOP) {
                            bishopColors.push((r + c) % 2); // 0 for dark squares, 1 for light squares
                        }
                    }
                }
                if (bishopColors.length > 0 && bishopColors.every(color => color === bishopColors[0])) {
                    return true;
                }
            }

            return false;
        }

        /**
         * Check if the game is over due to various end conditions
         * @returns {Object} Game over status object containing:
         *   - {boolean} over - Whether the game is over
         *   - {string|null} reason - Reason for game over: "50-move rule", "insufficient material", 
         *                        "threefold repetition", "checkmate", "stalemate", "illegal move"
         *   - {string|null} winner - Winner: "white", "black", or "draw"
         */
        isGameOver() {
            // Check 50-move rule (100 half-moves without pawn move or capture)
            if (this.halfmove >= 100) {
                return { over: true, reason: "50-move rule", winner: "draw" };
            }
            
            // Check for insufficient material to deliver checkmate
            if (this.isInsufficientMaterial()) {
                return { over: true, reason: "insufficient material", winner: "draw" };
            }
            
            // Check for threefold repetition of position
            if (this.isThreefoldRepetition()) {
                return { over: true, reason: "threefold repetition", winner: "draw" };
            }
            
            // Check for checkmate or stalemate (no legal moves available)
            const moves = this.getMoves();
            if (moves.length === 0) {
                if (this.isKingAttacked(this.whiteToPlay)) {
                    // King is in check with no legal moves = checkmate
                    return { over: true, reason: "checkmate", winner: this.whiteToPlay ? "black" : "white" };
                } else {
                    // King is not in check with no legal moves = stalemate
                    return { over: true, reason: "stalemate", winner: "draw" };
                }
            }
            
            // Game continues
            return { over: false, reason: null, winner: null };
        }

        /**
         * Generate all legal moves for the current position
         * Uses caching and optimized algorithms for better performance
         * @returns {Array<Chess.Move>} Array of all legal moves
         */
        getMoves() {
            // Use cache based on position hash to avoid recalculation
            const positionHash = this._getPositionHash();
            if (this._movesCache.hash === positionHash) {
                return this._movesCache.moves;
            }
            
            // Generate moves for all pieces on the board
            const moves = [];
            const isWhite = this.whiteToPlay;
            
            // Use piece-centric approach for better performance
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const piece = this.board[r][c];
                    if (piece === Chess.Piece.NONE) continue;
                    
                    // Check if piece belongs to current player
                    const pieceIsWhite = piece <= Chess.Piece.WHITE_KING;
                    if (pieceIsWhite !== isWhite) continue;
                    
                    // Generate moves for this piece
                    this._generateMovesForPiece(r, c, piece, moves);
                }
            }
            
            // Filter out illegal moves (those that leave king in check)
            const legalMoves = this._filterLegalMoves(moves);
            
            // Cache the result
            this._movesCache = { hash: positionHash, moves: legalMoves };
            return legalMoves;
        }

        /**
         * Generate moves for a piece at given coordinates
         * @param {number} r Row coordinate (0-7)
         * @param {number} c Column coordinate (0-7)
         * @param {number} piece Piece type constant
         * @param {Array<Chess.Move>} moves Array to add moves to
         * @private
         */
        _generateMovesForPiece(r, c, piece, moves) {
            const from = Chess.coordsToSquare(r, c);
            const isWhite = piece <= Chess.Piece.WHITE_KING;
            
            switch (piece) {
                case Chess.Piece.WHITE_PAWN:
                case Chess.Piece.BLACK_PAWN:
                    this._generatePawnMoves(r, c, from, isWhite, moves);
                    break;
                case Chess.Piece.WHITE_ROOK:
                case Chess.Piece.BLACK_ROOK:
                    this._generateRookMoves(r, c, from, isWhite, moves);
                    break;
                case Chess.Piece.WHITE_KNIGHT:
                case Chess.Piece.BLACK_KNIGHT:
                    this._generateKnightMoves(r, c, from, isWhite, moves);
                    break;
                case Chess.Piece.WHITE_BISHOP:
                case Chess.Piece.BLACK_BISHOP:
                    this._generateBishopMoves(r, c, from, isWhite, moves);
                    break;
                case Chess.Piece.WHITE_QUEEN:
                case Chess.Piece.BLACK_QUEEN:
                    this._generateQueenMoves(r, c, from, isWhite, moves);
                    break;
                case Chess.Piece.WHITE_KING:
                case Chess.Piece.BLACK_KING:
                    this._generateKingMoves(r, c, from, isWhite, moves);
                    break;
            }
        }

        /**
         * Check if the king of the specified color is currently under attack (optimized)
         * @param {boolean} isWhite True to check white king, false for black king
         * @returns {boolean} True if the king is under attack
         */
        isKingAttacked(isWhite = this.whiteToPlay) {
            const kingPos = isWhite ? this._kingPositions.white : this._kingPositions.black;
            if (!kingPos) return false; // Should never happen in a valid position
            
            return this._isSquareAttacked(kingPos.r, kingPos.c, !isWhite);
        }

        /**
         * Filter pseudo-legal moves to only include legal moves (optimized)
         * @param {Array<Chess.Move>} moves Array of pseudo-legal moves to filter
         * @returns {Array<Chess.Move>} Array of legal moves
         * @private
         */
        _filterLegalMoves(moves) {
            const legalMoves = [];
            const kingPos = this.whiteToPlay ? this._kingPositions.white : this._kingPositions.black;
            
            for (const move of moves) {
                if (this._isMoveLegal(move, kingPos)) {
                    legalMoves.push(move);
                }
            }
            
            return legalMoves;
        }

        /**
         * Check if a move is legal (doesn't leave king in check) - optimized version
         * @param {Chess.Move} move The move to test
         * @param {Object} kingPos Current king position with r and c properties
         * @returns {boolean} True if the move is legal
         * @private
         */
        _isMoveLegal(move, kingPos) {
            const fromCoords = Chess.squareToCoords(move.from);
            const toCoords = Chess.squareToCoords(move.to);
            const fromPiece = this.board[fromCoords.r][fromCoords.c];
            const toPiece = this.board[toCoords.r][toCoords.c];
            
            // Make the move temporarily
            this.board[fromCoords.r][fromCoords.c] = Chess.Piece.NONE;
            this.board[toCoords.r][toCoords.c] = fromPiece;
            
            // Update king position if king moved
            let newKingPos = kingPos;
            if (fromPiece === Chess.Piece.WHITE_KING || fromPiece === Chess.Piece.BLACK_KING) {
                newKingPos = toCoords;
            }
            
            // Check if king is in check
            const isLegal = !this._isSquareAttacked(newKingPos.r, newKingPos.c, !this.whiteToPlay);
            
            // Undo the move
            this.board[fromCoords.r][fromCoords.c] = fromPiece;
            this.board[toCoords.r][toCoords.c] = toPiece;
            
            return isLegal;
        }

        /**
         * Check if a square is attacked by the opponent (optimized)
         * @param {number} r Row coordinate (0-7)
         * @param {number} c Column coordinate (0-7)
         * @param {boolean} byWhite True if checking for white attacks, false for black
         * @returns {boolean} True if the square is under attack
         * @private
         */
        _isSquareAttacked(r, c, byWhite) {
            const attackerStart = byWhite ? Chess.Piece.WHITE_PAWN : Chess.Piece.BLACK_PAWN;
            const attackerEnd = byWhite ? Chess.Piece.WHITE_KING : Chess.Piece.BLACK_KING;
            
            // Check pawn attacks
            const pawnDirection = byWhite ? 1 : -1;
            const pawnR = r + pawnDirection;
            if (pawnR >= 0 && pawnR < 8) {
                for (const dc of [-1, 1]) {
                    const pawnC = c + dc;
                    if (pawnC >= 0 && pawnC < 8) {
                        const piece = this.board[pawnR][pawnC];
                        if (piece === (byWhite ? Chess.Piece.WHITE_PAWN : Chess.Piece.BLACK_PAWN)) {
                            return true;
                        }
                    }
                }
            }
            
            // Check knight attacks
            const knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
            for (const [dr, dc] of knightMoves) {
                const newR = r + dr;
                const newC = c + dc;
                if (newR >= 0 && newR < 8 && newC >= 0 && newC < 8) {
                    const piece = this.board[newR][newC];
                    if (piece === (byWhite ? Chess.Piece.WHITE_KNIGHT : Chess.Piece.BLACK_KNIGHT)) {
                        return true;
                    }
                }
            }
            
            // Check sliding piece attacks (rook, bishop, queen)
            const directions = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
            for (let i = 0; i < directions.length; i++) {
                const [dr, dc] = directions[i];
                const isRookDirection = i < 4;
                
                let newR = r + dr;
                let newC = c + dc;
                
                while (newR >= 0 && newR < 8 && newC >= 0 && newC < 8) {
                    const piece = this.board[newR][newC];
                    
                    if (piece !== Chess.Piece.NONE) {
                        if (piece >= attackerStart && piece <= attackerEnd) {
                            const attackerPiece = byWhite ? piece : piece;
                            if (attackerPiece === (byWhite ? Chess.Piece.WHITE_QUEEN : Chess.Piece.BLACK_QUEEN) ||
                                (isRookDirection && attackerPiece === (byWhite ? Chess.Piece.WHITE_ROOK : Chess.Piece.BLACK_ROOK)) ||
                                (!isRookDirection && attackerPiece === (byWhite ? Chess.Piece.WHITE_BISHOP : Chess.Piece.BLACK_BISHOP))) {
                                return true;
                            }
                        }
                        break;
                    }
                    newR += dr;
                    newC += dc;
                }
            }
            
            // Check king attacks
            const kingMoves = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
            for (const [dr, dc] of kingMoves) {
                const newR = r + dr;
                const newC = c + dc;
                if (newR >= 0 && newR < 8 && newC >= 0 && newC < 8) {
                    const piece = this.board[newR][newC];
                    if (piece === (byWhite ? Chess.Piece.WHITE_KING : Chess.Piece.BLACK_KING)) {
                        return true;
                    }
                }
            }
            
            return false;
        }

        /**
         * Get a hash of the current position for caching and repetition detection
         * @returns {string} Unique hash string representing the current position
         * @private
         */
        _getPositionHash() {
            // Create a comprehensive hash based on all position-defining elements
            let hash = this.whiteToPlay ? 'w' : 'b';
            hash += '|' + this.castlingRights.toString();
            hash += '|' + (this.enPassant || '-');
            
            // Add board position with separators to avoid collisions
            hash += '|';
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    hash += this.board[r][c].toString();
                    if (c < 7) hash += ',';
                }
                if (r < 7) hash += '/';
            }
            
            return hash;
        }

        /**
         * Check for threefold repetition of the current position (optimized)
         * @returns {boolean} True if threefold repetition has occurred
         */
        isThreefoldRepetition() {
            if (!this.positionHistory || this.positionHistory.length < 4) {
                return false; // Need at least 4 positions for threefold repetition
            }
            
            const currentHash = this._getPositionHash();
            let count = 0;
            
            // Check the current position against ALL positions in history (including the first one)
            for (let i = 0; i < this.positionHistory.length; i++) {
                if (this.positionHistory[i] === currentHash) {
                    count++;
                }
            }
                        
            return count >= 3; // Three occurrences = threefold repetition
        }

        /**
         * Generate pawn moves optimized for performance
         * @param {number} r Row coordinate of the pawn
         * @param {number} c Column coordinate of the pawn
         * @param {string} from Square in algebraic notation
         * @param {boolean} isWhite True for white pawn, false for black
         * @param {Array<Chess.Move>} moves Array to add generated moves to
         * @private
         */
        _generatePawnMoves(r, c, from, isWhite, moves) {
            const direction = isWhite ? -1 : 1;
            const startRank = isWhite ? 6 : 1;
            const promotionRank = isWhite ? 0 : 7; // 8th rank for white, 1st rank for black
            const enemyStart = isWhite ? Chess.Piece.BLACK_PAWN : Chess.Piece.WHITE_PAWN;
            const enemyEnd = isWhite ? Chess.Piece.BLACK_KING : Chess.Piece.WHITE_KING;
            
            // Forward moves
            const newR = r + direction;
            if (newR >= 0 && newR < 8 && this.board[newR][c] === Chess.Piece.NONE) {
                const to = Chess.coordsToSquare(newR, c);
                
                // Check if this is a promotion move
                if (newR === promotionRank) {
                    // Generate all four promotion moves
                    const promotionPieces = isWhite ? 
                        [Chess.Piece.WHITE_QUEEN, Chess.Piece.WHITE_ROOK, Chess.Piece.WHITE_BISHOP, Chess.Piece.WHITE_KNIGHT] :
                        [Chess.Piece.BLACK_QUEEN, Chess.Piece.BLACK_ROOK, Chess.Piece.BLACK_BISHOP, Chess.Piece.BLACK_KNIGHT];
                    
                    for (const piece of promotionPieces) {
                        moves.push(new Chess.Move(from, to, piece));
                    }
                } else {
                    moves.push(new Chess.Move(from, to));
                    
                    // Double move from starting position
                    if (r === startRank && this.board[r + 2 * direction][c] === Chess.Piece.NONE) {
                        moves.push(new Chess.Move(from, Chess.coordsToSquare(r + 2 * direction, c)));
                    }
                }
            }
            
            // Diagonal captures
            for (const dc of [-1, 1]) {
                const newC = c + dc;
                if (newR >= 0 && newR < 8 && newC >= 0 && newC < 8) {
                    const target = this.board[newR][newC];
                    if (target >= enemyStart && target <= enemyEnd) {
                        const to = Chess.coordsToSquare(newR, newC);
                        
                        // Check if this is a promotion capture
                        if (newR === promotionRank) {
                            // Generate all four promotion moves
                            const promotionPieces = isWhite ? 
                                [Chess.Piece.WHITE_QUEEN, Chess.Piece.WHITE_ROOK, Chess.Piece.WHITE_BISHOP, Chess.Piece.WHITE_KNIGHT] :
                                [Chess.Piece.BLACK_QUEEN, Chess.Piece.BLACK_ROOK, Chess.Piece.BLACK_BISHOP, Chess.Piece.BLACK_KNIGHT];
                            
                            for (const piece of promotionPieces) {
                                moves.push(new Chess.Move(from, to, piece));
                            }
                        } else {
                            moves.push(new Chess.Move(from, to));
                        }
                    }
                }
            }
            
            // En passant
            if (this.enPassant) {
                const epCoords = Chess.squareToCoords(this.enPassant);
                // For en passant, the attacking pawn must be on the correct rank:
                // White pawns on rank 5 (r=3) can capture en passant to rank 6 (r=2)
                // Black pawns on rank 4 (r=4) can capture en passant to rank 3 (r=5)
                const correctRank = isWhite ? 3 : 4; // 5th rank for white, 4th rank for black
                if (r === correctRank && Math.abs(c - epCoords.c) === 1) {
                    moves.push(new Chess.Move(from, this.enPassant));
                }
            }
        }

        /**
         * Generate rook moves optimized for performance
         * @param {number} r Row coordinate of the rook
         * @param {number} c Column coordinate of the rook
         * @param {string} from Square in algebraic notation
         * @param {boolean} isWhite True for white rook, false for black
         * @param {Array<Chess.Move>} moves Array to add generated moves to
         * @private
         */
        _generateRookMoves(r, c, from, isWhite, moves) {
            const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
            this._generateSlidingMoves(r, c, from, isWhite, directions, moves);
        }

        /**
         * Generate bishop moves optimized for performance
         * @param {number} r Row coordinate of the bishop
         * @param {number} c Column coordinate of the bishop
         * @param {string} from Square in algebraic notation
         * @param {boolean} isWhite True for white bishop, false for black
         * @param {Array<Chess.Move>} moves Array to add generated moves to
         * @private
         */
        _generateBishopMoves(r, c, from, isWhite, moves) {
            const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
            this._generateSlidingMoves(r, c, from, isWhite, directions, moves);
        }

        /**
         * Generate queen moves optimized for performance
         * @param {number} r Row coordinate of the queen
         * @param {number} c Column coordinate of the queen
         * @param {string} from Square in algebraic notation
         * @param {boolean} isWhite True for white queen, false for black
         * @param {Array<Chess.Move>} moves Array to add generated moves to
         * @private
         */
        _generateQueenMoves(r, c, from, isWhite, moves) {
            const directions = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
            this._generateSlidingMoves(r, c, from, isWhite, directions, moves);
        }

        /**
         * Generate sliding piece moves (rook, bishop, queen)
         * @param {number} r Row coordinate of the piece
         * @param {number} c Column coordinate of the piece
         * @param {string} from Square in algebraic notation
         * @param {boolean} isWhite True for white piece, false for black
         * @param {Array<Array<number>>} directions Array of direction vectors [dr, dc]
         * @param {Array<Chess.Move>} moves Array to add generated moves to
         * @private
         */
        _generateSlidingMoves(r, c, from, isWhite, directions, moves) {
            const friendlyStart = isWhite ? Chess.Piece.WHITE_PAWN : Chess.Piece.BLACK_PAWN;
            const friendlyEnd = isWhite ? Chess.Piece.WHITE_KING : Chess.Piece.BLACK_KING;
            const enemyStart = isWhite ? Chess.Piece.BLACK_PAWN : Chess.Piece.WHITE_PAWN;
            const enemyEnd = isWhite ? Chess.Piece.BLACK_KING : Chess.Piece.WHITE_KING;
            
            for (const [dr, dc] of directions) {
                let newR = r + dr;
                let newC = c + dc;
                
                while (newR >= 0 && newR < 8 && newC >= 0 && newC < 8) {
                    const target = this.board[newR][newC];
                    
                    if (target === Chess.Piece.NONE) {
                        moves.push(new Chess.Move(from, Chess.coordsToSquare(newR, newC)));
                    } else if (target >= enemyStart && target <= enemyEnd) {
                        moves.push(new Chess.Move(from, Chess.coordsToSquare(newR, newC)));
                        break;
                    } else if (target >= friendlyStart && target <= friendlyEnd) {
                        break;
                    }
                    
                    newR += dr;
                    newC += dc;
                }
            }
        }

        /**
         * Generate knight moves optimized for performance
         * @param {number} r Row coordinate of the knight
         * @param {number} c Column coordinate of the knight
         * @param {string} from Square in algebraic notation
         * @param {boolean} isWhite True for white knight, false for black
         * @param {Array<Chess.Move>} moves Array to add generated moves to
         * @private
         */
        _generateKnightMoves(r, c, from, isWhite, moves) {
            const knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
            const friendlyStart = isWhite ? Chess.Piece.WHITE_PAWN : Chess.Piece.BLACK_PAWN;
            const friendlyEnd = isWhite ? Chess.Piece.WHITE_KING : Chess.Piece.BLACK_KING;
            
            for (const [dr, dc] of knightMoves) {
                const newR = r + dr;
                const newC = c + dc;
                
                if (newR >= 0 && newR < 8 && newC >= 0 && newC < 8) {
                    const target = this.board[newR][newC];
                    if (target === Chess.Piece.NONE || target < friendlyStart || target > friendlyEnd) {
                        moves.push(new Chess.Move(from, Chess.coordsToSquare(newR, newC)));
                    }
                }
            }
        }

        /**
         * Generate king moves optimized for performance
         * @param {number} r Row coordinate of the king
         * @param {number} c Column coordinate of the king
         * @param {string} from Square in algebraic notation
         * @param {boolean} isWhite True for white king, false for black
         * @param {Array<Chess.Move>} moves Array to add generated moves to
         * @private
         */
        _generateKingMoves(r, c, from, isWhite, moves) {
            const kingMoves = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
            const friendlyStart = isWhite ? Chess.Piece.WHITE_PAWN : Chess.Piece.BLACK_PAWN;
            const friendlyEnd = isWhite ? Chess.Piece.WHITE_KING : Chess.Piece.BLACK_KING;
            
            for (const [dr, dc] of kingMoves) {
                const newR = r + dr;
                const newC = c + dc;
                
                if (newR >= 0 && newR < 8 && newC >= 0 && newC < 8) {
                    const target = this.board[newR][newC];
                    if (target === Chess.Piece.NONE || target < friendlyStart || target > friendlyEnd) {
                        moves.push(new Chess.Move(from, Chess.coordsToSquare(newR, newC)));
                    }
                }
            }
            
            // Castling
            if (isWhite && r === 7 && c === 4) {
                // White castling
                if ((this.castlingRights & 1) && !this.isKingAttacked(true)) { // King-side
                    if (this.board[7][5] === Chess.Piece.NONE && this.board[7][6] === Chess.Piece.NONE) {
                        if (!this._isSquareAttacked(7, 5, false) && !this._isSquareAttacked(7, 6, false)) {
                            moves.push(new Chess.Move(from, "G1"));
                        }
                    }
                }
                if ((this.castlingRights & 2) && !this.isKingAttacked(true)) { // Queen-side
                    if (this.board[7][3] === Chess.Piece.NONE && this.board[7][2] === Chess.Piece.NONE && this.board[7][1] === Chess.Piece.NONE) {
                        if (!this._isSquareAttacked(7, 3, false) && !this._isSquareAttacked(7, 2, false)) {
                            moves.push(new Chess.Move(from, "C1"));
                        }
                    }
                }
            } else if (!isWhite && r === 0 && c === 4) {
                // Black castling
                if ((this.castlingRights & 4) && !this.isKingAttacked(false)) { // King-side
                    if (this.board[0][5] === Chess.Piece.NONE && this.board[0][6] === Chess.Piece.NONE) {
                        if (!this._isSquareAttacked(0, 5, true) && !this._isSquareAttacked(0, 6, true)) {
                            moves.push(new Chess.Move(from, "G8"));
                        }
                    }
                }
                if ((this.castlingRights & 8) && !this.isKingAttacked(false)) { // Queen-side
                    if (this.board[0][3] === Chess.Piece.NONE && this.board[0][2] === Chess.Piece.NONE && this.board[0][1] === Chess.Piece.NONE) {
                        if (!this._isSquareAttacked(0, 3, true) && !this._isSquareAttacked(0, 2, true)) {
                            moves.push(new Chess.Move(from, "C8"));
                        }
                    }
                }
            }
        }
    }
}