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
    const hasPermissions = check({
      userPermissions: req.permissions,
      some,
      all,
    });
    if (!hasPermissions) {
      return res.status(400).send('You don\'t have enough permissions to view this resource');
    }
    return next();
  };
};
export const hasPermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const hasPermissions = check({
      userPermissions: req.permissions,
      all: [permission],
    });
    if (!hasPermissions) {
      return res.status(400).send('You don\'t have enough permissions to view this resource');
    }
    return next();
  };
};