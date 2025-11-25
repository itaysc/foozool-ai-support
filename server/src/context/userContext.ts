import { Request } from 'express';
import { IUser } from '../types/user';
import mongoose from 'mongoose';

// AsyncLocalStorage for storing user context
import { AsyncLocalStorage } from 'async_hooks';

interface UserContext {
  user: IUser;
  userId: string;
  organizationId: string;
  useCache?: boolean;
  permissions?: string[];
  roles?: string[]; // role names
}

const userContextStorage = new AsyncLocalStorage<UserContext>();

export class UserContextManager {
  /**
   * Set user context for the current request
   */
  static setContext(req: Request): void {
    if (!req.user) {
      throw new Error('User not found in request');
    }

    // Get useCache from query parameters, default to true
    // Set to false only if user explicitly sends useCache=false
    const useCache = req.query.useCache !== 'false';

    const context: UserContext = {
      user: req.user,
      userId: req.user._id.toString(),
      organizationId: req.user.organization.toString(),
      useCache,
      permissions: (req as any).permissions || [],
      roles: (req as any).roleNames || [],
    };

    userContextStorage.enterWith(context);
  }

  /**
   * Get current user context
   */
  static getContext(): UserContext | undefined {
    return userContextStorage.getStore();
  }

  /**
   * Get current user
   */
  static getCurrentUser(): IUser | undefined {
    const context = this.getContext();
    return context?.user;
  }

  /**
   * Get current user ID
   */
  static getCurrentUserId(): string | undefined {
    const context = this.getContext();
    return context?.userId;
  }

  /**
   * Get current organization ID
   */
  static getCurrentOrganizationId(): string | undefined {
    const context = this.getContext();
    return context?.organizationId;
  }

  /**
   * Get current cache preference
   */
  static getUseCache(): boolean {
    const context = this.getContext();
    return context?.useCache ?? true; // Default to true if not set
  }

  /** Get current permissions */
  static getPermissions(): string[] {
    const context = this.getContext();
    return context?.permissions ?? [];
  }

  /** Get current role names */
  static getRoleNames(): string[] {
    const context = this.getContext();
    return context?.roles ?? [];
  }

  /**
   * Set cache preference for current context
   */
  static setUseCache(useCache: boolean): void {
    const context = this.getContext();
    if (context) {
      context.useCache = useCache;
    }
  }

  /**
   * Check if user context exists
   */
  static hasContext(): boolean {
    return userContextStorage.getStore() !== undefined;
  }

  /**
   * Clear user context
   */
  static clearContext(): void {
    userContextStorage.disable();
  }

  /**
   * Set service context for system/service operations that don't have a user
   * Creates a minimal user object for the context
   * @param organizationId - The organization ID
   * @param userId - Optional user ID (will create a dummy one if not provided)
   */
  static setServiceContext(organizationId: string, userId?: string): void {
    const serviceUserId = userId || new mongoose.Types.ObjectId().toString();
    
    // Create a minimal user object for service context
    const serviceUser: IUser = {
      _id: new mongoose.Types.ObjectId(serviceUserId),
      firstName: 'Service',
      lastName: 'User',
      fullName: 'Service User',
      avatarImage: '',
      llmModel: '',
      email: { type: '' },
      password: { type: '' },
      registered: { type: false },
      organization: organizationId,
      department: { type: '' },
      roles: [],
      permissions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      comparePassword: async () => false
    };

    const context: UserContext = {
      user: serviceUser,
      userId: serviceUserId,
      organizationId: organizationId,
      useCache: true,
      permissions: [],
      roles: []
    };

    userContextStorage.enterWith(context);
  }
}

/**
 * Middleware to set user context
 */
export const setUserContext = (req: Request, res: any, next: any): void => {
  try {
    UserContextManager.setContext(req);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Decorator or wrapper for functions that need user context
 */
export const withUserContext = <T extends any[], R>(
  fn: (userId: string, organizationId: string, ...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R> => {
    const userId = UserContextManager.getCurrentUserId();
    const organizationId = UserContextManager.getCurrentOrganizationId();
    
    if (!userId || !organizationId) {
      throw new Error('User context not available');
    }
    
    return fn(userId, organizationId, ...args);
  };
}; 