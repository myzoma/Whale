async function calculateRSI(closes, period = 14) {
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - diff) / period;
    }
  }
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

async function fetchFilteredCoins() {
  const response = await fetch("https://api.binance.com/api/v3/ticker/24hr");
  const coins = await response.json();
  const container = document.getElementById("coins");
  container.innerHTML = "جاري التحميل والتحليل...";

  const results = [];

  for (const coin of coins) {
    if (!coin.symbol.endsWith("USDT")) continue;
    const change = parseFloat(coin.priceChangePercent);
    if (change < 4) continue;

    try {
      const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${coin.symbol}&interval=15m&limit=100`);
      const klines = await res.json();
      const closes = klines.map(k => parseFloat(k[4]));
      if (closes.length < 20) continue;
      const rsi = await calculateRSI(closes.slice(-20));
      if (rsi > 50) {
        results.push(`<div class="card"><strong>${coin.symbol}</strong> | Change: ${change.toFixed(2)}% | RSI: ${rsi.toFixed(2)}</div>`);
      }
    } catch (e) {
      console.log("Error in", coin.symbol);
      continue;
    }
  }

  container.innerHTML = results.length ? results.join("") : "<p>لا توجد عملات تحقق الشروط حاليًا.</p>";
}

fetchFilteredCoins();
