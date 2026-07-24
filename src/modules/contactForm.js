/** İletişim formu (demo — backend yok). Yayına almadan önce bir CRM/form servisine bağlayın. */
export function initContactForm() {
  const contactForm = document.getElementById('contactForm');
  if (!contactForm) return;

  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    document.getElementById('formFields').classList.add('hidden');
    document.getElementById('formSuccess').classList.remove('hidden');
  });
}
