<template>
  <div class="luck-create-page">
    <!-- 导航栏 -->
    <van-nav-bar
      title="运气服人"
      left-arrow
      @click-left="onBack"
    />

    <!-- 表单区域 -->
    <div class="form-section">
      <!-- 争端标题 -->
      <van-cell-group inset class="form-group">
        <van-field
          v-model="form.title"
          label="争端标题"
          placeholder="今天谁请客？"
          :maxlength="50"
          clearable
        />
        <van-field
          v-model="form.description"
          label="争端描述"
          type="textarea"
          placeholder="补充说明一下情况..."
          :maxlength="200"
          rows="2"
          autosize
          clearable
        />
      </van-cell-group>

      <!-- 模式选择 -->
      <div class="mode-section">
        <h3 class="section-title">选择模式</h3>
        <div class="mode-cards">
          <div
            class="mode-card"
            :class="{ active: form.mode === 'battle' }"
            @click="form.mode = 'battle'"
          >
            <div class="mode-icon">
              <van-icon name="coupon-o" size="36" />
            </div>
            <div class="mode-info">
              <h4>两人对决</h4>
              <p>剪刀石头布</p>
            </div>
            <div class="mode-check" v-if="form.mode === 'battle'">
              <van-icon name="success" />
            </div>
          </div>

          <div
            class="mode-card"
            :class="{ active: form.mode === 'dice' }"
            @click="form.mode = 'dice'"
          >
            <div class="mode-icon">
              <van-icon name="tv-o" size="36" />
            </div>
            <div class="mode-info">
              <h4>多人比拼</h4>
              <p>骰子比大小</p>
            </div>
            <div class="mode-check" v-if="form.mode === 'dice'">
              <van-icon name="success" />
            </div>
          </div>
        </div>
      </div>

      <!-- 摇骰子说明 -->
      <van-notice-bar
        v-if="form.mode === 'dice'"
        text="多人比拼支持 3-10 人参与，摇骰子或写数字决定胜负"
        left-icon="info-o"
        class="notice-bar"
      />

      <!-- 石头剪刀布说明 -->
      <van-notice-bar
        v-if="form.mode === 'battle'"
        text="两人对决，三局两胜，公平公正"
        left-icon="info-o"
        class="notice-bar"
      />
    </div>

    <!-- 底部按钮 -->
    <div class="bottom-actions">
      <van-button
        type="primary"
        size="large"
        round
        :loading="isSubmitting"
        @click="handleSubmit"
        class="submit-btn"
      >
        <template #icon>
          <van-icon name="share-o" />
        </template>
        生成分享链接
      </van-button>
    </div>

    <!-- 分享弹窗 -->
    <van-dialog
      v-model:show="showShareDialog"
      title="分享链接已生成"
      :show-cancel-button="true"
      confirm-button-text="前往参与页"
      cancel-button-text="复制链接并关闭"
      @confirm="goToPage"
      @cancel="copyLink"
    >
      <div class="share-content">
        <p class="share-title">{{ form.title || '争端标题' }}</p>
        <p class="share-desc">{{ shareLink }}</p>
        <p class="share-tip">复制链接发送给好友即可一起参与</p>
      </div>
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { createDispute, generateShareLink } from '@/api'

const router = useRouter()

const form = reactive({
  title: '',
  description: '',
  mode: 'battle' as 'battle' | 'dice'
})

const isSubmitting = ref(false)
const showShareDialog = ref(false)
const shareLink = ref('')
const createdDisputeId = ref('')

const onBack = () => {
  router.back()
}

const handleSubmit = async () => {
  if (!form.title.trim()) {
    showToast('请输入争端标题')
    return
  }

  isSubmitting.value = true
  showLoadingToast({ message: '生成中...', forbidClick: true })

  try {
    const typeMap: Record<string, 'luck_rps' | 'luck_dice'> = {
      'battle': 'luck_rps',
      'dice': 'luck_dice'
    }

    const result = await createDispute({
      title: form.title,
      description: form.description,
      type: typeMap[form.mode]
    })

    createdDisputeId.value = result.id

    // 生成对应的分享链接
    if (form.mode === 'battle') {
      shareLink.value = generateShareLink(`/luck/battle/${result.id}`)
    } else {
      shareLink.value = generateShareLink(`/luck/dice/${result.id}`)
    }

    closeToast()
    showShareDialog.value = true
  } catch (e: any) {
    closeToast()
    showToast(e.response?.data?.message || '生成失败，请重试')
  } finally {
    isSubmitting.value = false
  }
}

const goToPage = () => {
  showShareDialog.value = false
  if (form.mode === 'battle') {
    router.push(`/luck/battle/${createdDisputeId.value}`)
  } else {
    router.push(`/luck/dice/${createdDisputeId.value}`)
  }
}

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(shareLink.value)
    showToast('链接已复制到剪贴板')
  } catch {
    showToast('复制失败，请手动复制')
  }
}
</script>

<style scoped>
.luck-create-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 100px;
}

.form-section {
  padding: 20px;
}

.form-group {
  border-radius: 12px;
  overflow: hidden;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 16px 0;
  padding-left: 4px;
}

.mode-section {
  margin-top: 24px;
}

.mode-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mode-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.mode-card.active {
  border-color: #4facfe;
  background: linear-gradient(135deg, rgba(79, 172, 254, 0.05) 0%, rgba(0, 242, 254, 0.05) 100%);
}

.mode-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-right: 16px;
}

.mode-info h4 {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 4px 0;
}

.mode-info p {
  font-size: 14px;
  color: #969799;
  margin: 0;
}

.mode-check {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 24px;
  height: 24px;
  background: #4facfe;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
}

.notice-bar {
  margin-top: 20px;
  border-radius: 12px;
}

.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 20px;
  background: linear-gradient(to top, #f7f8fa 80%, transparent);
}

.submit-btn {
  height: 50px;
  font-size: 18px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border: none;
}

.share-content {
  padding: 20px;
  text-align: center;
}

.share-title {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 12px 0;
}

.share-desc {
  font-size: 14px;
  color: #1989fa;
  background: #f0f9ff;
  padding: 12px;
  border-radius: 8px;
  word-break: break-all;
  margin: 0 0 12px 0;
}

.share-tip {
  font-size: 14px;
  color: #969799;
  margin: 0;
}
</style>
