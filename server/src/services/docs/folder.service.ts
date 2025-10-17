import mongoose from 'mongoose';
import { DocumentModel, IDocument } from '../../schemas/document.schema';
import { UserContextManager } from '../../context/userContext';

export interface ApiResponse<T = any> {
  status: number;
  payload: T | { message: string };
}

/**
 * Create a new folder
 */
export async function createFolder(folderName: string, parentFolderPath: string = '/'): Promise<ApiResponse<IDocument>> {
  try {
    console.log('🔍 createFolder called with:', { folderName, parentFolderPath });
    
    const organizationId = UserContextManager.getCurrentOrganizationId();
    const userId = UserContextManager.getCurrentUserId();

    if (!organizationId || !userId) {
      return {
        status: 401,
        payload: { message: 'User context not available' }
      };
    }

    // Validate folder name
    if (!folderName || folderName.trim().length === 0) {
      return {
        status: 400,
        payload: { message: 'Folder name is required' }
      };
    }

    // Sanitize folder name (remove invalid characters)
    const sanitizedName = folderName.trim().replace(/[<>:"/\\|?*]/g, '_');
    
    // Build folder path
    const folderPath = parentFolderPath === '/' 
      ? `/${sanitizedName}` 
      : `${parentFolderPath}${parentFolderPath.endsWith('/') ? '' : '/'}${sanitizedName}`;
    
    console.log('🔍 Built folder path:', folderPath);

    // Check if folder already exists at this path
    const existingFolder = await DocumentModel.findOne({
      organizationId,
      folderPath,
      isFolder: true
    });

    if (existingFolder) {
      return {
        status: 409,
        payload: { message: 'A folder with this name already exists in this location' }
      };
    }

    // Find parent folder to get its ID
    let parentFolderId: mongoose.Types.ObjectId | null = null;
    if (parentFolderPath !== '/') {
      const parentFolder = await DocumentModel.findOne({
        organizationId,
        folderPath: parentFolderPath,
        isFolder: true
      });
      parentFolderId = parentFolder?._id as mongoose.Types.ObjectId || null;
    }

    // Create the folder
    const folder = new DocumentModel({
      organizationId,
      createdBy: userId,
      title: sanitizedName,
      content: '', // Empty content for folders
      documentType: 'other',
      folderPath,
      parentFolderId,
      isFolder: true,
      folderName: sanitizedName,
      childrenCount: 0,
      lastModified: new Date()
    });

    const savedFolder = await folder.save();
    console.log('🔍 Saved folder:', { 
      id: savedFolder._id, 
      title: savedFolder.title, 
      folderPath: savedFolder.folderPath,
      folderName: savedFolder.folderName 
    });

    // Update parent folder's children count
    if (parentFolderId) {
      await DocumentModel.updateOne(
        { _id: parentFolderId },
        { 
          $inc: { childrenCount: 1 },
          lastModified: new Date()
        }
      );
    }

    return {
      status: 201,
      payload: savedFolder
    };
  } catch (error) {
    console.error('Error creating folder:', error);
    return {
      status: 500,
      payload: { message: 'Internal server error' }
    };
  }
}

/**
 * Get folder contents by path and parentFolderId
 */
export async function getFolderContents(folderPath: string = '/', parentFolderId: string | null = null): Promise<IDocument[]> {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();

    if (!organizationId) {
      throw new Error('User context not available');
    }

    console.log('🔍 getFolderContents called with folderPath:', folderPath, 'parentFolderId:', parentFolderId);

    const query: any = {
      organizationId
    };

    if (parentFolderId && parentFolderId !== 'null' && parentFolderId !== null) {
      query.parentFolderId = new mongoose.Types.ObjectId(parentFolderId);
    } else {
      query.parentFolderId = null; // Root folder items
    }

    console.log('🔍 Query:', JSON.stringify(query, null, 2));

    const items = await DocumentModel.find(query)
      .populate('createdBy', 'firstName lastName email')
      .populate('customerId', 'name')
      .sort({ isFolder: -1, title: 1 })
      .lean();

    console.log('🔍 Found items:', items.length);
    items.forEach(item => {
      console.log(`   - ${item.isFolder ? '📁' : '📄'} ${item.title} (${item.folderPath})`);
    });

    return items as IDocument[];
  } catch (error) {
    console.error('Error getting folder contents:', error);
    throw error;
  }
}

/**
 * Get complete folder tree structure
 */
export async function getFolderTree(): Promise<IDocument[]> {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();

    if (!organizationId) {
      throw new Error('User context not available');
    }

    // Get all folders only
    const folders = await DocumentModel.find({
      organizationId,
      isFolder: true
    })
    .select('_id title folderName folderPath parentFolderId childrenCount lastModified createdAt')
    .sort({ folderPath: 1 })
    .lean();

    return folders as IDocument[];
  } catch (error) {
    console.error('Error getting folder tree:', error);
    throw error;
  }
}

/**
 * Rename a folder
 */
export async function renameFolder(folderId: string, newName: string): Promise<ApiResponse<IDocument>> {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();

    if (!organizationId) {
      return {
        status: 401,
        payload: { message: 'User context not available' }
      };
    }

    // Validate new name
    if (!newName || newName.trim().length === 0) {
      return {
        status: 400,
        payload: { message: 'Folder name is required' }
      };
    }

    const sanitizedName = newName.trim().replace(/[<>:"/\\|?*]/g, '_');

    // Find the folder
    const folder = await DocumentModel.findOne({
      _id: folderId,
      organizationId,
      isFolder: true
    });

    if (!folder) {
      return {
        status: 404,
        payload: { message: 'Folder not found' }
      };
    }

    // Build new folder path
    const parentPath = folder.folderPath.substring(0, folder.folderPath.lastIndexOf('/')) || '/';
    const newFolderPath = parentPath === '/' 
      ? `/${sanitizedName}` 
      : `${parentPath}/${sanitizedName}`;

    // Check if a folder with this name already exists in the same parent
    const existingFolder = await DocumentModel.findOne({
      organizationId,
      folderPath: newFolderPath,
      isFolder: true,
      _id: { $ne: folderId }
    });

    if (existingFolder) {
      return {
        status: 409,
        payload: { message: 'A folder with this name already exists in this location' }
      };
    }

    // Update the folder
    const updatedFolder = await DocumentModel.findByIdAndUpdate(
      folderId,
      {
        title: sanitizedName,
        folderName: sanitizedName,
        folderPath: newFolderPath,
        lastModified: new Date()
      },
      { new: true }
    );

    // Update all child items' paths
    const oldPath = folder.folderPath;
    const newPath = newFolderPath;

    if (oldPath !== newPath) {
      // Update all documents and subfolders in this folder
      await DocumentModel.updateMany(
        {
          organizationId,
          folderPath: { $regex: `^${oldPath}/` }
        },
        [
          {
            $set: {
              folderPath: {
                $replaceAll: {
                  input: '$folderPath',
                  find: oldPath,
                  replacement: newPath
                }
              }
            }
          }
        ]
      );

      // Update parent folder reference for direct children
      await DocumentModel.updateMany(
        {
          organizationId,
          parentFolderId: folderId
        },
        {
          lastModified: new Date()
        }
      );
    }

    return {
      status: 200,
      payload: updatedFolder!
    };
  } catch (error) {
    console.error('Error renaming folder:', error);
    return {
      status: 500,
      payload: { message: 'Internal server error' }
    };
  }
}

/**
 * Delete a folder
 */
export async function deleteFolder(folderId: string): Promise<ApiResponse<{ message: string }>> {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();

    if (!organizationId) {
      return {
        status: 401,
        payload: { message: 'User context not available' }
      };
    }

    // Find the folder
    const folder = await DocumentModel.findOne({
      _id: folderId,
      organizationId,
      isFolder: true
    });

    if (!folder) {
      return {
        status: 404,
        payload: { message: 'Folder not found' }
      };
    }

    // Check if folder has any contents
    const hasContents = await DocumentModel.findOne({
      organizationId,
      folderPath: { $regex: `^${folder.folderPath}/` }
    });

    if (hasContents) {
      return {
        status: 400,
        payload: { message: 'Cannot delete folder that contains documents or subfolders' }
      };
    }

    // Get parent folder ID for updating children count
    const parentFolderId = folder.parentFolderId;

    // Delete the folder
    await DocumentModel.findByIdAndDelete(folderId);

    // Update parent folder's children count
    if (parentFolderId) {
      await DocumentModel.updateOne(
        { _id: parentFolderId },
        { 
          $inc: { childrenCount: -1 },
          lastModified: new Date()
        }
      );
    }

    return {
      status: 200,
      payload: { message: 'Folder deleted successfully' }
    };
  } catch (error) {
    console.error('Error deleting folder:', error);
    return {
      status: 500,
      payload: { message: 'Internal server error' }
    };
  }
}

/**
 * Move a document or folder to a new location
 */
export async function moveItem(itemId: string, newFolderPath: string): Promise<ApiResponse<IDocument>> {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();

    if (!organizationId) {
      return {
        status: 401,
        payload: { message: 'User context not available' }
      };
    }

    // Find the item to move
    const item = await DocumentModel.findOne({
      _id: itemId,
      organizationId
    });

    if (!item) {
      return {
        status: 404,
        payload: { message: 'Item not found' }
      };
    }

    // Validate destination folder exists (if not root)
    if (newFolderPath !== '/') {
      const destinationFolder = await DocumentModel.findOne({
        organizationId,
        folderPath: newFolderPath,
        isFolder: true
      });

      if (!destinationFolder) {
        return {
          status: 404,
          payload: { message: 'Destination folder not found' }
        };
      }
    }

    // Build new path
    const itemName = item.isFolder ? item.folderName : item.title;
    const newItemPath = newFolderPath === '/' 
      ? `/${itemName}` 
      : `${newFolderPath}/${itemName}`;

    // Check if item with same name already exists in destination
    const existingItem = await DocumentModel.findOne({
      organizationId,
      folderPath: newItemPath,
      _id: { $ne: itemId }
    });

    if (existingItem) {
      return {
        status: 409,
        payload: { message: 'An item with this name already exists in the destination folder' }
      };
    }

    const oldPath = item.folderPath;
    const oldParentId = item.parentFolderId;

    // Find new parent folder ID
    let newParentId: mongoose.Types.ObjectId | null = null;
    if (newFolderPath !== '/') {
      const newParent = await DocumentModel.findOne({
        organizationId,
        folderPath: newFolderPath,
        isFolder: true
      });
      newParentId = newParent?._id as mongoose.Types.ObjectId || null;
    }

    // Update the item
    const updatedItem = await DocumentModel.findByIdAndUpdate(
      itemId,
      {
        folderPath: newItemPath,
        parentFolderId: newParentId,
        lastModified: new Date()
      },
      { new: true }
    );

    // Update all child items' paths if this is a folder
    if (item.isFolder && oldPath !== newItemPath) {
      await DocumentModel.updateMany(
        {
          organizationId,
          folderPath: { $regex: `^${oldPath}/` }
        },
        [
          {
            $set: {
              folderPath: {
                $replaceAll: {
                  input: '$folderPath',
                  find: oldPath,
                  replacement: newItemPath
                }
              }
            }
          }
        ]
      );
    }

    // Update children counts for old and new parent folders
    if (oldParentId && oldParentId !== newParentId) {
      await DocumentModel.updateOne(
        { _id: oldParentId },
        { 
          $inc: { childrenCount: -1 },
          lastModified: new Date()
        }
      );
    }

    if (newParentId && newParentId !== oldParentId) {
      await DocumentModel.updateOne(
        { _id: newParentId },
        { 
          $inc: { childrenCount: 1 },
          lastModified: new Date()
        }
      );
    }

    return {
      status: 200,
      payload: updatedItem!
    };
  } catch (error) {
    console.error('Error moving item:', error);
    return {
      status: 500,
      payload: { message: 'Internal server error' }
    };
  }
}

/**
 * Fix malformed folder paths (utility function)
 */
export async function fixMalformedFolderPaths(): Promise<ApiResponse<{ fixed: number; message: string }>> {
  try {
    const organizationId = UserContextManager.getCurrentOrganizationId();

    if (!organizationId) {
      return {
        status: 401,
        payload: { message: 'User context not available' }
      };
    }

    // Find folders with malformed paths (like "/AWS/AWS")
    const malformedFolders = await DocumentModel.find({
      organizationId,
      isFolder: true,
      folderPath: { $regex: /^\/[^\/]+\/[^\/]+$/ } // Matches "/folder/folder" pattern
    });

    let fixedCount = 0;
    
    for (const folder of malformedFolders) {
      const currentPath = folder.folderPath;
      const folderName = folder.folderName || folder.title;
      
      // Fix the path by removing the duplicate folder name
      const correctPath = `/${folderName}`;
      
      // Check if a folder with the correct path already exists
      const existingFolder = await DocumentModel.findOne({
        organizationId,
        folderPath: correctPath,
        isFolder: true,
        _id: { $ne: folder._id }
      });

      if (!existingFolder) {
        // Update the folder path
        await DocumentModel.updateOne(
          { _id: folder._id },
          { 
            folderPath: correctPath,
            lastModified: new Date()
          }
        );
        fixedCount++;
        console.log(`Fixed folder path: ${currentPath} -> ${correctPath}`);
      } else {
        console.log(`Cannot fix ${currentPath}: folder with path ${correctPath} already exists`);
      }
    }

    return {
      status: 200,
      payload: { 
        fixed: fixedCount, 
        message: `Fixed ${fixedCount} malformed folder paths` 
      }
    };
  } catch (error) {
    console.error('Error fixing malformed folder paths:', error);
    return {
      status: 500,
      payload: { message: 'Internal server error' }
    };
  }
}
