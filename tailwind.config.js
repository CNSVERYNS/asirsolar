/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts}'],
  theme: {
    extend: {
      colors: {
        // ASIR SOLAR marka paleti — ihtiyaç halinde bg-brand-orange gibi isimli
        // sınıflar için kullanabilirsiniz; arbitrary değerler (bg-[#FF6B00] vb.)
        // de dosyalarda aynen çalışmaya devam eder.
        'brand-navy': '#101A30',
        'brand-navy-deep': '#0F1626',
        'brand-navy-darker': '#0B121F',
        'brand-orange': '#FF6B00',
        'brand-gold': '#FFD700',
        'brand-gold-soft': '#FFB050'
      },
      fontFamily: {
        display: ['Montserrat', 'sans-serif']
      }
    }
  },
  plugins: []
};
