export function relativeTime(time: Date, locale: string, now = new Date()) {
  const seconds = (time.getTime() - now.getTime()) / 1000;
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (Math.abs(seconds) < 60) return format.format(0, 'second');
  const [unit, divisor]: [Intl.RelativeTimeFormatUnit, number] = Math.abs(seconds) < 3600
    ? ['minute', 60] : Math.abs(seconds) < 86400 ? ['hour', 3600] : ['day', 86400];
  return format.format(Math.round(seconds / divisor), unit);
}
