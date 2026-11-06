/**
 * LogicLab - Global Navigation, Theme & Interaction Controller
 * Handles navigation bar active state, mobile menu toggle, theme switcher,
 * and page transitions.
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // 1. Mobile Menu Toggle
  const mobileToggle = document.getElementById('mobile-menu-btn');
  const navLinks = document.getElementById('nav-links');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
      mobileToggle.setAttribute('aria-expanded', !isExpanded);
      navLinks.classList.toggle('nav-open');
    });

    // Close mobile nav when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('nav-open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 2. Active Navigation Link Highlighting
  const currentPath = window.location.pathname.toLowerCase();
  const navAnchors = document.querySelectorAll('.nav-link');

  navAnchors.forEach(a => {
    const href = a.getAttribute('href').toLowerCase();
    if (
      (currentPath.endsWith('/') || currentPath.endsWith('index.html')) &&
      (href === '/' || href === 'index.html' || href === '../index.html')
    ) {
      a.classList.add('active-nav');
    } else if (href !== '/' && href !== 'index.html' && currentPath.includes(href.replace('../', '').replace('.html', ''))) {
      a.classList.add('active-nav');
    }
  });

  // 3. Theme Toggle (Dark Lab vs Clean Lab)
  const themeToggle = document.getElementById('theme-toggle-btn');
  const storedTheme = localStorage.getItem('logiclab-theme') || 'dark';

  document.documentElement.setAttribute('data-theme', storedTheme);
  updateThemeIcon(storedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('logiclab-theme', newTheme);
      updateThemeIcon(newTheme);
      if (window.LogicLabSimulator && window.LogicLabSimulator.AudioFeedback) {
        window.LogicLabSimulator.AudioFeedback.playClick(newTheme === 'dark');
      }
    });
  }

  function updateThemeIcon(theme) {
    if (!themeToggle) return;
    const sunIcon = themeToggle.querySelector('.icon-sun');
    const moonIcon = themeToggle.querySelector('.icon-moon');
    if (sunIcon && moonIcon) {
      if (theme === 'light') {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
      } else {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
      }
    }
  }

  // 4. Header Shadow on Scroll
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        header.classList.add('header-scrolled');
      } else {
        header.classList.remove('header-scrolled');
      }
    }, { passive: true });
  }
});

