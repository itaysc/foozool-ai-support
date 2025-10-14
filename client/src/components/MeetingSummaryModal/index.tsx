import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
  TextField,
  Typography,
  Toolbar,
  Divider,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlineIcon,
  StrikethroughS as StrikeIcon,
  FormatAlignLeft as AlignLeftIcon,
  FormatAlignCenter as AlignCenterIcon,
  FormatAlignRight as AlignRightIcon,
  FormatListBulleted as BulletListIcon,
  FormatListNumbered as NumberedListIcon,
  CheckBox as CheckBoxIcon,
  CalendarToday as CalendarIcon,
  PersonAdd as PersonAddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { ICustomer } from '@/types';
import usersStore from '@/stores/users.store';
import documentsStore from '@/stores/documents.store';
import toast from '@/utils/toast';

interface MeetingSummaryModalProps {
  open: boolean;
  onClose: () => void;
  customer: ICustomer | null;
}

const MeetingSummaryModal: React.FC<MeetingSummaryModalProps> = ({
  open,
  onClose,
  customer,
}) => {
  const [title, setTitle] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [mentionMenuAnchor, setMentionMenuAnchor] = useState<HTMLElement | null>(null);
  const [mentionQuery, setMentionQuery] = useState('');

  // Load users from the store when modal opens
  useEffect(() => {
    if (open) {
      usersStore.loadUsers();
    }
  }, [open]);

  // Initialize title when customer changes
  useEffect(() => {
    if (customer) {
      setTitle(`Meeting Summary - ${customer.name} - ${new Date().toLocaleDateString()}`);
    }
  }, [customer]);

  // Create mention extension with users from store
  const mentionExtension = useMemo(() => {
    return Mention.configure({
      HTMLAttributes: {
        class: 'mention',
      },
      renderText({ node }) {
        return `@${node.attrs.label}`;
      },
      suggestion: {
        items: ({ query }) => {
          // Access users store safely and check loading state
          if (usersStore.isLoading) {
            return [];
          }
          
          if (usersStore.error) {
            return [];
          }
          
          const users = usersStore.users || [];
          const currentUsers = users.map(user => ({
            id: user._id,
            name: user.fullName,
            email: typeof user.email === 'string' ? user.email : (user.email?.type || ''),
          }));
          
          // Always return users if no query, otherwise filter
          if (!query || query.trim() === '') {
            return currentUsers.slice(0, 5);
          }
          
          const filtered = currentUsers.filter(user =>
            user.name.toLowerCase().includes(query.toLowerCase()) ||
            user.email.toLowerCase().includes(query.toLowerCase())
          ).slice(0, 5);
          return filtered;
        },
        render: () => {
          let component: any;
          let popup: any;
          let selectedIndex = 0;

          return {
            onStart: (props: any) => {
              popup = document.createElement('div');
              popup.className = 'mention-suggestion-list';
              popup.style.cssText = `
                position: fixed;
                background: white;
                border: 1px solid #e0e0e0;
                border-radius: 4px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                max-height: 200px;
                overflow-y: auto;
                z-index: 10000;
                min-width: 200px;
              `;
              
              // Make popup focusable for keyboard events
              popup.setAttribute('tabindex', '-1');
              
              document.body.appendChild(popup);
              
              // Position the popup
              positionPopup(props);
              updatePopup(props);
              
              // Add global keyboard listener
              const handleKeyDown = (event: KeyboardEvent) => {
                if (['Escape', 'ArrowDown', 'ArrowUp', 'Enter', 'Tab'].includes(event.key)) {
                  event.preventDefault();
                  event.stopPropagation();
                }
                
                if (event.key === 'Escape') {
                  popup?.remove();
                  document.removeEventListener('keydown', handleKeyDown);
                  return;
                }
                if (event.key === 'ArrowDown') {
                  selectedIndex = Math.min(selectedIndex + 1, (props.items?.length || 1) - 1);
                  updatePopup(props);
                  return;
                }
                if (event.key === 'ArrowUp') {
                  selectedIndex = Math.max(selectedIndex - 1, 0);
                  updatePopup(props);
                  return;
                }
                if (event.key === 'Enter' || event.key === 'Tab') {
                  if (props.items && props.items[selectedIndex]) {
                    props.command({ id: props.items[selectedIndex].id, label: props.items[selectedIndex].name });
                    popup?.remove();
                    document.removeEventListener('keydown', handleKeyDown);
                  }
                  return;
                }
              };
              
              document.addEventListener('keydown', handleKeyDown);
              
              // Store the cleanup function
              popup._cleanup = () => {
                document.removeEventListener('keydown', handleKeyDown);
              };
            },
            onUpdate: (props: any) => {
              selectedIndex = props.selectedIndex || 0;
              positionPopup(props);
              updatePopup(props);
            },
            onExit: () => {
              popup?._cleanup?.();
              popup?.remove();
            },
            };

            function positionPopup(props: any) {
              if (!popup) return;
              
              try {
                // Get the bounding rectangle from props
                const getReferenceClientRect = props.clientRect;
                
                if (getReferenceClientRect) {
                  const rect = typeof getReferenceClientRect === 'function' 
                    ? getReferenceClientRect() 
                    : getReferenceClientRect;
                  
                  if (rect) {
                    const left = rect.left || rect.x || 0;
                    const top = (rect.bottom || rect.y || 0);
                    
                    popup.style.left = `${left}px`;
                    popup.style.top = `${top + 8}px`;
                    return;
                  }
                }
                
                // Fallback: use selection if available
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                  const range = selection.getRangeAt(0);
                  const rect = range.getBoundingClientRect();
                  popup.style.left = `${rect.left}px`;
                  popup.style.top = `${rect.bottom + 8}px`;
                }
              } catch (error) {
                // Silently handle positioning errors
              }
            }

            function updatePopup(props: any) {
              if (!popup) {
                return;
              }
              
              popup.innerHTML = '';
              
              const items = props.items || [];
              
              if (items.length === 0) {
                const item = document.createElement('div');
                item.textContent = 'No users found';
                item.style.cssText = 'padding: 8px 12px; color: #666;';
                popup.appendChild(item);
                return;
              }
              
              items.forEach((user: any, index: number) => {
                const item = document.createElement('div');
                item.className = 'mention-item';
                item.style.cssText = `
                  padding: 8px 12px;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  ${index === selectedIndex ? 'background: #e3f2fd; border-left: 3px solid #1976d2;' : 'background: white;'}
                  transition: background-color 0.1s ease;
                `;
                
                const avatar = document.createElement('div');
                avatar.style.cssText = `
                  width: 24px;
                  height: 24px;
                  border-radius: 50%;
                  background: #1976d2;
                  color: white;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 12px;
                  font-weight: bold;
                `;
                avatar.textContent = user.name.charAt(0).toUpperCase();
                
                const info = document.createElement('div');
                info.style.cssText = 'flex: 1;';
                
                const name = document.createElement('div');
                name.textContent = user.name;
                name.style.cssText = 'font-weight: 500; font-size: 14px;';
                
                const email = document.createElement('div');
                email.textContent = user.email;
                email.style.cssText = 'font-size: 12px; color: #666;';
                
                info.appendChild(name);
                info.appendChild(email);
                
                item.appendChild(avatar);
                item.appendChild(info);
                
                item.addEventListener('click', () => {
                  props.command({ id: user.id, label: user.name });
                  popup?.remove();
                });
                
                // Add hover effects
                item.addEventListener('mouseenter', () => {
                  if (index !== selectedIndex) {
                    item.style.background = '#f5f5f5';
                  }
                });
                
                item.addEventListener('mouseleave', () => {
                  if (index !== selectedIndex) {
                    item.style.background = 'white';
                  }
                });
                
                popup.appendChild(item);
              });
            }
          },
        },
      });
  }, [usersStore.users, usersStore.isLoading, usersStore.error]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        underline: false,
        strike: false,
      }),
      mentionExtension,
      Placeholder.configure({
        placeholder: 'Start writing your meeting summary...',
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Strike,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: `
      <h2>📅 Meeting Details</h2>
      <p><strong>Customer:</strong> ${customer?.name || 'N/A'}</p>
      <p><strong>Date:</strong> <span data-date-widget="true">${new Date().toLocaleDateString()}</span></p>
      <p><strong>Meeting Type:</strong> </p>
      <p><strong>Attendees:</strong> [Type @ to mention users{usersStore.isLoading ? ' (loading...)' : ''}]</p>
      <p><strong>Duration:</strong> </p>
      
      <hr />
      
      <h2>📋 Agenda</h2>
      <ul>
        <li>[Agenda item 1]</li>
        <li>[Agenda item 2]</li>
        <li>[Agenda item 3]</li>
      </ul>
      
      <h2>📝 Meeting Notes</h2>
      <p></p>
      
      <h2>✅ Action Items</h2>
      <p>[Action item 1] - Assigned to: @[Type to mention user]</p>
      <p>[Action item 2] - Assigned to: @[Type to mention user]</p>
      <p>[Action item 3] - Assigned to: @[Type to mention user]</p>
      <p><em>Tip: Select text and click the checkbox button to convert to task list items</em></p>
      
      <h2>🎯 Next Steps</h2>
      <ul>
        <li>[Next step 1]</li>
        <li>[Next step 2]</li>
        <li>[Next step 3]</li>
      </ul>
    `,
    onUpdate: () => {
      setHasUnsavedChanges(true);
    },
  }, [mentionExtension]);

  const resetEditor = () => {
    if (editor) {
      editor.commands.setContent(`
        <h2>📅 Meeting Details</h2>
        <p><strong>Customer:</strong> ${customer?.name || 'N/A'}</p>
        <p><strong>Date:</strong> <span data-date-widget="true">${new Date().toLocaleDateString()}</span></p>
        <p><strong>Meeting Type:</strong> </p>
        <p><strong>Attendees:</strong> [Type @ to mention users{usersStore.isLoading ? ' (loading...)' : ''}]</p>
        <p><strong>Duration:</strong> </p>
        
        <hr />
        
        <h2>📋 Agenda</h2>
        <ul>
          <li>[Agenda item 1]</li>
          <li>[Agenda item 2]</li>
          <li>[Agenda item 3]</li>
        </ul>
        
        <h2>📝 Meeting Notes</h2>
        <p></p>
        
        <h2>✅ Action Items</h2>
        <p>[Action item 1] - Assigned to: @[Type to mention user]</p>
        <p>[Action item 2] - Assigned to: @[Type to mention user]</p>
        <p>[Action item 3] - Assigned to: @[Type to mention user]</p>
        <p><em>Tip: Select text and click the checkbox button to convert to task list items</em></p>
        
        <h2>🎯 Next Steps</h2>
        <ul>
          <li>[Next step 1]</li>
          <li>[Next step 2]</li>
          <li>[Next step 3]</li>
        </ul>
      `);
    }
    setTitle(`Meeting Summary - ${customer?.name || 'Customer'} - ${new Date().toLocaleDateString()}`);
    setHasUnsavedChanges(false);
  };

  // Reset editor content when modal opens
  useEffect(() => {
    if (open && editor) {
      resetEditor();
    }
  }, [open, editor, customer]);

  const handleSave = async () => {
    if (!editor || !title.trim() || !customer) {
      return;
    }
    
    try {
      const content = editor.getHTML();
      
      await documentsStore.createDocument({
        title,
        content,
        documentType: 'meeting_summary',
        customerId: customer._id,
        meetingDate: new Date(),
        meetingType: 'customer_facing',
        attendees: [],
      });
      
      toast.success('Document saved successfully!', {
        autoHideDuration: 3000,
        persist: false,
      });
      setHasUnsavedChanges(false);
      onClose();
    } catch (error: any) {
      console.error('Error saving document:', error);
      toast.error(error.response?.data?.error || 'Failed to save document. Please try again.', {
        autoHideDuration: 5000,
        persist: false,
      });
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowCancelConfirm(true);
    } else {
      resetEditor();
      onClose();
    }
  };

  const handleConfirmCancel = () => {
    setShowCancelConfirm(false);
    resetEditor();
    onClose();
  };

  const handleCloseCancelConfirm = () => {
    setShowCancelConfirm(false);
  };

  const toggleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run();
  }, [editor]);

  const toggleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run();
  }, [editor]);

  const toggleUnderline = useCallback(() => {
    editor?.chain().focus().toggleUnderline().run();
  }, [editor]);

  const toggleStrike = useCallback(() => {
    editor?.chain().focus().toggleStrike().run();
  }, [editor]);

  const setTextAlign = (alignment: 'left' | 'center' | 'right') => {
    editor?.chain().focus().setTextAlign(alignment).run();
  };

  const toggleBulletList = useCallback(() => {
    editor?.chain().focus().toggleBulletList().run();
  }, [editor]);

  const toggleOrderedList = useCallback(() => {
    editor?.chain().focus().toggleOrderedList().run();
  }, [editor]);

  const toggleTaskList = useCallback(() => {
    editor?.chain().focus().toggleTaskList().run();
  }, [editor]);

  const insertDateWidget = useCallback(() => {
    editor?.chain().focus().insertContent('<span data-date-widget="true" style="background: #e3f2fd; padding: 2px 6px; border-radius: 4px; border: 1px solid #2196f3; cursor: pointer;">📅 Date Widget</span> ').run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={handleCancel}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Typography variant="h6" component="div">
            Create Meeting Summary
          </Typography>
          <IconButton onClick={handleCancel} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Title Input */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Meeting Summary Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '1.25rem',
                  fontWeight: 500,
                },
              }}
            />
          </Box>

          {/* Toolbar */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Toolbar variant="dense" sx={{ minHeight: 40, gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={toggleBold}
                color={editor.isActive('bold') ? 'primary' : 'default'}
              >
                <BoldIcon fontSize="small" />
              </IconButton>
              
              <IconButton
                size="small"
                onClick={toggleItalic}
                color={editor.isActive('italic') ? 'primary' : 'default'}
              >
                <ItalicIcon fontSize="small" />
              </IconButton>
              
              <IconButton
                size="small"
                onClick={toggleUnderline}
                color={editor.isActive('underline') ? 'primary' : 'default'}
              >
                <UnderlineIcon fontSize="small" />
              </IconButton>
              
              <IconButton
                size="small"
                onClick={toggleStrike}
                color={editor.isActive('strike') ? 'primary' : 'default'}
              >
                <StrikeIcon fontSize="small" />
              </IconButton>

              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

              <IconButton
                size="small"
                onClick={() => setTextAlign('left')}
                color={editor.isActive({ textAlign: 'left' }) ? 'primary' : 'default'}
              >
                <AlignLeftIcon fontSize="small" />
              </IconButton>
              
              <IconButton
                size="small"
                onClick={() => setTextAlign('center')}
                color={editor.isActive({ textAlign: 'center' }) ? 'primary' : 'default'}
              >
                <AlignCenterIcon fontSize="small" />
              </IconButton>
              
              <IconButton
                size="small"
                onClick={() => setTextAlign('right')}
                color={editor.isActive({ textAlign: 'right' }) ? 'primary' : 'default'}
              >
                <AlignRightIcon fontSize="small" />
              </IconButton>

              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

              <IconButton
                size="small"
                onClick={toggleBulletList}
                color={editor.isActive('bulletList') ? 'primary' : 'default'}
              >
                <BulletListIcon fontSize="small" />
              </IconButton>
              
              <IconButton
                size="small"
                onClick={toggleOrderedList}
                color={editor.isActive('orderedList') ? 'primary' : 'default'}
              >
                <NumberedListIcon fontSize="small" />
              </IconButton>
              
              <IconButton
                size="small"
                onClick={toggleTaskList}
                color={editor.isActive('taskList') ? 'primary' : 'default'}
              >
                <CheckBoxIcon fontSize="small" />
              </IconButton>

              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

              <IconButton
                size="small"
                onClick={insertDateWidget}
                title="Insert Date Widget"
              >
                <CalendarIcon fontSize="small" />
              </IconButton>
            </Toolbar>
          </Box>

          {/* Editor */}
          <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
            <EditorContent
              editor={editor}
              style={{
                minHeight: '400px',
                outline: 'none',
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button
            onClick={handleCancel}
            startIcon={<CancelIcon />}
            disabled={documentsStore.isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={documentsStore.isSaving ? <CircularProgress size={16} /> : <SaveIcon />}
            disabled={documentsStore.isSaving || !title.trim()}
          >
            {documentsStore.isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={showCancelConfirm}
        onClose={handleCloseCancelConfirm}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Unsaved Changes</DialogTitle>
        <DialogContent>
          <Typography>
            You have unsaved changes. Are you sure you want to cancel? All changes will be lost.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelConfirm}>
            Continue Editing
          </Button>
          <Button onClick={handleConfirmCancel} color="error">
            Discard Changes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default observer(MeetingSummaryModal);
