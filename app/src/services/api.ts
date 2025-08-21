// Convex API service layer
// This file will contain helper functions for calling Convex mutations and queries

import { convex } from "./convex";
import { api } from "../../../convex/_generated/api";

// Habit operations
export const habitAPI = {
  // Create a new habit
  create: (habitData: any) => convex.mutation(api.habits.createHabit, habitData),
  
  // Get all habits for authenticated user
  getAll: (includeArchived = false) => 
    convex.query(api.habits.getHabits, { include_archived: includeArchived }),
  
  // Get single habit
  get: (habitId: string, userId: string) => 
    convex.query(api.habits.getHabit, { id: habitId, user_id: userId }),
  
  // Update habit
  update: (habitId: string, userId: string, updates: any) => 
    convex.mutation(api.habits.updateHabit, { id: habitId, user_id: userId, ...updates }),
  
  // Delete habit
  delete: (habitId: string, userId: string) => 
    convex.mutation(api.habits.deleteHabit, { id: habitId, user_id: userId }),
  
  // Archive/unarchive habit
  archive: (habitId: string, userId: string, archived: boolean) => 
    convex.mutation(api.habits.archiveHabit, { id: habitId, user_id: userId, archived }),
};

// Habit event operations
export const habitEventAPI = {
  // Create habit event
  create: (eventData: any) => convex.mutation(api.habitEvents.createHabitEvent, eventData),
  
  // Update habit event
  update: (eventId: string, userId: string, updates: any) => 
    convex.mutation(api.habitEvents.updateHabitEvent, { id: eventId, user_id: userId, ...updates }),
  
  // Delete habit event
  delete: (eventId: string, userId: string) => 
    convex.mutation(api.habitEvents.deleteHabitEvent, { id: eventId, user_id: userId }),
  
  // Get events for a habit
  getForHabit: (habitId: string, userId: string, dateFilters?: any) => 
    convex.query(api.habitEvents.getHabitEvents, { user_id: userId, habit_id: habitId, ...dateFilters }),
  
  // Get event by habit and date
  getByDate: (habitId: string, userId: string, date: string) => 
    convex.query(api.habitEvents.getHabitEventByDate, { habit_id: habitId, user_id: userId, date }),
  
  // Get all events for user
  getAll: (userId: string, dateFilters?: any) => 
    convex.query(api.habitEvents.getHabitEvents, { user_id: userId, ...dateFilters }),
};

export default {
  habit: habitAPI,
  habitEvent: habitEventAPI,
};