import mongoose from 'mongoose';

const editSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        attendanceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Attendance',
            required: true,
        },
        requestedCheckIn: String,
        requestedCheckOut: String,
        reason: String,
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

export default mongoose.model('AttendanceEditRequest', editSchema);
