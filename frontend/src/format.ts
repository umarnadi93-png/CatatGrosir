import dayjs from "dayjs";
import "dayjs/locale/id";

dayjs.locale("id");

export { dayjs };

export const rp = (n: number) => {
  const v = Math.round(n || 0);
  const s = String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${v < 0 ? "-" : ""}Rp ${s}`;
};

export const toNum = (s: string) => Number(String(s).replace(/[^0-9]/g, "")) || 0;

export const fmtTime = (iso: string) => dayjs(iso).format("HH:mm");
export const fmtDate = (iso: string) => dayjs(iso).format("DD MMM YYYY, HH:mm");

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
