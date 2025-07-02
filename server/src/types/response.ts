export interface IResponse<T = any> {
  status: number;
  payload: T;
}
