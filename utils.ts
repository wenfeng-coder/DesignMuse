
import { format, startOfWeek, addWeeks, addDays, getWeek } from 'date-fns';

export const getWeekId = (date: Date): string => {
  return `${date.getFullYear()}-W${getWeek(date)}`;
};

export const getWeekRangeDisplay = (date: Date): string => {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = addDays(start, 6);
  return `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`;
};

export const getDayKey = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const getRandomDecor = (): 'tape' | 'pin' | 'clip' | 'washi' => {
  const types: Array<'tape' | 'pin' | 'clip' | 'washi'> = ['tape', 'pin', 'clip', 'washi'];
  return types[Math.floor(Math.random() * types.length)];
};

export const getRandomRotation = (): number => {
  return (Math.random() - 0.5) * 6; // -3 to 3 degrees
};
