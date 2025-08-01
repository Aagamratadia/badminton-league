import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import FundContribution from '@/models/FundContribution';
import User from '@/models/User'; // Ensure User model is imported if needed for validation

// PUT update a fund contribution
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const { id } = params;
    const { amountPerPerson: newAmountPerPerson, userIds: newUserIds } = await request.json();

    if (!newAmountPerPerson || !newUserIds || !Array.isArray(newUserIds) || newUserIds.length === 0) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const originalContribution = await FundContribution.findById(id);

    if (!originalContribution) {
      return NextResponse.json({ message: 'Contribution not found' }, { status: 404 });
    }

    const { amountPerPerson: oldAmountPerPerson, userIds: oldUserIds } = originalContribution;

    const oldUserIdsSet = new Set(oldUserIds.map(uid => uid.toString()));
    const newUserIdsSet = new Set(newUserIds.map(uid => uid.toString()));

    const removedUserIds = Array.from(oldUserIdsSet).filter(uid => !newUserIdsSet.has(uid));
    const addedUserIds = Array.from(newUserIdsSet).filter(uid => !oldUserIdsSet.has(uid));
    const keptUserIds = Array.from(oldUserIdsSet).filter(uid => newUserIdsSet.has(uid));

    // Revert balance for removed users
    if (removedUserIds.length > 0) {
      await User.updateMany(
        { _id: { $in: removedUserIds } },
        { $inc: { outstandingBalance: oldAmountPerPerson } }
      );
    }

    // Update balance for added users
    if (addedUserIds.length > 0) {
      await User.updateMany(
        { _id: { $in: addedUserIds } },
        { $inc: { outstandingBalance: -newAmountPerPerson } }
      );
    }

    // Adjust balance for users who remained
    if (keptUserIds.length > 0 && oldAmountPerPerson !== newAmountPerPerson) {
      const amountDifference = oldAmountPerPerson - newAmountPerPerson;
      await User.updateMany(
        { _id: { $in: keptUserIds } },
        { $inc: { outstandingBalance: amountDifference } }
      );
    }

    // Update the contribution document
    const totalAmount = newAmountPerPerson * newUserIds.length;
    originalContribution.amountPerPerson = newAmountPerPerson;
    originalContribution.userIds = newUserIds;
    originalContribution.totalAmount = totalAmount;
    originalContribution.date = new Date();
    
    await originalContribution.save();

    return NextResponse.json(originalContribution);
  } catch (error) {
    console.error('Failed to update fund contribution:', error);
    return NextResponse.json({ message: 'Failed to update fund contribution' }, { status: 500 });
  }
}


// DELETE a fund contribution
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const { id } = params;

    const contributionToDelete = await FundContribution.findById(id);

    if (!contributionToDelete) {
      return NextResponse.json({ message: 'Contribution not found' }, { status: 404 });
    }

    // Increase the outstanding balance for each user
    await User.updateMany(
      { _id: { $in: contributionToDelete.userIds } },
      { $inc: { outstandingBalance: contributionToDelete.amountPerPerson } }
    );

    await FundContribution.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Contribution deleted successfully' });
  } catch (error) {
    console.error('Failed to delete fund contribution:', error);
    return NextResponse.json({ message: 'Failed to delete fund contribution' }, { status: 500 });
  }
}
