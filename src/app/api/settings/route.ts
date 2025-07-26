import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Settings from '@/models/Settings';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';

// GET: Anyone can view settings
export async function GET() {
  await dbConnect();
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  return NextResponse.json(settings);
}

// PATCH: Only admin can update
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  await dbConnect();
  const user = await User.findById(session.user.id);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  const data = await request.json();
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  if (typeof data.pointsForPlay === 'number') settings.pointsForPlay = data.pointsForPlay;
  if (typeof data.pointsForWin === 'number') settings.pointsForWin = data.pointsForWin;
  await settings.save();
  return NextResponse.json(settings);
}
