export async function callGemini(history: { role: "user" | "assistant"; text: string }[], apiKey: string): Promise<string> {
  const contents = history.map((h) => ({
    role: h.role === "assistant" ? "model" : "user",
    parts: [{ text: h.text }],
  }));

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents }),
    },
  );

  if (!resp.ok) throw new Error(`Gemini error: ${resp.status}`);
  const data = await resp.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ No response.";
}
