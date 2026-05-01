# 儿童阅读打卡（React + TS + Vite）

一个面向亲子阅读场景的移动端 H5 应用，支持：
- 今日打卡（书籍选择、阅读时长、笔记、心情贴纸、鼓励动画）
- 历史记录（日历视图 + 列表视图 + 月份切换）
- 我的书架（添加/编辑/删除、阅读统计）
- 我的成长（7/30天图表、连续打卡徽章、数据导入导出）

## 启动方式

```bash
npm install
npm run dev
```

### 启动前后端（推荐）

```bash
npm run dev:all
```

其中：
- 前端：`http://localhost:5173`
- 后端：`http://localhost:8787`

构建生产包：

```bash
npm run build
npm run preview
```

## 后端与部署（手机/PAD长期可用）

项目已内置免费书籍聚合后端：`backend/server.js`，核心接口：
- `GET /api/health`
- `GET /api/books/search?q=关键词&age=all|3-6|6-9|9-12`

### 云部署建议
- 前端部署到 Vercel
- 后端部署到 Render/Railway

前端支持环境变量 `VITE_API_BASE`：
- 本地开发可留空（走 Vite 代理到本地后端）
- 云端部署时设为后端公网地址，例如：
  - `VITE_API_BASE=https://your-backend.onrender.com`

### 一键化配置文件（已内置）
- `render.yaml`：Render 自动识别后端构建/启动/健康检查
- `vercel.json`：Vercel 自动识别前端构建输出目录

## 技术栈

- React 18 + TypeScript + Vite
- React Router DOM
- Ant Design Mobile
- Day.js
- Chart.js + react-chartjs-2
- localStorage 本地持久化
