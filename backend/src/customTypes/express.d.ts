export {};

declare global {
  namespace Express {
    interface AuthenticatedUser {
      _id: string;
      email?: string;
      name?: string;
    }

    interface Request {
      user?: AuthenticatedUser;
    }
  }
}


