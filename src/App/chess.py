"""
chess.py
Python translation of chess.js for use in Pyodide/Python bots

Types and docstrings are adapted from chess.js for clarity and compatibility.
"""


class Chess:
    class Piece:
        """
        Chess.Piece type constants for representing different chess pieces.
        Uses numeric values for efficient storage and comparison.
        """
        NONE = 0
        WHITE_PAWN = 1
        WHITE_ROOK = 2
        WHITE_KNIGHT = 3
        WHITE_BISHOP = 4
        WHITE_QUEEN = 5
        WHITE_KING = 6
        BLACK_PAWN = 7
        BLACK_ROOK = 8
        BLACK_KNIGHT = 9
        BLACK_BISHOP = 10
        BLACK_QUEEN = 11
        BLACK_KING = 12

        @staticmethod
        def get_name(piece: int) -> str:
            """
            Get the display name of a piece for UI purposes.
            Args:
                piece (int): The piece type constant.
            Returns:
                str: Human-readable name of the piece.
            """
            if piece in (Chess.Piece.WHITE_PAWN, Chess.Piece.BLACK_PAWN): return "Pawn"
            if piece in (Chess.Piece.WHITE_ROOK, Chess.Piece.BLACK_ROOK): return "Rook"
            if piece in (Chess.Piece.WHITE_KNIGHT, Chess.Piece.BLACK_KNIGHT): return "Knight"
            if piece in (Chess.Piece.WHITE_BISHOP, Chess.Piece.BLACK_BISHOP): return "Bishop"
            if piece in (Chess.Piece.WHITE_QUEEN, Chess.Piece.BLACK_QUEEN): return "Queen"
            if piece in (Chess.Piece.WHITE_KING, Chess.Piece.BLACK_KING): return "King"
            return "Unknown"

        @staticmethod
        def get_fen(piece: int) -> str:
            """
            Get the FEN character representation of a piece.
            Args:
                piece (int): The piece type constant.
            Returns:
                str: FEN character for the piece.
            """
            return {
                Chess.Piece.WHITE_PAWN: "P", Chess.Piece.WHITE_ROOK: "R", Chess.Piece.WHITE_KNIGHT: "N", Chess.Piece.WHITE_BISHOP: "B", Chess.Piece.WHITE_QUEEN: "Q", Chess.Piece.WHITE_KING: "K",
                Chess.Piece.BLACK_PAWN: "p", Chess.Piece.BLACK_ROOK: "r", Chess.Piece.BLACK_KNIGHT: "n", Chess.Piece.BLACK_BISHOP: "b", Chess.Piece.BLACK_QUEEN: "q", Chess.Piece.BLACK_KING: "k"
            }.get(piece, "")

        @staticmethod
        def get_promotion_pieces(is_white: bool) -> list:
            """
            Get all available promotion pieces for a given color.
            Args:
                is_white (bool): True for white pieces, False for black.
            Returns:
                list: List of piece constants for promotion.
            """
            return [Chess.Piece.WHITE_QUEEN, Chess.Piece.WHITE_ROOK, Chess.Piece.WHITE_BISHOP, Chess.Piece.WHITE_KNIGHT] if is_white else [Chess.Piece.BLACK_QUEEN, Chess.Piece.BLACK_ROOK, Chess.Piece.BLACK_BISHOP, Chess.Piece.BLACK_KNIGHT]

    FILES = ['A','B','C','D','E','F','G','H']
    RANKS = ['8','7','6','5','4','3','2','1']


    def coords_to_square(r: int, c: int) -> str:
        """
        Convert board coordinates to algebraic notation.
        Args:
            r (int): Row index (0-7).
            c (int): Column index (0-7).
        Returns:
            str: Square in algebraic notation (e.g., "E4").
        """
        return Chess.FILES[c] + Chess.RANKS[r]

    def square_to_coords(square: str) -> dict:
        """
        Convert algebraic notation to board coordinates.
        Args:
            square (str): Square in algebraic notation (e.g., "E4").
        Returns:
            dict: Dictionary with 'r' (row) and 'c' (column) properties.
        """
        return {'r': 8 - int(square[1]), 'c': ord(square[0]) - 65}

    class Move:
        """
        Represents a chess move from one square to another.
        Uses algebraic notation (e.g., "E2" to "E4").
        """
        def __init__(self, from_sq: str, to_sq: str, promotion: int = None):
            """
            Create a new chess move.
            Args:
                from_sq (str): The starting square (e.g., "E2").
                to_sq (str): The destination square (e.g., "E4").
                promotion (int, optional): The promotion piece (Chess.Piece.WHITE_QUEEN, etc.) for pawn promotion moves.
            """
            self.from_sq = from_sq
            self.to_sq = to_sq
            self.promotion = promotion
        def __eq__(self, other) -> bool:
            return self.from_sq == other.from_sq and self.to_sq == other.to_sq and self.promotion == other.promotion

        def __repr__(self) -> str:
            move_str = f"{self.from_sq.lower()}{self.to_sq.lower()}"
            if self.promotion is not None and self.promotion != Chess.Piece.NONE:
                move_str += str(self.promotion)
            return move_str

    class Board:
        """
        Chess board class that handles the game state and board operations.
        Manages piece positions, game rules, move validation, and position evaluation.
        """
        DefaultFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

        def __init__(self, fen: str = None):
            """
            Initialize a new chess board.
            Args:
                fen (str, optional): FEN string representing the board position.
            """
            self.board = [[Chess.Piece.NONE for _ in range(8)] for _ in range(8)]
            self._moves_cache = {'hash': None, 'moves': None}
            self._king_positions = {'white': None, 'black': None}
            self.position_history = []
            self.move_history = []
            self.white_time: int | None = None
            self.black_time: int | None = None
            self.timers_enabled = False
            self.timeout_result = None  # { winner, reason } if timeout occurs
            self.load_fen(fen or Chess.Board.DefaultFEN)

        def set_timers(self, white_ms: int = None, black_ms: int = None):
            """
            Set timers for both players (in milliseconds).
            Args:
                white_ms (int|None): Time for white in ms, or None for no timer.
                black_ms (int|None): Time for black in ms, or None for no timer.
            """
            self.white_time = white_ms
            self.black_time = black_ms
            self.timers_enabled = (white_ms is not None or black_ms is not None)
            self.timeout_result = None

        def decrement_current_player_timer(self, ms: int) -> bool:
            """
            Decrement the current player's timer by ms. Returns True if timeout occurred.
            Args:
                ms (int): Milliseconds to decrement.
            Returns:
                bool: True if timeout occurred.
            """
            if not self.timers_enabled:
                return False
            if self.white_to_play and self.white_time is not None:
                self.white_time -= ms
                if self.white_time <= 0:
                    self.white_time = 0
                    self.timeout_result = { 'winner': 'black', 'reason': 'timeout' }
                    return True
            elif not self.white_to_play and self.black_time is not None:
                self.black_time -= ms
                if self.black_time <= 0:
                    self.black_time = 0
                    self.timeout_result = { 'winner': 'white', 'reason': 'timeout' }
                    return True
            return False

        def get_player_time(self, is_white: bool) -> int:
            """
            Get the remaining time for a player (ms).
            Args:
                is_white (bool): True for white, False for black.
            Returns:
                int|None: Remaining time in ms, or None if no timer.
            """
            return self.white_time if is_white else self.black_time

        def load_fen(self, fen: str):
            """
            Load a chess position from FEN (Forsyth-Edwards Notation).
            FEN format: pieces activeColor castling enPassant halfmove fullmove
            Args:
                fen (str): The FEN string to load.
            """
            parts = fen.split(' ')
            piece_placement, active_color, castling, en_passant = parts[:4]
            self.white_to_play = (active_color == 'w')
            self.castling_rights = 0
            if 'K' in castling: self.castling_rights |= 1
            if 'Q' in castling: self.castling_rights |= 2
            if 'k' in castling: self.castling_rights |= 4
            if 'q' in castling: self.castling_rights |= 8
            self.en_passant = None if en_passant == '-' else en_passant
            self.halfmove = int(parts[4]) if len(parts) > 4 else 0
            self.fullmove = int(parts[5]) if len(parts) > 5 else 1
            for r in range(8):
                for c in range(8):
                    self.board[r][c] = Chess.Piece.NONE
            piece_map = {'P': Chess.Piece.WHITE_PAWN, 'N': Chess.Piece.WHITE_KNIGHT, 'B': Chess.Piece.WHITE_BISHOP, 'R': Chess.Piece.WHITE_ROOK, 'Q': Chess.Piece.WHITE_QUEEN, 'K': Chess.Piece.WHITE_KING,
                        'p': Chess.Piece.BLACK_PAWN, 'n': Chess.Piece.BLACK_KNIGHT, 'b': Chess.Piece.BLACK_BISHOP, 'r': Chess.Piece.BLACK_ROOK, 'q': Chess.Piece.BLACK_QUEEN, 'k': Chess.Piece.BLACK_KING}
            rows = piece_placement.split('/')
            for r in range(8):
                c = 0
                for ch in rows[r]:
                    if ch.isdigit():
                        c += int(ch)
                    else:
                        self.board[r][c] = piece_map.get(ch, Chess.Piece.NONE)
                        c += 1
            self._update_king_positions()
            self.position_history = [self._get_position_hash()]

        def _update_king_positions(self):
            """
            Helper method to update king positions cache for performance optimization.
            """
            self._king_positions['white'] = None
            self._king_positions['black'] = None
            for r in range(8):
                for c in range(8):
                    piece = self.board[r][c]
                    if piece == Chess.Piece.WHITE_KING:
                        self._king_positions['white'] = {'r': r, 'c': c}
                    elif piece == Chess.Piece.BLACK_KING:
                        self._king_positions['black'] = {'r': r, 'c': c}

        def get_fen(self) -> str:
            """
            Generate FEN (Forsyth-Edwards Notation) string from current board position.
            Returns:
                str: Complete FEN string representing the current position.
            """
            fen = ''
            for r in range(8):
                empty = 0
                for c in range(8):
                    piece = self.board[r][c]
                    ch = Chess.Piece.get_fen(piece)
                    if ch == '':
                        empty += 1
                    else:
                        if empty > 0:
                            fen += str(empty)
                            empty = 0
                        fen += ch
                if empty > 0:
                    fen += str(empty)
                if r < 7:
                    fen += '/'
            fen += ' ' + ('w' if self.white_to_play else 'b')
            castling = ''
            if self.castling_rights & 1: castling += 'K'
            if self.castling_rights & 2: castling += 'Q'
            if self.castling_rights & 4: castling += 'k'
            if self.castling_rights & 8: castling += 'q'
            fen += ' ' + (castling if castling else '-')
            fen += ' ' + (self.en_passant.lower() if self.en_passant else '-')
            fen += ' ' + str(self.halfmove)
            fen += ' ' + str(self.fullmove)
            return fen

        def set_piece(self, piece: int, square: str):
            """
            Place a piece on a specific square.
            Args:
                piece (int): The piece type to place.
                square (str): Square in algebraic notation (e.g., "E4").
            """
            if not square: return
            coords = Chess.square_to_coords(square)
            r, c = coords['r'], coords['c']
            if 0 <= r < 8 and 0 <= c < 8:
                self.board[r][c] = piece
                if piece == Chess.Piece.WHITE_KING:
                    self._king_positions['white'] = coords
                elif piece == Chess.Piece.BLACK_KING:
                    self._king_positions['black'] = coords

        def get_piece(self, square: str) -> int:
            """
            Get the piece on a specific square.
            Args:
                square (str): Square in algebraic notation (e.g., "E4").
            Returns:
                int: The piece type on that square, or NONE if empty/invalid.
            """
            if not square: return Chess.Piece.NONE
            coords = Chess.square_to_coords(square)
            r, c = coords['r'], coords['c']
            if 0 <= r < 8 and 0 <= c < 8:
                return self.board[r][c]
            return Chess.Piece.NONE

        def make_move(self, move, check_legal: bool = True) -> dict:
            """
            Make a move using a Chess.Move object.
            Args:
                move (Chess.Move): The move to make.
                check_legal (bool): Whether to validate move legality (used for internal reasons).
            Returns:
                dict: Result object containing:
                    - over (bool): Whether the game is over
                    - reason (str|None): Reason for game over
                    - winner (str|None): Winner of the game
                    - require_sync (bool): Whether UI needs to be synchronized for special moves
            """
            initial_game_over = self.is_game_over()
            if initial_game_over['over']:
                return {**initial_game_over, 'require_sync': False}
            if check_legal:
                legal_moves = self.get_moves()
                if not any(m.from_sq == move.from_sq and m.to_sq == move.to_sq for m in legal_moves):
                    return {'over': True, 'reason': 'illegal move', 'winner': 'black' if self.white_to_play else 'white', 'require_sync': False}
            require_sync = False
            from_piece = self.get_piece(move.from_sq)
            to_piece = self.get_piece(move.to_sq)
            old_castling_rights = self.castling_rights
            prev_en_passant = self.en_passant
            castling_move = False
            en_passant_capture = False
            promotion = None
            promoted_piece = None
            # Castling
            if from_piece == Chess.Piece.WHITE_KING and move.from_sq == 'E1':
                if move.to_sq == 'G1' and (self.castling_rights & 1):
                    self.set_piece(Chess.Piece.WHITE_KING, 'G1')
                    self.set_piece(Chess.Piece.NONE, 'E1')
                    self.set_piece(Chess.Piece.WHITE_ROOK, 'F1')
                    self.set_piece(Chess.Piece.NONE, 'H1')
                    castling_move = True
                elif move.to_sq == 'C1' and (self.castling_rights & 2):
                    self.set_piece(Chess.Piece.WHITE_KING, 'C1')
                    self.set_piece(Chess.Piece.NONE, 'E1')
                    self.set_piece(Chess.Piece.WHITE_ROOK, 'D1')
                    self.set_piece(Chess.Piece.NONE, 'A1')
                    castling_move = True
                self.castling_rights &= ~3
            elif from_piece == Chess.Piece.BLACK_KING and move.from_sq == 'E8':
                if move.to_sq == 'G8' and (self.castling_rights & 4):
                    self.set_piece(Chess.Piece.BLACK_KING, 'G8')
                    self.set_piece(Chess.Piece.NONE, 'E8')
                    self.set_piece(Chess.Piece.BLACK_ROOK, 'F8')
                    self.set_piece(Chess.Piece.NONE, 'H8')
                    castling_move = True
                elif move.to_sq == 'C8' and (self.castling_rights & 8):
                    self.set_piece(Chess.Piece.BLACK_KING, 'C8')
                    self.set_piece(Chess.Piece.NONE, 'E8')
                    self.set_piece(Chess.Piece.BLACK_ROOK, 'D8')
                    self.set_piece(Chess.Piece.NONE, 'A8')
                    castling_move = True
                self.castling_rights &= ~12
            # Rook move/capture updates
            if from_piece == Chess.Piece.WHITE_ROOK and move.from_sq == 'A1': self.castling_rights &= ~2
            if from_piece == Chess.Piece.WHITE_ROOK and move.from_sq == 'H1': self.castling_rights &= ~1
            if from_piece == Chess.Piece.BLACK_ROOK and move.from_sq == 'A8': self.castling_rights &= ~8
            if from_piece == Chess.Piece.BLACK_ROOK and move.from_sq == 'H8': self.castling_rights &= ~4
            if move.to_sq == 'A1' and to_piece == Chess.Piece.WHITE_ROOK: self.castling_rights &= ~2
            if move.to_sq == 'H1' and to_piece == Chess.Piece.WHITE_ROOK: self.castling_rights &= ~1
            if move.to_sq == 'A8' and to_piece == Chess.Piece.BLACK_ROOK: self.castling_rights &= ~8
            if move.to_sq == 'H8' and to_piece == Chess.Piece.BLACK_ROOK: self.castling_rights &= ~4
            # En passant
            self.en_passant = None
            if from_piece == Chess.Piece.WHITE_PAWN:
                if move.from_sq[1] == '2' and move.to_sq[1] == '4':
                    self.en_passant = move.from_sq[0] + '3'
                if move.to_sq == prev_en_passant and move.from_sq[0] != move.to_sq[0]:
                    cap_sq = move.to_sq[0] + str(int(move.to_sq[1]) - 1)
                    self.set_piece(Chess.Piece.NONE, cap_sq)
                    en_passant_capture = True
            if from_piece == Chess.Piece.BLACK_PAWN:
                if move.from_sq[1] == '7' and move.to_sq[1] == '5':
                    self.en_passant = move.from_sq[0] + '6'
                if move.to_sq == prev_en_passant and move.from_sq[0] != move.to_sq[0]:
                    cap_sq = move.to_sq[0] + str(int(move.to_sq[1]) + 1)
                    self.set_piece(Chess.Piece.NONE, cap_sq)
                    en_passant_capture = True
            # Promotion
            if from_piece == Chess.Piece.WHITE_PAWN and move.to_sq[1] == '8':
                promoted_piece = move.promotion or Chess.Piece.WHITE_QUEEN
                promotion = promoted_piece
            elif from_piece == Chess.Piece.BLACK_PAWN and move.to_sq[1] == '1':
                promoted_piece = move.promotion or Chess.Piece.BLACK_QUEEN
                promotion = promoted_piece
            if castling_move or en_passant_capture or promotion:
                require_sync = True
            if not castling_move:
                if promotion:
                    self.set_piece(promoted_piece, move.to_sq)
                    self.set_piece(Chess.Piece.NONE, move.from_sq)
                else:
                    self.set_piece(from_piece, move.to_sq)
                    self.set_piece(Chess.Piece.NONE, move.from_sq)
            self.move_history.append({'move': Chess.Move(move.from_sq, move.to_sq), 'from_piece': from_piece, 'to_piece': to_piece, 'castling_move': castling_move, 'en_passant_capture': en_passant_capture, 'prev_en_passant': prev_en_passant, 'castling_rights': old_castling_rights, 'halfmove': self.halfmove, 'fullmove': self.fullmove, 'promotion': promotion})
            if from_piece in (Chess.Piece.WHITE_PAWN, Chess.Piece.BLACK_PAWN) or to_piece != Chess.Piece.NONE or en_passant_capture:
                self.halfmove = 0
            else:
                self.halfmove += 1
            if not self.white_to_play:
                self.fullmove += 1
            self.white_to_play = not self.white_to_play
            self.position_history.append(self._get_position_hash())
            final_game_over = self.is_game_over()
            if final_game_over['over']:
                return {**final_game_over, 'require_sync': require_sync}
            return {'over': False, 'reason': None, 'winner': None, 'require_sync': require_sync}

        def undo_move(self):
            """
            Undo the last move made on the board.
            Restores all game state including special moves (castling, en passant, promotion).
            """
            if not self.move_history: return
            last = self.move_history.pop()
            if last['promotion']:
                self.set_piece(last['from_piece'], last['move'].from_sq)
                self.set_piece(last['to_piece'], last['move'].to_sq)
            else:
                self.set_piece(last['from_piece'], last['move'].from_sq)
                self.set_piece(last['to_piece'], last['move'].to_sq)
            if last['castling_move']:
                if last['move'].from_sq == 'E1' and last['move'].to_sq == 'G1':
                    self.set_piece(Chess.Piece.WHITE_ROOK, 'H1')
                    self.set_piece(Chess.Piece.NONE, 'F1')
                elif last['move'].from_sq == 'E1' and last['move'].to_sq == 'C1':
                    self.set_piece(Chess.Piece.WHITE_ROOK, 'A1')
                    self.set_piece(Chess.Piece.NONE, 'D1')
                elif last['move'].from_sq == 'E8' and last['move'].to_sq == 'G8':
                    self.set_piece(Chess.Piece.BLACK_ROOK, 'H8')
                    self.set_piece(Chess.Piece.NONE, 'F8')
                elif last['move'].from_sq == 'E8' and last['move'].to_sq == 'C8':
                    self.set_piece(Chess.Piece.BLACK_ROOK, 'A8')
                    self.set_piece(Chess.Piece.NONE, 'D8')
            if last['en_passant_capture']:
                if last['from_piece'] == Chess.Piece.WHITE_PAWN:
                    cap_sq = last['move'].to_sq[0] + str(int(last['move'].to_sq[1]) - 1)
                    self.set_piece(Chess.Piece.BLACK_PAWN, cap_sq)
                elif last['from_piece'] == Chess.Piece.BLACK_PAWN:
                    cap_sq = last['move'].to_sq[0] + str(int(last['move'].to_sq[1]) + 1)
                    self.set_piece(Chess.Piece.WHITE_PAWN, cap_sq)
            self.castling_rights = last['castling_rights']
            self.en_passant = last['prev_en_passant']
            self.halfmove = last['halfmove']
            self.fullmove = last['fullmove']
            self.white_to_play = not self.white_to_play
            if self.position_history:
                self.position_history.pop()

        def is_insufficient_material(self) -> bool:
            """
            Check if the current position has insufficient material for checkmate.
            Returns:
                bool: True if neither side can possibly deliver checkmate.
            """
            white_bishops = black_bishops = white_knights = black_knights = white_other = black_other = 0
            for r in range(8):
                for c in range(8):
                    piece = self.board[r][c]
                    if piece == Chess.Piece.WHITE_PAWN or piece == Chess.Piece.WHITE_ROOK or piece == Chess.Piece.WHITE_QUEEN:
                        white_other += 1
                    elif piece == Chess.Piece.BLACK_PAWN or piece == Chess.Piece.BLACK_ROOK or piece == Chess.Piece.BLACK_QUEEN:
                        black_other += 1
                    elif piece == Chess.Piece.WHITE_BISHOP:
                        white_bishops += 1
                    elif piece == Chess.Piece.BLACK_BISHOP:
                        black_bishops += 1
                    elif piece == Chess.Piece.WHITE_KNIGHT:
                        white_knights += 1
                    elif piece == Chess.Piece.BLACK_KNIGHT:
                        black_knights += 1
            if white_other == black_other == white_bishops == black_bishops == white_knights == black_knights == 0:
                return True
            if white_other == black_other == 0 and ((white_bishops == 1 and white_knights == black_bishops == black_knights == 0) or (black_bishops == 1 and black_knights == white_bishops == white_knights == 0)):
                return True
            if white_other == black_other == 0 and ((white_knights == 1 and white_bishops == black_bishops == black_knights == 0) or (black_knights == 1 and black_bishops == white_bishops == white_knights == 0)):
                return True
            if white_other == black_other == 0 and white_knights == black_knights == 0 and white_bishops + black_bishops > 1:
                bishop_colors = []
                for r in range(8):
                    for c in range(8):
                        piece = self.board[r][c]
                        if piece == Chess.Piece.WHITE_BISHOP or piece == Chess.Piece.BLACK_BISHOP:
                            bishop_colors.append((r + c) % 2)
                if bishop_colors and all(color == bishop_colors[0] for color in bishop_colors):
                    return True
            return False

        def is_game_over(self) -> dict:
            """
            Check if the game is over due to various end conditions.
            Returns:
                dict: Game over status object containing:
                    - over (bool): Whether the game is over
                    - reason (str|None): Reason for game over
                    - winner (str|None): Winner: "white", "black", or "draw"
            """
            if self.timers_enabled and self.timeout_result:
                return { 'over': True, 'reason': self.timeout_result['reason'], 'winner': self.timeout_result['winner'] }
            if self.halfmove >= 100:
                return {'over': True, 'reason': '50-move rule', 'winner': 'draw'}
            if self.is_insufficient_material():
                return {'over': True, 'reason': 'insufficient material', 'winner': 'draw'}
            if self.is_threefold_repetition():
                return {'over': True, 'reason': 'threefold repetition', 'winner': 'draw'}
            moves = self.get_moves()
            if not moves:
                if self.is_king_attacked(self.white_to_play):
                    return {'over': True, 'reason': 'checkmate', 'winner': 'black' if self.white_to_play else 'white'}
                else:
                    return {'over': True, 'reason': 'stalemate', 'winner': 'draw'}
            return {'over': False, 'reason': None, 'winner': None}

        def get_moves(self) -> list:
            """
            Generate all legal moves for the current position.
            Returns:
                list: List of all legal Chess.Move objects.
            """
            position_hash = self._get_position_hash()
            if self._moves_cache['hash'] == position_hash:
                return self._moves_cache['moves']
            moves = []
            is_white = self.white_to_play
            for r in range(8):
                for c in range(8):
                    piece = self.board[r][c]
                    if piece == Chess.Piece.NONE: continue
                    piece_is_white = piece <= Chess.Piece.WHITE_KING
                    if piece_is_white != is_white: continue
                    self._generate_moves_for_piece(r, c, piece, moves)
            legal_moves = self._filter_legal_moves(moves)
            self._moves_cache = {'hash': position_hash, 'moves': legal_moves}
            return legal_moves

        def _generate_moves_for_piece(self, r: int, c: int, piece: int, moves: list):
            """
            Generate moves for a piece at given coordinates.
            Args:
                r (int): Row coordinate (0-7)
                c (int): Column coordinate (0-7)
                piece (int): Chess.Piece type constant
                moves (list): List to add generated moves to
            """
            from_sq = Chess.coords_to_square(r, c)
            is_white = piece <= Chess.Piece.WHITE_KING
            if piece in (Chess.Piece.WHITE_PAWN, Chess.Piece.BLACK_PAWN):
                self._generate_pawn_moves(r, c, from_sq, is_white, moves)
            elif piece in (Chess.Piece.WHITE_ROOK, Chess.Piece.BLACK_ROOK):
                self._generate_rook_moves(r, c, from_sq, is_white, moves)
            elif piece in (Chess.Piece.WHITE_KNIGHT, Chess.Piece.BLACK_KNIGHT):
                self._generate_knight_moves(r, c, from_sq, is_white, moves)
            elif piece in (Chess.Piece.WHITE_BISHOP, Chess.Piece.BLACK_BISHOP):
                self._generate_bishop_moves(r, c, from_sq, is_white, moves)
            elif piece in (Chess.Piece.WHITE_QUEEN, Chess.Piece.BLACK_QUEEN):
                self._generate_queen_moves(r, c, from_sq, is_white, moves)
            elif piece in (Chess.Piece.WHITE_KING, Chess.Piece.BLACK_KING):
                self._generate_king_moves(r, c, from_sq, is_white, moves)

        def is_king_attacked(self, is_white: bool = None) -> bool:
            """
            Check if the king of the specified color is currently under attack.
            Args:
                is_white (bool, optional): True to check white king, False for black king. Defaults to current turn.
            Returns:
                bool: True if the king is under attack.
            """
            if is_white is None:
                is_white = self.white_to_play
            king_pos = self._king_positions['white' if is_white else 'black']
            if not king_pos: return False
            return self._is_square_attacked(king_pos['r'], king_pos['c'], not is_white)

        def _filter_legal_moves(self, moves: list) -> list:
            """
            Filter pseudo-legal moves to only include legal moves.
            Args:
                moves (list): List of pseudo-legal moves to filter.
            Returns:
                list: List of legal moves.
            """
            legal_moves = []
            king_pos = self._king_positions['white' if self.white_to_play else 'black']
            for move in moves:
                if self._is_move_legal(move, king_pos):
                    legal_moves.append(move)
            return legal_moves

        def _is_move_legal(self, move, king_pos) -> bool:
            """
            Check if a move is legal (doesn't leave king in check).
            Args:
                move (Chess.Move): The move to test.
                king_pos (dict): Current king position with 'r' and 'c' properties.
            Returns:
                bool: True if the move is legal.
            """
            from_coords = Chess.square_to_coords(move.from_sq)
            to_coords = Chess.square_to_coords(move.to_sq)
            from_piece = self.board[from_coords['r']][from_coords['c']]
            to_piece = self.board[to_coords['r']][to_coords['c']]
            self.board[from_coords['r']][from_coords['c']] = Chess.Piece.NONE
            self.board[to_coords['r']][to_coords['c']] = from_piece
            new_king_pos = king_pos
            if from_piece in (Chess.Piece.WHITE_KING, Chess.Piece.BLACK_KING):
                new_king_pos = to_coords
            is_legal = not self._is_square_attacked(new_king_pos['r'], new_king_pos['c'], not self.white_to_play)
            self.board[from_coords['r']][from_coords['c']] = from_piece
            self.board[to_coords['r']][to_coords['c']] = to_piece
            return is_legal

        def _is_square_attacked(self, r: int, c: int, by_white: bool) -> bool:
            """
            Check if a square is attacked by the opponent.
            Args:
                r (int): Row coordinate (0-7)
                c (int): Column coordinate (0-7)
                by_white (bool): True if checking for white attacks, False for black
            Returns:
                bool: True if the square is under attack.
            """
            attacker_start = Chess.Piece.WHITE_PAWN if by_white else Chess.Piece.BLACK_PAWN
            attacker_end = Chess.Piece.WHITE_KING if by_white else Chess.Piece.BLACK_KING
            pawn_dir = 1 if by_white else -1
            pawn_r = r + pawn_dir
            if 0 <= pawn_r < 8:
                for dc in [-1, 1]:
                    pawn_c = c + dc
                    if 0 <= pawn_c < 8:
                        piece = self.board[pawn_r][pawn_c]
                        if piece == (Chess.Piece.WHITE_PAWN if by_white else Chess.Piece.BLACK_PAWN):
                            return True
            knight_moves = [(-2,-1),(-2,1),(-1,-2),(-1,2),(1,-2),(1,2),(2,-1),(2,1)]
            for dr, dc in knight_moves:
                nr, nc = r+dr, c+dc
                if 0<=nr<8 and 0<=nc<8:
                    piece = self.board[nr][nc]
                    if piece == (Chess.Piece.WHITE_KNIGHT if by_white else Chess.Piece.BLACK_KNIGHT):
                        return True
            directions = [(0,1),(0,-1),(1,0),(-1,0),(1,1),(1,-1),(-1,1),(-1,-1)]
            for i, (dr, dc) in enumerate(directions):
                is_rook_dir = i < 4
                nr, nc = r+dr, c+dc
                while 0<=nr<8 and 0<=nc<8:
                    piece = self.board[nr][nc]
                    if piece != Chess.Piece.NONE:
                        if attacker_start <= piece <= attacker_end:
                            if piece == (Chess.Piece.WHITE_QUEEN if by_white else Chess.Piece.BLACK_QUEEN) or (is_rook_dir and piece == (Chess.Piece.WHITE_ROOK if by_white else Chess.Piece.BLACK_ROOK)) or (not is_rook_dir and piece == (Chess.Piece.WHITE_BISHOP if by_white else Chess.Piece.BLACK_BISHOP)):
                                return True
                        break
                    nr += dr
                    nc += dc
            king_moves = [(-1,-1),(-1,0),(-1,1),(0,-1),(0,1),(1,-1),(1,0),(1,1)]
            for dr, dc in king_moves:
                nr, nc = r+dr, c+dc
                if 0<=nr<8 and 0<=nc<8:
                    piece = self.board[nr][nc]
                    if piece == (Chess.Piece.WHITE_KING if by_white else Chess.Piece.BLACK_KING):
                        return True
            return False

        def _get_position_hash(self) -> str:
            """
            Get a hash of the current position for caching and repetition detection.
            Returns:
                str: Unique hash string representing the current position.
            """
            hashval = 'w' if self.white_to_play else 'b'
            hashval += '|' + str(self.castling_rights)
            hashval += '|' + (self.en_passant or '-')
            hashval += '|'
            for r in range(8):
                for c in range(8):
                    hashval += str(self.board[r][c])
                    if c < 7: hashval += ','
                if r < 7: hashval += '/'
            return hashval

        def is_threefold_repetition(self) -> bool:
            """
            Check for threefold repetition of the current position.
            Returns:
                bool: True if threefold repetition has occurred.
            """
            if len(self.position_history) < 4:
                return False
            current_hash = self._get_position_hash()
            count = sum(1 for h in self.position_history if h == current_hash)
            return count >= 3

        def _generate_pawn_moves(self, r: int, c: int, from_sq: str, is_white: bool, moves: list):
            """
            Generate pawn moves optimized for performance.
            Args:
                r (int): Row coordinate of the pawn
                c (int): Column coordinate of the pawn
                from_sq (str): Square in algebraic notation
                is_white (bool): True for white pawn, False for black
                moves (list): List to add generated moves to
            """
            direction = -1 if is_white else 1
            start_rank = 6 if is_white else 1
            promotion_rank = 0 if is_white else 7
            enemy_start = Chess.Piece.BLACK_PAWN if is_white else Chess.Piece.WHITE_PAWN
            enemy_end = Chess.Piece.BLACK_KING if is_white else Chess.Piece.WHITE_KING
            new_r = r + direction
            if 0 <= new_r < 8 and self.board[new_r][c] == Chess.Piece.NONE:
                to = Chess.coords_to_square(new_r, c)
                if new_r == promotion_rank:
                    for piece in Chess.Piece.get_promotion_pieces(is_white):
                        moves.append(Chess.Move(from_sq, to, piece))
                else:
                    moves.append(Chess.Move(from_sq, to))
                    if r == start_rank and self.board[r + 2*direction][c] == Chess.Piece.NONE:
                        moves.append(Chess.Move(from_sq, Chess.coords_to_square(r + 2*direction, c)))
            for dc in [-1, 1]:
                new_c = c + dc
                if 0 <= new_r < 8 and 0 <= new_c < 8:
                    target = self.board[new_r][new_c]
                    if enemy_start <= target <= enemy_end:
                        to = Chess.coords_to_square(new_r, new_c)
                        if new_r == promotion_rank:
                            for piece in Chess.Piece.get_promotion_pieces(is_white):
                                moves.append(Chess.Move(from_sq, to, piece))
                        else:
                            moves.append(Chess.Move(from_sq, to))
            if self.en_passant:
                ep_coords = Chess.square_to_coords(self.en_passant)
                correct_rank = 3 if is_white else 4
                if r == correct_rank and abs(c - ep_coords['c']) == 1:
                    moves.append(Chess.Move(from_sq, self.en_passant))

        def _generate_rook_moves(self, r: int, c: int, from_sq: str, is_white: bool, moves: list):
            """
            Generate rook moves optimized for performance.
            Args:
                r (int): Row coordinate of the rook
                c (int): Column coordinate of the rook
                from_sq (str): Square in algebraic notation
                is_white (bool): True for white rook, False for black
                moves (list): List to add generated moves to
            """
            directions = [(0,1),(0,-1),(1,0),(-1,0)]
            self._generate_sliding_moves(r, c, from_sq, is_white, directions, moves)

        def _generate_bishop_moves(self, r: int, c: int, from_sq: str, is_white: bool, moves: list):
            """
            Generate bishop moves optimized for performance.
            Args:
                r (int): Row coordinate of the bishop
                c (int): Column coordinate of the bishop
                from_sq (str): Square in algebraic notation
                is_white (bool): True for white bishop, False for black
                moves (list): List to add generated moves to
            """
            directions = [(1,1),(1,-1),(-1,1),(-1,-1)]
            self._generate_sliding_moves(r, c, from_sq, is_white, directions, moves)

        def _generate_queen_moves(self, r: int, c: int, from_sq: str, is_white: bool, moves: list):
            """
            Generate queen moves optimized for performance.
            Args:
                r (int): Row coordinate of the queen
                c (int): Column coordinate of the queen
                from_sq (str): Square in algebraic notation
                is_white (bool): True for white queen, False for black
                moves (list): List to add generated moves to
            """
            directions = [(0,1),(0,-1),(1,0),(-1,0),(1,1),(1,-1),(-1,1),(-1,-1)]
            self._generate_sliding_moves(r, c, from_sq, is_white, directions, moves)

        def _generate_sliding_moves(self, r: int, c: int, from_sq: str, is_white: bool, directions: list, moves: list):
            """
            Generate sliding piece moves (rook, bishop, queen).
            Args:
                r (int): Row coordinate of the piece
                c (int): Column coordinate of the piece
                from_sq (str): Square in algebraic notation
                is_white (bool): True for white piece, False for black
                directions (list): List of direction vectors [dr, dc]
                moves (list): List to add generated moves to
            """
            friendly_start = Chess.Piece.WHITE_PAWN if is_white else Chess.Piece.BLACK_PAWN
            friendly_end = Chess.Piece.WHITE_KING if is_white else Chess.Piece.BLACK_KING
            enemy_start = Chess.Piece.BLACK_PAWN if is_white else Chess.Piece.WHITE_PAWN
            enemy_end = Chess.Piece.BLACK_KING if is_white else Chess.Piece.WHITE_KING
            for dr, dc in directions:
                nr, nc = r+dr, c+dc
                while 0<=nr<8 and 0<=nc<8:
                    target = self.board[nr][nc]
                    if target == Chess.Piece.NONE:
                        moves.append(Chess.Move(from_sq, Chess.coords_to_square(nr, nc)))
                    elif enemy_start <= target <= enemy_end:
                        moves.append(Chess.Move(from_sq, Chess.coords_to_square(nr, nc)))
                        break
                    elif friendly_start <= target <= friendly_end:
                        break
                    nr += dr
                    nc += dc

        def _generate_knight_moves(self, r: int, c: int, from_sq: str, is_white: bool, moves: list):
            """
            Generate knight moves optimized for performance.
            Args:
                r (int): Row coordinate of the knight
                c (int): Column coordinate of the knight
                from_sq (str): Square in algebraic notation
                is_white (bool): True for white knight, False for black
                moves (list): List to add generated moves to
            """
            knight_moves = [(-2,-1),(-2,1),(-1,-2),(-1,2),(1,-2),(1,2),(2,-1),(2,1)]
            friendly_start = Chess.Piece.WHITE_PAWN if is_white else Chess.Piece.BLACK_PAWN
            friendly_end = Chess.Piece.WHITE_KING if is_white else Chess.Piece.BLACK_KING
            for dr, dc in knight_moves:
                nr, nc = r+dr, c+dc
                if 0<=nr<8 and 0<=nc<8:
                    target = self.board[nr][nc]
                    if target == Chess.Piece.NONE or not (friendly_start <= target <= friendly_end):
                        moves.append(Chess.Move(from_sq, Chess.coords_to_square(nr, nc)))

        def _generate_king_moves(self, r: int, c: int, from_sq: str, is_white: bool, moves: list):
            """
            Generate king moves optimized for performance.
            Args:
                r (int): Row coordinate of the king
                c (int): Column coordinate of the king
                from_sq (str): Square in algebraic notation
                is_white (bool): True for white king, False for black
                moves (list): List to add generated moves to
            """
            king_moves = [(-1,-1),(-1,0),(-1,1),(0,-1),(0,1),(1,-1),(1,0),(1,1)]
            friendly_start = Chess.Piece.WHITE_PAWN if is_white else Chess.Piece.BLACK_PAWN
            friendly_end = Chess.Piece.WHITE_KING if is_white else Chess.Piece.BLACK_KING
            for dr, dc in king_moves:
                nr, nc = r+dr, c+dc
                if 0<=nr<8 and 0<=nc<8:
                    target = self.board[nr][nc]
                    if target == Chess.Piece.NONE or not (friendly_start <= target <= friendly_end):
                        moves.append(Chess.Move(from_sq, Chess.coords_to_square(nr, nc)))
            # Castling
            if is_white and r == 7 and c == 4:
                if (self.castling_rights & 1) and not self.is_king_attacked(True):
                    if self.board[7][5] == Chess.Piece.NONE and self.board[7][6] == Chess.Piece.NONE:
                        if not self._is_square_attacked(7,5,False) and not self._is_square_attacked(7,6,False):
                            moves.append(Chess.Move(from_sq, 'G1'))
                if (self.castling_rights & 2) and not self.is_king_attacked(True):
                    if self.board[7][3] == Chess.Piece.NONE and self.board[7][2] == Chess.Piece.NONE and self.board[7][1] == Chess.Piece.NONE:
                        if not self._is_square_attacked(7,3,False) and not self._is_square_attacked(7,2,False):
                            moves.append(Chess.Move(from_sq, 'C1'))
            elif not is_white and r == 0 and c == 4:
                if (self.castling_rights & 4) and not self.is_king_attacked(False):
                    if self.board[0][5] == Chess.Piece.NONE and self.board[0][6] == Chess.Piece.NONE:
                        if not self._is_square_attacked(0,5,True) and not self._is_square_attacked(0,6,True):
                            moves.append(Chess.Move(from_sq, 'G8'))
                if (self.castling_rights & 8) and not self.is_king_attacked(False):
                    if self.board[0][3] == Chess.Piece.NONE and self.board[0][2] == Chess.Piece.NONE and self.board[0][1] == Chess.Piece.NONE:
                        if not self._is_square_attacked(0,3,True) and not self._is_square_attacked(0,2,True):
                            moves.append(Chess.Move(from_sq, 'C8'))
