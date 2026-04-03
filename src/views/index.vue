<template>
  <div class="page-container">
    <section class="section-card hero">
      <div>
        <span class="pill">{{ $t('home.status') }}</span>
        <h1 class="section-title hero-title">{{ $t('home.title1') }}</h1>
        <p class="section-subtitle hero-subtitle">
          {{ $t('home.title2') }}
        </p>
        <div class="hero-actions">
          <el-button type="primary" round @click="toAbout">{{ $t('home.ctaAbout') }}</el-button>
          <el-button plain round @click="toCurrentProject">{{ $t('home.ctaCurrent') }}</el-button>
        </div>
      </div>
      <div class="hero-image-wrap">
        <el-image :src="profileImage" fit="cover" class="hero-image" />
      </div>
    </section>

    <section class="grid-three">
      <article class="section-card bento-item">
        <p class="mono bento-label">{{ $t('home.bentoFocusLabel') }}</p>
        <h3>{{ $t('home.bentoFocusTitle') }}</h3>
        <p class="section-subtitle">{{ $t('home.bentoFocusDesc') }}</p>
      </article>
      <article class="section-card bento-item">
        <p class="mono bento-label">{{ $t('home.bentoNowLabel') }}</p>
        <h3>{{ $t('home.part2Content') }}</h3>
        <p class="section-subtitle">{{ $t('home.bentoNowDesc') }}</p>
      </article>
      <article class="section-card bento-item">
        <p class="mono bento-label">{{ $t('home.bentoBasedLabel') }}</p>
        <h3>{{ $t('home.bentoBasedTitle') }}</h3>
        <p class="section-subtitle">{{ $t('home.bentoBasedDesc') }}</p>
      </article>
    </section>

    <section class="grid-two">
      <article class="section-card">
        <h2 class="section-title">{{ $t('home.bringTitle') }}</h2>
        <ul class="feature-list">
          <li>{{ $t('home.bring1') }}</li>
          <li>{{ $t('home.bring2') }}</li>
          <li>{{ $t('home.bring3') }}</li>
        </ul>
      </article>
      <article class="section-card cta-card">
        <h2 class="section-title">{{ $t('home.ctaTitle') }}</h2>
        <p class="section-subtitle">{{ $t('home.ctaDesc') }}</p>
        <el-button type="success" round @click="toContact">{{ $t('home.ctaContact') }}</el-button>
      </article>
    </section>
  </div>
  <el-backtop :right="36" :bottom="36" />
</template>

<script setup>
import { useRouter } from 'vue-router'
import profileImage from '../assets/person1.png'

const router = useRouter()

const toAbout = () => router.push('/about')
const toCurrentProject = () => router.push('/current')
const toContact = () => router.push('/contact')
</script>

<style scoped>
.hero {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 1rem;
  align-items: center;
}

.hero-title {
  margin-top: 0.9rem;
  font-size: clamp(1.6rem, 4vw, 2.9rem);
}

.hero-subtitle {
  max-width: 54ch;
  margin-bottom: 1rem;
}

.hero-actions {
  display: flex;
  gap: 0.7rem;
  flex-wrap: wrap;
}

.hero-image-wrap {
  display: flex;
  justify-content: center;
}

.hero-image {
  width: min(100%, 320px);
  aspect-ratio: 4 / 5;
  border-radius: 22px;
  border: 1px solid rgba(15, 23, 42, 0.12);
}

.bento-item h3 {
  margin: 0.2rem 0 0.5rem;
}

.bento-label {
  margin: 0;
  color: #0f766e;
  font-size: 0.8rem;
}

.feature-list {
  margin: 0.6rem 0 0;
  padding-left: 1rem;
  color: #334155;
}

.feature-list li {
  margin-bottom: 0.4rem;
}

.cta-card {
  display: grid;
  align-content: center;
  gap: 0.8rem;
}

@media (max-width: 900px) {
  .hero {
    grid-template-columns: 1fr;
  }
}
</style>
