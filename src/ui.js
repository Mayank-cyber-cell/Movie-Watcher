import { getImageUrl } from './api.js';

// DOM Elements
export const elements = {
  grid: document.getElementById('movie-grid'),
  errorMessage: document.getElementById('error-message'),
  searchResultsSection: document.getElementById('search-results-section'),
  categoriesContainer: document.getElementById('categories-container'),
  
  modal: document.getElementById('movie-modal'),
  closeModal: document.getElementById('close-modal'),
  
  modalImg: document.getElementById('modal-img'),
  modalTitle: document.getElementById('modal-title'),
  modalDate: document.getElementById('modal-date'),
  modalOverview: document.getElementById('modal-overview'),
  modalGenres: document.getElementById('modal-genres'),
  modalCast: document.getElementById('modal-cast'),
  tmdbScore: document.getElementById('tmdb-score'),
  imdbScore: document.getElementById('imdb-score'),
  trailerIframe: document.getElementById('trailer-iframe'),
  trailerContainer: document.getElementById('trailer-container'),
  similarGrid: document.getElementById('similar-grid'),
  similarContainer: document.getElementById('similar-container'),
  
  favoriteBtn: document.getElementById('favorite-btn'),

  // Auth & Nav
  authModal: document.getElementById('auth-modal'),
  closeAuthModal: document.getElementById('close-auth-modal'),
  authForm: document.getElementById('auth-form'),
  authTitle: document.getElementById('auth-title'),
  nameGroup: document.getElementById('name-group'),
  authError: document.getElementById('auth-error'),
  authToggleText: document.getElementById('auth-toggle-text'),
  btnToggleAuth: document.getElementById('btn-toggle-auth'),
  authSubmit: document.getElementById('auth-submit'),

  btnSigninModal: document.getElementById('btn-signin-modal'),
  userProfile: document.getElementById('user-profile'),
  userAvatar: document.getElementById('user-avatar'),
  btnLogout: document.getElementById('btn-logout'),

  searchSuggestions: document.getElementById('search-suggestions'),
  searchInput: document.getElementById('search-input'),
  btnThemeToggle: document.getElementById('btn-theme-toggle'),
  themeIcon: document.getElementById('theme-icon'),
  btnWatchlist: document.getElementById('btn-watchlist'),
  
  // Profile
  btnProfileModal: document.getElementById('btn-profile-modal'),
  profileModal: document.getElementById('profile-modal'),
  closeProfileModal: document.getElementById('close-profile-modal'),
  profileForm: document.getElementById('profile-form'),
  profileGenres: document.getElementById('profile-genres'),
  profileHobbies: document.getElementById('profile-hobbies'),
  profileInterests: document.getElementById('profile-interests'),
  profileMoods: document.getElementById('profile-moods'),
  profileSuccess: document.getElementById('profile-success')
};
export function showSpinner() {
  elements.errorMessage.classList.add('hidden');
  elements.searchResultsSection.classList.remove('hidden');
  elements.categoriesContainer.classList.add('hidden');
  elements.grid.innerHTML = '';
  // Add skeleton loaders
  for (let i = 0; i < 10; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'movie-card skeleton-card';
    const skeletonImg = document.createElement('div');
    skeletonImg.className = 'skeleton-img';
    skeleton.appendChild(skeletonImg);
    elements.grid.appendChild(skeleton);
  }
}

export function hideSpinner() {
  // Clear is handled by renderMovies or showError gracefully
}

export function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorMessage.classList.remove('hidden');
  elements.grid.innerHTML = '';
}

function createMovieCard(movie, onMovieClick) {
  if (!movie.poster_path) return null;

  const card = document.createElement('div');
  card.className = 'movie-card';
  card.addEventListener('click', () => onMovieClick(movie.id));

  const posterUrl = getImageUrl(movie.poster_path);
  const poster = document.createElement('img');
  poster.className = 'movie-poster';
  poster.src = posterUrl;
  poster.alt = movie.title;
  poster.loading = 'lazy';

  const info = document.createElement('div');
  info.className = 'movie-info';
  
  const title = document.createElement('div');
  title.className = 'movie-title';
  title.textContent = movie.title;
  
  const meta = document.createElement('div');
  meta.className = 'movie-meta';
  
  const year = document.createElement('div');
  year.className = 'movie-year';
  year.textContent = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';

  const rating = document.createElement('div');
  rating.className = 'movie-rating';
  rating.innerHTML = `<i data-lucide="star" class="star-icon"></i> ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}`;

  meta.appendChild(year);
  meta.appendChild(rating);

  info.appendChild(title);
  info.appendChild(meta);
  card.appendChild(poster);
  card.appendChild(info);

  return card;
}

export function renderMovies(movies, onMovieClick) {
  elements.searchResultsSection.classList.remove('hidden');
  elements.categoriesContainer.classList.add('hidden');
  elements.grid.innerHTML = '';
  
  if (!movies || movies.length === 0) {
    showError("No movies found.");
    return;
  }

  movies.forEach(movie => {
    const card = createMovieCard(movie, onMovieClick);
    if (card) elements.grid.appendChild(card);
  });
  
  if (window.lucide) window.lucide.createIcons();
}

export function renderMovieRow(title, movies, onMovieClick) {
  elements.categoriesContainer.classList.remove('hidden');
  elements.searchResultsSection.classList.add('hidden');

  const rowContainer = document.createElement('div');
  rowContainer.className = 'category-row';

  const rowTitle = document.createElement('h2');
  rowTitle.className = 'section-title';
  rowTitle.textContent = title;

  const row = document.createElement('div');
  row.className = 'movie-row';

  movies.forEach(movie => {
    const card = createMovieCard(movie, onMovieClick);
    if (card) row.appendChild(card);
  });

  rowContainer.appendChild(rowTitle);
  rowContainer.appendChild(row);
  elements.categoriesContainer.appendChild(rowContainer);

  if (window.lucide) window.lucide.createIcons();
}

export function renderRecommendedRow(title, movies, onMovieClick) {
  elements.categoriesContainer.classList.remove('hidden');
  elements.searchResultsSection.classList.add('hidden');

  const rowContainer = document.createElement('div');
  rowContainer.className = 'category-row recommended-row';

  const rowTitle = document.createElement('h2');
  rowTitle.className = 'section-title';
  rowTitle.textContent = title;
  
  const row = document.createElement('div');
  row.className = 'movie-row';
  
  if (!movies || movies.length === 0) {
    row.innerHTML = `<div style="padding: 20px 5px; color: var(--text-secondary);">Complete your profile to get personalized recommendations!</div>`;
  } else {
    movies.forEach(movie => {
      const card = createMovieCard(movie, onMovieClick);
      if (card) row.appendChild(card);
    });
  }

  rowContainer.appendChild(rowTitle);
  rowContainer.appendChild(row);
  // Prepend so it appears at the top
  elements.categoriesContainer.insertBefore(rowContainer, elements.categoriesContainer.firstChild);

  if (window.lucide) window.lucide.createIcons();
}
export function renderSearchSuggestions(movies, onMovieClick) {
  elements.searchSuggestions.innerHTML = '';
  
  if (!movies || movies.length === 0) {
    elements.searchSuggestions.classList.add('hidden');
    return;
  }

  elements.searchSuggestions.classList.remove('hidden');

  movies.slice(0, 5).forEach(movie => {
    if (!movie.poster_path) return;

    const item = document.createElement('div');
    item.className = 'suggestion-item';
    item.addEventListener('click', () => {
      elements.searchSuggestions.classList.add('hidden');
      elements.searchInput.value = '';
      onMovieClick(movie.id);
    });

    const img = document.createElement('img');
    img.className = 'suggestion-img';
    img.src = getImageUrl(movie.poster_path);

    const info = document.createElement('div');
    info.className = 'suggestion-info';

    const title = document.createElement('div');
    title.className = 'suggestion-title';
    title.textContent = movie.title;

    const year = document.createElement('div');
    year.className = 'suggestion-year';
    year.textContent = movie.release_date ? movie.release_date.split('-')[0] : '';

    info.appendChild(title);
    info.appendChild(year);
    item.appendChild(img);
    item.appendChild(info);

    elements.searchSuggestions.appendChild(item);
  });
}

export function openModal() {
  elements.modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

export function closeModal() {
  elements.modal.classList.add('hidden');
  document.body.style.overflow = '';
  // Stop trailer playing when closing
  elements.trailerIframe.src = '';
}

export function populateModal(data, onMovieClick) {
  // Basic info
  elements.modalTitle.textContent = data.title;
  elements.modalDate.textContent = data.release_date ? data.release_date.split('-')[0] : 'N/A';
  elements.modalOverview.textContent = data.overview || 'No overview available.';
  elements.tmdbScore.textContent = data.vote_average ? data.vote_average.toFixed(1) : 'N/A';
  elements.imdbScore.textContent = 'Loading...'; // Updated externally

  // Poster
  if (data.poster_path) {
    elements.modalImg.src = getImageUrl(data.poster_path);
  } else {
    elements.modalImg.src = ''; 
  }

  // Genres
  elements.modalGenres.innerHTML = '';
  if (data.genres) {
    data.genres.forEach(g => {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = g.name;
      elements.modalGenres.appendChild(tag);
    });
  }

  // Cast
  elements.modalCast.innerHTML = '';
  if (data.credits && data.credits.cast) {
    const topCast = data.credits.cast.slice(0, 5);
    topCast.forEach(actor => {
      const castItem = document.createElement('div');
      castItem.className = 'cast-item';
      
      const img = document.createElement('img');
      img.className = 'cast-img';
      img.src = getImageUrl(actor.profile_path) || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="%23333"><rect width="40" height="40"/></svg>';
      
      const textContainer = document.createElement('div');
      const name = document.createElement('div');
      name.className = 'cast-name';
      name.textContent = actor.name;
      
      const char = document.createElement('div');
      char.className = 'cast-character';
      char.textContent = actor.character;

      textContainer.appendChild(name);
      textContainer.appendChild(char);
      castItem.appendChild(img);
      castItem.appendChild(textContainer);
      
      elements.modalCast.appendChild(castItem);
    });
  }

  // Trailer
  elements.trailerIframe.src = '';
  elements.trailerContainer.classList.add('hidden');
  if (data.videos && data.videos.results) {
    const trailer = data.videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    if (trailer) {
      elements.trailerContainer.classList.remove('hidden');
      elements.trailerIframe.src = `https://www.youtube.com/embed/${trailer.key}?autoplay=0`;
    }
  }

  // Similar Movies
  elements.similarGrid.innerHTML = '';
  if (data.similar && data.similar.results && data.similar.results.length > 0) {
    elements.similarContainer.classList.remove('hidden');
    data.similar.results.slice(0, 10).forEach(movie => {
      if (!movie.poster_path) return;
      const card = document.createElement('div');
      card.className = 'similar-card';
      card.addEventListener('click', () => {
        // Scroll modal to top and load new
        elements.modal.scrollTop = 0;
        onMovieClick(movie.id);
      });

      const img = document.createElement('img');
      img.src = getImageUrl(movie.poster_path);
      img.loading = 'lazy';
      
      const title = document.createElement('div');
      title.className = 'similar-title';
      title.textContent = movie.title;

      card.appendChild(img);
      card.appendChild(title);
      elements.similarGrid.appendChild(card);
    });
  } else {
    elements.similarContainer.classList.add('hidden');
  }
}

export function updateIMDbScore(score) {
  elements.imdbScore.textContent = score;
}

export function setupModalListeners() {
  elements.closeModal.addEventListener('click', closeModal);
  elements.modal.addEventListener('click', (e) => {
    if (e.target === elements.modal) {
      closeModal();
    }
  });

  // Esc key closure
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !elements.modal.classList.contains('hidden')) {
      closeModal();
    }
  });
}

export function updateFavoriteBtn(isActive) {
  if (isActive) {
    elements.favoriteBtn.classList.add('active');
    elements.favoriteBtn.querySelector('span').textContent = 'Remove from Favorites';
  } else {
    elements.favoriteBtn.classList.remove('active');
    elements.favoriteBtn.querySelector('span').textContent = 'Add to Favorites';
  }
}
