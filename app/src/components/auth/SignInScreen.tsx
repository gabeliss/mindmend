import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';

export function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();

  const onSignInPress = async () => {
    if (!isLoaded) return;

    try {
      // This is a basic email/password flow
      // You can customize this based on your preferred auth methods
      const completeSignIn = await signIn.create({
        identifier: 'user@example.com', // Replace with actual user input
        password: 'password123', // Replace with actual user input
      });

      await setActive({ session: completeSignIn.createdSessionId });
    } catch (err: any) {
      console.error('Sign in error:', err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to MindMend</Text>
      <Text style={styles.subtitle}>Sign in to track your habits</Text>
      
      <TouchableOpacity style={styles.button} onPress={onSignInPress}>
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});