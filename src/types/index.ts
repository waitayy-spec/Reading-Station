export type MoodKey = "happy" | "star" | "normal" | "sleepy" | "confused";

export interface Book {
  id: string;
  name: string;
  author?: string;
  cover?: string;
  /** 读完一整遍的目标分钟数；不设则只显示累计时长与打卡次数 */
  goalMinutes?: number;
  createdAt: string;
}

export interface CheckinRecord {
  id: string;
  date: string;
  bookId: string;
  bookName: string;
  duration: number;
  note: string;
  mood: MoodKey;
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  schemaVersion: number;
  books: Book[];
  records: CheckinRecord[];
}
