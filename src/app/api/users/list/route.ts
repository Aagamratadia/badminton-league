import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  // if (!session || session.user.role !== 'admin') {
  //   return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  // }

  await dbConnect();

  try {
    const users = await User.find({}).select('name email role');
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ message: 'Error fetching users' }, { status: 500 });
  }
}
