import jwt from 'jsonwebtoken';
import express, { Request, Response } from 'express';
import config from '../../../config';

export function isTokenAboutToExpire (token) {
  const decoded = jwt.decode(token, { complete: true });
  const expirationTime = decoded.payload.exp * 1000;
  const currentTime = Date.now();
  
  // Check if the token will expire in the next 5 minutes (300,000 milliseconds)
  return (expirationTime - currentTime) < 300000;
};

export function signJwt({ user }) {
  return jwt.sign({ user, iss: 'foozool', aud: 'foozool-app' }, config.JWT_SECRET, { expiresIn: config.JWT_EXP_TIME });;
}
export function setJwtCookie({ res, data }: { res: Response, data: string }) : void {
  res.cookie(config.JWT_COOKIE_NAME || 'foozool-jwt', data, {
    httpOnly: false,
    // secure: true,
    // sameSite: 'Strict',
    path: '/',
  });
}
