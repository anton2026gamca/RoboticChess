import Chess from './chess.js';


const boardElement = document.getElementById('chess-board');

function createBoard(white = true) {
    boardElement.innerHTML = '';

    // Squares colors determined by the 'white' parameter
    const whiteLightClass = white ? 'light' : 'dark';
    const whiteDarkClass = white ? 'dark' : 'light';

    boardElement.innerHTML += `
        <div class="board-row board-label-row">
            <div class="board-label board-corner ${whiteLightClass}"></div>
            <div class="board-label board-label-horizontal ${whiteDarkClass}">A</div>
            <div class="board-label board-label-horizontal ${whiteLightClass}">B</div>
            <div class="board-label board-label-horizontal ${whiteDarkClass}">C</div>
            <div class="board-label board-label-horizontal ${whiteLightClass}">D</div>
            <div class="board-label board-label-horizontal ${whiteDarkClass}">E</div>
            <div class="board-label board-label-horizontal ${whiteLightClass}">F</div>
            <div class="board-label board-label-horizontal ${whiteDarkClass}">G</div>
            <div class="board-label board-label-horizontal ${whiteLightClass}">H</div>
            <div class="board-label board-corner ${whiteDarkClass}" style="transform: rotate(90deg);"></div>
        </div>`;
    for (let row = 0; row < 8; row++) {
        const rowLightClass = row % 2 === 0 ? whiteLightClass : whiteDarkClass;
        const rowDarkClass = row % 2 === 0 ? whiteDarkClass : whiteLightClass;

        let displayRow = 8 - row;
        if (!whiteOnBottom) {
            displayRow = row + 1;
        }

        boardElement.innerHTML += `
            <div class="board-row">
                <div class="board-label board-label-vertical ${rowDarkClass}">${displayRow}</div>
                <div id="A${displayRow}" class="board-square ${rowLightClass}"></div>
                <div id="B${displayRow}" class="board-square ${rowDarkClass}"></div>
                <div id="C${displayRow}" class="board-square ${rowLightClass}"></div>
                <div id="D${displayRow}" class="board-square ${rowDarkClass}"></div>
                <div id="E${displayRow}" class="board-square ${rowLightClass}"></div>
                <div id="F${displayRow}" class="board-square ${rowDarkClass}"></div>
                <div id="G${displayRow}" class="board-square ${rowLightClass}"></div>
                <div id="H${displayRow}" class="board-square ${rowDarkClass}"></div>
                <div class="board-label board-label-vertical ${rowLightClass}">${displayRow}</div>
            </div>`;
    }
    boardElement.innerHTML += `
        <div class="board-row board-label-row">
            <div class="board-label board-corner ${whiteDarkClass}" style="transform: rotate(270deg);"></div>
            <div class="board-label board-label-horizontal ${whiteLightClass}">A</div>
            <div class="board-label board-label-horizontal ${whiteDarkClass}">B</div>
            <div class="board-label board-label-horizontal ${whiteLightClass}">C</div>
            <div class="board-label board-label-horizontal ${whiteDarkClass}">D</div>
            <div class="board-label board-label-horizontal ${whiteLightClass}">E</div>
            <div class="board-label board-label-horizontal ${whiteDarkClass}">F</div>
            <div class="board-label board-label-horizontal ${whiteLightClass}">G</div>
            <div class="board-label board-label-horizontal ${whiteDarkClass}">H</div>
            <div class="board-label board-corner ${whiteLightClass}" style="transform: rotate(180deg);"></div>
        </div>`;
}

function openMenu() {
    document.getElementById('Menu').classList.remove('w3-hide-small', 'w3-hide-medium');
    document.getElementById('OpenMenuBtn').classList.add('w3-hide-small', 'w3-hide-medium');
    document.getElementById('CloseMenuBtn').classList.remove('w3-hide-small', 'w3-hide-medium');
}

function closeMenu() {
    document.getElementById('Menu').classList.add('w3-hide-small', 'w3-hide-medium');
    document.getElementById('OpenMenuBtn').classList.remove('w3-hide-small', 'w3-hide-medium');
    document.getElementById('CloseMenuBtn').classList.add('w3-hide-small', 'w3-hide-medium');
}

function newGameBtnPressed() {
    const overlay = document.getElementById('new-game-overlay');
    overlay.style.display = 'flex';
}

function overlayCloseBtnPressed(id) {
    const overlay = document.getElementById(id);
    overlay.style.display = 'none';
}

let white_bot;
let white_bot_move;

let black_bot;
let black_bot_move;

async function overlayStartGameBtnPressed() {
    if (playingGame)
        quitRequested = true;

    let white_bot_ready = false;
    let black_bot_ready = false;
    
    overlayCloseBtnPressed('new-game-overlay');
    
    const whitePlayerType = document.getElementById('white-player-type').value;
    const blackPlayerType = document.getElementById('black-player-type').value;
    const boardRotated = document.getElementById('board-rotated').value;
    
    if (whitePlayerType == 'bot') {
        const type = document.getElementById('white-bot-type');
        const input = document.getElementById('white-bot-script');
        if (type.value == 'custom' && (!input.files || input.files.length <= 0))
        {
            console.error("[White Bot] Error: No bot file selected");
            return;
        }
        const file = type.value == 'custom' ? input.files[0] : await (await fetch(type.value)).blob();
        const reader = new FileReader();
        reader.onload = function(e) {
            const moduleCode = `
                ${e.target.result}
                window.addEventListener("message", async event => {
                    const { type, value } = event.data;
                    document.body.innerHTML += "a";
                    if (type == "think") {
                        const result = await think(value);
                        parent.postMessage({type: 'move', value: result}, "*");
                    }
                });
            `;
            const iframe = document.getElementById('white-bot-iframe');
            iframe.srcdoc = `<!DOCTYPE html><html><body><script type="module">${moduleCode}<\/script></body></html>`;
            window.addEventListener('message', function handler(event) {
                const { type, value } = event.data;
                if (type == 'move')
                    white_bot_move = value;
            });
            
            white_bot = iframe.contentWindow;
            iframe.onload = () => {
                white_bot_ready = true;
            }
        };
        reader.readAsText(file);
    } else {
        white_bot_ready = true;
    }
    if (blackPlayerType == 'bot') {
        const type = document.getElementById('black-bot-type');
        const input = document.getElementById('black-bot-script');
        if (type.value == 'custom' && (!input.files || input.files.length <= 0))
        {
            console.error("[Black Bot] Error: No bot file selected");
            return;
        }
        const file = type.value == 'custom' ? input.files[0] : await (await fetch(type.value)).blob();
        const reader = new FileReader();
        reader.onload = function(e) {
            const moduleCode = `
                ${e.target.result}
                window.addEventListener("message", async event => {
                    const { type, value } = event.data;
                    document.body.innerHTML += "a";
                    if (type == "think") {
                        const result = await think(value);
                        parent.postMessage({type: 'move', value: result}, "*");
                    }
                });
            `;
            const iframe = document.getElementById('black-bot-iframe');
            iframe.srcdoc = `<!DOCTYPE html><html><body><script type="module">${moduleCode}<\/script></body></html>`;
            window.addEventListener('message', function handler(event) {
                const { type, value } = event.data;
                if (type == 'move')
                    black_bot_move = value;
            });
            
            black_bot = iframe.contentWindow;
            iframe.onload = () => {
                black_bot_ready = true;
            }
        };
        reader.readAsText(file);
    } else {
        black_bot_ready = true;
    }
    
    whiteOnBottom = boardRotated === 'white';
    
    document.querySelectorAll('#bot-indicator').forEach(el => el.remove());
    
    board = new Chess.Board();
    createBoard(whiteOnBottom);
    syncBoard();

    function waitForBots() {
        return new Promise(resolve => {
            function checkReady() {
                if ((!playingGame) && white_bot_ready && black_bot_ready) {
                    resolve();
                } else {
                    setTimeout(checkReady, 50);
                }
            }
            checkReady();
        });
    }
    await waitForBots();
    playGame(whitePlayerType === 'human', blackPlayerType === 'human');
}

function undoMoveBtnPressed() {
    if (!playingGame) return;
    
    undoRequested = true;
    UndoMove();
    if (typeof whiteTimerInterval !== 'undefined' && whiteTimerInterval) {
        clearInterval(whiteTimerInterval);
        whiteTimerInterval = null;
    }
    if (typeof blackTimerInterval !== 'undefined' && blackTimerInterval) {
        clearInterval(blackTimerInterval);
        blackTimerInterval = null;
    }
    updateTimersDisplay();
}

window.openMenu = openMenu;
window.closeMenu = closeMenu;
window.newGameBtnPressed = newGameBtnPressed;
window.overlayCloseBtnPressed = overlayCloseBtnPressed;
window.overlayStartGameBtnPressed = overlayStartGameBtnPressed;
window.undoMoveBtnPressed = undoMoveBtnPressed;


let board = new Chess.Board();

function getPieceImage(piece_type) {
    switch (piece_type) {
        case Chess.Piece.WHITE_PAWN: return 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg';
        case Chess.Piece.WHITE_ROOK: return 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg';
        case Chess.Piece.WHITE_KNIGHT: return 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg';
        case Chess.Piece.WHITE_BISHOP: return 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg';
        case Chess.Piece.WHITE_QUEEN: return 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg';
        case Chess.Piece.WHITE_KING: return 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg';
        case Chess.Piece.BLACK_PAWN: return 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg';
        case Chess.Piece.BLACK_ROOK: return 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg';
        case Chess.Piece.BLACK_KNIGHT: return 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg';
        case Chess.Piece.BLACK_BISHOP: return 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg';
        case Chess.Piece.BLACK_QUEEN: return 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg';
        case Chess.Piece.BLACK_KING: return 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg';
        default: return null;
    }
}

let undoRequested = false;
let quitRequested = false;
let playingGame = false;

let whiteTime = 0;
let blackTime = 0;
let whiteAccumulated = 0;
let blackAccumulated = 0;
let whiteTimerInterval = null;
let blackTimerInterval = null;

let whiteOnBottom = true;

function updateTimersDisplay() {
    const whiteTimerElem = document.getElementById(whiteOnBottom ? 'player-bottom-timer' : 'player-top-timer');
    const blackTimerElem = document.getElementById(whiteOnBottom ? 'player-top-timer' : 'player-bottom-timer');
    if (whiteTimerElem) whiteTimerElem.textContent = `${(whiteTime / 1000).toFixed(1)}s`;
    if (blackTimerElem) blackTimerElem.textContent = `${(blackTime / 1000).toFixed(1)}s`;
}

async function playGame(whiteIsHuman, blackIsHuman) {
    playingGame = true;
    whiteTime = 0;
    blackTime = 0;
    whiteAccumulated = 0;
    blackAccumulated = 0;
    updateTimersDisplay();

    const topName = document.getElementById('player-top-name');
    topName.innerHTML = whiteOnBottom ? 'Black' : 'White';
    const bottomName = document.getElementById('player-bottom-name');
    bottomName.innerHTML = whiteOnBottom ? 'White' : 'Black';

    if (!whiteIsHuman) {
        const id = whiteOnBottom ? 'player-bottom-display' : 'player-top-display';
        const display = document.getElementById(id);
        display.innerHTML += `<span id="bot-indicator" class="w3-right w3-padding-small w3-round-large w3-light-green" style="text-align: center; margin-left: 5px;">BOT</span>`;
    }
    if (!blackIsHuman) {
        const id = whiteOnBottom ? 'player-top-display' : 'player-bottom-display';
        const display = document.getElementById(id);
        display.innerHTML += `<span id="bot-indicator" class="w3-right w3-padding-small w3-round-large w3-light-green" style="text-align: center; margin-left: 5px;">BOT</span>`;
    }

    async function gameLoop() {
        while (true) {
            if (quitRequested === true)
                return { over: true, reason: "game interrupted", winner: "draw" };

            let move;
            let startTime = Date.now();

            const whiteTimerElem = document.getElementById(whiteOnBottom ? 'player-bottom-timer' : 'player-top-timer');
            const blackTimerElem = document.getElementById(whiteOnBottom ? 'player-top-timer' : 'player-bottom-timer');
            if (board.whiteToPlay) {
                if (whiteTimerInterval) clearInterval(whiteTimerInterval);
                whiteTimerInterval = setInterval(() => {
                    whiteTime = Date.now() - startTime + whiteAccumulated;
                    updateTimersDisplay();
                }, 100);
                whiteTimerElem.classList.add('clock-active');
                blackTimerElem.classList.remove('clock-active');
            } else {
                if (blackTimerInterval) clearInterval(blackTimerInterval);
                blackTimerInterval = setInterval(() => {
                    blackTime = Date.now() - startTime + blackAccumulated;
                    updateTimersDisplay();
                }, 100);
                blackTimerElem.classList.add('clock-active');
                whiteTimerElem.classList.remove('clock-active');
            }

            undoRequested = false;
            if (board.whiteToPlay ? whiteIsHuman : blackIsHuman) {
                move = await getUserInput();
            } else {
                move = await getBotInput();
            }
            if (quitRequested === true)
                return { over: true, reason: "game interrupted", winner: "draw" };
            if (undoRequested) {
                if (whiteTimerInterval) { clearInterval(whiteTimerInterval); whiteTimerInterval = null; }
                if (blackTimerInterval) { clearInterval(blackTimerInterval); blackTimerInterval = null; }
                updateTimersDisplay();
                continue;
            }

            let elapsed = Date.now() - startTime;
            if (board.whiteToPlay) {
                clearInterval(whiteTimerInterval);
                whiteTimerInterval = null;
                whiteAccumulated += elapsed;
                whiteTime = whiteAccumulated;
            } else {
                clearInterval(blackTimerInterval);
                blackTimerInterval = null;
                blackAccumulated += elapsed;
                blackTime = blackAccumulated;
            }
            updateTimersDisplay();

            if (!move || move.from == move.to) continue;
            if (MakeMove(move.from, move.to)) {
                console.log(`%c[%c${board.whiteToPlay ? 'White' : 'Black'}%c] %cIllegal move %cfrom%c %c${move.from} %cto%c %c${move.to}`, '', '', '', 'color: red', 'color: darkgrey;', '', 'color: aqua', 'color: darkgrey;', '', 'color: aqua');
                return { over: true, reason: "illegal move", winner: board.whiteToPlay ? "black" : "white" };
            }
            console.info(`%c[%c${board.whiteToPlay ? 'White' : 'Black'}%c] %cMove: %cfrom%c %c${move.from} %cto%c %c${move.to}`, '', '', '', '', 'color: darkgrey;', '', 'color: aqua', 'color: darkgrey;', '', 'color: aqua');

            const gameOverState = board.IsGameOver();
            if (gameOverState.over) {
                return gameOverState;
            }
        }
    }
    const state = await gameLoop();

    if (whiteTimerInterval) { clearInterval(whiteTimerInterval); whiteTimerInterval = null; }
    if (blackTimerInterval) { clearInterval(blackTimerInterval); blackTimerInterval = null; }
    updateTimersDisplay();

    console.log(`Game finished \nWinner: %c${state.winner}%c\nReason: %c${state.reason}`, 'color: aqua;', '', 'color: aqua');
    if (state.reason != 'game interrupted') {
        const overlay = document.getElementById('game-finished-overlay');
        overlay.style.display = 'flex';
        const overlayContent = document.getElementById('game-finished-overlay-content');
        if (state.winner == 'white')
            overlayContent.innerHTML = `<h3>White wins!</h3><br>${state.reason}`;
        else if (state.winner == 'black')
            overlayContent.innerHTML = `<h3>Black wins!</h3><br>${state.reason}`;
        else
            overlayContent.innerHTML = `<h3>Draw!</h3><br>${state.reason}`;
    }
    playingGame = false;
    quitRequested = false;
}

function MakeMove(from, to) {
    const result = board.MakeMove(from, to);
    if (result === -1)
        return true;

    const fromElem = document.getElementById(from);
    if (fromElem) fromElem.innerHTML = '';

    const piece = board.GetPiece(to);
    const toElem = document.getElementById(to);
    if (toElem) {
        const img = getPieceImage(piece);
        if (img) toElem.innerHTML = `<img src="${img}" draggable="false" class="chess-piece">`;
        else toElem.innerHTML = '';
    }

    if (result === 1)
        syncBoard();    

    return false
}

function UndoMove() {
    if (!board.moveHistory || board.moveHistory.length === 0) return;
    const last = board.moveHistory[board.moveHistory.length - 1];

    const toElem = document.getElementById(last.move.to);
    if (toElem) toElem.innerHTML = '';

    const fromElem = document.getElementById(last.move.from);
    if (fromElem) {
        const img = getPieceImage(last.fromPiece);
        if (img) fromElem.innerHTML = `<img src="${img}" draggable="false" class="chess-piece">`;
        else fromElem.innerHTML = '';
    }

    if (last.toPiece && last.toPiece !== Chess.Piece.NONE) {
        if (toElem) {
            const img = getPieceImage(last.toPiece);
            if (img) toElem.innerHTML = `<img src="${img}" draggable="false" class="chess-piece">`;
        }
    }

    board.UndoMove();
    syncBoard();
}


function getUserInput() {
    return new Promise(resolve => {
        let resolved = false;
        let dragStartSquare = null;
        let draggingPiece = null;
        let dragImg = null;
        let offsetX = 0, offsetY = 0;
        let deletedPiece = '';
        let moves;

        function tryResolve(move) {
            if (!resolved) {
                resolved = true;
                cleanup();
                resolve(move);
            }
        }

        function cleanup() {
            document.querySelectorAll('.board-square').forEach(sq => {
                sq.removeEventListener('mousedown', onDragStart);
                sq.classList.remove('board-square-selected');
            });
            document.removeEventListener('mousemove', onDragMove);
            document.removeEventListener('mouseup', onDragEnd);
            if (dragImg && dragImg.parentNode) {
                dragImg.parentNode.removeChild(dragImg);
                dragImg = null;
            }
        }

        function onDragStart(e) {
            if (undoRequested || quitRequested) { tryResolve(null); return; }
            let target = e.target;
            if (!target.classList.contains('board-square')) {
                target = target.closest('.board-square');
            }
            if (!target) return;
            const square = target.id;
            const piece = board.GetPiece(square);
            moves = board.GetMovesForPiece(square);

            moves.forEach(move => {
                const elem = document.getElementById(move.to)
                elem.classList.add('board-square-selected');
            });

            let isPlayerPiece = (board.whiteToPlay && piece >= Chess.Piece.WHITE_PAWN && piece <= Chess.Piece.WHITE_KING) ||
                                (!board.whiteToPlay && piece >= Chess.Piece.BLACK_PAWN && piece <= Chess.Piece.BLACK_KING);
            if (!isPlayerPiece) return;

            dragStartSquare = square;
            draggingPiece = piece;
            const rect = target.getBoundingClientRect();
            offsetX = rect.width / 2;
            offsetY = rect.height / 2;

            document.addEventListener('mousemove', onDragMove);
            document.addEventListener('mouseup', onDragEnd);

            if (target) {
                deletedPiece = target.innerHTML;
                target.innerHTML = '';
            }

            const imgSrc = getPieceImage(draggingPiece);
            if (!imgSrc) return;

            if (dragImg) {
                document.body.removeChild(dragImg);
                dragImg = null;
            }
            dragImg = document.createElement('img');
            dragImg.src = imgSrc;
            dragImg.draggable = false;
            dragImg.className = 'dragging';
            dragImg.style.width = rect.width + 'px';
            dragImg.style.height = rect.height + 'px';
            dragImg.style.zIndex = 1000;
            dragImg.style.left = (e.pageX - offsetX) + 'px';
            dragImg.style.top = (e.pageY - offsetY) + 'px';
            dragImg.style.position = 'absolute';
            document.body.appendChild(dragImg);
        }

        function onDragMove(e) {
            if (!dragImg) return;
            dragImg.style.left = (e.pageX - offsetX) + 'px';
            dragImg.style.top = (e.pageY - offsetY) + 'px';
        }

        function onDragEnd(e) {
            if (!dragStartSquare || !draggingPiece) {
                cleanup();
                return;
            }
            let targetSquare = null;
            document.querySelectorAll('.board-square').forEach(sq => {
                const rect = sq.getBoundingClientRect();
                if (
                    e.clientX >= rect.left &&
                    e.clientX <= rect.right &&
                    e.clientY >= rect.top &&
                    e.clientY <= rect.bottom
                ) {
                    targetSquare = sq.id;
                }
            });
            if (dragImg && dragImg.parentNode) {
                dragImg.parentNode.removeChild(dragImg);
                dragImg = null;
            }
            document.getElementById(dragStartSquare).innerHTML = deletedPiece;
            if (
                targetSquare &&
                targetSquare !== dragStartSquare &&
                moves.some(move => move.to === targetSquare)
            ) {
                tryResolve(new Chess.Move(dragStartSquare, targetSquare));
            } else {
                tryResolve(null);
            }
        }

        document.querySelectorAll('.board-square').forEach(sq => {
            sq.addEventListener('mousedown', onDragStart);
        });

        const undoCheck = setInterval(() => {
            if (undoRequested || quitRequested) {
                tryResolve(null);
                clearInterval(undoCheck);
            }
        }, 100);
    });
}

function getBotInput() {
    return new Promise(resolve => {
        let finished = false;
        let bot = board.whiteToPlay ? white_bot : black_bot;

        if (!bot) {
            // fallback to random move if bot is not defined
            let moves = board.GetMoves();
            resolve(moves.length ? moves[Math.floor(Math.random() * moves.length)] : null);
            return;
        }

        const checkMove = () => {
            let moveObj = board.whiteToPlay ? white_bot_move : black_bot_move;
            if (moveObj) {
                finished = true;
                // Reset the move variable
                if (board.whiteToPlay) white_bot_move = null;
                else black_bot_move = null;
                clearInterval(moveCheck);
                clearInterval(undoCheck);
                resolve(moveObj ? new Chess.Move(moveObj.from.toUpperCase(), moveObj.to.toUpperCase()) : null);
            }
        };

        bot.postMessage({ type: 'think', value: board.CreateFEN() }, "*");

        const moveCheck = setInterval(checkMove, 50);

        const undoCheck = setInterval(() => {
            if ((undoRequested || quitRequested) && !finished) {
            finished = true;
            clearInterval(moveCheck);
            clearInterval(undoCheck);
            // Reset the move variable
            if (board.whiteToPlay) white_bot_move = null;
            else black_bot_move = null;
            resolve(null);
            }
        }, 100);
    });
}

function syncBoard() {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            let displayRow = row, displayCol = col;
            const square = String.fromCharCode(65 + displayCol) + (8 - displayRow);
            const elem = document.getElementById(square);
            if (elem) {
                const piece = board.board[row][col];
                const img = getPieceImage(piece);
                if (img) {
                    elem.innerHTML = `<img src="${img}" draggable="false" class="chess-piece">`;
                } else {
                    elem.innerHTML = '';
                }
            }
        }
    }
}

createBoard(whiteOnBottom);
syncBoard();


window.addEventListener('DOMContentLoaded', () => {
    const whiteType = localStorage.getItem('white-player-type') || 'human';
    const blackType = localStorage.getItem('black-player-type') || 'bot';
    const rotated = localStorage.getItem('board-rotated') || 'white';

    document.getElementById('white-player-type').value = whiteType;
    document.getElementById('white-player-type').dispatchEvent(new Event('change'));
    document.getElementById('black-player-type').value = blackType;
    document.getElementById('black-player-type').dispatchEvent(new Event('change'));
    document.getElementById('board-rotated').value = rotated;
    document.getElementById('board-rotated').dispatchEvent(new Event('change'));

    document.getElementById('white-bot-script').style.display = whiteType === 'bot' ? 'block' : 'none';
    document.getElementById('black-bot-script').style.display = blackType === 'bot' ? 'block' : 'none';
});


const whiteBotTypeSelect = document.getElementById('white-bot-type');
const blackBotTypeSelect = document.getElementById('black-bot-type');

try {
    const response = await fetch('./Bots/bot-list.json');
    if (!response.ok) {
        throw new Error(`Failed to load bot list: ${response.statusText}`);
    }
    const botList = await response.json();
    
    if (whiteBotTypeSelect && Array.isArray(botList)) {
        botList.forEach(bot => {
            const option = document.createElement('option');
            option.value = bot.url || '';
            option.textContent = bot.name || 'Unnamed Bot';
            whiteBotTypeSelect.appendChild(option);
        });
    }
    if (blackBotTypeSelect && Array.isArray(botList)) {
        botList.forEach(bot => {
            const option = document.createElement('option');
            option.value = bot.url || '';
            option.textContent = bot.name || 'Unnamed Bot';
            blackBotTypeSelect.appendChild(option);
        });
    }
} catch (err) {
    console.error(err);
}


whiteBotTypeSelect.innerHTML += '<option value="custom">Custom</option>';
const whiteBotType = localStorage.getItem('white-bot-type');
if (whiteBotType && whiteBotTypeSelect) {
    whiteBotTypeSelect.value = whiteBotType;
    whiteBotTypeSelect.dispatchEvent(new Event('change'));
}

blackBotTypeSelect.innerHTML += '<option value="custom">Custom</option>';
const blackBotType = localStorage.getItem('black-bot-type');
if (blackBotType && blackBotTypeSelect) {
    blackBotTypeSelect.value = blackBotType;
    blackBotTypeSelect.dispatchEvent(new Event('change'));
}