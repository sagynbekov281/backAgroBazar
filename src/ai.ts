import { DbMessage } from './db';

export const AI_USER_ID = 'ai-assistant';
export const AI_USER_NAME = 'AgroBazar AI';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const SYSTEM_PROMPT = `Ты — ИИ-ассистент маркетплейса AgroBazar для фермеров, покупателей, кооперативов и экспортёров в Кыргызстане.
Помогаешь с вопросами про товары, цены на сельхозпродукцию, транспорт/доставку, объявления, работу с личным кабинетом.
Отвечай кратко и по делу. Если вопрос не связан с платформой — отвечай как обычный полезный ассистент.
Пиши на том языке, на котором пишет пользователь (русский или кыргызский).`;

export async function askAI(history: DbMessage[], newText: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    return 'ИИ-ассистент временно недоступен (не настроен API-ключ на сервере).';
  }

  const contents = history
    .filter(m => m.type !== 'system' && m.text)
    .slice(-20)
    .map(m => ({
      role: (m.senderId === AI_USER_ID ? 'model' : 'user') as 'model' | 'user',
      parts: [{ text: m.text }],
    }));
  contents.push({ role: 'user', parts: [{ text: newText }] });

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        generationConfig: { maxOutputTokens: 1000 },
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('Gemini API error:', res.status, errText);
      return 'Не получилось получить ответ от ИИ. Попробуйте чуть позже.';
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text?.trim() || 'Не смог сформировать ответ, попробуйте переформулировать вопрос.';
  } catch (err) {
    console.error('AI request failed:', err);
    return 'Ошибка при обращении к ИИ. Попробуйте позже.';
  }
}