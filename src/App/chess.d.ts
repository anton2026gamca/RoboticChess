declare module 'https://anton2026gamca.github.io/RoboticChess/src/App/chess.js' {
    /**
     * Main Chess class containing all chess game logic
     * Handles board state, move generation, game rules, and position evaluation
     */
    namespace Chess {
        /**
         * Piece type constants for representing different chess pieces
         * Uses numeric values for efficient storage and comparison
         */
        class Piece {
            /** Empty square */
            NONE: number;
            /** White pawn */
            WHITE_PAWN: number;
            /** White rook */
            WHITE_ROOK: number;
            /** White knight */
            WHITE_KNIGHT: number;
            /** White bishop */
            WHITE_BISHOP: number;
            /** White queen */
            WHITE_QUEEN: number;
            /** White king */
            WHITE_KING: number;
            /** Black pawn */
            BLACK_PAWN: number;
            /** Black rook */
            BLACK_ROOK: number;
            /** Black knight */
            BLACK_KNIGHT: number;
            /** Black bishop */
            BLACK_BISHOP: number;
            /** Black queen */
            BLACK_QUEEN: number;
            /** Black king */
            BLACK_KING: number;
        }

        /**
         * Represents a chess move from one square to another
         * Uses algebraic notation (e.g., "E2" to "E4")
         */
        class Move {
            /**
             * Create a new chess move
             * @param from The starting square (e.g., "E2")
             * @param to The destination square (e.g., "E4")
             * @param promotion The promotion piece (Chess.Piece.WHITE_QUEEN, etc.) for pawn promotion moves
             */
            constructor(from: string, to: string, promotion?: number | null);

            /** Starting square (e.g., "E2") */
            from: string;
            /** Destination square (e.g., "E4") */
            to: string;
            /** Promotion piece (Chess.Piece.WHITE_QUEEN, etc.) for pawn promotion moves */
            promotion: number | null;
        }

        /**
         * Get the display name of a piece for UI purposes
         * @param piece The piece type constant
         * @returns Human-readable name of the piece
         */
        function getPieceName(piece: number): string;

        /**
         * Get the FEN character representation of a piece
         * @param piece The piece type constant
         * @returns FEN character for the piece
         */
        function getPieceFEN(piece: number): string;

        /**
         * Get all available promotion pieces for a given color
         * @param isWhite True for white pieces, false for black
         * @returns Array of piece constants for promotion
         */
        function getPromotionPieces(isWhite: boolean): number[];

        /**
         * Convert board coordinates to algebraic notation
         * @param r Row index (0-7)
         * @param c Column index (0-7)
         * @returns Square in algebraic notation (e.g., "E4")
         */
        function coordsToSquare(r: number, c: number): string;

        /**
         * Convert algebraic notation to board coordinates
         * @param square Square in algebraic notation (e.g., "E4")
         * @returns Object with r (row) and c (column) properties
         */
        function squareToCoords(square: string): { r: number; c: number };

        /**
         * Chess board class that handles the game state and board operations
         * Manages piece positions, game rules, move validation, and position evaluation
         */
        class Board {
            /** Standard starting position in FEN notation */
            static DefaultFEN: string;

            /**
             * Initialize a new chess board
             * @param fen FEN string representing the board position (optional)
             */
            constructor(fen?: string);

            /**
             * Load a chess position from FEN (Forsyth-Edwards Notation)
             * FEN format: pieces activeColor castling enPassant halfmove fullmove
             * @param fen The FEN string to load
             */
            loadFEN(fen: string): void;

            /**
             * Generate FEN (Forsyth-Edwards Notation) string from current board position
             * @returns Complete FEN string representing the current position
             */
            getFEN(): string;

            /**
             * Place a piece on a specific square
             * @param piece The piece type to place
             * @param square Square in algebraic notation (e.g., "E4")
             */
            setPiece(piece: number, square: string): void;

            /**
             * Get the piece on a specific square
             * @param square Square in algebraic notation (e.g., "E4")
             * @returns The piece type on that square, or NONE if empty/invalid
             */
            getPiece(square: string): number;

            /**
             * Make a move using a Move object
             * @param move The move to make
             * @param check_legal Whether to validate move legality (Used for internal reasons)
             * @returns Result object containing:
             *   - over: Whether the game is over
             *   - reason?: Reason for game over
             *   - winner?: Winner of the game
             *   - requireSync: Whether UI needs to be synchronized for special moves
             */
            makeMove(move: Chess.Move, check_legal?: boolean): {
                over: boolean;
                reason?: string | null;
                winner?: string | null;
                requireSync: boolean;
            };

            /**
             * Undo the last move made on the board
             * Restores all game state including special moves (castling, en passant, promotion)
             */
            undoMove(): void;

            /**
             * Check if the current position has insufficient material for checkmate
             * Returns true if neither side can possibly deliver checkmate
             * @returns True if insufficient material for checkmate
             */
            isInsufficientMaterial(): boolean;

            /**
             * Check if the game is over due to various end conditions
             * @returns Game over status object containing:
             *   - over: Whether the game is over
             *   - reason: Reason for game over
             *   - winner: Winner: "white", "black", or "draw"
             */
            isGameOver(): {
                over: boolean;
                reason: string | null;
                winner: string | null;
            };

            /**
             * Generate all legal moves for the current position
             * Uses caching and optimized algorithms for better performance
             * @returns Array of all legal moves
             */
            getMoves(): Chess.Move[];

            /**
             * Check if the king of the specified color is currently under attack (optimized)
             * @param isWhite True to check white king, false for black king
             * @returns True if the king is under attack
             */
            isKingAttacked(isWhite?: boolean): boolean;

            /**
             * Check for threefold repetition of the current position (optimized)
             * @returns True if threefold repetition has occurred
             */
            isThreefoldRepetition(): boolean;
        }
    }

    export default Chess;
}