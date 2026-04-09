import { addDays, format } from 'date-fns';

export const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/**
 * Generates cycle details based on group configuration
 * @param {Object} group - The chit group object
 * @returns {Array} - Array of cycle objects with label, startDate, and endDate
 */
export const generateCycles = (group) => {
  const { 
    cycleMode = 'MONTHLY', 
    totalMonths: totalCycles, 
    startDate, 
    startMonth, 
    startYear, 
    cycleDuration 
  } = group;
  
  const cycles = [];
  const count = parseInt(totalCycles) || 0;

  if (cycleMode === 'MONTHLY') {
    let sm = startMonth;
    let sy = startYear;
    
    if (!sm && startDate) {
      const d = new Date(startDate);
      sm = MONTHS[d.getMonth()];
      sy = d.getFullYear().toString();
    }

    let currentMonthIdx = MONTHS.indexOf(sm?.toUpperCase());
    if (currentMonthIdx === -1) currentMonthIdx = 0;
    let currentYear = parseInt(sy) || new Date().getFullYear();
    
    for (let i = 1; i <= count; i++) {
      cycles.push({
        cycleNumber: i,
        label: `${MONTHS[currentMonthIdx]} ${currentYear}`,
        month: MONTHS[currentMonthIdx],
        year: currentYear,
        type: 'MONTHLY'
      });
      currentMonthIdx++;
      if (currentMonthIdx >= 12) {
        currentMonthIdx = 0;
        currentYear++;
      }
    }
  } else {
    // Weekly (7), Bi-Weekly (14), or Custom (cycleDuration)
    const duration = cycleMode === 'WEEKLY' ? 7 : cycleMode === 'BI-WEEKLY' ? 14 : parseInt(cycleDuration) || 1;
    let currentStartDate = startDate ? new Date(startDate) : new Date();

    for (let i = 1; i <= count; i++) {
      const currentEndDate = addDays(currentStartDate, duration - 1);
      cycles.push({
        cycleNumber: i,
        label: `${cycleMode === 'WEEKLY' ? 'Week' : 'Cycle'} ${i}`,
        startDate: currentStartDate,
        endDate: currentEndDate,
        dateLabel: `${format(currentStartDate, 'dd MMM')} - ${format(currentEndDate, 'dd MMM yyyy')}`,
        type: 'DATE_BASED'
      });
      currentStartDate = addDays(currentEndDate, 1);
    }
  }
  return cycles;
};
