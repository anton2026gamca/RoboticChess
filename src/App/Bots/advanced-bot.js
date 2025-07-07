import Chess from "https://anton2026gamca.github.io/RoboticChess/src/App/chess.js";

/*
 * Advanced Strategic Chess Bot
 * 
 * This bot implements sophisticated chess strategy including:
 * - Minimax algorithm with alpha-beta pruning (3-ply search)
 * - Comprehensive position evaluation with piece-square tables
 * - Material balance assessment with standard piece values
 * - King safety and center control evaluation
 * - Tactical awareness through search tree analysis
 * - Mobility and piece activity considerations
 * 
 * Playing Style: Positional and tactical, favors piece development,
 * center control, and king safety while calculating short tactical sequences.
 */

// Piece values for material evaluation
const PIECE_VALUES = {
    [Chess.Piece.WHITE_PAWN]: 100,
    [Chess.Piece.WHITE_KNIGHT]: 320,
    [Chess.Piece.WHITE_BISHOP]: 330,
    [Chess.Piece.WHITE_ROOK]: 500,
    [Chess.Piece.WHITE_QUEEN]: 900,
    [Chess.Piece.WHITE_KING]: 20000,
    [Chess.Piece.BLACK_PAWN]: -100,
    [Chess.Piece.BLACK_KNIGHT]: -320,
    [Chess.Piece.BLACK_BISHOP]: -330,
    [Chess.Piece.BLACK_ROOK]: -500,
    [Chess.Piece.BLACK_QUEEN]: -900,
    [Chess.Piece.BLACK_KING]: -20000,
    [Chess.Piece.NONE]: 0
};

// Position bonus tables for piece-square evaluation
const PAWN_TABLE = [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5, -5,-10,  0,  0,-10, -5,  5],
    [5, 10, 10,-20,-20, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0]
];

const KNIGHT_TABLE = [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
];

const BISHOP_TABLE = [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20]
];

const ROOK_TABLE = [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [5, 10, 10, 10, 10, 10, 10,  5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [0,  0,  0,  5,  5,  0,  0,  0]
];

const QUEEN_TABLE = [
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [-5,  0,  5,  5,  5,  5,  0, -5],
    [0,  0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  0,-10],
    [-10,  0,  5,  0,  0,  0,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20]
];

const KING_TABLE = [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [20, 20,  0,  0,  0,  0, 20, 20],
    [20, 30, 10,  0,  0, 10, 30, 20]
];

/**
 * Main thinking function - evaluates position and selects best move
 */
export function think(fen) {
    const board = new Chess.Board(fen);
    const moves = board.getMoves();
    
    if (moves.length === 0) {
        return null; // No legal moves
    }
    
    if (moves.length === 1) {
        return moves[0]; // Only one move available
    }
    
    // Use minimax with alpha-beta pruning
    const depth = 3; // Adjust depth based on performance needs
    const result = minimax(board, depth, -Infinity, Infinity, board.whiteToPlay);
    
    return result.move || moves[0];
}

/**
 * Minimax algorithm with alpha-beta pruning
 */
function minimax(board, depth, alpha, beta, maximizingPlayer) {
    if (depth === 0 || board.isGameOver().over) {
        return { score: evaluatePosition(board), move: null };
    }
    
    const moves = board.getMoves();
    let bestMove = null;
    
    if (maximizingPlayer) {
        let maxEval = -Infinity;
        
        for (const move of moves) {
            // Make the move
            board.makeMove(move, false);
            
            // Recursively evaluate
            const eval_result = minimax(board, depth - 1, alpha, beta, false);
            
            // Undo the move
            board.undoMove();
            
            if (eval_result.score > maxEval) {
                maxEval = eval_result.score;
                bestMove = move;
            }
            
            alpha = Math.max(alpha, eval_result.score);
            if (beta <= alpha) {
                break; // Alpha-beta pruning
            }
        }
        
        return { score: maxEval, move: bestMove };
    } else {
        let minEval = Infinity;
        
        for (const move of moves) {
            // Make the move
            board.makeMove(move, false);
            
            // Recursively evaluate
            const eval_result = minimax(board, depth - 1, alpha, beta, true);
            
            // Undo the move
            board.undoMove();
            
            if (eval_result.score < minEval) {
                minEval = eval_result.score;
                bestMove = move;
            }
            
            beta = Math.min(beta, eval_result.score);
            if (beta <= alpha) {
                break; // Alpha-beta pruning
            }
        }
        
        return { score: minEval, move: bestMove };
    }
}

/**
 * Evaluate the current position
 */
function evaluatePosition(board) {
    const gameOver = board.isGameOver();
    
    // Handle game over positions
    if (gameOver.over) {
        if (gameOver.reason === 'checkmate') {
            return gameOver.winner === 'white' ? 10000 : -10000;
        } else {
            return 0; // Draw
        }
    }
    
    let score = 0;
    
    // Material and position evaluation
    score += evaluateMaterial(board);
    score += evaluatePosition_PieceSquare(board);
    score += evaluateKingSafety(board);
    score += evaluateCenterControl(board);
    score += evaluateMobility(board);
    
    return score;
}

/**
 * Evaluate material balance
 */
function evaluateMaterial(board) {
    let score = 0;
    
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board.board[r][c];
            score += PIECE_VALUES[piece] || 0;
        }
    }
    
    return score;
}

/**
 * Evaluate piece-square tables
 */
function evaluatePosition_PieceSquare(board) {
    let score = 0;
    
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board.board[r][c];
            if (piece === Chess.Piece.NONE) continue;
            
            const isWhite = piece <= Chess.Piece.WHITE_KING;
            const row = isWhite ? r : 7 - r; // Flip for black pieces
            
            switch (piece) {
                case Chess.Piece.WHITE_PAWN:
                    score += PAWN_TABLE[row][c];
                    break;
                case Chess.Piece.BLACK_PAWN:
                    score -= PAWN_TABLE[row][c];
                    break;
                case Chess.Piece.WHITE_KNIGHT:
                    score += KNIGHT_TABLE[row][c];
                    break;
                case Chess.Piece.BLACK_KNIGHT:
                    score -= KNIGHT_TABLE[row][c];
                    break;
                case Chess.Piece.WHITE_BISHOP:
                    score += BISHOP_TABLE[row][c];
                    break;
                case Chess.Piece.BLACK_BISHOP:
                    score -= BISHOP_TABLE[row][c];
                    break;
                case Chess.Piece.WHITE_ROOK:
                    score += ROOK_TABLE[row][c];
                    break;
                case Chess.Piece.BLACK_ROOK:
                    score -= ROOK_TABLE[row][c];
                    break;
                case Chess.Piece.WHITE_QUEEN:
                    score += QUEEN_TABLE[row][c];
                    break;
                case Chess.Piece.BLACK_QUEEN:
                    score -= QUEEN_TABLE[row][c];
                    break;
                case Chess.Piece.WHITE_KING:
                    score += KING_TABLE[row][c];
                    break;
                case Chess.Piece.BLACK_KING:
                    score -= KING_TABLE[row][c];
                    break;
            }
        }
    }
    
    return score;
}

/**
 * Evaluate king safety
 */
function evaluateKingSafety(board) {
    let score = 0;
    
    // Penalize if king is in check
    if (board.isKingAttacked(true)) {
        score -= 50;
    }
    if (board.isKingAttacked(false)) {
        score += 50;
    }
    
    return score;
}

/**
 * Evaluate center control
 */
function evaluateCenterControl(board) {
    let score = 0;
    
    // Central squares
    const centerSquares = [
        [3, 3], [3, 4], [4, 3], [4, 4] // d4, d5, e4, e5
    ];
    
    for (const [r, c] of centerSquares) {
        const piece = board.board[r][c];
        if (piece !== Chess.Piece.NONE) {
            const isWhite = piece <= Chess.Piece.WHITE_KING;
            score += isWhite ? 10 : -10;
        }
    }
    
    return score;
}

/**
 * Evaluate piece mobility (simplified)
 */
function evaluateMobility(board) {
    // Count legal moves as a simple mobility measure
    const currentPlayer = board.whiteToPlay;
    const moves = board.getMoves();
    const mobilityScore = moves.length;
    
    // Switch turns to count opponent mobility
    board.whiteToPlay = !board.whiteToPlay;
    const opponentMoves = board.getMoves();
    const opponentMobilityScore = opponentMoves.length;
    board.whiteToPlay = currentPlayer; // Restore turn
    
    return currentPlayer ? 
        (mobilityScore - opponentMobilityScore) : 
        (opponentMobilityScore - mobilityScore);
}