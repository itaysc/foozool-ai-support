import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { IToken, IUser } from 'src/types';
import { TokenModel, UserModel } from 'src/schemas';
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      permissions: string[];
      token?: IToken;
    }
  }
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
  req.user = user;
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
