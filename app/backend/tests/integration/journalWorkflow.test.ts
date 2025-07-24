import { journalService } from '../../src/services/journalService';
import { prisma } from '../setup';
import { CreateJournalEntryData, UpdateJournalEntryData } from '../../src/types';

// Jest globals
declare global {
  var describe: (name: string, fn: () => void) => void;
  var it: (name: string, fn: () => void | Promise<void>) => void;
  var expect: any;
  var beforeEach: (fn: () => void | Promise<void>) => void;
}

describe('Journal Workflow Integration', () => {
  let testUser: any;

  beforeEach(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        firebaseUid: `test-${Date.now()}-${Math.random()}`,
        email: `test-${Date.now()}@example.com`,
        displayName: 'Test User'
      }
    });
  });

  it('should complete full journal entry workflow', async () => {
    // 1. Create a journal entry
    const entryData: CreateJournalEntryData = {
      title: 'My First Journal Entry',
      content: 'Today was a great day! I accomplished a lot of tasks and felt productive.',
      moodRating: 8
    };

    const createdEntry = await journalService.createEntry(testUser.id, entryData);

    // Verify creation
    expect(createdEntry).toBeDefined();
    expect(createdEntry.title).toBe(entryData.title);
    expect(createdEntry.content).toBe(entryData.content);
    expect(createdEntry.moodRating).toBe(entryData.moodRating);
    expect(createdEntry.userId).toBe(testUser.id);

    // 2. Retrieve the entry by ID
    const retrievedEntry = await journalService.getEntryById(testUser.id, createdEntry.id);
    expect(retrievedEntry).toBeDefined();
    expect(retrievedEntry!.id).toBe(createdEntry.id);

    // 3. Update the entry
    const updateData: UpdateJournalEntryData = {
      title: 'My Updated Journal Entry',
      content: 'Today was even better than I initially thought!',
      moodRating: 9
    };

    const updatedEntry = await journalService.updateEntry(testUser.id, createdEntry.id, updateData);
    expect(updatedEntry).toBeDefined();
    expect(updatedEntry!.title).toBe(updateData.title);
    expect(updatedEntry!.content).toBe(updateData.content);
    expect(updatedEntry!.moodRating).toBe(updateData.moodRating);

    // 4. Verify daily stats were updated
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyStats = await prisma.dailyStats.findFirst({
      where: {
        userId: testUser.id,
        date: today
      }
    });

    expect(dailyStats).toBeDefined();
    expect(dailyStats!.journalEntries).toBe(1);
    expect(dailyStats!.avgMood).toBe(9); // Should reflect the updated mood

    // 5. Create multiple entries and test filtering
    await journalService.createEntry(testUser.id, {
      content: 'Another entry with good mood',
      moodRating: 7
    });

    await journalService.createEntry(testUser.id, {
      content: 'A sad entry',
      moodRating: 3
    });

    // Test getting all entries
    const allEntries = await journalService.getEntries(testUser.id);
    expect(allEntries).toHaveLength(3);

    // Test mood filtering
    const happyEntries = await journalService.getEntries(testUser.id, {
      minMoodRating: 7
    });
    expect(happyEntries).toHaveLength(2);

    // Test search functionality (case insensitive)
    const searchResults = await journalService.getEntries(testUser.id, {
      search: 'updated'
    });
    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].title).toContain('Updated');

    // 6. Test mood trend calculation
    const moodTrend = await journalService.getMoodTrend(testUser.id, 7);
    expect(moodTrend).toHaveLength(7);
    
    // Today should have an average mood
    const todayTrend = moodTrend.find(day => 
      day.date === today.toISOString().split('T')[0]
    );
    expect(todayTrend).toBeDefined();
    expect(todayTrend!.avgMood).toBeGreaterThan(0);

    // 7. Test entries by date
    const todayEntries = await journalService.getEntriesByDate(testUser.id, today);
    expect(todayEntries).toHaveLength(3);

    // 8. Delete an entry
    const deleteResult = await journalService.deleteEntry(testUser.id, createdEntry.id);
    expect(deleteResult).toBe(true);

    // Verify deletion
    const deletedEntry = await journalService.getEntryById(testUser.id, createdEntry.id);
    expect(deletedEntry).toBeNull();

    // Verify remaining entries
    const remainingEntries = await journalService.getEntries(testUser.id);
    expect(remainingEntries).toHaveLength(2);
  });

  it('should handle multiple users independently', async () => {
    // Create another user
    const user2 = await prisma.user.create({
      data: {
        firebaseUid: `test2-${Date.now()}-${Math.random()}`,
        email: `test2-${Date.now()}@example.com`,
        displayName: 'Test User 2'
      }
    });

    // Create entries for both users
    const user1Entry = await journalService.createEntry(testUser.id, {
      content: 'User 1 entry',
      moodRating: 8
    });

    const user2Entry = await journalService.createEntry(user2.id, {
      content: 'User 2 entry',
      moodRating: 6
    });

    // Verify user isolation
    const user1Entries = await journalService.getEntries(testUser.id);
    const user2Entries = await journalService.getEntries(user2.id);

    expect(user1Entries).toHaveLength(1);
    expect(user2Entries).toHaveLength(1);
    expect(user1Entries[0].content).toBe('User 1 entry');
    expect(user2Entries[0].content).toBe('User 2 entry');

    // Verify user can't access other user's entries
    const crossUserAccess = await journalService.getEntryById(testUser.id, user2Entry.id);
    expect(crossUserAccess).toBeNull();
  });

  it('should handle edge cases gracefully', async () => {
    // Test with minimal entry
    const minimalEntry = await journalService.createEntry(testUser.id, {
      content: 'Just content, no extras'
    });

    expect(minimalEntry.title).toBeNull();
    expect(minimalEntry.moodRating).toBeNull();
    expect(minimalEntry.content).toBe('Just content, no extras');

    // Test empty search
    const emptySearch = await journalService.getEntries(testUser.id, {
      search: 'nonexistent'
    });
    expect(emptySearch).toHaveLength(0);

    // Test mood trend with no entries (should return null moods)
    const emptyUser = await prisma.user.create({
      data: {
        firebaseUid: `empty-${Date.now()}-${Math.random()}`,
        email: `empty-${Date.now()}@example.com`,
        displayName: 'Empty User'
      }
    });

    const emptyTrend = await journalService.getMoodTrend(emptyUser.id, 3);
    expect(emptyTrend).toHaveLength(3);
    expect(emptyTrend.every(day => day.avgMood === null)).toBe(true);
  });
});