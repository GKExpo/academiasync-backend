import { IUser, IAttendance, IAttendanceRequest, ILeaveRequest, INotification, Role, AttendanceStatus, RequestStatus, RequestType } from '../types';

const API_BASE = 'http://localhost:5000/api';

// Helper to simulate delay (optional, for consistency)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class DatabaseService {
  constructor() {
    this.init();
  }

  private async init() {
    // Seed welcome notifications for main users if none exist
    await this.seedWelcomeNotifications();
  }

  private async seedWelcomeNotifications() {
    try {
      const users = await this.getAllUsers();
      for (const user of users) {
        const notifications = await this.getNotifications(user._id);
        if (notifications.length === 0) {
          await this.createNotification({
            recipientId: user._id,
            type: RequestType.ATTENDANCE_EDIT, // or LEAVE_REQUEST
            referenceId: user._id,
            message: `Welcome to AcademiaSync, ${user.name}! Your account is now active.`,
            isRead: false
          });
        }
      }
    } catch (error) {
      console.error('Error seeding notifications:', error);
    }
  }
  // --- Auth & User ---
  async login(email: string, password: string): Promise<IUser | null> {
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  }

  async getUser(id: string): Promise<IUser | null> {
    try {
      const response = await fetch(`${API_BASE}/users/${id}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  async getAllUsers(): Promise<IUser[]> {
    try {
      const response = await fetch(`${API_BASE}/users`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Get all users error:', error);
      return [];
    }
  }

  async getSubordinates(managerId: string): Promise<IUser[]> {
    try {
      const response = await fetch(`${API_BASE}/users/${managerId}/subordinates`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Get subordinates error:', error);
      return [];
    }
  }

  // --- Attendance ---
  async getAttendance(userId: string, monthStr: string): Promise<IAttendance[]> {
    try {
      const response = await fetch(`${API_BASE}/attendance/${userId}?month=${monthStr}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Get attendance error:', error);
      return [];
    }
  }

  async getAttendanceByDate(userId: string, date: string): Promise<IAttendance | undefined> {
    const records = await this.getAttendance(userId, date.substring(0, 7));
    return records.find(a => a.date === date);
  }

  async checkIn(userId: string): Promise<IAttendance> {
    const response = await fetch(`${API_BASE}/attendance/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Check-in failed');
    }
    return await response.json();
  }

  async checkOut(userId: string): Promise<IAttendance> {
    const response = await fetch(`${API_BASE}/attendance/check-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Check-out failed');
    }
    return await response.json();
  }

  // --- Requests ---
  async createAttendanceRequest(req: Omit<IAttendanceRequest, '_id' | 'status' | 'createdAt'>): Promise<void> {
    const response = await fetch(`${API_BASE}/requests/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Create attendance request failed');
    }
  }

  async createLeaveRequest(req: Omit<ILeaveRequest, '_id' | 'status' | 'createdAt'>): Promise<void> {
    const response = await fetch(`${API_BASE}/requests/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Create leave request failed');
    }
  }

  async getPendingRequests(managerId: string): Promise<{ attendance: IAttendanceRequest[], leave: ILeaveRequest[] }> {
    try {
      const response = await fetch(`${API_BASE}/requests/pending/${managerId}`);
      if (!response.ok) return { attendance: [], leave: [] };
      return await response.json();
    } catch (error) {
      console.error('Get pending requests error:', error);
      return { attendance: [], leave: [] };
    }
  }

  async processAttendanceRequest(requestId: string, status: RequestStatus, adminId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/requests/attendance/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminId })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Process attendance request failed');
    }
  }

  async processLeaveRequest(requestId: string, status: RequestStatus, adminId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/requests/leave/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminId })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Process leave request failed');
    }
  }

  // --- Notifications ---
  async getNotifications(userId: string): Promise<INotification[]> {
    try {
      const response = await fetch(`${API_BASE}/notifications/${userId}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Get notifications error:', error);
      return [];
    }
  }

  async createNotification(notification: Omit<INotification, '_id' | 'createdAt'>): Promise<void> {
    try {
      await fetch(`${API_BASE}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification)
      });
    } catch (error) {
      console.error('Create notification error:', error);
    }
  }
}

export const dbService = new DatabaseService();