// Check what avatar data is actually stored for Nathan and Priya
const mongoose = require('mongoose');
const { Student } = require('./src/model/Student.model');

async function checkCustomAvatars() {
  try {
    const dbConnectionString = 'mongodb+srv://eLearning:Y1fVPMsdF6wBkpnv@cluster0.4rgqovz.mongodb.net/eLearningDb?retryWrites=true&w=majority&authSource=admin';
    await mongoose.connect(dbConnectionString);
    console.log('Connected to database');

    // Check Nathan and Priya specifically
    const nathan = await Student.findOne({ name: 'Nathan' });
    const priya = await Student.findOne({ name: 'priya' });

    console.log('\n=== NATHAN\'S AVATAR DATA ===');
    console.log('Nathan found:', nathan ? 'Yes' : 'No');
    if (nathan) {
      console.log('Avatar data:', JSON.stringify(nathan.avatar, null, 2));
      console.log('Has custom avatar?', nathan.avatar ? 'Yes' : 'No');
    }

    console.log('\n=== PRIYA\'S AVATAR DATA ===');
    console.log('Priya found:', priya ? 'Yes' : 'No');
    if (priya) {
      console.log('Avatar data:', JSON.stringify(priya.avatar, null, 2));
      console.log('Has custom avatar?', priya.avatar ? 'Yes' : 'No');
    }

    // Check if there are any avatar records in a separate collection
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n=== AVAILABLE COLLECTIONS ===');
    collections.forEach(col => console.log('-', col.name));

    // Check if there's an avatars collection
    const avatarCollectionExists = collections.some(col => col.name.toLowerCase().includes('avatar'));
    if (avatarCollectionExists) {
      console.log('\n=== AVATAR COLLECTION FOUND ===');
      // We'll need to check this collection
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

checkCustomAvatars();
