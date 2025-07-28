import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  // Only allow admins to see pending approvals
  if (session?.user?.role !== 'admin') {
    return NextResponse.json(
      { message: 'Unauthorized' },
      { status: 403 }
    );
  }

  await dbConnect();

  try {
    const pendingUsers = await User.find({ approved: false })
      .select('name email createdAt')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      count: pendingUsers.length,
      users: pendingUsers
    });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    return NextResponse.json(
      { message: 'Error fetching pending approvals' },
      { status: 500 }
    );
  }
}
