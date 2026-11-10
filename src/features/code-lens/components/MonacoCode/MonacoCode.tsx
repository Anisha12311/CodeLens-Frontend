'use client';

import Editor, { EditorProps, Monaco, OnMount } from '@monaco-editor/react';
import { useEffect, useRef, useSyncExternalStore } from 'react';

type CodeEditor = Parameters<OnMount>[0];
type Decorations = ReturnType<CodeEditor['createDecorationsCollection']>;

const THEME_NAME = 'code-lens';
const LINE_HEIGHT = 22;
const VERTICAL_PADDING = 10;
const DARK_QUERY = '(prefers-color-scheme: dark)';
const FALLBACK_MONO = 'ui-monospace, Menlo, Consolas, monospace';

// Module scope: the wrapper re-applies options whenever their identity changes.
const EDITOR_OPTIONS: EditorProps['options'] = {
  readOnly: true,
  domReadOnly: true,
  minimap: { enabled: false },
  fontFamily: FALLBACK_MONO,
  fontSize: 12.5,
  lineHeight: LINE_HEIGHT,
  padding: { top: VERTICAL_PADDING, bottom: VERTICAL_PADDING },
  scrollBeyondLastLine: false,
  renderLineHighlight: 'none',
  folding: false,
  glyphMargin: false,
  lineDecorationsWidth: 8,
  lineNumbersMinChars: 3,
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  contextmenu: false,
  automaticLayout: true,
  wordWrap: 'off',
  scrollbar: { alwaysConsumeMouseWheel: false, vertical: 'hidden', horizontalScrollbarSize: 6 },
};

function subscribeToScheme(onChange: () => void) {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function readScheme() {
  const forced = document.documentElement.dataset.theme;
  if (forced === 'light' || forced === 'dark') return forced;
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

function token(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * A token as six hex digits without `#`. The CSS build shortens `#ffffff` to `#fff`,
 * and Monaco rejects anything but six (or eight) digits.
 */
function hexToken(name: string, fallback: string) {
  const digits = token(name).replace('#', '').toLowerCase();
  if (/^[0-9a-f]{6}$/.test(digits)) return digits;
  if (/^[0-9a-f]{8}$/.test(digits)) return digits.slice(0, 6);
  if (/^[0-9a-f]{3,4}$/.test(digits)) {
    return [...digits.slice(0, 3)].map(digit => digit + digit).join('');
  }
  return fallback;
}

/** Builds the editor theme from the page's colour tokens, so it always matches light or dark. */
function defineTheme(monaco: Monaco, scheme: string) {
  const isDark = scheme === 'dark';
  const color = (name: string, darkFallback: string, lightFallback: string) =>
    hexToken(name, isDark ? darkFallback : lightFallback);
  const panel = `#${color('--panel', '11141b', 'ffffff')}`;
  monaco.editor.defineTheme(THEME_NAME, {
    base: isDark ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: color('--kw', 'c3a6ff', '7a2fd0') },
      { token: 'string', foreground: color('--str', '8fe3b0', '0b6e4f') },
      { token: 'comment', foreground: color('--com', '6e7787', '868e9c'), fontStyle: 'italic' },
      { token: 'number', foreground: color('--t-compare', 'ffd25e', 'a87800') },
    ],
    colors: {
      'editor.background': panel,
      'editor.foreground': `#${color('--ink', 'eceff5', '12151c')}`,
      'editorLineNumber.foreground': `#${color('--ink-3', '6e7787', '868e9c')}`,
      'editorLineNumber.activeForeground': `#${color('--ink-3', '6e7787', '868e9c')}`,
      'editor.lineHighlightBackground': panel,
      'editor.selectionBackground': `#${color('--accent-soft', '221e45', 'ece9ff')}`,
      'scrollbarSlider.background': `#${color('--line-2', '2b313d', 'd9dce4')}`,
    },
  });
  monaco.editor.setTheme(THEME_NAME);
}

function highlightLine(editor: CodeEditor, monaco: Monaco, decorations: Decorations, line: number) {
  const lineNumber = Math.min(Math.max(line + 1, 1), editor.getModel()?.getLineCount() ?? 1);
  decorations.set([
    {
      range: new monaco.Range(lineNumber, 1, lineNumber, 1),
      options: {
        isWholeLine: true,
        className: 'code-lens-current-line',
        lineNumberClassName: 'code-lens-current-line-number',
      },
    },
  ]);
  editor.revealLineInCenterIfOutsideViewport(lineNumber);
}

interface MonacoCodeProps {
  code: string[];
  activeLine: number;
}

export default function MonacoCode({ code, activeLine }: MonacoCodeProps) {
  const editorRef = useRef<CodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationsRef = useRef<Decorations | null>(null);
  const scheme = useSyncExternalStore(subscribeToScheme, readScheme, () => 'dark');
  const height = code.length * LINE_HEIGHT + VERTICAL_PADDING * 2;

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    decorationsRef.current = editor.createDecorationsCollection();
    editor.updateOptions({ fontFamily: `${token('--font-jetbrains')}, ${FALLBACK_MONO}` });
    defineTheme(monaco, readScheme());
    highlightLine(editor, monaco, decorationsRef.current, activeLine);
  };

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (editor && monaco && decorationsRef.current) {
      highlightLine(editor, monaco, decorationsRef.current, activeLine);
    }
  }, [activeLine, code]);

  useEffect(() => {
    if (monacoRef.current) defineTheme(monacoRef.current, scheme);
  }, [scheme]);

  return (
    <div className="overflow-hidden" style={{ height }} data-active-line={activeLine + 1}>
      <Editor
        height={height}
        language="python"
        value={code.join('\n')}
        theme={THEME_NAME}
        onMount={handleMount}
        options={EDITOR_OPTIONS}
      />
    </div>
  );
}
