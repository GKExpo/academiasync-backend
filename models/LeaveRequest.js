import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fromDate: String,
    toDate: String,
    reason: String,
    status: { type: String, default: 'pending' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('LeaveRequest', leaveRequestSchema);
