import Chess from "https://anton2026gamca.github.io/RoboticChess/src/App/chess.js";

/*
 * Alpha-Beta Pruning Chess Bot
 * 
 * This bot implements the minimax algorithm with alpha-beta pruning optimization.
 * Alpha-beta pruning allows for deeper search by eliminating branches that cannot
 * affect the final result, making it more efficient than basic minimax.
 * 
 * Playing Style: Tactical and efficient, usually faster than basic minimax.
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

/** * Think function to determine the best move
 * @param {string} fen - The FEN string representing the current board state
 * @return {Chess.Move} The move to play
 */ 
export function think(fen) {
    const board = new Chess.Board(fen);
    const moves = board.getMoves();
    
    if (moves.length === 0) {
        return null; // No legal moves (should not happen in a valid game)
    }
    
    if (moves.length === 1) {
        return moves[0]; // Only one move available
    }
    
    const depth = 3;
    const result = alphaBeta(board, depth, -Infinity, Infinity);
    
    return result.move || moves[0];
}

/**
 * Alpha-Beta pruning algorithm
 * 
 * This function implements the minimax algorithm with alpha-beta pruning optimization.
 * Alpha-beta pruning eliminates branches that cannot affect the final result, significantly
 * improving performance by reducing the number of nodes evaluated.
 * 
 * @param {Chess.Board} board - The current chess board state
 * @param {number} depth - The remaining search depth (decrements with each recursive call)
 * @param {number} alpha - The best value that the maximizing player can guarantee (lower bound)
 * @param {number} beta - The best value that the minimizing player can guarantee (upper bound)
 * @returns {Object} An object containing the best score and corresponding move
 */
function alphaBeta(board, depth, alpha, beta) {
    if (depth === 0 || board.isGameOver().over) {
        return { score: evaluatePosition(board), move: null };
    }
    
    const moves = board.getMoves();
    let bestMove = null;
    
    // Maximizing player (White's turn)
    if (board.whiteToPlay) {
        let maxEval = -Infinity; // Start with worst possible score for maximizing player
        
        // Try each possible move to find the one that gives the best score
        for (const move of moves) {
            // Make the move on the board to explore this branch
            board.makeMove(move, false);
            
            // Recursively search deeper, switching to the minimizing player
            const eval_result = alphaBeta(board, depth - 1, alpha, beta);
            
            // Undo the move to restore the board state for the next iteration
            board.undoMove();

            // Update the best move if this one gives a better score
            if (eval_result.score > maxEval) {
                maxEval = eval_result.score;
                bestMove = move;
            }
            
            // Alpha-beta pruning: update alpha (best score White can guarantee)
            alpha = Math.max(alpha, eval_result.score);
            
            // Pruning condition: if beta <= alpha, the minimizing player (Black) already
            // has a better option earlier in the tree, so we can skip remaining moves
            if (beta <= alpha) {
                break; // Alpha-beta pruning cutoff
            }
        }
        
        return { score: maxEval, move: bestMove };
    } else {
        // Minimizing player (Black's turn)
        let minEval = Infinity; // Start with worst possible score for minimizing player
        
        // Try each possible move to find the one that gives the lowest score
        for (const move of moves) {
            // Make the move on the board to explore this branch
            board.makeMove(move, false);
            
            // Recursively search deeper, switching to the maximizing player
            const eval_result = alphaBeta(board, depth - 1, alpha, beta);
            
            // Undo the move to restore the board state for the next iteration
            board.undoMove();

            // Update the best move if this one gives a lower score
            if (eval_result.score < minEval) {
                minEval = eval_result.score;
                bestMove = move;
            }
            
            // Alpha-beta pruning: update beta (best score Black can guarantee)
            beta = Math.min(beta, eval_result.score);
            
            // Pruning condition: if beta <= alpha, the maximizing player (White) already
            // has a better option earlier in the tree, so we can skip remaining moves
            if (beta <= alpha) {
                break; // Alpha-beta pruning cutoff
            }
        }
        
        return { score: minEval, move: bestMove };
    }
}

/**
 * Evaluate the current position
 * @param {Chess.Board} board - The current chess board state.
 * @returns {number} A score representing the position's favorability for white.
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
