export interface ParsedTask {
  description: string;
  time?: string;
  hasTime: boolean;
}

/**
 * Parse user input like "9am workout" or "call mom" into structured task data
 */
export function parseSmartInput(input: string): ParsedTask {
  const trimmed = input.trim();
  if (!trimmed) {
    return { description: '', hasTime: false };
  }

  // Time patterns to match
  const timePatterns = [
    // 9 am, 10 pm, 12 pm (with space)
    /^(\d{1,2})\s+(am|pm)\s+(.+)/i,
    // 9am, 10pm, 12pm (no space)
    /^(\d{1,2})(am|pm)\s+(.+)/i,
    // 9:30 am, 10:15 pm (with space)
    /^(\d{1,2}):(\d{2})\s+(am|pm)\s+(.+)/i,
    // 9:30am, 10:15pm (no space)
    /^(\d{1,2}):(\d{2})(am|pm)\s+(.+)/i,
    // 9:30, 14:30 (24-hour)
    /^(\d{1,2}):(\d{2})\s+(.+)/,
    // 9, 14 (assume hour only)
    /^(\d{1,2})\s+(.+)/,
  ];

  for (const pattern of timePatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      let time = '';
      let description = '';

      if (pattern.source.includes('am|pm')) {
        if (pattern.source.includes(':')) {
          // 9:30am or 9:30 am format
          let hour, minute, ampm, desc;
          if (pattern.source.includes('\\s+(am|pm)')) {
            // "9:30 am workout" format - groups: [full, hour, minute, ampm, desc]
            [, hour, minute, ampm, desc] = match;
          } else {
            // "9:30am workout" format - groups: [full, hour, minute, ampm, desc] 
            [, hour, minute, ampm, desc] = match;
          }
          let hour24 = parseInt(hour);
          if (ampm.toLowerCase() === 'pm' && hour24 !== 12) {
            hour24 += 12;
          } else if (ampm.toLowerCase() === 'am' && hour24 === 12) {
            hour24 = 0;
          }
          time = `${hour24.toString().padStart(2, '0')}:${minute}`;
          description = desc.trim();
        } else {
          // 9am or 9 am format
          let hour, ampm, desc;
          if (pattern.source.includes('\\s+(am|pm)')) {
            // "9 am workout" format - groups: [full, hour, ampm, desc]
            [, hour, ampm, desc] = match;
          } else {
            // "9am workout" format - groups: [full, hour, ampm, desc]
            [, hour, ampm, desc] = match;
          }
          let hour24 = parseInt(hour);
          if (ampm.toLowerCase() === 'pm' && hour24 !== 12) {
            hour24 += 12;
          } else if (ampm.toLowerCase() === 'am' && hour24 === 12) {
            hour24 = 0;
          }
          time = `${hour24.toString().padStart(2, '0')}:00`;
          description = desc.trim();
        }
      } else if (pattern.source.includes(':')) {
        // 9:30 format (24-hour assumed)
        const [, hour, minute, desc] = match;
        const hour24 = parseInt(hour);
        if (hour24 >= 0 && hour24 <= 23) {
          time = `${hour.padStart(2, '0')}:${minute}`;
          description = desc.trim();
        } else {
          // Invalid hour, treat as regular text
          return { description: trimmed, hasTime: false };
        }
      } else {
        // Single digit hour format
        const [, hour, desc] = match;
        const hour24 = parseInt(hour);
        if (hour24 >= 0 && hour24 <= 23) {
          time = `${hour.padStart(2, '0')}:00`;
          description = desc.trim();
        } else {
          // Invalid hour, treat as regular text
          return { description: trimmed, hasTime: false };
        }
      }

      if (description) {
        return { description, time, hasTime: true };
      }
    }
  }

  // No time pattern found, return as-is
  return { description: trimmed, hasTime: false };
}

/**
 * Examples:
 * parseSmartInput("9am workout") → { description: "workout", time: "09:00", hasTime: true }
 * parseSmartInput("9 am workout") → { description: "workout", time: "09:00", hasTime: true }
 * parseSmartInput("call mom") → { description: "call mom", time: undefined, hasTime: false }
 * parseSmartInput("2:30pm team meeting") → { description: "team meeting", time: "14:30", hasTime: true }
 * parseSmartInput("2:30 pm team meeting") → { description: "team meeting", time: "14:30", hasTime: true }
 */