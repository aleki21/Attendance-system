// utils/dateUtils.js
export class KenyaDateUtils {
  // Get current date in Kenya time (UTC+3)
  static getTodayInKenya() {
    const now = new Date();
    // Add 3 hours to UTC to get Kenya time
    const kenyaTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));
    return kenyaTime.toISOString().split('T')[0];
  }

  // Convert any date to Kenya time
  static toKenyaTime(dateString) {
    const date = new Date(dateString + 'T00:00:00.000Z');
    const kenyaTime = new Date(date.getTime() + (3 * 60 * 60 * 1000));
    return kenyaTime.toISOString().split('T')[0];
  }

  // Check if a date is today in Kenya
  static isTodayInKenya(dateString) {
    return this.getTodayInKenya() === dateString;
  }
}