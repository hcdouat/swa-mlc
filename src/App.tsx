import { useEffect, useState } from "react";
import { getItems } from "./api";

export default function App() {
  const [data, setData] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    getItems()
      .then(setData)
      .catch((e) => setErr(e?.message ?? "Unknown error"));
  }, []);

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1>MLC Frontend</h1>

      <p>
        API: <code>{import.meta.env.VITE_API_BASE_URL}</code>
      </p>

      {err && <pre style={{ whiteSpace: "pre-wrap" }}>Error: {err}</pre>}
      {!err && data === null && <p>Loading...</p>}

      {Array.isArray(data) && (
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
