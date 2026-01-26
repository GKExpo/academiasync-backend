import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true
        },

        passwordHash: {
            type: String,
            required: true
        },

        role: {
            type: [String],
            default: ['user']
        },

        department: String,
        employeeId: String,

        reportsTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

const User = mongoose.model('User', userSchema);
export default User;
