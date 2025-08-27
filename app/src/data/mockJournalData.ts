import { JournalEntry } from '../types/journal';

export const mockJournalEntries: JournalEntry[] = [
  {
    id: "journal_001",
    user_id: "user_1",
    date: "2025-08-27",
    title: "Productive Tuesday",
    content: "Today was really productive! I managed to complete the project proposal ahead of schedule and even had time for a good workout. The meditation this morning helped me stay focused throughout the day.\n\nI'm starting to see real progress with my habits - the daily structure is really paying off. Tomorrow I want to focus on reading more pages and maybe try that new recipe I bookmarked.",
    mood: "great",
    tags: ["productivity", "exercise", "meditation"],
    created_at: "2025-08-27T20:30:00Z",
    updated_at: "2025-08-27T20:30:00Z"
  },
  {
    id: "journal_002", 
    user_id: "user_1",
    date: "2025-08-26",
    title: "Conference Day Reflections",
    content: "The conference was inspiring but exhausting. Met some amazing people in the tech community and learned about new frameworks I want to explore.\n\nFeeling a bit overwhelmed by all the information, but excited to implement some of these ideas in my current projects. The networking dinner went well - managed to avoid drinking too much unlike last time.",
    mood: "good",
    tags: ["work", "networking", "learning"],
    created_at: "2025-08-26T22:15:00Z",
    updated_at: "2025-08-26T22:15:00Z"
  },
  {
    id: "journal_003",
    user_id: "user_1", 
    date: "2025-08-25",
    title: "Travel Day Struggles",
    content: "Long travel day to get to the conference. Flight was delayed by 2 hours which threw off my whole schedule. Missed my morning workout and meditation, which I could definitely feel throughout the day.\n\nHotel gym was decent though, managed to get in a quick session before the welcome reception. Need to be better at adapting my routine when traveling.",
    mood: "okay",
    tags: ["travel", "routine", "adaptation"],
    created_at: "2025-08-25T23:45:00Z",
    updated_at: "2025-08-25T23:45:00Z"
  },
  {
    id: "journal_004",
    user_id: "user_1",
    date: "2025-08-24",
    title: "Saturday Adventures",
    content: "Perfect weekend day! Went on a long hike with friends in the mountains. The weather was incredible and the views were breathtaking. Sometimes I forget how much I need these outdoor adventures to recharge.\n\nEnded the day with a BBQ at home. Kept it simple with grilled vegetables and lean proteins. Felt good to stick to healthy eating even while socializing.",
    mood: "great",
    tags: ["outdoors", "friends", "healthy-eating"],
    created_at: "2025-08-24T21:30:00Z",
    updated_at: "2025-08-24T21:30:00Z"
  },
  {
    id: "journal_005",
    user_id: "user_1",
    date: "2025-08-23", 
    title: "Friday Wind-Down",
    content: "End of a busy work week. Had that big presentation today and I think it went really well. The team seemed engaged and asked good questions.\n\nCelebrated with some colleagues at the local pub. Tried to limit myself to just one drink but ended up having a few more than planned. Need to work on better self-control in social situations.",
    mood: "good",
    tags: ["work", "presentation", "social"],
    created_at: "2025-08-23T23:00:00Z",
    updated_at: "2025-08-23T23:00:00Z"
  },
  {
    id: "journal_006",
    user_id: "user_1",
    date: "2025-08-22",
    title: "Midweek Momentum", 
    content: "Feeling good about my progress this week. The morning routine is becoming more automatic - woke up at 6:30 without the snooze button for the third day in a row!\n\nRead an interesting chapter about habit formation that really resonated with me. The idea that small consistent actions compound over time makes so much sense.",
    mood: "good",
    tags: ["routine", "reading", "habits"],
    created_at: "2025-08-22T20:45:00Z",
    updated_at: "2025-08-22T20:45:00Z"
  },
  {
    id: "journal_007",
    user_id: "user_1", 
    date: "2025-08-21",
    title: "Challenging Day",
    content: "Today was tough. Woke up feeling anxious about the upcoming presentation and couldn't shake that feeling all day. Even my usual meditation didn't help much.\n\nSkipped lunch because of back-to-back meetings, which made me cranky by the afternoon. Ordered takeout for dinner instead of cooking - not my healthiest choice but sometimes you need to be kind to yourself.",
    mood: "poor",
    tags: ["anxiety", "stress", "self-care"],
    created_at: "2025-08-21T22:15:00Z",
    updated_at: "2025-08-21T22:15:00Z"
  },
  {
    id: "journal_008",
    user_id: "user_1",
    date: "2025-08-20",
    title: "Monday Reset",
    content: "New week, fresh start. Spent Sunday planning out my goals for the week and I'm feeling optimistic. The habit tracking app is really helping me stay accountable.\n\nTried a new strength training routine today - my trainer recommended focusing more on compound movements. Definitely felt the burn! Looking forward to seeing progress over the next few weeks.",
    mood: "good", 
    tags: ["planning", "exercise", "goals"],
    created_at: "2025-08-20T21:00:00Z",
    updated_at: "2025-08-20T21:00:00Z"
  },
  {
    id: "journal_009",
    user_id: "user_1",
    date: "2025-08-18",
    title: "Sunday Reflections",
    content: "Lazy Sunday vibes today. Sometimes it's nice to not have a packed schedule. Spent the morning reading in bed, then made a proper brunch with fresh fruit and whole grain pancakes.\n\nCalled my parents for our weekly chat. Mom's garden is doing amazing this year - she's sending photos of her tomatoes that are bigger than my fist! Makes me want to try growing something myself.",
    mood: "good",
    tags: ["family", "relaxation", "reading"],
    created_at: "2025-08-18T19:30:00Z",
    updated_at: "2025-08-18T19:30:00Z"
  },
  {
    id: "journal_010",
    user_id: "user_1",
    date: "2025-08-15",
    title: "Week Wrap-Up",
    content: "Pretty solid week overall. Hit most of my habit goals and made good progress on the big project at work. The consistent morning routine is really making a difference in how I feel throughout the day.\n\nHad a nice date night with Sarah tonight. We tried that new Italian place downtown - the pasta was incredible! Managed to share a dessert instead of ordering our own, which felt like a small victory for portion control.",
    mood: "great",
    tags: ["relationships", "date-night", "moderation"], 
    created_at: "2025-08-15T23:15:00Z",
    updated_at: "2025-08-15T23:15:00Z"
  },
  {
    id: "journal_011",
    user_id: "user_1",
    date: "2025-08-12",
    title: "Tuesday Struggles",
    content: "Had a really off day. Couldn't focus during the morning work session and kept getting distracted by social media. Ended up doom-scrolling for way longer than I intended.\n\nSkipped my evening workout because I felt lazy and unmotivated. Days like this remind me why building consistent habits is so important - they help carry you through when motivation is low.",
    mood: "poor",
    tags: ["distraction", "motivation", "discipline"],
    created_at: "2025-08-12T22:45:00Z", 
    updated_at: "2025-08-12T22:45:00Z"
  },
  {
    id: "journal_012",
    user_id: "user_1",
    date: "2025-08-10",
    title: "Weekend Recovery",
    content: "Needed this weekend to recharge after a hectic work week. Slept in until 9am (felt so good!) and then had a slow morning with coffee and the newspaper.\n\nMet up with college friends for lunch - it's amazing how quickly we fall back into old patterns when we're together. Lots of laughter and catching up on each other's lives.",
    mood: "good",
    tags: ["rest", "friends", "social"],
    created_at: "2025-08-10T20:30:00Z",
    updated_at: "2025-08-10T20:30:00Z"
  },
  {
    id: "journal_013",
    user_id: "user_1",
    date: "2025-08-08",
    title: "Productive Thursday",
    content: "Really good day! Finished the first draft of the quarterly report ahead of schedule. The early morning writing session when my mind is fresh is definitely the way to go.\n\nTried a new yoga class at lunch - it was challenging but felt amazing. The instructor focused on hip openers which I definitely needed after sitting at a desk all week.",
    mood: "great",
    tags: ["work", "productivity", "yoga"],
    created_at: "2025-08-08T21:15:00Z",
    updated_at: "2025-08-08T21:15:00Z"
  },
  {
    id: "journal_014",
    user_id: "user_1",
    date: "2025-08-05",
    title: "Monday Motivation",
    content: "Started the week with a lot of energy and enthusiasm. Set some ambitious goals for August and I'm feeling confident about achieving them.\n\nThe morning meditation practice is really helping me start each day with intention rather than just reacting to whatever comes up. It's such a simple thing but makes a huge difference in my mindset.",
    mood: "great", 
    tags: ["motivation", "goals", "meditation"],
    created_at: "2025-08-05T19:45:00Z",
    updated_at: "2025-08-05T19:45:00Z"
  },
  {
    id: "journal_015",
    user_id: "user_1",
    date: "2025-08-03",
    title: "Weekend Vibes",
    content: "Perfect Saturday! Started with a farmers market run - got some incredible peaches and fresh herbs. Cooked a big batch of healthy meals for the week ahead.\n\nSpent the afternoon reading in the park. There's something magical about being surrounded by trees while diving into a good book. Finished 'Atomic Habits' - lots of great insights I want to implement.",
    mood: "great",
    tags: ["cooking", "reading", "nature"],
    created_at: "2025-08-03T21:00:00Z",
    updated_at: "2025-08-03T21:00:00Z"
  },
  {
    id: "journal_016",
    user_id: "user_1",
    date: "2025-08-01",
    title: "August Goals",
    content: "First day of August! Feeling motivated to make this month count. Set up my new habit tracking system and outlined some key goals:\n\n- Consistent morning routine\n- Read for 30 minutes daily\n- Exercise 5x per week\n- Limit social media to 1 hour per day\n- Write in this journal regularly\n\nExcited to see how these small changes compound over time.",
    mood: "great",
    tags: ["goals", "habits", "motivation"],
    created_at: "2025-08-01T22:00:00Z",
    updated_at: "2025-08-01T22:00:00Z"
  },

  // July entries
  {
    id: "journal_017",
    user_id: "user_1", 
    date: "2025-07-28",
    title: "End of July Reflection",
    content: "Wrapping up July with mixed feelings. Made some progress on personal goals but struggled with consistency. The habit tracking idea is growing on me - maybe August is when I get more systematic about it.\n\nWork has been demanding but rewarding. The new project is challenging me in good ways, even if it's stressful at times.",
    mood: "okay",
    tags: ["reflection", "work", "goals"],
    created_at: "2025-07-28T20:15:00Z",
    updated_at: "2025-07-28T20:15:00Z"
  },
  {
    id: "journal_018",
    user_id: "user_1",
    date: "2025-07-25", 
    title: "Midweek Check-in",
    content: "Busy week at work but managing to keep up with most of my personal routines. The morning walks before work are becoming a favorite part of my day - there's something peaceful about the neighborhood before everyone else wakes up.\n\nTrying to read more consistently. Set a goal to finish one book per month and I'm behind pace, but better late than never.",
    mood: "good",
    tags: ["routine", "reading", "morning-walks"],
    created_at: "2025-07-25T21:30:00Z", 
    updated_at: "2025-07-25T21:30:00Z"
  },
  {
    id: "journal_019",
    user_id: "user_1",
    date: "2025-07-20",
    title: "Weekend Plans",
    content: "Looking forward to a relaxing weekend. Planning to visit the art museum downtown - they have a new exhibition on modern sculpture that looks fascinating.\n\nAlso want to meal prep for next week. I've been eating out too much lately and my energy levels are definitely suffering for it.",
    mood: "good", 
    tags: ["art", "meal-prep", "culture"],
    created_at: "2025-07-20T18:45:00Z",
    updated_at: "2025-07-20T18:45:00Z"
  },
  {
    id: "journal_020",
    user_id: "user_1",
    date: "2025-07-15",
    title: "Mid-July Thoughts",
    content: "Half way through July already! Time really flies. Been thinking a lot about what I want the second half of the year to look like.\n\nFeeling good about my health lately - been more active and sleeping better. The small changes are starting to add up.",
    mood: "good",
    tags: ["time", "health", "reflection"],
    created_at: "2025-07-15T19:00:00Z",
    updated_at: "2025-07-15T19:00:00Z"
  }
];