from chess import Chess
from random import randint

"""
Dummy Bot

This bot plays completely randomly, selecting moves at random from all legal moves.
It provides unpredictable gameplay and serves as a baseline for comparing other bots.

Playing Style: Completely random, no strategy involved.
"""

def think(fen: str) -> str:
    board = Chess.Board(fen)
    moves = board.get_moves()
    
    if len(moves) == 0: # Shouldn't happen
        return None # No legal moves
    elif len(moves) == 1:
        return str(moves[0]) # Only one move available
    
    # Select a random move
    move = moves[randint(0, len(moves) - 1)]
    return str(move)