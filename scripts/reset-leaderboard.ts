import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import mongoose from 'mongoose';

async function resetLeaderboard() {
  console.log('Connecting to the database...');
  await dbConnect();
  console.log('Database connected.');

  try {
    console.log('Resetting leaderboard stats for all users...');
    const result = await User.updateMany(
      {},
      {
        $set: {
          points: 0,
          matchesPlayed: 0,
          matchesWon: 0,
          matchesLost: 0,
        },
      }
    );
    console.log(`✅ Leaderboard reset successfully. ${result.modifiedCount} users were updated.`);
  } catch (error) {
    console.error('❌ Error resetting leaderboard:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed.');
  }
}

resetLeaderboard();
