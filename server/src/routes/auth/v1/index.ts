import express, { Request, Response } from 'express';
import moment from 'moment-timezone';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../../../config';
import { validateRequest } from '../../../middleware/validateRequest';
import { getToken } from './validations';
import { isTokenAboutToExpire, signJwt, setJwtCookie } from './utils';
import { getUserByEmail } from '../../../services/users/v1';
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
    // Generate access token (short-lived)
    const accessToken = signJwt({ user: userRes.payload }, { expiresIn: '15m' });
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
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 15 * 60 * 1000, // 15 minutes
        path: '/'
      }
    });
    
    setJwtCookie({ 
      res, 
      data: refreshToken, 
      name: 'refreshToken', 
      options: { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
      } 
    });

    console.log('Tokens generated successfully for user:', email);
    res.json({ 
      status: 'success',
      user: {
        id: userRes.payload._id,
        email: userRes.payload.email,
        firstName: userRes.payload.firstName,
        lastName: userRes.payload.lastName
      }
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
    jwt.verify(refreshToken, config.JWT_SECRET, (err, data) => {
      if (err) {
        return res.status(403).json({ 
          success: false, 
          message: 'Invalid refresh token' 
        });
      }
      // Only minimal info in refresh token
      const { user } = data as any;
      // Optionally: fetch user from DB to check if still valid
      const newAccessToken = signJwt({ user }, { expiresIn: '15m' });
      
      // Set new access token as secure httpOnly cookie
      setJwtCookie({ 
        res, 
        data: newAccessToken, 
        name: 'accessToken',
        options: {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
          maxAge: 15 * 60 * 1000, // 15 minutes
          path: '/'
        }
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
    
    jwt.verify(accessToken, config.JWT_SECRET, (err, data) => {
      if (err) {
        res.json({ isAuthorized: false });
        return;
      }
      res.json({ 
        isAuthorized: true, 
        user: (data as any).user 
      });
      return;
    });
  } catch (err) {
    res.json({ isAuthorized: false });
    return;
  }
});

router.get('/signout', (req: Request, res: Response) => {
  // Clear both JWT cookies
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.status(200).send({ message: 'ok' });
});


export default router;