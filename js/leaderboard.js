import { api } from './api.js';
import { isLoggedIn, getUsername, logout } from './auth.js';

if (!isLoggedIn()) window.location.href = '/login.html';

document.getElementById('nav-username').textContent = getUsername();
document.getElementById('logout-btn').addEventListener('click', logout);

async function loadLeaderboard() {
  try {
    const entries = await api('/leaderboard');
    const container = document.getElementById('leaderboard-table');

    if (entries.length === 0) {
      container.innerHTML = '<p class="text-gray-400 p-6 text-center">No users yet.</p>';
      return;
    }

    const currentUser = getUsername();
    let html = `<table class="w-full text-left">
      <thead class="border-b border-gray-800 text-gray-400 text-sm">
        <tr><th class="p-4">#</th><th class="p-4">User</th><th class="p-4">Portfolio Value</th></tr>
      </thead><tbody>`;
    entries.forEach((e, i) => {
      const isMe = e.username === currentUser;
      const rowClass = isMe ? 'bg-blue-900/30 border-b border-gray-800' : 'border-b border-gray-800';
      html += `<tr class="${rowClass}">
        <td class="p-4 font-bold">${i + 1}</td>
        <td class="p-4">${e.username}${isMe ? ' <span class="text-blue-400 text-xs">(you)</span>' : ''}</td>
        <td class="p-4 font-semibold">$${e.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
      </tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
  } catch {
    // retry next cycle
  }
}

loadLeaderboard();
setInterval(loadLeaderboard, 60000);
