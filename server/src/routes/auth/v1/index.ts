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

    console.log('Password valid, generating token');
    const token = signJwt({ user: userRes.payload});
    setJwtCookie({ res, data: token });
    
    console.log('Token generated successfully for user:', email);
    res.json({ 
      status: 'success',
      token,
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
  const oldToken = req.cookies[config.JWT_COOKIE_NAME || 'foozool-jwt'];
  if (!oldToken) {
    res.status(400).json({ message: 'Old token from cookie is required' });
    return;
  }
  try {
    // Verify old token
    jwt.verify(oldToken, config.JWT_SECRET, (err, data) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid token' });
      }

      if (!isTokenAboutToExpire(oldToken)) {
        return res.json({ refreshToken: oldToken });
      }
      const { user } = data;
      const refreshToken = signJwt({ user });
      setJwtCookie({ res, data: refreshToken });
      return res.json({ refreshToken });
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
    return;
  }
});

router.get('/isAuthorized', async (req: Request, res: Response): Promise<void> => {
  try {
    // assemble the full jwt from the payload + other parts that are stored in a cookie
    const token = req.cookies[config.JWT_COOKIE_NAME || 'foozool-jwt'];
    jwt.verify(token, config.JWT_SECRET, (err, data) => {
      if (err) {
        return res.json({ isAuthorized: false });
      }
      return res.json({ isAuthorized: true });
    });
  } catch (err) {
    res.json({ isAuthorized: false });
    return;
  }
});

router.get('/signout', (req: Request, res: Response) => {
  res.clearCookie(config.JWT_COOKIE_NAME || 'foozool-jwt');
  res.status(200).send({ message: 'ok' });
});


export default router;