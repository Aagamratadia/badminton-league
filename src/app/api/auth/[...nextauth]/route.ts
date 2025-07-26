import NextAuth, { type NextAuthOptions, type DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
      points: number;
    } & DefaultSession['user']
  }
}

const authOptions: NextAuthOptions = {
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
          throw new Error('No user found with this email');
        }
        
        // Type assertion for the user object
        type UserType = {
          _id: any;
          name: string;
          email: string;
          role: string;
          points: number;
          password: string;
        };
        const typedUser = user as UserType;

        const isValid = await bcrypt.compare(credentials.password, typedUser.password);
        if (!isValid) {
          throw new Error('Incorrect password');
        }

        return {
          id: typedUser._id.toString(),
          name: typedUser.name,
          email: typedUser.email,
          role: typedUser.role,
          points: typedUser.points
        };
      }
    })
  ],
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
    }
  },
  pages: {
    signIn: '/login', 
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST, authOptions };
