import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET: List all users pending approval
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  await dbConnect();
  const pendingUsers = await User.find({ approved: false }).select('-password');
  return NextResponse.json(pendingUsers);
}

// PATCH: Approve or reject a user
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  
  const { userId, action } = await request.json();
  
  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  }
  
  await dbConnect();
  
  if (action === 'approve') {
    const user = await User.findByIdAndUpdate(
      userId, 
      { approved: true },
      { new: true }
    );
    
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      message: 'User approved successfully',
      user: { _id: user._id, name: user.name, email: user.email }
    });
  } else {
    // For reject action, we'll delete the user
    const result = await User.findByIdAndDelete(userId);
    
    if (!result) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      message: 'User rejected and removed successfully',
      userId: result._id
    });
  }
}
