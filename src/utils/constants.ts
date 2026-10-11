export const MONTH_NAMES_FULL = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const MONTH_NAMES_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

export const getMonthName = (monthNum: number, full: boolean = true): string => {
  if (monthNum >= 1 && monthNum <= 12) {
    return full ? MONTH_NAMES_FULL[monthNum - 1] : MONTH_NAMES_SHORT[monthNum - 1];
  }
  return String(monthNum);
};