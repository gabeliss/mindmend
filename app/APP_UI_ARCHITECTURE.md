🧠 MindMend App UI Architecture (MVP v1)
🧭 Main Navigation Tabs (Bottom Nav)

[🏠 Home] [📈 Streaks] [📝 Check-in] [📓 Journal] [👤 Profile]
This gives users a clear loop:

Start day in Check-in

Track habits from Home

View progress in Streaks

Reflect or log urges in Journal

Tweak things in Profile

🔍 Now Let's Go Screen-by-Screen:
🏠 1. Home (Today's Dashboard)
Purpose: This is the user's daily command center.

Sections:

✅ “Your Plan Today”

List of habits (good + bad) for today

Each item shows:

Checkbox (for good habits)

“Avoid” tag for negative habits

Reminder time (optional)

🔄 Quick Checkpoint

“Did you stick to your plan?” [Yes] [Not really]

📣 AI Motivation Prompt

Ex: “Remember, it's Day 6. Don't break the streak now.”

📈 2. Streaks
Purpose: Visualize success — build identity around progress.

Sections:

📅 Calendar View

Colored dots:

Green = positive habit completed

Red = negative habit relapse

Gray = missed check-in

🔥 Streaks Overview

Cards for:

Longest good habit streak

Current clean streak (e.g., porn-free days)

Consistency score (optional, based on habits hit)

📊 Charts

(Optional) Weekly bar charts showing progress

📝 3. Check-In
Purpose: Morning & evening reflections to drive awareness + trigger AI insights.

Tabs:

Morning

Evening

🕗 Morning Check-In:
“What's your #1 goal today?”

“Any urges last night?”

“What could go wrong today?”

“Choose your mindset today” → (Focused, Chill, Aggressive, etc.)

🌙 Evening Check-In:
“Did you follow through?”

“Did you relapse or get distracted?”

“What triggered it?”

“How do you feel right now?”

Optional freeform text

🔁 After submission → AI-generated feedback

“Looks like you’re consistently skipping workouts on Thursdays. Let’s try changing that routine.”

📓 4. Journal (Logs)
Purpose: Log urges, track relapse patterns, and reflect deeper.

Sections:

🧠 Urge Log

“What triggered the urge?”

Boredom, stress, loneliness, phone in bed, etc.

“Did you give in?” Y/N

“How did you respond?”

🧾 Freeform Journal

Date-tagged entries

Optional mood tag

🧠 Pattern Insights

“Most urges happen when you’re alone after 10pm”

“Stress = most common relapse trigger”

👤 5. Profile / Settings
Purpose: Configure behavior, coach style, and habits.

Sections:

⚙️ Habits Manager

Add/edit:

Good habits (e.g., “Work out 3x/week”)

Bad habits (e.g., “No porn after 10pm”)

Frequency, reminder times, categories

💬 Coach Style

Choose your AI persona:

Chill Monk

Tough Love

Therapist

Motivational Bro

🛎️ Notifications

Morning/Evening check-ins

Optional relapse detection reminders

💸 Subscription (if enabled)

See plan, upgrade, manage billing

❌ Danger Zone

Reset streaks, delete account

✏️ Add-on Screens / Modals
These are not in the tab bar but pop up as needed:

🔔 Push Check-In Prompt (Modal)
“Time for your evening check-in.”

Tap → opens directly to Evening Check-In screen

🧠 AI Summary View
Optional weekly email or screen:

“This week: You were 5/7 on workouts. Clean streak: 6 days. Weakest moment: Sunday 11pm.”

🔁 User Flow Summary
Here’s what a typical day looks like for a user:

Time Action Screen
Morning Gets push → completes quick check-in 📝 Check-In (Morning)
During day Logs good habits as completed 🏠 Home
Evening Gets push → reflects 📝 Check-In (Evening)
After relapse Logs trigger in detail 📓 Journal
Curious Views progress + calendar 📈 Streaks
Weekly Gets AI summary 🧠 Modal or Email

🔑 Key Design Principles
Emotional UX: This app isn’t cold and clinical — it needs to feel human, warm, and motivating

Identity reinforcement: Every screen reminds them they’re becoming disciplined

Speed to log: No clutter — check-ins and habit logs should take under 60 seconds

One-thumb use: Mobile-first, thumb-friendly UI
