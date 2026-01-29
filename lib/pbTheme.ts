export const FONT_STACK =
  '"Pretendard Variable","Pretendard",system-ui,-apple-system,"Segoe UI","Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif';

export const ACCENT = "#ffb600";
export const ACCENT_SOFT = "#fff9e8";
export const ACCENT_LINE = "#ffe6ad";
export const ACCENT_TEXT = "#7a5200";

export const PAGE_BG = "#ffffff";

export const card = {
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  background: "#fff",
};

export const softCard = {
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  background: "#fafafa",
};

export const input = {
  width: "100%",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "10px 12px",
  fontSize: 14,
  outline: "none",
  background: "#fff",
  boxSizing: "border-box" as const,
  fontFamily: "inherit",
};

export const pill = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid #e5e7eb",
  background: "#fff",
  fontSize: 12,
  fontWeight: 700,
  color: "#111827",
};

export const btn = {
  padding: "8px 12px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#fff",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
};

export const btnAccent = {
  ...btn,
  border: `1px solid ${ACCENT_LINE}`,
  background: ACCENT_SOFT,
  color: ACCENT_TEXT,
};

export const btnDanger = {
  ...btn,
  border: "1px solid #fecaca",
  color: "#ef4444",
};
