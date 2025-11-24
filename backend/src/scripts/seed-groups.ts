import mongoose from 'mongoose';
import Group from '../models/Group';
import dotenv from 'dotenv';

dotenv.config();

const groups = [
  {
    name: 'haitech',
    displayName: 'Хайтек',
    logo: '/photo/haitech.jpg',
    description: 'Хайтек – высокотехнологичное направление',
    isActive: true,
  },
  {
    name: 'promdesign',
    displayName: 'Промдизайнквантум',
    logo: '/photo/promdizain.jpg',
    description: 'Промдизайнквантум – промышленный дизайн',
    isActive: true,
  },
  {
    name: 'promrobo',
    displayName: 'Промробоквантум',
    logo: '/photo/promrobo.jpg',
    description: 'Промробоквантум – промышленная робототехника',
    isActive: true,
  },
  {
    name: 'energy',
    displayName: 'Энерджиквантум',
    logo: '/photo/energy.jpg',
    description: 'Энерджиквантум – альтернативная энергетика',
    isActive: true,
  },
  {
    name: 'bio',
    displayName: 'Биоквантум',
    logo: '/photo/bio.jpg',
    description: 'Биоквантум – биотехнологии',
    isActive: true,
  },
  {
    name: 'aero',
    displayName: 'Аэроквантум',
    logo: '/photo/aero.jpg',
    description: 'Аэроквантум – авиация и космос',
    isActive: true,
  },
  {
    name: 'media',
    displayName: 'Медиаквантум',
    logo: '/photo/media.jpg',
    description: 'Медиаквантум – медиатехнологии',
    isActive: true,
  },
  {
    name: 'vrar',
    displayName: 'VR/AR – квантум',
    logo: '/photo/vrar.jpg',
    description: 'VR/AR – квантум – виртуальная и дополненная реальность',
    isActive: true,
  },
];

const seedGroups = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/sis-education';
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');

    // Удаляем существующие группы
    await Group.deleteMany({});
    console.log('Cleared existing groups');

    // Создаем новые группы
    for (const groupData of groups) {
      const group = new Group(groupData);
      await group.save();
      console.log(`Created group: ${groupData.displayName}`);
    }

    console.log('Groups seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding groups:', error);
    process.exit(1);
  }
};

seedGroups();

