import { Strategy as JwtStrategy, StrategyOptions } from 'passport-jwt';
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

// Initialize JWT strategies lazily to ensure environment variables are loaded
function initializeJWTStrategies() {
  console.log('Initializing JWT strategies...');
  console.log('JWT_SECRET from config:', config.JWT_SECRET ? '***SET***' : 'undefined');
  
  if (!config.JWT_SECRET) {
    console.error('JWT_SECRET is not set! Cannot initialize JWT strategies.');
    return;
  }

  // Strategy that checks for jwt in the accessToken cookie
  const cookieExtractor = (req: Request) => {
    return req.cookies['accessToken'] || null;
  };

  const opts: StrategyOptions = {
    //jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    jwtFromRequest: cookieExtractor,
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
  
  console.log('JWT strategies initialized successfully');
}

export { passport, initializeJWTStrategies };