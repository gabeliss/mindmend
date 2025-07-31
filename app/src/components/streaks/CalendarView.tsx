import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface CalendarDay {
  date: number;
  dayName: string;
  isCompleted: boolean;
  isSkipped: boolean;
  isToday: boolean;
  isEditable: boolean;
  fullDate: string;
}

interface CalendarViewProps {
  calendarData: CalendarDay[];
  onDayTap: (day: CalendarDay) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ calendarData, onDayTap }) => {
  return (
    <View style={styles.calendarContainer}>
      <Text style={styles.calendarTitle}>Last 7 days</Text>
      <View style={styles.calendarGrid}>
        {calendarData.map((day, index) => (
          <View key={index} style={styles.calendarDay}>
            <Text style={styles.dayName}>{day.dayName}</Text>
            <TouchableOpacity 
              style={[
                styles.dayCircle,
                day.isCompleted && styles.completedDay,
                day.isSkipped && styles.skippedDay,
                day.isToday && styles.todayCircle
              ]}
              onPress={() => onDayTap(day)}
              disabled={!day.isEditable}
              activeOpacity={day.isEditable ? 0.7 : 1}
            >
              <Text style={[
                styles.dayNumber,
                day.isCompleted && styles.completedDayText,
                day.isSkipped && styles.skippedDayText,
                day.isToday && !day.isCompleted && !day.isSkipped && styles.todayText
              ]}>
                {day.date}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  calendarContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  calendarTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarDay: {
    alignItems: 'center',
    flex: 1,
  },
  dayName: {
    fontSize: 10,
    color: '#94A3B8',
    marginBottom: 4,
    fontWeight: '500',
  },
  dayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  completedDay: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  skippedDay: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  todayCircle: {
    borderColor: '#4F8EF7',
    borderWidth: 2,
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  completedDayText: {
    color: '#fff',
  },
  skippedDayText: {
    color: '#fff',
  },
  todayText: {
    color: '#4F8EF7',
    fontWeight: '700',
  },
});