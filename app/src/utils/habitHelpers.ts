export const getMotivationalMessage = (completed: number, total: number, avgStreak: number): string => {
  const completionRate = total > 0 ? (completed / total) * 100 : 0;
  
  if (completionRate === 100) {
    return "Perfect day! You're absolutely crushing it! 🎉";
  } else if (completionRate >= 75) {
    return "You're doing amazing! Keep up the great work! 💪";
  } else if (completionRate >= 50) {
    return "Good progress today! You're on the right track! 🌟";
  } else if (avgStreak > 5) {
    return `Don't break your ${avgStreak}-day streak now! You've got this! 🔥`;
  } else {
    return "Every small step counts. Keep building those positive habits! 🌱";
  }
};

export const generateSuggestedTime = (title: string): string => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('morning') || lowerTitle.includes('wake') || lowerTitle.includes('workout')) {
    return '7:00 AM';
  } else if (lowerTitle.includes('evening') || lowerTitle.includes('bed') || lowerTitle.includes('read')) {
    return '8:00 PM';
  } else if (lowerTitle.includes('lunch') || lowerTitle.includes('noon')) {
    return '12:00 PM';
  } else {
    return '6:00 PM'; // Default time
  }
};