/**
 * Safely formats a date string, number, or Firestore Timestamp.
 * Prevents "Invalid Date" RangeErrors and crashes.
 */
export const safeFormatDate = (dateVal) => {
  if (!dateVal) return '--/--/----';
  
  try {
    let d = dateVal;
    
    // Handle Firestore Timestamp objects
    if (dateVal.toDate && typeof dateVal.toDate === 'function') {
      d = dateVal.toDate();
    } else if (typeof dateVal === 'string' || typeof dateVal === 'number') {
      d = new Date(dateVal);
    }
    
    if (!(d instanceof Date) || isNaN(d.getTime())) {
      return '--/--/----';
    }
    
    return d.toLocaleDateString();
  } catch (err) {
    console.warn("Date formatting error:", err);
    return '--/--/----';
  }
};

export const safeFormatTime = (dateVal, options = { hour: '2-digit', minute: '2-digit' }) => {
  if (!dateVal) return '--:--';
  
  try {
    let d = dateVal;
    
    // Handle Firestore Timestamp objects
    if (dateVal.toDate && typeof dateVal.toDate === 'function') {
      d = dateVal.toDate();
    } else if (typeof dateVal === 'string' || typeof dateVal === 'number') {
      d = new Date(dateVal);
    }
    
    if (!(d instanceof Date) || isNaN(d.getTime())) {
      return '--:--';
    }
    
    return d.toLocaleTimeString([], options);
  } catch (err) {
    console.warn("Time formatting error:", err);
    return '--:--';
  }
};
