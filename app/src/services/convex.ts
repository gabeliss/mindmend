import { ConvexReactClient } from "convex/react";
import { ConvexProvider } from "convex/react";

// Initialize Convex client
const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

// Temporary API definition until we resolve the path issue
export const api = {
  habits: {
    getHabits: "habits:getHabits" as any,
    createHabit: "habits:createHabit" as any,
    updateHabit: "habits:updateHabit" as any,
    deleteHabit: "habits:deleteHabit" as any,
    getHabit: "habits:getHabit" as any,
  },
  habitEvents: {
    getHabitEvents: "habitEvents:getHabitEvents" as any,
    createHabitEvent: "habitEvents:createHabitEvent" as any,
    updateHabitEvent: "habitEvents:updateHabitEvent" as any,
    deleteHabitEvent: "habitEvents:deleteHabitEvent" as any,
  }
};

export { convex, ConvexProvider };