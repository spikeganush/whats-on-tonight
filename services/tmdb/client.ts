const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_READ_TOKEN = process.env.EXPO_PUBLIC_TMDB_READ_TOKEN;

export const tmdbFetch = async (endpoint: string, params: Record<string, string> = {}) => {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  if (!TMDB_READ_TOKEN) {
    console.error("[TMDB] Missing EXPO_PUBLIC_TMDB_READ_TOKEN!");
  }

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${TMDB_READ_TOKEN}`
    }
  };

  try {
    const response = await fetch(url.toString(), options);
    if (!response.ok) {
      throw new Error(`TMDB API Error: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("TMDB Fetch Error:", error);
    throw error;
  }
};
