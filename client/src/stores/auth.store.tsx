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
        
        if (useIntuitLogin && intuitAuthUri) {
          window.location.href = intuitAuthUri;
          return { redirecting: true };
        }
        
        // After successful login, get the complete user data from the JWT token
        // This ensures we have all fields including organization
        console.log('🔄 After login, calling checkAuthorization to get complete user data...');
        const { isAuthorized, user } = await this.checkAuthorization();
        console.log('🔄 checkAuthorization result:', { isAuthorized, user });
        if (isAuthorized && user) {
          runInAction(() => {
            this.user = user;
          });
          console.log('✅ User data updated in store:', this.user);
          console.log('✅ Organization data in store:', this.user?.organization);
          console.log('✅ Organization type:', typeof this.user?.organization);
          if (this.user?.organization && typeof this.user.organization === 'object') {
            console.log('✅ Organization object details:', {
              _id: this.user.organization._id,
              name: this.user.organization.name,
              signature: this.user.organization.signature
            });
          }
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
    console.log('🔄 Checking authorization...');
    const { isAuthorized, user } = await authService.checkAuthorization();
    console.log('🔄 Authorization check result:', { isAuthorized, user });
    
    if (isAuthorized) {
      console.log('✅ User is authorized, updating store...');
      runInAction(() => {
        this.user = user;
      });
      console.log('✅ Store updated with user:', this.user);
      console.log('✅ Organization in user:', this.user?.organization);
    } else {
      console.log('❌ User is not authorized');
    }
    
    return { isAuthorized, user };
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
    
    // Force clear any remaining cookies by setting them to expire immediately
    // This is a backup to handle edge cases
    const cookieNames = ['accessToken', 'refreshToken', 'foozool-jwt', 'jwt'];
    cookieNames.forEach(name => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/auth;`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/api;`;
    });
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
