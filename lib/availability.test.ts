import { describe, it, expect } from 'vitest';
import {
  isSlotAvailable,
  getAvailableSlots,
  getAlternativeSlots,
  getSlotAvailability,
  fitsBeforeClosing,
  pickTables,
  isOpenOnWeekday,
  getWeekdayHours,
  type Reservation,
  type Table,
} from './availability';
import { formatMapleBayTime24 } from './search-time';

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
    const date = '2026-11-07'; // Saturday, Pacific standard time (UTC-8)

    it('should generate 30-minute slots in Maple Bay local time', () => {
      const slots = getAvailableSlots(date, '17:00', '20:00', 2, [table4Capacity], []);

      expect(slots).toEqual([
        '2026-11-08T01:00:00.000Z', // 17:00
        '2026-11-08T01:30:00.000Z', // 17:30
        '2026-11-08T02:00:00.000Z', // 18:00
        '2026-11-08T02:30:00.000Z', // 18:30 (20:00 close − 90 min)
      ]);
    });

    it('should make 20:30 the last slot when the restaurant closes at 22:00', () => {
      const slots = getAvailableSlots(date, '17:00', '22:00', 2, [table4Capacity], []);

      expect(formatMapleBayTime24(new Date(slots[slots.length - 1]))).toBe('20:30');
      expect(slots).not.toContain('2026-11-08T05:00:00.000Z'); // 21:00 would run past closing
    });

    it('should return no slots when the opening window is shorter than 90 minutes', () => {
      expect(getAvailableSlots(date, '17:00', '18:00', 2, [table4Capacity], [])).toEqual([]);
    });

    it('should accept database time values with seconds', () => {
      const slots = getAvailableSlots(date, '17:00:00', '19:00:00', 2, [table4Capacity], []);
      expect(slots).toHaveLength(2);
    });

    it('should use daylight saving time offset in summer', () => {
      const slots = getAvailableSlots('2026-07-07', '17:00', '18:30', 2, [table4Capacity], []);
      expect(slots).toEqual(['2026-07-08T00:00:00.000Z']);
    });

    it('should filter out slots with conflicting reservations', () => {
      const table4_2: Table = { id: 'table-2', capacity: 4 };
      const reservation: Reservation = {
        tableId: 'table-1',
        startsAt: new Date('2026-11-08T01:45:00Z'), // 17:45
        endsAt: new Date('2026-11-08T03:15:00Z'),
        status: 'confirmed',
      };

      // Only table-1 exists -> every slot that overlaps 17:45-19:15 is gone
      const slots = getAvailableSlots(date, '17:00', '21:00', 2, [table4Capacity], [reservation]);
      expect(slots).toEqual(['2026-11-08T03:30:00.000Z']); // 19:30

      // With a second free table, all slots stay available
      const withSecondTable = getAvailableSlots(date, '17:00', '21:00', 2, [table4Capacity, table4_2], [reservation]);
      expect(withSecondTable).toHaveLength(6);
    });

    it('should return no slots when the party is bigger than every table', () => {
      expect(getAvailableSlots(date, '17:00', '22:00', 6, [table4Capacity], [])).toEqual([]);
    });
  });

  describe('getSlotAvailability', () => {
    const table: Table = { id: 'table-1', capacity: 4 };

    it('should mark slots held by an existing reservation as booked and keep the others free', () => {
      const reservation: Reservation = {
        tableId: 'table-1',
        startsAt: new Date('2026-11-08T01:45:00Z'), // 17:45-19:15
        endsAt: new Date('2026-11-08T03:15:00Z'),
        status: 'confirmed',
      };

      const slots = getSlotAvailability('2026-11-07', '17:00', '21:00', 2, [table], [reservation]);

      expect(slots.map((slot) => slot.available)).toEqual([false, false, false, false, false, true]);
      expect(slots).toHaveLength(6);
    });

    it('should return no slots when the party is bigger than every table', () => {
      expect(getSlotAvailability('2026-11-07', '17:00', '21:00', 5, [table], [])).toEqual([]);
    });
  });

  describe('pickTables', () => {
    const slot = new Date('2026-11-08T02:00:00Z');
    const small: Table = { id: 'small', capacity: 2 };
    const medium: Table = { id: 'medium', capacity: 4 };
    const large: Table = { id: 'large', capacity: 8 };
    const hold = (tableId: string, startsAt: string, minutes = 90): Reservation => ({
      tableId,
      startsAt: new Date(startsAt),
      endsAt: new Date(new Date(startsAt).getTime() + minutes * 60_000),
      status: 'confirmed',
    });

    it('should list free suitable tables with the smallest capacity first', () => {
      expect(pickTables(slot, 2, [large, medium, small], []).map((t) => t.id)).toEqual(['small', 'medium', 'large']);
      expect(pickTables(slot, 3, [large, medium, small], []).map((t) => t.id)).toEqual(['medium', 'large']);
    });

    it('should skip a table held by an overlapping 90-minute reservation', () => {
      const reservations = [hold('small', '2026-11-08T00:45:00Z')]; // 16:45-18:15 overlaps 18:00
      expect(pickTables(slot, 2, [small, medium], reservations).map((t) => t.id)).toEqual(['medium']);
    });

    it('should free the table exactly when the previous 90-minute hold ends', () => {
      const reservations = [hold('small', '2026-11-08T00:30:00Z')]; // ends 18:00
      expect(pickTables(slot, 2, [small], reservations).map((t) => t.id)).toEqual(['small']);
    });

    it('should ignore cancelled and no-show reservations', () => {
      const cancelled: Reservation = { ...hold('small', '2026-11-08T02:00:00Z'), status: 'cancelled' };
      const noShow: Reservation = { ...hold('small', '2026-11-08T02:00:00Z'), status: 'no_show' };
      expect(pickTables(slot, 2, [small], [cancelled, noShow])).toHaveLength(1);
    });

    it('should return nothing when the party is bigger than every table', () => {
      expect(pickTables(slot, 9, [small, medium, large], [])).toEqual([]);
    });
  });

  describe('fitsBeforeClosing', () => {
    const closeAt = new Date('2026-11-08T06:00:00Z'); // 22:00 local

    it('should accept the last slot at closing minus 90 minutes', () => {
      expect(fitsBeforeClosing(new Date('2026-11-08T04:30:00Z'), closeAt)).toBe(true); // 20:30
    });

    it('should reject a slot that would run past closing time', () => {
      expect(fitsBeforeClosing(new Date('2026-11-08T05:00:00Z'), closeAt)).toBe(false); // 21:00
    });
  });

  describe('getAlternativeSlots', () => {
    const slots = [
      '2026-11-08T01:00:00.000Z',
      '2026-11-08T01:30:00.000Z',
      '2026-11-08T02:30:00.000Z',
      '2026-11-08T03:00:00.000Z',
      '2026-11-08T04:30:00.000Z',
    ];

    it('should suggest the three closest slots in chronological order, preferring the earlier one on a tie, and never the requested one', () => {
      const requested = new Date('2026-11-08T02:00:00.000Z');
      expect(getAlternativeSlots(requested, [...slots, requested.toISOString()])).toEqual([
        '2026-11-08T01:00:00.000Z',
        '2026-11-08T01:30:00.000Z',
        '2026-11-08T02:30:00.000Z',
      ]);
    });

    it('should return fewer than three when fewer exist', () => {
      expect(getAlternativeSlots(new Date('2026-11-08T02:00:00.000Z'), ['2026-11-08T03:00:00.000Z'])).toEqual([
        '2026-11-08T03:00:00.000Z',
      ]);
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
