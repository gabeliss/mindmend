import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-expo';
import { useConvexAuth } from 'convex/react';

export function useAuth() {
  const { user, isLoaded: userLoaded } = useUser();
  const { signOut } = useClerkAuth();
  const { isLoading: convexLoading, isAuthenticated: convexAuthenticated } = useConvexAuth();

  return {
    // User information
    user,
    userId: user?.id,
    
    // Loading states
    isLoading: !userLoaded || convexLoading,
    isAuthenticated: convexAuthenticated && !!user,
    
    // Auth actions
    signOut,
  };
}