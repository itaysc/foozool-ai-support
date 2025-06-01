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
  const { email, password } = req.body;
  const userRes = await getUserByEmail({ email });
  if (!userRes.payload) {
    res.status(400).send('User not found');
    return;
  }
  const isPasswordValid = await bcrypt.compare(password, userRes.payload.password);
  if (!isPasswordValid) {
    res.status(401).send('Invalid password');
    return;
  }
  const token = signJwt({ user: userRes.payload});
  setJwtCookie({ res, data: token });
  res.json({ token });

  // const parts = token.split('.');
  // const headerAndSignature = `${parts[0]}.${parts[2]}`;
  // setJwtCookie({ res, data: headerAndSignature });
  // res.json({ token, payload: parts[1] });
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