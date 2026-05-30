import { api } from './api.js';

export function isLoggedIn() {
  return !!localStorage.getItem('token');
}

export function getUsername() {
  return localStorage.getItem('username');
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  window.location.href = 'login.html';
}

export async function register(username, password, turnstileToken) {
  const data = await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, turnstileToken }),
  });
  localStorage.setItem('token', data.token);
  localStorage.setItem('username', data.user.username);
  return data;
}

export async function login(username, password, turnstileToken) {
  const data = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password, turnstileToken }),
  });
  localStorage.setItem('token', data.token);
  localStorage.setItem('username', data.user.username);
  return data;
}
