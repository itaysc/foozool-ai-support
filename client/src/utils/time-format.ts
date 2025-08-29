/**
 * Converts time strings like "2h", "30m", "1d" to human-readable format
 * @param timeString - Time string in format like "2h", "30m", "1d"
 * @returns Human-readable string like "2 hours", "30 minutes", "1 day"
 */
export const formatTimeString = (timeString: string): string => {
  if (!timeString || typeof timeString !== 'string') {
    return '';
  }

  const normalized = timeString.trim().toLowerCase();
  
  // Extract hours
  const hoursMatch = normalized.match(/(\d+(?:\.\d+)?)h/);
  if (hoursMatch) {
    const hours = parseFloat(hoursMatch[1]);
    if (hours === 1) {
      return '1 hour';
    } else if (hours === 0.5) {
      return '30 minutes';
    } else if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
  }
  
  // Extract minutes
  const minutesMatch = normalized.match(/(\d+)m/);
  if (minutesMatch) {
    const minutes = parseInt(minutesMatch[1]);
    if (minutes === 1) {
      return '1 minute';
    } else {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  }
  
  // Extract days
  const daysMatch = normalized.match(/(\d+)d/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    if (days === 1) {
      return '1 day';
    } else {
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
  }
  
  // Handle pure number input (assume minutes)
  if (/^\d+$/.test(normalized)) {
    const minutes = parseInt(normalized);
    if (minutes === 1) {
      return '1 minute';
    } else {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  }
  
  return timeString; // Return original if no pattern matches
};

/**
 * Converts time strings to milliseconds
 * @param timeString - Time string in format like "2h", "30m", "1d"
 * @returns Time in milliseconds
 */
export const timeStringToMs = (timeString: string): number => {
  if (!timeString || typeof timeString !== 'string') {
    return 0;
  }
  
  const normalized = timeString.trim().toLowerCase();
  
  // Extract hours (supports decimal: 1.5h = 1 hour 30 minutes)
  let hours = 0;
  let minutes = 0;
  
  const hoursMatch = normalized.match(/(\d+(?:\.\d+)?)h/);
  if (hoursMatch) {
    const hourValue = parseFloat(hoursMatch[1]);
    hours = Math.floor(hourValue);
    minutes = Math.round((hourValue - hours) * 60);
  }
  
  // Extract minutes
  const minutesMatch = normalized.match(/(\d+)m/);
  if (minutesMatch) {
    minutes += parseInt(minutesMatch[1]);
  }
  
  // Extract days
  const daysMatch = normalized.match(/(\d+)d/);
  if (daysMatch) {
    hours += parseInt(daysMatch[1]) * 24;
  }
  
  // Handle pure number input (assume minutes)
  if (!hoursMatch && !minutesMatch && !daysMatch && /^\d+$/.test(normalized)) {
    minutes = parseInt(normalized);
  }
  
  // Convert to milliseconds
  const totalMs = (hours * 60 * 60 * 1000) + (minutes * 60 * 1000);
  
  // Ensure minimum value (1 minute)
  return Math.max(totalMs, 60 * 1000);
};

/**
 * Converts milliseconds to human-readable time format
 * @param milliseconds - Time in milliseconds
 * @returns Human-readable string like "2 hours 30 minutes"
 */
export const msToTimeString = (milliseconds: number): string => {
  if (!milliseconds || milliseconds < 0) {
    return '0 minutes';
  }
  
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0 && minutes > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
};
