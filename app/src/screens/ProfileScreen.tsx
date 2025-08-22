import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SignedIn, SignedOut, useAuth, useUser, useSignIn, useSignUp } from '@clerk/clerk-expo';
import { Colors, Typography, Spacing } from '../lib/design-system';

function SignedInProfile() {
  const { user } = useUser();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  return (
    <View style={styles.content}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.userInfo}>
        Welcome, {user?.emailAddresses[0]?.emailAddress || 'User'}!
      </Text>
      <TouchableOpacity style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

function SignedOutProfile() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);

  const { signIn, setActive: setActiveSignIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setActiveSignUp, isLoaded: signUpLoaded } = useSignUp();

  const handleSignIn = async () => {
    if (!signInLoaded) return;

    try {
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      if (signInAttempt.status === 'complete') {
        await setActiveSignIn({ session: signInAttempt.createdSessionId });
      }
    } catch (error: any) {
      Alert.alert('Sign In Error', error.errors?.[0]?.message || 'Failed to sign in');
    }
  };

  const handleSignUp = async () => {
    if (!signUpLoaded) return;

    try {
      await signUp.create({
        emailAddress: email,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (error: any) {
      Alert.alert('Sign Up Error', error.errors?.[0]?.message || 'Failed to sign up');
    }
  };

  const handleVerifyEmail = async () => {
    if (!signUpLoaded) return;

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (signUpAttempt.status === 'complete') {
        await setActiveSignUp({ session: signUpAttempt.createdSessionId });
        setPendingVerification(false);
      }
    } catch (error: any) {
      Alert.alert('Verification Error', error.errors?.[0]?.message || 'Failed to verify email');
    }
  };

  if (pendingVerification) {
    return (
      <View style={styles.content}>
        <Text style={styles.title}>Verify Email</Text>
        <Text style={styles.subtitle}>
          Please check your email for a verification code
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Enter verification code"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
        />
        <TouchableOpacity style={styles.button} onPress={handleVerifyEmail}>
          <Text style={styles.buttonText}>Verify Email</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.linkButton} 
          onPress={() => setPendingVerification(false)}
        >
          <Text style={styles.linkText}>Back to Sign Up</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.content}>
      <Text style={styles.title}>{isSignUp ? 'Sign Up' : 'Sign In'}</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity 
        style={styles.button} 
        onPress={isSignUp ? handleSignUp : handleSignIn}
      >
        <Text style={styles.buttonText}>
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.linkButton} 
        onPress={() => setIsSignUp(!isSignUp)}
      >
        <Text style={styles.linkText}>
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container as any}>
      <SignedIn>
        <SignedInProfile />
      </SignedIn>
      <SignedOut>
        <SignedOutProfile />
      </SignedOut>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  title: {
    ...Typography.h1,
    marginBottom: Spacing.md,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.neutral[500],
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  userInfo: {
    ...Typography.body,
    color: Colors.neutral[700],
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: 'white',
    fontSize: 16,
  },
  button: {
    backgroundColor: Colors.primary[500],
    borderRadius: 8,
    padding: Spacing.md,
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    padding: Spacing.sm,
  },
  linkText: {
    color: Colors.primary[500],
    fontSize: 14,
    textAlign: 'center',
  },
});