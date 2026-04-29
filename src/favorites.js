import { getCurrentUser } from './auth.js';

function getFavoritesKey() {
  const user = getCurrentUser();
  if (!user) return 'moviewatcher_favorites_guest';
  return `moviewatcher_favorites_${user.id}`;
}

export function getFavorites() {
  const key = getFavoritesKey();
  const favs = localStorage.getItem(key);
  return favs ? JSON.parse(favs) : [];
}

export function isFavorite(movieId) {
  const favs = getFavorites();
  return favs.some(movie => movie.id === movieId);
}

export function toggleFavorite(movieData) {
  let favs = getFavorites();
  const index = favs.findIndex(m => m.id === movieData.id);
  let isActive = false;

  if (index !== -1) {
    // Remove
    favs.splice(index, 1);
    isActive = false;
  } else {
    // Add
    favs.push(movieData);
    isActive = true;
  }

  const key = getFavoritesKey();
  localStorage.setItem(key, JSON.stringify(favs));
  return isActive;
}
