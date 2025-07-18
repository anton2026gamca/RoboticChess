// Monaco Editor implementation for Code Editor

let monacoEditor = null;
let monacoContainer = null;
let isMonacoLoaded = false;

// Custom VS Code-like theme definitions
const CUSTOM_THEMES = {
    'vscode-dark-plus': {
        base: 'vs-dark',
        inherit: true,
        rules: [
            // Keywords - Control flow (purple)
            { token: 'keyword.control', foreground: '#C586C0' },
            { token: 'keyword.control.flow', foreground: '#C586C0' },
            { token: 'keyword.control.import', foreground: '#C586C0' },
            { token: 'keyword.control.conditional', foreground: '#C586C0' },
            { token: 'keyword.control.loop', foreground: '#C586C0' },
            
            // Keywords - Declaration (blue)
            { token: 'keyword.declaration', foreground: '#569CD6' },
            { token: 'keyword.other', foreground: '#569CD6' },
            { token: 'keyword', foreground: '#569CD6' },
            { token: 'keyword.operator', foreground: '#D4D4D4' },
            
            // Types and classes
            { token: 'type', foreground: '#4EC9B0' },
            { token: 'type.identifier', foreground: '#4EC9B0' },
            { token: 'entity.name.class', foreground: '#4EC9B0' },
            { token: 'entity.name.function', foreground: '#DCDCAA' },
            { token: 'entity.name.method', foreground: '#DCDCAA' },
            
            // Variables and identifiers (changed from light blue to white)
            { token: 'variable', foreground: '#FFFFFF' },
            { token: 'variable.parameter', foreground: '#FFFFFF' },
            { token: 'variable.other', foreground: '#FFFFFF' },
            { token: 'identifier', foreground: '#FFFFFF' },
            
            // Constants and numbers
            { token: 'constant', foreground: '#4FC1FF' },
            { token: 'constant.numeric', foreground: '#B5CEA8' },
            { token: 'constant.language', foreground: '#569CD6' },
            { token: 'number', foreground: '#B5CEA8' },
            
            // Strings
            { token: 'string', foreground: '#CE9178' },
            { token: 'string.quoted', foreground: '#CE9178' },
            { token: 'string.template', foreground: '#CE9178' },
            { token: 'string.regexp', foreground: '#D16969' },
            
            // Comments
            { token: 'comment', foreground: '#6A9955', fontStyle: 'italic' },
            { token: 'comment.line', foreground: '#6A9955', fontStyle: 'italic' },
            { token: 'comment.block', foreground: '#6A9955', fontStyle: 'italic' },
            { token: 'comment.doc', foreground: '#6A9955', fontStyle: 'italic' },
            { token: 'comment.doc.tag', foreground: '#569CD6' },
            { token: 'comment.doc.type', foreground: '#4EC9B0' },
            
            // Operators and punctuation
            { token: 'delimiter', foreground: '#D4D4D4' },
            { token: 'delimiter.bracket', foreground: '#FFD700' },
            { token: 'delimiter.square', foreground: '#FFD700' },
            { token: 'delimiter.parenthesis', foreground: '#FFD700' },
            { token: 'operator', foreground: '#D4D4D4' },
            
            // Special tokens
            { token: 'tag', foreground: '#569CD6' },
            { token: 'attribute.name', foreground: '#92C5F8' },
            { token: 'attribute.value', foreground: '#CE9178' },
            { token: 'meta.embedded', foreground: '#D4D4D4' },
            
            // Error and warning
            { token: 'invalid', foreground: '#F44747' },
            { token: 'invalid.illegal', foreground: '#F44747', fontStyle: 'italic' },
        ],
        colors: {
            'editor.background': '#1E1E1E',
            'editor.foreground': '#D4D4D4',
            'editor.selectionBackground': '#264F78',
            'editor.lineHighlightBackground': '#2A2D2E',
            'editor.selectionHighlightBackground': '#ADD6FF26',
            'editor.wordHighlightBackground': '#575757B8',
            'editor.wordHighlightStrongBackground': '#004972B8',
            'editor.findMatchBackground': '#515C6A',
            'editor.findMatchHighlightBackground': '#EA5C004D',
            'editor.findRangeHighlightBackground': '#3A3D4166',
            'editor.hoverHighlightBackground': '#264F7840',
            'editor.rangeHighlightBackground': '#FFFFFF0B',
            'editorBracketMatch.background': '#0064001A',
            'editorBracketMatch.border': '#888888',
            'editorCodeLens.foreground': '#999999',
            'editorCursor.foreground': '#AEAFAD',
            'editorError.foreground': '#F44747',
            'editorWarning.foreground': '#FF8C00',
            'editorInfo.foreground': '#3794FF',
            'editorHint.foreground': '#EEEEEEB3',
            'editorIndentGuide.background': '#404040',
            'editorIndentGuide.activeBackground': '#707070',
            'editorLineNumber.foreground': '#858585',
            'editorLineNumber.activeForeground': '#C6C6C6',
            'editorRuler.foreground': '#5A5A5A',
            'editorSuggestWidget.background': '#252526',
            'editorSuggestWidget.border': '#454545',
            'editorSuggestWidget.foreground': '#D4D4D4',
            'editorSuggestWidget.highlightForeground': '#0097FB',
            'editorSuggestWidget.selectedBackground': '#062F4A',
            'editorWhitespace.foreground': '#3C3C3C',
            'editorWidget.background': '#252526',
            'editorWidget.border': '#454545',
            'editorWidget.foreground': '#CCCCCC',
        }
    },
    'vscode-light-plus': {
        base: 'vs',
        inherit: true,
        rules: [
            // Keywords - Control flow (purple)
            { token: 'keyword.control', foreground: '#AF00DB' },
            { token: 'keyword.control.flow', foreground: '#AF00DB' },
            { token: 'keyword.control.import', foreground: '#AF00DB' },
            { token: 'keyword.control.conditional', foreground: '#AF00DB' },
            { token: 'keyword.control.loop', foreground: '#AF00DB' },
            
            // Keywords - Declaration (blue)
            { token: 'keyword.declaration', foreground: '#0000FF' },
            { token: 'keyword.other', foreground: '#0000FF' },
            { token: 'keyword', foreground: '#0000FF' },
            { token: 'keyword.operator', foreground: '#000000' },
            
            // Types and classes
            { token: 'type', foreground: '#267F99' },
            { token: 'type.identifier', foreground: '#267F99' },
            { token: 'entity.name.class', foreground: '#267F99' },
            { token: 'entity.name.function', foreground: '#795E26' },
            { token: 'entity.name.method', foreground: '#795E26' },
            
            // Variables and identifiers (changed from light blue to black)
            { token: 'variable', foreground: '#000000' },
            { token: 'variable.parameter', foreground: '#000000' },
            { token: 'variable.other', foreground: '#000000' },
            { token: 'identifier', foreground: '#000000' },
            
            // Constants and numbers
            { token: 'constant', foreground: '#0070C1' },
            { token: 'constant.numeric', foreground: '#098658' },
            { token: 'constant.language', foreground: '#0000FF' },
            { token: 'number', foreground: '#098658' },
            
            // Strings
            { token: 'string', foreground: '#A31515' },
            { token: 'string.quoted', foreground: '#A31515' },
            { token: 'string.template', foreground: '#A31515' },
            { token: 'string.regexp', foreground: '#811F3F' },
            
            // Comments
            { token: 'comment', foreground: '#008000', fontStyle: 'italic' },
            { token: 'comment.line', foreground: '#008000', fontStyle: 'italic' },
            { token: 'comment.block', foreground: '#008000', fontStyle: 'italic' },
            { token: 'comment.doc', foreground: '#008000', fontStyle: 'italic' },
            { token: 'comment.doc.tag', foreground: '#0000FF' },
            { token: 'comment.doc.type', foreground: '#267F99' },
            
            // Operators and punctuation
            { token: 'delimiter', foreground: '#000000' },
            { token: 'delimiter.bracket', foreground: '#0431FA' },
            { token: 'delimiter.square', foreground: '#0431FA' },
            { token: 'delimiter.parenthesis', foreground: '#0431FA' },
            { token: 'operator', foreground: '#000000' },
            
            // Special tokens
            { token: 'tag', foreground: '#800000' },
            { token: 'attribute.name', foreground: '#FF0000' },
            { token: 'attribute.value', foreground: '#0000FF' },
            { token: 'meta.embedded', foreground: '#000000' },
            
            // Error and warning
            { token: 'invalid', foreground: '#CD3131' },
            { token: 'invalid.illegal', foreground: '#CD3131', fontStyle: 'italic' },
        ],
        colors: {
            'editor.background': '#FFFFFF',
            'editor.foreground': '#000000',
            'editor.selectionBackground': '#ADD6FF',
            'editor.lineHighlightBackground': '#FFFBDD',
            'editor.selectionHighlightBackground': '#ADD6FF4D',
            'editor.wordHighlightBackground': '#57575740',
            'editor.wordHighlightStrongBackground': '#0E639C4D',
            'editor.findMatchBackground': '#A8AC94',
            'editor.findMatchHighlightBackground': '#EA5C0052',
            'editor.findRangeHighlightBackground': '#3A3D4166',
            'editor.hoverHighlightBackground': '#ADD6FF26',
            'editor.rangeHighlightBackground': '#FDFF0033',
            'editorBracketMatch.background': '#0064001A',
            'editorBracketMatch.border': '#B9B9B9',
            'editorCodeLens.foreground': '#999999',
            'editorCursor.foreground': '#000000',
            'editorError.foreground': '#E51400',
            'editorWarning.foreground': '#BF8803',
            'editorInfo.foreground': '#1A85FF',
            'editorHint.foreground': '#6C6C6C',
            'editorIndentGuide.background': '#D3D3D3',
            'editorIndentGuide.activeBackground': '#939393',
            'editorLineNumber.foreground': '#237893',
            'editorLineNumber.activeForeground': '#0B216F',
            'editorRuler.foreground': '#D3D3D3',
            'editorSuggestWidget.background': '#F3F3F3',
            'editorSuggestWidget.border': '#C8C8C8',
            'editorSuggestWidget.foreground': '#000000',
            'editorSuggestWidget.highlightForeground': '#0066BF',
            'editorSuggestWidget.selectedBackground': '#DDEEFF',
            'editorWhitespace.foreground': '#33333333',
            'editorWidget.background': '#F3F3F3',
            'editorWidget.border': '#C8C8C8',
            'editorWidget.foreground': '#000000',
        }
    }
};

// Enhanced configuration with VS Code-like features
const MONACO_CONFIG = {
    theme: 'vscode-dark-plus',
    language: 'javascript',
    fontSize: 14,
    fontFamily: 'Consolas, "Courier New", monospace',
    lineHeight: 1.5,
    tabSize: 4,
    insertSpaces: true,
    wordWrap: 'on',
    minimap: { 
        enabled: true,
        scale: 1,
        showSlider: 'always',
        renderCharacters: true,
        maxColumn: 120,
        side: 'right'
    },
    scrollBeyondLastLine: true,
    automaticLayout: true,
    contextmenu: true,
    selectOnLineNumbers: true,
    lineNumbers: 'on',
    folding: true,
    bracketPairColorization: { 
        enabled: true,
        independentColorPoolPerBracketType: true
    },
    guides: {
        indentation: true,
        bracketPairs: true,
        bracketPairsHorizontal: false,
        highlightActiveBracketPair: true,
        highlightActiveIndentation: true
    },
    // Enhanced rendering options
    renderWhitespace: 'selection',
    renderControlCharacters: true,
    renderIndentGuides: true,
    renderLineHighlight: 'all',
    renderLineHighlightOnlyWhenFocus: false,
    renderValidationDecorations: 'on',
    // Enhanced cursor options
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'off',
    cursorStyle: 'line',
    cursorWidth: 2,
    // Enhanced scrolling
    smoothScrolling: true,
    mouseWheelScrollSensitivity: 1,
    fastScrollSensitivity: 5,
    // Enhanced formatting
    formatOnType: true,
    formatOnPaste: true,
    // Enhanced bracket matching
    matchBrackets: 'always',
    // Enhanced word options
    wordSeparators: '`~!@#$%^&*()-=+[{]}\\|;:\'",.<>/?',
    wordWrap: 'bounded',
    wordWrapColumn: 120,
    // Enhanced selection
    selectionHighlight: true,
    occurrencesHighlight: true,
    // Enhanced find
    find: {
        seedSearchStringFromSelection: 'selection',
        autoFindInSelection: 'never',
        globalFindClipboard: false,
        addExtraSpaceOnTop: true,
        loop: true
    },
    suggest: {
        snippetsPreventQuickSuggestions: false,
        showMethods: true,
        showFunctions: true,
        showConstructors: true,
        showDeprecated: true,
        showFields: true,
        showVariables: true,
        showClasses: true,
        showStructs: true,
        showInterfaces: true,
        showModules: true,
        showProperties: true,
        showEvents: true,
        showOperators: true,
        showUnits: true,
        showValues: true,
        showConstants: true,
        showEnums: true,
        showEnumMembers: true,
        showKeywords: true,
        showWords: true,
        showColors: true,
        showFiles: true,
        showReferences: true,
        showFolders: true,
        showTypeParameters: true,
        showSnippets: true
    },
    quickSuggestions: {
        other: true,
        comments: true,
        strings: true
    },
    scrollbar: {
        verticalScrollbarSize: 12,
        horizontalScrollbarSize: 12,
        alwaysConsumeMouseWheel: false
    },
    // Enable hover provider for JSDoc
    hover: {
        enabled: true,
        delay: 100,
        sticky: true
    },
    // Enable parameter hints
    parameterHints: {
        enabled: true,
        cycle: true
    },
    // Enable signature help
    signatureHelp: {
        enabled: true
    },
    // Enable JSDoc comment parsing
    comments: {
        insertSpace: true,
        ignoreEmptyLines: true
    }
};

// // Register a basic hover provider for Python
// function setupPythonHoverProvider() {
//     if (!window.monaco || !window.monaco.languages) return;
//     // Remove any previous hover providers (optional, for hot reload)
//     if (window.__pythonHoverProviderDisposable) {
//         window.__pythonHoverProviderDisposable.dispose();
//     }
//     // Show hover for function names, class names, and variable/property names
//     window.__pythonHoverProviderDisposable = monaco.languages.registerHoverProvider('python', {
//         provideHover: function(model, position) {
//             const lineContent = model.getLineContent(position.lineNumber);
//             const col = position.column - 1;
//             // Function definition: def function_name(
//             const functionRegex = /\bdef\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g;
//             let match;
//             while ((match = functionRegex.exec(lineContent)) !== null) {
//                 const fnName = match[1];
//                 const start = match.index + match[0].indexOf(fnName);
//                 const end = start + fnName.length;
//                 if (col >= start && col <= end) {
//                     return {
//                         range: new monaco.Range(position.lineNumber, start + 1, position.lineNumber, end + 1),
//                         contents: [
//                             { value: `**Function:** \`${fnName}\`` }
//                         ]
//                     };
//                 }
//             }
//             // Class definition: class ClassName(
//             const classRegex = /\bclass\s+([A-Za-z_][A-Za-z0-9_]*)\s*([(:]?)/g;
//             while ((match = classRegex.exec(lineContent)) !== null) {
//                 const className = match[1];
//                 const start = match.index + match[0].indexOf(className);
//                 const end = start + className.length;
//                 if (col >= start && col <= end) {
//                     return {
//                         range: new monaco.Range(position.lineNumber, start + 1, position.lineNumber, end + 1),
//                         contents: [
//                             { value: `**Class:** \`${className}\`` }
//                         ]
//                     };
//                 }
//             }
//             // Variable/property/identifier: highlight any word (skip keywords, comments, and strings)
//             const word = model.getWordAtPosition(position);
//             if (word) {
//                 // Exclude Python keywords (basic set)
//                 const keywords = [
//                     'def','class','if','elif','else','for','while','break','continue','return','yield','try','except','finally','with','pass','lambda','global','nonlocal','assert','del','import','from','as','print','input','int','float','str','list','dict','set','tuple','bool','None','True','False','and','or','not','is','in'
//                 ];
//                 // Check token type at position (avoid comments and strings, including multiline and triple-quoted)
//                 let inCommentOrString = false;
//                 if (model.getModeId && model.getModeId() === 'python' && monaco.editor.tokenize) {
//                     // Track if we are inside a triple-quoted string up to the current line
//                     let inMultilineString = false;
//                     let multilineStringDelimiter = null;
//                     for (let i = 1; i <= position.lineNumber; i++) {
//                         const line = model.getLineContent(i);
//                         let lineTokens = monaco.editor.tokenize(line, 'python')[0] || [];
//                         let offset = 0;
//                         let lineInString = false;
//                         for (let t = 0; t < lineTokens.length; t++) {
//                             const token = lineTokens[t];
//                             const tokenStart = offset;
//                             const tokenEnd = offset + (token.length || 0);
//                             // Detect triple-quoted string start/end
//                             if (token.type && token.type.indexOf('string') !== -1) {
//                                 // Check for triple quotes in the token text
//                                 const tokenText = line.substring(tokenStart, tokenEnd);
//                                 let tripleQuoteMatch = tokenText.match(/(["']{3})/g);
//                                 if (tripleQuoteMatch) {
//                                     for (let match of tripleQuoteMatch) {
//                                         if (!inMultilineString) {
//                                             inMultilineString = true;
//                                             multilineStringDelimiter = match;
//                                         } else if (inMultilineString && match === multilineStringDelimiter) {
//                                             inMultilineString = false;
//                                             multilineStringDelimiter = null;
//                                         }
//                                     }
//                                 }
//                             }
//                             // Only check the current line and word for comments/strings
//                             if (i === position.lineNumber && word.startColumn - 1 >= tokenStart && word.endColumn - 1 <= tokenEnd) {
//                                 if (token.type && (token.type.indexOf('comment') !== -1 || token.type.indexOf('string') !== -1)) {
//                                     inCommentOrString = true;
//                                 }
//                                 if (inMultilineString) {
//                                     inCommentOrString = true;
//                                 }
//                                 break;
//                             }
//                             offset = tokenEnd;
//                         }
//                         // If the word is not on this line, but we are in a multiline string, suppress hover
//                         if (i === position.lineNumber && inMultilineString) {
//                             inCommentOrString = true;
//                         }
//                     }
//                 }
//                 if (!keywords.includes(word.word) && !inCommentOrString) {
//                     return {
//                         range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
//                         contents: [
//                             { value: `**Identifier:** \`${word.word}\`` }
//                         ]
//                     };
//                 }
//             }
//             return null;
//         }
//     });
// }

// Load Monaco Editor from CDN and setup advanced features
function loadMonacoEditor() {
    return new Promise((resolve, reject) => {
        if (isMonacoLoaded && window.monaco) {
            resolve();
            return;
        }

        // Create loader script
        const loaderScript = document.createElement('script');
        loaderScript.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js';
        
        loaderScript.onload = () => {
            // Configure require.js
            require.config({ 
                paths: { 
                    'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' 
                }
            });
            
            // Load Monaco editor main module
            require(['vs/editor/editor.main'], () => {
                isMonacoLoaded = true;
                
                // Register custom themes
                registerCustomThemes();
                
                // Setup enhanced JavaScript language features
                setupJavaScriptLanguageFeatures();
                
                // Setup semantic tokenization
                setupSemanticTokenization();

                // Setup Python hover provider
                //setupPythonHoverProvider();

                // Set up global error handler for Monaco
                window.monaco.editor.onDidCreateModel((model) => {
                    model.onDidChangeContent(() => {
                        // Content changed - can be used for auto-save or other features
                        // Semantic tokens are already handled by the registered provider
                    });
                });

                resolve();
            }, (error) => {
                console.error('Failed to load Monaco Editor main module:', error);
                reject(error);
            });
        };
        
        loaderScript.onerror = (error) => {
            console.error('Failed to load Monaco loader script:', error);
            reject(new Error('Failed to load Monaco Editor from CDN. Please check your internet connection.'));
        };
        
        document.head.appendChild(loaderScript);
    });
}

// Register custom VS Code-like themes
function registerCustomThemes() {
    if (!window.monaco) return;
    
    // Register each custom theme
    Object.entries(CUSTOM_THEMES).forEach(([themeName, themeData]) => {
        monaco.editor.defineTheme(themeName, themeData);
    });
}

// Setup enhanced JavaScript language features
function setupJavaScriptLanguageFeatures() {
    if (!window.monaco) return;

    // Enhanced tokenization rules
    monaco.languages.setMonarchTokensProvider('javascript', {
        defaultToken: 'invalid',
        tokenPostfix: '.js',
        
        // Control flow keywords (purple)
        controlKeywords: [
            'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
            'break', 'continue', 'return', 'throw', 'try', 'catch', 'finally',
            'import', 'export', 'from', 'as'
        ],
        
        // Declaration keywords (blue)
        declarationKeywords: [
            'function', 'const', 'let', 'var', 'class', 'extends', 'new',
            'this', 'super', 'static', 'async', 'await', 'yield', 'typeof',
            'instanceof', 'in', 'of', 'void', 'delete', 'debugger'
        ],
        
        // Other keywords
        otherKeywords: [
            'true', 'false', 'null', 'undefined', 'with', 'enum'
        ],
        
        operators: [
            '<=', '>=', '==', '!=', '===', '!==', '=>', '+', '-', '**',
            '*', '/', '%', '++', '--', '<<', '</', '>>', '>>>', '&',
            '|', '^', '!', '~', '&&', '||', '?', ':', '=', '+=', '-=',
            '*=', '/=', '%=', '<<=', '>>=', '>>>=', '&=', '|=', '^=',
            '@', '...', '??', '?.', '??='
        ],
        
        symbols: /[=><!~?:&|+\-*\/\^%]+/,
        
        escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
        
        digits: /\d+(_+\d+)*/,
        
        octaldigits: /[0-7]+(_+[0-7]+)*/,
        
        binarydigits: /[0-1]+(_+[0-1]+)*/,
        
        hexdigits: /[[0-9a-fA-F]+(_+[0-9a-fA-F]+)*/,
        
        regexpctl: /[(){}\[\]\$\^|\-*+?\.]/,
        
        regexpesc: /\\(?:[bBdDfnrstvwWn0\\\/]|@regexpctl|c[A-Z]|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4})/,
        
        tokenizer: {
            root: [
                [/[{}]/, 'delimiter.bracket'],
                { include: 'common' }
            ],
            
            common: [
                // Method calls: identifier.methodName(
                [/([a-z_$][\w$]*)(\.)([a-z_$][\w$]*)(\s*)(\()/, ['identifier', 'delimiter', 'entity.name.method', '', 'delimiter.parenthesis']],
                
                // Function calls: functionName(
                [/([a-z_$][\w$]*)(\s*)(\()/, {
                    cases: {
                        '$1@controlKeywords': ['keyword.control', '', 'delimiter.parenthesis'],
                        '$1@declarationKeywords': ['keyword.declaration', '', 'delimiter.parenthesis'],
                        '$1@otherKeywords': ['keyword.other', '', 'delimiter.parenthesis'],
                        '@default': ['entity.name.function', '', 'delimiter.parenthesis']
                    }
                }],
                
                // identifiers and keywords
                [/[a-z_$][\w$]*/, {
                    cases: {
                        '@controlKeywords': 'keyword.control',
                        '@declarationKeywords': 'keyword.declaration',
                        '@otherKeywords': 'keyword.other',
                        '@default': 'identifier'
                    }
                }],
                [/[A-Z][\w\$]*/, 'type.identifier'],
                
                // whitespace
                { include: '@whitespace' },
                
                // regular expression
                [/\/(?=([^\\\/]|\\.)+\/([gimsuy]*)(\s*)(\.|;|,|\)|\]|\}|$))/, { token: 'regexp', bracket: '@open', next: '@regexp' }],
                
                // delimiters and operators
                [/[()\[\]]/, '@brackets'],
                [/[<>](?!@symbols)/, '@brackets'],
                [/@symbols/, {
                    cases: {
                        '@operators': 'operator',
                        '@default': ''
                    }
                }],
                
                // numbers
                [/(@digits)[eE]([\-+]?(@digits))?[fFdD]?/, 'number.float'],
                [/(@digits)\.(@digits)([eE][\-+]?(@digits))?[fFdD]?/, 'number.float'],
                [/0[xX](@hexdigits)[Ll]?/, 'number.hex'],
                [/0[oO]?(@octaldigits)[Ll]?/, 'number.octal'],
                [/0[bB](@binarydigits)[Ll]?/, 'number.binary'],
                [/(@digits)[fFdD]/, 'number.float'],
                [/(@digits)[lL]?/, 'number'],
                
                // delimiter: after number because of .\d floats
                [/[;,.]/, 'delimiter'],
                
                // strings
                [/"([^"\\]|\\.)*$/, 'string.invalid'],
                [/'([^'\\]|\\.)*$/, 'string.invalid'],
                [/"/, 'string', '@string_double'],
                [/'/, 'string', '@string_single'],
                [/`/, 'string', '@string_backtick'],
            ],
            
            whitespace: [
                [/[ \t\r\n]+/, ''],
                [/\/\*\*(?!\/)/, 'comment.doc', '@jsdoc'],
                [/\/\*/, 'comment', '@comment'],
                [/\/\/.*$/, 'comment'],
            ],
            
            comment: [
                [/[^\/*]+/, 'comment'],
                [/\*\//, 'comment', '@pop'],
                [/[\/*]/, 'comment']
            ],
            
            jsdoc: [
                [/@\w+(\s+\{[^}]*\})?/, { 
                    token: '@rematch',
                    next: '@jsdoc_tag'
                }],
                [/[^\/*@]+/, 'comment.doc'],
                [/\*\//, 'comment.doc', '@pop'],
                [/[\/*]/, 'comment.doc']
            ],
            
            jsdoc_tag: [
                [/@\w+/, 'comment.doc.tag'],
                [/\s+/, ''],
                [/\{[^}]*\}/, 'comment.doc.type'],
                [/./, { token: '@rematch', next: '@pop' }]
            ],
            
            regexp: [
                [/(\{)(\d+(?:,\d*)?)(\})/, ['regexp.escape.control', 'regexp.escape.control', 'regexp.escape.control']],
                [/(\[)(\^?)(?=(?:[^\]\\\/]|\\.)+)/, ['regexp.escape.control', { token: 'regexp.escape.control', next: '@regexrange' }]],
                [/(\()(\?:|\?=|\?!)/, ['regexp.escape.control', 'regexp.escape.control']],
                [/[()]/, 'regexp.escape.control'],
                [/@regexpctl/, 'regexp.escape.control'],
                [/[^\\\/]/, 'regexp'],
                [/@regexpesc/, 'regexp.escape'],
                [/\\\./, 'regexp.invalid'],
                [/(\/)([gimsuy]*)/, [{ token: 'regexp', bracket: '@close', next: '@pop' }, 'keyword.other']],
            ],
            
            regexrange: [
                [/-/, 'regexp.escape.control'],
                [/\^/, 'regexp.invalid'],
                [/@regexpesc/, 'regexp.escape'],
                [/[^\]]/, 'regexp'],
                [/\]/, { token: 'regexp.escape.control', next: '@pop', bracket: '@close' }],
            ],
            
            string_double: [
                [/[^\\"]+/, 'string'],
                [/@escapes/, 'string.escape'],
                [/\\./, 'string.escape.invalid'],
                [/"/, 'string', '@pop']
            ],
            
            string_single: [
                [/[^\\']+/, 'string'],
                [/@escapes/, 'string.escape'],
                [/\\./, 'string.escape.invalid'],
                [/'/, 'string', '@pop']
            ],
            
            string_backtick: [
                [/\$\{/, { token: 'delimiter.bracket', next: '@bracketCounting' }],
                [/[^\\`$]+/, 'string'],
                [/@escapes/, 'string.escape'],
                [/\\./, 'string.escape.invalid'],
                [/`/, 'string', '@pop']
            ],
            
            bracketCounting: [
                [/\{/, 'delimiter.bracket', '@bracketCounting'],
                [/\}/, 'delimiter.bracket', '@pop'],
                { include: 'common' }
            ],
        },
    });
    monaco.languages.setMonarchTokensProvider('typescript', {
        defaultToken: 'invalid',
        tokenPostfix: '.ts',
        
        // Control flow keywords (purple)
        controlKeywords: [
            'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
            'break', 'continue', 'return', 'throw', 'try', 'catch', 'finally',
            'import', 'export', 'from', 'as'
        ],
        
        // Declaration keywords (blue)
        declarationKeywords: [
            'function', 'const', 'let', 'var', 'class', 'extends', 'new',
            'this', 'super', 'static', 'async', 'await', 'yield', 'typeof',
            'instanceof', 'in', 'of', 'void', 'delete', 'debugger'
        ],
        
        // Other keywords
        otherKeywords: [
            'true', 'false', 'null', 'undefined', 'with', 'enum'
        ],
        
        operators: [
            '<=', '>=', '==', '!=', '===', '!==', '=>', '+', '-', '**',
            '*', '/', '%', '++', '--', '<<', '</', '>>', '>>>', '&',
            '|', '^', '!', '~', '&&', '||', '?', ':', '=', '+=', '-=',
            '*=', '/=', '%=', '<<=', '>>=', '>>>=', '&=', '|=', '^=',
            '@', '...', '??', '?.', '??='
        ],
        
        symbols: /[=><!~?:&|+\-*\/\^%]+/,
        
        escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
        
        digits: /\d+(_+\d+)*/,
        
        octaldigits: /[0-7]+(_+[0-7]+)*/,
        
        binarydigits: /[0-1]+(_+[0-1]+)*/,
        
        hexdigits: /[0-9a-fA-F]+(_+[0-9a-fA-F]+)*/,
        
        regexpctl: /[(){}\[\]\$\^|\-*+?\.]/,
        
        regexpesc: /\\(?:[bBdDfnrstvwWn0\\\/]|@regexpctl|c[A-Z]|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4})/,
        
        tokenizer: {
            root: [
                [/[{}]/, 'delimiter.bracket'],
                { include: 'common' }
            ],
            
            common: [
                // Method calls: identifier.methodName(
                [/([a-z_$][\w$]*)(\.)([a-z_$][\w$]*)(\s*)(\()/, ['identifier', 'delimiter', 'entity.name.method', '', 'delimiter.parenthesis']],
                
                // Function calls: functionName(
                [/([a-z_$][\w$]*)(\s*)(\()/, {
                    cases: {
                        '$1@controlKeywords': ['keyword.control', '', 'delimiter.parenthesis'],
                        '$1@declarationKeywords': ['keyword.declaration', '', 'delimiter.parenthesis'],
                        '$1@otherKeywords': ['keyword.other', '', 'delimiter.parenthesis'],
                        '@default': ['entity.name.function', '', 'delimiter.parenthesis']
                    }
                }],

                // Parameter types: param: type (type is green)
                // This rule matches identifiers followed by a colon and a type identifier
                [/([a-zA-Z_$][\w$]*)(\s*)(:)(\s*)([a-zA-Z_$][\w$]*)/, [
                    'variable.parameter', '', 'delimiter', '', 'type'
                ]],
                
                // identifiers and keywords
                [/[a-z_$][\w$]*/, {
                    cases: {
                        '@controlKeywords': 'keyword.control',
                        '@declarationKeywords': 'keyword.declaration',
                        '@otherKeywords': 'keyword.other',
                        '@default': 'identifier'
                    }
                }],
                [/[A-Z][\w\$]*/, 'type.identifier'],
                
                // whitespace
                { include: '@whitespace' },
                
                // regular expression
                [/\/(?=([^\\\/]|\\.)+\/([gimsuy]*)(\s*)(\.|;|,|\)|\]|\}|$))/, { token: 'regexp', bracket: '@open', next: '@regexp' }],
                
                // delimiters and operators
                [/[()\[\]]/, '@brackets'],
                [/[<>](?!@symbols)/, '@brackets'],
                [/@symbols/, {
                    cases: {
                        '@operators': 'operator',
                        '@default': ''
                    }
                }],
                
                // numbers
                [/(@digits)[eE]([\-+]?(@digits))?[fFdD]?/, 'number.float'],
                [/(@digits)\.(@digits)([eE][\-+]?(@digits))?[fFdD]?/, 'number.float'],
                [/0[xX](@hexdigits)[Ll]?/, 'number.hex'],
                [/0[oO]?(@octaldigits)[Ll]?/, 'number.octal'],
                [/0[bB](@binarydigits)[Ll]?/, 'number.binary'],
                [/(@digits)[fFdD]/, 'number.float'],
                [/(@digits)[lL]?/, 'number'],
                
                // delimiter: after number because of .\d floats
                [/[;,.]/, 'delimiter'],
                
                // strings
                [/"([^"\\]|\\.)*$/, 'string.invalid'],
                [/'([^'\\]|\\.)*$/, 'string.invalid'],
                [/"/, 'string', '@string_double'],
                [/'/, 'string', '@string_single'],
                [/`/, 'string', '@string_backtick'],
            ],
            
            whitespace: [
                [/[ \t\r\n]+/, ''],
                [/\/\*\*(?!\/)/, 'comment.doc', '@jsdoc'],
                [/\/\*/, 'comment', '@comment'],
                [/\/\/.*$/, 'comment'],
            ],
            
            comment: [
                [/[^\/*]+/, 'comment'],
                [/\*\//, 'comment', '@pop'],
                [/[\/*]/, 'comment']
            ],
            
            jsdoc: [
                [/@\w+(\s+\{[^}]*\})?/, { 
                    token: '@rematch',
                    next: '@jsdoc_tag'
                }],
                [/[^\/*@]+/, 'comment.doc'],
                [/\*\//, 'comment.doc', '@pop'],
                [/[\/*]/, 'comment.doc']
            ],
            
            jsdoc_tag: [
                [/@\w+/, 'comment.doc.tag'],
                [/\s+/, ''],
                [/\{[^}]*\}/, 'comment.doc.type'],
                [/./, { token: '@rematch', next: '@pop' }]
            ],
            
            regexp: [
                [/(\{)(\d+(?:,\d*)?)(\})/, ['regexp.escape.control', 'regexp.escape.control', 'regexp.escape.control']],
                [/(\[)(\^?)(?=(?:[^\]\\\/]|\\.)+)/, ['regexp.escape.control', { token: 'regexp.escape.control', next: '@regexrange' }]],
                [/(\()(\?:|\?=|\?!)/, ['regexp.escape.control', 'regexp.escape.control']],
                [/[()]/, 'regexp.escape.control'],
                [/@regexpctl/, 'regexp.escape.control'],
                [/[^\\\/]/, 'regexp'],
                [/@regexpesc/, 'regexp.escape'],
                [/\\\./, 'regexp.invalid'],
                [/(\/)([gimsuy]*)/, [{ token: 'regexp', bracket: '@close', next: '@pop' }, 'keyword.other']],
            ],
            
            regexrange: [
                [/-/, 'regexp.escape.control'],
                [/\^/, 'regexp.invalid'],
                [/@regexpesc/, 'regexp.escape'],
                [/[^\]]/, 'regexp'],
                [/\]/, { token: 'regexp.escape.control', next: '@pop', bracket: '@close' }],
            ],
            
            string_double: [
                [/[^\\"]+/, 'string'],
                [/@escapes/, 'string.escape'],
                [/\\./, 'string.escape.invalid'],
                [/"/, 'string', '@pop']
            ],
            
            string_single: [
                [/[^\\']+/, 'string'],
                [/@escapes/, 'string.escape'],
                [/\\./, 'string.escape.invalid'],
                [/'/, 'string', '@pop']
            ],
            
            string_backtick: [
                [/\$\{/, { token: 'delimiter.bracket', next: '@bracketCounting' }],
                [/[^\\`$]+/, 'string'],
                [/@escapes/, 'string.escape'],
                [/\\./, 'string.escape.invalid'],
                [/`/, 'string', '@pop']
            ],
            
            bracketCounting: [
                [/\{/, 'delimiter.bracket', '@bracketCounting'],
                [/\}/, 'delimiter.bracket', '@pop'],
                { include: 'common' }
            ],
        },
    });
}

// Setup semantic tokenization for enhanced coloring
function setupSemanticTokenization() {
    if (!window.monaco) return;
    
    // Register semantic tokens provider for JavaScript
    monaco.languages.registerDocumentSemanticTokensProvider('javascript', {
        getLegend: function () {
            return {
                tokenTypes: [
                    'namespace', 'type', 'class', 'enum', 'interface', 'struct',
                    'typeParameter', 'parameter', 'variable', 'property', 'enumMember',
                    'event', 'function', 'method', 'macro', 'keyword', 'modifier',
                    'comment', 'string', 'number', 'regexp', 'operator'
                ],
                tokenModifiers: [
                    'declaration', 'definition', 'readonly', 'static', 'deprecated',
                    'abstract', 'async', 'modification', 'documentation', 'defaultLibrary'
                ]
            };
        },
        provideDocumentSemanticTokens: function (model, lastResultId, token) {
            const lines = model.getLinesContent();
            const data = [];
            
            lines.forEach((line, lineIndex) => {
                // Enhanced tokenization logic
                const tokens = tokenizeLine(line, lineIndex);
                tokens.forEach(token => {
                    data.push(...token);
                });
            });
            
            return {
                data: new Uint32Array(data),
                resultId: null
            };
        }
    });
}

// Tokenize a single line for semantic highlighting
function tokenizeLine(line, lineIndex) {
    const tokens = [];
    
    // Control flow keywords (purple)
    const controlKeywords = ['if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 
                           'break', 'continue', 'return', 'throw', 'try', 'catch', 'finally',
                           'import', 'export', 'from', 'as'];
    
    // Declaration keywords (blue)
    const declarationKeywords = ['function', 'const', 'let', 'var', 'class', 'extends', 'new',
                                'this', 'super', 'static', 'async', 'await', 'yield', 'typeof',
                                'instanceof', 'in', 'of', 'void', 'delete', 'debugger'];
    
    // Other keywords
    const otherKeywords = ['true', 'false', 'null', 'undefined', 'with', 'enum'];
    
    const regex = /\b(if|else|for|while|do|switch|case|default|break|continue|return|throw|try|catch|finally|import|export|from|as|function|const|let|var|class|extends|new|this|super|static|async|await|yield|typeof|instanceof|in|of|void|delete|debugger|true|false|null|undefined|with|enum)\b|([A-Z][a-zA-Z0-9_]*)|(\b[a-zA-Z_$][a-zA-Z0-9_$]*\b)|(".*?"|'.*?'|`.*?`)|(\d+\.?\d*)|(\+\+|--|==|!=|<=|>=|&&|\|\||[+\-*\/%=<>!&|^~?:])/g;
    
    let match;
    while ((match = regex.exec(line)) !== null) {
        const token = match[0];
        const startIndex = match.index;
        const length = token.length;
        
        let tokenType = 0; // default to namespace
        let tokenModifier = 0;
        
        // Determine token type
        if (match[1]) { // Keywords
            if (controlKeywords.includes(token)) {
                tokenType = 14; // keyword (will be styled as control)
                tokenModifier = 1; // mark as control flow
            } else if (declarationKeywords.includes(token)) {
                tokenType = 14; // keyword (will be styled as declaration)
                tokenModifier = 2; // mark as declaration
            } else if (otherKeywords.includes(token)) {
                tokenType = 14; // keyword (will be styled as other)
                tokenModifier = 0; // no special modifier
            }
        } else if (match[2]) { // Class names (PascalCase)
            tokenType = 2; // class
        } else if (match[3]) { // Identifiers
            tokenType = 8; // variable
        } else if (match[4]) { // Strings
            tokenType = 17; // string
        } else if (match[5]) { // Numbers
            tokenType = 18; // number
        } else if (match[6]) { // Operators
            tokenType = 20; // operator
        }
        
        // Add token data: [deltaLine, deltaStart, length, tokenType, tokenModifier]
        tokens.push([
            lineIndex, startIndex, length, tokenType, tokenModifier
        ]);
    }
    
    return tokens;
}

async function loadChessLib(language) {
    if (language === 'javascript') {
        // Fetch runtime module
        fetch('https://anton2026gamca.github.io/RoboticChess/src/App/chess.js')
            .then(res => res.text())
            .then(code => {
                // Wrap it inside a 'declare module' with exports inferred
                const wrapped = `
                    declare module 'https://anton2026gamca.github.io/RoboticChess/src/App/chess.js' {
                        ${code}
                    }
                `;

                // Inject into Monaco as virtual declaration
                monaco.languages.typescript.javascriptDefaults.addExtraLib(
                    wrapped,
                    'file:///node_modules/@types/chess-url/index.d.ts'
                );
            })
            .catch(err => console.error('[Monaco] chess.js fetch error:', err));
    } else if (language === 'typescript') {
        // Load local chess.d.ts for type definitions, but allow import from the remote URL
        fetch('./chess.d.ts')
            .then(res => res.text())
            .then(dts => {
                // Register the type definitions for the remote module URL
                const wrapped = `
                    ${dts}
                `;
                monaco.languages.typescript.typescriptDefaults.addExtraLib(
                    wrapped,
                    'file:///node_modules/@types/chess-url/index.d.ts'
                );
            })
            .catch(err => console.error('[Monaco] chess.d.ts fetch error:', err));
    } else if (language === 'python') {
        fetch('./chess.py')
            .then(res => res.text())
            .then(pyCode => {
                // Expose the chess.py code as a virtual file for Monaco Python language server (if supported)
                if (window.monaco && window.monaco.languages && window.monaco.languages.python) {
                    // This is a placeholder for integration with a Monaco Python language server.
                    // Actual integration depends on the Monaco Python extension used.
                    // For now, we can store it globally for possible use by a Python worker.
                    window.__monaco_python_chess_lib__ = pyCode;
                }
            })
            .catch(err => console.error('[Monaco] chess.py fetch error:', err));
    }
}

// Initialize Monaco Editor in a container
async function initializeMonacoEditor(container, initialValue = '', readOnly = false, language = 'javascript') {
    try {
        // Ensure Monaco is loaded
        await loadMonacoEditor();

        await loadChessLib(language);
        
        // Dispose existing editor if any
        if (monacoEditor) {
            monacoEditor.dispose();
            monacoEditor = null;
        }

        // Store container reference
        monacoContainer = container;
        
        // Clear container
        container.innerHTML = '';
        
        // Set container styles for Monaco
        container.style.cssText = `
            width: 100%;
            height: 100%;
            position: relative;
            overflow: hidden;
        `;

        // Create Monaco editor configuration
        const editorConfig = {
            ...MONACO_CONFIG,
            value: initialValue,
            readOnly: readOnly,
            language: language
        };

        // Create Monaco editor
        monacoEditor = monaco.editor.create(container, editorConfig);
        
        // Add event listeners
        setupMonacoEventListeners();
        
        return monacoEditor;
        
    } catch (error) {
        console.error('Failed to initialize Monaco Editor:', error);
        
        // Fallback: show error message in container
        container.innerHTML = `
            <div style="padding: 20px; color: #ff6b6b; font-family: monospace;">
                <h3>Monaco Editor Failed to Load</h3>
                <p>Error: ${error.message}</p>
                <p>Please check your internet connection and try again.</p>
                <button onclick="location.reload()" style="padding: 8px 16px; margin-top: 10px;">Reload Page</button>
            </div>
        `;
        
        throw error;
    }
}

// Setup event listeners for Monaco Editor
function setupMonacoEventListeners() {
    if (!monacoEditor) return;
    
    // Content change event
    monacoEditor.onDidChangeModelContent((e) => {
        // Trigger any custom change handlers if needed
        if (window.onMonacoContentChange) {
            window.onMonacoContentChange(getEditorValue(), e);
        }
    });
    
    // Selection change event
    monacoEditor.onDidChangeCursorSelection((e) => {
        // Handle selection changes if needed
        if (window.onMonacoSelectionChange) {
            window.onMonacoSelectionChange(e);
        }
    });
    
    // Focus events
    monacoEditor.onDidFocusEditorText(() => {
        // Editor focused
    });
    
    monacoEditor.onDidBlurEditorText(() => {
        // Editor blurred
    });
    
    // Add keyboard shortcuts
    monacoEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        // Trigger save when Ctrl+S is pressed
        const saveButton = document.getElementById('code-editor-save');
        if (saveButton && saveButton.style.display !== 'none') {
            saveButton.click();
        }
    });
}

// Monaco Editor API functions
function getEditorValue() {
    return monacoEditor ? monacoEditor.getValue() : '';
}

function setEditorValue(value) {
    if (monacoEditor) {
        monacoEditor.setValue(value || '');
    }
}

function getEditorSelection() {
    return monacoEditor ? monacoEditor.getSelection() : null;
}

function setEditorSelection(selection) {
    if (monacoEditor && selection) {
        monacoEditor.setSelection(selection);
    }
}

function focusEditor() {
    if (monacoEditor) {
        monacoEditor.focus();
    }
}

function resizeEditor() {
    if (monacoEditor) {
        monacoEditor.layout();
    }
}

function disposeEditor() {
    if (monacoEditor) {
        monacoEditor.dispose();
        monacoEditor = null;
    }
    monacoContainer = null;
}

function isEditorReady() {
    return monacoEditor !== null && isMonacoLoaded;
}

// Monaco Editor theme functions with enhanced VS Code themes
function setEditorTheme(theme) {
    if (monacoEditor && monaco) {
        // Map common theme names to our enhanced themes
        const themeMap = {
            'dark': 'vscode-dark-plus',
            'light': 'vscode-light-plus',
            'vs-dark': 'vscode-dark-plus',
            'vs-light': 'vscode-light-plus',
            'vs': 'vscode-light-plus',
            'hc-black': 'hc-black',
            'vscode-dark-plus': 'vscode-dark-plus',
            'vscode-light-plus': 'vscode-light-plus'
        };
        
        const selectedTheme = themeMap[theme] || theme;
        monaco.editor.setTheme(selectedTheme);
    }
}

function getAvailableThemes() {
    return [
        { id: 'vscode-dark-plus', name: 'VS Code Dark+', base: 'dark' },
        { id: 'vscode-light-plus', name: 'VS Code Light+', base: 'light' },
        { id: 'vs-dark', name: 'VS Dark', base: 'dark' },
        { id: 'vs', name: 'VS Light', base: 'light' },
        { id: 'hc-black', name: 'High Contrast', base: 'dark' }
    ];
}

function setEditorLanguage(language) {
    if (monacoEditor && monaco) {
        const model = monacoEditor.getModel();
        if (model) {
            monaco.editor.setModelLanguage(model, language);
        }
    }
}

// Enhanced configuration functions
function setEditorOptions(options) {
    if (monacoEditor) {
        monacoEditor.updateOptions(options);
    }
}

function getEditorOptions() {
    return monacoEditor ? monacoEditor.getOptions() : null;
}

// Advanced features
function enableSemanticHighlighting() {
    if (monacoEditor && monaco) {
        const model = monacoEditor.getModel();
        if (model) {
            // Semantic tokens are already handled by the registered provider
            // Force a re-tokenization by triggering a content change
            model.forceTokenization(model.getLineCount());
        }
    }
}

function setFontSize(size) {
    if (monacoEditor) {
        monacoEditor.updateOptions({ fontSize: size });
    }
}

function setLineHeight(height) {
    if (monacoEditor) {
        monacoEditor.updateOptions({ lineHeight: height });
    }
}

function toggleMinimap() {
    if (monacoEditor) {
        const currentOptions = monacoEditor.getOptions();
        const minimapEnabled = currentOptions.get(monaco.editor.EditorOption.minimap).enabled;
        monacoEditor.updateOptions({ 
            minimap: { enabled: !minimapEnabled } 
        });
    }
}

function toggleWordWrap() {
    if (monacoEditor) {
        const currentOptions = monacoEditor.getOptions();
        const wordWrap = currentOptions.get(monaco.editor.EditorOption.wordWrap);
        monacoEditor.updateOptions({ 
            wordWrap: wordWrap === 'on' ? 'off' : 'on' 
        });
    }
}

function toggleWhitespace() {
    if (monacoEditor) {
        const currentOptions = monacoEditor.getOptions();
        const renderWhitespace = currentOptions.get(monaco.editor.EditorOption.renderWhitespace);
        monacoEditor.updateOptions({ 
            renderWhitespace: renderWhitespace === 'all' ? 'none' : 'all' 
        });
    }
}

function formatDocument() {
    if (monacoEditor) {
        monacoEditor.getAction('editor.action.formatDocument').run();
    }
}

function addCustomCommand(id, label, keybinding, handler) {
    if (monacoEditor && monaco) {
        monacoEditor.addCommand(keybinding, handler);
        monacoEditor.addAction({
            id: id,
            label: label,
            keybindings: [keybinding],
            run: handler
        });
    }
}

// Enhanced API with VS Code-like features
window.MonacoEditor = {
    // Basic functionality
    initialize: initializeMonacoEditor,
    getValue: getEditorValue,
    setValue: setEditorValue,
    getSelection: getEditorSelection,
    setSelection: setEditorSelection,
    focus: focusEditor,
    resize: resizeEditor,
    dispose: disposeEditor,
    isReady: isEditorReady,
    
    // Theme and appearance
    setTheme: setEditorTheme,
    getAvailableThemes: getAvailableThemes,
    setLanguage: setEditorLanguage,
    setOptions: setEditorOptions,
    getOptions: getEditorOptions,
    setFontSize: setFontSize,
    setLineHeight: setLineHeight,
    
    // Advanced features
    enableSemanticHighlighting: enableSemanticHighlighting,
    toggleMinimap: toggleMinimap,
    toggleWordWrap: toggleWordWrap,
    toggleWhitespace: toggleWhitespace,
    formatDocument: formatDocument,
    addCustomCommand: addCustomCommand,
    
    // Direct access
    get editor() { return monacoEditor; },
    get monaco() { return window.monaco; }
};
