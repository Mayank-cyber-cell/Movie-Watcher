/**
 * Mock Authentication System using localStorage
 */

const USERS_KEY = 'moviewatcher_users';
const CURRENT_USER_KEY = 'moviewatcher_current_user';

// Helper to get users from localStorage
function getUsers() {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : {};
}

// Helper to save users
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function signUp(email, password, name) {
  const users = getUsers();
  if (users[email]) {
    throw new Error('Email already registered.');
  }
  
  const newUser = {
    email,
    password, // In a real app, never store plain text passwords
    name,
    id: Date.now().toString()
  };
  
  users[email] = newUser;
  saveUsers(users);
  
  // Auto-login
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
  return newUser;
}

export function signIn(email, password) {
  const users = getUsers();
  const user = users[email];
  
  if (!user || user.password !== password) {
    throw new Error('Invalid email or password.');
  }
  
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user;
}

export function signOut() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function getCurrentUser() {
  const user = localStorage.getItem(CURRENT_USER_KEY);
  return user ? JSON.parse(user) : null;
}

export function updateUserProfile(email, profileData) {
  const users = getUsers();
  if (users[email]) {
    users[email].profile = profileData;
    saveUsers(users);
    
    // update current user if it's the one logged in
    const current = getCurrentUser();
    if (current && current.email === email) {
      current.profile = profileData;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(current));
    }
  }
}

export function getUserProfile(email) {
  const users = getUsers();
  return users[email] ? users[email].profile : null;
}
