import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { PanGestureHandler, State, PanGestureHandlerGestureEvent, PanGestureHandlerStateChangeEvent } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../lib/design-system';

interface SwipeAction {
  text: string;
  icon: string;
  color: string;
  backgroundColor: string;
  onPress: () => void;
}

interface SwipeActionsProps {
  children: React.ReactNode;
  rightActions?: SwipeAction[];
  disabled?: boolean;
}

const SWIPE_THRESHOLD = 60;
const ACTION_WIDTH = 80;

export default function SwipeActions({ 
  children, 
  rightActions = [], 
  disabled = false 
}: SwipeActionsProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [isSwipeOpen, setIsSwipeOpen] = useState(false);

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: false }
  );

  const onHandlerStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    const { state, translationX, velocityX } = event.nativeEvent;
    
    if (state === State.END) {
      const maxSwipeDistance = rightActions.length * ACTION_WIDTH;
      let finalTranslateX = 0;
      
      if (translationX < -SWIPE_THRESHOLD || velocityX < -500) {
        // Swipe left to reveal actions
        finalTranslateX = -maxSwipeDistance;
        setIsSwipeOpen(true);
      } else {
        // Snap back to closed
        setIsSwipeOpen(false);
      }

      Animated.spring(translateX, {
        toValue: finalTranslateX,
        useNativeDriver: false,
        tension: 300,
        friction: 30,
      }).start();
    }
  };

  const closeSwipe = () => {
    setIsSwipeOpen(false);
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: false,
      tension: 300,
      friction: 30,
    }).start();
  };

  const handleActionPress = (action: SwipeAction) => {
    closeSwipe();
    setTimeout(() => action.onPress(), 100); // Small delay for smooth animation
  };

  const handleContentPress = () => {
    if (isSwipeOpen) {
      closeSwipe();
    }
  };

  if (disabled || rightActions.length === 0) {
    return <View>{children}</View>;
  }

  return (
    <View style={styles.container}>
      {/* Background Actions */}
      <View style={[styles.actionsContainer, { right: 0 }]}>
        {rightActions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.actionButton,
              { 
                backgroundColor: action.backgroundColor,
                width: ACTION_WIDTH,
              }
            ]}
            onPress={() => handleActionPress(action)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={action.icon as keyof typeof Ionicons.glyphMap} 
              size={16} 
              color={action.color} 
            />
            <Text style={[styles.actionText, { color: action.color }]}>
              {action.text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Swipeable Content */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-10, 10]}
        failOffsetY={[-20, 20]}
      >
        <Animated.View
          style={[
            styles.content,
            {
              transform: [{ 
                translateX: translateX.interpolate({
                  inputRange: [-rightActions.length * ACTION_WIDTH, 0],
                  outputRange: [-rightActions.length * ACTION_WIDTH, 0],
                  extrapolate: 'clamp',
                })
              }],
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleContentPress}
            activeOpacity={isSwipeOpen ? 1 : 0.7}
            style={styles.contentTouchable}
          >
            {children}
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  actionsContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  actionText: {
    fontSize: 11,
    marginTop: 1,
    fontWeight: '600',
  },
  content: {
    backgroundColor: Colors.neutral[50],
  },
  contentTouchable: {
    flex: 1,
  },
});