import { Request, Response, NextFunction } from 'express';

const check = ({ userPermissions, some, all }: {userPermissions: string[], some?: string[], all?: string[]}) => {
  let hasPermissions = true;
  if (some) {
    hasPermissions = some.some((permission) => userPermissions.includes(permission));
  }
  if (hasPermissions && all) {
    hasPermissions = all.every((permission) => userPermissions.includes(permission));
  }
  return hasPermissions;
}

// This middleware can be applied only after applying the authenticateJWT middleware that sets the permissions on the request
export const permissions = ({ some, all }: { some?: string[], all?: string[] }) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Admin bypass: admins are always allowed
    const roleNames = (req as any).roleNames || [];
    if (Array.isArray(roleNames) && roleNames.includes('admin')) {
      return next();
    }
    const hasPermissions = check({
      userPermissions: req.permissions,
      some,
      all,
    });
    if (!hasPermissions) {
      return res.status(403).send('Forbidden');
    }
    return next();
  };
};
export const hasPermissionHelper = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Admin bypass: admins are always allowed
    const roleNames = (req as any).roleNames || [];
    if (Array.isArray(roleNames) && roleNames.includes('admin')) {
      return next();
    }
    const hasPermissions = check({
      userPermissions: req.permissions,
      all: [permission],
    });
    if (!hasPermissions) {
      return res.status(403).send('Forbidden');
    }
    return next();
  };
};

export const hasPermission = (permission: string) => hasPermissionHelper(permission);
export const hasRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const roleNames = (req as any).roleNames || [];
    if (Array.isArray(roleNames) && roleNames.includes('admin')) {
      return next();
    }
    const ok = Array.isArray(roleNames) && roleNames.includes(role);
    if (!ok) {
      return res.status(403).send('Forbidden');
    }
    return next();
  };
};
