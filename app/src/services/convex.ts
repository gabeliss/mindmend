import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex-auth/react";

// Initialize Convex client
// You'll need to replace this URL with your Convex deployment URL
// For development, run `npx convex dev` to get the URL
const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

export { convex, ConvexProviderWithClerk };