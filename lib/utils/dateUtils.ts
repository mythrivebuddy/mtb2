// lib/dateUtils.ts

/**
 * Combines a date object/string with a time string (HH:mm) to create a new Date object.
 * @param date - The date part (e.g., "2025-10-26T00:00:00.000Z" or a Date object).
 * @param time - The time part (e.g., "14:30").
 * @returns A new Date object with the combined date and time.
 */
export const combineDateAndTime = (date: string | Date, time: string): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Split "HH:mm" into hours and minutes
  const [hours, minutes] = time.split(':').map(Number);
  
  // Create a new date object to avoid modifying the original one
  const newDate = new Date(dateObj.valueOf());
  
  // Set the hours and minutes for the new date object
  newDate.setHours(hours, minutes, 0, 0); 
  
  return newDate;
};


/* ---------------- HELPERS ---------------- */

export function getISTStartOfWeek(): Date {
  const d = getNowInIST();
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getISTEndOfWeek(): Date {
  const d = getISTStartOfWeek();
  d.setDate(d.getDate() + 7);
  return d;
}

export function getNowInIST(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 5.5 * 60 * 60 * 1000);
}


/* ---------------- HELPERS ---------------- */

export function getISTStartOfDay(): Date {
  const d = getNowInIST();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getISTEndOfDay(): Date {
  const d = getNowInIST();
  d.setHours(24, 0, 0, 0);
  return d;
}

