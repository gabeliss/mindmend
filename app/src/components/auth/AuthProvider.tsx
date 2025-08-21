import React from 'react';
import { ClerkProvider } from '@clerk/clerk-expo';
import { ConvexProviderWithClerk } from '../../services/convex';
import { convex } from '../../services/convex';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

  if (!publishableKey) {
    throw new Error('Missing Clerk Publishable Key. Please add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to your environment variables.');
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ConvexProviderWithClerk client={convex}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}