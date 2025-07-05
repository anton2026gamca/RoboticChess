import Chess from "https://anton2026gamca.github.io/RoboticChess/src/App/chess.js";

/**
 * Minimax Chess Bot
 * 
 * This bot implements the classic minimax algorithm for chess move selection.
 * It searches a fixed depth ahead and evaluates positions based on material balance
 * and basic positional factors.
 * 
 * Playing Style: Tactical and material-focused, good at finding short-term tactics.
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

/** * Think function to determine the best move
 * @param {string} fen - The FEN string representing the current board state
 * @return {Chess.Move} The move to play
 */ 
export function think(fen) {
    const board = new Chess.Board(fen);
    const moves = board.GetMoves();
    
    if (moves.length === 0) {
        return null; // No legal moves
    }
    
    if (moves.length === 1) {
        return moves[0]; // Only one move available
    }

    // Use minimax algorithm with depth 3
    const depth = 3;
    const result = minimax(board, depth);
    return result.move;
}

/**
 * Minimax algorithm implementation
 * 
 * This is a recursive search algorithm that explores all possible moves
 * to a given depth and chooses the best move assuming optimal play from both sides.
 * 
 * @param {Chess.Board} board - The current board position
 * @param {number} depth - How many moves ahead to search
 * @returns {Object} Object containing the best score and corresponding move
 */
function minimax(board, depth) {
    if (depth === 0 || board.IsGameOver().over) {
        return { score: evaluatePosition(board), move: null };
    }

    const moves = board.GetMoves();
    let bestMove = null;
    
    // Maximizing player (White's turn)
    if (board.whiteToPlay) {
        let maxEval = -Infinity; // Start with worst possible score for white
        
        // Try each possible move
        for (let i = 0; i < moves.length; i++) {
            const move = moves[i];
            
            // Make the move and recursively search the resulting position
            board.MakeMove(move, false);
            const eval_result = minimax(board, depth - 1);
            board.UndoMove(); // Restore board state

            // If this move leads to a better score, remember it
            if (eval_result.score > maxEval) {
                maxEval = eval_result.score;
                bestMove = move;
            }
        }
        
        return { score: maxEval, move: bestMove };
    } else {
        // Minimizing player (Black tries to get the lowest score)
        let minEval = Infinity; // Start with worst possible score for black
        
        // Try each possible move
        for (let i = 0; i < moves.length; i++) {
            const move = moves[i];
            
            // Make the move and recursively search the resulting position
            board.MakeMove(move, false);
            const eval_result = minimax(board, depth - 1);
            board.UndoMove(); // Restore board state

            // If this move leads to a better score for black (lower number), remember it
            if (eval_result.score < minEval) {
                minEval = eval_result.score;
                bestMove = move;
            }
        }
        
        return { score: minEval, move: bestMove };
    }
}

/**
 * Evaluate the current position
 * @param {Chess.Board} board - The current chess board state
 * @returns {number} A score representing the position's favorability for White
 */
function evaluatePosition(board) {
    const gameOver = board.IsGameOver();
    
    // Handle game over positions
    if (gameOver.over) {
        if (gameOver.winner === 'draw')
            return 0; // Draw
        return gameOver.winner === 'white' ? 10000 : -10000;
    }
    
    let score = 0;
    
    // Material evaluation
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board.board[r][c];
            if (piece !== Chess.Piece.NONE) {
                const pieceValue = PIECE_VALUES[piece];
                if (pieceValue !== undefined) {
                    score += pieceValue;
                }
            }
        }
    }
    
    // Add positional bonuses
    score += evaluateKingSafety(board);
    score += evaluateCenterControl(board);
    score += evaluatePieceActivity(board);
    
    return score;
}

/**
 * Get bonus for central squares
 */
function getCentralBonus(r, c) {
    const centerDistance = Math.abs(3.5 - r) + Math.abs(3.5 - c);
    return Math.max(0, 7 - centerDistance);
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
            score += isWhite ? 10 : -10;
        }
    }
    
    return score;
}

/**
 * Evaluate piece activity and development
 */
function evaluatePieceActivity(board) {
    let score = 0;
    
    // Bonus for developed pieces (knights and bishops not on starting squares)
    const whiteKnightStart = [[7, 1], [7, 6]];
    const blackKnightStart = [[0, 1], [0, 6]];
    const whiteBishopStart = [[7, 2], [7, 5]];
    const blackBishopStart = [[0, 2], [0, 5]];
    
    // Check if knights are developed
    let whiteKnightsHome = 0;
    let blackKnightsHome = 0;
    
    for (const [r, c] of whiteKnightStart) {
        if (board.board[r][c] === Chess.Piece.WHITE_KNIGHT) {
            whiteKnightsHome++;
        }
    }
    
    for (const [r, c] of blackKnightStart) {
        if (board.board[r][c] === Chess.Piece.BLACK_KNIGHT) {
            blackKnightsHome++;
        }
    }
    
    // Penalty for undeveloped knights
    score -= whiteKnightsHome * 5;
    score += blackKnightsHome * 5;
    
    // Check if bishops are developed
    let whiteBishopsHome = 0;
    let blackBishopsHome = 0;
    
    for (const [r, c] of whiteBishopStart) {
        if (board.board[r][c] === Chess.Piece.WHITE_BISHOP) {
            whiteBishopsHome++;
        }
    }
    
    for (const [r, c] of blackBishopStart) {
        if (board.board[r][c] === Chess.Piece.BLACK_BISHOP) {
            blackBishopsHome++;
        }
    }
    
    // Penalty for undeveloped bishops
    score -= whiteBishopsHome * 5;
    score += blackBishopsHome * 5;
    
    return score;
}
