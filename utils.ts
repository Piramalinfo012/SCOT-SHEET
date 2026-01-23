
import { parse, format, addDays, isToday, isBefore, isAfter, startOfDay, isValid, parseISO } from 'date-fns';

export const parseDateString = (dateStr: any) => {
  if (!dateStr) return new Date();
  
  // Handle ISO strings (e.g., "2026-04-30T18:30:00.000Z")
  if (typeof dateStr === 'string' && dateStr.includes('T')) {
    const isoDate = parseISO(dateStr);
    if (isValid(isoDate)) return isoDate;
  }

  try {
    const parsed = parse(String(dateStr), 'dd/MM/yyyy', new Date());
    if (isValid(parsed)) return parsed;
    
    // Fallback for JS Date strings
    const fallback = new Date(dateStr);
    return isValid(fallback) ? fallback : new Date();
  } catch {
    return new Date();
  }
};

export const formatDateString = (date: Date) => {
  return format(date, 'dd/MM/yyyy');
};

export const calculateCallingDate = (lastOrderDateStr: string, frequencyDays: number) => {
  const lastOrderDate = parseDateString(lastOrderDateStr);
  const callingDate = addDays(lastOrderDate, Number(frequencyDays) || 0);
  return formatDateString(callingDate);
};

export const getStatusColor = (followUpDateStr: string) => {
  const followUpDate = startOfDay(parseDateString(followUpDateStr));
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
  const date = startOfDay(parseDateString(dateStr));
  const today = startOfDay(new Date());
  return isBefore(date, today);
};

export const isUpcoming = (dateStr: string, days: number = 7) => {
  const date = startOfDay(parseDateString(dateStr));
  const today = startOfDay(new Date());
  const future = addDays(today, days);
  return isAfter(date, today) && isBefore(date, future);
};
