import { ChangeEvent, useMemo, useRef } from "react";
import dayjs from "dayjs";
import { Button, Space } from "antd-mobile";
import { Bar } from "react-chartjs-2";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  BarElement
} from "chart.js";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { exportCSV, exportJSON, getBooks, getRecords, importData } from "../utils/storage";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function StatsPage() {
  const navigate = useNavigate();
  const records = getRecords();
  const books = getBooks();
  const fileRef = useRef<HTMLInputElement>(null);

  const totalDays = new Set(records.map((item) => item.date)).size;
  const totalMinutes = records.reduce((sum, item) => sum + item.duration, 0);

  const streak = useMemo(() => {
    const dateSet = new Set(records.map((item) => item.date));
    let count = 0;
    let cursor = dayjs();
    while (dateSet.has(cursor.format("YYYY-MM-DD"))) {
      count += 1;
      cursor = cursor.subtract(1, "day");
    }
    return count;
  }, [records]);

  const buildSeries = (days: number) => {
    const dates = Array.from({ length: days }, (_, idx) => dayjs().subtract(days - idx - 1, "day"));
    const labels = dates.map((d) => d.format("MM-DD"));
    const values = dates.map((d) => {
      const key = d.format("YYYY-MM-DD");
      return records.filter((item) => item.date === key).reduce((sum, item) => sum + item.duration, 0);
    });
    return { labels, values };
  };

  const chart7 = buildSeries(7);
  const chart30 = buildSeries(30);

  const downloadText = (filename: string, text: string, mime: string) => {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImport = async (ev: ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    importData(text);
    window.location.reload();
  };

  const badge = streak >= 100 ? "100天坚持王者" : streak >= 21 ? "21天阅读达人" : streak >= 7 ? "7天阅读新星" : "继续坚持吧";

  return (
    <div className="page">
      <PageHeader title="我的阅读成长" subtitle="看见每一次努力" />
      <div className="card stats-grid">
        <div><b>{totalDays}</b><p>总打卡天数</p></div>
        <div><b>{totalMinutes}</b><p>总阅读分钟</p></div>
        <div><b>{books.length}</b><p>阅读书籍数量</p></div>
      </div>
      <div className="card">
        <h4>连续打卡：{streak} 天</h4>
        <p>成就徽章：{badge}</p>
      </div>
      <div className="card">
        <h4>近7天阅读时长</h4>
        <Bar data={{ labels: chart7.labels, datasets: [{ label: "分钟", data: chart7.values, backgroundColor: "#95D5B2" }] }} />
      </div>
      <div className="card">
        <h4>近30天阅读时长</h4>
        <Bar data={{ labels: chart30.labels, datasets: [{ label: "分钟", data: chart30.values, backgroundColor: "#A0C4FF" }] }} />
      </div>
      <div className="card">
        <Space wrap>
          <Button color="warning" onClick={() => downloadText("reading-backup.json", exportJSON(), "application/json")}>导出JSON</Button>
          <Button color="primary" onClick={() => downloadText("reading-backup.csv", exportCSV(), "text/csv")}>导出CSV</Button>
          <Button onClick={() => fileRef.current?.click()}>导入备份</Button>
          <Button fill="outline" onClick={() => navigate("/checkin")}>返回今日打卡</Button>
        </Space>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={onImport} />
      </div>
    </div>
  );
}

