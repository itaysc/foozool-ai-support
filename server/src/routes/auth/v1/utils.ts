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

export function signJwt({ user }, options = {}) {
  return jwt.sign({ user, iss: 'foozool', aud: 'foozool-app' }, config.JWT_SECRET, { expiresIn: config.JWT_EXP_TIME, ...options });
}
export function setJwtCookie({ res, data, name = config.JWT_COOKIE_NAME || 'foozool-jwt', options = {} }: { res: Response, data: string, name?: string, options?: any }) : void {
  res.cookie(name, data, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    ...options,
  });
}
