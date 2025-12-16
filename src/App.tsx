import { useEffect, useState } from "react";
import { getItems } from "./api";
import { WonRevenueStackedBar } from "./features/revenue/WonRevenueStackedBar"; // the new chart component

export default function App() {
  const [data, setData] = useState<any[] | null>(null); // Deals data
  const [err, setErr] = useState<string | null>(null); // Error handling

  // Fetch deals data on mount
  useEffect(() => {
    // Set global styles
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.documentElement.style.width = "100%";
    document.body.style.width = "100%";
    
    getItems()
      .then(setData)
      .catch((e) => setErr(e?.message ?? "Unknown error"));
  }, []);

  return (
    <div style={{ 
      width: "100vw",
      padding: "24px",
      boxSizing: "border-box",
      fontFamily: "system-ui, sans-serif" 
    }}>

      {/* Display errors */}
      {err && <pre style={{ whiteSpace: "pre-wrap" }}>Error: {err}</pre>}

      {/* Loader state */}
      {!err && data === null && <p>Loading...</p>}

      {/* Display the data (useful for debugging) */}
      {/* {Array.isArray(data) && (
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )} */}

      {/* Main dashboard visual */}
      {Array.isArray(data) && (
        <div style={{ marginTop: 16, width: "100%" }}>
          {/* Add the chart */}
          <WonRevenueStackedBar deals={data} />
        </div>
      )}
    </div>
  );
}
