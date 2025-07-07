import Chess from "https://anton2026gamca.github.io/RoboticChess/src/App/chess.js";

/*
 * Dummy Bot
 * 
 * This bot plays completely randomly, selecting moves at random from all legal moves.
 * It provides unpredictable gameplay and serves as a baseline for comparing other bots.
 * 
 * Playing Style: Completely random, no strategy involved.
 */

export function think(fen) {
    const board = new Chess.Board(fen);
    const moves = board.getMoves();
    
    if (moves.length === 0) {
        return null; // No legal moves
    } else if (moves.length === 1) {
        return moves[0]; // Only one move available
    }
    
    // Select a random move
    const move = moves[Math.floor(Math.random() * moves.length)];
    return move;
}
