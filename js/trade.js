import { api } from './api.js';
import { isLoggedIn, getUsername, logout } from './auth.js';

if (!isLoggedIn()) window.location.href = 'login.html';

const COIN_LABELS = { bitcoin: 'Bitcoin', ethereum: 'Ethereum', solana: 'Solana' };

document.getElementById('nav-username').textContent = getUsername();
document.getElementById('logout-btn').addEventListener('click', logout);

const coinSelect = document.getElementById('coin');
const priceDisplay = document.getElementById('live-price');
const quantityInput = document.getElementById('quantity');
const costDisplay = document.getElementById('cost-display');
const tradeBtn = document.getElementById('trade-btn');
const errorMsg = document.getElementById('error-msg');
const btnBuy = document.getElementById('btn-buy');
const btnSell = document.getElementById('btn-sell');

let currentPrices = {};
let tradeType = 'BUY';

async function loadPrices() {
  try {
    currentPrices = await api('/prices');
    updatePriceDisplay();
  } catch {
    // retry
  }
}

function updatePriceDisplay() {
  const coin = coinSelect.value;
  const price = currentPrices[coin];
  priceDisplay.textContent = price ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '$—';
  updateCost();
}

coinSelect.addEventListener('change', updatePriceDisplay);
quantityInput.addEventListener('input', updateCost);

function updateCost() {
  const coin = coinSelect.value;
  const price = currentPrices[coin];
  const qty = parseFloat(quantityInput.value) || 0;
  costDisplay.textContent = price ? `Total: $${(qty * price).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'Total: $0.00';
}

btnBuy.addEventListener('click', () => {
  tradeType = 'BUY';
  btnBuy.className = 'flex-1 py-2 font-semibold bg-green-600';
  btnSell.className = 'flex-1 py-2 font-semibold text-gray-400';
});

btnSell.addEventListener('click', () => {
  tradeType = 'SELL';
  btnSell.className = 'flex-1 py-2 font-semibold bg-red-600';
  btnBuy.className = 'flex-1 py-2 font-semibold text-gray-400';
});

tradeBtn.addEventListener('click', async () => {
  errorMsg.classList.add('hidden');
  const quantity = parseFloat(quantityInput.value);
  if (!quantity || quantity <= 0) {
    errorMsg.textContent = 'Enter a valid quantity';
    errorMsg.classList.remove('hidden');
    return;
  }

  tradeBtn.disabled = true;
  tradeBtn.textContent = 'Processing...';

  try {
    const result = await api('/trades', {
      method: 'POST',
      body: JSON.stringify({
        coin: coinSelect.value,
        type: tradeType,
        quantity,
      }),
    });
    alert(`Trade executed! Portfolio value: $${result.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
    quantityInput.value = '';
    updateCost();
    loadTradeHistory();
  } catch (err) {
    errorMsg.textContent = err.message;
    errorMsg.classList.remove('hidden');
  } finally {
    tradeBtn.disabled = false;
    tradeBtn.textContent = 'Execute Trade';
  }
});

async function loadTradeHistory() {
  try {
    const trades = await api('/trades');
    const container = document.getElementById('trade-history');
    if (trades.length === 0) {
      container.innerHTML = '<p class="text-gray-400 p-6 text-center">No trades yet.</p>';
      return;
    }
    let html = `<table class="w-full text-left">
      <thead class="border-b border-gray-800 text-gray-400 text-sm">
        <tr><th class="p-4">Coin</th><th class="p-4">Type</th><th class="p-4">Qty</th><th class="p-4">Price</th><th class="p-4">Date</th></tr>
      </thead><tbody>`;
    for (const t of trades) {
      const typeClass = t.type === 'BUY' ? 'text-green-400' : 'text-red-400';
      const date = new Date(t.createdAt).toLocaleString();
      html += `<tr class="border-b border-gray-800">
        <td class="p-4">${COIN_LABELS[t.coin] || t.coin}</td>
        <td class="p-4 ${typeClass} font-semibold">${t.type}</td>
        <td class="p-4">${t.quantity}</td>
        <td class="p-4">$${t.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
        <td class="p-4 text-gray-400 text-sm">${date}</td>
      </tr>`;
    }
    html += '</tbody></table>';
    container.innerHTML = html;
  } catch {
    // retry
  }
}

loadPrices();
loadTradeHistory();
setInterval(loadPrices, 15000);
