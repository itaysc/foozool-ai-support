import { observable, runInAction, action, makeObservable, toJS } from 'mobx';
import authService, { AuthRequestPayload } from '@/services/auth-service';
import { decodeToken } from '@/utils';
import { clearAuthCookies } from '@/utils/cookies';
import { IUser } from '@/types/user';
import config from '@/config';

const { useIntuitLogin } = config;
// import { roles } from '../utils/permissions';
class AuthStore {
  user: IUser | undefined;
  constructor() {
    this.user = undefined;
    makeObservable(this, {
      user: observable,
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
      if (resp.status === 200) {
        const intuitAuthUri = resp.intuitAuthUri;
        
        // Get user info from the response
        runInAction(() => {
          this.user = resp.user;
        });
        
        if (useIntuitLogin && intuitAuthUri) {
          window.location.href = intuitAuthUri;
          return { redirecting: true };
        }
        return {
          redirecting: false,
          status: resp.status,
          message: 'Authorized',
          isAuthorized: true,
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
    const { isAuthorized, user } = await authService.checkAuthorization();
    if (isAuthorized) {
      runInAction(() => {
        this.user = user;
      })
    }
    return { isAuthorized };
  }



  // Initialize auth state from cookies
  initializeAuth = async () => {
    try {
      // Check authorization with server (cookies sent automatically)
      const { isAuthorized, user } = await authService.checkAuthorization();
      
      if (isAuthorized && user) {
        runInAction(() => {
          this.user = user;
        });
        return true;
      } else {
        this.clearAuthState();
        return false;
      }
    } catch (error) {
      this.clearAuthState();
      return false;
    }
  }

  // Clear auth state
  clearAuthState = () => {
    runInAction(() => {
      this.user = undefined;
    });
    clearAuthCookies();
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
