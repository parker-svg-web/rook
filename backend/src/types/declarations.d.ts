declare module 'express' {
  import { Request, Response, NextFunction, Application, Router } from 'express-serve-static-core';
  const app: () => Application;
  export { Request, Response, NextFunction, Application, Router };
  export default app;
}
declare module 'cors' {
  const cors: (options?: any) => any;
  export default cors;
}
declare module 'bcryptjs' {
  export function hash(s: string, salt: number): Promise<string>;
  export function compare(s: string, hash: string): Promise<boolean>;
}
declare module 'jsonwebtoken' {
  export function sign(payload: any, secret: string, options?: any): string;
  export function verify(token: string, secret: string): any;
}
declare module 'uuid' {
  export function v4(): string;
}