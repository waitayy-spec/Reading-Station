export const randomId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const getColorByText = (text: string) => {
  const colors = ["#FFD166", "#95D5B2", "#A0C4FF", "#F7B267", "#CDB4DB", "#90DBF4"];
  const code = text.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return colors[code % colors.length];
};
