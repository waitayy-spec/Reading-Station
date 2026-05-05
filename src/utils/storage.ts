import dayjs from "dayjs";
import { AppData, Book, CheckinRecord } from "../types";
import { initialData, SCHEMA_VERSION, STORAGE_KEY } from "./constants";

const normalizeData = (raw: unknown): AppData | null => {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Partial<AppData> & { books?: unknown; records?: unknown; schemaVersion?: unknown };
  if (!Array.isArray(data.books) || !Array.isArray(data.records)) return null;

  const books: Book[] = (data.books as unknown[])
    .filter((item) => !!item && typeof item === "object")
    .map((item) => {
      const rawBook = item as Partial<Book>;
      const goalRaw = Number(rawBook.goalMinutes);
      const goalMinutes =
        Number.isFinite(goalRaw) && goalRaw > 0 ? Math.min(99999, Math.floor(goalRaw)) : undefined;
      return {
        id: rawBook.id || `book_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: rawBook.name || "未命名书籍",
        author: rawBook.author,
        cover: rawBook.cover,
        goalMinutes,
        createdAt: rawBook.createdAt || new Date().toISOString()
      };
    });

  const records: CheckinRecord[] = (data.records as unknown[])
    .filter((item) => !!item && typeof item === "object")
    .map((item) => {
      const rawRecord = item as Partial<CheckinRecord>;
      const now = new Date().toISOString();
      return {
        id: rawRecord.id || `record_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        date: rawRecord.date || dayjs().format("YYYY-MM-DD"),
        bookId: rawRecord.bookId || "",
        bookName: rawRecord.bookName || "未命名书籍",
        duration: Math.max(1, Math.min(180, Number(rawRecord.duration) || 1)),
        note: rawRecord.note || "",
        mood: rawRecord.mood || "normal",
        createdAt: rawRecord.createdAt || now,
        updatedAt: rawRecord.updatedAt || now
      };
    });

  return {
    schemaVersion: SCHEMA_VERSION,
    books,
    records
  };
};

const parseSafe = (raw: string | null): AppData | null => {
  if (!raw) return null;
  try {
    return normalizeData(JSON.parse(raw));
  } catch {
    return null;
  }
};

export const getData = (): AppData => {
  const fromStorage = parseSafe(localStorage.getItem(STORAGE_KEY));
  if (fromStorage) {
    if (fromStorage.schemaVersion !== SCHEMA_VERSION) {
      fromStorage.schemaVersion = SCHEMA_VERSION;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fromStorage));
    }
    return fromStorage;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
  return initialData;
};

export const saveData = (data: AppData) => {
  const normalized = normalizeData(data) || initialData;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
};

export const getBooks = (): Book[] => getData().books;
export const getRecords = (): CheckinRecord[] => getData().records;

export const upsertRecord = (record: CheckinRecord) => {
  const data = getData();
  const index = data.records.findIndex((item) => item.date === record.date);
  if (index >= 0) data.records[index] = record;
  else data.records.push(record);
  saveData(data);
};

export const deleteRecordByDate = (date: string) => {
  const data = getData();
  data.records = data.records.filter((record) => record.date !== date);
  saveData(data);
};

export const upsertBook = (book: Book) => {
  const data = getData();
  const index = data.books.findIndex((item) => item.id === book.id);
  if (index >= 0) data.books[index] = book;
  else data.books.push(book);
  saveData(data);
};

export const deleteBook = (bookId: string) => {
  const data = getData();
  data.books = data.books.filter((book) => book.id !== bookId);
  saveData(data);
};

export const exportJSON = () => JSON.stringify(getData(), null, 2);

export const exportCSV = () => {
  const records = getRecords();
  const header = ["日期", "书名", "时长(分钟)", "心情", "感受"];
  const lines = records.map((record) =>
    [record.date, record.bookName, String(record.duration), record.mood, record.note.split("\n").join(" ")].join(",")
  );
  return [header.join(","), ...lines].join("\n");
};

export const importData = (jsonText: string) => {
  const parsed = normalizeData(JSON.parse(jsonText));
  if (!parsed) throw new Error("导入文件格式不正确");
  saveData(parsed);
};
