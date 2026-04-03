<template>
  <footer class="footer-wrap">
    <div class="footer-inner section-card">
      <div>
        <p class="foot-title mono">{{ $t('footers.copyright') }}</p>
        <p class="foot-copy">{{ $t('footers.leftTitle1') }}</p>
        <p class="foot-copy">{{ $t('footers.leftTitle2') }}</p>
      </div>

      <div class="foot-links">
        <el-link @click="centerDialogVisible = true">
          <el-icon><ChatDotRound /></el-icon>
          <span>{{ $t('footers.contactWay1') }}: NClol12138</span>
        </el-link>
        <el-link href="mailto:leoyao12138@gmail.com">
          <font-awesome-icon icon="envelope" />
          <span>{{ $t('footers.contactWay2') }}: leoyao12138@gmail.com</span>
        </el-link>
      </div>
    </div>
  </footer>

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
.footer-wrap {
  margin: 1.2rem auto 2rem;
  width: min(1120px, calc(100vw - 2rem));
}

.footer-inner {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.foot-title {
  margin: 0;
  font-size: 0.9rem;
}

.foot-copy {
  margin: 0.35rem 0 0;
  color: #64748b;
  font-size: 0.92rem;
}

.foot-links {
  display: grid;
  gap: 0.7rem;
  align-content: center;
}

.foot-links :deep(.el-link) {
  gap: 0.35rem;
}

.qr-image {
  width: min(100%, 340px);
  display: block;
  margin: 0 auto;
}

@media (max-width: 900px) {
  .footer-wrap {
    width: min(1120px, calc(100vw - 1rem));
  }

  .footer-inner {
    flex-direction: column;
  }
}
</style>
