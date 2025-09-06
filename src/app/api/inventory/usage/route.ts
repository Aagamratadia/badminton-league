import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Inventory, UsageLog } from '@/models/Inventory';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  await dbConnect();

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { quantityUsed } = await request.json();

    if (!quantityUsed) {
      return NextResponse.json({ message: 'Missing required field: quantityUsed' }, { status: 400 });
    }

    // 1. Create a new usage log
    await UsageLog.create([{ quantityUsed }], { session });

    // 2. Update the total shuttle count
    await Inventory.findOneAndUpdate({}, { $inc: { totalShuttles: -quantityUsed } }, { upsert: true, new: true, session });

    await session.commitTransaction();

    return NextResponse.json({ message: 'Usage logged successfully' });
  } catch (error) {
    await session.abortTransaction();
    console.error('Failed to log usage:', error);
    return NextResponse.json({ message: 'Failed to log usage' }, { status: 500 });
  } finally {
    session.endSession();
  }
}

export async function GET() {
  await dbConnect();
  try {
    const logs = await UsageLog.find({}).sort({ usageDate: -1 });
    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Failed to fetch usage logs:', error);
    return NextResponse.json({ message: 'Failed to fetch usage logs' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  await dbConnect();
  
  try {
    const { id, quantityUsed } = await request.json();
    
    if (!id || !quantityUsed) {
      return NextResponse.json({ message: 'Missing required fields: id and quantityUsed' }, { status: 400 });
    }
    
    // Find the log to get the original quantity
    const originalLog = await UsageLog.findById(id);
    if (!originalLog) {
      return NextResponse.json({ message: 'Usage log not found' }, { status: 404 });
    }
    
    const quantityDifference = quantityUsed - originalLog.quantityUsed;
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Update the log
      await UsageLog.findByIdAndUpdate(id, { quantityUsed }, { session });
      
      // Update the inventory total shuttles
      await Inventory.findOneAndUpdate(
        {}, 
        { $inc: { totalShuttles: -quantityDifference } }, 
        { session }
      );
      
      await session.commitTransaction();
      return NextResponse.json({ message: 'Usage log updated successfully' });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Failed to update usage log:', error);
    return NextResponse.json({ message: 'Failed to update usage log' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  await dbConnect();
  
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ message: 'Missing required parameter: id' }, { status: 400 });
    }
    
    // Find the log to get the quantity
    const log = await UsageLog.findById(id);
    if (!log) {
      return NextResponse.json({ message: 'Usage log not found' }, { status: 404 });
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Delete the log
      await UsageLog.findByIdAndDelete(id, { session });
      
      // Update the inventory total shuttles (add back the deleted quantity)
      await Inventory.findOneAndUpdate(
        {}, 
        { $inc: { totalShuttles: log.quantityUsed } }, 
        { session }
      );
      
      await session.commitTransaction();
      return NextResponse.json({ message: 'Usage log deleted successfully' });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Failed to delete usage log:', error);
    return NextResponse.json({ message: 'Failed to delete usage log' }, { status: 500 });
  }
}
