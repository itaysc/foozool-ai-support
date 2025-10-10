import React, { useState, useCallback, useEffect } from 'react';
import { EditorState, RichUtils, getDefaultKeyBinding } from 'draft-js';
import Editor from 'draft-js-plugins-editor';
import createMentionPlugin, { defaultSuggestionsFilter } from 'draft-js-mention-plugin';
import { Box } from '@mui/material';

// Import styles
import 'draft-js/dist/Draft.css';
import 'draft-js-mention-plugin/lib/plugin.css';

interface User {
  id?: string;
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface CommentDescriptionFieldProps {
  value: string;
  onChange: (value: string) => void;
  users: User[];
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  size?: 'small' | 'medium';
  sx?: any;
}

// Create mention plugin
const mentionPlugin = createMentionPlugin({
  mentionPrefix: '@',
  mentionTrigger: '@',
  supportWhitespace: false,
});

// Get plugins
const { MentionSuggestions } = mentionPlugin;
const plugins = [mentionPlugin];

const CommentDescriptionField: React.FC<CommentDescriptionFieldProps> = ({
  value,
  onChange,
  users,
  placeholder = '',
  multiline = true,
  rows = 3,
  size = 'medium',
  sx = {},
}) => {
  const [editorState, setEditorState] = useState(() => {
    return EditorState.createEmpty();
  });

  const [suggestions, setSuggestions] = useState(
    users.map(user => ({
      name: `${user.firstName} ${user.lastName}`,
      link: `#${user.id || user._id}`,
      avatar: null,
      id: user.id || user._id || 'unknown',
    }))
  );

  const [open, setOpen] = useState(false);
  
  // Debug: Log when open state changes
  useEffect(() => {
    console.log('Open state changed to:', open);
  }, [open]);
  
  // Debug: Log suggestions
  useEffect(() => {
    console.log('Suggestions:', suggestions);
  }, [suggestions]);

  // Update suggestions when users change
  useEffect(() => {
    setSuggestions(
      users.map(user => ({
        name: `${user.firstName} ${user.lastName}`,
        link: `#${user.id || user._id}`,
        avatar: null,
        id: user.id || user._id || 'unknown',
      }))
    );
  }, [users]);

  const onEditorStateChange = useCallback((newEditorState: EditorState) => {
    console.log('Editor state changed');
    setEditorState(newEditorState);
    
    // Convert to plain text for the onChange callback
    const plainText = newEditorState.getCurrentContent().getPlainText();
    onChange(plainText);
    
    // Check if @ was typed to open suggestions
    const currentContent = newEditorState.getCurrentContent();
    const selection = newEditorState.getSelection();
    const block = currentContent.getBlockForKey(selection.getStartKey());
    const text = block.getText();
    const cursorPos = selection.getStartOffset();
    
    console.log('Text:', text, 'Cursor:', cursorPos, 'Char before cursor:', text.charAt(cursorPos - 1));
    
    // Check if cursor is right after @ symbol
    if (cursorPos > 0 && text.charAt(cursorPos - 1) === '@') {
      console.log('@ detected, opening suggestions');
      setOpen(true);
    } else {
      // Close suggestions if not typing after @
      setOpen(false);
    }
  }, [onChange]);

  const onSearchChange = useCallback(({ value }: { value: string }) => {
    const filteredSuggestions = defaultSuggestionsFilter(value, suggestions);
    setSuggestions(filteredSuggestions);
  }, [suggestions]);

  const onAddMention = useCallback((mention: any) => {
    // You can get access to the mention object upon selection
    console.log('Mention added:', mention);
  }, []);

  // Handle key binding for multiline support
  const keyBindingFn = useCallback((e: React.KeyboardEvent) => {
    if (multiline && e.key === 'Enter') {
      return 'split-block';
    }
    return getDefaultKeyBinding(e);
  }, [multiline]);

  // Handle return key
  const handleKeyCommand = useCallback((command: string, editorState: EditorState) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      onEditorStateChange(newState);
      return 'handled';
    }
    return 'not-handled';
  }, [onEditorStateChange]);

  return (
    <Box sx={{ 
      border: '1px solid #e5e7eb',
      borderRadius: '4px',
      padding: size === 'small' ? '6px 10px' : '8px 12px',
      minHeight: multiline ? `${rows * 24 + 16}px` : '40px',
      fontSize: size === 'small' ? '0.8rem' : '1rem',
      fontFamily: 'Arial, sans-serif',
      lineHeight: '24px',
      '&:focus-within': {
        borderColor: '#1976d2',
        borderWidth: '2px',
        outline: 'none',
        boxShadow: '0 0 0 0.2rem rgba(25, 118, 210, 0.25)',
      },
      ...sx 
    }}>
      <Editor
        editorState={editorState}
        onChange={onEditorStateChange}
        plugins={plugins}
        placeholder={placeholder}
        handleKeyCommand={handleKeyCommand}
        keyBindingFn={keyBindingFn}
      />
      <MentionSuggestions
        open={open}
        onOpenChange={(newOpen) => {
          console.log('MentionSuggestions onOpenChange:', newOpen);
          setOpen(newOpen);
        }}
        suggestions={suggestions}
        onSearchChange={onSearchChange}
        onAddMention={onAddMention}
        style={{
          position: 'absolute',
          zIndex: 1300,
          backgroundColor: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '4px',
          maxHeight: '200px',
          overflow: 'auto',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}
        entryComponent={({ mention, theme, searchValue, isFocused, ...parentProps }) => (
          <div
            {...parentProps}
            style={{
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: isFocused ? '#f3f4f6' : 'transparent',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#1976d2',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                marginRight: '8px',
              }}
            >
              {mention.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <div style={{ fontWeight: 500, fontSize: '0.9rem', color: '#374151' }}>
                {mention.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                {users.find(u => (u.id || u._id) === mention.id)?.email || ''}
              </div>
            </div>
          </div>
        )}
      />
    </Box>
  );
};

export default CommentDescriptionField;