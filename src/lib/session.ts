import { IronSessionOptions } from 'iron-session';

export interface SessionData {
  userId: number;
  email: string;
  name: string;
}

export const sessionOptions: IronSessionOptions = {
  password: process.env.IRON_SESSION_PASSWORD as string,
  cookieName: 'pos-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};
