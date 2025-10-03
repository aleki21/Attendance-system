// Utility functions for Recharts compatibility

/**
 * Convert demographics data to Recharts Pie chart compatible format
 */
export const convertDemographicsToPieData = (demographics: any[]): Array<{ 
  name: string; 
  value: number; 
  percentage: number; 
  ageGroup: string;
  count: number;
}> => {
  return demographics.map(item => ({
    name: item.name || item.ageGroup || '',
    value: item.value || item.count || 0,
    percentage: item.percentage || 0,
    ageGroup: item.ageGroup || item.name || '',
    count: item.count || item.value || 0
  }));
};

/**
 * Convert gender attendance trends data for line charts
 */
export const convertGenderTrendsToLineData = (trends: any[]): Array<{
  date: string;
  male: number;
  female: number;
  total: number;
}> => {
  return trends.map(item => ({
    date: item.date,
    male: item.male || 0,
    female: item.female || 0,
    total: item.total || 0
  }));
};

/**
 * Convert attendance trends data for line charts
 */
export const convertToLineData = (trends: any[]): Array<{
  date: string;
  attendance: number;
  totalMembers: number;
  percentage: number;
}> => {
  return trends.map(item => ({
    date: item.date,
    attendance: item.attendance || 0,
    totalMembers: item.totalMembers || 0,
    percentage: item.percentage || 0
  }));
};

/**
 * Convert event attendance data for bar charts
 */
export const convertToBarData = (events: any[]): Array<{
  eventName: string;
  date: string;
  attendance: number;
  totalMembers: number;
  percentage: number;
}> => {
  return events.map(item => ({
    eventName: item.eventName || '',
    date: item.date || '',
    attendance: item.attendance || 0,
    totalMembers: item.totalMembers || 0,
    percentage: item.percentage || 0
  }));
};

/**
 * Generic data converter for Recharts compatibility
 */
export const convertToChartData = <T>(data: any[], defaultValues: Partial<T> = {}): T[] => {
  return data.map(item => ({
    ...defaultValues,
    ...item
  }));
};