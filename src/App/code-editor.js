const codeEditor = document.getElementById('code-editor');
const codeEditorOverlay = document.getElementById('code-editor-overlay');

// History management for undo/redo
let history = [];
let historyIndex = -1;
let isUndoRedo = false;

function saveToHistory() {
    if (isUndoRedo) return;
    
    const currentState = {
        text: codeEditor.innerText,
        caretOffset: getCaretCharacterOffsetWithin(codeEditor)
    };
    
    // Don't save if it's the same as the last state
    if (history.length > 0 && history[historyIndex].text === currentState.text) {
        return;
    }
    
    // Remove any future history if we're not at the end
    if (historyIndex < history.length - 1) {
        history = history.slice(0, historyIndex + 1);
    }
    
    // Add new state to history
    history.push(currentState);
    historyIndex = history.length - 1;
    
    // Limit history size to prevent memory issues
    if (history.length > 100) {
        history.shift();
        historyIndex--;
    }
}

function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        const state = history[historyIndex];
        isUndoRedo = true;
        codeEditor.innerText = state.text;
        codeEditor.innerHTML = Prism.highlight(state.text, Prism.languages.javascript, 'javascript');
        setTimeout(() => {
            setCaret(codeEditor, state.caretOffset);
            isUndoRedo = false;
        }, 0);
    }
}

function redo() {
    if (historyIndex < history.length - 1) {
        historyIndex++;
        const state = history[historyIndex];
        isUndoRedo = true;
        codeEditor.innerText = state.text;
        codeEditor.innerHTML = Prism.highlight(state.text, Prism.languages.javascript, 'javascript');
        setTimeout(() => {
            setCaret(codeEditor, state.caretOffset);
            isUndoRedo = false;
        }, 0);
    }
}

codeEditor.addEventListener('input', function() {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(codeEditor);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    const caretOffset = preCaretRange.toString().length;

    const text = codeEditor.innerText;

    codeEditor.innerHTML = Prism.highlight(text, Prism.languages.javascript, 'javascript');

    function setCaret(el, offset) {
        let node = el;
        let charsLeft = offset;
        let stack = [el], found = false;
        while (stack.length && !found) {
            node = stack.pop();
            if (node.nodeType === 3) {
                if (node.length >= charsLeft) {
                    const range = document.createRange();
                    range.setStart(node, charsLeft);
                    range.collapse(true);
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);
                    found = true;
                } else {
                    charsLeft -= node.length;
                }
            } else {
                for (let i = node.childNodes.length - 1; i >= 0; i--) {
                    stack.push(node.childNodes[i]);
                }
            }
        }
    }
    setCaret(codeEditor, caretOffset);
    
    // Initialize history if this is the first content
    initializeHistoryWithContent();
    
    // Save to history after input
    saveToHistory();
});

codeEditor.addEventListener('keydown', function(e) {
    if (e.isComposing) return;

    // Handle undo/redo
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
    }
    
    if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
    }

    if (e.key === 'Tab' && !e.shiftKey) {
        // Ensure we have the current state in history before making changes
        if (history.length === 0 || (history.length > 0 && history[historyIndex].text !== codeEditor.innerText)) {
            saveToHistory();
        }
        
        e.preventDefault();
        insertAtCaret('    ');
        return;
    }

    if (e.key === 'Tab' && e.shiftKey) {
        return;
    }

    const pairs = {
        '(': ')',
        '{': '}',
        '[': ']',
        '"': '"',
        "'": "'",
        '`': '`'
    };
    if (Object.keys(pairs).includes(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Ensure we have the current state in history before making changes
        if (history.length === 0 || (history.length > 0 && history[historyIndex].text !== codeEditor.innerText)) {
            saveToHistory();
        }
        
        e.preventDefault();
        const sel = window.getSelection();
        const range = sel.getRangeAt(0);
        let caretOffset = getCaretCharacterOffsetWithin(codeEditor);
        let text = codeEditor.innerText;
        let open = e.key;
        let close = pairs[e.key];
        if (!range.collapsed) {
            const selectedText = range.toString();
            replaceSelection(open + selectedText + close);
            setTimeout(() => {
                setCaret(codeEditor, caretOffset + 1);
            }, 0);
        } else {
            let after = text[caretOffset];
            if (after === close && open === close) {
                setTimeout(() => {
                    setCaret(codeEditor, caretOffset + 1);
                }, 0);
            } else {
                insertAtCaret(open + close);
                setTimeout(() => {
                    setCaret(codeEditor, caretOffset + 1);
                }, 0);
            }
        }
        return;
    }

    const closingPairs = {
        ')': '(',
        '}': '{',
        ']': '[',
        '"': '"',
        "'": "'",
        '`': '`'
    };
    if (
        Object.keys(closingPairs).includes(e.key) &&
        !e.ctrlKey && !e.metaKey && !e.altKey
    ) {
        const sel = window.getSelection();
        if (!sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        if (!range.collapsed) return;
        let caretOffset = getCaretCharacterOffsetWithin(codeEditor);
        let text = codeEditor.innerText;
        let after = text[caretOffset];
        if (after === e.key) {
            e.preventDefault();
            setTimeout(() => {
                setCaret(codeEditor, caretOffset + 1);
            }, 0);
            return;
        }
    }

    if (
        e.key === 'Enter' &&
        !e.shiftKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.metaKey
    ) {
        // Ensure we have the current state in history before making changes
        if (history.length === 0 || (history.length > 0 && history[historyIndex].text !== codeEditor.innerText)) {
            saveToHistory();
        }
        
        const sel = window.getSelection();
        if (!sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        if (!range.collapsed) return;

        let caretOffset = getCaretCharacterOffsetWithin(codeEditor);
        let text = codeEditor.innerText;
        let before = text[caretOffset - 1];
        let after = text[caretOffset];
        const expandPairs = {
            '{': '}',
            '(': ')',
            '[': ']',
            '`': '`'
        };
        if (
            Object.keys(expandPairs).includes(before) &&
            expandPairs[before] === after
        ) {
            e.preventDefault();
            let lineStart = text.lastIndexOf('\n', caretOffset - 1) + 1;
            let indentMatch = text.slice(lineStart, caretOffset - 1).match(/^\s*/);
            let indent = indentMatch ? indentMatch[0] : '';
            let newIndent = indent + '    ';
            let insertText = '\n' + newIndent + '\n' + indent;
            insertAtCaret(insertText);
            setTimeout(() => {
                setCaret(codeEditor, caretOffset + 1 + newIndent.length);
            }, 0);
            return;
        } else {
            // Check if cursor is at the end of the line
            let lineEnd = text.indexOf('\n', caretOffset);
            if (lineEnd === -1) lineEnd = text.length; // Handle last line
            
            if (caretOffset === lineEnd) {
                // User pressed Enter at the end of a line
                e.preventDefault();
                let lineStart = text.lastIndexOf('\n', caretOffset - 1) + 1;
                let indentMatch = text.slice(lineStart, caretOffset).match(/^\s*/);
                let indent = indentMatch ? indentMatch[0] : '';
                
                insertAtCaret('\n' + indent);
                return;
            }
        }
    }

    if (
        e.key === 'Backspace' &&
        !e.shiftKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.metaKey
    ) {
        // Ensure we have the current state in history before making changes
        if (history.length === 0 || (history.length > 0 && history[historyIndex].text !== codeEditor.innerText)) {
            saveToHistory();
        }
        
        const sel = window.getSelection();
        if (!sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        if (!range.collapsed) return;
        let caretOffset = getCaretCharacterOffsetWithin(codeEditor);
        let text = codeEditor.innerText;
        let before = text[caretOffset - 1];
        let after = text[caretOffset];
        const closeFor = {
            '(': ')',
            '{': '}',
            '[': ']',
            '"': '"',
            "'": "'",
            '`': '`'
        };
        if (
            Object.keys(closeFor).includes(before) &&
            closeFor[before] === after
        ) {
            e.preventDefault();
            let newText = text.slice(0, caretOffset - 1) + text.slice(caretOffset + 1);
            codeEditor.innerText = newText;
            codeEditor.innerHTML = Prism.highlight(newText, Prism.languages.javascript, 'javascript');
            setTimeout(() => {
                setCaret(codeEditor, caretOffset - 1);
            }, 0);
            return;
        }
    }
});

// Initialize history with the current state
if (codeEditor.innerText.trim() !== '') {
    saveToHistory();
}

// Function to reset the editor
function resetEditor() {
    // Clear the editor content
    codeEditor.innerText = '';
    codeEditor.innerHTML = '';
    
    // Clear history
    history = [];
    historyIndex = -1;
    
    // Reset undo/redo flag
    isUndoRedo = false;
    
    // Don't initialize with empty state - let it be added when content is actually added
}

// Function to initialize history when content is loaded
function initializeHistoryWithContent() {
    if (codeEditor.innerText.trim() !== '' && history.length === 0) {
        saveToHistory();
    }
}

// Watch for display style changes
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            if (codeEditorOverlay.style.display === 'none') {
                resetEditor();
            }
        }
    });
});

// Start observing style changes on the code editor overlay
observer.observe(codeEditorOverlay, {
    attributes: true,
    attributeFilter: ['style']
});

function insertAtCaret(text) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    range.setStart(textNode, text.length);
    range.setEnd(textNode, text.length);
    sel.removeAllRanges();
    sel.addRange(range);
    codeEditor.dispatchEvent(new Event('input'));
}

function replaceSelection(text) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    range.setStart(textNode, text.length);
    range.setEnd(textNode, text.length);
    sel.removeAllRanges();
    sel.addRange(range);
    codeEditor.dispatchEvent(new Event('input'));
}

function getCaretCharacterOffsetWithin(element) {
    let caretOffset = 0;
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(element);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        caretOffset = preCaretRange.toString().length;
    }
    return caretOffset;
}

function setCaret(el, offset) {
    let node = el;
    let charsLeft = offset;
    let stack = [el], found = false;
    while (stack.length && !found) {
        node = stack.pop();
        if (node.nodeType === 3) {
            if (node.length >= charsLeft) {
                const range = document.createRange();
                range.setStart(node, charsLeft);
                range.collapse(true);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
                found = true;
            } else {
                charsLeft -= node.length;
            }
        } else {
            for (let i = node.childNodes.length - 1; i >= 0; i--) {
                stack.push(node.childNodes[i]);
            }
        }
    }
}
                