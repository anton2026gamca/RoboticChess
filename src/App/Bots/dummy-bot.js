import Chess from "https://anton2026gamca.github.io/RoboticChess/src/App/chess.js";

export function think(fen) {
    const board = new Chess.Board(fen);
    const moves = board.GetMoves();
    const move = moves[Math.floor(Math.random() * moves.length)];
    return move;
}