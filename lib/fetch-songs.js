// lib/fetch-songs.js

const SPREADSHEET_ID = '1ZWRUI1LhiewLkkue3Gzdej8ECwpeFAIjIhfXPHHr_7U';
const CACHE_MAX_AGE = 5 * 60 * 1000; // 5 минут

/**
 * Парсит дату из строки (поддерживает Google Sheets формат и DD.MM.YYYY)
 */
function parseDate(dateStr) {
  if (!dateStr) return { raw: '', year: 0 };
  if (dateStr.startsWith('Date(')) {
    const m = dateStr.match(/Date\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (m) {
      const y = +m[1], mth = +m[2] + 1, d = +m[3];
      return {
        raw: `${d.toString().padStart(2, '0')}.${mth.toString().padStart(2, '0')}.${y}`,
        year: y
      };
    }
  }
  const parts = dateStr.split('.');
  if (parts.length === 3 && parts[2].length === 4) {
    return { raw: dateStr, year: +parts[2] };
  }
  return { raw: dateStr, year: 0 };
}

/**
 * Обобщённая функция загрузки данных из указанного листа Google Таблицы
 * @param {string} sheetName — имя листа (например, 'Songs', 'Members')
 * @param {string} cacheKey — ключ для localStorage
 * @returns {Promise<Array<Object>>}
 */
async function fetchSheet(sheetName, cacheKey) {
  // Попытка загрузить из кэша
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_MAX_AGE) {
        return parsed.data;
      }
    }
  } catch (e) {
    console.warn(`Ошибка чтения кэша для ${sheetName}:`, e);
  }

  // Загрузка из Google
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}&headers=1`;

  let text;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    text = await res.text();
  } catch (err) {
    throw new Error(`Ошибка сети при загрузке "${sheetName}": ${err.message}`);
  }

  // Парсинг JSONP
  const match = text.match(/google\.visualization\.Query\.setResponse\((.*)\)/);
  if (!match) throw new Error(`Некорректный ответ Google для "${sheetName}"`);

  let data;
  try {
    data = JSON.parse(match[1]);
  } catch (e) {
    throw new Error(`Ошибка парсинга JSON для "${sheetName}"`);
  }

  const rows = data.table.rows || [];
  const cols = data.table.cols || [];
  const headers = cols.map(c => c.label);

  if (!headers.length) {
    throw new Error(`Нет заголовков в листе "${sheetName}"`);
  }

  const result = rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row.c?.[i]?.v ?? '';
    });

    // Для таблиц, где есть поле DATE, добавляем formattedDate и year
    if (obj.DATE !== undefined) {
      const dateInfo = parseDate(obj.DATE);
      obj.formattedDate = dateInfo.raw;
      obj.year = dateInfo.year;
    }

    return obj;
  });

  // Сохраняем в кэш
  try {
    localStorage.setItem(cacheKey, JSON.stringify({
      timestamp: Date.now(),
      data: result
    }));
  } catch (e) {
    console.warn(`Не удалось сохранить кэш для "${sheetName}"`, e);
  }

  return result;
}

// === Экспортируемые функции ===

export function fetchSongs() {
  return fetchSheet('Songs', 'phystech_songs_data');
}

export function fetchMembers() {
  return fetchSheet('Members', 'phystech_members_data');
}

export function fetchConcerts() {
  return fetchSheet('Concerts', 'phystech_concerts_data');
}