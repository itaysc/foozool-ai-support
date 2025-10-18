import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Description,
  Add,
  Refresh,
  Link,
  CloudQueue,
  Create
} from '@mui/icons-material';
import documentsStore from '@/stores/documents.store';
import customersStore from '@/stores/customers.store';
import { IDocument } from '@/services/documents-service';
import documentsService from '@/services/documents-service';
import toast from '@/utils/toast';
import DocumentViewModal from '@/components/DocumentViewModal';
import DocumentEditModal from '@/components/DocumentEditModal';
import FolderTree from '@/components/docs/FolderTree';
import FolderView from '@/components/docs/FolderView';
import Breadcrumb from '@/components/docs/Breadcrumb';
import FolderDialog from '@/components/docs/FolderDialog';
import MoveDialog from '@/components/docs/MoveDialog';
import RenameDialog from '@/components/docs/RenameDialog';
import LinkDocumentDialog from '@/components/docs/LinkDocumentDialog';
import GoogleDocSelectionDialog from '@/components/docs/GoogleDocSelectionDialog';

const DocsPage: React.FC = () => {
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Current folder path
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  
  // Refresh trigger for components
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  
  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<IDocument | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState<IDocument | null>(null);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderDialogParent, setFolderDialogParent] = useState<string>('/');
  const [editFolder, setEditFolder] = useState<{
    id: string;
    name: string;
    path: string;
  } | null>(null);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [itemToMove, setItemToMove] = useState<{
    id: string;
    name: string;
    isFolder: boolean;
    currentPath: string;
  } | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [itemToRename, setItemToRename] = useState<{
    id: string;
    name: string;
    isFolder: boolean;
  } | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    name: string;
    isFolder: boolean;
  } | null>(null);
  const [documentTypeMenuAnchor, setDocumentTypeMenuAnchor] = useState<null | HTMLElement>(null);
  const [linkDocumentDialogOpen, setLinkDocumentDialogOpen] = useState(false);
  const [googleDocDialogOpen, setGoogleDocDialogOpen] = useState(false);

  // Load customers on mount
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      await customersStore.fetchCustomers();
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  };

  // Trigger refresh for all components
  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Handle folder selection
  const handleFolderSelect = (folderPath: string, folderId?: string | null) => {
    setCurrentPath(folderPath);
    setCurrentFolderId(folderId || null);
  };

  // Handle document view
  const handleViewDocument = (document: IDocument) => {
    // If it's a Google Doc, open it in Google Drive
    if (document.documentType === 'google_doc' && document.googleDocUrl) {
      window.open(document.googleDocUrl, '_blank');
      return;
    }
    
    // If it's a link document, open the link
    if (document.documentType === 'link' && document.linkUrl) {
      window.open(document.linkUrl, '_blank');
      return;
    }
    
    // For other document types, open in our modal
    setSelectedDocument(document);
    setViewModalOpen(true);
  };

  // Handle document edit
  const handleEditDocument = (document: IDocument) => {
    setDocumentToEdit(document);
    setEditModalOpen(true);
  };

  // Handle document move
  const handleMoveDocument = (document: IDocument) => {
    setItemToMove({
      id: document._id,
      name: document.title,
      isFolder: false,
      currentPath: document.folderPath
    });
    setMoveDialogOpen(true);
  };

  // Handle document rename
  const handleRenameDocument = (document: IDocument) => {
    setItemToRename({
      id: document._id,
      name: document.title,
      isFolder: false
    });
    setRenameDialogOpen(true);
  };

  // Handle folder create
  const handleCreateFolder = (parentPath: string) => {
    setFolderDialogParent(parentPath);
    setEditFolder(null);
    setFolderDialogOpen(true);
  };

  // Handle folder edit
  const handleEditFolder = (folder: IDocument) => {
    setEditFolder({
      id: folder._id,
      name: folder.folderName || folder.title,
      path: folder.folderPath
    });
    setFolderDialogOpen(true);
  };

  // Handle folder rename
  const handleRenameFolder = (folder: IDocument) => {
    setItemToRename({
      id: folder._id,
      name: folder.folderName || folder.title,
      isFolder: true
    });
    setRenameDialogOpen(true);
  };

  // Handle folder move
  const handleMoveFolder = (folder: IDocument) => {
    setItemToMove({
      id: folder._id,
      name: folder.folderName || folder.title,
      isFolder: true,
      currentPath: folder.folderPath
    });
    setMoveDialogOpen(true);
  };

  // Handle folder navigation
  const handleFolderNavigate = (folder: IDocument) => {
    setCurrentPath(folder.folderPath);
    setCurrentFolderId(folder._id);
  };

  // Handle folder dialog success
  const handleFolderDialogSuccess = () => {
    triggerRefresh();
    toast.success('Folder operation completed successfully');
  };

  // Handle move dialog success
  const handleMoveDialogSuccess = () => {
    triggerRefresh();
    toast.success('Item moved successfully');
  };

  // Handle document saved
  const handleDocumentSaved = async () => {
    triggerRefresh();
    toast.success('Document saved successfully');
  };

  // Handle document type menu
  const handleDocumentTypeMenuClose = () => {
    setDocumentTypeMenuAnchor(null);
  };

  const handleManualEntry = () => {
    handleDocumentTypeMenuClose();
    setDocumentToEdit(null);
    setEditModalOpen(true);
  };

  const handleLinkDocument = () => {
    handleDocumentTypeMenuClose();
    setLinkDocumentDialogOpen(true);
  };

  const handleGoogleDoc = () => {
    handleDocumentTypeMenuClose();
    setGoogleDocDialogOpen(true);
  };

  // Handle document delete
  const handleDeleteDocument = (document: IDocument) => {
    setItemToDelete({
      id: document._id,
      name: document.title,
      isFolder: false
    });
    setDeleteConfirmOpen(true);
  };

  // Handle folder delete
  const handleDeleteFolder = (folder: IDocument) => {
    setItemToDelete({
      id: folder._id,
      name: folder.folderName || folder.title,
      isFolder: true
    });
    setDeleteConfirmOpen(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.isFolder) {
        await documentsService.deleteFolder(itemToDelete.id);
        toast.success('Folder deleted successfully');
      } else {
        await documentsService.deleteDocument(itemToDelete.id);
        toast.success('Document deleted successfully');
      }
      triggerRefresh();
    } catch (err: any) {
      console.error('Error deleting item:', err);
      toast.error(err.response?.data?.message || 'Failed to delete item');
    } finally {
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  // Close modals
  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedDocument(null);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setDocumentToEdit(null);
  };

  const handleCloseFolderDialog = () => {
    setFolderDialogOpen(false);
    setEditFolder(null);
  };

  const handleCloseMoveDialog = () => {
    setMoveDialogOpen(false);
    setItemToMove(null);
  };

  const handleCloseRenameDialog = () => {
    setRenameDialogOpen(false);
    setItemToRename(null);
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 3, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
        <Description sx={{ mr: 2, verticalAlign: 'middle' }} />
        Documents
      </Typography>

                  <Box display="flex" gap={2}>
                    <Button
                      variant="contained"
                      startIcon={<Description />}
                      onClick={(e) => setDocumentTypeMenuAnchor(e.currentTarget)}
                    >
                      New Document
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Refresh />}
                      onClick={() => window.location.reload()}
                    >
                      Refresh
                    </Button>
                  </Box>
        </Box>

        {/* Breadcrumb */}
        <Breadcrumb
          currentPath={currentPath}
          onPathChange={handleFolderSelect}
        />
      </Box>

      {/* Error Alert */}
      {error && (
        <Box sx={{ p: 3, pt: 0 }}>
          <Alert severity="error">
          {error}
        </Alert>
        </Box>
      )}

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Sidebar - Folder Tree */}
        <Paper
          elevation={1}
          sx={{
            width: 280,
            minWidth: 280,
            borderRight: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 0
          }}
        >
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
              Folders
            </Typography>
          </Box>
          
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <FolderTree
              onFolderSelect={handleFolderSelect}
              selectedFolderPath={currentPath}
              onFolderCreate={handleCreateFolder}
              refreshTrigger={refreshTrigger}
            />
          </Box>
        </Paper>

        <Divider orientation="vertical" flexItem />

        {/* Right Content - Folder View */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Box sx={{ p: 3 }}>
                    <FolderView
                      currentPath={currentPath}
                      currentFolderId={currentFolderId}
                      onDocumentView={handleViewDocument}
                      onDocumentEdit={handleEditDocument}
                      onDocumentRename={handleRenameDocument}
                      onDocumentMove={handleMoveDocument}
                      onDocumentDelete={handleDeleteDocument}
                      onFolderCreate={handleCreateFolder}
                      onFolderEdit={handleEditFolder}
                      onFolderRename={handleRenameFolder}
                      onFolderMove={handleMoveFolder}
                      onFolderDelete={handleDeleteFolder}
                      onFolderNavigate={handleFolderNavigate}
                      refreshTrigger={refreshTrigger}
                    />
          </Box>
        </Box>
      </Box>

      {/* Modals */}
      <DocumentViewModal
        open={viewModalOpen}
        onClose={handleCloseViewModal}
        document={selectedDocument}
      />

      <DocumentEditModal
        open={editModalOpen}
        onClose={handleCloseEditModal}
        document={documentToEdit}
        onSaved={handleDocumentSaved}
                currentPath={currentPath}
                currentFolderId={currentFolderId}
              />

      <FolderDialog
        open={folderDialogOpen}
        onClose={handleCloseFolderDialog}
        onSuccess={handleFolderDialogSuccess}
        parentPath={folderDialogParent}
        editFolder={editFolder}
      />

              <MoveDialog
                open={moveDialogOpen}
                onClose={handleCloseMoveDialog}
                onSuccess={handleMoveDialogSuccess}
                item={itemToMove}
              />

              <RenameDialog
                open={renameDialogOpen}
                onClose={handleCloseRenameDialog}
                onSuccess={handleDocumentSaved}
                item={itemToRename}
              />

              {/* Delete Confirmation Dialog */}
              <Dialog open={deleteConfirmOpen} onClose={handleCloseDeleteConfirm}>
                <DialogTitle>
                  Delete {itemToDelete?.isFolder ? 'Folder' : 'Document'}
                </DialogTitle>
                <DialogContent>
                  <Typography>
                    Are you sure you want to delete "{itemToDelete?.name}"?
                    {itemToDelete?.isFolder && (
                      <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                        Note: Folders can only be deleted if they are empty.
                      </Typography>
                    )}
                  </Typography>
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleCloseDeleteConfirm}>Cancel</Button>
                  <Button 
                    onClick={handleConfirmDelete} 
                    color="error" 
                    variant="contained"
                  >
                    Delete
                  </Button>
                </DialogActions>
              </Dialog>

              {/* Document Type Selection Menu */}
              <Menu
                anchorEl={documentTypeMenuAnchor}
                open={Boolean(documentTypeMenuAnchor)}
                onClose={handleDocumentTypeMenuClose}
              >
                <MenuItem onClick={handleManualEntry}>
                  <ListItemIcon>
                    <Create fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Manual Entry</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleLinkDocument}>
                  <ListItemIcon>
                    <Link fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Link</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleGoogleDoc}>
                  <ListItemIcon>
                    <CloudQueue fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Google Doc</ListItemText>
                </MenuItem>
              </Menu>

              {/* Link Document Dialog */}
              <LinkDocumentDialog
                open={linkDocumentDialogOpen}
                onClose={() => setLinkDocumentDialogOpen(false)}
                onSuccess={handleDocumentSaved}
                currentPath={currentPath}
                currentFolderId={currentFolderId}
              />

              {/* Google Doc Selection Dialog */}
              <GoogleDocSelectionDialog
                open={googleDocDialogOpen}
                onClose={() => setGoogleDocDialogOpen(false)}
                onSuccess={handleDocumentSaved}
                currentPath={currentPath}
                currentFolderId={currentFolderId}
      />
    </Box>
  );
};

export default observer(DocsPage);
