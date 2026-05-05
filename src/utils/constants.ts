import dayjs from "dayjs";
import { AppData, MoodKey } from "../types";

export const STORAGE_KEY = "children-reading-checkin-data";
export const SCHEMA_VERSION = 3;

export const moodOptions: { key: MoodKey; emoji: string; label: string }[] = [
  { key: "happy", emoji: "😊", label: "开心" },
  { key: "star", emoji: "🌟", label: "棒棒哒" },
  { key: "normal", emoji: "😐", label: "一般般" },
  { key: "sleepy", emoji: "😴", label: "有点困" },
  { key: "confused", emoji: "🤔", label: "没读懂" }
];

export const praisePool = [
  "坚持阅读的你真棒！",
  "又进步了一点点哦！",
  "今天也和故事做了好朋友！",
  "阅读小达人继续加油！",
  "每一天的打卡都很了不起！"
];

export const initialData: AppData = {
  schemaVersion: SCHEMA_VERSION,
  books: [
    { id: "b1", name: "小王子", author: "安东尼·德·圣-埃克苏佩里", createdAt: dayjs().subtract(10, "day").toISOString() },
    {
      id: "b2",
      name: "猜猜我有多爱你",
      author: "山姆·麦克布雷尼",
      goalMinutes: 45,
      createdAt: dayjs().subtract(7, "day").toISOString()
    }
  ],
  records: [
    {
      id: "r1",
      date: dayjs().subtract(1, "day").format("YYYY-MM-DD"),
      bookId: "b1",
      bookName: "小王子",
      duration: 25,
      note: "今天读到狐狸那一段，学会了要珍惜朋友。",
      mood: "happy",
      createdAt: dayjs().subtract(1, "day").toISOString(),
      updatedAt: dayjs().subtract(1, "day").toISOString()
    },
    {
      id: "r2",
      date: dayjs().subtract(2, "day").format("YYYY-MM-DD"),
      bookId: "b2",
      bookName: "猜猜我有多爱你",
      duration: 18,
      note: "小兔子和大兔子的对话很温暖。",
      mood: "star",
      createdAt: dayjs().subtract(2, "day").toISOString(),
      updatedAt: dayjs().subtract(2, "day").toISOString()
    }
  ]
};
