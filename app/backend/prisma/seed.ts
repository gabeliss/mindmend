import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Use enum values directly as strings
const CoachStyle = {
  SUPPORTIVE: 'SUPPORTIVE' as const,
  DIRECT: 'DIRECT' as const,
  MOTIVATIONAL: 'MOTIVATIONAL' as const,
};

const HabitType = {
  AVOID: 'AVOID' as const,
  BUILD: 'BUILD' as const,
};

const EventType = {
  COMPLETED: 'COMPLETED' as const,
  SKIPPED: 'SKIPPED' as const,
  RELAPSED: 'RELAPSED' as const,
};

const InsightType = {
  WEEKLY_SUMMARY: 'WEEKLY_SUMMARY' as const,
  DAILY_TIP: 'DAILY_TIP' as const,
  PATTERN_DETECTED: 'PATTERN_DETECTED' as const,
};

async function main() {
  console.log('🌱 Starting database seed...');

  // Create test user
  const testUser = await prisma.user.upsert({
    where: { email: 'test@mindmend.app' },
    update: {},
    create: {
      firebaseUid: 'test-firebase-uid-123',
      email: 'test@mindmend.app',
      displayName: 'Test User',
      timezone: 'America/New_York',
      coachStyle: CoachStyle.SUPPORTIVE,
    },
  });

  console.log(`✅ Created test user: ${testUser.email}`);

  // Create test habits
  const workoutHabit = await prisma.habit.create({
    data: {
      userId: testUser.id,
      title: 'Morning Workout',
      description: 'Exercise for at least 30 minutes every morning',
      habitType: HabitType.BUILD,
    },
  });

  const phoneHabit = await prisma.habit.create({
    data: {
      userId: testUser.id,
      title: 'No Phone During Meals',
      description: 'Avoid using phone while eating to be more mindful',
      habitType: HabitType.AVOID,
    },
  });

  console.log(`✅ Created habits: ${workoutHabit.title}, ${phoneHabit.title}`);

  // Create test habit events (last 7 days)
  const events = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Workout habit - completed most days
    if (i < 5) {
      events.push({
        userId: testUser.id,
        habitId: workoutHabit.id,
        eventType: EventType.COMPLETED,
        occurredAt: date,
        notes: i === 0 ? 'Great morning session!' : undefined,
      });
    } else if (i === 5) {
      events.push({
        userId: testUser.id,
        habitId: workoutHabit.id,
        eventType: EventType.SKIPPED,
        occurredAt: date,
        notes: 'Felt too tired',
      });
    }

    // Phone habit - mixed results
    if (i % 2 === 0) {
      events.push({
        userId: testUser.id,
        habitId: phoneHabit.id,
        eventType: EventType.COMPLETED,
        occurredAt: date,
      });
    } else if (i === 3) {
      events.push({
        userId: testUser.id,
        habitId: phoneHabit.id,
        eventType: EventType.RELAPSED,
        occurredAt: date,
        notes: 'Checked social media during lunch',
      });
    }
  }

  await prisma.habitEvent.createMany({
    data: events,
  });

  console.log(`✅ Created ${events.length} habit events`);

  // Create test journal entries
  const journalEntries = [
    {
      userId: testUser.id,
      title: 'Morning Reflection',
      content: 'Feeling motivated today! The workout really helped clear my mind and I\'m ready to tackle the day. Been struggling a bit with the phone habit but making progress overall.',
      moodRating: 8,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      userId: testUser.id,
      title: 'Weekend Check-in',
      content: 'Had a good weekend. Managed to stay consistent with workouts even on Saturday. Still finding it challenging to avoid my phone during meals, especially when eating alone.',
      moodRating: 7,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
    {
      userId: testUser.id,
      content: 'Feeling a bit stressed about work today. The morning workout helped but I noticed I was reaching for my phone more often. Need to be more mindful about this pattern.',
      moodRating: 5,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
  ];

  for (const entry of journalEntries) {
    await prisma.journalEntry.create({ data: entry });
  }

  console.log(`✅ Created ${journalEntries.length} journal entries`);

  // Create test AI insight
  await prisma.aIInsight.create({
    data: {
      userId: testUser.id,
      insightType: InsightType.WEEKLY_SUMMARY,
      title: 'Your Weekly Progress',
      content: 'You\'ve shown great consistency with your morning workouts this week, completing 5 out of 7 days! Your mood ratings have been averaging 6.7/10, and I notice you feel most positive after completing your workout routine. For next week, try setting a specific phone-free meal time to build on your mindfulness practice.',
      dataUsed: {
        workoutCompletions: 5,
        totalWorkoutDays: 7,
        avgMood: 6.7,
        phoneHabitSuccess: 3,
        phoneHabitTotal: 7,
      },
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    },
  });

  console.log('✅ Created AI insight');

  // Create daily stats
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.occurredAt);
      return eventDate.toDateString() === date.toDateString();
    });

    const completed = dayEvents.filter(e => e.eventType === EventType.COMPLETED).length;
    const total = dayEvents.length;
    const journalCount = journalEntries.filter(entry => {
      const entryDate = new Date(entry.createdAt);
      return entryDate.toDateString() === date.toDateString();
    }).length;

    const avgMood = journalCount > 0 
      ? journalEntries
          .filter(entry => new Date(entry.createdAt).toDateString() === date.toDateString())
          .reduce((sum, entry) => sum + (entry.moodRating || 5), 0) / journalCount
      : undefined;

    if (total > 0 || journalCount > 0) {
      await prisma.dailyStats.create({
        data: {
          userId: testUser.id,
          date,
          habitsCompleted: completed,
          habitsTotal: total,
          journalEntries: journalCount,
          avgMood,
        },
      });
    }
  }

  console.log('✅ Created daily stats');

  console.log('🎉 Database seed completed successfully!');
  console.log('\n📊 Seed Summary:');
  console.log(`  👤 Users: 1`);
  console.log(`  🎯 Habits: 2`);
  console.log(`  ✅ Habit Events: ${events.length}`);
  console.log(`  📝 Journal Entries: ${journalEntries.length}`);
  console.log(`  🤖 AI Insights: 1`);
  console.log(`  📈 Daily Stats: 7 days`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });