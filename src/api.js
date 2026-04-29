const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const OMDB_API_KEY = import.meta.env.VITE_OMDB_API_KEY;

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const OMDB_BASE_URL = 'https://www.omdbapi.com/';

/**
 * Validates API keys presence
 */
export const checkApiKeys = () => {
  if (!TMDB_API_KEY || !OMDB_API_KEY) {
    console.warn("API Keys might be missing in .env");
    return false;
  }
  return true;
}

/**
 * Helper to fetch data from TMDb
 */
async function fetchFromTMDb(endpoint, queryParams = "") {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

  try {
    let url = `${TMDB_BASE_URL}${endpoint}`;
    // If TMDB_API_KEY is an access token, it goes in header. 
    // If it's a v3 standard key, it goes in query string.
    const separator = url.includes('?') ? '&' : '?';
    url += `${separator}api_key=${TMDB_API_KEY}${queryParams}`;
    
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${TMDB_API_KEY}`
      },
      signal: controller.signal
    };
    
    const response = await fetch(url, options);
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`TMDb API Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("fetchFromTMDb error:", error);
    throw error;
  }
}

/**
 * Fetch Trending Movies
 */
export async function getTrendingMovies() {
  return await fetchFromTMDb('/trending/movie/day');
}

/**
 * Fetch Popular Movies
 */
export async function getPopularMovies() {
  return await fetchFromTMDb('/movie/popular');
}

/**
 * Fetch Top Rated Movies
 */
export async function getTopRatedMovies() {
  return await fetchFromTMDb('/movie/top_rated');
}

/**
 * Fetch Upcoming Movies
 */
export async function getUpcomingMovies() {
  return await fetchFromTMDb('/movie/upcoming');
}

/**
 * Search Movies by Title
 */
export async function searchMovies(query) {
  return await fetchFromTMDb('/search/movie', `&query=${encodeURIComponent(query)}`);
}

/**
 * Get Movie Details (TMDb)
 */
export async function getMovieDetails(movieId) {
  return await fetchFromTMDb(`/movie/${movieId}`, '&append_to_response=credits,videos,similar');
}

/**
 * Get IMDb Rating (OMDb) using IMDb ID
 */
export async function getOMDbRating(imdbId) {
  if (!imdbId) return null;
  try {
    const url = `${OMDB_BASE_URL}?i=${imdbId}&apikey=${OMDB_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("OMDb API Error");
    const data = await response.json();
    return data.imdbRating || "N/A";
  } catch (error) {
    console.error("getOMDbRating error:", error);
    return "N/A";
  }
}

export function getImageUrl(path) {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE_URL}${path}`;
}

/**
 * Mappings for Recommendation Engine
 */
const GENRE_MAP = {
  "Action": 28, "Adventure": 12, "Animation": 16, "Comedy": 35, 
  "Crime": 80, "Documentary": 99, "Drama": 18, "Family": 10751, 
  "Fantasy": 14, "History": 36, "Horror": 27, "Music": 10402, 
  "Mystery": 9648, "Romance": 10749, "Sci-Fi": 878, "Thriller": 53
};

const TRAIT_MAP = {
  // Hobbies
  "gaming": [28, 878, 16],
  "traveling": [12, 99],
  "sports": [99, 18],
  "reading": [18, 36, 14],
  // Interests
  "space": [878, 12],
  "history": [36, 99],
  "crime": [80, 53],
  "psychology": [9648, 53],
  "technology": [878, 99],
  // Moods
  "feel-good": [35, 10751],
  "dark": [27, 53, 9648],
  "inspirational": [18, 99],
  "suspenseful": [53, 9648]
};

/**
 * Fetch Recommended Movies based on User Profile
 */
export async function getRecommendedMovies(profile) {
  if (!profile) return [];

  let genreIds = new Set();
  
  // Extract explicit genres
  if (profile.genres && Array.isArray(profile.genres)) {
    profile.genres.forEach(g => {
      if (GENRE_MAP[g]) genreIds.add(GENRE_MAP[g]);
    });
  }

  // Extract implicit genres from hobbies, interests, moods
  const traits = [
    ...(profile.hobbies || []),
    ...(profile.interests || []),
    ...(profile.moods || [])
  ];

  traits.forEach(trait => {
    const ids = TRAIT_MAP[trait.toLowerCase()];
    if (ids) {
      ids.forEach(id => genreIds.add(id));
    }
  });

  const genresStr = Array.from(genreIds).join('|'); // '|' acts as OR in TMDB
  
  // Base query: sort by popularity with a minimum vote count
  let query = `&sort_by=popularity.desc&vote_count.gte=500`;
  
  if (genresStr) {
    query += `&with_genres=${genresStr}`;
  }

  try {
    const data = await fetchFromTMDb('/discover/movie', query);
    // Remove duplicates if any and return top 20
    return data;
  } catch (err) {
    console.error("Recommendation fetch error", err);
    return { results: [] };
  }
}

