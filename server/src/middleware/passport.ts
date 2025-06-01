import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import passport from 'passport';
import { Request } from 'express';
import config from '../config';
import { UserModel } from '../schemas/user.schema';

async function check(jwt_payload, done) {
  const user = await UserModel.findOne({email: jwt_payload.user.email }).lean();
  if (user) {
    return done(null, { user });
  } else {
    return done(null, false);
  }
}

// simple strategy that checks for jwt in the Authorization header
const opts: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.JWT_SECRET,
};

passport.use(
  'jwt',
  new JwtStrategy(opts, async (jwt_payload, done) => {
    return check(jwt_payload, done);
  })
);

/**
 * custom strategy that will assemble the jwt from both the Authorization header and the jwt cookie
 * the jwt payload will be in the header and the jwt header + signature will be in the cookie
 */

const customExtractor = (req: Request) => {
  try {
    const jwtPayload = req.headers.authorization;
    const jwtPayloadPart = jwtPayload && jwtPayload.split(' ')[1]; // Assuming "Bearer <token>"
    const jwtCookiePart = req.cookies[config.JWT_COOKIE_NAME || 'jwt'];
    const parts = jwtCookiePart.split('.');
    const jwtHeader = parts[0];
    const signature = parts[1];
    if (!jwtPayloadPart || !jwtHeader || !signature) {
      return null;
    }
    return `${jwtHeader}.${jwtPayloadPart}.${signature}`;
  } catch (err) {
    return null;
  }
};
const customOpts = {
  jwtFromRequest: customExtractor,
  secretOrKey: config.JWT_SECRET,
};
passport.use(
  'split-jwt',
  new JwtStrategy(customOpts, async (jwt_payload, done) => {
    return check(jwt_payload, done);
  })
);

export { passport };