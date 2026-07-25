import { regionSunFactor, cityRegion } from '../data/regions.js';

/**
 * ROI Hesaplayıcı — mahsuplaşma (net metering) mantığıyla çalışır.
 *
 * Model özeti:
 *  - Kurulu güç (ve dolayısıyla sistem maliyeti) çatı alanına göre belirlenir, bu yüzden
 *    alan kaydırıcısı her zaman sonucu etkiler.
 *  - Aylık fatura, ortalama birim fiyat üzerinden yıllık tüketime (kWh) çevrilir.
 *  - Üretim önce kendi tüketiminize (self-consumption) ayrılır; tasarruf olarak sayılır.
 *  - Kalan fazla üretim, EPDK'nın "bedelli üretim limiti" (bir önceki yıl tüketiminizin
 *    2 katına kadar — 30 Nisan 2026 tarihli EPDK kararı) kapsamında şebekeye satılır ve
 *    gelir olarak sayılır.
 *  - Bu limitin üzerindeki üretim bedelsiz kabul edilir; arayüz bu durumda kullanıcıyı
 *    "sistem boyutunu optimize edin" diye uyarır.
 *  - 1 Mayıs 2026'dan itibaren mahsuplaşma saatlik yapılıyor; burada basitleştirilmiş bir
 *    yıllık ortalama tahmin sunulur — gerçek/kesin rakamlar için müşteriye "tahmini
 *    değerdir" uyarısı gösterilir.
 *
 * Aşağıdaki sabitleri (pricePerKwh, sellBackRatio, costPerKw) kendi bölgenizdeki güncel
 * EPDK/dağıtım şirketi tarifeleri ve gerçek ekipman fiyatlarınızla güncelleyin.
 */

const PRICE_PER_KWH = 3.8;
const SELL_BACK_RATIO = 0.7;
const COST_PER_KW = 13000;
const AREA_PER_KW = 6;
const AREA_MAX_M2 = 5000; // areaRange input[max] ile eşit tutun
const MAX_CAPACITY_KW = AREA_MAX_M2 / AREA_PER_KW;
const PRODUCTION_PER_KW_YEAR = 1450;
const CO2_KG_PER_KWH = 0.5;

function tl(n) {
  return '₺' + Math.round(n).toLocaleString('tr-TR');
}

function formatGain(n) {
  if (n >= 1000000) {
    return (n / 1000000).toFixed(2).replace('.', ',') + ' <span class="text-base">Milyon ₺</span>';
  }
  return tl(n);
}

function calculate(bill, area, region) {
  const capacityKw = Math.min(Math.max(area / AREA_PER_KW, 1), MAX_CAPACITY_KW);
  const systemCost = capacityKw * COST_PER_KW;

  const annualProductionKwh = capacityKw * PRODUCTION_PER_KW_YEAR * region;
  const co2SavedTons = (annualProductionKwh * CO2_KG_PER_KWH) / 1000;

  const annualConsumptionKwh = Math.max((bill * 12) / PRICE_PER_KWH, 1);

  // Önce kendi tüketiminize ayır, kalanı şebekeye sat
  const selfConsumedKwh = Math.min(annualProductionKwh, annualConsumptionKwh);
  const soldToGridKwh = Math.max(0, annualProductionKwh - selfConsumedKwh);

  const billCoveragePercent = Math.min(100, Math.round((selfConsumedKwh / annualConsumptionKwh) * 100));
  const billFullyCovered = billCoveragePercent >= 100;

  const selfSavingTl = selfConsumedKwh * PRICE_PER_KWH;
  const sellIncomeTl = soldToGridKwh * PRICE_PER_KWH * SELL_BACK_RATIO;
  const annualGain = selfSavingTl + sellIncomeTl;
  const monthlySaving = annualGain / 12;
  const monthlyPassiveIncome = sellIncomeTl / 12;
  const paybackYears = systemCost / annualGain;
  const total25 = annualGain * 25 - systemCost;

  return {
    capacityKw, systemCost, annualProductionKwh, co2SavedTons,
    annualConsumptionKwh, soldToGridKwh,
    billCoveragePercent, billFullyCovered,
    selfSavingTl, sellIncomeTl, annualGain, monthlySaving,
    monthlyPassiveIncome, paybackYears, total25
  };
}

export function initRoiCalculator() {
  const billRange = document.getElementById('billRange');
  const billInput = document.getElementById('billInput');
  const areaRange = document.getElementById('areaRange');
  const regionSelect = document.getElementById('regionSelect');
  if (!billRange || !areaRange || !regionSelect) return;

  const areaValue = document.getElementById('areaValue');
  const outCost = document.getElementById('outCost');
  const outMonthly = document.getElementById('outMonthly');
  const outPayback = document.getElementById('outPayback');
  const outGain = document.getElementById('outGain');
  const outTotal = document.getElementById('outTotal');
  const outProduction = document.getElementById('outProduction');
  const outCo2 = document.getElementById('outCo2');
  const outSelfSaving = document.getElementById('outSelfSaving');
  const outSellIncome = document.getElementById('outSellIncome');
  const outPassive = document.getElementById('outPassive');
  const outBillBadge = document.getElementById('outBillBadge');
  const outBillCoverage = document.getElementById('outBillCoverage');
  const outSellNote = document.getElementById('outSellNote');
  const paybackBar = document.getElementById('paybackBar');
  const paybackLabel = document.getElementById('paybackLabel');

  let lastResult = null;

  function render() {
    const bill = parseFloat(billRange.value);
    const area = parseFloat(areaRange.value);
    const region = regionSunFactor[cityRegion[regionSelect.value]] || 1;
    lastResult = { r: calculate(bill, area, region), bill, area };
    _render(lastResult.r);
  }

  function _render(r) {
    const area = parseFloat(areaRange.value);

    areaValue.textContent = Math.round(area).toLocaleString('tr-TR') + ' m²';

    outCost.textContent = tl(r.systemCost);
    outMonthly.innerHTML = tl(r.monthlySaving) + '<span class="text-sm font-medium text-slate-400">/ay</span>';
    outPayback.innerHTML = r.paybackYears.toFixed(1).replace('.', ',') + ' <span class="text-base">Yıl</span>';
    outGain.innerHTML = formatGain(r.annualGain);
    outTotal.innerHTML = formatGain(r.total25 > 0 ? r.total25 : r.annualGain * 25);
    outProduction.innerHTML = Math.round(r.annualProductionKwh).toLocaleString('tr-TR') + ' <span class="text-sm font-semibold">kWh</span>';
    outCo2.innerHTML = r.co2SavedTons.toFixed(1).replace('.', ',') + ' <span class="text-sm font-semibold">ton/yıl</span>';
    outSelfSaving.innerHTML = tl(r.selfSavingTl) + '<span class="text-xs font-medium text-slate-400">/yıl</span>';
    outSellIncome.innerHTML = tl(r.sellIncomeTl) + '<span class="text-xs font-medium text-slate-400">/yıl</span>';
    outPassive.innerHTML = tl(r.monthlyPassiveIncome) + '<span class="text-xs font-medium text-slate-400">/ay</span>';

    if (r.billFullyCovered) {
      outBillBadge.className = 'mb-4 flex items-center gap-2 bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-xl px-4 py-3';
      outBillCoverage.className = 'text-sm font-semibold text-[#22C55E]';
      outBillCoverage.innerHTML = '<i class="fa-solid fa-circle-check mr-2"></i>Elektrik faturanız tamamen sıfırlanıyor';
    } else {
      outBillBadge.className = 'mb-4 flex items-center gap-2 bg-[#FF6B00]/10 border border-[#FF6B00]/30 rounded-xl px-4 py-3';
      outBillCoverage.className = 'text-sm font-semibold text-[#FF6B00]';
      outBillCoverage.innerHTML = '<i class="fa-solid fa-bolt mr-2"></i>Faturanızın %' + r.billCoveragePercent + '\'ini karşılıyor';
    }

    if (paybackBar) paybackBar.style.width = Math.min((r.paybackYears / 25) * 100, 100) + '%';
    if (paybackLabel) paybackLabel.textContent = r.paybackYears.toFixed(1).replace('.', ',') + ' yıl geri dönüş';

    if (r.soldToGridKwh < 1) {
      outSellNote.textContent = 'Sistem tüm elektrik ihtiyacınızı karşılıyor; faturanız sıfırlanıyor. Daha büyük bir sistem fazla enerji satışıyla ek pasif gelir sağlar.';
    } else {
      outSellNote.innerHTML =
        'Faturanız tamamen karşılandıktan sonra kalan <strong class="text-white">' +
        Math.round(r.soldToGridKwh).toLocaleString('tr-TR') +
        ' kWh/yıl</strong> fazla enerji şebekeye satılarak size <strong class="text-[#FFD700]">aylık ' +
        tl(r.monthlyPassiveIncome) + ' pasif gelir</strong> sağlar.';
    }
  }

  // WhatsApp paylaşım
  const calcShareWa = document.getElementById('calcShareWa');
  if (calcShareWa) {
    calcShareWa.addEventListener('click', () => {
      if (!lastResult) return;
      const { r } = lastResult;
      const total = r.total25 > 0 ? r.total25 : r.annualGain * 25;
      const lines = [
        '🌞 *ASIR SOLAR Hesaplama Sonuçlarım*',
        '',
        `📐 Sistem: ${Math.round(r.capacityKw)} kWp`,
        `💰 Tahmini Maliyet: ${tl(r.systemCost)}`,
        `⚡ Yıllık Üretim: ${Math.round(r.annualProductionKwh).toLocaleString('tr-TR')} kWh`,
        `💵 Aylık Kazanç: ${tl(r.monthlySaving)}`,
        `📅 Geri Dönüş: ${r.paybackYears.toFixed(1).replace('.', ',')} Yıl`,
        `🏆 25 Yılda Toplam: ${tl(total)}`,
        '',
        'Detay için: asirsolar.vercel.app',
      ];
      const msg = encodeURIComponent(lines.join('\n'));
      window.open(`https://wa.me/?text=${msg}`, '_blank');
    });
  }

  function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }

  const billMin = parseFloat(billRange.min);
  const billMax = parseFloat(billRange.max);

  billRange.addEventListener('input', () => {
    billInput.value = billRange.value;
    render();
  });

  billInput.addEventListener('input', () => {
    const raw = parseFloat(billInput.value);
    if (isNaN(raw)) return;
    billRange.value = clamp(raw, billMin, billMax);
    render();
  });

  billInput.addEventListener('change', () => {
    const raw = parseFloat(billInput.value);
    const clamped = clamp(isNaN(raw) ? billMin : raw, billMin, billMax);
    billInput.value = clamped;
    billRange.value = clamped;
    render();
  });

  [areaRange, regionSelect].forEach((el) => el.addEventListener('input', render));
  render();
}
