import type { NextAuthOptions, DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '@/lib/dbConnect';
import User, { IUser } from '@/models/User';
import bcrypt from 'bcryptjs';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      points: number;
    } & DefaultSession['user']
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter your email and password');
        }
        
        await dbConnect();
        
        const user = await User.findOne({ email: credentials.email }).lean();
        if (!user) {
          throw new Error('Invalid email or password');
        }
        
        const typedUser = user as IUser & { _id: any };
        const isPasswordValid = await bcrypt.compare(credentials.password, typedUser.password);
        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }
        
        return {
          id: typedUser._id.toString(),
          email: typedUser.email,
          name: typedUser.name,
          role: typedUser.role,
          points: typedUser.points
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.points = user.points;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.points = token.points as number;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
