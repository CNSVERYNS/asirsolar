/** Sağ üstteki hamburger menü — mobilde tam ekran açılır/kapanır. */
export function initMobileMenu() {
  const menuBtn = document.getElementById('menuBtn');
  const menuClose = document.getElementById('menuClose');
  const mobileMenu = document.getElementById('mobileMenu');
  if (!menuBtn || !menuClose || !mobileMenu) return;

  function openMenu() {
    mobileMenu.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-2');
  }
  function closeMenu() {
    mobileMenu.classList.add('opacity-0', 'pointer-events-none', '-translate-y-2');
  }

  menuBtn.addEventListener('click', openMenu);
  menuClose.addEventListener('click', closeMenu);
  document.querySelectorAll('.mobile-link').forEach((a) => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
}
