import { Request } from 'express';
import { IUser } from '../types/user';

// AsyncLocalStorage for storing user context
import { AsyncLocalStorage } from 'async_hooks';

interface UserContext {
  user: IUser;
  userId: string;
  organizationId: string;
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

    const context: UserContext = {
      user: req.user,
      userId: req.user._id.toString(),
      organizationId: req.user.organization.toString()
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