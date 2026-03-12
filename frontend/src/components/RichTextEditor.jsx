import React, { useState, useEffect, useRef } from 'react';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2 } from 'lucide-react';
import '../styles/admin-terms.css';

const RichTextEditor = ({ value, onChange, placeholder }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastValue, setLastValue] = useState(null);
  const editorRef = useRef(null);

  // Chỉ reset content khi value thay đổi từ bên ngoài (không phải do user typing)
  useEffect(() => {
    if (editorRef.current && value !== lastValue) {
      // Chỉ set nội dung khi value thực sự thay đổi và khác với giá trị hiện tại
      if (value !== editorRef.current.innerHTML) {
        editorRef.current.innerHTML = value || '';
      }
      setLastValue(value);
      setIsInitialized(true);
    }
  }, [value, lastValue]);

  const handleContentChange = (e) => {
    const newContent = e.target.innerHTML;
    onChange(newContent);
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    const editor = document.getElementById('editor-content');
    if (editor) {
      onChange(editor.innerHTML);
    }
  };

  const insertHeading = (level) => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const heading = document.createElement(`h${level}`);
      heading.textContent = selection.toString() || 'Heading';
      range.deleteContents();
      range.insertNode(heading);
      
      const editor = document.getElementById('editor-content');
      if (editor) {
        onChange(editor.innerHTML);
      }
    }
  };

  return (
    <div className="rich-text-editor">
      <div className="editor-toolbar">
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => execCommand('bold')}
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => execCommand('italic')}
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => insertHeading(1)}
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => insertHeading(2)}
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => execCommand('insertUnorderedList')}
          title="Bullet List"
        >
          •
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => execCommand('insertOrderedList')}
          title="Numbered List"
        >
          1.
        </button>
      </div>
      <div
        ref={editorRef}
        id="editor-content"
        className="editor-content"
        contentEditable
        suppressContentEditableWarning
        onInput={handleContentChange}
        placeholder={placeholder}
      />
    </div>
  );
};

export default RichTextEditor;
