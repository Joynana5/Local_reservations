import { describe, it, expect } from 'vitest';
import {
  isSlotAvailable,
  getAvailableSlots,
  isOpenOnWeekday,
  getWeekdayHours,
  type Reservation,
  type Table,
} from './availability';

describe('Availability Logic', () => {
  describe('isSlotAvailable', () => {
    const table2Capacity: Table = { id: 'table-1', capacity: 2 };
    const table4Capacity: Table = { id: 'table-2', capacity: 4 };
    const table6Capacity: Table = { id: 'table-3', capacity: 6 };

    it('should return false when no suitable table exists', () => {
      const slotStart = new Date('2026-11-07T18:00:00Z');
      const partySize = 10;
      const tables = [table2Capacity, table4Capacity];
      const reservations: Reservation[] = [];

      const result = isSlotAvailable(slotStart, partySize, tables, reservations);
      expect(result).toBe(false);
    });

    it('should return true when suitable table is available and no conflicts', () => {
      const slotStart = new Date('2026-11-07T18:00:00Z');
      const partySize = 4;
      const tables = [table4Capacity, table6Capacity];
      const reservations: Reservation[] = [];

      const result = isSlotAvailable(slotStart, partySize, tables, reservations);
      expect(result).toBe(true);
    });

    it('should return false when all suitable tables are booked in the slot time', () => {
      const slotStart = new Date('2026-11-07T18:00:00Z');
      const partySize = 4;
      const tables = [table4Capacity];
      
      const reservation: Reservation = {
        startsAt: new Date('2026-11-07T17:45:00Z'),
        endsAt: new Date('2026-11-07T19:15:00Z'),
        status: 'confirmed',
      };
      const reservations = [reservation];

      const result = isSlotAvailable(slotStart, partySize, tables, reservations);
      expect(result).toBe(false);
    });

    it('should ignore cancelled reservations', () => {
      const slotStart = new Date('2026-11-07T18:00:00Z');
      const partySize = 4;
      const tables = [table4Capacity];
      
      const reservation: Reservation = {
        startsAt: new Date('2026-11-07T17:45:00Z'),
        endsAt: new Date('2026-11-07T19:15:00Z'),
        status: 'cancelled',
      };
      const reservations = [reservation];

      const result = isSlotAvailable(slotStart, partySize, tables, reservations);
      expect(result).toBe(true);
    });

    it('should ignore no_show reservations', () => {
      const slotStart = new Date('2026-11-07T18:00:00Z');
      const partySize = 4;
      const tables = [table4Capacity];
      
      const reservation: Reservation = {
        startsAt: new Date('2026-11-07T17:45:00Z'),
        endsAt: new Date('2026-11-07T19:15:00Z'),
        status: 'no_show',
      };
      const reservations = [reservation];

      const result = isSlotAvailable(slotStart, partySize, tables, reservations);
      expect(result).toBe(true);
    });

    it('should return true when one of multiple tables is available', () => {
      const slotStart = new Date('2026-11-07T18:00:00Z');
      const partySize = 4;
      const table4_1: Table = { id: 'table-a', capacity: 4 };
      const table4_2: Table = { id: 'table-b', capacity: 4 };
      const tables = [table4_1, table4_2];
      
      const reservation: Reservation = {
        startsAt: new Date('2026-11-07T17:45:00Z'),
        endsAt: new Date('2026-11-07T19:15:00Z'),
        status: 'confirmed',
        tableId: 'table-a',
      };
      const reservations = [reservation];

      const result = isSlotAvailable(slotStart, partySize, tables, reservations);
      expect(result).toBe(true);
    });

    it('should handle party size exactly matching table capacity', () => {
      const slotStart = new Date('2026-11-07T18:00:00Z');
      const partySize = 2;
      const tables = [table2Capacity];
      const reservations: Reservation[] = [];

      const result = isSlotAvailable(slotStart, partySize, tables, reservations);
      expect(result).toBe(true);
    });

    it('should detect overlap at reservation start time', () => {
      const slotStart = new Date('2026-11-07T18:00:00Z');
      const partySize = 4;
      const tables = [table4Capacity];
      
      const reservation: Reservation = {
        startsAt: new Date('2026-11-07T18:00:00Z'),
        endsAt: new Date('2026-11-07T19:30:00Z'),
        status: 'confirmed',
      };
      const reservations = [reservation];

      const result = isSlotAvailable(slotStart, partySize, tables, reservations);
      expect(result).toBe(false);
    });

    it('should handle back-to-back reservations', () => {
      const slotStart = new Date('2026-11-07T19:30:00Z');
      const partySize = 4;
      const tables = [table4Capacity];
      
      const reservation: Reservation = {
        startsAt: new Date('2026-11-07T18:00:00Z'),
        endsAt: new Date('2026-11-07T19:30:00Z'),
        status: 'confirmed',
      };
      const reservations = [reservation];

      const result = isSlotAvailable(slotStart, partySize, tables, reservations);
      expect(result).toBe(true);
    });
  });

  describe('getAvailableSlots', () => {
    const table4Capacity: Table = { id: 'table-1', capacity: 4 };

    it('should return empty array when restaurant is closed', () => {
      const date = new Date('2026-11-07');
      const openTime = '17:00';
      const closeTime = '22:00';
      const partySize = 2;
      const tables = [table4Capacity];
      const reservations: Reservation[] = [];

      const slots = getAvailableSlots(date, openTime, closeTime, partySize, tables, reservations);
      expect(slots.length).toBeGreaterThan(0);
    });

    it('should generate 30-minute slots', () => {
      const date = new Date('2026-11-07');
      const openTime = '18:00';
      const closeTime = '20:00';
      const partySize = 2;
      const tables = [table4Capacity];
      const reservations: Reservation[] = [];

      const slots = getAvailableSlots(date, openTime, closeTime, partySize, tables, reservations);
      expect(slots.length).toBeGreaterThan(0);

      if (slots.length >= 2) {
        const slot1 = new Date(slots[0]);
        const slot2 = new Date(slots[1]);
        const diffMinutes = (slot2.getTime() - slot1.getTime()) / (1000 * 60);
        expect(diffMinutes).toBe(30);
      }
    });

    it('should respect closing time (need 90 minutes before close)', () => {
      const date = new Date('2026-11-07');
      const openTime = '17:00';
      const closeTime = '18:30';
      const partySize = 2;
      const tables = [table4Capacity];
      const reservations: Reservation[] = [];

      const slots = getAvailableSlots(date, openTime, closeTime, partySize, tables, reservations);
      
      slots.forEach((slot) => {
        const slotDate = new Date(slot);
        const reservationEnd = new Date(slotDate.getTime() + 90 * 60 * 1000);
        const closeDate = new Date(date);
        closeDate.setHours(18, 30, 0, 0);
        expect(reservationEnd.getTime()).toBeLessThanOrEqual(closeDate.getTime());
      });
    });

    it('should filter out slots with conflicting reservations', () => {
      const date = new Date('2026-11-07');
      const openTime = '17:00';
      const closeTime = '20:00';
      const partySize = 2;
      const table4_1: Table = { id: 'table-1', capacity: 4 };
      const table4_2: Table = { id: 'table-2', capacity: 4 };
      const tables = [table4_1, table4_2];

      const reservation: Reservation = {
        startsAt: new Date('2026-11-07T17:45:00Z'),
        endsAt: new Date('2026-11-07T19:15:00Z'),
        status: 'confirmed',
      };
      const reservations = [reservation];

      const slots = getAvailableSlots(date, openTime, closeTime, partySize, tables, reservations);

      slots.forEach((slot) => {
        const slotDate = new Date(slot);
        const isBooked = !(slotDate.getTime() + 90 * 60 * 1000 <= reservation.startsAt.getTime() 
          || slotDate.getTime() >= reservation.endsAt.getTime());
        expect(isBooked).toBe(false);
      });
    });
  });

  describe('isOpenOnWeekday', () => {
    it('should return true for open days', () => {
      const hours = [
        { weekday: 0, isClosed: true },
        { weekday: 1, isClosed: true },
        { weekday: 2, isClosed: false },
      ];

      expect(isOpenOnWeekday(2, hours)).toBe(true);
    });

    it('should return false for closed days', () => {
      const hours = [
        { weekday: 0, isClosed: true },
        { weekday: 1, isClosed: true },
        { weekday: 2, isClosed: false },
      ];

      expect(isOpenOnWeekday(0, hours)).toBe(false);
    });

    it('should return false when weekday is not found', () => {
      const hours = [{ weekday: 2, isClosed: false }];

      expect(isOpenOnWeekday(5, hours)).toBe(false);
    });
  });

  describe('getWeekdayHours', () => {
    it('should return opening hours for open weekday', () => {
      const hours = [
        { weekday: 2, openTime: '17:00', closeTime: '22:00', isClosed: false },
      ];

      const result = getWeekdayHours(2, hours);
      expect(result).toEqual({ openTime: '17:00', closeTime: '22:00' });
    });

    it('should return null for closed weekday', () => {
      const hours = [
        { weekday: 0, openTime: undefined, closeTime: undefined, isClosed: true },
      ];

      const result = getWeekdayHours(0, hours);
      expect(result).toBeNull();
    });

    it('should return null when weekday is not found', () => {
      const hours = [{ weekday: 2, openTime: '17:00', closeTime: '22:00', isClosed: false }];

      const result = getWeekdayHours(5, hours);
      expect(result).toBeNull();
    });

    it('should return null when times are missing', () => {
      const hours = [
        { weekday: 2, openTime: undefined, closeTime: '22:00', isClosed: false },
      ];

      const result = getWeekdayHours(2, hours);
      expect(result).toBeNull();
    });
  });
});
