import './style.css';
import { initMobileMenu } from './modules/mobileMenu.js';
import { initRoiCalculator } from './modules/roiCalculator.js';
import { initGallery } from './modules/gallery.js';
import { initContactForm } from './modules/contactForm.js';

document.getElementById('year').textContent = new Date().getFullYear();

initMobileMenu();
initRoiCalculator();
initGallery();
initContactForm();

// ── Scroll fade-in ──
const fadeObserver = new IntersectionObserver(
  (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); fadeObserver.unobserve(e.target); } }),
  { threshold: 0.12 }
);
document.querySelectorAll('.fade-in').forEach((el) => fadeObserver.observe(el));

// ── Counter animasyonu ──
function animateCount(el, target, duration = 1400) {
  const start = performance.now();
  const update = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target).toLocaleString('tr-TR');
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver(
  (entries) => entries.forEach((e) => {
    if (e.isIntersecting) {
      const target = parseInt(e.target.dataset.count, 10);
      animateCount(e.target, target);
      counterObserver.unobserve(e.target);
    }
  }),
  { threshold: 0.5 }
);
document.querySelectorAll('[data-count]').forEach((el) => counterObserver.observe(el));

// ── Cookie banner ──
(function initCookie() {
  if (localStorage.getItem('cookieAccepted')) return;
  const banner = document.getElementById('cookieBanner');
  if (!banner) return;
  banner.classList.remove('hidden');
  document.getElementById('cookieAccept').addEventListener('click', () => {
    localStorage.setItem('cookieAccepted', '1');
    banner.classList.add('hidden');
  });
  document.getElementById('cookieKvkkBtn').addEventListener('click', () => openModal('modalPrivacy'));
})();

// ── Modal yönetimi ──
function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('hidden');
  document.body.classList.add('modal-open');
}
function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('hidden');
  document.body.classList.remove('modal-open');
}

['Privacy', 'Terms'].forEach((name) => {
  const btnClose = document.getElementById(`modal${name}Close`);
  const bgClose = document.getElementById(`modal${name}Bg`);
  if (btnClose) btnClose.addEventListener('click', () => closeModal(`modal${name}`));
  if (bgClose) bgClose.addEventListener('click', () => closeModal(`modal${name}`));
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeModal('modalPrivacy'); closeModal('modalTerms'); }
});

const footerPrivacy = document.getElementById('footerPrivacyBtn');
const footerTerms = document.getElementById('footerTermsBtn');
if (footerPrivacy) footerPrivacy.addEventListener('click', () => openModal('modalPrivacy'));
if (footerTerms) footerTerms.addEventListener('click', () => openModal('modalTerms'));

// ── Scroll progress bar ──
const scrollBar = document.getElementById('scrollProgress');
if (scrollBar) {
  window.addEventListener('scroll', () => {
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    scrollBar.style.width = (docH > 0 ? (window.scrollY / docH) * 100 : 0) + '%';
  }, { passive: true });
}

// ── Elektrik fiyat grafik animasyonu ──
const priceChart = document.getElementById('priceChart');
if (priceChart) {
  new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('animated'); }
    }),
    { threshold: 0.35 }
  ).observe(priceChart);
}
