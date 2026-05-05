import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { TabBar } from "antd-mobile";
import CheckInPage from "./pages/CheckInPage";
import HistoryPage from "./pages/HistoryPage";
import BookshelfPage from "./pages/BookshelfPage";
import StatsPage from "./pages/StatsPage";

const tabs = [
  { key: "/checkin", title: "今日打卡", icon: "🏠" },
  { key: "/history", title: "历史记录", icon: "📅" },
  { key: "/books", title: "我的书架", icon: "📚" }
];

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/checkin" element={<CheckInPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/books" element={<BookshelfPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="*" element={<Navigate to="/checkin" replace />} />
      </Routes>

      <TabBar className="bottom-tabs" activeKey={location.pathname} onChange={(key) => navigate(key)}>
        {tabs.map((tab) => (
          <TabBar.Item key={tab.key} icon={tab.icon} title={tab.title} />
        ))}
      </TabBar>
    </div>
  );
}
