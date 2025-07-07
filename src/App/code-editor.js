// Monaco Editor integration for RoboticChess
// This module replaces the legacy Prism.js-based editor with Monaco Editor

// Load Monaco Editor module
const monacoScript = document.createElement('script');
monacoScript.src = './monaco-editor.js';
document.head.appendChild(monacoScript);

// DOM elements
const codeEditor = document.getElementById('code-editor');
const codeEditorOverlay = document.getElementById('code-editor-overlay');

// Monaco Editor state
let monacoEditorInstance = null;
let isMonacoInitialized = false;

// Initialize Monaco Editor
async function initializeMonaco(container, initialValue = '', readOnly = false, language = 'javascript') {
    try {
        // Show loading state
        container.classList.add('loading');
        container.innerHTML = '';
        
        // Wait for Monaco module to load
        while (!window.MonacoEditor) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Remove loading state
        container.classList.remove('loading');
        
        // Initialize Monaco with language
        monacoEditorInstance = await window.MonacoEditor.initialize(
            container, 
            initialValue, 
            readOnly,
            language
        );
        
        isMonacoInitialized = true;
        
        return monacoEditorInstance;
        
    } catch (error) {
        console.error('Failed to initialize Monaco:', error);
        
        // Remove loading state and show error
        container.classList.remove('loading');
        container.innerHTML = `
            <div class="monaco-editor-error">
                <h3>Monaco Editor Failed to Load</h3>
                <p>Error: ${error.message}</p>
                <p>Please check your internet connection and try again.</p>
                <button onclick="location.reload()">Reload Page</button>
            </div>
        `;
        isMonacoInitialized = false;
        throw error;
    }
}

// Monaco Editor wrapper functions
function getEditorValue() {
    if (isMonacoInitialized && window.MonacoEditor) {
        return window.MonacoEditor.getValue();
    }
    return '';
}

function setEditorValue(value) {
    if (isMonacoInitialized && window.MonacoEditor) {
        window.MonacoEditor.setValue(value);
    }
}

function focusEditor() {
    if (isMonacoInitialized && window.MonacoEditor) {
        window.MonacoEditor.focus();
    }
}

function resizeEditor() {
    if (isMonacoInitialized && window.MonacoEditor) {
        window.MonacoEditor.resize();
    }
}

// Close editor function
function closeEditor() {
    if (isMonacoInitialized && window.MonacoEditor) {
        window.MonacoEditor.dispose();
        isMonacoInitialized = false;
        monacoEditorInstance = null;
    }
    
    // Hide overlay
    codeEditorOverlay.style.display = 'none';
    document.body.classList.remove('modal-overlay-active');
    
    // Restore focus
    if (window.lastFocusedElement) {
        window.lastFocusedElement.focus();
    }
}

// Open editor function - main entry point
async function openEditor(code, readOnly = false, language = 'javascript') {
    const saveButton = document.getElementById('code-editor-save');
    
    // Store currently focused element
    window.lastFocusedElement = document.activeElement;
    
    // Add overlay active state
    document.body.classList.add('modal-overlay-active');
    
    codeEditorOverlay.style.display = 'flex';
    
    try {
        // Initialize Monaco Editor with language
        await initializeMonaco(codeEditor, code, readOnly, language);
        
        // Configure save button visibility
        if (saveButton) {
            saveButton.style.display = readOnly ? 'none' : 'inline-block';
        }
        
        // Focus the appropriate element
        setTimeout(() => {
            if (readOnly) {
                const cancelButton = document.getElementById('code-editor-cancel');
                if (cancelButton) {
                    cancelButton.focus();
                }
            } else {
                const titleElement = document.getElementById('code-editor-title');
                if (titleElement) {
                    titleElement.focus();
                }
            }
        }, 100); // Small delay to ensure Monaco is fully initialized
        
    } catch (error) {
        console.error('Failed to open editor with Monaco:', error);
        
        // Fallback: show error message
        codeEditor.innerHTML = `
            <div class="monaco-editor-error">
                <h3>Editor Failed to Load</h3>
                <p>Error: ${error.message}</p>
                <p>Please check your internet connection and try again.</p>
                <button onclick="location.reload()">Reload Page</button>
            </div>
        `;
        
        // Configure save button
        if (saveButton) {
            saveButton.style.display = 'none';
        }
    }
}

// Export functions for global access
window.openEditor = openEditor;
window.getEditorValue = getEditorValue;
window.setEditorValue = setEditorValue;
window.focusEditor = focusEditor;
window.resizeEditor = resizeEditor;
window.closeEditor = closeEditor;

// Handle window resize to ensure Monaco Editor resizes properly
window.addEventListener('resize', () => {
    if (isMonacoInitialized) {
        resizeEditor();
    }
});

// Handle visibility changes (tab switching, etc.)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && isMonacoInitialized) {
        setTimeout(() => {
            resizeEditor();
        }, 100);
    }
});

// Handle visibility changes (tab switching, etc.)
