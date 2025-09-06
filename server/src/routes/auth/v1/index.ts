import express, { Request, Response } from 'express';
import moment from 'moment-timezone';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../../../config';
import { validateRequest } from '../../../middleware/validateRequest';
import { getToken } from './validations';
import { isTokenAboutToExpire, signJwt, setJwtCookie } from './utils';
import { getUserByEmail } from '../../../services/users/v1';
import { UserModel } from '../../../schemas/user.schema';
import { RoleModel } from '../../../schemas/role.schema';
const router = express.Router();


/**
 * @swagger
 * /v1/auth/token:
 *   post:
 *     tags:
 *     - Auth
 *     summary: Get API token
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/getToken'
 *     responses:
 *       200:
 *         $ref: '#/definitions/generalResponses/200'
 *       400:
 *         $ref: '#/definitions/postResponses/400'
 *       401:
 *         $ref: '#/definitions/postResponses/401'
 *       500:
 *         $ref: '#/definitions/postResponses/500'
 */
router.post('/token', validateRequest(getToken), async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Token endpoint called with body:', { email: req.body.email, password: req.body.password ? '[REDACTED]' : 'undefined' });
    
    // Check if JWT_SECRET is configured
    if (!config.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      res.status(500).json({ 
        status: 'error',
        message: 'Server configuration error',
        code: 'JWT_SECRET_MISSING'
      });
      return;
    }

    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('Missing email or password in request');
      res.status(400).json({ 
        status: 'error',
        message: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
      return;
    }

    console.log('Attempting to get user by email:', email);
    const userRes = await getUserByEmail({ email });
    
    if (userRes.status === 500) {
      console.error('Database error occurred while fetching user');
      res.status(500).json({ 
        status: 'error',
        message: 'Database connection error',
        code: 'DATABASE_ERROR'
      });
      return;
    }
    
    if (!userRes.payload) {
      console.log('User not found for email:', email);
      res.status(400).json({ 
        status: 'error',
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    console.log('User found, validating password');
    const isPasswordValid = await bcrypt.compare(password, userRes.payload.password);
    
    if (!isPasswordValid) {
      console.log('Invalid password for user:', email);
      res.status(401).json({ 
        status: 'error',
        message: 'Invalid password',
        code: 'INVALID_PASSWORD'
      });
      return;
    }

    console.log('Password valid, generating tokens');
    
    // Fetch the complete user data with populated organization
    const fullUser = await UserModel.findById(userRes.payload._id)
      .populate('organization', 'name signature country details')
      .lean();
    
    if (!fullUser) {
      console.log('Error: Full user data not found after password validation');
      res.status(500).json({ 
        status: 'error',
        message: 'Error retrieving user data',
        code: 'USER_DATA_ERROR'
      });
      return;
    }
    
    // Compute effective permissions and role names
    const roles = Array.isArray(fullUser.roles) && fullUser.roles.length
      ? await RoleModel.find({ _id: { $in: fullUser.roles as any } }).lean()
      : [];
    const roleNames = roles.map((r: any) => r.name);
    const rolePermissions = roles.flatMap((r: any) => r.permissions || []);
    const userPermissions = Array.isArray((fullUser as any).permissions) ? (fullUser as any).permissions : [];
    const effectivePermissions = Array.from(new Set([ ...userPermissions, ...rolePermissions ]));

    // Generate access token (short-lived) with full user data plus computed permissions/roles
    const accessToken = signJwt({ user: { ...fullUser, permissions: effectivePermissions, roleNames } }, { expiresIn: '15m' });
    // Generate refresh token (long-lived, minimal info)
    const refreshToken = signJwt({ user: { id: userRes.payload._id } }, { expiresIn: '7d' });

    // Set secure httpOnly cookies
    setJwtCookie({ 
      res, 
      data: accessToken, 
      name: 'accessToken',
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Changed from 'strict' to 'none' for cross-domain
        maxAge: 15 * 60 * 1000, // 15 minutes
        path: '/',
        // Don't set domain in production to allow cross-domain cookies
        domain: undefined
      }
    });
    
    setJwtCookie({ 
      res, 
      data: refreshToken, 
      name: 'refreshToken', 
      options: { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Changed from 'strict' to 'none' for cross-domain
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
        // Don't set domain in production to allow cross-domain cookies
        domain: undefined
      } 
    });

    console.log('Tokens generated successfully for user:', email);
    console.log('🍪 Cookie settings for production:', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000,
      path: '/',
      domain: undefined
    });
    res.json({ 
      status: 'success',
      accessToken,
      user: { ...fullUser, permissions: effectivePermissions, roleNames }
    });

  } catch (error) {
    console.error('Error in /token endpoint:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

router.post('/refresh-token', async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies['refreshToken'];
  if (!refreshToken) {
    res.status(400).json({ 
      success: false, 
      message: 'Refresh token is required' 
    });
    return;
  }
  try {
    jwt.verify(refreshToken, config.JWT_SECRET, async (err, data) => {
      if (err) {
        return res.status(403).json({ 
          success: false, 
          message: 'Invalid refresh token' 
        });
      }
      // Only minimal info in refresh token
      const { user } = data as any;
      
      // Fetch the full user data from DB to ensure we have the complete user object
      const fullUser = await UserModel.findById(user.id)
        .populate('organization', 'name signature country details')
        .lean();
      if (!fullUser) {
        return res.status(403).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      // Create new access token with the same payload structure as /token route
      const newAccessToken = signJwt({ user: fullUser }, { expiresIn: '15m' });
      
      // Clear the old access token cookie first
      res.clearCookie('accessToken', {
        path: '/',
        // Don't set domain in production to allow cross-domain cookies
        domain: undefined
      });
      
      // Set new access token as secure httpOnly cookie
      setJwtCookie({ 
        res, 
        data: newAccessToken, 
        name: 'accessToken',
        options: {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Changed from 'strict' to 'none' for cross-domain
          maxAge: 15 * 60 * 1000, // 15 minutes
          path: '/',
          // Don't set domain in production to allow cross-domain cookies
          domain: undefined
        }
      });
      
      console.log('🔄 Token refreshed successfully, new access token set as cookie');
      console.log('🍪 Cookie options used:', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 15 * 60 * 1000,
        path: '/',
        domain: process.env.NODE_ENV === 'production' ? undefined : undefined
      });
      res.json({ 
        success: true, 
        message: 'Token refreshed successfully' 
      });
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
    return;
  }
});

router.get('/isAuthorized', async (req: Request, res: Response) => {
  try {
    const accessToken = req.cookies['accessToken'];
    
    if (!accessToken) {
      return res.json({ isAuthorized: false });
    }
    
    jwt.verify(accessToken, config.JWT_SECRET, async (err, data) => {
      if (err) {
        console.log('❌ JWT verification failed:', err.message);
        res.json({ isAuthorized: false });
        return;
      }
      
      try {
        console.log('✅ JWT verified successfully');
        console.log('🔄 JWT payload data:', JSON.stringify(data, null, 2));
        
        // Get the user ID from the JWT payload
        const userId = (data as any).user._id || (data as any).user.id;
        
        if (!userId) {
          console.log('❌ No user ID found in JWT payload');
          res.json({ isAuthorized: false });
          return;
        }
        
        // Fetch the complete user data with populated organization
        console.log('🔄 Fetching user data from database for ID:', userId);
        const fullUser = await UserModel.findById(userId)
          .populate('organization', 'name signature country details')
          .lean();
        
        if (!fullUser) {
          console.log('❌ User not found in database');
          res.json({ isAuthorized: false });
          return;
        }
        
        console.log('✅ User data fetched:', {
          userId: fullUser._id,
          email: fullUser.email,
          organization: fullUser.organization,
          organizationType: typeof fullUser.organization,
          hasOrgId: typeof fullUser.organization === 'object' && (fullUser.organization as any)?._id ? 'yes' : 'no',
          hasOrgName: typeof fullUser.organization === 'object' && (fullUser.organization as any)?.name ? 'yes' : 'no'
        });
        
        res.json({ 
          isAuthorized: true, 
          user: fullUser 
        });
      } catch (populateError) {
        console.error('Error populating user data:', populateError);
        // Fallback to returning the user data from JWT if population fails
        res.json({ 
          isAuthorized: true, 
          user: (data as any).user 
        });
      }
    });
  } catch (err) {
    res.json({ isAuthorized: false });
    return;
  }
});

router.get('/signout', (req: Request, res: Response) => {
  // Clear both JWT cookies with EXACT same options as when they were set
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    domain: undefined
  });
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    domain: undefined
  });
  
  // Also clear any legacy cookies that might exist
  res.clearCookie('foozool-jwt', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    domain: undefined
  });
  
  // Clear the legacy 'jwt' cookie as well
  res.clearCookie('jwt', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    domain: undefined
  });
  
  res.status(200).send({ message: 'ok' });
});


export default router;