<script setup>
import NaviBar from './components/NaviBar.vue'
import FooterOne from './components/Footer.vue'
</script>

<template>
  <div class="app-shell">
    <navi-bar />
    <main class="main-content">
      <router-view />
    </main>
    <footer-one />
  </div>
</template>
