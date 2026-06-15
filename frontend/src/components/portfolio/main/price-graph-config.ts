import { format, parseISO } from "date-fns";

const maxLength = 100;

export const TIME_RANGE_CONFIG = {
    '1H': {
      interval: '1m',
      limit: maxLength,
      duration: 60 * 60 * 1000,
      xAxisFormat: 'mm:ss',
      tickInterval: 20,
      tickFormatter: (date: string) => format(parseISO(date), 'HH:mm:ss')
    },
    '1D': {
      interval: '1m',
      limit: maxLength,
      duration: 24 * 60 * 60 * 1000,
      xAxisFormat: 'HH:mm',
      tickInterval: 10,
      tickFormatter: (date: string) => format(parseISO(date), 'HH:mm')
    },
    '7D': {
      interval: '4h',
      limit: maxLength,
      duration: 7 * 24 * 60 * 60 * 1000,
      xAxisFormat: 'MMM d',
      tickInterval: 5,
      tickFormatter: (date: string) => format(parseISO(date), 'dd')
    },
    '14D': {
      interval: '12h',
      limit: maxLength,
      duration: 14 * 24 * 60 * 60 * 1000,
      xAxisFormat: 'MMM d',
      tickInterval: 2,
      tickFormatter: (date: string) => format(parseISO(date), 'MMM dd')
    },
    '1M': {
      interval: '1d',
      limit: maxLength,
      duration: 30 * 24 * 60 * 60 * 1000,
      xAxisFormat: 'd MMM',
      tickInterval: 2,
      tickFormatter: (date: string) => {
        const parsedDate = parseISO(date);
        return `${format(parsedDate, 'd')} ${format(parsedDate, 'MMM')}`;
      }
    },
    '1Y': {
      interval: '1w',
      limit: maxLength,
      duration: 365 * 24 * 60 * 60 * 1000,
      xAxisFormat: 'MMM dd',
      tickInterval: 7,
      tickFormatter: (date: string) => format(parseISO(date), 'MMM dd')
    },
    'ALL': {
      interval: '1M',
      limit: maxLength,
      duration: 50 * 365 * 24 * 60 * 60 * 1000,
      xAxisFormat: 'MMM yyyy',
      tickInterval: 12,
      tickFormatter: (date: string) => format(parseISO(date), 'MMM yyyy')
    }
};
