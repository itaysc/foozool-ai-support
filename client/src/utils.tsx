/* eslint-disable no-useless-escape */
import { jwtDecode } from 'jwt-decode';
import User from '@/types/user';
import { ePaymentMethod } from "@common/types/paymentMethod";
import { ePaymentTerms } from "@common/types/paymentTerms";

interface DecodeTokenRes {
  aud: string;
  exp: number;
  iat: number;
  iss: string;
  user: User;
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

export const paymentMethodToLabel = (paymentMethod: ePaymentMethod) => {
    // snake case to label
    return paymentMethod.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

export const paymentTermToLabel = (paymentTerm: ePaymentTerms) => {
    // snake case to label
    return paymentTerm.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}