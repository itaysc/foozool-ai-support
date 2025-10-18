import React, { useState, useEffect, useMemo } from 'react';
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
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
import usersStore from '@/stores/users.store';
import documentsStore from '@/stores/documents.store';
import customersStore from '@/stores/customers.store';
import { IDocument } from '@/services/documents-service';
import toast from '@/utils/toast';
import './styles.css';

interface DocumentEditModalProps {
  open: boolean;
  onClose: () => void;
  document: IDocument | null;
  onSaved?: () => void;
  currentPath?: string;
  currentFolderId?: string | null;
}

const DocumentEditModal: React.FC<DocumentEditModalProps> = ({
  open,
  onClose,
  document,
  onSaved,
  currentPath = '/',
  currentFolderId = null,
}) => {
  const [title, setTitle] = useState('');
  const [customerId, setCustomerId] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Load users and customers from the store when modal opens
  useEffect(() => {
    if (open) {
      usersStore.loadUsers();
      customersStore.fetchCustomers();
    }
  }, [open]);

  // Initialize title, customer and content when document changes
  useEffect(() => {
    if (document) {
      setTitle(document.title);
      setCustomerId(document.customerId || '');
    } else {
      // Reset for new document
      setTitle('');
      setCustomerId('');
    }
  }, [document]);

  // Mention extension configuration
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

          function positionPopup(props: any) {
            if (!component || !popup) return;
            const { clientRect } = props;
            if (!clientRect) return;
            const rect = clientRect();
            if (!rect) return;
            popup.style.top = `${rect.bottom + window.scrollY}px`;
            popup.style.left = `${rect.left + window.scrollX}px`;
          }

          function updatePopup(props: any) {
            if (!component) return;
            component.innerHTML = '';
            const items = props.items;
            if (!items || items.length === 0) {
              component.innerHTML = '<div class="mention-item">No users found</div>';
              return;
            }
            items.forEach((item: any, index: number) => {
              const button = window.document.createElement('button');
              button.className = `mention-item ${index === selectedIndex ? 'is-selected' : ''}`;
              button.innerHTML = `
                <div class="mention-user-info">
                  <strong>${item.name}</strong>
                  <span>${item.email}</span>
                </div>
              `;
                      button.addEventListener('click', () => props.command({ id: item.id, label: item.name }));
                      component.appendChild(button);
                    });
                    positionPopup(props);
                  }

                  const handleKeyDown = (event: KeyboardEvent, props: any) => {
                    const items = props.items;
                    if (!items || items.length === 0) return false;

                    if (event.key === 'Escape') {
                      event.preventDefault();
                      event.stopPropagation();
                      return true;
                    }

                    if (event.key === 'ArrowDown') {
                      event.preventDefault();
                      event.stopPropagation();
                      selectedIndex = (selectedIndex + 1) % items.length;
                      updatePopup(props);
                      return true;
                    }

                    if (event.key === 'ArrowUp') {
                      event.preventDefault();
                      event.stopPropagation();
                      selectedIndex = (selectedIndex - 1 + items.length) % items.length;
                      updatePopup(props);
                      return true;
                    }

                    if (event.key === 'Enter' || event.key === 'Tab') {
                      event.preventDefault();
                      event.stopPropagation();
                      if (items[selectedIndex]) {
                        props.command({ id: items[selectedIndex].id, label: items[selectedIndex].name });
                      }
                      return true;
                    }

                    return false;
                  };

                  return {
                    onStart: (props: any) => {
                      component = window.document.createElement('div');
              component.className = 'mention-suggestions';
              popup = component;
              window.document.body.appendChild(popup);

              const keydownHandler = (event: KeyboardEvent) => handleKeyDown(event, props);
              window.document.addEventListener('keydown', keydownHandler);
              (component as any)._keydownHandler = keydownHandler;

              selectedIndex = 0;
              updatePopup(props);
              positionPopup(props);
            },
            onUpdate: (props: any) => {
              selectedIndex = 0;
              updatePopup(props);
              positionPopup(props);
            },
                    onExit: () => {
                      if (component) {
                        const keydownHandler = (component as any)._keydownHandler;
                        if (keydownHandler) {
                          window.document.removeEventListener('keydown', keydownHandler);
                        }
                        component.remove();
                      }
                      popup = null;
                      component = null;
                    },
          };
        },
      },
    });
  }, [usersStore.users, usersStore.isLoading, usersStore.error]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        strike: false,
        underline: false,
      }),
      mentionExtension,
      Placeholder.configure({
        placeholder: 'Start editing the document content...',
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
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
    content: '',
    onUpdate: () => {
      setHasUnsavedChanges(true);
    },
  }, [mentionExtension]);

  // Update editor content when document changes
  useEffect(() => {
    if (editor && document && open) {
      editor.commands.setContent(document.content);
      setHasUnsavedChanges(false);
    }
  }, [editor, document, open]);

  const handleSave = async () => {
    if (!editor || !title.trim()) {
      return;
    }

    try {
      const content = editor.getHTML();

      if (document) {
        // Update existing document
        await documentsStore.updateDocument(document._id, {
          title,
          content,
        });
        toast.success('Document updated successfully!', {
          autoHideDuration: 3000,
          persist: false,
        });
      } else {
        // Create new document
        await documentsStore.createDocument({
          title,
          content,
          documentType: 'note',
          folderPath: currentPath,
          parentFolderId: currentFolderId,
          customerId: customerId || undefined, // Include customer ID
        });
        toast.success('Document created successfully!', {
          autoHideDuration: 3000,
          persist: false,
        });
      }

      setHasUnsavedChanges(false);
      onSaved?.();
      onClose();
    } catch (error: any) {
      console.error('Error saving document:', error);
      toast.error(error.response?.data?.error || 'Failed to save document. Please try again.', {
        autoHideDuration: 5000,
        persist: false,
      });
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowCancelConfirm(true);
    } else {
      onClose();
    }
  };

  const confirmClose = () => {
    setShowCancelConfirm(false);
    setHasUnsavedChanges(false);
    onClose();
  };

  if (!editor) {
    return null;
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid',
            borderColor: 'divider',
            pb: 2,
          }}
        >
          <Typography variant="h6">
            {document ? 'Edit Document' : 'Create New Document'}
          </Typography>
          <IconButton edge="end" color="inherit" onClick={handleClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Document Title */}
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <TextField
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setHasUnsavedChanges(true);
              }}
              placeholder="Document Title"
              variant="standard"
              fullWidth
              InputProps={{
                style: { fontSize: '1.25rem', fontWeight: 500 },
              }}
            />
            
            {/* Customer Selector */}
            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth variant="standard">
                <InputLabel>Customer (Optional)</InputLabel>
                <Select
                  value={customerId}
                  onChange={(e) => {
                    setCustomerId(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  label="Customer (Optional)"
                >
                  <MenuItem value="">
                    <em>No customer selected</em>
                  </MenuItem>
                  {customersStore.customers.map((customer) => (
                    <MenuItem key={customer._id} value={customer._id}>
                      {customer.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
          
          {/* Editor Toolbar */}
          <Toolbar
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
              gap: 0.5,
              minHeight: '48px !important',
              flexWrap: 'wrap',
            }}
          >
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().toggleBold().run()}
              color={editor.isActive('bold') ? 'primary' : 'default'}
            >
              <BoldIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              color={editor.isActive('italic') ? 'primary' : 'default'}
            >
              <ItalicIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              color={editor.isActive('underline') ? 'primary' : 'default'}
            >
              <UnderlineIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              color={editor.isActive('strike') ? 'primary' : 'default'}
            >
              <StrikeIcon />
            </IconButton>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              color={editor.isActive({ textAlign: 'left' }) ? 'primary' : 'default'}
            >
              <AlignLeftIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              color={editor.isActive({ textAlign: 'center' }) ? 'primary' : 'default'}
            >
              <AlignCenterIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              color={editor.isActive({ textAlign: 'right' }) ? 'primary' : 'default'}
            >
              <AlignRightIcon />
            </IconButton>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              color={editor.isActive('bulletList') ? 'primary' : 'default'}
            >
              <BulletListIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              color={editor.isActive('orderedList') ? 'primary' : 'default'}
            >
              <NumberedListIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              color={editor.isActive('taskList') ? 'primary' : 'default'}
            >
              <CheckBoxIcon />
            </IconButton>
          </Toolbar>

          {/* Editor Content */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
            <EditorContent editor={editor} />
          </Box>
        </DialogContent>

        <DialogActions sx={{ borderTop: '1px solid', borderColor: 'divider', p: 2 }}>
          <Button onClick={handleClose} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={documentsStore.isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={!title.trim() || documentsStore.isSaving}
          >
            {documentsStore.isSaving 
              ? 'Saving...' 
              : document 
                ? 'Save Changes' 
                : 'Create Document'
            }
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelConfirm} onClose={() => setShowCancelConfirm(false)}>
        <DialogTitle>Unsaved Changes</DialogTitle>
        <DialogContent>
          <Typography>You have unsaved changes. Are you sure you want to close without saving?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCancelConfirm(false)}>Keep Editing</Button>
          <Button onClick={confirmClose} color="error" variant="contained">
            Discard Changes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default observer(DocumentEditModal);

