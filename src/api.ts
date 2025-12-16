const baseUrl = import.meta.env.VITE_API_BASE_URL;

export async function getItems() {
  const res = await fetch(`${baseUrl}/api/items`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
