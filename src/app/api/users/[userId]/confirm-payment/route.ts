import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if the authenticated user is an admin
    await dbConnect();
    const adminUser = await User.findById(session.user.id);
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ message: 'Access denied. Admin role required.' }, { status: 403 });
    }

    const { userId } = params;

    // Find the user whose payment is being confirmed
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Check if user has an outstanding balance
    if (!user.outstandingBalance || user.outstandingBalance <= 0) {
      return NextResponse.json({ message: 'User has no outstanding balance to confirm' }, { status: 400 });
    }

    // Reset the user's outstanding balance to 0
    user.outstandingBalance = 0;
    await user.save();

    return NextResponse.json({ 
      message: 'Payment confirmed successfully',
      user: {
        id: user._id,
        name: user.name,
        outstandingBalance: user.outstandingBalance
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error confirming payment:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
