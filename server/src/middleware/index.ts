import passport from 'passport';
import { authenticateJWT } from './authenticate';
import { validateRequest, validateRequestParams } from './validateRequest';
import { permissions, hasPermission  }  from './permissions';
export default {
  authenticateJWT,
  validateRequest,
  validateRequestParams,
  passport,
  permissions,
  hasPermission,
};