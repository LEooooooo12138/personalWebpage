<template>
  <div class="page-container">
    <section class="section-card">
      <span class="pill mono">{{ $t('past.badge') }}</span>
      <h1 class="section-title">{{ $t('past.title') }}</h1>
      <p class="section-subtitle">{{ $t('past.subtitle') }}</p>
    </section>

    <section class="grid-three">
      <article v-for="project in projects" :key="project.name" class="section-card project-card">
        <h3>{{ project.name }}</h3>
        <p class="section-subtitle">{{ project.description }}</p>
        <p class="mono project-link">{{ project.link }}</p>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const projects = computed(() => [
  {
    name: t('past.projectName1'),
    description: t('past.projectDescrip1'),
    link: t('past.projectLink1')
  },
  {
    name: t('past.projectName2'),
    description: t('past.projectDescrip2'),
    link: t('past.projectLink2')
  },
  {
    name: t('past.projectName3'),
    description: t('past.projectDescrip3'),
    link: t('past.projectLink3')
  }
])
</script>

<style scoped>
.project-card h3 {
  margin-top: 0;
}

.project-link {
  margin-bottom: 0;
  color: #0f766e;
  font-size: 0.85rem;
}
</style>
