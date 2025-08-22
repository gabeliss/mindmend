import { ConvexReactClient } from "convex/react";
import { ConvexProvider } from "convex/react";

// Initialize Convex client
const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

// TODO: Export API when path resolution is configured
// export { api } from "../../../convex/_generated/api";
export { convex, ConvexProvider };