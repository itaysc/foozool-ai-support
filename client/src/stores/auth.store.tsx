import { observable, runInAction, action, makeObservable, toJS } from 'mobx';
import authService, { AuthRequestPayload } from '@/services/auth-service';
import { setStoredToken, getStoredToken } from '@/services/local-storage';
import { decodeToken, validateAndDecodeToken } from '@/utils';
import { IUser } from '@/types/user';
import config from '@/config';

const { useIntuitLogin } = config;
// import { roles } from '../utils/permissions';
class AuthStore {
  user: IUser | undefined;
  token: string | undefined;
  constructor() {
    this.user = undefined;
    this.token = undefined;
    makeObservable(this, {
      user: observable,
      token: observable,
      login: action,
      checkAuthorization: action,
    });
  }
  signOut = async() => {
    try {
      await authService.signout();
    } catch (error) {
      console.warn('⚠️ Error during signout API call:', error);
    } finally {
      this.clearAuthState();
    }
  }

  getUser = () => {
    return toJS(this.user);
  }
  login = async (payload: AuthRequestPayload) => {
    try {
      const resp = await authService.login(payload);
      if (resp.status === 200 && resp.token) {
        console.log('✅ Login successful, storing token');
        setStoredToken(resp.token);
        const decodeRes = decodeToken(resp.token);
        const intuitAuthUri = resp.intuitAuthUri;
        runInAction(() => {
          this.token = resp.token;
          this.user = decodeRes?.user;
        });
        console.log('✅ Token stored in auth store:', !!this.token);
        console.log('✅ Token stored in localStorage:', !!getStoredToken());
        if (useIntuitLogin) {
          window.location.href = intuitAuthUri;
          return { redirecting: true };
        }
        return {
          redirecting: false,
          status: resp.status,
          message: 'Authorized',
          isAuthorized: true,
          token: this.token,
        };
      }
      if (resp.status === 401) {
        return {
          status: resp.status,
          message: 'Unauthorized',
          isAuthorized: false,
        };
      }
    } catch (err) {
      console.log(err);
      return {
        status: 401,
        message: 'Unauthorized',
        isAuthorized: false,
      };
    }
  }

  checkAuthorization = async () => {
    const { isAuthorized, user, token } = await authService.checkAuthorization();
    if (isAuthorized) {
      runInAction(() => {
        this.user = user;
        this.token = token;
      })
    }
    return { isAuthorized };
  }



  // Initialize auth state from stored token
  initializeAuth = async () => {
    try {
      const storedToken = getStoredToken();
      console.log('🔍 Initializing auth with stored token:', !!storedToken);
      
      if (!storedToken) {
        console.log('ℹ️ No stored token found');
        return false;
      }

      // Validate token structure and expiration
      const validation = validateAndDecodeToken(storedToken);
      if (!validation || !validation.isValid) {
        console.log('❌ Stored token is invalid or expired, clearing...');
        this.clearAuthState();
        return false;
      }

      // Token is valid, set auth state
      const decodedToken = decodeToken(storedToken);
      if (decodedToken?.user) {
        runInAction(() => {
          this.token = storedToken;
          this.user = decodedToken.user;
        });
        console.log('✅ Auth state initialized from valid stored token');
        
        // Optionally verify with server (silent check)
        try {
          await this.checkAuthorization();
        } catch (error) {
          console.warn('⚠️ Server verification failed, but using local token:', error);
        }
        
        return true;
      } else {
        console.log('❌ Stored token missing user data, clearing...');
        this.clearAuthState();
        return false;
      }
    } catch (error) {
      console.error('❌ Error initializing auth:', error);
      this.clearAuthState();
      return false;
    }
  }

  // Clear auth state
  clearAuthState = () => {
    runInAction(() => {
      this.token = undefined;
      this.user = undefined;
    });
    setStoredToken('');
    console.log('🧹 Auth state cleared');
  }

  // haveRole = (validRoles) => {
  //   return validRoles.some((r) => this.user.roles.includes(r));
  // }
  // haveAllScopes = (scopes) => {
  //   return scopes.any((s) => this.user.scopes.includes(s));
  // }
  // haveAtLeastOneScope = (scopes) => {
  //   return scopes.some((s) => this.user.scopes.includes(s));
  // }
}

const store = new AuthStore();

export default store;
