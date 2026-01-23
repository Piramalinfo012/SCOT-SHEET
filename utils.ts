
import { parse, format, addDays, isToday, isBefore, isAfter, startOfDay, isValid, parseISO } from 'date-fns';

export const parseDateString = (dateStr: any) => {
  // Defensive checks for null, undefined, or empty strings
  if (!dateStr || dateStr === 'N/A' || String(dateStr).trim() === '') {
    return new Date(1970, 0, 1); // Return an old date as fallback
  }
  
  // Handle ISO strings (e.g., "2026-04-30T18:30:00.000Z")
  if (typeof dateStr === 'string' && dateStr.includes('T')) {
    const isoDate = parseISO(dateStr);
    if (isValid(isoDate)) return isoDate;
  }

  try {
    // Attempt standard format used in sheets
    const parsed = parse(String(dateStr), 'dd/MM/yyyy', new Date());
    if (isValid(parsed)) return parsed;
    
    // Fallback for generic JS Date parsing
    const fallback = new Date(dateStr);
    return isValid(fallback) ? fallback : new Date(1970, 0, 1);
  } catch {
    return new Date(1970, 0, 1);
  }
};

export const formatDateString = (date: Date) => {
  if (!isValid(date)) return 'N/A';
  return format(date, 'dd/MM/yyyy');
};

export const calculateCallingDate = (lastOrderDateStr: string, frequencyDays: number) => {
  const lastOrderDate = parseDateString(lastOrderDateStr);
  if (!isValid(lastOrderDate) || lastOrderDate.getFullYear() <= 1970) return 'N/A';
  const callingDate = addDays(lastOrderDate, Number(frequencyDays) || 0);
  return formatDateString(callingDate);
};

export const getStatusColor = (followUpDateStr: string) => {
  const date = parseDateString(followUpDateStr);
  if (!isValid(date) || date.getFullYear() <= 1970) return 'blue';

  const followUpDate = startOfDay(date);
  const today = startOfDay(new Date());

  if (isBefore(followUpDate, today)) {
    return 'red';
  } else if (isToday(followUpDate)) {
    return 'orange';
  } else {
    return 'blue';
  }
};

export const isOverdue = (dateStr: string) => {
  const date = parseDateString(dateStr);
  if (!isValid(date) || date.getFullYear() <= 1970) return false;
  
  const followUpDate = startOfDay(date);
  const today = startOfDay(new Date());
  return isBefore(followUpDate, today);
};

export const isUpcoming = (dateStr: string, days: number = 7) => {
  const date = parseDateString(dateStr);
  if (!isValid(date) || date.getFullYear() <= 1970) return false;

  const followUpDate = startOfDay(date);
  const today = startOfDay(new Date());
  const future = addDays(today, days);
  return isAfter(followUpDate, today) && isBefore(followUpDate, future);
};
