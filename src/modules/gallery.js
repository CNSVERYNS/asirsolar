/** Galeri: kategori filtreleme + kaydırma okları (görseller yer tutucudur, gerçek proje fotoğraflarıyla değiştirilecek). */
export function initGallery() {
  const galleryTrack = document.getElementById('galleryTrack');
  if (!galleryTrack) return;

  const galleryCards = Array.from(document.querySelectorAll('.gallery-card'));
  const galleryTabs = document.querySelectorAll('.gallery-tab');

  galleryTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      galleryTabs.forEach((t) => t.classList.remove('active-tab'));
      tab.classList.add('active-tab');
      const filter = tab.dataset.filter;
      galleryCards.forEach((card) => {
        card.style.display = filter === 'all' || card.dataset.cat === filter ? '' : 'none';
      });
      galleryTrack.scrollTo({ left: 0, behavior: 'smooth' });
    });
  });

  const galPrev = document.getElementById('galPrev');
  const galNext = document.getElementById('galNext');
  if (galPrev && galNext) {
    galPrev.addEventListener('click', () => galleryTrack.scrollBy({ left: -320, behavior: 'smooth' }));
    galNext.addEventListener('click', () => galleryTrack.scrollBy({ left: 320, behavior: 'smooth' }));
  }
}
