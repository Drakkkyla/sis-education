import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sis-education';

async function fixEmailIndex() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db!.collection('users');

    // Drop existing email indexes
    try {
      const indexes = await usersCollection.indexes();
      for (const index of indexes) {
        if (index.name && index.name.includes('email')) {
          await usersCollection.dropIndex(index.name);
          console.log(`Dropped index: ${index.name}`);
        }
      }
    } catch (error: any) {
      console.log('Error dropping indexes:', error.message);
    }

    // Create new sparse unique index that allows multiple null values
    await usersCollection.createIndex(
      { email: 1 },
      {
        unique: true,
        sparse: true,
        partialFilterExpression: { email: { $exists: true, $ne: null } },
      }
    );
    console.log('Created new sparse unique index on email');

    // Update all documents with null email to remove the field entirely
    const result = await usersCollection.updateMany(
      { email: null },
      { $unset: { email: '' } }
    );
    console.log(`Updated ${result.modifiedCount} documents to remove null email field`);

    console.log('Email index fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing email index:', error);
    process.exit(1);
  }
}

fixEmailIndex();

