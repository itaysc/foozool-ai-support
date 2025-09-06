import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { IToken, IUser } from '../types';
import { TokenModel, UserModel } from '../schemas';
import { RoleModel } from '../schemas/role.schema';
import { UserContextManager } from '../context/userContext';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      permissions: string[];
      roleNames: string[];
      token?: IToken;
    }
  }
}

async function deriveRolesAndPermissions(user: any): Promise<{ roleNames: string[]; effectivePermissions: string[] }> {
  const roles = Array.isArray(user.roles) && user.roles.length
    ? await RoleModel.find({ _id: { $in: user.roles as any } }).lean()
    : [];
  const roleNames = roles.map((r: any) => r.name);
  const rolePermissions = roles.flatMap((r: any) => r.permissions || []);
  const userPermissions = Array.isArray(user.permissions) ? user.permissions : [];
  const effectivePermissions = Array.from(new Set([ ...userPermissions, ...rolePermissions ]));
  return { roleNames, effectivePermissions };
}

export const authenticateWebhook = async (req: Request, res: Response, next: NextFunction) : Promise<void> => {
  const orgId = req.headers['x-organization-id'];
  const tokenType = req.headers['x-token-type'];
  const userId = req.headers['x-user-id'];
  let bearerToken = req.headers['authorization'];
  if (!orgId || !bearerToken || !userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  bearerToken = bearerToken.replace('Bearer ', '');
  const tokens = await TokenModel.find({ organizationId: orgId }).lean();
  const validToken = tokens.find((token) => token.token === bearerToken && token.type === tokenType);
  if (!validToken) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const user = await UserModel.findById(userId).lean();
  if (!user || user.organization.toString() !== orgId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  req.token = validToken;
  req.user = user as any;
  const { roleNames, effectivePermissions } = await deriveRolesAndPermissions(user);
  req.permissions = effectivePermissions;
  req.roleNames = roleNames;
  
  // Set user context
  UserContextManager.setContext(req);
  
  next();
};

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, async (err, { user }, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }
    req.user = user as any;
    const { roleNames, effectivePermissions } = await deriveRolesAndPermissions(user);
    req.permissions = effectivePermissions;
    req.roleNames = roleNames;
    
    // Set user context
    UserContextManager.setContext(req);
    
    next();
  })(req, res, next);
};

export const authenticateSplitJWT = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('split-jwt', { session: false }, async (err, { user }, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    req.user = user as any;
    const { roleNames, effectivePermissions } = await deriveRolesAndPermissions(user);
    req.permissions = effectivePermissions;
    req.roleNames = roleNames;
    
    // Set user context
    UserContextManager.setContext(req);
    
    next();
  })(req, res, next);
};
