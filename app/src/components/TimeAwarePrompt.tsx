import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/design-system';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../hooks/useAuth';

interface TimeAwarePromptProps {
  onSaveToJournal?: (title: string, content: string) => void;
  scrollViewRef?: React.RefObject<KeyboardAwareScrollView>;
}

export default function TimeAwarePrompt({ onSaveToJournal, scrollViewRef }: TimeAwarePromptProps) {
  const { userId, isAuthenticated } = useAuth();
  const [promptText, setPromptText] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState<'morning' | 'evening'>('morning');
  const [response, setResponse] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isJournaled, setIsJournaled] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const inputRef = useRef<TextInput>(null);

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Mutations
  const saveDraft = useMutation(api.reflections.saveDraft);
  const saveToJournal = useMutation(api.reflections.saveToJournal);
  
  // Query for existing draft - only when not actively typing
  const currentDraft = useQuery(
    api.reflections.getCurrentDraft,
    isAuthenticated && userId && !isFocused ? {
      userId,
      date: today,
      promptType: currentPrompt,
    } : "skip"
  );

  const updatePromptBasedOnTime = () => {
    const now = new Date();
    const hour = now.getHours();
    
    const newPromptType = (hour >= 4 && hour < 16) ? 'morning' : 'evening';
    const newPromptText = newPromptType === 'morning'
      ? 'What 1–3 things would make today feel like a win?'
      : 'What went well today?';
    
    // Only clear response if prompt type actually changes AND user confirms
    if (newPromptType !== currentPrompt && response.trim()) {
      // Don't automatically clear - let user decide
      return;
    } else if (newPromptType !== currentPrompt) {
      setCurrentPrompt(newPromptType);
      setIsJournaled(false); // Reset journal status when prompt changes
    }
    
    setCurrentPrompt(newPromptType);
    setPromptText(newPromptText);
  };

  const getPromptTitle = () => {
    return currentPrompt === 'morning' 
      ? `Morning Reflection`
      : `Evening Reflection`;
  };

  // Auto-save draft function
  const autoSaveDraft = useCallback(async (content: string) => {
    if (!userId || !isAuthenticated || !content.trim()) return;
    
    try {
      await saveDraft({
        userId,
        date: today,
        promptType: currentPrompt,
        content: content.trim(),
      });
    } catch (error) {
      console.error('Error auto-saving draft:', error);
    }
  }, [userId, isAuthenticated, today, currentPrompt, saveDraft]);

  // Load draft only when user is not actively typing
  useEffect(() => {
    if (currentDraft && currentDraft.content && !isFocused && !response) {
      setResponse(currentDraft.content);
    }
  }, [currentDraft, isFocused, response]);
  
  // Clean up auto-save timeout
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  useEffect(() => {
    updatePromptBasedOnTime();
    const interval = setInterval(updatePromptBasedOnTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Handle text changes with smart auto-save
  const handleTextChange = (text: string) => {
    setResponse(text);
    setIsJournaled(false); // Reset journaled status when user types
    
    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
    // Set new timeout for auto-save (2 seconds after user stops typing)
    if (text.trim()) {
      const timeout = setTimeout(() => {
        autoSaveDraft(text);
      }, 2000);
      setAutoSaveTimeout(timeout);
    }
  };
  
  const handleFocus = () => {
    setIsFocused(true);
    
    // Manually scroll to the correct position with minimal delay
    setTimeout(() => {
      if (scrollViewRef?.current) {
        scrollViewRef.current.scrollToPosition(0, 500, true);
      }
    }, 0); // Reduced delay for smoother experience
  };
  
  const handleBlur = () => {
    setIsFocused(false);
    // Save immediately when user exits input
    if (response.trim()) {
      autoSaveDraft(response);
    }
  };


  const handleSaveToJournal = async () => {
    if (!response.trim()) {
      Alert.alert('Empty Response', 'Please write something before saving to journal.');
      return;
    }

    if (!userId || !isAuthenticated) {
      Alert.alert('Authentication Required', 'Please sign in to save to journal.');
      return;
    }

    setIsSaving(true);
    
    try {
      await saveToJournal({
        userId,
        date: today,
        promptType: currentPrompt,
        content: response.trim(),
        promptText,
      });

      if (onSaveToJournal) {
        const title = getPromptTitle();
        const content = `${promptText}\n\n${response}`;
        onSaveToJournal(title, content);
      }

      // Note: isJournaled status is now managed in the database
    } catch (error) {
      console.error('Error saving to journal:', error);
      Alert.alert('Error', 'Failed to save to journal. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return null; // Don't show prompt if user is not authenticated
  }

  return (
    <View style={styles.container}>
      <View style={styles.promptCard}>
        <View style={styles.promptHeader}>
          <Ionicons 
            name={currentPrompt === 'morning' ? 'sunny' : 'moon'} 
            size={20} 
            color={Colors.primary[600]} 
            style={styles.promptIcon}
          />
          <Text style={styles.promptTitle}>
            {currentPrompt === 'morning' ? 'Morning Reflection' : 'Evening Reflection'}
          </Text>
        </View>
        
        <Text style={styles.promptQuestion}>{promptText}</Text>
        
        <TextInput
          ref={inputRef}
          style={styles.responseInput}
          placeholder="Share your thoughts..."
          placeholderTextColor={Colors.neutral[400]}
          value={response}
          onChangeText={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          scrollEnabled={true}
        />
        
        {response.trim().length > 0 && (
          <View style={styles.bottomSection}>
            {(isJournaled || currentDraft?.is_journaled) && (
              <View style={styles.journaledIndicator}>
                <Ionicons 
                  name="checkmark-circle" 
                  size={16} 
                  color={Colors.success[600]} 
                  style={styles.journaledIcon}
                />
                <Text style={styles.journaledText}>Saved to Journal</Text>
              </View>
            )}
            {(!isJournaled && !currentDraft?.is_journaled) && (
              <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                onPress={handleSaveToJournal}
                disabled={isSaving}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="journal" 
                  size={16} 
                  color={Colors.neutral[50]} 
                  style={styles.saveButtonIcon}
                />
                <Text style={styles.saveButtonText}>
                  {isSaving ? 'Saving...' : 'Save to Journal'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  promptCard: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    ...Shadows.sm,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  promptIcon: {
    marginRight: Spacing.xs,
  },
  promptTitle: {
    ...Typography.h3,
    color: Colors.neutral[800],
    fontWeight: '600',
  },
  promptQuestion: {
    ...Typography.body,
    color: Colors.neutral[700],
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  responseInput: {
    ...Typography.body,
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    minHeight: 100,
    maxHeight: 200,
    color: Colors.neutral[800],
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[600],
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
    ...Shadows.sm,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.neutral[400],
  },
  saveButtonIcon: {
    marginRight: Spacing.xs,
  },
  saveButtonText: {
    ...Typography.body,
    color: Colors.neutral[50],
    fontWeight: '600',
  },
  bottomSection: {
    marginTop: Spacing.md,
  },
  journaledIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.success[50],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.success[200],
  },
  journaledIcon: {
    marginRight: Spacing.xs,
  },
  journaledText: {
    ...Typography.body,
    color: Colors.success[600],
    fontWeight: '600',
  },
});