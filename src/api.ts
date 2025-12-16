const baseUrl =  "https://app-mlc-api-epdqf4eye5etd4dh.canadacentral-01.azurewebsites.net"; // "http://localhost:3000";
export async function getItems() {
  const res = await fetch(`${baseUrl}/api/items`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
