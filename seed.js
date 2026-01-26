import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from './models/User.js';

dotenv.config();

async function seedDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        await User.deleteMany({});
        console.log('🗑️ Existing users removed');

        const saltRounds = 10;

        const users = await User.insertMany([
            {
                name: 'Dr. Sanjay H. Dabhole',
                email: 'principal@college.edu',
                passwordHash: await bcrypt.hash('password', saltRounds),
                role: ['admin'],
                department: 'Administration',
                employeeId: 'EMP001'
            },
            {
                name: 'Prof. Dipak P. Jagtap',
                email: 'hod.ece@college.edu',
                passwordHash: await bcrypt.hash('password', saltRounds),
                role: ['admin', 'user'],
                department: 'Electronics & Computer Engineering',
                employeeId: 'EMP002'
            },
            {
                name: 'Prof. Rohit Nalawade',
                email: 'rohit.nalawade@college.edu',
                passwordHash: await bcrypt.hash('password', saltRounds),
                role: ['user'],
                department: 'Electronics & Computer Engineering',
                employeeId: 'EMP003'
            },
            {
                name: 'Prof. Uday Salokhe',
                email: 'uday.salokhe@college.edu',
                passwordHash: await bcrypt.hash('password', saltRounds),
                role: ['user'],
                department: 'Electronics & Computer Engineering',
                employeeId: 'EMP004'
            },
            {
                name: 'Prof. Rashmi Pande',
                email: 'rashmi.pande@college.edu',
                passwordHash: await bcrypt.hash('password', saltRounds),
                role: ['user'],
                department: 'Electronics & Computer Engineering',
                employeeId: 'EMP005'
            }
        ]);

        const hod = users.find(u => u.employeeId === 'EMP002');

        await User.updateMany(
            { employeeId: { $ne: 'EMP001' } },
            { reportsTo: hod._id }
        );

        console.log('✅ Users seeded');
        console.log('✅ Hierarchy updated');
        console.log('🎉 Database seeded successfully');
    } catch (err) {
        console.error('❌ Seeding error:', err.message);
    } finally {
        await mongoose.connection.close();
    }
}

seedDatabase();
