import { useEffect, useMemo, useState } from "react";
import { Button, Input, Modal, Space, Toast } from "antd-mobile";
import PageHeader from "../components/PageHeader";
import { deleteBook, getBooks, getRecords, upsertBook } from "../utils/storage";
import { computeBookReadingProgress, formatBookProgressDetail, formatBookProgressSummary } from "../utils/bookProgress";
import { randomId, getColorByText } from "../utils/helpers";
import { Book } from "../types";

interface BookSearchItem {
  key: string;
  title: string;
  author?: string;
  cover?: string;
}

type AgeGroup = "all" | "3-6" | "6-9" | "9-12";

const AGE_OPTIONS: { key: AgeGroup; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "3-6", label: "3-6岁" },
  { key: "6-9", label: "6-9岁" },
  { key: "9-12", label: "9-12岁" }
];

// 少儿绘本别名/系列词：把中文常见叫法映射到更易命中的检索词
const KIDS_QUERY_ALIASES: Record<string, string[]> = {
  "波西和皮普": ["Posy and Pip", "Axel Scheffler", "Camilla Reid"],
  "小猫汤米": ["Tommy the Kitten", "Tom kitten", "Kitten stories"],
  "彼得兔": ["Peter Rabbit", "Beatrix Potter"],
  "神奇校车": ["Magic School Bus"],
  "小熊很忙": ["Bizzy Bear", "Benji Davies"],
  "小鸡球球": ["Chick", "Baby picture book"],
  "海尼曼": ["Heinemann", "children leveled readers"]
};

function normalizeKey(text: string) {
  return text.toLowerCase().replace(/\s+/g, "");
}

function normalizeCoverUrl(url?: string) {
  if (!url) return undefined;
  return url.replace(/^http:\/\//i, "https://");
}

function dedupeBooks(list: BookSearchItem[]) {
  const seen = new Set<string>();
  return list.filter((item) => {
    const k = `${normalizeKey(item.title)}__${normalizeKey(item.author || "")}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function syncFromStorage() {
  return { books: getBooks(), records: getRecords() };
}

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/+$/, "") || "";
const buildApiUrl = (path: string) => (API_BASE ? `${API_BASE}${path}` : path);

export default function BookshelfPage() {
  const [{ books, records }, setSnapshot] = useState(syncFromStorage);
  const [editing, setEditing] = useState<Book | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [author, setAuthor] = useState("");
  const [cover, setCover] = useState("");
  const [goalInput, setGoalInput] = useState("");
  const [ageFilter, setAgeFilter] = useState<AgeGroup>("all");
  const [bookSearchLoading, setBookSearchLoading] = useState(false);
  const [bookSearchResults, setBookSearchResults] = useState<BookSearchItem[]>([]);
  const [bookSearchMsg, setBookSearchMsg] = useState("");

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") setSnapshot(syncFromStorage());
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
    };
  }, []);

  const stats = useMemo(() => {
    if (!editing) return null;
    const r = records.filter((item) => item.bookId === editing.id);
    const progress = computeBookReadingProgress(editing, records);
    return {
      count: r.length,
      totalMinutes: progress.totalMinutes,
      latestDate: r.sort((a, b) => (a.date > b.date ? -1 : 1))[0]?.date ?? "暂无",
      progress,
      detailLines: formatBookProgressDetail(progress)
    };
  }, [editing, records]);

  const openForm = (book?: Book) => {
    if (book) {
      setName(book.name);
      setAuthor(book.author ?? "");
      setCover(book.cover ?? "");
      setGoalInput(book.goalMinutes != null && book.goalMinutes > 0 ? String(book.goalMinutes) : "");
      setEditing(book);
    } else {
      setName("");
      setAuthor("");
      setCover("");
      setGoalInput("");
      setEditing(null);
    }
    setShowForm(true);
  };

  const save = () => {
    if (!name.trim()) {
      Toast.show({ content: "书名不能为空" });
      return;
    }
    const g = goalInput.trim() === "" ? undefined : Math.floor(Number(goalInput));
    const goalMinutes =
      g !== undefined && Number.isFinite(g) && g > 0 ? Math.min(99999, g) : undefined;
    const prevId = editing?.id;
    upsertBook({
      id: prevId ?? randomId("book"),
      name: name.trim(),
      author: author.trim() || undefined,
      cover: cover || undefined,
      goalMinutes,
      createdAt: editing?.createdAt ?? new Date().toISOString()
    });
    setSnapshot(syncFromStorage());
    setShowForm(false);
    if (prevId) {
      const fresh = getBooks().find((b) => b.id === prevId);
      if (fresh) setEditing(fresh);
    } else {
      setEditing(null);
    }
  };

  const remove = (id: string) => {
    deleteBook(id);
    setSnapshot(syncFromStorage());
  };

  useEffect(() => {
    if (!showForm) return;
    const keyword = name.trim();
    if (keyword.length < 2) {
      setBookSearchResults([]);
      setBookSearchMsg(keyword.length === 0 ? "" : "至少输入 2 个字开始搜索");
      return;
    }

    const ctrl = new AbortController();
    const timer = window.setTimeout(async () => {
      setBookSearchLoading(true);
      setBookSearchMsg("");
      try {
        const aliasTerms = Object.entries(KIDS_QUERY_ALIASES)
          .filter(([k]) => normalizeKey(keyword).includes(normalizeKey(k)))
          .flatMap(([, terms]) => terms);
        const enhancedKeyword = aliasTerms.length
          ? `${keyword} ${aliasTerms.join(" ")}`
          : keyword;

        const resp = await fetch(
          buildApiUrl(`/api/books/search?q=${encodeURIComponent(enhancedKeyword)}&age=${encodeURIComponent(ageFilter)}`),
          { signal: ctrl.signal }
        );
        if (!resp.ok) throw new Error("backend-search-failed");
        const payload = (await resp.json()) as {
          list?: BookSearchItem[];
          msg?: string;
        };
        const list = Array.isArray(payload.list)
          ? payload.list.map((it) => ({
              key: it.key || `${it.title}_${Math.random().toString(36).slice(2, 8)}`,
              title: it.title || "未知书名",
              author: it.author,
              cover: normalizeCoverUrl(it.cover)
            }))
          : [];
        setBookSearchResults(dedupeBooks(list).slice(0, 18));
        setBookSearchMsg(payload.msg || (list.length ? `已找到 ${list.length} 条资源` : "未找到匹配资源"));
      } catch {
        if (!ctrl.signal.aborted) {
          setBookSearchResults([]);
          setBookSearchMsg("联网搜索失败，请稍后重试");
        }
      } finally {
        if (!ctrl.signal.aborted) setBookSearchLoading(false);
      }
    }, 350);

    return () => {
      ctrl.abort();
      window.clearTimeout(timer);
    };
  }, [ageFilter, name, showForm]);

  const selectSearchBook = (item: BookSearchItem) => {
    setName(item.title);
    setAuthor(item.author || "");
    setCover(item.cover || "");
    setBookSearchMsg(item.cover ? "已自动回填：书名 + 作者 + 封面" : "已回填书名和作者（该资源暂无封面）");
    setBookSearchResults([]);
  };

  return (
    <div className="page">
      <PageHeader
        title="我的书架"
        subtitle={`已录入 ${books.length} 本书`}
        right={<Button size="small" color="warning" onClick={() => openForm()}>添加书籍</Button>}
      />

      <div className="book-grid">
        {books.map((book) => (
          <div key={book.id} className="book-card card">
            {book.cover ? (
              <img src={book.cover} alt={book.name} className="cover" />
            ) : (
              <div className="cover auto" style={{ background: getColorByText(book.name) }}>{book.name.slice(0, 1)}</div>
            )}
            <h4>{book.name}</h4>
            <p>{book.author || "未填写作者"}</p>
            <p className="book-progress-line">{formatBookProgressSummary(computeBookReadingProgress(book, records))}</p>
            <Space block>
              <Button size="mini" onClick={() => setEditing(book)}>详情</Button>
              <Button size="mini" fill="outline" onClick={() => openForm(book)}>编辑</Button>
              <Button size="mini" color="danger" fill="outline" onClick={() => remove(book.id)}>删除</Button>
            </Space>
          </div>
        ))}
      </div>

      <Modal
        visible={showForm}
        title={editing ? "编辑书籍" : "新增书籍"}
        content={
          <Space direction="vertical" block>
            <Input value={name} onChange={setName} placeholder="书名" />
            <div className="book-age-filter">
              {AGE_OPTIONS.map((op) => (
                <button
                  key={op.key}
                  type="button"
                  className={`age-chip ${ageFilter === op.key ? "active" : ""}`}
                  onClick={() => setAgeFilter(op.key)}
                >
                  {op.label}
                </button>
              ))}
            </div>
            {name.trim().length >= 2 ? (
              <div className="book-search-box">
                <div className="book-search-head">
                  <span>联网书籍联想</span>
                  {bookSearchLoading ? <span>搜索中...</span> : null}
                </div>
                {bookSearchResults.length ? (
                  <div className="book-search-list">
                    {bookSearchResults.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        className="book-search-item"
                        onClick={() => selectSearchBook(item)}
                      >
                        <span className="title">{item.title}</span>
                        <span className="meta">{item.author || "作者未知"}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
                {bookSearchMsg ? <div className="book-search-msg">{bookSearchMsg}</div> : null}
              </div>
            ) : null}
            <Input value={author} onChange={setAuthor} placeholder="作者（可选）" />
            <Input value={cover} onChange={setCover} placeholder="封面图片 URL（可选）" />
            {cover ? (
              <div className="cover-preview-box">
                <img
                  src={cover}
                  alt="封面预览"
                  className="cover-preview"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                    setBookSearchMsg("当前封面链接不可用，可手动替换其它封面 URL");
                  }}
                />
              </div>
            ) : null}
            <Input
              value={goalInput}
              onChange={setGoalInput}
              placeholder="读完一整遍的目标分钟数（可选）"
              type="number"
            />
          </Space>
        }
        actions={[
          {
            key: "cancel",
            text: "取消",
            onClick: () => {
              setShowForm(false);
            }
          },
          { key: "ok", text: "保存", onClick: save }
        ]}
        closeOnAction
        onClose={() => setShowForm(false)}
      />

      <Modal
        visible={!!editing && !showForm}
        title={editing?.name}
        content={
          editing && stats ? (
            <div className="book-detail-modal">
              <p>打卡条数：{stats.count}</p>
              <p>最近阅读日期：{stats.latestDate}</p>
              {stats.detailLines.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          ) : null
        }
        actions={[{ key: "ok", text: "关闭" }]}
        closeOnAction
        onClose={() => setEditing(null)}
      />
    </div>
  );
}

