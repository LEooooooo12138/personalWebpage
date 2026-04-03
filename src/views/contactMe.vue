<template>
  <div class="page-container">
    <section class="section-card">
      <span class="pill mono">{{ $t('contact.badge') }}</span>
      <h1 class="section-title">{{ $t('contact.title') }}</h1>
      <p class="section-subtitle">{{ $t('contact.label') }}</p>
    </section>

    <section class="grid-two">
      <article class="section-card contact-card">
        <h2 class="section-title">{{ $t('contact.directTitle') }}</h2>
        <p>{{ $t('contact.phone') }}</p>
        <el-link href="mailto:leoyao12138@gmail.com">
          <font-awesome-icon icon="envelope" />
          <span>{{ $t('footers.contactWay2') }}: leoyao12138@gmail.com</span>
        </el-link>
      </article>

      <article class="section-card contact-card">
        <h2 class="section-title">{{ $t('contact.socialTitle') }}</h2>
        <el-link @click="centerDialogVisible = true">
          <el-icon><ChatDotRound /></el-icon>
          <span>{{ $t('footers.contactWay1') }}: NClol12138</span>
        </el-link>
      </article>
    </section>
  </div>

  <el-dialog
    v-model="centerDialogVisible"
    :title="$t('common.qrTitle')"
    width="420"
    center
  >
    <el-image class="qr-image" :src="qrCode" fit="contain" />
    <template #footer>
      <el-button @click="centerDialogVisible = false">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" @click="centerDialogVisible = false">{{ $t('common.confirm') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue'
import qrCode from '../assets/weChatQRCode.jpg'

const centerDialogVisible = ref(false)
</script>

<style scoped>
.contact-card {
  display: grid;
  gap: 0.6rem;
}

.contact-card :deep(.el-link) {
  gap: 0.35rem;
  justify-content: flex-start;
}

.qr-image {
  width: min(100%, 340px);
  display: block;
  margin: 0 auto;
}
</style>
