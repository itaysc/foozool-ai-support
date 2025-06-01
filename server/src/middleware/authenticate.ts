import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { IUser } from '@common/types';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      permissions: string[];
    }
  }
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, async (err, { user }, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }
    req.user = user;
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
    req.user = user;
    next();
  })(req, res, next);
};
