<template>
  <div class="decide-create-page">
    <!-- 导航栏 -->
    <van-nav-bar
      title="做个决定"
      left-arrow
      @click-left="onBack"
    />

    <!-- 表单区域 -->
    <div class="form-section">
      <!-- 决定标题 -->
      <van-cell-group inset class="form-group">
        <van-field
          v-model="form.title"
          label="决定标题"
          placeholder="今天中午吃什么？"
          :maxlength="50"
          clearable
        />
        <van-field
          v-model="form.description"
          label="决定描述"
          type="textarea"
          placeholder="补充说明一下..."
          :maxlength="200"
          rows="2"
          autosize
          clearable
        />
      </van-cell-group>

      <!-- 选项列表 -->
      <div class="options-section">
        <div class="section-header">
          <h3 class="section-title">选项列表</h3>
          <van-button
            size="small"
            type="primary"
            round
            @click="addOption"
          >
            <van-icon name="plus" /> 添加选项
          </van-button>
        </div>

        <div class="options-list">
          <div
            v-for="(option, index) in form.options"
            :key="option.id"
            class="option-item"
          >
            <div class="option-number">{{ index + 1 }}</div>
            <van-field
              v-model="option.text"
              placeholder="输入选项内容"
              class="option-input"
            />
            <div class="option-weight">
              <span class="weight-label">权重</span>
              <van-stepper
                v-model="option.weight"
                min="1"
                max="10"
                integer
                @change="onWeightChange"
              />
            </div>
            <van-icon
              name="cross"
              class="remove-btn"
              @click="removeOption(index)"
            />
          </div>
        </div>

        <van-notice-bar
          text="权重越高，该选项被选中的概率越大"
          left-icon="info-o"
          class="notice-bar"
        />
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="bottom-actions">
      <van-button
        type="primary"
        size="large"
        round
        :loading="isSubmitting"
        :disabled="!canSubmit"
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
      confirm-button-text="复制链接"
      cancel-button-text="关闭"
      @confirm="copyLink"
    >
      <div class="share-content">
        <p class="share-title">{{ form.title || '决定标题' }}</p>
        <p class="share-desc">{{ shareLink }}</p>
        <div class="share-options">
          <h4>选项列表：</h4>
          <ul>
            <li v-for="(opt, idx) in form.options" :key="opt.id">
              {{ opt.text }} <span v-if="opt.weight > 1">(权重 ×{{ opt.weight }})</span>
            </li>
          </ul>
        </div>
        <p class="share-tip">复制链接发送给好友即可一起投票</p>
      </div>
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { generateShareLink } from '@/api'

const router = useRouter()

interface Option {
  id: string
  text: string
  weight: number
}

const form = reactive({
  title: '',
  description: '',
  options: [
    { id: '1', text: '', weight: 1 },
    { id: '2', text: '', weight: 1 }
  ] as Option[]
})

const isSubmitting = ref(false)
const showShareDialog = ref(false)
const shareLink = ref('')

const generateId = () => Math.random().toString(36).substring(2, 9)

const canSubmit = computed(() => {
  const hasTitle = form.title.trim().length > 0
  const hasValidOptions = form.options.length >= 2 && 
    form.options.every(opt => opt.text.trim().length > 0)
  return hasTitle && hasValidOptions
})

const addOption = () => {
  if (form.options.length >= 10) {
    showToast('最多添加10个选项')
    return
  }
  form.options.push({ id: generateId(), text: '', weight: 1 })
}

const removeOption = (index: number) => {
  if (form.options.length <= 2) {
    showToast('至少需要2个选项')
    return
  }
  form.options.splice(index, 1)
}

const onWeightChange = () => {
  // 权重变化时的回调
}

const onBack = () => {
  router.back()
}

const handleSubmit = async () => {
  if (!canSubmit.value) {
    showToast('请完善标题和选项')
    return
  }

  isSubmitting.value = true
  showLoadingToast({ message: '生成中...', forbidClick: true })

  try {
    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const decisionId = generateId()
    shareLink.value = generateShareLink('decide', decisionId)
    
    closeToast()
    showShareDialog.value = true
  } catch {
    closeToast()
    showToast('生成失败，请重试')
  } finally {
    isSubmitting.value = false
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
.decide-create-page {
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

.options-section {
  margin-top: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin: 0;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.option-number {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: bold;
  font-size: 14px;
  flex-shrink: 0;
}

.option-input {
  flex: 1;
  background: #f7f8fa;
  border-radius: 8px;
}

.option-weight {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.weight-label {
  font-size: 12px;
  color: #969799;
}

.option-weight :deep(.van-stepper) {
  transform: scale(0.85);
}

.remove-btn {
  font-size: 18px;
  color: #969799;
  padding: 8px;
  cursor: pointer;
  flex-shrink: 0;
}

.remove-btn:active {
  color: #ee0a24;
}

.notice-bar {
  margin-top: 16px;
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

.share-options {
  text-align: left;
  background: #f7f8fa;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
}

.share-options h4 {
  font-size: 14px;
  color: #323233;
  margin: 0 0 8px 0;
}

.share-options ul {
  margin: 0;
  padding-left: 20px;
}

.share-options li {
  font-size: 14px;
  color: #646566;
  margin-bottom: 4px;
}

.share-tip {
  font-size: 14px;
  color: #969799;
  margin: 0;
}
</style>
