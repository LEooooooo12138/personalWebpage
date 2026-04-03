<template>
  <div class="page-container">
    <section class="section-card">
      <span class="pill mono">{{ $t('current.badge') }}</span>
      <h1 class="section-title">{{ $t('current.title1') }} {{ $t('current.projectName') }}</h1>
      <p class="section-subtitle">{{ $t('current.intro') }}</p>
    </section>

    <section class="grid-two">
      <article class="section-card">
        <h2 class="section-title">{{ $t('current.goalsTitle') }}</h2>
        <ul class="goal-list">
          <li>{{ $t('current.goal1') }}</li>
          <li>{{ $t('current.goal2') }}</li>
          <li>{{ $t('current.goal3') }}</li>
        </ul>
      </article>

      <article class="section-card">
        <h2 class="section-title">{{ $t('current.nextTitle') }}</h2>
        <ul class="goal-list">
          <li>{{ $t('current.next1') }}</li>
          <li>{{ $t('current.next2') }}</li>
          <li>{{ $t('current.next3') }}</li>
        </ul>
      </article>
    </section>
  </div>
</template>

<style scoped>
.goal-list {
  margin: 0.6rem 0 0;
  padding-left: 1rem;
}

.goal-list li {
  margin-bottom: 0.45rem;
}
</style>
