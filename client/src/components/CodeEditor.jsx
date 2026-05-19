import { useContext } from 'react';
import Editor from '@monaco-editor/react';
import { ThemeContext } from '../context/ThemeContext';

/**
 * Thin wrapper around `@monaco-editor/react` with project-wide defaults.
 *
 * Props:
 *   - language   Monaco language id ('python', 'javascript', 'cpp', 'java', 'c').
 *   - value      Current code string. Controlled by parent.
 *   - onChange   (nextValue: string) => void. Called on every keystroke.
 *   - readOnly?  Disable editing — used for the review screen "your submitted code" view.
 *   - height?    CSS height. Defaults to 400px.
 *
 * Theme:
 *   We read from ThemeContext so the editor matches the rest of the app —
 *   `vs` for light mode, `vs-dark` for dark. No custom theming needed.
 */
const CodeEditor = ({
  language = 'python',
  value = '',
  onChange,
  readOnly = false,
  height = '400px',
}) => {
  const { theme } = useContext(ThemeContext);

  return (
    <div className="w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
      <Editor
        height={height}
        width="100%"
        language={language}
        value={value}
        theme={theme === 'dark' ? 'vs-dark' : 'vs'}
        // Monaco calls this with (value: string | undefined, event). We collapse
        // undefined → "" so consumers never have to defensive-check.
        onChange={(next) => onChange?.(next ?? '')}
        loading={
          <div className="flex items-center justify-center h-full text-sm text-gray-500 dark:text-gray-400">
            Loading editor…
          </div>
        }
        options={{
          readOnly,
          fontSize: 14,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          tabSize: 2,
          insertSpaces: true,
          minimap: { enabled: false },
          // Wrap long lines so candidates don't have to horizontal-scroll on
          // narrow viewports. Stays on for both edit and read-only modes.
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          // Re-layouts the editor when its container resizes — critical for
          // responsive panels.
          automaticLayout: true,
          // Subtle UX polish: smooth cursor + scroll, no distracting suggestions
          // when the editor first mounts.
          cursorBlinking: 'smooth',
          smoothScrolling: true,
          quickSuggestions: { other: true, comments: false, strings: false },
          padding: { top: 12, bottom: 12 },
        }}
      />
    </div>
  );
};

export default CodeEditor;
