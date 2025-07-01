export default class Chess {
    static Piece = class {
        static NONE = 0;
        static WHITE_PAWN = 1;
        static WHITE_ROOK = 2;
        static WHITE_KNIGHT = 3;
        static WHITE_BISHOP = 4;
        static WHITE_QUEEN = 5;
        static WHITE_KING = 6;
        static BLACK_PAWN = 7;
        static BLACK_ROOK = 8;
        static BLACK_KNIGHT = 9;
        static BLACK_BISHOP = 10;
        static BLACK_QUEEN = 11;
        static BLACK_KING = 12;
    };

    static Move = class {
        constructor(from, to) {
            this.from = from;
            this.to = to;
        }
    };

    static Board = class {
        static DefaultFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

        constructor(fen = Chess.Board.DefaultFEN) {
            this.board = Array(8).fill().map(() => Array(8).fill(Chess.Piece.NONE));
            this.LoadFEN(fen);
        }
    
        LoadFEN(fen) {
            const [piecePlacement, activeColor, castling, enPassant, halfmove, fullmove] = fen.split(' ');
            this.whiteToPlay = activeColor == 'w';
            this.castlingWhiteKingSide = castling.includes('K');
            this.castlingWhiteQueenSide = castling.includes('Q');
            this.castlingBlackKingSide = castling.includes('k');
            this.castlingBlackQueenSide = castling.includes('q');
            this.enPassant = (enPassant || '-').toUpperCase();
            this.halfmove = parseInt(halfmove) || 0;
            this.fullmove = parseInt(fullmove) || 1;
    
            const rows = piecePlacement.split('/');
            for (let r = 0; r < 8; r++) {
                let c = 0;
                for (const ch of rows[r]) {
                    if (c >= 8) break;
                    if (!isNaN(ch)) {
                        c += parseInt(ch);
                    } else {
                        let piece;
                        switch (ch) {
                            case 'P': piece = Chess.Piece.WHITE_PAWN; break;
                            case 'N': piece = Chess.Piece.WHITE_KNIGHT; break;
                            case 'B': piece = Chess.Piece.WHITE_BISHOP; break;
                            case 'R': piece = Chess.Piece.WHITE_ROOK; break;
                            case 'Q': piece = Chess.Piece.WHITE_QUEEN; break;
                            case 'K': piece = Chess.Piece.WHITE_KING; break;
                            case 'p': piece = Chess.Piece.BLACK_PAWN; break;
                            case 'n': piece = Chess.Piece.BLACK_KNIGHT; break;
                            case 'b': piece = Chess.Piece.BLACK_BISHOP; break;
                            case 'r': piece = Chess.Piece.BLACK_ROOK; break;
                            case 'q': piece = Chess.Piece.BLACK_QUEEN; break;
                            case 'k': piece = Chess.Piece.BLACK_KING; break;
                            default: piece = Chess.Piece.NONE;
                        }
                        this.board[r][c] = piece;
                        c++;
                    }
                }
            }
        }

        CreateFEN() {
            // Piece placement
            let fen = "";
            for (let r = 0; r < 8; r++) {
                let empty = 0;
                for (let c = 0; c < 8; c++) {
                    const piece = this.board[r][c];
                    let ch = "";
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
                        empty++;
                    } else {
                        if (empty > 0) {
                            fen += empty;
                            empty = 0;
                        }
                        fen += ch;
                    }
                }
                if (empty > 0) fen += empty;
                if (r < 7) fen += "/";
            }

            // Active color
            fen += " " + (this.whiteToPlay ? "w" : "b");

            // Castling rights
            let castling = "";
            if (this.castlingWhiteKingSide) castling += "K";
            if (this.castlingWhiteQueenSide) castling += "Q";
            if (this.castlingBlackKingSide) castling += "k";
            if (this.castlingBlackQueenSide) castling += "q";
            fen += " " + (castling === "" ? "-" : castling);

            // En passant
            fen += " " + (this.enPassant && this.enPassant !== "-" ? this.enPassant.toLowerCase() : "-");

            // Halfmove clock
            fen += " " + (this.halfmove || 0);

            // Fullmove number
            fen += " " + (this.fullmove || 1);

            return fen;
        }
    
        SetPiece(piece, square) {
            if (!square) return;
            const col = square.charCodeAt(0) - 'A'.charCodeAt(0);
            const row = 8 - parseInt(square[1]);
            if (col >= 0 && col < 8 && row >= 0 && row < 8) {
                this.board[row][col] = piece;
            }
        }
    
        GetPiece(square) {
            if (!square) return;
            const col = square.charCodeAt(0) - 'A'.charCodeAt(0);
            const row = 8 - parseInt(square[1]);
            if (col >= 0 && col < 8 && row >= 0 && row < 8) {
                return this.board[row][col];
            } else {
                return Chess.Piece.NONE;
            }
        }
        
        MakeMove(move, check_legal = true) {
            MakeMove(move.from, move.to, check_legal);
        }

        MakeMove(from, to, check_legal = true) {
            if (check_legal) {
                const legalMoves = this.GetMoves();
                const isLegal = legalMoves.some(m => m.from === from && m.to === to);
                if (!isLegal) {
                    return -1; // Move is not legal
                }
            }

            let requireSync = false;

            const fromPiece = this.GetPiece(from);
            const toPiece = this.GetPiece(to);

            const wks = this.castlingWhiteKingSide;
            const wqs = this.castlingWhiteQueenSide;
            const bks = this.castlingBlackKingSide;
            const bqs = this.castlingBlackQueenSide;

            if (!this.moveHistory) this.moveHistory = [];

            // Castling
            let castlingMove = false;
            if (fromPiece === Chess.Piece.WHITE_KING && from === "E1") {
                if (to === "G1" && this.castlingWhiteKingSide) {
                    // White king-side castling
                    this.SetPiece(Chess.Piece.WHITE_KING, "G1");
                    this.SetPiece(Chess.Piece.NONE, "E1");
                    this.SetPiece(Chess.Piece.WHITE_ROOK, "F1");
                    this.SetPiece(Chess.Piece.NONE, "H1");
                    castlingMove = true;
                } else if (to === "C1" && this.castlingWhiteQueenSide) {
                    // White queen-side castling
                    this.SetPiece(Chess.Piece.WHITE_KING, "C1");
                    this.SetPiece(Chess.Piece.NONE, "E1");
                    this.SetPiece(Chess.Piece.WHITE_ROOK, "D1");
                    this.SetPiece(Chess.Piece.NONE, "A1");
                    castlingMove = true;
                }
                this.castlingWhiteKingSide = false;
                this.castlingWhiteQueenSide = false;
            } else if (fromPiece === Chess.Piece.BLACK_KING && from === "E8") {
                if (to === "G8" && this.castlingBlackKingSide) {
                    // Black king-side castling
                    this.SetPiece(Chess.Piece.BLACK_KING, "G8");
                    this.SetPiece(Chess.Piece.NONE, "E8");
                    this.SetPiece(Chess.Piece.BLACK_ROOK, "F8");
                    this.SetPiece(Chess.Piece.NONE, "H8");
                    castlingMove = true;
                } else if (to === "C8" && this.castlingBlackQueenSide) {
                    // Black queen-side castling
                    this.SetPiece(Chess.Piece.BLACK_KING, "C8");
                    this.SetPiece(Chess.Piece.NONE, "E8");
                    this.SetPiece(Chess.Piece.BLACK_ROOK, "D8");
                    this.SetPiece(Chess.Piece.NONE, "A8");
                    castlingMove = true;
                }
                this.castlingBlackKingSide = false;
                this.castlingBlackQueenSide = false;
            }

            if (fromPiece === Chess.Piece.WHITE_ROOK && from === "A1") this.castlingWhiteQueenSide = false;
            if (fromPiece === Chess.Piece.WHITE_ROOK && from === "H1") this.castlingWhiteKingSide = false;
            if (fromPiece === Chess.Piece.BLACK_ROOK && from === "A8") this.castlingBlackQueenSide = false;
            if (fromPiece === Chess.Piece.BLACK_ROOK && from === "H8") this.castlingBlackKingSide = false;
            if (to === "A1" && toPiece === Chess.Piece.WHITE_ROOK) this.castlingWhiteQueenSide = false;
            if (to === "H1" && toPiece === Chess.Piece.WHITE_ROOK) this.castlingWhiteKingSide = false;
            if (to === "A8" && toPiece === Chess.Piece.BLACK_ROOK) this.castlingBlackQueenSide = false;
            if (to === "H8" && toPiece === Chess.Piece.BLACK_ROOK) this.castlingBlackKingSide = false;

            // En passant
            let enPassantCapture = false;
            let prevEnPassant = this.enPassant;
            this.enPassant = "-";
            if (fromPiece === Chess.Piece.WHITE_PAWN) {
                if (from[1] === "2" && to[1] === "4") {
                    this.enPassant = from[0] + "3";
                }
                if (to === prevEnPassant && from[0] !== to[0]) {
                    const capSq = to[0] + (parseInt(to[1]) - 1);
                    this.SetPiece(Chess.Piece.NONE, capSq);
                    enPassantCapture = true;
                }
            }
            if (fromPiece === Chess.Piece.BLACK_PAWN) {
                if (from[1] === "7" && to[1] === "5") {
                    this.enPassant = from[0] + "6";
                }
                if (to === prevEnPassant && from[0] !== to[0]) {
                    const capSq = to[0] + (parseInt(to[1]) + 1);
                    this.SetPiece(Chess.Piece.NONE, capSq);
                    enPassantCapture = true;
                }
            }

            // Pawn promotion
            let promotion = null;
            let promotedPiece = null;
            if (fromPiece === Chess.Piece.WHITE_PAWN && to[1] === "8") {
                // Always promote to queen for now
                promotedPiece = Chess.Piece.WHITE_QUEEN;
                promotion = promotedPiece;
            } else if (fromPiece === Chess.Piece.BLACK_PAWN && to[1] === "1") {
                promotedPiece = Chess.Piece.BLACK_QUEEN;
                promotion = promotedPiece;
            }

            if (castlingMove || enPassantCapture || promotion) {
                requireSync = true;
            }

            if (!castlingMove) {
                if (promotion) {
                    this.SetPiece(promotedPiece, to);
                    this.SetPiece(Chess.Piece.NONE, from);
                } else {
                    this.SetPiece(fromPiece, to);
                    this.SetPiece(Chess.Piece.NONE, from);
                }
            }

            if (
                fromPiece === Chess.Piece.WHITE_PAWN ||
                fromPiece === Chess.Piece.BLACK_PAWN ||
                (toPiece !== Chess.Piece.NONE) ||
                enPassantCapture
            ) {
                this.halfmove = 0;
            } else {
                this.halfmove++;
            }

            if (!this.whiteToPlay) {
                this.fullmove++;
            }

            this.moveHistory.push({
                move: new Chess.Move(from, to),
                fromPiece: fromPiece,
                toPiece: toPiece,
                castlingMove,
                enPassantCapture,
                prevEnPassant,
                castlingRights: {
                    wks: wks,
                    wqs: wqs,
                    bks: bks,
                    bqs: bqs
                },
                halfmove: this.halfmove,
                fullmove: this.fullmove,
                promotion: promotion
            });

            this.whiteToPlay = !this.whiteToPlay;
            
            return requireSync ? 1 : 0;
        }
        
        UndoMove() {
            if (!this.moveHistory || this.moveHistory.length === 0) return;
            const last = this.moveHistory.pop();

            // Undo promotion
            if (last.promotion) {
                this.SetPiece(last.fromPiece, last.move.from);
                this.SetPiece(last.toPiece, last.move.to);
            } else {
                this.SetPiece(last.fromPiece, last.move.from);
                this.SetPiece(last.toPiece, last.move.to);
            }

            // Undo castling
            if (last.castlingMove) {
                if (last.move.from === "E1" && last.move.to === "G1") {
                    // White king-side
                    this.SetPiece(Chess.Piece.WHITE_ROOK, "H1");
                    this.SetPiece(Chess.Piece.NONE, "F1");
                } else if (last.move.from === "E1" && last.move.to === "C1") {
                    // White queen-side
                    this.SetPiece(Chess.Piece.WHITE_ROOK, "A1");
                    this.SetPiece(Chess.Piece.NONE, "D1");
                } else if (last.move.from === "E8" && last.move.to === "G8") {
                    // Black king-side
                    this.SetPiece(Chess.Piece.BLACK_ROOK, "H8");
                    this.SetPiece(Chess.Piece.NONE, "F8");
                } else if (last.move.from === "E8" && last.move.to === "C8") {
                    // Black queen-side
                    this.SetPiece(Chess.Piece.BLACK_ROOK, "A8");
                    this.SetPiece(Chess.Piece.NONE, "D8");
                }
            }

            // Undo en passant capture
            if (last.enPassantCapture) {
                if (last.fromPiece === Chess.Piece.WHITE_PAWN) {
                    const capSq = last.move.to[0] + (parseInt(last.move.to[1]) - 1);
                    this.SetPiece(Chess.Piece.BLACK_PAWN, capSq);
                } else if (last.fromPiece === Chess.Piece.BLACK_PAWN) {
                    const capSq = last.move.to[0] + (parseInt(last.move.to[1]) + 1);
                    this.SetPiece(Chess.Piece.WHITE_PAWN, capSq);
                }
            }

            if (last.castlingRights) {
                this.castlingWhiteKingSide = last.castlingRights.wks;
                this.castlingWhiteQueenSide = last.castlingRights.wqs;
                this.castlingBlackKingSide = last.castlingRights.bks;
                this.castlingBlackQueenSide = last.castlingRights.bqs;
            }

            this.enPassant = last.prevEnPassant;

            this.halfmove = last.halfmove;
            this.fullmove = last.fullmove;

            this.whiteToPlay = !this.whiteToPlay;
        }

        IsInsufficientMaterial() {
            let whiteBishops = 0, blackBishops = 0;
            let whiteKnights = 0, blackKnights = 0;
            let whiteOther = 0, blackOther = 0;

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

            // King vs king
            if (
                whiteOther === 0 && blackOther === 0 &&
                whiteBishops === 0 && blackBishops === 0 &&
                whiteKnights === 0 && blackKnights === 0
            ) {
                return true;
            }

            // King and bishop vs king
            if (
                whiteOther === 0 && blackOther === 0 &&
                ((whiteBishops === 1 && whiteKnights === 0 && blackBishops === 0 && blackKnights === 0) ||
                 (blackBishops === 1 && blackKnights === 0 && whiteBishops === 0 && whiteKnights === 0))
            ) {
                return true;
            }

            // King and knight vs king
            if (
                whiteOther === 0 && blackOther === 0 &&
                ((whiteKnights === 1 && whiteBishops === 0 && blackBishops === 0 && blackKnights === 0) ||
                 (blackKnights === 1 && blackBishops === 0 && whiteBishops === 0 && whiteKnights === 0))
            ) {
                return true;
            }

            // King and bishop(s) vs king and bishop(s) (all bishops on same color)
            if (
                whiteOther === 0 && blackOther === 0 &&
                whiteKnights === 0 && blackKnights === 0 &&
                whiteBishops + blackBishops > 1
            ) {
                // Check if all bishops are on the same color
                let bishopColors = [];
                for (let r = 0; r < 8; r++) {
                    for (let c = 0; c < 8; c++) {
                        const piece = this.board[r][c];
                        if (piece === Chess.Piece.WHITE_BISHOP || piece === Chess.Piece.BLACK_BISHOP) {
                            bishopColors.push((r + c) % 2);
                        }
                    }
                }
                if (bishopColors.length > 0 && bishopColors.every(color => color === bishopColors[0])) {
                    return true;
                }
            }

            return false;
        }

        IsGameOver() {
            if (this.halfmove >= 100) {
                return { over: true, reason: "50-move rule", winner: "draw" };
            }
            if (this.IsInsufficientMaterial()) {
                return { over: true, reason: "insufficient material", winner: "draw" };
            }
            const moves = this.GetMoves();
            if (moves.length === 0) {
                if (this.IsKingAttacked(this.whiteToPlay)) {
                    return { over: true, reason: "checkmate", winner: this.whiteToPlay ? "black" : "white" };
                } else {
                    return { over: true, reason: "stalemate", winner: "draw" };
                }
            }
            return { over: false };
        }

        GetMoves() {
            // Use a simple cache based on FEN and side to move
            if (!this._movesCache) this._movesCache = {};
            const fen = this.CreateFEN();
            if (this._movesCache.fen === fen) {
                return this._movesCache.moves;
            }
            let moves = [];
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const piece_moves = this.GetMovesForPiece(String.fromCharCode(65 + c) + (8 - r));
                    piece_moves.forEach(move => {
                        moves.push(move);
                    });
                }
            }
            this._movesCache = { fen, moves };
            return moves;
        }

        // Returns true if the king of the given color is attacked
        IsKingAttacked(isWhite = this.whiteToPlay) {
            let kingSquare = null;
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const piece = this.board[r][c];
                    if (
                    (isWhite && piece === Chess.Piece.WHITE_KING) ||
                    (!isWhite && piece === Chess.Piece.BLACK_KING)
                    ) {
                    kingSquare = { r, c };
                    break;
                    }
                }
                if (kingSquare) break;
            }
            if (!kingSquare) return false; // Should not happen

            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const piece = this.board[r][c];
                    if (
                        (isWhite && piece >= Chess.Piece.BLACK_PAWN && piece <= Chess.Piece.BLACK_KING) ||
                        (!isWhite && piece >= Chess.Piece.WHITE_PAWN && piece <= Chess.Piece.WHITE_KING)
                    ) {
                        const from = String.fromCharCode(65 + c) + (8 - r);
                        const moves = this.GetPseudoLegalMovesForPiece(from, !isWhite, false);
                        for (const move of moves) {
                            const toC = move.to.charCodeAt(0) - 'A'.charCodeAt(0);
                            const toR = 8 - parseInt(move.to[1]);
                            if (toR === kingSquare.r && toC === kingSquare.c) {
                            return true;
                            }
                        }
                    }
                }
            }
            return false;
        }

        GetPseudoLegalMovesForPiece(coords, isWhite = this.whiteToPlay, includeCastling = true) {
            const c = coords.charCodeAt(0) - 'A'.charCodeAt(0);
            const r = 8 - parseInt(coords[1]);
            const moves = [];
            const piece = this.board[r][c];
            if (isWhite) {
                if (piece == Chess.Piece.WHITE_PAWN) {
                    if (r > 0 && this.board[r - 1][c] === Chess.Piece.NONE) {
                        const from = String.fromCharCode(65 + c) + (8 - r);
                        const to = String.fromCharCode(65 + c) + (8 - (r - 1));
                        moves.push(new Chess.Move(from, to));
                        if (r === 6 && this.board[r - 2][c] === Chess.Piece.NONE) {
                            const to2 = String.fromCharCode(65 + c) + (8 - (r - 2));
                            moves.push(new Chess.Move(from, to2));
                        }
                    }
                    for (let dc of [-1, 1]) {
                        const nc = c + dc;
                        if (r > 0 && nc >= 0 && nc < 8) {
                            const target = this.board[r - 1][nc];
                            if (target >= Chess.Piece.BLACK_PAWN && target <= Chess.Piece.BLACK_KING) {
                            const from = String.fromCharCode(65 + c) + (8 - r);
                            const to = String.fromCharCode(65 + nc) + (8 - (r - 1));
                            moves.push(new Chess.Move(from, to));
                            }
                        }
                    }
                    if (this.enPassant && this.enPassant !== '-') {
                        const epCol = this.enPassant.charCodeAt(0) - 'A'.charCodeAt(0);
                        const epRow = 8 - parseInt(this.enPassant[1]);
                        if (r === 3 && Math.abs(c - epCol) === 1 && epRow === 2) {
                            const from = String.fromCharCode(65 + c) + (8 - r);
                            const to = String.fromCharCode(65 + epCol) + (8 - epRow);
                            moves.push(new Chess.Move(from, to));
                        }
                    }
                }
                if (piece == Chess.Piece.WHITE_ROOK || piece == Chess.Piece.WHITE_QUEEN) {
                    const from = String.fromCharCode(65 + c) + (8 - r);
                    for (let dr = r - 1; dr >= 0; dr--) {
                        const target = this.board[dr][c];
                        const to = String.fromCharCode(65 + c) + (8 - dr);
                        if (target === Chess.Piece.NONE) {
                            moves.push(new Chess.Move(from, to));
                        } else if (target >= Chess.Piece.BLACK_PAWN && target <= Chess.Piece.BLACK_KING) {
                            moves.push(new Chess.Move(from, to));
                            break;
                        } else {
                            break;
                        }
                    }
                    for (let dr = r + 1; dr < 8; dr++) {
                        const target = this.board[dr][c];
                        const to = String.fromCharCode(65 + c) + (8 - dr);
                        if (target === Chess.Piece.NONE) {
                            moves.push(new Chess.Move(from, to));
                        } else if (target >= Chess.Piece.BLACK_PAWN && target <= Chess.Piece.BLACK_KING) {
                            moves.push(new Chess.Move(from, to));
                            break;
                        } else {
                            break;
                        }
                    }
                    for (let dc = c - 1; dc >= 0; dc--) {
                        const target = this.board[r][dc];
                        const to = String.fromCharCode(65 + dc) + (8 - r);
                        if (target === Chess.Piece.NONE) {
                            moves.push(new Chess.Move(from, to));
                        } else if (target >= Chess.Piece.BLACK_PAWN && target <= Chess.Piece.BLACK_KING) {
                            moves.push(new Chess.Move(from, to));
                            break;
                        } else {
                            break;
                        }
                    }
                    for (let dc = c + 1; dc < 8; dc++) {
                        const target = this.board[r][dc];
                        const to = String.fromCharCode(65 + dc) + (8 - r);
                        if (target === Chess.Piece.NONE) {
                            moves.push(new Chess.Move(from, to));
                        } else if (target >= Chess.Piece.BLACK_PAWN && target <= Chess.Piece.BLACK_KING) {
                            moves.push(new Chess.Move(from, to));
                            break;
                        } else {
                            break;
                        }
                    }
                }
                if (piece == Chess.Piece.WHITE_KNIGHT) {
                    const knightMoves = [
                    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
                    [1, -2], [1, 2], [2, -1], [2, 1]
                    ];
                    const fromKnight = String.fromCharCode(65 + c) + (8 - r);
                    for (const [dr, dc] of knightMoves) {
                        const nr = r + dr;
                        const nc = c + dc;
                        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                            const target = this.board[nr][nc];
                            if (
                            target === Chess.Piece.NONE ||
                            (target >= Chess.Piece.BLACK_PAWN && target <= Chess.Piece.BLACK_KING)
                            ) {
                            const to = String.fromCharCode(65 + nc) + (8 - nr);
                            moves.push(new Chess.Move(fromKnight, to));
                            }
                        }
                    }
                }
                if (piece == Chess.Piece.WHITE_BISHOP || piece == Chess.Piece.WHITE_QUEEN) {
                    const fromBishop = String.fromCharCode(65 + c) + (8 - r);
                    for (let dr = r - 1, dc = c - 1; dr >= 0 && dc >= 0; dr--, dc--) {
                        const target = this.board[dr][dc];
                        const to = String.fromCharCode(65 + dc) + (8 - dr);
                        if (target === Chess.Piece.NONE) {
                            moves.push(new Chess.Move(fromBishop, to));
                        } else if (target >= Chess.Piece.BLACK_PAWN && target <= Chess.Piece.BLACK_KING) {
                            moves.push(new Chess.Move(fromBishop, to));
                            break;
                        } else {
                            break;
                        }
                    }
                    for (let dr = r - 1, dc = c + 1; dr >= 0 && dc < 8; dr--, dc++) {
                        const target = this.board[dr][dc];
                        const to = String.fromCharCode(65 + dc) + (8 - dr);
                        if (target === Chess.Piece.NONE) {
                            moves.push(new Chess.Move(fromBishop, to));
                        } else if (target >= Chess.Piece.BLACK_PAWN && target <= Chess.Piece.BLACK_KING) {
                            moves.push(new Chess.Move(fromBishop, to));
                            break;
                        } else {
                            break;
                        }
                    }
                    for (let dr = r + 1, dc = c - 1; dr < 8 && dc >= 0; dr++, dc--) {
                        const target = this.board[dr][dc];
                        const to = String.fromCharCode(65 + dc) + (8 - dr);
                        if (target === Chess.Piece.NONE) {
                            moves.push(new Chess.Move(fromBishop, to));
                        } else if (target >= Chess.Piece.BLACK_PAWN && target <= Chess.Piece.BLACK_KING) {
                            moves.push(new Chess.Move(fromBishop, to));
                            break;
                        } else {
                            break;
                        }
                    }
                    for (let dr = r + 1, dc = c + 1; dr < 8 && dc < 8; dr++, dc++) {
                        const target = this.board[dr][dc];
                        const to = String.fromCharCode(65 + dc) + (8 - dr);
                        if (target === Chess.Piece.NONE) {
                            moves.push(new Chess.Move(fromBishop, to));
                        } else if (target >= Chess.Piece.BLACK_PAWN && target <= Chess.Piece.BLACK_KING) {
                            moves.push(new Chess.Move(fromBishop, to));
                            break;
                        } else {
                            break;
                        }
                    }
                }
                if (piece == Chess.Piece.WHITE_KING) {
                    const kingMoves = [
                        [-1, -1], [-1, 0], [-1, 1],
                        [0, -1],           [0, 1],
                        [1, -1],  [1, 0],  [1, 1]
                    ];
                    const fromKing = String.fromCharCode(65 + c) + (8 - r);
                    for (const [dr, dc] of kingMoves) {
                        const nr = r + dr;
                        const nc = c + dc;
                        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                            const target = this.board[nr][nc];
                            if (
                                target === Chess.Piece.NONE ||
                                (target >= Chess.Piece.BLACK_PAWN && target <= Chess.Piece.BLACK_KING)
                            ) {
                                const to = String.fromCharCode(65 + nc) + (8 - nr);
                                moves.push(new Chess.Move(fromKing, to));
                            }
                        }
                    }
                    if (includeCastling) {
                        if (this.castlingWhiteKingSide && !this.IsKingAttacked(true)) {
                            // Squares F1 and G1 must be empty and not attacked
                            if (
                                this.board[7][5] === Chess.Piece.NONE &&
                                this.board[7][6] === Chess.Piece.NONE
                            ) {
                                // Temporarily move king to F1 and G1 to check for attacks
                                let safe = true;
                                this.board[7][4] = Chess.Piece.NONE;
                                this.board[7][5] = Chess.Piece.WHITE_KING;
                                if (this.IsKingAttacked(true)) safe = false;
                                this.board[7][5] = Chess.Piece.NONE;
                                this.board[7][6] = Chess.Piece.WHITE_KING;
                                if (safe && this.IsKingAttacked(true)) safe = false;
                                this.board[7][6] = Chess.Piece.NONE;
                                this.board[7][4] = Chess.Piece.WHITE_KING;
                                if (safe) {
                                    moves.push(new Chess.Move(fromKing, "G1"));
                                }
                            }
                        }
                        if (this.castlingWhiteQueenSide && !this.IsKingAttacked(true)) {
                            // Squares D1, C1, and B1 must be empty and not attacked
                            if (
                                this.board[7][3] === Chess.Piece.NONE &&
                                this.board[7][2] === Chess.Piece.NONE &&
                                this.board[7][1] === Chess.Piece.NONE
                            ) {
                                // Temporarily move king to D1 and C1 to check for attacks
                                let safe = true;
                                this.board[7][4] = Chess.Piece.NONE;
                                this.board[7][3] = Chess.Piece.WHITE_KING;
                                if (this.IsKingAttacked(true)) safe = false;
                                this.board[7][3] = Chess.Piece.NONE;
                                this.board[7][2] = Chess.Piece.WHITE_KING;
                                if (safe && this.IsKingAttacked(true)) safe = false;
                                this.board[7][2] = Chess.Piece.NONE;
                                this.board[7][4] = Chess.Piece.WHITE_KING;
                                if (safe) {
                                    moves.push(new Chess.Move(fromKing, "C1"));
                                }
                            }
                        }
                    }
                }
            } else {
                if (piece == Chess.Piece.BLACK_PAWN) {
                    if (r < 7 && this.board[r + 1][c] === Chess.Piece.NONE) {
                        const from = String.fromCharCode(65 + c) + (8 - r);
                        const to = String.fromCharCode(65 + c) + (8 - (r + 1));
                        moves.push(new Chess.Move(from, to));
                        if (r === 1 && this.board[r + 2][c] === Chess.Piece.NONE) {
                            const to2 = String.fromCharCode(65 + c) + (8 - (r + 2));
                            moves.push(new Chess.Move(from, to2));
                        }
                    }
                    for (let dc of [-1, 1]) {
                        const nc = c + dc;
                        if (r < 7 && nc >= 0 && nc < 8) {
                            const target = this.board[r + 1][nc];
                            if (target >= Chess.Piece.WHITE_PAWN && target <= Chess.Piece.WHITE_KING) {
                            const from = String.fromCharCode(65 + c) + (8 - r);
                            const to = String.fromCharCode(65 + nc) + (8 - (r + 1));
                            moves.push(new Chess.Move(from, to));
                            }
                        }
                    }
                    if (this.enPassant && this.enPassant !== '-') {
                        const epCol = this.enPassant.charCodeAt(0) - 'A'.charCodeAt(0);
                        const epRow = 8 - parseInt(this.enPassant[1]);
                        if (r === 4 && Math.abs(c - epCol) === 1 && epRow === 5) {
                            const from = String.fromCharCode(65 + c) + (8 - r);
                            const to = String.fromCharCode(65 + epCol) + (8 - epRow);
                            moves.push(new Chess.Move(from, to));
                        }
                    }
                }
                if (piece == Chess.Piece.BLACK_ROOK || piece == Chess.Piece.BLACK_QUEEN) {
                    const from = String.fromCharCode(65 + c) + (8 - r);
                    for (let dr = r - 1; dr >= 0; dr--) {
                        const target = this.board[dr][c];
                        const to = String.fromCharCode(65 + c) + (8 - dr);
                        if (target === Chess.Piece.NONE) {
                            moves.push(new Chess.Move(from, to));
                        } else if (target >= Chess.Piece.WHITE_PAWN && target <= Chess.Piece.WHITE_KING) {
                            moves.push(new Chess.Move(from, to));
                            break;
                        } else {
                            break;
                        }
                    }
                    for (let dr = r + 1; dr < 8; dr++) {
                        const target = this.board[dr][c];
                        const to = String.fromCharCode(65 + c) + (8 - dr);
                        if (target === Chess.Piece.NONE) {
                            moves.push(new Chess.Move(from, to));
                        } else if (target >= Chess.Piece.WHITE_PAWN && target <= Chess.Piece.WHITE_KING) {
                            moves.push(new Chess.Move(from, to));
                            break;
                        } else {
                            break;
                        }
                    }
                    for (let dc = c - 1; dc >= 0; dc--) {
                        const target = this.board[r][dc];
                        const to = String.fromCharCode(65 + dc) + (8 - r);
                        if (target === Chess.Piece.NONE) {
                            moves.push(new Chess.Move(from, to));
                        } else if (target >= Chess.Piece.WHITE_PAWN && target <= Chess.Piece.WHITE_KING) {
                            moves.push(new Chess.Move(from, to));
                            break;
                        } else {
                            break;
                        }
                    }
                    for (let dc = c + 1; dc < 8; dc++) {
                        const target = this.board[r][dc];
                        const to = String.fromCharCode(65 + dc) + (8 - r);
                        if (target === Chess.Piece.NONE) {
                            moves.push(new Chess.Move(from, to));
                        } else if (target >= Chess.Piece.WHITE_PAWN && target <= Chess.Piece.WHITE_KING) {
                            moves.push(new Chess.Move(from, to));
                            break;
                        } else {
                            break;
                        }
                    }
                }
                if (piece == Chess.Piece.BLACK_KNIGHT) {
                    const knightMoves = [
                    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
                    [1, -2], [1, 2], [2, -1], [2, 1]
                    ];
                    const fromKnight = String.fromCharCode(65 + c) + (8 - r);
                    for (const [dr, dc] of knightMoves) {
                        const nr = r + dr;
                        const nc = c + dc;
                        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                            const target = this.board[nr][nc];
                            if (
                            target === Chess.Piece.NONE ||
                            (target >= Chess.Piece.WHITE_PAWN && target <= Chess.Piece.WHITE_KING)
                            ) {
                            const to = String.fromCharCode(65 + nc) + (8 - nr);
                            moves.push(new Chess.Move(fromKnight, to));
                            }
                        }
                    }
                }
                if (piece == Chess.Piece.BLACK_BISHOP || piece == Chess.Piece.BLACK_QUEEN) {
                    const fromBishop = String.fromCharCode(65 + c) + (8 - r);
                    for (let dr = r - 1, dc = c - 1; dr >= 0 && dc >= 0; dr--, dc--) {
                        const target = this.board[dr][dc];
                        const to = String.fromCharCode(65 + dc) + (8 - dr);
                        if (target === Chess.Piece.NONE) {
                            moves.push(new Chess.Move(fromBishop, to));
                        } else if (target >= Chess.Piece.WHITE_PAWN && target <= Chess.Piece.WHITE_KING) {
                            moves.push(new Chess.Move(fromBishop, to));
                            break;
                        } else {
                            break;
                        }
                    }
                    for (let dr = r - 1, dc = c + 1; dr >= 0 && dc < 8; dr--, dc++) {
                        const target = this.board[dr][dc];
                        const to = String.fromCharCode(65 + dc) + (8 - dr);
                        if (target === Chess.Piece.NONE) {
                            moves.push(new Chess.Move(fromBishop, to));
                        } else if (target >= Chess.Piece.WHITE_PAWN && target <= Chess.Piece.WHITE_KING) {
                            moves.push(new Chess.Move(fromBishop, to));
                            break;
                        } else {
                            break;
                        }
                    }
                    for (let dr = r + 1, dc = c - 1; dr < 8 && dc >= 0; dr++, dc--) {
                        const target = this.board[dr][dc];
                        const to = String.fromCharCode(65 + dc) + (8 - dr);
                        if (target === Chess.Piece.NONE) {
                            moves.push(new Chess.Move(fromBishop, to));
                        } else if (target >= Chess.Piece.WHITE_PAWN && target <= Chess.Piece.WHITE_KING) {
                            moves.push(new Chess.Move(fromBishop, to));
                            break;
                        } else {
                            break;
                        }
                    }
                    for (let dr = r + 1, dc = c + 1; dr < 8 && dc < 8; dr++, dc++) {
                        const target = this.board[dr][dc];
                        const to = String.fromCharCode(65 + dc) + (8 - dr);
                        if (target === Chess.Piece.NONE) {
                            moves.push(new Chess.Move(fromBishop, to));
                        } else if (target >= Chess.Piece.WHITE_PAWN && target <= Chess.Piece.WHITE_KING) {
                            moves.push(new Chess.Move(fromBishop, to));
                            break;
                        } else {
                            break;
                        }
                    }
                }
                if (piece == Chess.Piece.BLACK_KING) {
                    const kingMoves = [
                        [-1, -1], [-1, 0], [-1, 1],
                        [ 0, -1],          [ 0, 1],
                        [ 1, -1], [ 1, 0], [ 1, 1]
                    ];
                    const fromKing = String.fromCharCode(65 + c) + (8 - r);
                    for (const [dr, dc] of kingMoves) {
                        const nr = r + dr;
                        const nc = c + dc;
                        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                            const target = this.board[nr][nc];
                            if (
                                target === Chess.Piece.NONE ||
                                (target >= Chess.Piece.WHITE_PAWN && target <= Chess.Piece.WHITE_KING)
                            ) {
                                const to = String.fromCharCode(65 + nc) + (8 - nr);
                                moves.push(new Chess.Move(fromKing, to));
                            }
                        }
                    }
                    if (includeCastling) {
                        if (this.castlingBlackKingSide && !this.IsKingAttacked(false)) {
                            // Squares F8 and G8 must be empty and not attacked
                            if (
                                this.board[0][5] === Chess.Piece.NONE &&
                                this.board[0][6] === Chess.Piece.NONE
                            ) {
                                // Temporarily move king to F8 and G8 to check for attacks
                                let safe = true;
                                this.board[0][4] = Chess.Piece.NONE;
                                this.board[0][5] = Chess.Piece.BLACK_KING;
                                if (this.IsKingAttacked(false)) safe = false;
                                this.board[0][5] = Chess.Piece.NONE;
                                this.board[0][6] = Chess.Piece.BLACK_KING;
                                if (safe && this.IsKingAttacked(false)) safe = false;
                                this.board[0][6] = Chess.Piece.NONE;
                                this.board[0][4] = Chess.Piece.BLACK_KING;
                                if (safe) {
                                    moves.push(new Chess.Move(fromKing, "G8"));
                                }
                            }
                        }
                        if (this.castlingBlackQueenSide && !this.IsKingAttacked(false)) {
                            // Squares D8, C8, and B8 must be empty and not attacked
                            if (
                                this.board[0][3] === Chess.Piece.NONE &&
                                this.board[0][2] === Chess.Piece.NONE &&
                                this.board[0][1] === Chess.Piece.NONE
                            ) {
                                // Temporarily move king to D8 and C8 to check for attacks
                                let safe = true;
                                this.board[0][4] = Chess.Piece.NONE;
                                this.board[0][3] = Chess.Piece.BLACK_KING;
                                if (this.IsKingAttacked(false)) safe = false;
                                this.board[0][3] = Chess.Piece.NONE;
                                this.board[0][2] = Chess.Piece.BLACK_KING;
                                if (safe && this.IsKingAttacked(false)) safe = false;
                                this.board[0][2] = Chess.Piece.NONE;
                                this.board[0][4] = Chess.Piece.BLACK_KING;
                                if (safe) {
                                    moves.push(new Chess.Move(fromKing, "C8"));
                                }
                            }
                        }
                    }
                }
            }
            return moves;
        }

        GetMovesForPiece(coords) {
            const c = coords.charCodeAt(0) - 'A'.charCodeAt(0);
            const r = 8 - parseInt(coords[1]);
            const piece = this.board[r][c];
            const isWhite = this.whiteToPlay;
            let moves = this.GetPseudoLegalMovesForPiece(coords, isWhite);

            const legalMoves = [];
            for (const move of moves) {
                this.MakeMove(move.from, move.to, false);
                const kingAttacked = this.IsKingAttacked(isWhite);
                this.UndoMove();

                if (!kingAttacked) {
                    legalMoves.push(move);
                }
            }
            return legalMoves;
        }
    }
}