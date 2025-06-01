import { observable, runInAction, action, makeObservable, toJS } from 'mobx';
import authService, { AuthRequestPayload } from '@/services/auth-service';
import { setStoredToken } from '@/services/local-storage';
import { decodeToken } from '@/utils';
import User from '@/types/user';
import config from '@/config';

const { useIntuitLogin } = config;
// import { roles } from '../utils/permissions';
class AuthStore {
  user: User | undefined;
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
    await authService.signout();
    setStoredToken('');
  }

  getUser = () => {
    return toJS(this.user);
  }
  login = async (payload: AuthRequestPayload) => {
    try {
      const resp = await authService.login(payload);
      if (resp.status === 200 && resp.token) {
        setStoredToken(resp.token);
        const decodeRes = decodeToken(resp.token);
        const intuitAuthUri = resp.intuitAuthUri;
        runInAction(() => {
          this.token = resp.token;
          this.user = decodeRes?.user;
        });
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
