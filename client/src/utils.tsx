/* eslint-disable no-useless-escape */
import { jwtDecode } from 'jwt-decode';
import { IUser } from '@/types/user';

// Payment method types
export type ePaymentMethod = 'credit_card' | 'bank_transfer' | 'paypal' | 'cash' | 'check';

// Payment terms types
export type ePaymentTerms = 'net_30' | 'net_60' | 'net_90' | 'due_on_receipt' | 'net_15';

interface DecodeTokenRes {
  aud: string;
  exp: number;
  iat: number;
  iss: string;
  user: IUser;
}

export const decodeToken = (token: string) : DecodeTokenRes | null => {
  try {
    return jwtDecode(token);
  } catch (error) {
    console.log(error);
    return null;
  }
}

export const validateAndDecodeToken = (token: string) => {
  try {
    const decoded = jwtDecode(token);

    // Check expiration
    const currentTime = Date.now() / 1000;
    if (decoded.exp && decoded.exp < currentTime) {
      console.warn('Token has expired');
      return { isValid: false };
    }

    // Check issuer and audience
    const expectedIssuer = 'foozool';
    const expectedAudience = 'foozool-app';
    if (decoded.iss !== expectedIssuer || decoded.aud !== expectedAudience) {
      console.warn('Invalid token issuer or audience');
      return { isValid: false };
    }

    return {
      isValid: true,
      decoded,
    }
  } catch (error) {
    console.error('Invalid token', error);
    return false;
  }
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp ? decoded.exp < currentTime : true;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // Consider invalid tokens as expired
  }
};

export const getTokenExpirationTime = (token: string): number | null => {
  try {
    const decoded = jwtDecode(token);
    return decoded.exp || null;
  } catch (error) {
    console.error('Error getting token expiration:', error);
    return null;
  }
};

export const paymentMethodToLabel = (paymentMethod: ePaymentMethod) => {
    // snake case to label
    return paymentMethod.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

export const paymentTermToLabel = (paymentTerm: ePaymentTerms) => {
    // snake case to label
    return paymentTerm.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}