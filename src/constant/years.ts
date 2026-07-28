const currentYear = new Date().getFullYear();

export const years = [
  { value: `${currentYear}-${currentYear + 1}`, label: `${currentYear}-${currentYear + 1}` },
  { value: `${currentYear - 1}-${currentYear}`, label: `${currentYear - 1}-${currentYear}` },
  { value: `${currentYear - 2}-${currentYear - 1}`, label: `${currentYear - 2}-${currentYear - 1}` },
];
