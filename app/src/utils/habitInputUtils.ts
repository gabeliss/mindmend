/**
 * Determines appropriate maximum value for quantity inputs based on the unit type
 * This ensures sliders have sensible ranges for different types of measurements
 */
export const getSmartMaxValue = (unit: string): number => {
  const unitLower = unit.toLowerCase().trim();
  
  // High-value units (steps, calories, etc.)
  if (unitLower.includes('step') || unitLower.includes('calorie') || unitLower.includes('cal')) {
    return 20000;
  }
  
  // Medium-value units (words, points, etc.)  
  if (unitLower.includes('word') || unitLower.includes('point') || unitLower.includes('rep')) {
    return 1000;
  }
  
  // Time-based units (minutes, seconds, etc.)
  if (unitLower.includes('minute') || unitLower.includes('min') || unitLower.includes('second')) {
    return 500;
  }
  
  // Distance units (miles, km, etc.)
  if (unitLower.includes('mile') || unitLower.includes('km') || unitLower.includes('kilometer')) {
    return 100;
  }
  
  // Standard units (pages, glasses, sets, etc.)
  return 2000;
};

/**
 * Common unit suggestions for different types of habits
 */
export const getUnitSuggestions = (habitType: 'quantity' | 'duration'): string[] => {
  if (habitType === 'quantity') {
    return [
      'pages',
      'glasses',
      'steps',
      'reps',
      'sets',
      'calories',
      'words',
      'points',
      'miles',
      'km',
      'hours',
      'minutes'
    ];
  }
  
  if (habitType === 'duration') {
    return ['minutes', 'hours'];
  }
  
  return [];
};