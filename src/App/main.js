import Chess from './chess.js';

// ============================================================================
// CONSTANTS AND CONFIGURATION
// ============================================================================

// Mapping of chess piece types to their SVG image URLs from Wikimedia Commons
const PIECE_IMAGES = {
    [Chess.Piece.WHITE_PAWN]: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
    [Chess.Piece.WHITE_ROOK]: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
    [Chess.Piece.WHITE_KNIGHT]: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
    [Chess.Piece.WHITE_BISHOP]: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
    [Chess.Piece.WHITE_QUEEN]: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
    [Chess.Piece.WHITE_KING]: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
    [Chess.Piece.BLACK_PAWN]: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
    [Chess.Piece.BLACK_ROOK]: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
    [Chess.Piece.BLACK_KNIGHT]: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
    [Chess.Piece.BLACK_BISHOP]: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
    [Chess.Piece.BLACK_QUEEN]: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
    [Chess.Piece.BLACK_KING]: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg'
};

// Default bot code templates for creating new custom bots
const DEFAULT_BOT_CODE_JS = `import Chess from "https://anton2026gamca.github.io/RoboticChess/src/App/chess.js";

/**
 * This function is called when it's the bot's turn
 * @param {string} fen The FEN string representing the current board state
 * @returns {Chess.Move} The move to play
 */
export function think(fen) {
    const board = new Chess.Board(fen);
    
}`;

const DEFAULT_BOT_CODE_TS = `import Chess from "https://anton2026gamca.github.io/RoboticChess/src/App/chess.js";

/**
 * This function is called when it's the bot's turn
 * @param fen The FEN string representing the current board state
 * @returns The move to play
 */
export function think(fen: string): Chess.Move | null {
    const board = new Chess.Board(fen);

}`;

// Timing constants for various update intervals (in milliseconds)
const TIMER_UPDATE_INTERVAL = 100;    // How often to update timer display
const BOT_POLL_INTERVAL = 50;         // How often to check for bot moves
const UNDO_CHECK_INTERVAL = 100;      // How often to check for undo requests

// ============================================================================
// CLASS DEFINITIONS
// ============================================================================

/**
 * Represents a chess bot with its code and metadata
 */
class Bot {
    /**
     * Creates a new Bot instance
     * @param {string} name - The name of the bot
     * @param {string} url - URL to load bot code from (empty for custom bots)
     * @param {string} code - The bot's JavaScript/TypeScript code (for custom bots)
     * @param {string} language - The language of the bot ('js' or 'ts')
     */
    constructor(name, url = '', code = '', language = 'js') {
        this.name = name;
        this.url = url;
        this.code = code;
        this.language = language;
        this.isCustom = url === '';
        
        if (!this.isCustom) {
            this.loadCodeFromUrl();
        }
    }

    /**
     * Loads bot code from a remote URL (for default bots)
     */
    async loadCodeFromUrl() {
        try {
            const response = await fetch(this.url);
            this.code = await response.text();
        } catch (err) {
            console.error(`Failed to load bot code from ${this.url}:`, err);
        }
    }

    /**
     * Compiles TypeScript code to JavaScript if needed
     * @returns {string} The compiled JavaScript code
     */
    async getCompiledCode() {
        if (this.language === 'ts') {
            return await compileTypeScript(this.code);
        }
        return this.code;
    }
}

// ============================================================================
// GAME STATE VARIABLES
// ============================================================================

// Core game components
let board = new Chess.Board();    // The chess board and game state
let bots = [];                    // Array of available bots

// Bot instances and communication
let whiteBotInstance = null;
let blackBotInstance = null;
let whiteBotMove = null;
let blackBotMove = null;
let whiteBotIframe = null;
let blackBotIframe = null;

// Game state flags
let undoRequested = false;
let quitRequested = false;
let playingGame = false;

// Timer state
let whiteTime = 0;
let blackTime = 0;
let whiteAccumulated = 0;
let blackAccumulated = 0;
let whiteTimerInterval = null;
let blackTimerInterval = null;

// Board orientation
let whiteOnBottom = true;

// DOM Elements
const boardElement = document.getElementById('chess-board');

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Gets the image URL for a chess piece based on its type
 * @param {number} pieceType - The piece type constant from Chess.Piece
 * @returns {string|null} The image URL or null if piece type is invalid
 */
function getPieceImage(pieceType) {
    return PIECE_IMAGES[pieceType] || null;
}

/**
 * Checks if a piece belongs to the current player
 * @param {number} piece - The piece type constant
 * @param {boolean} isWhiteToPlay - Whether it's white's turn to play
 * @returns {boolean} True if the piece belongs to the current player
 */
function isPlayerPiece(piece, isWhiteToPlay) {
    if (isWhiteToPlay) {
        return piece >= Chess.Piece.WHITE_PAWN && piece <= Chess.Piece.WHITE_KING;
    } else {
        return piece >= Chess.Piece.BLACK_PAWN && piece <= Chess.Piece.BLACK_KING;
    }
}

/**
 * Converts board coordinates to chess square notation (e.g., row 0, col 0 -> A8)
 * @param {number} row - The row index (0-7)
 * @param {number} col - The column index (0-7)
 * @returns {string} The square notation (e.g., "A8", "H1")
 */
function getSquareFromCoords(row, col) {
    return String.fromCharCode(65 + col) + (8 - row);
}

/**
 * Utility function to pause execution for a specified number of milliseconds
 * @param {number} ms - Number of milliseconds to sleep
 * @returns {Promise} Promise that resolves after the specified delay
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Opens the mobile menu by adjusting CSS classes for responsive design
 */
function openMenu() {
    const openBtn = document.getElementById('open-menu-btn');
    const closeBtn = document.getElementById('close-menu-btn');
    const menu = document.getElementById('menu');
    
    if (openBtn) openBtn.classList.add('w3-hide-small', 'w3-hide-medium');
    if (closeBtn) closeBtn.classList.remove('w3-hide-small', 'w3-hide-medium');
    if (menu) menu.classList.remove('w3-hide-small', 'w3-hide-medium');
}

/**
 * Closes the mobile menu by adjusting CSS classes for responsive design
 */
function closeMenu() {
    const openBtn = document.getElementById('open-menu-btn');
    const closeBtn = document.getElementById('close-menu-btn');
    const menu = document.getElementById('menu');
    
    if (openBtn) openBtn.classList.remove('w3-hide-small', 'w3-hide-medium');
    if (menu) menu.classList.add('w3-hide-small', 'w3-hide-medium');
    if (closeBtn) closeBtn.classList.add('w3-hide-small', 'w3-hide-medium');
}

/**
 * Handles keyboard events for overlay modals (Escape to close, Tab for focus trapping)
 * @param {KeyboardEvent} event - The keyboard event
 */
function handleOverlayKeydown(event) {
    // Only handle if an overlay is active
    if (!document.body.classList.contains('modal-overlay-active')) {
        return;
    }
    
    // Handle Escape key to close overlay
    if (event.key === 'Escape') {
        event.preventDefault();
        
        // Find the visible overlay and close it
        const blacklist = ['promotion-overlay', 'code-editor-overlay'];
        const overlays = Array.from(document.querySelectorAll('.modal-overlay'))
            .filter(overlay => !blacklist.includes(overlay.id));
        for (const overlay of overlays) {
            if (overlay && overlay.style.display !== 'none') {
                closeOverlay(overlay.id);
                return;
            }
        }
    }
    
    // Handle Tab key for focus trapping
    if (event.key === 'Tab') {
        // Find the visible overlay
        const overlays = ['new-game-overlay', 'game-finished-overlay', 'code-editor-overlay'];
        let activeOverlay = null;
        
        for (const overlayId of overlays) {
            const overlay = document.getElementById(overlayId);
            if (overlay && overlay.style.display !== 'none') {
                activeOverlay = overlay;
                break;
            }
        }
        
        if (activeOverlay) {
            // Get all focusable elements within the overlay
            const focusableElements = activeOverlay.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            if (focusableElements.length === 0) return;
            
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            // Trap focus within the overlay
            if (event.shiftKey) {
                // Shift + Tab (backward)
                if (document.activeElement === firstElement) {
                    event.preventDefault();
                    lastElement.focus();
                }
            } else {
                // Tab (forward)
                if (document.activeElement === lastElement) {
                    event.preventDefault();
                    firstElement.focus();
                }
            }
        }
    }
}

/**
 * Closes an overlay modal and restores focus to the previously focused element
 * @param {string} id - The ID of the overlay element to close
 */
function closeOverlay(id) {
    const overlay = document.getElementById(id);
    overlay.style.display = 'none';
    
    // Remove overlay active state and restore focus
    document.body.classList.remove('modal-overlay-active');
    
    // Restore focus to previously focused element if available
    if (window.lastFocusedElement) {
        window.lastFocusedElement.focus();
        window.lastFocusedElement = null;
    }
}

// ============================================================================
// BOARD MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Creates the visual chess board with squares and coordinate labels
 * @param {boolean} isWhiteOnBottom - Whether white pieces should be on the bottom
 */
function createBoard(isWhiteOnBottom = true) {
    boardElement.innerHTML = '';

    // Square colors determined by the board orientation
    const whiteLightClass = isWhiteOnBottom ? 'square-light' : 'square-dark';
    const whiteDarkClass = isWhiteOnBottom ? 'square-dark' : 'square-light';

    // Create top label row
    boardElement.innerHTML += createLabelRow(whiteLightClass, whiteDarkClass, 'top');
    
    // Create chess squares
    for (let row = 0; row < 8; row++) {
        const rowLightClass = row % 2 === 0 ? whiteLightClass : whiteDarkClass;
        const rowDarkClass = row % 2 === 0 ? whiteDarkClass : whiteLightClass;

        const displayRow = isWhiteOnBottom ? 8 - row : row + 1;
        boardElement.innerHTML += createBoardRow(displayRow, rowLightClass, rowDarkClass);
    }
    
    // Create bottom label row
    boardElement.innerHTML += createLabelRow(whiteDarkClass, whiteLightClass, 'bottom');
}

/**
 * Creates a row of coordinate labels (A-H) for the chess board
 * @param {string} cornerClass1 - CSS class for the first corner element
 * @param {string} cornerClass2 - CSS class for the second corner element
 * @param {string} position - Position of the label row ('top' or 'bottom')
 * @returns {string} HTML string for the label row
 */
function createLabelRow(cornerClass1, cornerClass2, position) {
    const files = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const rotation = position === 'top' ? 'rotate(0deg)' : 
                    position === 'bottom' ? 'rotate(270deg)' : 'rotate(180deg)';
    
    let html = `<div class="board-game-row board-label-row">
        <div class="board-coordinate-label board-corner-element ${cornerClass1}" style="transform: ${rotation};"></div>`;
    
    files.forEach((file, index) => {
        const labelClass = index % 2 === 0 ? cornerClass2 : cornerClass1;
        html += `<div class="board-coordinate-label board-horizontal-label ${labelClass}">${file}</div>`;
    });
    
    const endRotation = position === 'bottom' ? 'rotate(180deg)' : 'rotate(90deg)';
    html += `<div class="board-coordinate-label board-corner-element ${cornerClass2}" style="transform: ${endRotation};"></div></div>`;
    
    return html;
}

/**
 * Creates a row of chess squares with rank labels on both sides
 * @param {number} displayRow - The row number to display (1-8)
 * @param {string} lightClass - CSS class for light squares
 * @param {string} darkClass - CSS class for dark squares
 * @returns {string} HTML string for the board row
 */
function createBoardRow(displayRow, lightClass, darkClass) {
    const files = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    
    let html = `<div class="board-game-row">
        <div class="board-coordinate-label board-vertical-label ${darkClass}">${displayRow}</div>`;
    
    files.forEach((file, index) => {
        const squareClass = index % 2 === 0 ? lightClass : darkClass;
        html += `<div id="${file}${displayRow}" class="chess-game-square ${squareClass}"></div>`;
    });
    
    html += `<div class="board-coordinate-label board-vertical-label ${lightClass}">${displayRow}</div></div>`;
    return html;
}

/**
 * Synchronizes the visual board with the current game state by updating all squares
 */
function syncBoard() {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = getSquareFromCoords(row, col);
            const elem = document.getElementById(square);
            
            if (elem) {
                const piece = board.board[row][col];
                const img = getPieceImage(piece);
                elem.innerHTML = img ? `<img src="${img}" draggable="false" class="chess-game-piece">` : '';
            }
        }
    }
}

/**
 * Updates a specific square on the board with a piece image
 * @param {string} square - The square notation (e.g., "E4")
 * @param {number} piece - The piece type constant
 */
function updatePieceOnSquare(square, piece) {
    const elem = document.getElementById(square);
    if (elem) {
        const img = getPieceImage(piece);
        elem.innerHTML = img ? `<img src="${img}" draggable="false" class="chess-game-piece">` : '';
    }
}

/**
 * Clears a specific square on the board (removes any piece)
 * @param {string} square - The square notation (e.g., "E4")
 */
function clearSquare(square) {
    const elem = document.getElementById(square);
    if (elem) elem.innerHTML = '';
}

// ============================================================================
// TIMER FUNCTIONS
// ============================================================================

/**
 * Updates the timer display elements with current time values
 */
function updateTimersDisplay() {
    const whiteTimerElem = document.getElementById(whiteOnBottom ? 'player-bottom-timer' : 'player-top-timer');
    const blackTimerElem = document.getElementById(whiteOnBottom ? 'player-top-timer' : 'player-bottom-timer');
    
    if (whiteTimerElem) whiteTimerElem.textContent = `${(whiteTime / 1000).toFixed(1)}s`;
    if (blackTimerElem) blackTimerElem.textContent = `${(blackTime / 1000).toFixed(1)}s`;
}

/**
 * Starts a timer for the specified player and ensures proper visual indicators
 * @param {boolean} isWhite - Whether to start the white player's timer
 * @param {number} startTime - The timestamp when the timer started
 */
function startTimer(isWhite, startTime) {
    const timerElem = document.getElementById(
        isWhite ? (whiteOnBottom ? 'player-bottom-timer' : 'player-top-timer') 
                : (whiteOnBottom ? 'player-top-timer' : 'player-bottom-timer')
    );
    const otherTimerElem = document.getElementById(
        isWhite ? (whiteOnBottom ? 'player-top-timer' : 'player-bottom-timer') 
                : (whiteOnBottom ? 'player-bottom-timer' : 'player-top-timer')
    );

    // Clear existing intervals
    if (whiteTimerInterval) { clearInterval(whiteTimerInterval); whiteTimerInterval = null; }
    if (blackTimerInterval) { clearInterval(blackTimerInterval); blackTimerInterval = null; }

    // Start new timer
    const timerInterval = setInterval(() => {
        if (isWhite) {
            whiteTime = Date.now() - startTime + whiteAccumulated;
        } else {
            blackTime = Date.now() - startTime + blackAccumulated;
        }
        updateTimersDisplay();
    }, TIMER_UPDATE_INTERVAL);

    if (isWhite) {
        whiteTimerInterval = timerInterval;
    } else {
        blackTimerInterval = timerInterval;
    }

    // Update visual indicators
    timerElem.classList.add('timer-active');
    otherTimerElem.classList.remove('timer-active');
}

/**
 * Stops all timers and clears visual indicators (used when game ends)
 */
function stopTimers() {
    if (whiteTimerInterval) { clearInterval(whiteTimerInterval); whiteTimerInterval = null; }
    if (blackTimerInterval) { clearInterval(blackTimerInterval); blackTimerInterval = null; }
    
    // Clear timer active indicators
    const whiteTimerElem = document.getElementById(whiteOnBottom ? 'player-bottom-timer' : 'player-top-timer');
    const blackTimerElem = document.getElementById(whiteOnBottom ? 'player-top-timer' : 'player-bottom-timer');
    
    if (whiteTimerElem) whiteTimerElem.classList.remove('timer-active');
    if (blackTimerElem) blackTimerElem.classList.remove('timer-active');
    
    updateTimersDisplay();
}

/**
 * Resets all timer values to zero and stops any running timers
 */
function resetTimers() {
    whiteTime = 0;
    blackTime = 0;
    whiteAccumulated = 0;
    blackAccumulated = 0;
    stopTimers();
    updateTimersDisplay();
}

// ============================================================================
// BOT MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Sets up a bot instance in an iframe with proper message handling
 * @param {Bot} bot - The bot instance to set up
 * @param {boolean} isWhite - Whether this bot plays as white
 */
async function setupBot(bot, isWhite) {
    const iframe = document.getElementById(isWhite ? 'white-bot-iframe' : 'black-bot-iframe');
    
    // Clean up previous message handler if it exists
    if (iframe.messageHandler) {
        window.removeEventListener('message', iframe.messageHandler);
        iframe.messageHandler = null;
    }
    
    // Get compiled code (handles TypeScript compilation if needed)
    const compiledCode = await bot.getCompiledCode();
    
    const moduleCode = `
        ${compiledCode}
        window.addEventListener("message", async event => {
            const { type, value } = event.data;
            if (type === "think") {
                try {
                    const result = await think(value);
                    parent.postMessage({type: 'move', value: result}, "*");
                } catch (error) {
                    console.error("Bot error:", error);
                    parent.postMessage({type: 'move', value: null}, "*");
                }
            }
        });
    `;
    
    iframe.srcdoc = `<!DOCTYPE html><html><body><script type="module">${moduleCode}<\/script></body></html>`;
    
    // Set up message handler specific to this iframe
    const messageHandler = function(event) {
        // Only handle messages from this specific iframe
        if (event.source !== iframe.contentWindow) return;
        
        const { type, value } = event.data;
        if (type === 'move') {
            if (isWhite) whiteBotMove = value;
            else blackBotMove = value;
        }
    };
    
    window.addEventListener('message', messageHandler);
    
    // Store the handler so we can remove it later if needed
    iframe.messageHandler = messageHandler;

    // Wait for iframe to load
    await new Promise(resolve => {
        iframe.onload = resolve;
    });

    // Store bot references
    if (isWhite) {
        whiteBotInstance = bot;
        whiteBotIframe = iframe;
        window.white_bot = bot;
    } else {
        blackBotInstance = bot;
        blackBotIframe = iframe;
        window.black_bot = bot;
    }
}

/**
 * Loads all available bots from the bot list JSON file and localStorage
 */
async function loadBots() {
    try {
        const response = await fetch('./Bots/bot-list.json');
        if (!response.ok) {
            throw new Error(`Failed to load bot list: ${response.statusText}`);
        }
        const defaultBots = await response.json();
        
        // Load custom bots from localStorage
        const customBotsStr = localStorage.getItem('custom-bots');
        const customBots = customBotsStr ? JSON.parse(customBotsStr) : [];

        // Add default bots
        defaultBots.forEach(botData => {
            bots.push(new Bot(botData.name, botData.url, '', botData.url.split('.').pop().toLowerCase() || 'js'));
        });
        
        // Add custom bots
        customBots.forEach(botData => {
            // Handle legacy bots that don't have language property
            const language = botData.language || 'js';
            bots.push(new Bot(botData.name, '', botData.code, language));
        });
    } catch (error) {
        console.error('Failed to load bots:', error);
    }
}

/**
 * Adds a new bot to the collection and saves it to localStorage
 * @param {string} name - The name of the bot
 * @param {string} url - The URL for the bot code (empty for custom bots)
 * @param {string} code - The bot's code (for custom bots)
 * @param {string} language - The language of the bot ('js' or 'ts')
 * @returns {Bot} The created bot instance
 */
function addBot(name, url = '', code = '', language = 'js') {
    // Remove existing bot with same name
    bots = bots.filter(b => !(b.name === name && b.isCustom));
    
    // Update localStorage
    let customBots = [];
    const botsStr = localStorage.getItem('custom-bots');
    if (botsStr) {
        customBots = JSON.parse(botsStr);
    }
    customBots = customBots.filter(b => b.name !== name);
    customBots.push({ name, code, language });
    localStorage.setItem('custom-bots', JSON.stringify(customBots));
    
    // Create and add new bot
    const bot = new Bot(name, url, code, language);
    bots.push(bot);
    
    refreshBotsList();
    return bot;
}

function editBot(botName) {
    const bot = bots.find(b => b.name === botName);
    if (!bot) return;
    openCodeEditor(bot.name, bot.code, false, bot.language);
}

function viewBot(botName, isCustom = null, botLanguage = null, botUrl = null, botCode = null) {
    const bot = bots.find(b => b.name === botName && (!botUrl || botUrl === b.url) && (!botCode || botCode === b.code) && (isCustom !== null ? b.isCustom === isCustom : true) && (!botLanguage || b.language === botLanguage));
    if (!bot) return;
    openCodeEditor(bot.name, bot.code, true, bot.language); // true indicates read-only mode
}

function deleteBot(botName) {
    const botIndex = bots.findIndex(b => b.name === botName && b.isCustom);
    if (botIndex === -1) return;

    bots.splice(botIndex, 1);

    // Update localStorage
    const customBotsStr = localStorage.getItem('custom-bots');
    if (customBotsStr) {
        const customBots = JSON.parse(customBotsStr).filter(b => b.name !== botName);
        localStorage.setItem('custom-bots', JSON.stringify(customBots));
    }

    refreshBotsList();
}

async function saveBot() {
    const overlay = document.getElementById('code-editor-overlay');
    const titleElement = document.getElementById('code-editor-title');
    const languageElement = document.getElementById('code-editor-language');
    
    // Remove overlay active state and restore focus
    document.body.classList.remove('modal-overlay-active');
    
    overlay.style.display = 'none';
    
    // Get code from Monaco Editor
    const code = window.getEditorValue ? window.getEditorValue() : '';
    const title = titleElement.value.trim();
    const language = languageElement ? languageElement.value : 'js';

    const bot = addBot(title, '', code, language);

    // Update active bots if they match
    if (whiteBotInstance?.name && title === whiteBotInstance.name) {
        window.white_bot_code = code;
        await setupBot(bot, true);
    }
    if (blackBotInstance?.name && title === blackBotInstance.name) {
        window.black_bot_code = code;
        await setupBot(bot, false);
    }
    
    // Dispose Monaco Editor after saving
    if (window.closeEditor) {
        window.closeEditor();
    }
}

async function refreshBotsList() {
    const botListContainer = document.getElementById('bot-list-container');
    const whiteBotTypeSelect = document.getElementById('white-bot-type');
    const blackBotTypeSelect = document.getElementById('black-bot-type');
    
    // Clear existing content
    botListContainer.innerHTML = "";
    whiteBotTypeSelect.innerHTML = "";
    blackBotTypeSelect.innerHTML = "";

    // Populate bot lists
    bots.forEach(bot => {
        const languageIndicator = bot.language != 'js' ? ` [${bot.language.toUpperCase()}]` : '';
        const botLabel = `${bot.isCustom ? '* ' : ''}${bot.name}${languageIndicator}`;
        whiteBotTypeSelect.innerHTML += `<option value="${bot.name}">${botLabel}</option>`;
        blackBotTypeSelect.innerHTML += `<option value="${bot.name}">${botLabel}</option>`;
        
        // Add all bots to the container (both custom and stock)
        const langBadge = `<span class="w3-tag w3-round w3-small bot-list-badge language-color ${bot.language}"><b>${bot.language.toUpperCase()}</b></span>`;
        if (bot.isCustom) {
            botListContainer.innerHTML += `
                <div class="w3-padding-small w3-round-large bot-list-item">
                    <span class="bot-list-name">* ${bot.name}</span>
                    <button class="w3-button w3-round w3-light-green bot-list-badge hover-only" onclick="editBot('${bot.name}')">
                        <i class="fa fa-pencil"></i>
                    </button>
                    <button class="w3-button w3-round w3-red bot-list-badge hover-only" onclick="deleteBot('${bot.name}')">
                        <i class="fa fa-trash"></i>
                    </button>
                    ${langBadge}
                </div>`;
        } else {
            // Stock bot - only show view button
            botListContainer.innerHTML += `
                <div class="w3-padding-small w3-round-large bot-list-item">
                    <span class="bot-list-name">${bot.name}</span>
                    <button class="w3-button w3-round w3-light-blue bot-list-badge hover-only" onclick="viewBot('${bot.name}', false, '${bot.language}', '${bot.url}')">
                        <i class="fa fa-eye"></i>
                    </button>
                    ${langBadge}
                </div>`;
        }
    });

    // // Add custom option
    // whiteBotTypeSelect.innerHTML += '<option value="*">Import</option>';
    // blackBotTypeSelect.innerHTML += '<option value="*">Import</option>';

    // Restore saved selections
    const whiteBotType = localStorage.getItem('white-bot-type');
    const blackBotType = localStorage.getItem('black-bot-type');
    
    if (whiteBotType) {
        whiteBotTypeSelect.value = whiteBotType;
        whiteBotTypeSelect.dispatchEvent(new Event('change'));
    }
    if (blackBotType) {
        blackBotTypeSelect.value = blackBotType;
        blackBotTypeSelect.dispatchEvent(new Event('change'));
    }
}

// ============================================================================
// CODE EDITOR FUNCTIONS
// ============================================================================

/**
 * Opens the code editor with bot name and code
 * @param {string} botName - The name of the bot
 * @param {string} botCode - The bot's JavaScript/TypeScript code
 * @param {boolean} readOnly - Whether the editor should be read-only
 * @param {string} language - The language of the bot ('js' or 'ts')
 */
function openCodeEditor(botName, botCode, readOnly = false, language = 'js') {
    const titleElement = document.getElementById('code-editor-title');
    const languageElement = document.getElementById('code-editor-language');
    
    // Set the bot name in the title input
    if (titleElement) {
        titleElement.value = botName;
        
        // Configure title element based on read-only mode
        if (readOnly) {
            titleElement.disabled = false;
            titleElement.readOnly = true;
            titleElement.style.cursor = 'text';
        } else {
            titleElement.disabled = false;
            titleElement.readOnly = false;
            titleElement.style.cursor = '';
        }
    }
    
    // Set the language selection
    if (languageElement) {
        languageElement.value = language;
        
        // Disable language selection for existing bots (as requested)
        if (botName !== 'New Custom Bot') {
            languageElement.disabled = true;
        } else {
            languageElement.disabled = false;
        }
        
        // Also disable for read-only mode
        if (readOnly) {
            languageElement.disabled = true;
        }
    }
    
    if (window.openEditor) {
        // Determine the Monaco editor language
        const editorLanguage = language === 'ts' ? 'typescript' : 'javascript';
        window.openEditor(botCode, readOnly, editorLanguage);
    }
}

// ============================================================================
// MOVE NOTATION AND HISTORY
// ============================================================================

// Move history tracking
let moveHistory = [];
let currentMoveIndex = -1;

/**
 * Converts a chess piece to its algebraic notation letter
 * @param {number} piece - The piece type constant
 * @returns {string} The algebraic notation (K, Q, R, B, N, or empty for pawns)
 */
function pieceToNotation(piece) {
    const notationMap = {
        [Chess.Piece.WHITE_KING]: 'K',
        [Chess.Piece.BLACK_KING]: 'K',
        [Chess.Piece.WHITE_QUEEN]: 'Q',
        [Chess.Piece.BLACK_QUEEN]: 'Q',
        [Chess.Piece.WHITE_ROOK]: 'R',
        [Chess.Piece.BLACK_ROOK]: 'R',
        [Chess.Piece.WHITE_BISHOP]: 'B',
        [Chess.Piece.BLACK_BISHOP]: 'B',
        [Chess.Piece.WHITE_KNIGHT]: 'N',
        [Chess.Piece.BLACK_KNIGHT]: 'N',
        [Chess.Piece.WHITE_PAWN]: '',
        [Chess.Piece.BLACK_PAWN]: ''
    };
    return notationMap[piece] || '';
}

/**
 * Converts a move to standard algebraic notation with proper disambiguation
 * @param {Chess.Move} move - The move to convert
 * @param {Chess.Board} boardState - The board state before the move
 * @param {Array} allMoves - All legal moves in the position
 * @returns {string} The algebraic notation (e.g., "Nf3", "exd4", "O-O", "Qh4+")
 */
function convertMoveToAlgebraic(move, boardState, allMoves) {
    const fromSquare = move.from;
    const toSquare = move.to;
    const piece = boardState.getPiece(fromSquare);
    const capturedPiece = boardState.getPiece(toSquare);
    const pieceNotation = pieceToNotation(piece);
    
    // Check for castling
    if (pieceNotation === 'K' && Math.abs(fromSquare.charCodeAt(0) - toSquare.charCodeAt(0)) === 2) {
        return toSquare.charCodeAt(0) > fromSquare.charCodeAt(0) ? 'O-O' : 'O-O-O';
    }
    
    let notation = pieceNotation;
    let disambiguation = '';
    
    // For non-pawn moves, check if disambiguation is needed
    if (pieceNotation !== '') {
        const samePieceMoves = allMoves.filter(m => {
            const otherPiece = boardState.getPiece(m.from);
            return m.to === toSquare && 
                   m.from !== fromSquare && 
                   pieceToNotation(otherPiece) === pieceNotation;
        });
        
        if (samePieceMoves.length > 0) {
            // Check if file disambiguation is sufficient
            const sameFile = samePieceMoves.filter(m => m.from[0] === fromSquare[0]);
            if (sameFile.length === 0) {
                disambiguation = fromSquare[0].toLowerCase();
            } else {
                // Check if rank disambiguation is sufficient
                const sameRank = samePieceMoves.filter(m => m.from[1] === fromSquare[1]);
                if (sameRank.length === 0) {
                    disambiguation = fromSquare[1];
                } else {
                    // Need full square disambiguation
                    disambiguation = fromSquare.toLowerCase();
                }
            }
        }
    }
    
    // For pawn captures, always show the file
    if (pieceNotation === '' && capturedPiece !== Chess.Piece.NONE) {
        disambiguation = fromSquare[0].toLowerCase();
    }
    
    notation += disambiguation;
    
    // Add capture notation
    if (capturedPiece !== Chess.Piece.NONE) {
        notation += 'x';
    }
    
    notation += toSquare.toLowerCase();
    
    // Simulate the move to check for check/checkmate
    const tempBoard = new Chess.Board(boardState.getFEN());
    tempBoard.makeMove(move);
    
    const gameOverState = tempBoard.isGameOver();
    if (gameOverState.over) {
        if (gameOverState.reason === 'checkmate') {
            notation += '#';
        }
    } else {
        // Check if the move puts the opponent in check
        const opponentKingInCheck = tempBoard.isKingAttacked(tempBoard.whiteToPlay);
        if (opponentKingInCheck) {
            notation += '+';
        }
    }
    
    return notation;
}

function addMoveToHistory(move, notation, isWhite) {
    const moveData = {
        move: move,
        notation: notation,
        isWhite: isWhite,
        fen: board.getFEN()
    };
    
    // If we're at the end of history or this is a new move, add it
    if (currentMoveIndex === moveHistory.length - 1) {
        moveHistory.push(moveData);
        currentMoveIndex = moveHistory.length - 1;
    } else {
        // We're in the middle of history, check if we're replacing or advancing
        const nextIndex = currentMoveIndex + 1;
        if (nextIndex < moveHistory.length && 
            moveHistory[nextIndex].move.from === move.from && 
            moveHistory[nextIndex].move.to === move.to) {
            // Same move, just advance the index
            currentMoveIndex = nextIndex;
        } else {
            // Different move, replace from this point forward
            moveHistory = moveHistory.slice(0, currentMoveIndex + 1);
            moveHistory.push(moveData);
            currentMoveIndex = moveHistory.length - 1;
        }
    }
    
    updateMovesDisplay();
    updateGameStatus();
    updateUndoRedoButtons();
}

function updateMovesDisplay() {
    const movesContainer = document.getElementById('moves-list');
    if (!movesContainer) return;
    
    if (moveHistory.length === 0) {
        movesContainer.innerHTML = '<div class="w3-text-grey w3-small">No moves yet</div>';
        return;
    }
    
    let html = '';
    for (let i = 0; i < moveHistory.length; i += 2) {
        const moveNumber = Math.floor(i / 2) + 1;
        const whiteMove = moveHistory[i];
        const blackMove = moveHistory[i + 1];
        
        html += `<div class="move-pair">
            <span class="move-number">${moveNumber}.</span>
            <div class="move-notation">
                <span class="white-move ${currentMoveIndex === i ? 'move-current' : ''}" 
                      data-move-index="${i}">${whiteMove.notation}</span>`;
        
        if (blackMove) {
            html += `<span class="black-move ${currentMoveIndex === i + 1 ? 'move-current' : ''}" 
                          data-move-index="${i + 1}">${blackMove.notation}</span>`;
        } else {
            // Add empty placeholder for black move to maintain consistent layout
            html += `<span class="black-move-placeholder"></span>`;
        }
        
        html += '</div></div>';
    }
    
    movesContainer.innerHTML = html;
    
    // Add click handlers for move navigation
    movesContainer.querySelectorAll('.white-move, .black-move').forEach(moveElement => {
        moveElement.addEventListener('click', (e) => {
            const moveIndex = parseInt(e.target.getAttribute('data-move-index'));
            navigateToMove(moveIndex);
        });
    });
    
    // Auto-scroll to bottom
    const scrollContainer = document.getElementById('moves-list-container');
    if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
}

/**
 * Navigates to a specific move in the game history
 * @param {number} moveIndex - The index of the move to navigate to (-1 for initial position)
 */
function navigateToMove(moveIndex) {
    if (moveIndex < -1 || moveIndex >= moveHistory.length) return;
    
    currentMoveIndex = moveIndex;
    
    // Reset board to initial position
    board = new Chess.Board();
    
    // Replay moves up to the selected move
    for (let i = 0; i <= moveIndex; i++) {
        const moveData = moveHistory[i];
        board.makeMove(moveData.move);
    }
    
    syncBoard();
    updateMovesDisplay();
    updateGameStatus();
    updateUndoRedoButtons();
    
    // Always ensure the correct timer is running during an active game
    if (playingGame) {
        const gameOverState = board.isGameOver();
        if (!gameOverState.over) {
            const startTime = Date.now();
            startTimer(board.whiteToPlay, startTime);
        }
    }
}

/**
 * Updates the game status display with current game state
 */
function updateGameStatus() {
    const statusElement = document.getElementById('game-status');
    if (!statusElement) return;
    
    if (!playingGame) {
        statusElement.textContent = 'Ready to start';
        return;
    }
    
    const gameOverState = board.isGameOver();
    if (gameOverState.over) {
        if (gameOverState.reason === 'checkmate') {
            statusElement.textContent = `Checkmate! ${gameOverState.winner} wins`;
        } else if (gameOverState.reason === 'stalemate') {
            statusElement.textContent = 'Stalemate - Draw';
        } else {
            statusElement.textContent = `Game Over: ${gameOverState.reason}`;
        }
    } else {
        const currentPlayer = board.whiteToPlay ? 'White' : 'Black';
        const inCheck = board.isKingAttacked(board.whiteToPlay);
        statusElement.textContent = inCheck ? `${currentPlayer} to move (in check)` : `${currentPlayer} to move`;
    }
}

function clearMoveHistory() {
    moveHistory = [];
    currentMoveIndex = -1;
    updateMovesDisplay();
    updateGameStatus();
    updateUndoRedoButtons();
}

// ============================================================================
// MOVE REDO FUNCTIONALITY
// ============================================================================

function redoMove() {
    // Check if we can redo (we're not at the end of history)
    if (currentMoveIndex >= moveHistory.length - 1) return;
    
    const nextMoveIndex = currentMoveIndex + 1;
    const nextMove = moveHistory[nextMoveIndex];
    
    if (nextMove) {
        // Make the move on the board
        const result = board.makeMove(nextMove.move);
        
        if (result?.reason !== 'illegal move') {
            // Update the current move index
            currentMoveIndex = nextMoveIndex;
            
            // Update visual board
            if (result.requireSync) {
                syncBoard();
            } else {
                clearSquare(nextMove.move.from);
                const piece = board.getPiece(nextMove.move.to);
                updatePieceOnSquare(nextMove.move.to, piece);
            }
            
            updateMovesDisplay();
            updateGameStatus();
            updateUndoRedoButtons();
            
            // Always ensure the correct timer is running during an active game
            if (playingGame) {
                const gameOverState = board.isGameOver();
                if (!gameOverState.over) {
                    const startTime = Date.now();
                    startTimer(board.whiteToPlay, startTime);
                }
            }
        }
    }
}

// ============================================================================
// GAME LOGIC FUNCTIONS
// ============================================================================

/**
 * Makes a move on the board and handles move history management
 * @param {Chess.Move} move - The move to make
 * @returns {Object} The result of the move (success, game over, or illegal move)
 */
function makeMove(move) {
    // Check if we're making a move from a past position
    if (currentMoveIndex < moveHistory.length - 1) {
        const nextMoveIndex = currentMoveIndex + 1;
        const existingMove = moveHistory[nextMoveIndex];
        
        // Only clear future moves if the new move is different from the existing one
        if (!existingMove || existingMove.move.from !== move.from || existingMove.move.to !== move.to) {
            moveHistory = moveHistory.slice(0, currentMoveIndex + 1);
        }
    }
    
    // Get algebraic notation before making the move
    const allMoves = board.getMoves();
    const isWhiteMove = board.whiteToPlay;
    const algebraicNotation = convertMoveToAlgebraic(move, board, allMoves);
    
    const result = board.makeMove(move);
    
    // Handle illegal move
    if (result?.reason === 'illegal move') {
        return result;
    }
    
    // Record the move in history
    addMoveToHistory(move, algebraicNotation, isWhiteMove);

    // Update visual board
    clearSquare(move.from);
    const piece = board.getPiece(move.to);
    updatePieceOnSquare(move.to, piece);

    // Special moves may require full board sync
    if (result.requireSync) {
        syncBoard();
    }

    // Return the result (could be game over or success)
    return result;
}

/**
 * Undoes the last move by navigating to the previous position in move history
 */
function undoMove() {
    // Check if we can undo (we're not at the beginning)
    if (currentMoveIndex < 0) return;
    
    // Navigate to the previous move (or initial position if currentMoveIndex is 0)
    const newIndex = currentMoveIndex - 1;
    
    if (newIndex >= -1) {
        navigateToMove(newIndex);
    }
}

/**
 * Shows a dialog to select the piece for promotion
 * @returns {Promise<string>} Promise that resolves to the selected piece type ('queen', 'rook', 'bishop', 'knight')
 */
function showPromotionOverlay() {
    return new Promise((resolve) => {
        const overlay = document.getElementById('promotion-overlay');
        const buttons = overlay.querySelectorAll('.promotion-piece-button');
        
        overlay.style.display = 'flex';
        
        const handleSelection = (event) => {
            const piece = event.currentTarget.dataset.piece;
            overlay.style.display = 'none';
            
            // Remove event listeners
            buttons.forEach(button => {
                button.removeEventListener('click', handleSelection);
            });
            document.removeEventListener('keydown', handleKeyPress);
            
            resolve(piece);
        };
        
        const handleKeyPress = (event) => {
            let piece = null;
            switch(event.key.toLowerCase()) {
                case 'q':
                    piece = 'queen';
                    break;
                case 'r':
                    piece = 'rook';
                    break;
                case 'b':
                    piece = 'bishop';
                    break;
                case 'n':
                    piece = 'knight';
                    break;
                default:
                    return; // Don't handle other keys
            }
            
            overlay.style.display = 'none';
            
            // Remove event listeners
            buttons.forEach(button => {
                button.removeEventListener('click', handleSelection);
            });
            document.removeEventListener('keydown', handleKeyPress);
            
            resolve(piece);
        };
        
        // Add event listeners
        buttons.forEach(button => {
            button.addEventListener('click', handleSelection);
        });
        document.addEventListener('keydown', handleKeyPress);
    });
}

// ============================================================================
// INITIALIZATION AND WINDOW EXPORTS
// ============================================================================

// Export functions to window object for HTML onclick handlers
window.openMenu = openMenu;
window.closeMenu = closeMenu;
window.closeOverlay = closeOverlay;
window.startGameBtnPressed = startGameBtnPressed;
window.undoMoveBtnPressed = undoMoveBtnPressed;
window.showPromotionOverlay = showPromotionOverlay;
window.redoMoveBtnPressed = redoMoveBtnPressed;
window.openCodeEditor = openCodeEditor;
window.saveBot = saveBot;
window.editBot = editBot;
window.viewBot = viewBot;
window.showNewBotDialog = showNewBotDialog;
window.newBotCode = DEFAULT_BOT_CODE_JS;
window.board = board;
window.syncBoard = syncBoard;
window.deleteBot = deleteBot;

// Initialize the application
/**
 * Main application initialization function - sets up the entire chess application
 */
async function initializeApp() {
    // Set up event listeners
    setupEventListeners();
    
    // Create initial board
    createBoard(whiteOnBottom);
    syncBoard();

    // Initialize game status
    updateGameStatus();
    
    // Initialize button states
    updateUndoRedoButtons();

    // Load settings from localStorage
    loadSettings();
    
    // Load bots
    await loadBots();
    refreshBotsList();

    await initializeMonaco(document.getElementById('code-editor'));
}

/**
 * Loads saved settings from localStorage and applies them to the UI
 */
function loadSettings() {
    const whiteType = localStorage.getItem('white-player-type') || 'human';
    const blackType = localStorage.getItem('black-player-type') || 'bot';
    const rotated = localStorage.getItem('board-rotated') || 'white';

    const whitePlayerTypeElement = document.getElementById('white-player-type');
    const blackPlayerTypeElement = document.getElementById('black-player-type');
    const boardRotatedElement = document.getElementById('board-rotated');
    
    whitePlayerTypeElement.value = whiteType;
    whitePlayerTypeElement.dispatchEvent(new Event('change'));
    
    blackPlayerTypeElement.value = blackType;
    blackPlayerTypeElement.dispatchEvent(new Event('change'));
    
    boardRotatedElement.value = rotated;
    boardRotatedElement.dispatchEvent(new Event('change'));

    document.getElementById('white-bot-script').style.display = whiteType === 'bot' ? 'block' : 'none';
    document.getElementById('black-bot-script').style.display = blackType === 'bot' ? 'block' : 'none';
}

// Start the application when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// ============================================================================
// DOM EVENT HANDLING
// ============================================================================

function setupEventListeners() {
    // Menu buttons
    const openMenuBtn = document.getElementById('open-menu-btn');
    const closeMenuBtn = document.getElementById('close-menu-btn');
    const newGameBtn = document.getElementById('new-game-btn');
    const undoBtn = document.getElementById('undo-move-btn');
    const redoBtn = document.getElementById('redo-move-btn');
    const newBotBtn = document.getElementById('new-bot-btn');
    const startGameBtn = document.getElementById('start-game-btn');
    const codeEditorSave = document.getElementById('code-editor-save');
    const codeEditorCancel = document.getElementById('code-editor-cancel');
    const selectJsBot = document.getElementById('select-js-bot');
    const selectTsBot = document.getElementById('select-ts-bot');

    // Add event listeners
    if (openMenuBtn) openMenuBtn.addEventListener('click', openMenu);
    if (closeMenuBtn) closeMenuBtn.addEventListener('click', closeMenu);
    if (newGameBtn) newGameBtn.addEventListener('click', showNewGameOverlay);
    if (undoBtn) undoBtn.addEventListener('click', undoMoveBtnPressed);
    if (redoBtn) redoBtn.addEventListener('click', redoMoveBtnPressed);
    if (newBotBtn) newBotBtn.addEventListener('click', showNewBotDialog);
    if (startGameBtn) startGameBtn.addEventListener('click', startGameBtnPressed);
    if (codeEditorSave) codeEditorSave.addEventListener('click', saveBot);
    if (codeEditorCancel) {
        codeEditorCancel.addEventListener('click', () => {
            if (window.closeEditor) {
                window.closeEditor();
            } else {
                const overlay = document.getElementById('code-editor-overlay');
                overlay.style.display = 'none';
                document.body.classList.remove('modal-overlay-active');
                
                // Restore focus to the previously focused element
                if (window.lastFocusedElement) {
                    window.lastFocusedElement.focus();
                    window.lastFocusedElement = null;
                }
            }
        });
    }
    selectJsBot.addEventListener('click', () => {
        closeOverlay('new-bot-language-dialog');
        openCodeEditor('New Custom Bot', DEFAULT_BOT_CODE_JS, false, 'js');
    });

    selectTsBot.addEventListener('click', () => {
        closeOverlay('new-bot-language-dialog');
        openCodeEditor('New Custom Bot', DEFAULT_BOT_CODE_TS, false, 'ts');
    });

    // Focus trap for overlays
    document.addEventListener('keydown', handleOverlayKeydown);
    
    // Overlay close buttons
    document.querySelectorAll('[data-close-overlay]').forEach(button => {
        button.addEventListener('click', (e) => {
            const overlayId = e.target.getAttribute('data-close-overlay');
            closeOverlay(overlayId);
        });
    });

    // Player type selection buttons
    document.querySelectorAll('.selection-toggle-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const target = e.target.getAttribute('data-target');
            const value = e.target.getAttribute('data-value');
            const selectElement = document.getElementById(target);
            
            if (selectElement) {
                selectElement.value = value;
                selectElement.dispatchEvent(new Event('change'));
            }
        });
    });

    // Player type change handlers
    setupPlayerTypeHandlers();
    setupBotTypeHandlers();
}

function setupPlayerTypeHandlers() {
    const selects = ['white-player-type', 'black-player-type', 'board-rotated'];

    selects.forEach(select => {
        const element = document.getElementById(select);
        if (element) {
            element.addEventListener('change', (e) => {
                handleSelectChange(e.target);
            });
        }
    });
}

function setupBotTypeHandlers() {
    const botTypes = ['white-bot-type', 'black-bot-type'];
    
    botTypes.forEach(typeId => {
        const element = document.getElementById(typeId);
        if (element) {
            element.addEventListener('change', (e) => {
                handleBotTypeChange(e.target);
            });
        }
    });
}

function handleSelectChange(selectElement) {
    const value = selectElement.value;
    const id = selectElement.id;
    
    // Save to localStorage
    localStorage.setItem(id, value);
    
    // Update button visual states
    updateButtonStates(selectElement);

    if (id.includes('-player-type')) {
        const botConfig = document.getElementById(`${id.includes('white') ? 'white' : 'black'}-bot-config`);
        if (botConfig) {
            botConfig.style.display = value === 'bot' ? 'flex' : 'none';
        }
    }

    // Show/hide bot selection
    if (id.includes('player-type')) {
        const color = id.includes('white') ? 'white' : 'black';
        const botSection = document.getElementById(`${color}-bot-type`);
        const scriptInput = document.getElementById(`${color}-bot-script`);
        
        if (botSection) {
            botSection.style.display = value === 'bot' ? 'flex' : 'none';
        }
        if (scriptInput) {
            scriptInput.style.display = (value === 'bot' && botSection.value == "*") ? 'block' : 'none';
        }
    }
}

function handleBotTypeChange(selectElement) {
    const value = selectElement.value;
    const id = selectElement.id;
    
    // Save to localStorage
    localStorage.setItem(id, value);
    
    // Show/hide script input for custom bots
    const color = id.includes('white') ? 'white' : 'black';
    const scriptInput = document.getElementById(`${color}-bot-script`);
    
    if (scriptInput) {
        scriptInput.style.display = value === '*' ? 'block' : 'none';
    }
}

function updateButtonStates(selectElement) {
    const container = selectElement.parentElement;
    const buttons = container.querySelectorAll('.selection-toggle-button');
    const selectedValue = selectElement.value;
    
    buttons.forEach(button => {
        const buttonValue = button.getAttribute('data-value');
        if (buttonValue === selectedValue) {
            button.classList.add('w3-light-grey', 'w3-hover-light-grey');
        } else {
            button.classList.remove('w3-light-grey', 'w3-hover-light-grey');
        }
    });
}

function showNewGameOverlay() {
    const overlay = document.getElementById('new-game-overlay');
    if (overlay) {
        // Store currently focused element
        window.lastFocusedElement = document.activeElement;
        
        // Add overlay active state
        document.body.classList.add('modal-overlay-active');
        
        // Show overlay
        overlay.style.display = 'flex';
        
        // Focus the first focusable element in the overlay
        setTimeout(() => {
            const firstFocusable = overlay.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (firstFocusable) {
                firstFocusable.focus();
            }
        }, 0);
    }
}

/**
 * Gets user input via mouse drag-and-drop interface for making moves
 * @returns {Promise<Chess.Move|null>} Promise that resolves to a move or null if cancelled
 */
async function getUserInput() {
    return new Promise(resolve => {
        let resolved = false;
        let dragState = {
            startSquare: null,
            piece: null,
            dragImg: null,
            offsetX: 0,
            offsetY: 0,
            deletedPiece: '',
            validMoves: []
        };

        function tryResolve(move) {
            if (!resolved) {
                resolved = true;
                cleanup();
                resolve(move);
            }
        }

        function cleanup() {
            // Remove event listeners and highlights
            document.querySelectorAll('.chess-game-square').forEach(sq => {
                sq.removeEventListener('mousedown', onDragStart);
                sq.classList.remove('square-selected');
            });
            document.removeEventListener('mousemove', onDragMove);
            document.removeEventListener('mouseup', onDragEnd);
            
            // Remove drag image
            if (dragState.dragImg?.parentNode) {
                dragState.dragImg.parentNode.removeChild(dragState.dragImg);
                dragState.dragImg = null;
            }
        }

        function onDragStart(e) {
            if (undoRequested || quitRequested) {
                tryResolve(null);
                return;
            }
            
            let target = e.target;
            if (!target.classList.contains('chess-game-square')) {
                target = target.closest('.chess-game-square');
            }
            if (!target) return;

            const square = target.id;
            const piece = board.getPiece(square);
            const allMoves = board.getMoves();
            dragState.validMoves = allMoves.filter(move => move.from === square);

            // Highlight valid move destinations
            dragState.validMoves.forEach(move => {
                const elem = document.getElementById(move.to);
                elem.classList.add('square-selected');
            });

            // Check if this is the player's piece
            if (!isPlayerPiece(piece, board.whiteToPlay)) return;

            // Initialize drag state
            dragState.startSquare = square;
            dragState.piece = piece;
            const rect = target.getBoundingClientRect();
            dragState.offsetX = rect.width / 2;
            dragState.offsetY = rect.height / 2;

            // Set up drag events
            document.addEventListener('mousemove', onDragMove);
            document.addEventListener('mouseup', onDragEnd);

            // Store and clear original piece
            dragState.deletedPiece = target.innerHTML;
            target.innerHTML = '';

            // Create drag image
            const imgSrc = getPieceImage(dragState.piece);
            if (imgSrc) {
                createDragImage(imgSrc, rect, e);
            }
        }

        function createDragImage(imgSrc, rect, e) {
            if (dragState.dragImg) {
                document.body.removeChild(dragState.dragImg);
            }
            
            dragState.dragImg = document.createElement('img');
            dragState.dragImg.src = imgSrc;
            dragState.dragImg.draggable = false;
            dragState.dragImg.className = 'dragging';
            
            Object.assign(dragState.dragImg.style, {
                width: rect.width + 'px',
                height: rect.height + 'px',
                zIndex: '1000',
                left: (e.pageX - dragState.offsetX) + 'px',
                top: (e.pageY - dragState.offsetY) + 'px',
                position: 'absolute'
            });
            
            document.body.appendChild(dragState.dragImg);
        }

        function onDragMove(e) {
            if (!dragState.dragImg) return;
            dragState.dragImg.style.left = (e.pageX - dragState.offsetX) + 'px';
            dragState.dragImg.style.top = (e.pageY - dragState.offsetY) + 'px';
        }

        async function onDragEnd(e) {
            if (!dragState.startSquare || !dragState.piece) {
                cleanup();
                return;
            }

            // Find target square
            let targetSquare = null;
            document.querySelectorAll('.chess-game-square').forEach(sq => {
                const rect = sq.getBoundingClientRect();
                if (e.clientX >= rect.left && e.clientX <= rect.right &&
                    e.clientY >= rect.top && e.clientY <= rect.bottom) {
                    targetSquare = sq.id;
                }
            });

            // Clean up drag image and restore original piece
            if (dragState.dragImg?.parentNode) {
                dragState.dragImg.parentNode.removeChild(dragState.dragImg);
                dragState.dragImg = null;
            }
            document.getElementById(dragState.startSquare).innerHTML = dragState.deletedPiece;

            // Clean up drag event listeners before handling promotion to prevent interference
            cleanup();

            // Check if move is valid
            const move = dragState.validMoves.find(move => move.from === dragState.startSquare && move.to === targetSquare);
            if (move) {
                if (move.promotion) {
                    // Handle promotion move - show promotion overlay
                    move.promotion = await showPromotionOverlay();
                    tryResolve(move);
                } else {
                    tryResolve(move);
                }
            } else {
                tryResolve(null);
            }
        }

        // Set up initial event listeners
        document.querySelectorAll('.chess-game-square').forEach(sq => {
            sq.addEventListener('mousedown', onDragStart);
        });

        // Check for undo/quit requests
        const undoCheck = setInterval(() => {
            if (undoRequested || quitRequested) {
                tryResolve(null);
                clearInterval(undoCheck);
            }
        }, UNDO_CHECK_INTERVAL);
    });
}

async function getBotInput() {
    return new Promise(resolve => {
        let finished = false;
        const botIframe = board.whiteToPlay ? whiteBotIframe : blackBotIframe;

        // Fallback for missing bot
        if (!botIframe) {
            resolve(null);
        }

        // Send thinking request to bot
        const boardFEN = board.getFEN();
        botIframe.contentWindow.postMessage({ type: 'think', value: boardFEN }, "*");

        // Poll for bot response
        const moveCheck = setInterval(() => {
            const moveObj = board.whiteToPlay ? whiteBotMove : blackBotMove;
            if (moveObj) {
                finished = true;
                
                // Clear the move
                if (board.whiteToPlay) whiteBotMove = null;
                else blackBotMove = null;
                
                clearInterval(moveCheck);
                clearInterval(undoCheck);
                
                const move = moveObj ? new Chess.Move(
                    moveObj.from.toUpperCase(), 
                    moveObj.to.toUpperCase(), 
                    moveObj.promotion || null
                ) : null;
                resolve(move);
            }
        }, BOT_POLL_INTERVAL);

        // Check for interruptions
        const undoCheck = setInterval(() => {
            if ((undoRequested || quitRequested) && !finished) {
                finished = true;
                clearInterval(moveCheck);
                clearInterval(undoCheck);
                
                // Clear any pending moves
                if (board.whiteToPlay) whiteBotMove = null;
                else blackBotMove = null;
                
                resolve(null);
            }
        }, UNDO_CHECK_INTERVAL);
    });
}

/**
 * Main game controller that manages a complete chess game
 * @param {boolean} whiteIsHuman - Whether white player is human (vs bot)
 * @param {boolean} blackIsHuman - Whether black player is human (vs bot)
 */
async function playGame(whiteIsHuman, blackIsHuman) {
    playingGame = true;
    resetTimers();

    // Set up player names
    setupPlayerNames(whiteIsHuman, blackIsHuman);
    
    // Add bot indicators
    addBotIndicators(whiteIsHuman, blackIsHuman);

    // Update initial game status and button states
    updateGameStatus();
    updateUndoRedoButtons();

    const gameResult = await gameLoop(whiteIsHuman, blackIsHuman);
    
    stopTimers();
    displayGameResult(gameResult);
    
    playingGame = false;
    quitRequested = false;
    updateUndoRedoButtons();
}

function setupPlayerNames(whiteIsHuman, blackIsHuman) {
    const topName = document.getElementById('player-top-name');
    const bottomName = document.getElementById('player-bottom-name');
    
    if (whiteOnBottom) {
        topName.innerHTML = blackIsHuman ? 'Black' : `${blackBotInstance.name} [Black]`;
        bottomName.innerHTML = whiteIsHuman ? 'White' : `${whiteBotInstance.name} [White]`;
    } else {
        topName.innerHTML = whiteIsHuman ? 'White' : `${whiteBotInstance.name} [White]`;
        bottomName.innerHTML = blackIsHuman ? 'Black' : `${blackBotInstance.name} [Black]`;
    }
}

function addBotIndicators(whiteIsHuman, blackIsHuman) {
    const botIndicator = `<div id="bot-indicator" class="w3-right w3-padding-small w3-round-large w3-light-green" style="text-align: center; margin-left: 5px; user-select: none">BOT</div>`;
    
    if (!whiteIsHuman) {
        const id = whiteOnBottom ? 'player-bottom-display' : 'player-top-display';
        const display = document.getElementById(id);
        display.innerHTML += botIndicator;
    }
    if (!blackIsHuman) {
        const id = whiteOnBottom ? 'player-top-display' : 'player-bottom-display';
        const display = document.getElementById(id);
        display.innerHTML += botIndicator;
    }
}

async function gameLoop(whiteIsHuman, blackIsHuman) {
    while (true) {
        if (quitRequested) {
            return { over: true, reason: "game interrupted", winner: "draw" };
        }

        const startTime = Date.now();
        startTimer(board.whiteToPlay, startTime);

        undoRequested = false;
        const move = board.whiteToPlay ? 
            (whiteIsHuman ? await getUserInput() : await getBotInput()) :
            (blackIsHuman ? await getUserInput() : await getBotInput());

        if (quitRequested) {
            return { over: true, reason: "game interrupted", winner: "draw" };
        }

        if (undoRequested) {
            // Don't stop timers, just continue the loop
            continue;
        }

        // Update timer accumulation
        const elapsed = Date.now() - startTime;
        if (board.whiteToPlay) {
            whiteAccumulated += elapsed;
            whiteTime = whiteAccumulated;
        } else {
            blackAccumulated += elapsed;
            blackTime = blackAccumulated;
        }
        // Don't stop timers here - the next iteration will start the correct timer

        // Process move
        if (!move || move.from === move.to) continue;
        
        const moveResult = makeMove(move);
        
        // Handle illegal move - treat as loss
        if (moveResult.over && moveResult.reason === 'illegal move') {
            console.log(`%c[%c${board.whiteToPlay ? 'White' : 'Black'}%c] %cIllegal move %cfrom%c %c${move.from} %cto%c %c${move.to}`, 
                '', '', '', 'color: red', 'color: darkgrey;', '', 'color: aqua', 'color: darkgrey;', '', 'color: aqua');
            return moveResult;
        }
        
        // Handle game over result from move
        if (moveResult.over) {
            return moveResult;
        }
    }
}

function displayGameResult(gameResult) {
    if (gameResult.reason !== 'game interrupted') {
        const overlay = document.getElementById('game-finished-overlay');
        const overlayContent = document.getElementById('game-finished-overlay-content');
        
        // Store currently focused element
        window.lastFocusedElement = document.activeElement;
        
        // Add overlay active state
        document.body.classList.add('modal-overlay-active');
        
        overlay.style.display = 'flex';
        
        if (gameResult.winner === 'white') {
            overlayContent.innerHTML = `<h3>White wins!</h3><br>${gameResult.reason}`;
        } else if (gameResult.winner === 'black') {
            overlayContent.innerHTML = `<h3>Black wins!</h3><br>${gameResult.reason}`;
        } else {
            overlayContent.innerHTML = `<h3>Draw!</h3><br>${gameResult.reason}`;
        }
        
        // Focus the close button
        setTimeout(() => {
            const closeButton = overlay.querySelector('.modal-close-button');
            if (closeButton) {
                closeButton.focus();
            }
        }, 0);
    }
}

// ============================================================================
// TYPESCRIPT COMPILATION
// ============================================================================

/**
 * Compiles TypeScript code to JavaScript using the TypeScript compiler
 * @param {string} tsCode - The TypeScript code to compile
 * @returns {string} The compiled JavaScript code
 */
async function compileTypeScript(tsCode) {
    try {
        // Load TypeScript compiler for the browser
        if (!window.ts) {
            // Try to load TypeScript from CDN
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/typescript@latest/lib/typescript.js';
            document.head.appendChild(script);
            
            // Wait for TypeScript to load
            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
            });
        }
        
        // Compile options
        const compilerOptions = {
            target: window.ts.ScriptTarget.ES2020,
            module: window.ts.ModuleKind.ESNext,
            moduleResolution: window.ts.ModuleResolutionKind.Node10,
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
            declaration: false,
            sourceMap: false
        };

        // Compile the TypeScript code
        const result = window.ts.transpile(tsCode, compilerOptions);
        
        return result;
    } catch (error) {
        console.error('TypeScript compilation error:', error);
        throw new Error(`Failed to compile TypeScript: ${error.message}`);
    }
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

async function startGameBtnPressed() {
    if (playingGame) {
        quitRequested = true;
    }

    closeOverlay('new-game-overlay');
    
    const whitePlayerType = document.getElementById('white-player-type').value;
    const blackPlayerType = document.getElementById('black-player-type').value;
    const boardRotated = document.getElementById('board-rotated').value;
    
    // Set up bots if needed
    try {
        if (whitePlayerType === 'bot') {
            await setupPlayerBot(true);
        }
        if (blackPlayerType === 'bot') {
            await setupPlayerBot(false);
        }
    } catch (error) {
        console.error('Error setting up bots:', error);
        return;
    }
    
    // Configure board orientation
    whiteOnBottom = boardRotated === 'white';
    
    // Clean up previous game
    document.querySelectorAll('#bot-indicator').forEach(el => el.remove());
    
    // Initialize new game
    board = new Chess.Board();
    clearMoveHistory();
    createBoard(whiteOnBottom);
    syncBoard();

    // Wait for any ongoing game to finish
    while (playingGame) await sleep(25);
    
    // Start new game
    playGame(whitePlayerType === 'human', blackPlayerType === 'human');
}

async function setupPlayerBot(isWhite) {
    const typeElement = document.getElementById(isWhite ? 'white-bot-type' : 'black-bot-type');
    const inputElement = document.getElementById(isWhite ? 'white-bot-script' : 'black-bot-script');
    const isCustom = typeElement.value === '*';

    if (isCustom) {
        if (!inputElement.files || inputElement.files.length === 0) {
            throw new Error(`[${isWhite ? 'White' : 'Black'} Bot] Error: No bot file selected`);
        }
        
        const file = inputElement.files[0];
        const code = await readFileAsText(file);
        const bot = addBot(file.name, '', code);
        await setupBot(bot, isWhite);
    } else {
        const bot = bots.find(b => b.name === typeElement.value);
        if (!bot) {
            throw new Error(`[${isWhite ? 'White' : 'Black'} Bot] Error: Bot "${typeElement.value}" not found`);
        }
        await setupBot(bot, isWhite);
    }
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

function undoMoveBtnPressed() {
    if (playingGame) {
        undoRequested = true;
        undoMove();
    } else {
        // Allow navigation through move history even after game ends
        undoMove();
    }
}

function redoMoveBtnPressed() {
    // Allow redo both during game and after game ends
    redoMove();
}

function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undo-move-btn');
    const redoBtn = document.getElementById('redo-move-btn');
    
    if (undoBtn) {
        // Enable undo if we have moves in history and we're not at the initial position
        // Allow navigation even after game ends
        undoBtn.disabled = moveHistory.length === 0 || currentMoveIndex < 0;
    }
    
    if (redoBtn) {
        // Enable redo if we can move forward in history
        // Allow navigation even after game ends
        redoBtn.disabled = moveHistory.length === 0 || currentMoveIndex >= moveHistory.length - 1;
    }
}

/**
 * Shows a dialog to select the language for a new bot
 */
function showNewBotDialog() {
    const dialog = document.getElementById('new-bot-language-dialog');
    dialog.style.display = 'flex';
    document.body.classList.add('modal-overlay-active');
    
    // Store currently focused element
    window.lastFocusedElement = document.activeElement;
    
    // Focus first button
    setTimeout(() => {
        document.getElementById('select-js-bot').focus();
    }, 0);
}
