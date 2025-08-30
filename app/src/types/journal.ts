export interface JournalEntry {
  id: string;
  user_id: string;
  date: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface JournalGroup {
  month: string;
  year: number;
  entries: JournalEntry[];
}