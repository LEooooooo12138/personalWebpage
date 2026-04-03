<template>
  <header class="nav-shell">
    <div class="nav-inner">
      <RouterLink to="/" class="brand">
        <span class="brand-dot"></span>
        <span class="brand-text mono">{{ $t('nav.brand') }}</span>
      </RouterLink>

      <button class="menu-btn" @click="menuOpen = !menuOpen">
        {{ menuOpen ? $t('nav.close') : $t('nav.menu') }}
      </button>

      <nav :class="['nav-links', { open: menuOpen }]">
        <RouterLink to="/about" class="nav-link" @click="closeMenu">{{ $t('nav.about') }}</RouterLink>
        <RouterLink to="/current" class="nav-link" @click="closeMenu">{{ $t('nav.current') }}</RouterLink>
        <RouterLink to="/past" class="nav-link" @click="closeMenu">{{ $t('nav.past') }}</RouterLink>
        <RouterLink to="/contact" class="nav-link" @click="closeMenu">{{ $t('nav.contact') }}</RouterLink>
        <button class="lang-btn" @click="toggleLanguage">{{ $t('nav.languageToggle') }}</button>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
const menuOpen = ref(false)

const closeMenu = () => {
  menuOpen.value = false
}

const toggleLanguage = () => {
  const current = localStorage.getItem('language') || 'zh'
  const next = current === 'zh' ? 'en' : 'zh'
  localStorage.setItem('language', next)
  locale.value = next
}
</script>

<style scoped>
.nav-shell {
  position: sticky;
  top: 0;
  z-index: 30;
  padding: 0.8rem 0;
}

.nav-inner {
  width: min(1120px, calc(100vw - 2rem));
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1.1rem;
  border: 1px solid rgba(17, 24, 39, 0.12);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.66);
  backdrop-filter: blur(8px);
  box-shadow: 0 12px 30px rgba(18, 32, 56, 0.11);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  color: #0f172a;
  font-weight: 700;
}

.brand-dot {
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 50%;
  background: linear-gradient(130deg, #0f766e, #f59e0b);
}

.brand-text {
  font-size: 0.95rem;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.nav-link {
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  color: #334155;
  font-weight: 500;
  transition: all 0.2s ease;
}

.nav-link:hover,
.router-link-active.nav-link {
  color: #0f766e;
  background: rgba(15, 118, 110, 0.12);
}

.lang-btn {
  border: 1px solid rgba(15, 118, 110, 0.4);
  background: rgba(15, 118, 110, 0.12);
  color: #0f766e;
  font-weight: 700;
  border-radius: 999px;
  padding: 0.35rem 0.8rem;
  cursor: pointer;
}

.menu-btn {
  display: none;
  border: 1px solid rgba(15, 23, 42, 0.2);
  border-radius: 999px;
  background: white;
  padding: 0.2rem 0.75rem;
  font-size: 0.82rem;
}

@media (max-width: 900px) {
  .nav-inner {
    width: min(1120px, calc(100vw - 1rem));
    flex-wrap: wrap;
  }

  .menu-btn {
    display: inline-block;
  }

  .nav-links {
    width: 100%;
    display: none;
    flex-direction: column;
    align-items: stretch;
    gap: 0.4rem;
  }

  .nav-links.open {
    display: flex;
  }

  .nav-link {
    text-align: center;
  }
}
</style>
