import * as api from './api.js';
import * as ui from './ui.js';
import * as favorites from './favorites.js';
import * as auth from './auth.js';

let currentMovieData = null;
let searchTimeout = null;

async function init() {
  ui.setupModalListeners();
  setupSearchListener();
  setupFavoriteListener();
  setupThemeToggle();
  setupAuthListeners();
  setupProfileListeners();
  
  // Apply saved theme
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    ui.elements.themeIcon.setAttribute('data-lucide', 'sun');
  }

  // Init Auth State
  updateAuthState();

  if(!api.checkApiKeys()) {
    ui.showError("Please set your TMDb and OMDb API keys in the .env file.");
    return;
  }

  // Load Home Categories
  loadAllCategories();
}

async function loadAllCategories() {
  ui.elements.categoriesContainer.innerHTML = ''; // clear existing
  ui.showSpinner();
  
  try {
    const user = auth.getCurrentUser();
    
    const fetchPromises = [
      api.getTrendingMovies(),
      api.getPopularMovies(),
      api.getTopRatedMovies(),
      api.getUpcomingMovies()
    ];
    
    let recommended = null;
    if (user && user.profile) {
      fetchPromises.push(api.getRecommendedMovies(user.profile));
    }

    const results = await Promise.all(fetchPromises);
    
    const trending = results[0];
    const popular = results[1];
    const topRated = results[2];
    const upcoming = results[3];
    if (user && user.profile) {
      recommended = results[4];
    }
    
    ui.hideSpinner();
    ui.elements.errorMessage.classList.add('hidden');
    ui.elements.grid.innerHTML = ''; // Clear search grid
    
    if (user) {
      if (recommended && recommended.results && recommended.results.length > 0) {
        ui.renderRecommendedRow('Recommended for You', recommended.results, handleMovieClick);
      } else {
        ui.renderRecommendedRow('Recommended for You', [], handleMovieClick);
      }
    }
    
    ui.renderMovieRow('Trending Now', trending.results, handleMovieClick);
    ui.renderMovieRow('Popular', popular.results, handleMovieClick);
    ui.renderMovieRow('Top Rated', topRated.results, handleMovieClick);
    ui.renderMovieRow('Upcoming', upcoming.results, handleMovieClick);
    
  } catch (error) {
    ui.hideSpinner();
    if (error.name === 'AbortError' || error.message.includes('fetch failed')) {
      ui.showError("Connection timed out. TMDb API is often blocked by ISPs in certain regions. You may need to use a VPN.");
    } else {
      ui.showError("Failed to load movies. Check API configuration.");
    }
  }
}

function loadWatchlist() {
  const favs = favorites.getFavorites();
  ui.elements.categoriesContainer.classList.add('hidden');
  ui.elements.searchResultsSection.classList.remove('hidden');
  
  if (favs.length === 0) {
    ui.showError("Your Watchlist is empty!");
    return;
  }
  
  ui.elements.searchResultsSection.querySelector('.section-title').textContent = "My Watchlist";
  ui.renderMovies(favs, handleMovieClick);
}

function setupSearchListener() {
  const searchInput = ui.elements.searchInput;
  const searchSuggestions = ui.elements.searchSuggestions;
  
  // Close suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      searchSuggestions.classList.add('hidden');
    }
  });

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    
    // Debounce search
    clearTimeout(searchTimeout);
    
    if (query === '') {
      searchSuggestions.classList.add('hidden');
      loadAllCategories();
      return;
    }

    searchTimeout = setTimeout(async () => {
      try {
        const data = await api.searchMovies(query);
        ui.renderSearchSuggestions(data.results, handleMovieClick);
      } catch (error) {
        console.error("Search suggestion error:", error);
      }
    }, 400); // 400ms delay
  });

  // Handle full search submission (Enter key or button)
  const executeFullSearch = async () => {
    const query = searchInput.value.trim();
    if (!query) return;
    
    searchSuggestions.classList.add('hidden');
    ui.showSpinner();
    try {
      const data = await api.searchMovies(query);
      ui.hideSpinner();
      ui.elements.searchResultsSection.querySelector('.section-title').textContent = `Search Results for "${query}"`;
      ui.renderMovies(data.results, handleMovieClick);
    } catch (error) {
      ui.hideSpinner();
      ui.showError("Search failed to execute.");
    }
  };

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      executeFullSearch();
    }
  });

  document.getElementById('search-button').addEventListener('click', executeFullSearch);
}

function setupFavoriteListener() {
  ui.elements.favoriteBtn.addEventListener('click', () => {
    if (!currentMovieData) return;
    
    const user = auth.getCurrentUser();
    if (!user) {
      alert("Please Sign In to add movies to your Watchlist.");
      return;
    }

    const movieObj = {
      id: currentMovieData.id,
      title: currentMovieData.title,
      poster_path: currentMovieData.poster_path,
      release_date: currentMovieData.release_date
    };
    
    const isActive = favorites.toggleFavorite(movieObj);
    ui.updateFavoriteBtn(isActive);
  });
}

async function handleMovieClick(movieId) {
  ui.openModal();
  try {
    currentMovieData = await api.getMovieDetails(movieId);
    ui.populateModal(currentMovieData, handleMovieClick);
    
    const isFav = favorites.isFavorite(movieId);
    ui.updateFavoriteBtn(isFav);

    if (currentMovieData.imdb_id) {
      const imdbRating = await api.getOMDbRating(currentMovieData.imdb_id);
      ui.updateIMDbScore(imdbRating);
    }
  } catch (error) {
    console.error("Error loading movie details:", error);
    ui.closeModal();
  }
}

// --- Theme Toggle ---
function setupThemeToggle() {
  ui.elements.btnThemeToggle.addEventListener('click', () => {
    const html = document.documentElement;
    const isLight = html.getAttribute('data-theme') === 'light';
    
    if (isLight) {
      html.removeAttribute('data-theme');
      localStorage.setItem('theme', 'dark');
      ui.elements.themeIcon.setAttribute('data-lucide', 'moon');
    } else {
      html.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
      ui.elements.themeIcon.setAttribute('data-lucide', 'sun');
    }
    window.lucide.createIcons();
  });
}

// --- Authentication UI ---
let isSignUpMode = false;

function setupAuthListeners() {
  ui.elements.btnSigninModal.addEventListener('click', () => {
    ui.elements.authModal.classList.remove('hidden');
    isSignUpMode = false;
    updateAuthModalUI();
  });

  ui.elements.closeAuthModal.addEventListener('click', () => {
    ui.elements.authModal.classList.add('hidden');
    ui.elements.authError.classList.add('hidden');
  });

  ui.elements.btnToggleAuth.addEventListener('click', (e) => {
    e.preventDefault();
    isSignUpMode = !isSignUpMode;
    updateAuthModalUI();
  });

  ui.elements.authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    ui.elements.authError.classList.add('hidden');

    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value.trim();
    const name = document.getElementById('auth-name').value.trim();

    try {
      if (isSignUpMode) {
        if (!name) throw new Error("Name is required");
        auth.signUp(email, password, name);
      } else {
        auth.signIn(email, password);
      }
      
      ui.elements.authModal.classList.add('hidden');
      ui.elements.authForm.reset();
      updateAuthState();
    } catch (err) {
      ui.elements.authError.textContent = err.message;
      ui.elements.authError.classList.remove('hidden');
    }
  });

  ui.elements.btnLogout.addEventListener('click', () => {
    auth.signOut();
    updateAuthState();
    loadAllCategories(); // Reload home, clear watchlist view
  });

  ui.elements.btnWatchlist.addEventListener('click', loadWatchlist);
  document.querySelector('.logo').addEventListener('click', () => {
    ui.elements.searchInput.value = '';
    loadAllCategories();
  });
}

function setupProfileListeners() {
  ui.elements.btnProfileModal.addEventListener('click', () => {
    const user = auth.getCurrentUser();
    if (!user) return;
    
    ui.elements.profileModal.classList.remove('hidden');
    ui.elements.profileSuccess.classList.add('hidden');
    
    const profile = user.profile || {};
    ui.elements.profileGenres.value = (profile.genres || []).join(', ');
    ui.elements.profileHobbies.value = (profile.hobbies || []).join(', ');
    ui.elements.profileInterests.value = (profile.interests || []).join(', ');
    ui.elements.profileMoods.value = (profile.moods || []).join(', ');
  });

  ui.elements.closeProfileModal.addEventListener('click', () => {
    ui.elements.profileModal.classList.add('hidden');
  });

  ui.elements.profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = auth.getCurrentUser();
    if (!user) return;

    const parseInput = (val) => val.split(',').map(s => s.trim()).filter(s => s);

    const profileData = {
      genres: parseInput(ui.elements.profileGenres.value),
      hobbies: parseInput(ui.elements.profileHobbies.value),
      interests: parseInput(ui.elements.profileInterests.value),
      moods: parseInput(ui.elements.profileMoods.value)
    };

    auth.updateUserProfile(user.email, profileData);
    
    ui.elements.profileSuccess.classList.remove('hidden');
    
    setTimeout(() => {
      ui.elements.profileModal.classList.add('hidden');
      loadAllCategories();
    }, 1500);
  });
}

function updateAuthModalUI() {
  if (isSignUpMode) {
    ui.elements.authTitle.textContent = "Sign Up";
    ui.elements.nameGroup.classList.remove('hidden');
    ui.elements.authSubmit.textContent = "Sign Up";
    ui.elements.authToggleText.textContent = "Already have an account?";
    ui.elements.btnToggleAuth.textContent = "Sign In.";
  } else {
    ui.elements.authTitle.textContent = "Sign In";
    ui.elements.nameGroup.classList.add('hidden');
    ui.elements.authSubmit.textContent = "Sign In";
    ui.elements.authToggleText.textContent = "New to MovieWatcher?";
    ui.elements.btnToggleAuth.textContent = "Sign up now.";
  }
}

function updateAuthState() {
  const user = auth.getCurrentUser();
  if (user) {
    ui.elements.btnSigninModal.classList.add('hidden');
    ui.elements.userProfile.classList.remove('hidden');
    ui.elements.btnWatchlist.classList.remove('hidden');
    ui.elements.userAvatar.textContent = user.name ? user.name.charAt(0).toUpperCase() : 'U';
  } else {
    ui.elements.btnSigninModal.classList.remove('hidden');
    ui.elements.userProfile.classList.add('hidden');
    ui.elements.btnWatchlist.classList.add('hidden');
  }
}

document.addEventListener('DOMContentLoaded', init);
