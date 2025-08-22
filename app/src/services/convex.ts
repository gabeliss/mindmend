import { ConvexReactClient } from "convex/react";
import { ConvexProvider } from "convex/react";

// Initialize Convex client
const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

export { convex, ConvexProvider };