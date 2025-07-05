import Chess from "https://anton2026gamca.github.io/RoboticChess/src/App/chess.js";

/**
 * Negamax Alpha-Beta Chess Bot
 * 
 * This bot implements the negamax algorithm with alpha-beta pruning optimization.
 * Negamax is a variant of minimax that simplifies the code by always maximizing
 * the score and negating it when switching players. This eliminates the need for
 * separate maximizing and minimizing player logic.
 * 
 * Playing Style: Tactical and efficient, equivalent to alpha-beta but with cleaner code.
 */

// Standard piece values for material evaluation
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

// Basic piece-square tables for positional evaluation
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
    [-5, 0,  0,  0,  0,  0,  0, -5],
    [-5, 0,  0,  0,  0,  0,  0, -5],
    [-5, 0,  0,  0,  0,  0,  0, -5],
    [-5, 0,  0,  0,  0,  0,  0, -5],
    [-5, 0,  0,  0,  0,  0,  0, -5],
    [0,  0,  0,  5,  5,  0,  0,  0]
];

const QUEEN_TABLE = [
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [-5,   0,  5,  5,  5,  5,  0, -5],
    [0,    0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  0,-10],
    [-10,  0,  5,  0,  0,  0,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20]
];

const KING_MIDDLE_GAME_TABLE = [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [20, 20,  0,  0,  0,  0, 20, 20],
    [20, 30, 10,  0,  0, 10, 30, 20]
];

const KING_END_GAME_TABLE = [
    [-50,-40,-30,-20,-20,-30,-40,-50],
    [-30,-20,-10,  0,  0,-10,-20,-30],
    [-30,-10, 20, 30, 30, 20,-10,-30],
    [-30,-10, 30, 40, 40, 30,-10,-30],
    [-30,-10, 30, 40, 40, 30,-10,-30],
    [-30,-10, 20, 30, 30, 20,-10,-30],
    [-30,-30,  0,  0,  0,  0,-30,-30],
    [-50,-30,-30,-30,-30,-30,-30,-50]
];

/** * Think function to determine the best move
 * @param {string} fen - The FEN string representing the current board state
 * @return {Chess.Move} The move to play
 */ 
export function think(fen) {
    const board = new Chess.Board(fen);
    const moves = board.GetMoves();
    
    if (moves.length === 0) {
        return null; // No legal moves (should not happen in a valid game)
    }
    
    if (moves.length === 1) {
        return moves[0]; // Only one move available
    }
    
    const depth = 3;
    const result = negamaxAlphaBeta(board, depth, -Infinity, Infinity);
    
    return result.move || moves[0];
}

/**
 * Negamax algorithm with alpha-beta pruning
 *
 * This function implements the negamax algorithm with alpha-beta pruning optimization.
 * Negamax simplifies the minimax algorithm by always maximizing the score and negating
 * it for the opponent's turn. This eliminates the need for separate maximizing and
 * minimizing player logic.
 * 
 * @param {Chess.Board} board - The current chess board state
 * @param {number} depth - The remaining search depth (decrements with each recursive call)
 * @param {number} alpha - The best value that the current player can guarantee (lower bound)
 * @param {number} beta - The best value that the opponent can guarantee (upper bound)
 * @returns {Object} An object containing the best score and corresponding move
 */
function negamaxAlphaBeta(board, depth, alpha, beta) {
    if (depth === 0 || board.IsGameOver().over) {
        // Evaluate from the current player's perspective
        const evaluation = evaluatePosition(board);
        const score = board.whiteToPlay ? evaluation : -evaluation;
        return { score: score, move: null };
    }
    
    const moves = board.GetMoves();
    let bestMove = null;
    let maxEval = -Infinity;
    
    // Try each possible move to find the one that gives the best score
    for (const move of moves) {
        // Make the move on the board to explore this branch
        board.MakeMove(move, false);
        
        // Recursively search deeper, negating the score for the opponent
        const eval_result = negamaxAlphaBeta(board, depth - 1, -beta, -alpha);
        const score = -eval_result.score;
        
        // Undo the move to restore the board state for the next iteration
        board.UndoMove();

        // Update the best move if this one gives a better score
        if (score > maxEval) {
            maxEval = score;
            bestMove = move;
        }
        // Alpha-beta pruning: update alpha (best score current player can guarantee)
        alpha = Math.max(alpha, score);
        
        // Pruning condition: if alpha >= beta, the opponent already has a better option
        // earlier in the tree, so we can skip remaining moves
        if (alpha >= beta) {
            break; // Alpha-beta pruning cutoff
        }
    }
    
    return { score: maxEval, move: bestMove };
}

/**
 * Evaluate the current position
 * @param {Chess.Board} board - The current chess board state.
 * @returns {number} A score representing the position's favorability for white.
 */
function evaluatePosition(board) {
    const gameOver = board.IsGameOver();
    
    // Handle game over positions
    if (gameOver.over) {
        if (gameOver.reason === 'checkmate') {
            return gameOver.winner === 'white' ? 10000 : -10000;
        } else {
            return 0; // Draw
        }
    }
    
    let score = 0;
    
    // Material and positional evaluation
    score += evaluateMaterial(board);
    score += evaluatePositionalFactors(board);
    score += evaluateKingSafety(board);
    score += evaluateCenterControl(board);

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
 * Evaluate positional factors using piece-square tables
 */
function evaluatePositionalFactors(board) {
    let score = 0;
    
    // Count material to determine if we're in endgame
    const isEndgame = isEndgamePosition(board);
    
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
                    score += isEndgame ? KING_END_GAME_TABLE[row][c] : KING_MIDDLE_GAME_TABLE[row][c];
                    break;
                case Chess.Piece.BLACK_KING:
                    score -= isEndgame ? KING_END_GAME_TABLE[row][c] : KING_MIDDLE_GAME_TABLE[row][c];
                    break;
            }
        }
    }
    
    return score;
}

/**
 * Determine if the position is in the endgame phase
 */
function isEndgamePosition(board) {
    let totalMaterial = 0;
    
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board.board[r][c];
            if (piece !== Chess.Piece.NONE && piece !== Chess.Piece.WHITE_KING && piece !== Chess.Piece.BLACK_KING) {
                totalMaterial += Math.abs(PIECE_VALUES[piece] || 0);
            }
        }
    }
    
    // Consider it endgame if total material is less than 2600 points
    // (roughly equivalent to having less than 3 minor pieces per side)
    return totalMaterial < 2600;
}

/**
 * Evaluate king safety
 */
function evaluateKingSafety(board) {
    let score = 0;
    
    // Penalize if king is in check
    if (board.IsKingAttacked(true)) {
        score -= 50;
    }
    if (board.IsKingAttacked(false)) {
        score += 50;
    }
    
    return score;
}

/**
 * Evaluate center control
 */
function evaluateCenterControl(board) {
    let score = 0;
    
    // Central squares bonus
    const centerSquares = [
        [3, 3], [3, 4], [4, 3], [4, 4] // d4, d5, e4, e5
    ];
    
    for (const [r, c] of centerSquares) {
        const piece = board.board[r][c];
        if (piece !== Chess.Piece.NONE) {
            const isWhite = piece <= Chess.Piece.WHITE_KING;
            score += isWhite ? 15 : -15;
        }
    }
    
    return score;
}
