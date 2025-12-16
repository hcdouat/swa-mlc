type Deal = {
  status: string;
  funil: string;
  valor_recorrente: string | number | null;
  valor_nao_recorrente: string | number | null;
  // choose one date field (see below)
  data_fechamento?: string | null;
  previsao_fechamento?: string | null;
};

function toNumber(v: Deal["valor_recorrente"]) {
  if (v === null || v === undefined) return 0;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function monthKey(iso: string) {
  // iso like "2025-12-15T00:00:00.000Z"
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`; // "YYYY-MM"
}

export function aggregateWonByMonthAndFunnel(
  deals: Deal[],
  dateField: "data_fechamento" | "previsao_fechamento" = "data_fechamento"
) {
  const map = new Map<string, Record<string, number>>();

  for (const d of deals) {
    if (d.status !== "Ganha") continue;

    const dt = d[dateField] ?? null;
    if (!dt) continue;

    const month = monthKey(dt);
    const funnel = d.funil || "Sem funil";

    const total = toNumber(d.valor_recorrente) + toNumber(d.valor_nao_recorrente);

    const row = map.get(month) ?? {};
    row[funnel] = (row[funnel] ?? 0) + total;
    map.set(month, row);
  }

  // convert to recharts-friendly array: [{ month: "2025-12", Transportes: 123, ... }]
  const months = Array.from(map.keys()).sort();
  const funnels = new Set<string>();
  for (const v of map.values()) Object.keys(v).forEach((f) => funnels.add(f));

  const data = months.map((m) => ({
    month: m,
    ...Object.fromEntries(Array.from(funnels).map((f) => [f, map.get(m)?.[f] ?? 0])),
  }));

  return { data, funnels: Array.from(funnels) };
}
