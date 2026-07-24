import { allCities } from '../data/regions.js';

// Formspree form ID'nizi buraya girin: https://formspree.io adresinden ücretsiz hesap açın
const FORMSPREE_URL = 'https://formspree.io/f/YOUR_FORM_ID';

function isValidTurkishPhone(val) {
  const clean = val.replace(/[\s\-\(\)]/g, '');
  return /^(\+90|0090|0)?5\d{9}$/.test(clean);
}

export function initContactForm() {
  // Şehir dropdown'ını doldur
  const citySelect = document.getElementById('f-city');
  if (citySelect) {
    allCities()
      .slice()
      .sort((a, b) => a.localeCompare(b, 'tr'))
      .forEach((city) => {
        const opt = document.createElement('option');
        opt.value = city;
        opt.textContent = city;
        citySelect.appendChild(opt);
      });
  }

  // Checkbox toggle
  const kesifCb = document.getElementById('f-kesif');
  const kesifBox = document.getElementById('kesifBox');
  const kesifCheck = document.getElementById('kesifCheck');
  if (kesifCb && kesifBox) {
    const updateCheckbox = () => {
      if (kesifCb.checked) {
        kesifBox.classList.add('bg-[#FF6B00]/20');
        kesifBox.classList.remove('bg-transparent');
        if (kesifCheck) kesifCheck.classList.remove('hidden');
      } else {
        kesifBox.classList.remove('bg-[#FF6B00]/20');
        kesifBox.classList.add('bg-transparent');
        if (kesifCheck) kesifCheck.classList.add('hidden');
      }
    };
    kesifCb.addEventListener('change', updateCheckbox);
    document.getElementById('kesifLabel')?.addEventListener('click', () => {
      setTimeout(updateCheckbox, 0);
    });
    updateCheckbox();
  }

  // Form gönderimi
  const contactForm = document.getElementById('contactForm');
  if (!contactForm) return;

  const phoneInput = document.getElementById('f-phone');
  const phoneError = document.getElementById('phoneError');
  const submitBtn = document.getElementById('submitBtn');

  contactForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Telefon validasyonu
    if (phoneInput && !isValidTurkishPhone(phoneInput.value)) {
      phoneError?.classList.remove('hidden');
      phoneInput.focus();
      return;
    }
    phoneError?.classList.add('hidden');

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Gönderiliyor...';
    }

    try {
      const res = await fetch(FORMSPREE_URL, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        document.getElementById('formFields')?.classList.add('hidden');
        document.getElementById('formSuccess')?.classList.remove('hidden');
      } else {
        throw new Error('server');
      }
    } catch {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Ücretsiz Keşif Talebi Gönder';
      }
      alert('Form gönderilemedi. Lütfen tekrar deneyin veya bizi arayın.');
    }
  });
}
