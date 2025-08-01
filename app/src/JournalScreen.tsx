import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  FlatList, 
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useAuth } from './services/auth';
import { apiClient, JournalEntry, AIInsight, isApiError, handleApiError } from './services/api';
import { DailyTimeline } from './components/journal';

interface MoodDay {
  date: string;
  mood: number;
  hasEntry: boolean;
}

const moodEmojis: { [key: number]: string } = {
  1: '😢', 2: '😔', 3: '😐', 4: '🙂', 5: '😊',
  6: '😄', 7: '😁', 8: '🤩', 9: '😍', 10: '🥳'
};

const getMoodColor = (mood: number): string => {
  if (mood <= 3) return '#F56565';
  if (mood <= 6) return '#ED8936';
  if (mood <= 8) return '#38A169';
  return '#3182CE';
};

export default function JournalScreen() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'write' | 'history' | 'insights'>('write');
  const [journalContent, setJournalContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<number>(5.0);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [moodCalendar, setMoodCalendar] = useState<MoodDay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTimelineLoading, setIsTimelineLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreEntries, setHasMoreEntries] = useState(true);

  // Load journal entries
  const loadJournalEntries = useCallback(async (page: number = 1, append: boolean = false) => {
    if (!isAuthenticated || !user) return;

    try {
      if (!append) setIsLoading(true);

      const response = await apiClient.getJournalEntries({
        limit: 10,
        // Add pagination logic here when API supports it
      });

      if (isApiError(response)) {
        throw new Error(handleApiError(response));
      }

      const entries = response.data || [];
      
      if (append) {
        setJournalEntries(prev => [...prev, ...entries]);
      } else {
        setJournalEntries(entries);
      }

      setHasMoreEntries(entries.length === 10);
      
      // Generate mood calendar from entries
      generateMoodCalendar(entries);

    } catch (error) {
      console.error('Failed to load journal entries:', error);
      Alert.alert('Error', 'Failed to load journal entries. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Load timeline data
  const loadTimelineData = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      setIsTimelineLoading(true);

      const response = await apiClient.getJournalTimeline({
        days: 14,
        limit: 20,
      });

      if (isApiError(response)) {
        throw new Error(handleApiError(response));
      }

      setTimelineData(response.data || []);

    } catch (error) {
      console.error('Failed to load timeline data:', error);
      Alert.alert('Error', 'Failed to load timeline data. Please try again.');
    } finally {
      setIsTimelineLoading(false);
    }
  }, [isAuthenticated, user]);

  // Load AI insights
  const loadInsights = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      const response = await apiClient.getInsights({
        type: 'PATTERN_DETECTION',
        limit: 5,
      });

      if (!isApiError(response) && response.data) {
        setInsights(response.data);
      }
    } catch (error) {
      console.error('Failed to load insights:', error);
    }
  }, [isAuthenticated, user]);

  // Generate mood calendar from journal entries
  const generateMoodCalendar = (entries: JournalEntry[]) => {
    const calendar: MoodDay[] = [];
    const today = new Date();
    
    // Generate last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const entry = entries.find(e => 
        e.createdAt.split('T')[0] === dateString
      );
      
      calendar.push({
        date: dateString,
        mood: entry?.moodRating || 0,
        hasEntry: !!entry,
      });
    }
    
    setMoodCalendar(calendar);
  };

  // Submit journal entry
  const submitJournalEntry = async () => {
    if (!isAuthenticated || !user) {
      Alert.alert('Error', 'Please sign in to save journal entries.');
      return;
    }

    if (!journalContent.trim()) {
      Alert.alert('Error', 'Please write something before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await apiClient.createJournalEntry({
        content: journalContent.trim(),
        moodRating: Math.round(selectedMood),
      });

      if (isApiError(response)) {
        throw new Error(handleApiError(response));
      }

      // Clear form
      setJournalContent('');
      setSelectedMood(5.0);
      
      // Refresh entries and timeline
      await Promise.all([
        loadJournalEntries(),
        loadTimelineData(),
      ]);
      
      // Switch to history tab to show the new entry
      setActiveTab('history');
      
      Alert.alert('Success', 'Journal entry saved successfully!');

    } catch (error) {
      console.error('Failed to submit journal entry:', error);
      Alert.alert('Error', 'Failed to save journal entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Refresh all data
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      loadJournalEntries(),
      loadTimelineData(),
      loadInsights(),
    ]);
    setIsRefreshing(false);
  }, [loadJournalEntries, loadTimelineData, loadInsights]);

  // Load data when component mounts or user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      loadJournalEntries();
      loadTimelineData();
      loadInsights();
    }
  }, [isAuthenticated, user, loadJournalEntries, loadTimelineData, loadInsights]);

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Render mood calendar
  const renderMoodCalendar = () => (
    <View style={styles.moodCalendarContainer}>
      <Text style={styles.sectionTitle}>30-Day Mood Calendar</Text>
      <View style={styles.moodCalendar}>
        {moodCalendar.map((day, index) => (
          <View
            key={day.date}
            style={[
              styles.moodDay,
              {
                backgroundColor: day.hasEntry 
                  ? getMoodColor(day.mood)
                  : '#E2E8F0'
              }
            ]}
          >
            <Text style={[
              styles.moodDayText,
              { color: day.hasEntry ? '#fff' : '#64748B' }
            ]}>
              {new Date(day.date).getDate()}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.moodLegend}>
        <Text style={styles.legendText}>Low 😢</Text>
        <Text style={styles.legendText}>😐</Text>
        <Text style={styles.legendText}>High 🥳</Text>
      </View>
    </View>
  );

  // Render write tab
  const renderWriteTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.writeContainer}>
        <Text style={styles.sectionTitle}>How are you feeling today?</Text>
        
        {/* Mood Selector */}
        <View style={styles.moodSelector}>
          <Text style={styles.moodLabel}>Mood Rating: {selectedMood.toFixed(1)}/10</Text>
          <View style={styles.sliderContainer}>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>😢 Low</Text>
              <Text style={styles.sliderLabelText}>High 🥳</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              value={selectedMood}
              onValueChange={(value: number) => setSelectedMood(Math.round(value * 10) / 10)}
              minimumTrackTintColor="#4F8EF7"
              maximumTrackTintColor="#E2E8F0"
              thumbStyle={styles.sliderThumb}
              trackStyle={styles.sliderTrack}
            />
            <View style={styles.moodIndicator}>
              <Text style={styles.moodIndicatorEmoji}>{moodEmojis[Math.round(selectedMood)]}</Text>
            </View>
          </View>
        </View>

        {/* Journal Input */}
        <View style={styles.journalInputContainer}>
          <Text style={styles.inputLabel}>Write about your day:</Text>
          <TextInput
            style={styles.journalInput}
            value={journalContent}
            onChangeText={setJournalContent}
            placeholder="How was your day? What happened? How did you feel? What are you grateful for?"
            multiline
            numberOfLines={10}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={submitJournalEntry}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Save Entry</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // Handle navigation from timeline
  const handleViewJournal = (date: string, entryId?: string) => {
    if (entryId) {
      // Navigate to specific journal entry
      const entry = journalEntries.find(e => e.id === entryId);
      if (entry) {
        Alert.alert(
          'Journal Entry',
          `${formatDate(entry.createdAt)}\n\n${entry.content}`,
          [
            { text: 'Close', style: 'cancel' },
            { text: 'Edit', onPress: () => {
              // Switch to write tab and populate with entry content
              setJournalContent(entry.content);
              if (entry.moodRating) {
                setSelectedMood(entry.moodRating);
              }
              setActiveTab('write');
            }}
          ]
        );
      }
    } else {
      // Show entries for that date
      const dateEntries = journalEntries.filter(e => 
        e.createdAt.startsWith(date)
      );
      
      if (dateEntries.length > 0) {
        Alert.alert(
          `Journal Entries for ${date}`,
          `Found ${dateEntries.length} ${dateEntries.length === 1 ? 'entry' : 'entries'} for this date.`,
          [
            { text: 'Close', style: 'cancel' },
            { text: 'View All', onPress: () => setActiveTab('history') }
          ]
        );
      } else {
        Alert.alert(
          'No Journal Entries',
          `No journal entries found for ${date}. Would you like to create one?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Write Entry', onPress: () => {
              setJournalContent(`Entry for ${date}: `);
              setActiveTab('write');
            }}
          ]
        );
      }
    }
  };

  const handleViewHabits = (date: string) => {
    // Get habit data for that date from timeline
    const dayData = timelineData.find(d => d.date === date);
    if (dayData && dayData.habits.length > 0) {
      const completedHabits = dayData.habits.filter(h => h.status === 'completed').length;
      const totalHabits = dayData.habits.length;
      
      const habitsList = dayData.habits.map(h => 
        `${getHabitStatusEmoji(h)} ${h.title}`
      ).join('\n');
      
      Alert.alert(
        `Habits for ${date}`,
        `Progress: ${completedHabits}/${totalHabits} completed\n\n${habitsList}`,
        [
          { text: 'Close', style: 'cancel' },
          { text: 'Go to Habits', onPress: () => {
            // In a real app, this would navigate to the habits screen
            Alert.alert('Navigation', 'Would navigate to Habits screen');
          }}
        ]
      );
    } else {
      Alert.alert(
        'No Habit Data',
        `No habit data found for ${date}.`,
        [{ text: 'OK' }]
      );
    }
  };

  // Helper function to get habit status emoji (duplicate from DailyTimelineEntry)
  const getHabitStatusEmoji = (habit: any): string => {
    switch (habit.status) {
      case 'completed':
        return habit.habitType === 'BUILD' ? '✅' : '🚫';
      case 'skipped':
        return '⏸️';
      default:
        return '⏳';
    }
  };

  // Render history tab
  const renderHistoryTab = () => (
    <View style={styles.tabContentFull}>
      <View style={styles.historyHeader}>
        {renderMoodCalendar()}
      </View>
      
      <DailyTimeline
        timelineData={timelineData}
        loading={isTimelineLoading}
        onViewJournal={handleViewJournal}
        onViewHabits={handleViewHabits}
        emptyMessage="No journal entries yet. Start writing to track your thoughts and moods!"
      />
    </View>
  );

  // Render insights tab
  const renderInsightsTab = () => (
    <ScrollView 
      style={styles.tabContent} 
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={['#4F8EF7']}
          tintColor="#4F8EF7"
        />
      }
    >
      <Text style={styles.sectionTitle}>AI Pattern Insights</Text>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F8EF7" />
          <Text style={styles.loadingText}>Analyzing your patterns...</Text>
        </View>
      ) : insights.length > 0 ? (
        insights.map((insight, index) => (
          <View key={insight.id} style={styles.insightCard}>
            <Text style={styles.insightTitle}>
              🧠 Pattern Analysis #{index + 1}
            </Text>
            <Text style={styles.insightContent}>{insight.content}</Text>
            <Text style={styles.insightDate}>
              Generated: {formatDate(insight.createdAt)}
            </Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Write more journal entries to see AI-powered pattern insights about your moods and thoughts.
          </Text>
        </View>
      )}
    </ScrollView>
  );

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.authPrompt}>Please sign in to access your journal</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'write' && styles.activeTab]}
          onPress={() => setActiveTab('write')}
        >
          <Text style={[styles.tabText, activeTab === 'write' && styles.activeTabText]}>
            ✍️ Write
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            📚 History
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'insights' && styles.activeTab]}
          onPress={() => setActiveTab('insights')}
        >
          <Text style={[styles.tabText, activeTab === 'insights' && styles.activeTabText]}>
            🧠 Insights
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'write' && renderWriteTab()}
      {activeTab === 'history' && renderHistoryTab()}
      {activeTab === 'insights' && renderInsightsTab()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  authPrompt: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingTop: 10,
    paddingBottom: 5,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4F8EF7',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  activeTabText: {
    color: '#4F8EF7',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  tabContentFull: {
    flex: 1,
  },
  historyHeader: {
    padding: 16,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 16,
  },
  writeContainer: {
    flex: 1,
  },
  moodSelector: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  moodLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2D3748',
    marginBottom: 12,
    textAlign: 'center',
  },
  sliderContainer: {
    marginTop: 8,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sliderLabelText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 16,
  },
  sliderThumb: {
    backgroundColor: '#4F8EF7',
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
  },
  moodIndicator: {
    alignItems: 'center',
  },
  moodIndicatorEmoji: {
    fontSize: 32,
  },
  journalInputContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2D3748',
    marginBottom: 12,
  },
  journalInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 150,
    textAlignVertical: 'top',
    backgroundColor: '#FAFAFA',
  },
  submitButton: {
    backgroundColor: '#4F8EF7',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  moodCalendarContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  moodCalendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  moodDay: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  moodDayText: {
    fontSize: 12,
    fontWeight: '500',
  },
  moodLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  legendText: {
    fontSize: 12,
    color: '#64748B',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  journalEntryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryDate: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  moodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moodBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  entryContent: {
    fontSize: 14,
    color: '#2D3748',
    lineHeight: 20,
  },
  insightCard: {
    backgroundColor: '#F0FFF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#38A169',
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22543D',
    marginBottom: 8,
  },
  insightContent: {
    fontSize: 14,
    color: '#2F855A',
    lineHeight: 20,
    marginBottom: 8,
  },
  insightDate: {
    fontSize: 12,
    color: '#68D391',
    fontStyle: 'italic',
  },
});