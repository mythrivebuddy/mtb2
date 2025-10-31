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