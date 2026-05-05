import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { Button, Modal, Segmented, Space } from "antd-mobile";
import PageHeader from "../components/PageHeader";
import { getRecords } from "../utils/storage";
import { moodOptions } from "../utils/constants";

const weekTitles = ["日", "一", "二", "三", "四", "五", "六"];

export default function HistoryPage() {
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [month, setMonth] = useState(dayjs());
  const [visibleCount, setVisibleCount] = useState(20);
  const records = getRecords().sort((a, b) => (a.date > b.date ? -1 : 1));
  const [detailId, setDetailId] = useState<string | null>(null);

  const monthRecords = useMemo(
    () => records.filter((item) => dayjs(item.date).format("YYYY-MM") === month.format("YYYY-MM")),
    [records, month]
  );

  const days = useMemo(() => {
    const start = month.startOf("month");
    const end = month.endOf("month");
    const startWeek = start.day();
    const total = end.date() + startWeek;
    return Array.from({ length: Math.ceil(total / 7) * 7 }, (_, idx) => {
      const date = start.subtract(startWeek, "day").add(idx, "day");
      const key = date.format("YYYY-MM-DD");
      return {
        key,
        date,
        inMonth: date.month() === month.month(),
        record: records.find((item) => item.date === key)
      };
    });
  }, [month, records]);

  const detail = records.find((item) => item.id === detailId);

  return (
    <div className="page">
      <PageHeader title="阅读历史" subtitle="月历和列表都能查看" />
      <div className="card">
        <Segmented
          options={[
            { label: "日历视图", value: "calendar" },
            { label: "列表视图", value: "list" }
          ]}
          value={view}
          onChange={(value) => setView(value as "calendar" | "list")}
        />

        <div className="month-row">
          <Button size="small" onClick={() => setMonth((m) => m.subtract(1, "month"))}>上月</Button>
          <b>{month.format("YYYY年MM月")}</b>
          <Button size="small" onClick={() => setMonth((m) => m.add(1, "month"))}>下月</Button>
        </div>

        {view === "calendar" ? (
          <div>
            <div className="calendar week-row">{weekTitles.map((w) => <span key={w}>{w}</span>)}</div>
            <div className="calendar">
              {days.map((day) => (
                <button
                  key={day.key}
                  className={`day-cell ${day.inMonth ? "" : "muted"}`}
                  onClick={() => day.record && setDetailId(day.record.id)}
                >
                  <span>{day.date.date()}</span>
                  {day.record ? <i className="dot" /> : null}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <Space direction="vertical" block>
            {monthRecords.slice(0, visibleCount).map((record) => (
              <div className="record-item" key={record.id} onClick={() => setDetailId(record.id)}>
                <div>
                  <b>{record.bookName}</b>
                  <p>{record.date}</p>
                </div>
                <div>
                  <b>{record.duration} 分钟</b>
                  <p>{moodOptions.find((m) => m.key === record.mood)?.emoji}</p>
                </div>
              </div>
            ))}

            {visibleCount < monthRecords.length ? (
              <Button fill="outline" onClick={() => setVisibleCount((n) => n + 20)}>查看更多记录</Button>
            ) : null}
          </Space>
        )}
      </div>

      <Modal
        visible={!!detail}
        content={
          detail ? (
            <div>
              <h4>{detail.bookName}</h4>
              <p>{detail.date}</p>
              <p>时长：{detail.duration} 分钟</p>
              <p>心情：{moodOptions.find((m) => m.key === detail.mood)?.emoji}</p>
              <p>感受：{detail.note || "（没有填写）"}</p>
            </div>
          ) : null
        }
        closeOnAction
        actions={[{ key: "ok", text: "知道啦" }]}
        onClose={() => setDetailId(null)}
      />
    </div>
  );
}

