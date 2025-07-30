import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Purchase } from '@/models/Inventory';
import mongoose from 'mongoose';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const purchase = await Purchase.findById(params.id).lean();
    
    if (!purchase) {
      return NextResponse.json({ message: 'Purchase not found' }, { status: 404 });
    }
    
    return NextResponse.json(purchase);
  } catch (error) {
    console.error('Error fetching purchase:', error);
    return NextResponse.json(
      { message: 'Error fetching purchase' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { companyName, quantity, totalPrice, selectedUserIds } = await request.json();
    
    if (!companyName || !quantity || !totalPrice || !selectedUserIds || selectedUserIds.length === 0) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    await dbConnect();
    
    // Start a session for the transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // 1. Get the original purchase to calculate the difference
      const originalPurchase = await Purchase.findById(params.id).session(session);
      if (!originalPurchase) {
        throw new Error('Purchase not found');
      }
      
      const costPerPlayer = totalPrice / selectedUserIds.length;
      const originalCostPerPlayer = originalPurchase.totalPrice / originalPurchase.splitAmong.length;
      
      // 2. Revert the original purchase's effect on user balances
      await mongoose.model('User').updateMany(
        { _id: { $in: originalPurchase.splitAmong } },
        { $inc: { outstandingBalance: -originalCostPerPlayer } },
        { session }
      );
      
      // 3. Apply the new purchase's effect on user balances
      await mongoose.model('User').updateMany(
        { _id: { $in: selectedUserIds } },
        { $inc: { outstandingBalance: costPerPlayer } },
        { session }
      );
      
      // 4. Update the purchase record
      const updatedPurchase = await Purchase.findByIdAndUpdate(
        params.id,
        {
          companyName,
          quantity,
          totalPrice,
          costPerPlayer,
          splitAmong: selectedUserIds,
          updatedAt: new Date()
        },
        { new: true, session }
      );
      
      // 5. Update the inventory count (if quantity changed)
      if (quantity !== originalPurchase.quantity) {
        const quantityDiff = quantity - originalPurchase.quantity;
        await mongoose.model('Inventory').findOneAndUpdate(
          {},
          { $inc: { totalShuttles: quantityDiff } },
          { upsert: true, session }
        );
      }
      
      await session.commitTransaction();
      session.endSession();
      
      return NextResponse.json(updatedPurchase);
      
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
    
  } catch (error) {
    console.error('Error updating purchase:', error);
    return NextResponse.json(
      { message: 'Error updating purchase' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    // Start a session for the transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // 1. Get the purchase to be deleted
      const purchase = await Purchase.findById(params.id).session(session);
      if (!purchase) {
        throw new Error('Purchase not found');
      }
      
      // 2. Revert the purchase's effect on user balances
      const costPerPlayer = purchase.totalPrice / purchase.splitAmong.length;
      await mongoose.model('User').updateMany(
        { _id: { $in: purchase.splitAmong } },
        { $inc: { outstandingBalance: -costPerPlayer } },
        { session }
      );
      
      // 3. Update the inventory count
      await mongoose.model('Inventory').findOneAndUpdate(
        {},
        { $inc: { totalShuttles: -purchase.quantity } },
        { session }
      );
      
      // 4. Delete the purchase record
      await Purchase.findByIdAndDelete(params.id).session(session);
      
      await session.commitTransaction();
      session.endSession();
      
      return NextResponse.json({ message: 'Purchase deleted successfully' });
      
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
    
  } catch (error) {
    console.error('Error deleting purchase:', error);
    return NextResponse.json(
      { message: 'Error deleting purchase' },
      { status: 500 }
    );
  }
}
