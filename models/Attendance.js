import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        date: { type: String, required: true },
        checkIn: String,
        checkOut: String,
        totalHours: Number,
        status: {
            type: String,
            enum: ['present', 'half_day', 'full_day', 'leave', 'absent'],
            required: true
        },
        isEdited: { type: Boolean, default: false }
    },
    { timestamps: true }
);

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
