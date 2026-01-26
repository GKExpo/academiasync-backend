import mongoose from 'mongoose';

const attendanceRequestSchema = new mongoose.Schema(
    {
        attendanceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Attendance',
            required: false
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        requestedDate: {
            type: String,
            required: true
        },
        requestedCheckIn: {
            type: String,
            required: true
        },
        requestedCheckOut: {
            type: String,
            required: true
        },
        reason: {
            type: String
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reviewedAt: {
            type: Date
        }
    },
    { timestamps: true }
);

const AttendanceRequest = mongoose.model(
    'AttendanceRequest',
    attendanceRequestSchema
);

export default AttendanceRequest;
