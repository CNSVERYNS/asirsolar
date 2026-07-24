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
