import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    passwordHash: String,
    role: [String],
    department: String,
    employeeId: String,
    reportsTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

const seedUsers = [
    {
        name: 'Dr. Sanjay H. Dabhole',
        email: 'principal@college.edu',
        passwordHash: 'password',
        role: ['admin'],
        department: 'Administration',
        employeeId: 'EMP001',
        reportsTo: null,
        isActive: true
    },
    {
        name: 'Prof. Dipak P. Jagtap',
        email: 'hod.ece@college.edu',
        passwordHash: 'password',
        role: ['user', 'admin'],
        department: 'Electronics & Computer Engineering',
        employeeId: 'EMP002',
        reportsTo: null, // Will be set after first user is created
        isActive: true
    },
    {
        name: 'Prof. Rohit Nalawade',
        email: 'rohit.nalawade@college.edu',
        passwordHash: 'password',
        role: ['user'],
        department: 'Electronics & Computer Engineering',
        employeeId: 'EMP003',
        reportsTo: null, // Will be set after HOD is created
        isActive: true
    },
    {
        name: 'Prof. Uday Salokhe',
        email: 'uday.salokhe@college.edu',
        passwordHash: 'password',
        role: ['user'],
        department: 'Electronics & Computer Engineering',
        employeeId: 'EMP004',
        reportsTo: null, // Will be set after HOD is created
        isActive: true
    },
    {
        name: 'Prof. Rashmi Pande',
        email: 'rashmi.pande@college.edu',
        passwordHash: 'password',
        role: ['user'],
        department: 'Electronics & Computer Engineering',
        employeeId: 'EMP005',
        reportsTo: null, // Will be set after HOD is created
        isActive: true
    }
];

async function seedDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing users
        await User.deleteMany({});

        // Insert users
        const users = await User.insertMany(seedUsers);
        console.log('Users seeded:', users.length);

        // Update reportsTo references
        const principal = users.find(u => u.employeeId === 'EMP001');
        const hod = users.find(u => u.employeeId === 'EMP002');

        await User.updateMany(
            { employeeId: { $in: ['EMP002', 'EMP003', 'EMP004', 'EMP005'] } },
            { reportsTo: hod._id }
        );

        console.log('User hierarchy updated');
        console.log('Database seeded successfully!');

    } catch (error) {
        console.error('Seeding error:', error);
    } finally {
        mongoose.connection.close();
    }
}

seedDatabase();