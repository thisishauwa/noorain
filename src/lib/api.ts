export const API_BASE = "https://api.qurancdn.com/api/qdc";

const getHeaders = () => ({
  "x-client-id": import.meta.env.VITE_QURAN_CLIENT_ID as string,
  "x-auth-token": import.meta.env.VITE_QURAN_AUTH_TOKEN as string,
});

export interface Chapter {
  id: number;
  revelation_place: string;
  revelation_order: number;
  bismillah_pre: boolean;
  name_simple: string;
  name_complex: string;
  name_arabic: string;
  verses_count: number;
  pages: number[];
  translated_name: {
    language_name: string;
    name: string;
  };
}

export interface Word {
  id: number;
  position: number;
  audio_url: string;
  char_type_name: string;
  text_uthmani: string;
  translation: {
    text: string;
    language_name: string;
  };
  transliteration: {
    text: string;
    language_name: string;
  };
}

export interface Verse {
  id: number;
  verse_number: number;
  verse_key: string;
  hizb_number: number;
  rub_el_hizb_number: number;
  ruku_number: number;
  manzil_number: number;
  sajdah_number: number | null;
  text_uthmani: string;
  page_number: number;
  juz_number: number;
  words: Word[];
  translations: {
    id: number;
    resource_id: number;
    text: string;
  }[];
  audio?: {
    url: string;
    duration?: number;
  };
}

export interface Juz {
  id: number;
  juz_number: number;
  verse_mapping: Record<string, string>;
  first_verse_id: number;
  last_verse_id: number;
  verses_count: number;
}

export interface Recitation {
  id: number;
  reciter_name: string;
  style: string;
  translated_name: {
    name: string;
    language_name: string;
  };
}

export interface Tafsir {
  resource_name: string;
  text: string;
}

export const fetchChapters = async (): Promise<Chapter[]> => {
  const res = await fetch(`${API_BASE}/chapters?language=en`, {
    headers: getHeaders(),
  });
  const data = await res.json();
  return data.chapters;
};

export const fetchJuzs = async (): Promise<Juz[]> => {
  const res = await fetch(`${API_BASE}/juzs`, { headers: getHeaders() });
  const data = await res.json();
  return data.juzs;
};

export const fetchVersesByPage = async (
  pageNumber: number,
): Promise<Verse[]> => {
  const res = await fetch(
    `${API_BASE}/verses/by_page/${pageNumber}?language=en&words=true&translations=85,57&word_fields=text_uthmani,transliteration,audio_url&fields=text_uthmani&audio=7`,
    { headers: getHeaders() },
  );
  const data = await res.json();
  return data.verses;
};

export const fetchAudio = async (
  recitationId: number,
  ayahKey: string,
): Promise<string> => {
  const res = await fetch(
    `https://api.quran.com/api/v4/recitations/${recitationId}/by_ayah/${ayahKey}`,
  );
  const data = await res.json();
  return data.audio_files[0].url;
};

export const fetchRecitations = async (): Promise<Recitation[]> => {
  const res = await fetch(`${API_BASE}/resources/recitations?language=en`, {
    headers: getHeaders(),
  });
  const data = await res.json();
  return data.recitations;
};

export const fetchTafsir = async (
  ayahKey: string,
  tafsirId: number = 169,
): Promise<Tafsir> => {
  const res = await fetch(
    `${API_BASE}/tafsirs/${tafsirId}/by_ayah/${ayahKey}`,
    { headers: getHeaders() },
  );
  const data = await res.json();
  return data.tafsir;
};
