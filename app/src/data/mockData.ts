import { Habit, HabitEvent } from '../types/habits';

export const mockHabits: Habit[] = [
  {
    id: "habit_wake_up",
    user_id: "user_1",
    name: "Wake up early",
    type: "time_based",
    comparison_type: "time_of_day",
    is_positive: true,
    frequency: { type: "daily" },
    goal_time: "07:00",
    goal_times_by_day: { Sat: "09:00", Sun: "09:00" },
    created_at: "2025-08-01T00:00:00Z",
    archived: false
  },
  {
    id: "habit_screen_time",
    user_id: "user_1",
    name: "Limit phone use",
    type: "time_based",
    comparison_type: "duration",
    is_positive: true,
    frequency: { type: "daily" },
    goal_time: "02:00",
    weekly_time_goal: 14,
    created_at: "2025-08-01T00:00:00Z",
    archived: false
  },
  {
    id: "habit_no_porn",
    user_id: "user_1",
    name: "Avoid porn",
    type: "time_since",
    is_positive: false,
    frequency: { type: "daily" },
    failure_tolerance: {
      window: "monthly",
      max_failures: 3
    },
    created_at: "2025-08-01T00:00:00Z",
    archived: false
  },
  {
    id: "habit_read",
    user_id: "user_1",
    name: "Read 10 pages",
    type: "count_based",
    is_positive: true,
    frequency: { type: "specific_days", days_of_week: ["Mon", "Wed", "Fri"] },
    goal_count: 10,
    created_at: "2025-08-01T00:00:00Z",
    archived: false
  },
  {
    id: "habit_no_drinking",
    user_id: "user_1",
    name: "Avoid drinking",
    type: "time_since",
    is_positive: false,
    frequency: { type: "daily" },
    created_at: "2025-08-01T00:00:00Z",
    archived: false
  }
];

export const mockHabitEvents: HabitEvent[] = [
  // Wake up early — success if before 7am (or 9am on weekends)
  {
    id: "event1",
    habit_id: "habit_wake_up",
    user_id: "user_1",
    date: "2025-08-05",
    value: 6.75, // 6:45 AM
    status: "completed",
    note: "Felt great running early!",
    created_at: "2025-08-05T08:00:00Z",
    updated_at: "2025-08-05T08:00:00Z"
  },
  {
    id: "event2",
    habit_id: "habit_wake_up",
    user_id: "user_1",
    date: "2025-08-06",
    value: 9.5, // 9:30 AM
    status: "failed",
    note: "Slept in on Saturday",
    created_at: "2025-08-06T09:40:00Z",
    updated_at: "2025-08-06T09:40:00Z"
  },
  // {
  //   id: "event8",
  //   habit_id: "habit_wake_up",
  //   user_id: "user_1",
  //   date: "2025-08-03",
  //   value: 6.5, // 6:30 AM
  //   status: "completed",
  //   note: "Early bird catches the worm!",
  //   created_at: "2025-08-03T07:00:00Z",
  //   updated_at: "2025-08-03T07:00:00Z"
  // },
  {
    id: "event9",
    habit_id: "habit_wake_up",
    user_id: "user_1",
    date: "2025-08-02",
    value: 7.25, // 7:15 AM
    status: "failed",
    note: "Close but not quite",
    created_at: "2025-08-02T08:00:00Z",
    updated_at: "2025-08-02T08:00:00Z"
  },
  {
    id: "event10",
    habit_id: "habit_wake_up",
    user_id: "user_1",
    date: "2025-08-03",
    value: 6.8, // 6:48 AM
    status: "completed",
    created_at: "2025-08-03T07:30:00Z",
    updated_at: "2025-08-03T07:30:00Z"
  },
  {
    id: "event11",
    habit_id: "habit_wake_up",
    user_id: "user_1",
    date: "2025-08-01",
    value: 6.9, // 6:54 AM
    status: "completed",
    created_at: "2025-08-01T07:30:00Z",
    updated_at: "2025-08-01T07:30:00Z"
  },
  {
    id: "event12",
    habit_id: "habit_wake_up",
    user_id: "user_1",
    date: "2025-08-04",
    value: 8.0, // 8:00 AM
    status: "failed",
    note: "Weekend sleep-in",
    created_at: "2025-08-04T09:00:00Z",
    updated_at: "2025-08-04T09:00:00Z"
  },

  // Screen time — success if < 2hr
  {
    id: "event3",
    habit_id: "habit_screen_time",
    user_id: "user_1",
    date: "2025-08-05",
    value: 1.8,
    score: 1,
    status: "completed",
    note: "Solid day, no TikTok spiral",
    created_at: "2025-08-05T22:00:00Z",
    updated_at: "2025-08-05T22:00:00Z"
  },
  {
    id: "event4",
    habit_id: "habit_screen_time",
    user_id: "user_1",
    date: "2025-08-06",
    value: 3.5,
    score: 0.57,
    status: "failed",
    note: "Watched too much YouTube",
    created_at: "2025-08-06T22:00:00Z",
    updated_at: "2025-08-06T22:00:00Z"
  },
  // {
  //   id: "event13",
  //   habit_id: "habit_screen_time",
  //   user_id: "user_1",
  //   date: "2025-08-03",
  //   value: 1.5,
  //   score: 1,
  //   status: "completed",
  //   note: "Great focus day!",
  //   created_at: "2025-08-03T22:00:00Z",
  //   updated_at: "2025-08-03T22:00:00Z"
  // },
  {
    id: "event14",
    habit_id: "habit_screen_time",
    user_id: "user_1",
    date: "2025-08-04",
    value: 2.2,
    score: 0.91,
    status: "failed",
    created_at: "2025-08-04T22:00:00Z",
    updated_at: "2025-08-04T22:00:00Z"
  },
  {
    id: "event15",
    habit_id: "habit_screen_time",
    user_id: "user_1",
    date: "2025-08-03",
    value: 1.3,
    score: 1,
    status: "completed",
    created_at: "2025-08-03T22:00:00Z",
    updated_at: "2025-08-03T22:00:00Z"
  },
  {
    id: "event16",
    habit_id: "habit_screen_time",
    user_id: "user_1",
    date: "2025-08-02",
    value: 4.1,
    score: 0.49,
    status: "failed",
    note: "Doom scrolling session",
    created_at: "2025-08-02T22:00:00Z",
    updated_at: "2025-08-02T22:00:00Z"
  },
  {
    id: "event17",
    habit_id: "habit_screen_time",
    user_id: "user_1",
    date: "2025-08-01",
    value: 1.9,
    score: 1,
    status: "completed",
    created_at: "2025-08-01T22:00:00Z",
    updated_at: "2025-08-01T22:00:00Z"
  },

  // Avoid porn
  {
    id: "event24",
    habit_id: "habit_no_porn",
    user_id: "user_1",
    date: "2025-08-01",
    status: "completed",
    note: "No porn, no problem",
    timestamp: "2025-08-07T23:00:00Z", // Actual time it occurred
    created_at: "2025-08-07T23:00:00Z",
    updated_at: "2025-08-07T23:00:00Z"
  },
  {
    id: "event5",
    habit_id: "habit_no_porn",
    user_id: "user_1",
    date: "2025-08-04",
    status: "failed",
    note: "Slipped late at night",
    timestamp: "2025-08-04T23:45:00Z", // Actual time it occurred
    created_at: "2025-08-04T23:50:00Z", // When it was logged
    updated_at: "2025-08-04T23:50:00Z"
  },
  {
    id: "event18",
    habit_id: "habit_no_porn",
    user_id: "user_1",
    date: "2025-08-02",
    status: "failed",
    note: "Bad day, learned from it",
    timestamp: "2025-08-02T15:20:00Z", // Afternoon relapse
    created_at: "2025-07-30T22:30:00Z", // Logged later
    updated_at: "2025-07-30T22:30:00Z"
  },
  // Additional relapse on same day as event5 (multiple relapses per day)
  {
    id: "event22",
    habit_id: "habit_no_porn",
    user_id: "user_1",
    date: "2025-08-04",
    status: "failed",
    note: "Feeling stressed about work",
    timestamp: "2025-08-04T14:25:00Z", // Earlier in the day
    created_at: "2025-08-04T14:30:00Z",
    updated_at: "2025-08-04T14:30:00Z"
  },
  // Drinking failures
  {
    id: "event21",
    habit_id: "habit_no_drinking",
    user_id: "user_1",
    date: "2025-08-01",
    status: "failed",
    note: "Had a few beers at the barbecue",
    timestamp: "2025-08-01T20:30:00Z", // Evening barbecue time
    created_at: "2025-08-01T23:00:00Z",
    updated_at: "2025-08-01T23:00:00Z"
  },
  // Multiple drinking relapses on same day
  {
    id: "event23",
    habit_id: "habit_no_drinking",
    user_id: "user_1",
    date: "2025-08-01",
    status: "failed", 
    note: "Wine with dinner - couldn't resist",
    timestamp: "2025-08-01T19:45:00Z", // Dinner time
    created_at: "2025-08-01T19:45:00Z",
    updated_at: "2025-08-01T19:45:00Z"
  },

  // Read habit — goal: 10 pages
  {
    id: "event6",
    habit_id: "habit_read",
    user_id: "user_1",
    date: "2025-08-05",
    value: 12,
    status: "completed",
    note: "Great chapter!",
    created_at: "2025-08-05T21:00:00Z",
    updated_at: "2025-08-05T21:00:00Z"
  },
  {
    id: "event7",
    habit_id: "habit_read",
    user_id: "user_1",
    date: "2025-08-02",
    value: 6,
    status: "failed",
    note: "Didn't quite make the goal",
    created_at: "2025-08-02T21:00:00Z",
    updated_at: "2025-08-02T21:00:00Z"
  },
  {
    id: "event19",
    habit_id: "habit_read",
    user_id: "user_1",
    date: "2025-07-31",
    value: 15,
    status: "completed",
    note: "Couldn't put it down!",
    created_at: "2025-07-31T21:00:00Z",
    updated_at: "2025-07-31T21:00:00Z"
  },
  {
    id: "event20",
    habit_id: "habit_read",
    user_id: "user_1",
    date: "2025-07-29",
    value: 8,
    status: "failed",
    note: "Almost there",
    created_at: "2025-07-29T21:00:00Z",
    updated_at: "2025-07-29T21:00:00Z"
  }
];