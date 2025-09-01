import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
} from 'react-native';
import { ScrollView } from 'react-native';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/design-system';
import { useChatContext } from '../hooks/useChatContext';
import { sendMessageWithContext } from '../utils/chatIntegration';

// Message interface
interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// Typing indicator component
const TypingIndicator: React.FC = () => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animateDots = () => {
      const duration = 600;
      const sequence = Animated.sequence([
        Animated.timing(dot1, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(dot2, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(dot3, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(dot1, { toValue: 0.3, duration, useNativeDriver: true }),
        Animated.timing(dot2, { toValue: 0.3, duration, useNativeDriver: true }),
        Animated.timing(dot3, { toValue: 0.3, duration, useNativeDriver: true }),
      ]);

      Animated.loop(sequence).start();
    };

    animateDots();
  }, []);

  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingBubble}>
        <View style={styles.typingDots}>
          <Animated.View style={[styles.typingDot, { opacity: dot1 }]} />
          <Animated.View style={[styles.typingDot, { opacity: dot2 }]} />
          <Animated.View style={[styles.typingDot, { opacity: dot3 }]} />
        </View>
      </View>
    </View>
  );
};

// Message bubble component
const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.messageContainer,
        message.isUser ? styles.userMessageContainer : styles.aiMessageContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {!message.isUser && (
        <View style={styles.aiAvatar}>
          <Ionicons name="sparkles" size={16} color={Colors.primary[600]} />
        </View>
      )}
      <View
        style={[
          styles.messageBubble,
          message.isUser ? styles.userBubble : styles.aiBubble,
        ]}
      >
        <Text style={[
          styles.messageText,
          message.isUser ? styles.userText : styles.aiText,
        ]}>
          {message.text}
        </Text>
      </View>
    </Animated.View>
  );
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [pendingUserMessage, setPendingUserMessage] = useState<string>('');
  const scrollViewRef = useRef<ScrollView>(null);

  // Get context for the current user message (only when we have a pending message)
  const { context, isLoading, isAuthenticated } = useChatContext({
    query: pendingUserMessage || undefined,
    includeJournals: true,
    maxJournalEntries: 3,
    habitHistoryDays: 30,
  });

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessageText = inputText.trim();
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      text: userMessageText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    
    // Set pending message to trigger context loading
    setPendingUserMessage(userMessageText);
    
    // Show AI typing indicator
    setIsAiTyping(true);
    scrollToBottom();
  };

  // Process AI response when context is ready
  useEffect(() => {
    if (pendingUserMessage && isAiTyping) {
      const processAIResponse = async () => {
        try {
          // If user is not authenticated, provide a helpful message
          if (!isAuthenticated) {
            const authMessage: ChatMessage = {
              id: `ai_${Date.now()}`,
              text: "Please sign in to get personalized responses based on your habits and journal entries.",
              isUser: false,
              timestamp: new Date(),
            };

            setIsAiTyping(false);
            setMessages(prev => [...prev, authMessage]);
            setPendingUserMessage('');
            scrollToBottom();
            return;
          }

          // Wait for context to be ready if user is authenticated
          if (context === undefined) {
            // Context is still loading, wait a bit longer
            setTimeout(processAIResponse, 500);
            return;
          }

          // Get AI response with context
          const aiResponseText = await sendMessageWithContext(pendingUserMessage, context);
          
          const aiMessage: ChatMessage = {
            id: `ai_${Date.now()}`,
            text: aiResponseText,
            isUser: false,
            timestamp: new Date(),
          };

          setIsAiTyping(false);
          setMessages(prev => [...prev, aiMessage]);
          setPendingUserMessage(''); // Clear pending message
          scrollToBottom();
        } catch (error) {
          console.error('Error processing AI response:', error);
          
          const errorMessage: ChatMessage = {
            id: `ai_${Date.now()}`,
            text: "I'm sorry, I encountered an error processing your message. Please try again.",
            isUser: false,
            timestamp: new Date(),
          };

          setIsAiTyping(false);
          setMessages(prev => [...prev, errorMessage]);
          setPendingUserMessage(''); // Clear pending message
          scrollToBottom();
        }
      };

      // Add a slight delay to make the interaction feel more natural
      setTimeout(processAIResponse, 800);
    }
  }, [pendingUserMessage, context, isAiTyping, isAuthenticated]);

  // Empty state
  if (messages.length === 0 && !isAiTyping) {
    return (
      <SafeAreaView style={styles.container as any} edges={['top']}>
        <KeyboardAvoidingView 
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="chatbubbles-outline" size={64} color={Colors.neutral[300]} />
              </View>
              <Text style={styles.emptyStateTitle}>Start a conversation</Text>
              <Text style={styles.emptyStateText}>
                Ask me anything about your habits, journal entries, or daily planning. I'm here to help!
              </Text>
            </View>
          </TouchableWithoutFeedback>

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type your message..."
                placeholderTextColor={Colors.neutral[400]}
                multiline
                maxLength={1000}
                returnKeyType="default"
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  inputText.trim() ? styles.sendButtonActive : styles.sendButtonInactive,
                ]}
                onPress={handleSendMessage}
                disabled={!inputText.trim()}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="send" 
                  size={20} 
                  color={inputText.trim() ? Colors.neutral[50] : Colors.neutral[400]} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container as any} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat</Text>
        <View style={styles.headerSubtitle}>
          <Ionicons name="sparkles" size={14} color={Colors.primary[500]} />
          <Text style={styles.headerSubtitleText}>AI Assistant</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Messages Area */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.messagesContainer}>
            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              
              {isAiTyping && <TypingIndicator />}
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your message..."
              placeholderTextColor={Colors.neutral[400]}
              multiline
              maxLength={1000}
              returnKeyType="default"
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                inputText.trim() ? styles.sendButtonActive : styles.sendButtonInactive,
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim()}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={inputText.trim() ? Colors.neutral[50] : Colors.neutral[400]} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[100],
  },
  keyboardContainer: {
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.neutral[50],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.h1,
    color: Colors.neutral[800],
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSubtitleText: {
    ...Typography.bodySmall,
    color: Colors.primary[600],
    marginLeft: Spacing.xs,
    fontWeight: '500',
  },
  
  // Empty State
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['5xl'],
  },
  emptyStateIcon: {
    marginBottom: Spacing.xl,
  },
  emptyStateTitle: {
    ...Typography.h2,
    color: Colors.neutral[700],
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  emptyStateText: {
    ...Typography.body,
    color: Colors.neutral[500],
    textAlign: 'center',
    lineHeight: 22,
  },

  // Messages
  messagesContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  userBubble: {
    backgroundColor: Colors.primary[500],
    borderBottomRightRadius: BorderRadius.sm,
  },
  aiBubble: {
    backgroundColor: Colors.neutral[50],
    borderBottomLeftRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    ...Shadows.sm,
  },
  messageText: {
    ...Typography.body,
    lineHeight: 20,
  },
  userText: {
    color: Colors.neutral[50],
  },
  aiText: {
    color: Colors.neutral[800],
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    marginBottom: 2,
  },

  // Typing Indicator
  typingContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: Spacing.md,
  },
  typingBubble: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginLeft: 40, // Account for avatar space
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    ...Shadows.sm,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.neutral[400],
    marginHorizontal: 1.5,
  },

  // Input
  inputContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.neutral[50],
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  textInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.neutral[800],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },
  sendButtonActive: {
    backgroundColor: Colors.primary[500],
  },
  sendButtonInactive: {
    backgroundColor: 'transparent',
  },
});