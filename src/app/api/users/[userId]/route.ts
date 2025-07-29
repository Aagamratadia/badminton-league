import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  await dbConnect();

  try {
    const user = await User.findById(params.userId).select('name email points matchesPlayed matchesWon dob anniversary');
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error('Error fetching user:', error);
    if (error instanceof Error && error.name === 'CastError') {
        return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Error fetching user' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { userId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }
  if (session.user.id !== params.userId) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  await dbConnect();
  const body = await request.json();
  const update: any = {};
  if (typeof body.name === 'string' && body.name.trim().length > 0) {
    update.name = body.name.trim();
  }
  if (typeof body.dob === 'string') {
    const date = new Date(body.dob);
    if (!isNaN(date.getTime())) update.dob = date;
  }
  if (typeof body.anniversary === 'string') {
    const date = new Date(body.anniversary);
    if (!isNaN(date.getTime())) update.anniversary = date;
  }
  try {
    const user = await User.findByIdAndUpdate(params.userId, update, { new: true }).select('name email points matchesPlayed matchesWon dob anniversary');
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ message: 'Error updating user' }, { status: 500 });
  }
}
