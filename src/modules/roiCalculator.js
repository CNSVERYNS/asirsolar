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

const PRICE_PER_KWH = 3.8; // ₺/kWh örnek ortalama mesken/ticarethane birim fiyatı — güncelleyin
const SELL_BACK_RATIO = 0.7; // Şebekeye satılan fazla enerjinin tüketim fiyatına oranı — dağıtım şirketinizden teyit edin
const COST_PER_KW = 13000; // ₺/kWp örnek birim fiyat
const AREA_PER_KW = 6; // ~6 m² başına 1 kWp varsayımı
const MAX_CAPACITY_KW = 500;
const PRODUCTION_PER_KW_YEAR = 1450; // ~1450 kWh/kWp/yıl Türkiye ortalaması
const CO2_KG_PER_KWH = 0.5; // ~0.5 kg CO2/kWh şebeke ortalaması

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
  const payableLimitKwh = annualConsumptionKwh * 2; // bedelli üretim limiti: tüketimin 2 katı
  const payableProductionKwh = Math.min(annualProductionKwh, payableLimitKwh);
  const selfConsumedKwh = Math.min(payableProductionKwh, annualConsumptionKwh);
  const soldToGridKwh = Math.max(0, payableProductionKwh - selfConsumedKwh);
  const overLimitKwh = Math.max(0, annualProductionKwh - payableLimitKwh);

  const selfSavingTl = selfConsumedKwh * PRICE_PER_KWH;
  const sellIncomeTl = soldToGridKwh * PRICE_PER_KWH * SELL_BACK_RATIO;
  const annualGain = selfSavingTl + sellIncomeTl;
  const monthlySaving = annualGain / 12;
  const paybackYears = systemCost / annualGain;
  const total25 = annualGain * 25 - systemCost;

  return {
    capacityKw, systemCost, annualProductionKwh, co2SavedTons,
    annualConsumptionKwh, soldToGridKwh, overLimitKwh,
    selfSavingTl, sellIncomeTl, annualGain, monthlySaving, paybackYears, total25
  };
}

export function initRoiCalculator() {
  const billRange = document.getElementById('billRange');
  const areaRange = document.getElementById('areaRange');
  const regionSelect = document.getElementById('regionSelect');
  if (!billRange || !areaRange || !regionSelect) return;

  const billValue = document.getElementById('billValue');
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
  const outSellNote = document.getElementById('outSellNote');

  function render() {
    const bill = parseFloat(billRange.value);
    const area = parseFloat(areaRange.value);
    const region = regionSunFactor[cityRegion[regionSelect.value]] || 1;

    billValue.textContent = tl(bill) + (bill === parseFloat(billRange.max) ? '+' : '');
    areaValue.textContent = Math.round(area).toLocaleString('tr-TR') + ' m²';

    const r = calculate(bill, area, region);

    outCost.textContent = tl(r.systemCost);
    outMonthly.textContent = tl(r.monthlySaving);
    outPayback.innerHTML = r.paybackYears.toFixed(1).replace('.', ',') + ' <span class="text-base">Yıl</span>';
    outGain.innerHTML = formatGain(r.annualGain);
    outTotal.textContent = tl(r.total25);
    outProduction.innerHTML = Math.round(r.annualProductionKwh).toLocaleString('tr-TR') + ' <span class="text-sm font-semibold">kWh</span>';
    outCo2.innerHTML = r.co2SavedTons.toFixed(1).replace('.', ',') + ' <span class="text-sm font-semibold">ton/yıl</span>';
    outSelfSaving.innerHTML = tl(r.selfSavingTl) + '<span class="text-xs font-medium text-slate-400">/yıl</span>';
    outSellIncome.innerHTML = tl(r.sellIncomeTl) + '<span class="text-xs font-medium text-slate-400">/yıl</span>';

    if (r.soldToGridKwh < 1) {
      outSellNote.textContent = 'Üretiminiz yıllık tüketiminizi aşmıyor, bu senaryoda şebekeye satılacak fazla enerji oluşmuyor.';
    } else if (r.overLimitKwh > 1) {
      outSellNote.textContent =
        'Şebekeye satış, EPDK\'nın "bedelli üretim limiti" (tüketiminizin 2 katı) ile sınırlıdır. Bu boyuttaki bir sistemde ' +
        Math.round(r.overLimitKwh).toLocaleString('tr-TR') +
        ' kWh/yıl bu limitin üzerinde kalıp bedelsiz kabul edilebilir — sistem boyutunu ihtiyacınıza göre optimize etmenizi öneririz.';
    } else {
      outSellNote.textContent = 'Üretiminiz tüketiminizi aşan dönemlerde fazla enerji, EPDK mahsuplaşma mevzuatı kapsamında dağıtım şirketine satılır.';
    }
  }

  [billRange, areaRange, regionSelect].forEach((el) => el.addEventListener('input', render));
  render();
}
