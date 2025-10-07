// lib/fetch-songs.js

const SPREADSHEET_ID = '1ZWRUI1LhiewLkkue3Gzdej8ECwpeFAIjIhfXPHHr_7U';
const SHEET_NAME = 'Songs';
const CACHE_KEY = 'phystech_songs_data';
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
 * Загружает и парсит данные из Google Sheets
 */
function fetchFromGoogleSheets() {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}&headers=1`;

  return fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return res.text();
    })
    .then(text => {
      const match = text.match(/google\.visualization\.Query\.setResponse\((.*)\)/);
      if (!match) throw new Error('Invalid Google Sheets JSONP response');
      const data = JSON.parse(match[1]);

      const rows = data.table.rows || [];
      const cols = data.table.cols || [];
      const headers = cols.map(c => c.label);

      if (!headers.length || !rows.length) {
        throw new Error('No data in Google Sheet');
      }

      const songs = rows.map(row => {
        const obj = {};
        headers.forEach((h, i) => {
          obj[h] = row.c?.[i]?.v ?? '';
        });
        const dateInfo = parseDate(obj.DATE);
        return {
          ...obj,
          formattedDate: dateInfo.raw,
          year: dateInfo.year
        };
      });

      // Сохраняем в кэш
      const cacheEntry = {
        timestamp: Date.now(),
        songs: songs
      };
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));
      } catch (e) {
        console.warn('Не удалось сохранить данные в localStorage', e);
      }

      return songs;
    });
}

/**
 * Основная функция: возвращает Promise с массивом песен (уже распарсенных)
 */
export async function fetchSongs() {
  // Пытаемся прочитать из кэша
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_MAX_AGE) {
        return parsed.songs;
      }
    }
  } catch (e) {
    console.warn('Ошибка чтения кэша из localStorage', e);
  }

  // Кэш отсутствует или устарел — загружаем свежие данные
  return fetchFromGoogleSheets();
}