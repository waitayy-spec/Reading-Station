import { Book, CheckinRecord } from "../types";

export interface BookReadingGoalProgress {
  hasGoal: true;
  totalMinutes: number;
  checkinCount: number;
  goalMinutes: number;
  /** 累计完整读完的遍数（向下取整） */
  completedFullReads: number;
  /** 当前这一轮已读分钟数（对目标取模） */
  currentRoundMinutes: number;
  /** 当前这一轮距离「读完一遍」还剩多少分钟 */
  remainingInCurrentRound: number;
}

export interface BookReadingNoGoalProgress {
  hasGoal: false;
  totalMinutes: number;
  checkinCount: number;
}

export type BookReadingProgress = BookReadingGoalProgress | BookReadingNoGoalProgress;

export function computeBookReadingProgress(book: Book, records: CheckinRecord[]): BookReadingProgress {
  const list = records.filter((r) => r.bookId === book.id);
  const totalMinutes = list.reduce((s, r) => s + r.duration, 0);
  const checkinCount = list.length;
  const goalRaw = book.goalMinutes;
  const goal = goalRaw != null && goalRaw > 0 ? Math.floor(goalRaw) : 0;
  if (!goal) {
    return { hasGoal: false, totalMinutes, checkinCount };
  }
  const completedFullReads = Math.floor(totalMinutes / goal);
  const currentRoundMinutes = totalMinutes % goal;
  const remainingInCurrentRound =
    currentRoundMinutes === 0 ? goal : goal - currentRoundMinutes;

  return {
    hasGoal: true,
    totalMinutes,
    checkinCount,
    goalMinutes: goal,
    completedFullReads,
    currentRoundMinutes,
    remainingInCurrentRound
  };
}

/** 书架卡片一行摘要 */
export function formatBookProgressSummary(p: BookReadingProgress): string {
  if (!p.hasGoal) {
    return `累计 ${p.totalMinutes} 分钟 · ${p.checkinCount} 次打卡`;
  }
  const { completedFullReads, currentRoundMinutes, remainingInCurrentRound, goalMinutes, totalMinutes } = p;
  if (completedFullReads === 0) {
    if (totalMinutes === 0) return `目标 ${goalMinutes} 分钟，还未开读`;
    return `第 1 遍：已读 ${currentRoundMinutes} 分，还剩 ${remainingInCurrentRound} 分`;
  }
  if (currentRoundMinutes === 0) {
    return `已完整读完 ${completedFullReads} 遍 · 下一遍目标 ${goalMinutes} 分钟`;
  }
  return `已完整读完 ${completedFullReads} 遍 · 本轮已读 ${currentRoundMinutes} 分，还剩 ${remainingInCurrentRound} 分`;
}

/** 详情弹窗多行说明 */
export function formatBookProgressDetail(p: BookReadingProgress): string[] {
  if (!p.hasGoal) {
    return [
      `未设置「读完目标」：仅统计累计时长与打卡次数。`,
      `累计阅读 ${p.totalMinutes} 分钟，共 ${p.checkinCount} 次打卡。`
    ];
  }
  const lines: string[] = [];
  lines.push(`读完目标：每遍 ${p.goalMinutes} 分钟（累计达到即算读完 1 遍）。`);
  lines.push(`累计阅读 ${p.totalMinutes} 分钟，打卡 ${p.checkinCount} 次。`);
  lines.push(`已完整读完：${p.completedFullReads} 遍。`);
  if (p.completedFullReads === 0) {
    if (p.totalMinutes === 0) {
      lines.push(`当前进度：尚未开始，距离第 1 遍读完还差 ${p.goalMinutes} 分钟。`);
    } else {
      lines.push(
        `当前为第 1 遍：已读 ${p.currentRoundMinutes} 分钟，还剩 ${p.remainingInCurrentRound} 分钟读完这一遍。`
      );
    }
  } else if (p.currentRoundMinutes === 0) {
    lines.push(`上一遍刚好读完；再读将计入第 ${p.completedFullReads + 1} 遍，本轮还需读满 ${p.goalMinutes} 分钟。`);
  } else {
    lines.push(
      `第 ${p.completedFullReads + 1} 遍进行中：本轮已读 ${p.currentRoundMinutes} 分钟，还剩 ${p.remainingInCurrentRound} 分钟读完这一遍。`
    );
  }
  return lines;
}
