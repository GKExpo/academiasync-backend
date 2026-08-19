import { D1Database } from '@cloudflare/workers-types';

export interface ExternalBiometricEvent {
  biometricId: string; // The ID of the user on the biometric machine
  machineId: string; // The physical machine ID
  timestamp: string; // ISO format
  type: 'check_in' | 'check_out';
  eventId: string; // Unique external event ID for idempotency/duplicate protection
}

export class BiometricAdapter {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  /**
   * Translates an external biometric event into a normalized attendance record
   * Uses biometric_id to map back to the internal user ID without hardcoding
   * unique eventId prevents duplicate processing if the machine retries
   */
  async processEvent(event: ExternalBiometricEvent): Promise<boolean> {
    // 1. User Mapping Abstraction: Biometric ID -> Internal User ID
    const user = await this.db.prepare('SELECT id FROM users WHERE biometric_id = ?')
      .bind(event.biometricId)
      .first<{ id: string }>();

    if (!user) {
      throw new Error(`Unmapped biometric ID: ${event.biometricId}`);
    }

    const userId = user.id;
    
    // Parse date and time in IST for consistency with AcademiaSync
    const dateObj = new Date(event.timestamp);
    const date = dateObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const time = dateObj.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });

    // 2. Duplicate Protection (Idempotency Key)
    const existingEvent = await this.db.prepare('SELECT id FROM attendance WHERE external_id = ?')
      .bind(event.eventId)
      .first();

    if (existingEvent) {
      console.log(`Event ${event.eventId} already processed, skipping.`);
      return true; 
    }

    // 3. Process Check-in or Check-out
    if (event.type === 'check_in') {
      const id = crypto.randomUUID();
      // Insert with source 'biometric' and external_id
      await this.db.prepare(
        'INSERT INTO attendance (id, user_id, date, check_in, status, source, external_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
        .bind(id, userId, date, time, 'present', 'biometric', event.eventId)
        .run();
    } else if (event.type === 'check_out') {
      // Find the existing check-in for today
      const record = await this.db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?').bind(userId, date).first();
      
      if (!record) {
        throw new Error('Check-in record not found for check-out event');
      }
      
      // Calculate hours
      const start = parseInt((record.check_in as string).split(':')[0]) * 60 + parseInt((record.check_in as string).split(':')[1]);
      const end = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1]);
      const hours = (end - start) / 60;
      const status = hours >= 8 ? 'full_day' : hours >= 4 ? 'half_day' : 'absent';

      await this.db.prepare(
        'UPDATE attendance SET check_out = ?, total_hours = ?, status = ?, external_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      )
        .bind(time, Number(hours.toFixed(2)), status, event.eventId, record.id)
        .run();
    }

    return true;
  }
}
