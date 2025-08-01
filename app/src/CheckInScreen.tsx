import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { useAuth } from './services/auth';
import { apiClient, isApiError, handleApiError } from './services/api';
import { TodaysContextSection, QuickMoodEntry } from './components/checkin';

interface Question {
  text: string;
  type: 'text' | 'mindset' | 'mood';
  prefill?: string;
}

const morningQuestions: Question[] = [
  { text: "What's your #1 goal today?", type: 'text', prefill: 'Stay focused on work and avoid social media' },
  { text: "Any urges last night?", type: 'text', prefill: 'Had some cravings around 9pm but managed them' },
  { text: "What could go wrong today?", type: 'text', prefill: 'Stress from meetings might trigger browsing' },
  { text: "How are you feeling right now?", type: 'mood' },
  { text: "Choose your mindset today", type: 'mindset' }
];

const eveningQuestions: Question[] = [
  { text: "Did you follow through on your goals today?", type: 'text', prefill: 'Mostly yes, had one slip around lunch' },
  { text: "Did you relapse or get distracted?", type: 'text', prefill: 'Brief phone check but caught myself' },
  { text: "What triggered any slip-ups?", type: 'text', prefill: 'Stress is still my biggest trigger' },
  { text: "How do you feel about today overall?", type: 'mood' },
  { text: "How do you feel right now?", type: 'text', prefill: 'Proud but aware I need to stay vigilant' }
];

const moodEmojis = [
  { emoji: '😤', label: 'Determined', value: 8 },
  { emoji: '😌', label: 'Calm', value: 7 },
  { emoji: '💪', label: 'Strong', value: 8 },
  { emoji: '🎯', label: 'Focused', value: 7 },
  { emoji: '🌟', label: 'Optimistic', value: 9 },
  { emoji: '🧘', label: 'Mindful', value: 7 },
  { emoji: '😔', label: 'Down', value: 3 },
  { emoji: '😰', label: 'Anxious', value: 4 },
  { emoji: '😊', label: 'Happy', value: 8 },
  { emoji: '😴', label: 'Tired', value: 5 }
];

const mindsetOptions = [
  { emoji: '🛡️', label: 'Defensive' },
  { emoji: '⚔️', label: 'Warrior' },
  { emoji: '🧘', label: 'Zen' },
  { emoji: '🎯', label: 'Laser-focused' },
  { emoji: '🌊', label: 'Go with flow' },
  { emoji: '🔥', label: 'Intense' }
];

export default function CheckInScreen() {
  const { user, isAuthenticated } = useAuth();
  const [tab, setTab] = useState<'morning' | 'evening'>('morning');
  const [responses, setResponses] = useState<string[]>(['', '', '', '', '']);
  const [selectedMood, setSelectedMood] = useState<{emoji: string, label: string, value: number} | null>(null);
  const [selectedMindset, setSelectedMindset] = useState<{emoji: string, label: string} | null>(null);
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [isRecording, setIsRecording] = useState<number | null>(null);
  const [showPrefills, setShowPrefills] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  
  // Context data state
  const [contextData, setContextData] = useState<any>(null);
  const [contextLoading, setContextLoading] = useState(true);
  
  const questions = tab === 'morning' ? morningQuestions : eveningQuestions;
  
  // Generate AI feedback for check-in responses
  const generateAIFeedback = async (checkInType: 'morning' | 'evening', userResponses: string[], mood?: number) => {
    try {
      setIsLoadingFeedback(true);
      
      // Create a comprehensive check-in summary for AI
      const checkInSummary = `
${checkInType.toUpperCase()} CHECK-IN:
${questions.map((q, i) => `${q.text}: ${userResponses[i] || 'No response'}`).join('\n')}
Mood Rating: ${mood || 'Not selected'}
Selected Mindset: ${selectedMindset?.label || 'Not selected'}
      `.trim();

      // Create journal entry with the check-in data
      const journalResponse = await apiClient.createJournalEntry({
        content: checkInSummary,
        moodRating: mood,
      });

      if (isApiError(journalResponse)) {
        throw new Error(handleApiError(journalResponse));
      }

      // Try to get AI insights
      try {
        const insightsResponse = await apiClient.generateDailyInsights();
        if (!isApiError(insightsResponse) && insightsResponse.data) {
          const dailyTip = insightsResponse.data.find(insight => insight.insightType === 'DAILY_TIP');
          if (dailyTip) {
            return dailyTip.content;
          }
        }
      } catch (insightError) {
        console.log('AI insights not available, using fallback feedback');
      }

      // Fallback feedback based on responses and mood
      return generateFallbackFeedback(checkInType, userResponses, mood);

    } catch (error) {
      console.error('Failed to generate AI feedback:', error);
      return generateFallbackFeedback(checkInType, userResponses, mood);
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  const generateFallbackFeedback = (checkInType: 'morning' | 'evening', userResponses: string[], mood?: number): string => {
    const morningFeedback = [
      "Great mindset! Starting your day with intention will help you stay on track.",
      "I love that you're anticipating challenges. That self-awareness is your superpower.",
      "Solid goal setting. Remember: progress over perfection today.",
      "Your morning reflection shows real growth. Trust the process.",
      "Setting clear intentions for the day ahead. You've got this!"
    ];
    
    const eveningFeedback = [
      "Honesty is the first step to lasting change. Tomorrow's a fresh start.",
      "You caught yourself - that's the awareness muscle getting stronger!",
      "Recognizing your triggers puts you in control. Well done.",
      "Your self-reflection is impressive. Keep building on these insights.",
      "Every day of awareness is progress. Celebrate the small wins!"
    ];

    // Add mood-based feedback
    let moodFeedback = '';
    if (mood) {
      if (mood >= 8) {
        moodFeedback = " Your positive energy is contagious!";
      } else if (mood >= 6) {
        moodFeedback = " You're finding your balance - keep it up.";
      } else if (mood >= 4) {
        moodFeedback = " Tomorrow is a new opportunity to feel better.";
      } else {
        moodFeedback = " Be gentle with yourself. You're doing the best you can.";
      }
    }
    
    const feedbackList = checkInType === 'morning' ? morningFeedback : eveningFeedback;
    const baseFeedback = feedbackList[Math.floor(Math.random() * feedbackList.length)];
    
    return baseFeedback + moodFeedback;
  };
  
  const handleResponseChange = (index: number, text: string) => {
    const newResponses = [...responses];
    newResponses[index] = text;
    setResponses(newResponses);
  };
  
  const handleSubmit = async () => {
    if (!isAuthenticated || !user) {
      Alert.alert('Error', 'Please sign in to submit your check-in.');
      return;
    }

    // Validate that at least some responses are provided
    const hasResponses = responses.some(response => response.trim().length > 0);
    if (!hasResponses && !selectedMood) {
      Alert.alert('Incomplete Check-in', 'Please answer at least one question or select your mood.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Submit check-in data to backend
      const checkInData = {
        checkInType: tab,
        responses,
        mood: selectedMood,
        mindset: selectedMindset,
      };
      
      const submitResponse = await apiClient.submitCheckIn(checkInData);
      if (!submitResponse.success) {
        throw new Error('Failed to submit check-in');
      }
      
      const feedback = await generateAIFeedback(tab, responses, selectedMood?.value);
      setAiFeedback(feedback);

      // Show success message
      Alert.alert(
        'Check-in Complete!', 
        'Your reflection has been saved and you\'ll see personalized insights.',
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Failed to submit check-in:', error);
      Alert.alert(
        'Submission Failed',
        'Failed to save your check-in. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleVoiceRecord = (index: number) => {
    if (isRecording === index) {
      setIsRecording(null);
      // Simulate voice transcription - in real app, integrate with speech-to-text
      setTimeout(() => {
        const mockTranscriptions = [
          "I feel determined to stay focused today and avoid my usual triggers.",
          "Had some urges last night but I managed to redirect my attention to reading.",
          "I'm worried that work stress might make me seek distractions today.",
          "Overall I'm feeling optimistic about making progress on my goals."
        ];
        const mockTranscription = mockTranscriptions[index] || mockTranscriptions[0];
        handleResponseChange(index, mockTranscription);
      }, 1000);
    } else {
      setIsRecording(index);
    }
  };
  
  const usePrefill = (index: number) => {
    const question = questions[index];
    if (question.prefill) {
      handleResponseChange(index, question.prefill);
    }
  };
  
  const switchTab = (newTab: 'morning' | 'evening') => {
    setTab(newTab);
    setResponses(['', '', '', '', '']);
    setSelectedMood(null);
    setSelectedMindset(null);
    setAiFeedback('');
  };

  // Load context data
  const loadContextData = async () => {
    try {
      setContextLoading(true);
      const response = await apiClient.getTodaysContext();
      if (response.success && response.data) {
        setContextData(response.data);
      }
    } catch (error) {
      console.error('Failed to load context data:', error);
    } finally {
      setContextLoading(false);
    }
  };

  // Auto-select appropriate tab based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    const autoTab = hour < 12 ? 'morning' : 'evening';
    setTab(autoTab);
  }, []);

  // Load context data when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadContextData();
    }
  }, [isAuthenticated, user]);

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.authPrompt}>Please sign in to access check-ins</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, tab === 'morning' && styles.activeTab]}
          onPress={() => switchTab('morning')}
        >
          <Text style={[styles.tabText, tab === 'morning' && styles.activeTabText]}>
            🌅 Morning
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, tab === 'evening' && styles.activeTab]}
          onPress={() => switchTab('evening')}
        >
          <Text style={[styles.tabText, tab === 'evening' && styles.activeTabText]}>
            🌙 Evening
          </Text>
        </TouchableOpacity>
      </View>

      {/* Today's Context Section */}
      {contextData && !contextLoading && (
        <TodaysContextSection
          habits={contextData.habits || []}
          mood={contextData.mood}
          defaultOpen={false}
          onUpdateHabits={() => {
            Alert.alert('Navigation', 'Would navigate to Habits screen to update habits');
          }}
          onAddMoodEntry={() => {
            Alert.alert('Navigation', 'Would navigate to Journal screen to add mood entry');
          }}
          onViewJournal={() => {
            Alert.alert('Navigation', 'Would navigate to Journal screen with timeline view');
          }}
          onViewProgress={() => {
            Alert.alert('Navigation', 'Would navigate to Streaks screen to view progress');
          }}
        />
      )}

      {/* Quick Mood Entry */}
      <QuickMoodEntry
        compact={true}
        currentMood={selectedMood?.value}
        onMoodUpdated={(mood) => {
          const moodOption = moodEmojis.find(m => m.value === mood);
          if (moodOption) {
            setSelectedMood(moodOption);
          }
          // Refresh context data to show updated mood
          loadContextData();
        }}
      />

      <View style={styles.prefillContainer}>
        <TouchableOpacity 
          style={styles.prefillToggle}
          onPress={() => setShowPrefills(!showPrefills)}
        >
          <Text style={styles.prefillToggleText}>
            {showPrefills ? 'Hide' : 'Show'} example responses
          </Text>
        </TouchableOpacity>
      </View>

      {questions.map((question, index) => (
        <View key={index} style={styles.questionContainer}>
          <Text style={styles.questionText}>{question.text}</Text>
          
          {question.type === 'mood' ? (
            <View style={styles.moodContainer}>
              <Text style={styles.moodLabel}>Select your mood:</Text>
              <View style={styles.moodGrid}>
                {moodEmojis.map((mood) => (
                  <TouchableOpacity
                    key={mood.label}
                    style={[
                      styles.moodOption,
                      selectedMood?.label === mood.label && styles.selectedMoodOption
                    ]}
                    onPress={() => setSelectedMood(mood)}
                  >
                    <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                    <Text style={styles.moodLabel}>{mood.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : question.type === 'mindset' ? (
            <View style={styles.mindsetContainer}>
              <Text style={styles.mindsetLabel}>Select your mindset:</Text>
              <View style={styles.mindsetGrid}>
                {mindsetOptions.map((mindset) => (
                  <TouchableOpacity
                    key={mindset.label}
                    style={[
                      styles.mindsetOption,
                      selectedMindset?.label === mindset.label && styles.selectedMindsetOption
                    ]}
                    onPress={() => setSelectedMindset(mindset)}
                  >
                    <Text style={styles.mindsetEmoji}>{mindset.emoji}</Text>
                    <Text style={styles.mindsetText}>{mindset.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={responses[index]}
                onChangeText={(text) => handleResponseChange(index, text)}
                placeholder="Type your response..."
                multiline
                numberOfLines={3}
              />
              <View style={styles.inputActions}>
                <TouchableOpacity 
                  style={[styles.voiceButton, isRecording === index && styles.recordingButton]}
                  onPress={() => handleVoiceRecord(index)}
                >
                  <Text style={styles.voiceButtonText}>
                    {isRecording === index ? '🔴 Stop' : '🎤 Voice'}
                  </Text>
                </TouchableOpacity>
                {showPrefills && question.prefill && (
                  <TouchableOpacity 
                    style={styles.prefillButton}
                    onPress={() => usePrefill(index)}
                  >
                    <Text style={styles.prefillButtonText}>Use Example</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
      ))}

      <TouchableOpacity 
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Check-in</Text>
        )}
      </TouchableOpacity>

      {isLoadingFeedback && (
        <View style={styles.feedbackLoading}>
          <ActivityIndicator color="#4F8EF7" />
          <Text style={styles.feedbackLoadingText}>Generating AI feedback...</Text>
        </View>
      )}

      {aiFeedback && !isLoadingFeedback && (
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackTitle}>🤖 AI Coach Feedback</Text>
          <Text style={styles.feedbackText}>{aiFeedback}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 25,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#4F8EF7',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#fff',
  },
  prefillContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  prefillToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E6F3FF',
    borderRadius: 16,
  },
  prefillToggleText: {
    color: '#4F8EF7',
    fontSize: 14,
    fontWeight: '500',
  },
  questionContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: '#FAFAFA',
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  voiceButton: {
    backgroundColor: '#4F8EF7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  recordingButton: {
    backgroundColor: '#F56565',
  },
  voiceButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  prefillButton: {
    backgroundColor: '#E6F3FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  prefillButtonText: {
    color: '#4F8EF7',
    fontSize: 12,
    fontWeight: '600',
  },
  moodContainer: {
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A5568',
    marginBottom: 8,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moodOption: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F7FAFC',
    minWidth: 70,
  },
  selectedMoodOption: {
    backgroundColor: '#E6F3FF',
    borderColor: '#4F8EF7',
    borderWidth: 2,
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  mindsetContainer: {
    marginBottom: 8,
  },
  mindsetLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A5568',
    marginBottom: 8,
  },
  mindsetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mindsetOption: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F7FAFC',
    minWidth: 100,
  },
  selectedMindsetOption: {
    backgroundColor: '#E6F3FF',
    borderColor: '#4F8EF7',
    borderWidth: 2,
  },
  mindsetEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  mindsetText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2D3748',
  },
  submitButton: {
    backgroundColor: '#4F8EF7',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  feedbackLoading: {
    alignItems: 'center',
    padding: 20,
  },
  feedbackLoadingText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  feedbackContainer: {
    backgroundColor: '#F0FFF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#38A169',
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22543D',
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 14,
    color: '#2F855A',
    lineHeight: 20,
  },
});