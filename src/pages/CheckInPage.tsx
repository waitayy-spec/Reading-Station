import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Button, Input, Selector, Slider, TextArea, Toast } from "antd-mobile";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import CuteBanner from "../components/CuteBanner";
import MoodPicker from "../components/MoodPicker";
import PraiseAnimation from "../components/PraiseAnimation";
import { MoodKey } from "../types";
import { praisePool } from "../utils/constants";
import { deleteRecordByDate, getBooks, getRecords, upsertBook, upsertRecord } from "../utils/storage";
import { randomId } from "../utils/helpers";

const today = dayjs().format("YYYY-MM-DD");

export default function CheckInPage() {
  const navigate = useNavigate();
  const [books, setBooks] = useState(getBooks());
  const [records, setRecords] = useState(getRecords());
  const [bookId, setBookId] = useState(books[books.length - 1]?.id ?? "");
  const [quickBook, setQuickBook] = useState("");
  const [duration, setDuration] = useState(20);
  const [note, setNote] = useState("");
  const [mood, setMood] = useState<MoodKey>("happy");
  const [showAnim, setShowAnim] = useState(false);
  const [praise, setPraise] = useState("");

  const todayRecord = useMemo(() => records.find((item) => item.date === today), [records]);

  useEffect(() => {
    if (!todayRecord) return;
    setBookId(todayRecord.bookId);
    setDuration(todayRecord.duration);
    setNote(todayRecord.note);
    setMood(todayRecord.mood);
  }, [todayRecord]);

  const addQuickBook = () => {
    if (!quickBook.trim()) return;
    const newBook = { id: randomId("book"), name: quickBook.trim(), createdAt: new Date().toISOString() };
    upsertBook(newBook);
    const nextBooks = getBooks();
    setBooks(nextBooks);
    setBookId(newBook.id);
    setQuickBook("");
    Toast.show({ content: "新书已添加到书架" });
  };

  const save = () => {
    const selectedBook = books.find((item) => item.id === bookId);
    if (!selectedBook) {
      Toast.show({ content: "请先选择一本书" });
      return;
    }
    const now = new Date().toISOString();
    upsertRecord({
      id: todayRecord?.id ?? randomId("record"),
      date: today,
      bookId: selectedBook.id,
      bookName: selectedBook.name,
      duration,
      note,
      mood,
      createdAt: todayRecord?.createdAt ?? now,
      updatedAt: now
    });
    setRecords(getRecords());
    setPraise(praisePool[Math.floor(Math.random() * praisePool.length)]);
    setShowAnim(true);
  };

  const removeToday = () => {
    deleteRecordByDate(today);
    setRecords(getRecords());
    setNote("");
    setDuration(20);
    setMood("happy");
    Toast.show({ content: "已删除今天的打卡" });
  };

  return (
    <div className="page">
      <PageHeader
        title="儿童阅读打卡"
        subtitle={`${dayjs().format("YYYY年MM月DD日 dddd")}`}
        right={<Button size="small" fill="outline" onClick={() => navigate("/stats")}>我的数据</Button>}
      />

      <CuteBanner />

      {todayRecord ? <div className="card success-banner">今日打卡成功！可以继续修改内容哦～</div> : null}

      <div className="card form-card">
        <label>今日阅读书籍</label>
        <Selector
          options={books.map((book) => ({ label: book.name, value: book.id }))}
          value={bookId ? [bookId] : []}
          onChange={(arr) => setBookId(arr[0] ?? "")}
          columns={1}
        />

        <div className="inline-row">
          <Input placeholder="快速新增一本书" value={quickBook} onChange={setQuickBook} clearable />
          <Button color="warning" onClick={addQuickBook}>新增</Button>
        </div>

        <label>阅读时长（{duration}分钟）</label>
        <Slider
          min={1}
          max={180}
          step={1}
          value={duration}
          onChange={(val) => setDuration(Array.isArray(val) ? val[0] : val)}
        />
        <Input
          type="number"
          value={String(duration)}
          onChange={(val) => {
            const num = Number(val);
            if (!Number.isNaN(num)) setDuration(Math.max(1, Math.min(180, num)));
          }}
        />

        <label>阅读感受/笔记</label>
        <TextArea
          placeholder="说说今天读了什么有趣的故事吧..."
          value={note}
          onChange={setNote}
          rows={4}
          showCount
          maxLength={300}
        />

        <label>心情贴纸</label>
        <MoodPicker value={mood} onChange={setMood} />

        <div className="inline-row">
          <Button block color="primary" onClick={save}>保存打卡</Button>
          {todayRecord ? <Button block color="danger" fill="outline" onClick={removeToday}>删除今日记录</Button> : null}
        </div>
      </div>

      <PraiseAnimation show={showAnim} text={praise} onDone={() => setShowAnim(false)} />
    </div>
  );
}
