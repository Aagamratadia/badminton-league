import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import dbConnect from '@/lib/dbConnect';

export async function GET() {
  try {
    await dbConnect();
    
    // Get current user session
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'You must be signed in to access this resource.' },
        { status: 401 }
      );
    }

    // Fetch all approved users except the current user
    const users = await User.find(
      { 
        _id: { $ne: session.user.id },
        approved: true 
      },
      'name email'
    ).sort({ name: 1 });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
