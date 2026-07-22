const goldPriceInput = document.getElementById('goldPrice');
const weightInput = document.getElementById('weight');
const karatSelect = document.getElementById('karat');
const profitInput = document.getElementById('profit');
const feeInput = document.getElementById('fee');
const resultArea = document.getElementById('calculationResult');
const headerPrice18 = document.getElementById('headerPrice18');
const headerPrice24 = document.getElementById('headerPrice24');
const heroPrice18 = document.getElementById('heroPrice18');
const heroPrice24 = document.getElementById('heroPrice24');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const refreshBtn = document.getElementById('refreshBtn');
const lastUpdateEl = document.getElementById('lastUpdate');

let prices = { 18: 0, 24: 0 };
let lastUpdateTime = null;

function formatNumber(num) {
    return new Intl.NumberFormat('fa-IR').format(Math.round(num));
}

function parseInputNumber(str) {
    if (!str) return 0;
    const cleaned = str.replace(/[^\d.]/g, '');
    return parseFloat(cleaned) || 0;
}

function toToman(rial) {
    return Math.round(rial / 10);
}

function toPersianDigits(str) {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(str).replace(/\d/g, d => persianDigits[d]);
}

function formatTime(date) {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');
    return toPersianDigits(h + ':' + m + ':' + s);
}

function formatDateTime(date) {
    return toPersianDigits(date.toLocaleTimeString('fa-IR'));
}

function setStatus(type, text) {
    statusText.textContent = text;
    statusDot.className = 'update-dot';
    if (type === 'ok') statusDot.classList.add('dot-green');
    else if (type === 'error') statusDot.classList.add('dot-red');
    else statusDot.classList.add('dot-pulse');
}

function updateLastUpdate() {
    if (lastUpdateTime) {
        lastUpdateEl.textContent = 'آخرین بروزرسانی: ' + formatTime(lastUpdateTime);
    }
}

async function fetchGoldPrice() {
    try {
        setStatus('loading', 'در حال دریافت قیمت...');
        refreshBtn.classList.add('spinning');

        const response = await fetch(
            'https://api.tgju.org/v1/market/list-data?category_ids=91818&extra_data=1&lang=fa'
        );
        const json = await response.json();

        if (json.data && json.data.length > 0) {
            const rows = json.data;

            for (const row of rows) {
                const label = row[0];
                const priceHtml = row[1];
                const priceText = priceHtml.replace(/<[^>]*>/g, '').replace(/,/g, '');
                const priceRial = parseInt(priceText, 10);

                if (label.includes('geram18') || label.includes('۱۸')) {
                    prices[18] = priceRial;
                }
                if (label.includes('geram24') || label.includes('۲۴')) {
                    prices[24] = priceRial;
                }
            }

            const t18 = toToman(prices[18]);
            const t24 = toToman(prices[24]);

            headerPrice18.textContent = formatNumber(t18);
            headerPrice24.textContent = formatNumber(t24);
            heroPrice18.textContent = formatNumber(t18);
            heroPrice24.textContent = formatNumber(t24);

            lastUpdateTime = new Date();
            updateLastUpdate();
            updatePriceInput();
            setStatus('ok', 'بروزرسانی شد');
            calculate();
        }
    } catch (error) {
        setStatus('error', 'خطا در دریافت قیمت');
        console.error('Error fetching gold price:', error);
    } finally {
        refreshBtn.classList.remove('spinning');
    }
}

function updatePriceInput() {
    const karat = parseInt(karatSelect.value);
    const price = prices[karat];
    if (price > 0) {
        goldPriceInput.value = toToman(price);
    }
}

function calculate() {
    const goldPriceTom = parseInputNumber(goldPriceInput.value);
    const weight = parseInputNumber(weightInput.value);
    const profitPercent = parseInputNumber(profitInput.value);
    const feePercent = parseInputNumber(feeInput.value);

    if (!goldPriceTom || !weight) {
        resultArea.innerHTML = '';
        return;
    }

    const baseValue = goldPriceTom * weight;
    const feeAmount = baseValue * (feePercent / 100);
    const profitAmount = (baseValue + feeAmount) * (profitPercent / 100);
    const taxAmount = (profitAmount + feeAmount) * 0.09;
    const total = baseValue + feeAmount + profitAmount + taxAmount;

    const karat = parseInt(karatSelect.value);

    resultArea.innerHTML = `
        <div class="result-box">
            <div class="result-header">
                <h3>نتیجه محاسبه</h3>
                <span class="result-badge">${karat} عیار</span>
            </div>
            <div class="result-body">
                <div class="result-row">
                    <span class="result-label">ارزش طلا (${weight} گرم × ${formatNumber(goldPriceTom)} تومان)</span>
                    <span class="result-value">${formatNumber(baseValue)} تومان</span>
                </div>
                <div class="result-row">
                    <span class="result-label">اجرت ساخت (${feePercent}٪)</span>
                    <span class="result-value">${formatNumber(feeAmount)} تومان</span>
                </div>
                <div class="result-row">
                    <span class="result-label">سود فروش (${profitPercent}٪ از ارزش طلا + اجرت)</span>
                    <span class="result-value">${formatNumber(profitAmount)} تومان</span>
                </div>
                <div class="result-row">
                    <span class="result-label">مالیات (۹٪ از سود + اجرت)</span>
                    <span class="result-value">${formatNumber(taxAmount)} تومان</span>
                </div>
                <div class="result-row total">
                    <span class="result-label">قیمت نهایی فروش</span>
                    <span class="result-value">${formatNumber(total)} تومان</span>
                </div>
            </div>
        </div>
    `;
}

refreshBtn.addEventListener('click', fetchGoldPrice);

karatSelect.addEventListener('change', () => {
    updatePriceInput();
    calculate();
});

[goldPriceInput, weightInput, profitInput, feeInput].forEach(el => {
    el.addEventListener('input', calculate);
});

fetchGoldPrice();
setInterval(fetchGoldPrice, 60000);

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then((reg) => {
                console.log('SW registered:', reg.scope);
            })
            .catch((err) => {
                console.error('SW registration failed:', err);
            });
    });
}
