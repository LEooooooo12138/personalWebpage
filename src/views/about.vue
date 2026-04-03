<template>
  <div class="page-container">
    <section class="section-card">
      <span class="pill mono">{{ $t('about.badge') }}</span>
      <h1 class="section-title">{{ $t('about.title1') }}</h1>
      <p class="section-subtitle">{{ $t('about.part1Title') }}</p>
      <p>{{ $t('about.part1Content') }}</p>
      <el-button type="primary" round @click="download">{{ $t('about.getResume') }}</el-button>
    </section>

    <section class="grid-two">
      <article class="section-card">
        <h2 class="section-title">{{ $t('about.educationTitle') }}</h2>
        <p>{{ $t('about.part2Content') }}</p>
      </article>
      <article class="section-card">
        <h2 class="section-title">{{ $t('about.techTitle') }}</h2>
        <ul class="skill-list">
          <li><strong>{{ $t('about.skillFrontend') }}:</strong> {{ $t('about.skillFrontendValue') }}</li>
          <li><strong>{{ $t('about.skillBackend') }}:</strong> {{ $t('about.skillBackendValue') }}</li>
          <li><strong>{{ $t('about.skillGeneral') }}:</strong> {{ $t('about.skillGeneralValue') }}</li>
          <li><strong>{{ $t('about.skillLearning') }}:</strong> {{ $t('about.skillLearningValue') }}</li>
        </ul>
      </article>
    </section>

    <section class="section-card">
      <div class="timeline-head">
        <h2 class="section-title">{{ $t('about.timelineTitle') }}</h2>
        <span class="pill mono">{{ value }}</span>
      </div>
      <el-slider v-model="value" :min="2018" :max="2024" :step="1" />
      <p class="timeline-text">{{ currentTimelineText }}</p>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import resumeFile from '../assets/resume/CV.pdf'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const value = ref(2024)

const download = () => {
  window.open(resumeFile)
}

const currentTimelineText = computed(() => {
  if (value.value === 2018) return t('about.part2018')
  if (value.value === 2019) return t('about.part2019')
  if (value.value === 2020 || value.value === 2021) return t('about.part2020To2021')
  if (value.value === 2022) return t('about.part2022')
  if (value.value === 2023) return t('about.part2023')
  return t('about.part3Content')
})
</script>

<style scoped>
.skill-list {
  margin: 0.4rem 0 0;
  padding-left: 1rem;
}

.skill-list li {
  margin-bottom: 0.45rem;
}

.timeline-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
}

.timeline-text {
  margin-top: 0.85rem;
}
</style>
