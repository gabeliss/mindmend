import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  PanResponder,
  Image,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  primaryColor: string;
  backgroundColor: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: '1',
    title: 'Welcome to MindMend',
    subtitle: 'Your Personal Habit Coach',
    description: 'Transform your life by building positive habits and breaking negative ones. Our AI-powered coach is here to guide you every step of the way.',
    icon: '🧠',
    primaryColor: '#4F8EF7',
    backgroundColor: '#E6F3FF',
  },
  {
    id: '2',
    title: 'Track Your Habits',
    subtitle: 'Build Consistency',
    description: 'Log your daily habits and watch your streaks grow. Visual progress tracking keeps you motivated and accountable.',
    icon: '📊',
    primaryColor: '#38A169',
    backgroundColor: '#F0FFF4',
  },
  {
    id: '3',
    title: 'AI-Powered Insights',
    subtitle: 'Personal Growth',
    description: 'Get personalized tips, pattern analysis, and weekly summaries powered by artificial intelligence tailored to your unique journey.',
    icon: '🤖',
    primaryColor: '#9F7AEA',
    backgroundColor: '#FAF5FF',
  },
  {
    id: '4',
    title: 'Reflect & Journal',
    subtitle: 'Mindful Living',
    description: 'Daily check-ins and journaling help you stay mindful, track your mood, and understand what drives your habits.',
    icon: '📝',
    primaryColor: '#ED8936',
    backgroundColor: '#FFFAF0',
  },
  {
    id: '5',
    title: 'Ready to Start?',
    subtitle: 'Your Journey Begins Now',
    description: 'Create your account and begin building the life you want. Remember: small, consistent actions lead to big changes.',
    icon: '🚀',
    primaryColor: '#E53E3E',
    backgroundColor: '#FFF5F5',
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      scrollViewRef.current?.scrollTo({
        x: newStep * screenWidth,
        animated: true,
      });
      
      // Animate progress bar
      Animated.timing(progressAnim, {
        toValue: newStep / (onboardingSteps.length - 1),
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      scrollViewRef.current?.scrollTo({
        x: newStep * screenWidth,
        animated: true,
      });
      
      // Animate progress bar
      Animated.timing(progressAnim, {
        toValue: newStep / (onboardingSteps.length - 1),
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const skipOnboarding = () => {
    onComplete();
  };

  const onScrollEnd = (event: any) => {
    const { contentOffset } = event.nativeEvent;
    const newStep = Math.round(contentOffset.x / screenWidth);
    if (newStep !== currentStep) {
      setCurrentStep(newStep);
      
      // Update progress bar
      Animated.timing(progressAnim, {
        toValue: newStep / (onboardingSteps.length - 1),
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const renderStep = (step: OnboardingStep, index: number) => (
    <View key={step.id} style={[styles.stepContainer, { backgroundColor: step.backgroundColor }]}>
      <View style={styles.content}>
        {/* Step indicator */}
        <View style={styles.stepIndicator}>
          <Text style={styles.stepNumber}>{index + 1} of {onboardingSteps.length}</Text>
        </View>

        {/* Main icon */}
        <View style={[styles.iconContainer, { backgroundColor: step.primaryColor + '20' }]}>
          <Text style={styles.stepIcon}>{step.icon}</Text>
        </View>

        {/* Content */}
        <View style={styles.textContent}>
          <Text style={[styles.stepTitle, { color: step.primaryColor }]}>
            {step.title}
          </Text>
          <Text style={[styles.stepSubtitle, { color: step.primaryColor }]}>
            {step.subtitle}
          </Text>
          <Text style={styles.stepDescription}>
            {step.description}
          </Text>
        </View>

        {/* Feature highlights for specific steps */}
        {index === 1 && (
          <View style={styles.featureList}>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>🔥</Text>
              <Text style={styles.featureText}>Track streaks</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>📈</Text>
              <Text style={styles.featureText}>See progress</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>🎯</Text>
              <Text style={styles.featureText}>Set goals</Text>
            </View>
          </View>
        )}

        {index === 2 && (
          <View style={styles.featureList}>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>💡</Text>
              <Text style={styles.featureText}>Daily tips</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>🔍</Text>
              <Text style={styles.featureText}>Pattern analysis</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>📊</Text>
              <Text style={styles.featureText}>Weekly summaries</Text>
            </View>
          </View>
        )}

        {index === 3 && (
          <View style={styles.featureList}>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>🌅</Text>
              <Text style={styles.featureText}>Morning check-ins</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>🌙</Text>
              <Text style={styles.featureText}>Evening reflection</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>📖</Text>
              <Text style={styles.featureText}>Mood tracking</Text>
            </View>
          </View>
        )}
      </View>

      {/* Navigation buttons */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, styles.skipButton]}
          onPress={skipOnboarding}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>

        <View style={styles.centerNav}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={[styles.navButton, styles.backButton]}
              onPress={prevStep}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.navButton, styles.nextButton, { backgroundColor: step.primaryColor }]}
          onPress={nextStep}
        >
          <Text style={styles.nextButtonText}>
            {index === onboardingSteps.length - 1 ? 'Get Started' : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: onboardingSteps[currentStep].primaryColor,
              },
            ]}
          />
        </View>
      </View>

      {/* Steps content */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        style={styles.scrollView}
      >
        {onboardingSteps.map((step, index) => renderStep(step, index))}
      </ScrollView>

      {/* Page dots indicator */}
      <View style={styles.dotsContainer}>
        {onboardingSteps.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: index === currentStep 
                  ? onboardingSteps[currentStep].primaryColor 
                  : '#E2E8F0',
              },
            ]}
            onPress={() => {
              setCurrentStep(index);
              scrollViewRef.current?.scrollTo({
                x: index * screenWidth,
                animated: true,
              });
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  progressContainer: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  stepContainer: {
    width: screenWidth,
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  stepNumber: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  stepIcon: {
    fontSize: 60,
  },
  textContent: {
    alignItems: 'center',
    marginBottom: 40,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  stepDescription: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featureList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  feature: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    minWidth: 80,
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: 'transparent',
  },
  skipButtonText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '500',
  },
  centerNav: {
    flex: 1,
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  backButtonText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '500',
  },
  nextButton: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});