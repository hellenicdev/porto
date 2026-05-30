import { api } from './api.js';
import { isLoggedIn, getUsername, logout } from './auth.js';

if (!isLoggedIn()) window.location.href = 'login.html';

const COIN_LABELS = { bitcoin: 'Bitcoin', ethereum: 'Ethereum', solana: 'Solana' };

document.getElementById('nav-username').textContent = getUsername();
document.getElementById('logout-btn').addEventListener('click', logout);

async function loadPrices() {
  try {
    const prices = await api('/prices');
    const container = document.getElementById('price-cards');
    container.innerHTML = '';
    for (const [coin, price] of Object.entries(prices)) {
      const card = document.createElement('div');
      card.className = 'bg-gray-900 rounded-xl p-6 text-center';
      card.innerHTML = `
        <p class="text-gray-400 text-sm mb-1">${COIN_LABELS[coin] || coin}</p>
        <p class="text-2xl font-bold">$${price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/A'}</p>
      `;
      container.appendChild(card);
    }
  } catch {
    // retry next cycle
  }
}

async function loadPortfolio() {
  try {
    const data = await api('/portfolio');
    document.getElementById('cash-balance').textContent =
      `$${data.cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    document.getElementById('portfolio-value').textContent =
      `$${(data.totalValue - data.cashBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    document.getElementById('total-value').textContent =
      `$${data.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

    const container = document.getElementById('holdings-table');
    if (!data.holdings || data.holdings.length === 0) {
      container.innerHTML = `<p class="text-gray-400 p-6 text-center">No holdings yet. <a href="trade.html" class="text-blue-400">Make your first trade</a></p>`;
      return;
    }

    let html = `<table class="w-full text-left">
      <thead class="border-b border-gray-800 text-gray-400 text-sm">
        <tr><th class="p-4">Coin</th><th class="p-4">Quantity</th><th class="p-4">Value</th><th class="p-4">P&amp;L</th></tr>
      </thead><tbody>`;
    for (const h of data.holdings) {
      const pnlClass = h.pnl >= 0 ? 'text-green-400' : 'text-red-400';
      html += `<tr class="border-b border-gray-800">
        <td class="p-4 font-medium">${COIN_LABELS[h.coin] || h.coin}</td>
        <td class="p-4">${h.quantity}</td>
        <td class="p-4">$${h.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
        <td class="p-4 ${pnlClass}">${h.pnl >= 0 ? '+' : ''}$${h.pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
      </tr>`;
    }
    html += '</tbody></table>';
    container.innerHTML = html;
  } catch {
    // retry next cycle
  }
}

loadPrices();
loadPortfolio();

setInterval(loadPrices, 15000);
setInterval(loadPortfolio, 30000);
