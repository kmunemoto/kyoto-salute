import { create } from 'zustand';
import { myBookings } from '@/lib/dummyData';

export interface Booking {
  id: string;
  date: string;       // yyyy-MM-dd
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
  clientName: string;
}

// Convert time string to minutes since midnight
function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// Check if two 75-min blocks (60 session + 15 break) overlap
function blocksOverlap(startA: string, startB: string): boolean {
  const a = timeToMin(startA);
  const b = timeToMin(startB);
  return a < b + 75 && b < a + 75;
}

interface BookingStore {
  bookings: Booking[];
  addBooking: (booking: Booking) => void;
  removeBooking: (id: string) => void;
  isSlotBlocked: (date: string, startTime: string) => boolean;
  getBookingsForDate: (date: string) => Booking[];
}

export const useBookingStore = create<BookingStore>((set, get) => ({
  bookings: myBookings.map((b) => ({
    ...b,
    clientName: '田中 太郎',
  })),

  addBooking: (booking) =>
    set((state) => ({ bookings: [...state.bookings, booking] })),

  removeBooking: (id) =>
    set((state) => ({ bookings: state.bookings.filter((b) => b.id !== id) })),

  isSlotBlocked: (date, startTime) => {
    return get().bookings.some(
      (b) => b.date === date && blocksOverlap(b.startTime, startTime)
    );
  },

  getBookingsForDate: (date) => {
    return get().bookings.filter((b) => b.date === date);
  },
}));
