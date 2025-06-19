export function getMonthStartEndDates() {
  const now = new Date();

  // Start of the month
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);

  // End of the month
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Format to YYYY-MM-DD
  const format = (date) => date.toISOString().split('T')[0];

  return {
    start: format(startDate),
    end: format(endDate),
  };
}