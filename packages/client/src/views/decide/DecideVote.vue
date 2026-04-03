<template>
  <div class="decide-vote-page">
    <!-- 导航栏 -->
    <van-nav-bar
      title="投票"
      left-arrow
      @click-left="onBack"
    />

    <!-- Loading -->
    <div v-if="loading" class="loading-container">
      <van-loading size="48px">加载中...</van-loading>
    </div>

    <!-- 错误提示 -->
    <div v-else-if="error" class="error-container">
      <van-empty :description="error" />
      <van-button type="primary" @click="loadDispute">重试</van-button>
    </div>

    <template v-else>
      <!-- 决定信息 -->
      <div class="decision-info">
        <h2 class="decision-title">{{ dispute?.title || '决定标题' }}</h2>
        <p class="decision-desc" v-if="dispute?.description">{{ dispute.description }}</p>
      </div>

      <!-- 未加入时显示加入入口 -->
      <div v-if="!hasJoined" class="join-section">
        <van-cell-group inset>
          <van-field
            v-model="joinName"
            label="你的名字"
            placeholder="请输入你的名字"
            clearable
          />
        </van-cell-group>
        <div class="join-action">
          <van-button
            type="primary"
            size="large"
            round
            :loading="isJoining"
            @click="joinVote"
            class="join-btn"
          >
            加入投票
          </van-button>
        </div>
      </div>

      <!-- 已加入，显示选项 -->
      <template v-if="hasJoined">
        <!-- 选项列表 -->
        <div class="options-section" v-if="!showResult">
          <h3 class="section-title">请选择</h3>
          
          <div class="options-list">
            <div
              v-for="option in dispute?.options"
              :key="option.id"
              class="option-card"
              :class="{ selected: selectedOptionId === option.id }"
              @click="selectOption(option)"
            >
              <div class="option-content">
                <div class="option-text">{{ option.text }}</div>
              </div>
              <div class="option-check">
                <van-icon v-if="selectedOptionId === option.id" name="success" />
              </div>
            </div>
          </div>
        </div>

        <!-- 已投票提示 -->
        <div v-if="!showResult && hasVoted" class="voted-notice">
          <van-notice-bar text="你已完成投票，等待其他人投完" left-icon="passed" />
          <van-button
            plain
            type="primary"
            size="small"
            round
            @click="checkResult"
            :loading="isCheckingResult"
            class="check-btn"
          >
            查看结果
          </van-button>
        </div>

        <!-- 结果展示 -->
        <div class="result-section" v-if="showResult">
          <div class="result-header">
            <h3>📊 投票结果</h3>
          </div>

          <div class="result-chart" v-if="resultOptions.length">
            <div
              v-for="option in sortedResults"
              :key="option.id"
              class="result-bar"
              :class="{ winner: option.isWinner }"
            >
              <div class="bar-label">
                {{ option.text }}
              </div>
              <div class="bar-wrapper">
                <div
                  class="bar-fill"
                  :style="{ width: (option.percentage || 0) + '%' }"
                ></div>
                <div class="bar-value">{{ option.percentage || 0 }}%</div>
              </div>
            </div>
          </div>

          <div class="winner-announcement" v-if="winnerOption">
            🏆 {{ winnerOption.text }} 胜出！
          </div>
        </template>

        <!-- 底部按钮 -->
        <div class="bottom-actions" v-if="!showResult && !hasVoted">
          <van-button
            type="primary"
            size="large"
            round
            :loading="isSubmitting"
            :disabled="!canSubmit"
            @click="submitVote"
            class="submit-btn"
          >
            确认投票
          </van-button>
        </div>

        <div class="bottom-actions" v-if="showResult">
          <van-button
            type="primary"
            size="large"
            round
            @click="resetVote"
            class="reset-btn"
          >
            🔄 返回
          </van-button>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { getDispute, joinDispute, submitVote, getResult } from '@/api'

const router = useRouter()
const route = useRoute()

const disputeId = computed(() => route.params.id as string)

const loading = ref(true)
const error = ref('')
const joinName = ref('')
const isJoining = ref(false)
const selectedOptionId = ref<string | null>(null)
const isSubmitting = ref(false)
const hasVoted = ref(false)
const showResult = ref(false)
const isCheckingResult = ref(false)

const dispute = ref<any>(null)
const myParticipantId = ref<string | null>(null)
const resultOptions = ref<any[]>([])

const hasJoined = computed(() => !!myParticipantId.value)

const canSubmit = computed(() => {
  return hasJoined.value && selectedOptionId.value && !hasVoted.value
})

const sortedResults = computed(() => {
  return [...resultOptions.value].sort((a, b) => (b.percentage || 0) - (a.percentage || 0))
})

const winnerOption = computed(() => {
  return resultOptions.value.find(opt => opt.isWinner)
})

const selectOption = (option: any) => {
  if (showResult.value || hasVoted.value) return
  selectedOptionId.value = option.id
}

const onBack = () => {
  router.back()
}

const loadDispute = async () => {
  loading.value = true
  error.value = ''

  try {
    const data = await getDispute(disputeId.value)
    dispute.value = data

    // 检查是否已有结果
    if (data.status === 'finished') {
      try {
        const resultData = await getResult(disputeId.value)
        applyResult(resultData)
      } catch {
        // 忽略
      }
    }
  } catch (e: any) {
    error.value = e.response?.data?.message || '加载失败，请重试'
  } finally {
    loading.value = false
  }
}

const applyResult = (resultData: any) => {
  showResult.value = true
  hasVoted.value = true

  if (resultData?.options) {
    resultOptions.value = resultData.options.map((opt: any) => ({
      id: opt.id,
      text: opt.text,
      percentage: opt.percentage || opt.totalWeight || 0,
      isWinner: opt.isWinner || false
    }))
  } else if (resultData?.results) {
    // 备用格式
    const results = resultData.results
    const total = Object.values(results).reduce((s: number, v: any) => s + Number(v), 0)
    const maxVotes = Math.max(...Object.values(results).map(Number))
    
    resultOptions.value = (dispute.value?.options || []).map((opt: any) => {
      const votes = Number(results[opt.id]) || 0
      return {
        id: opt.id,
        text: opt.text,
        percentage: total > 0 ? Math.round((votes / total) * 100) : 0,
        isWinner: votes === maxVotes
      }
    })
  }
}

const joinVote = async () => {
  if (!joinName.value.trim()) {
    showToast('请输入你的名字')
    return
  }

  isJoining.value = true
  showLoadingToast({ message: '加入中...', forbidClick: true })

  try {
    const data = await joinDispute(disputeId.value, { name: joinName.value.trim() })
    dispute.value = data
    
    // 找到自己的 participantId（最后一个加入的）
    const lastParticipant = data.participants[data.participants.length - 1]
    myParticipantId.value = lastParticipant?.id

    closeToast()
    showToast('加入成功')
  } catch (e: any) {
    closeToast()
    showToast(e.response?.data?.message || '加入失败')
  } finally {
    isJoining.value = false
  }
}

const submitVote = async () => {
  if (!canSubmit.value) {
    showToast('请选择一个选项')
    return
  }

  isSubmitting.value = true
  showLoadingToast({ message: '投票中...', forbidClick: true })

  try {
    await submitVote(disputeId.value, {
      participantId: myParticipantId.value!,
      optionId: selectedOptionId.value!
    })

    hasVoted.value = true
    closeToast()
    showToast('投票成功')

    // 尝试获取结果
    try {
      await checkResult()
    } catch {
      // 还没出结果，等待
    }
  } catch (e: any) {
    closeToast()
    showToast(e.response?.data?.message || '投票失败')
  } finally {
    isSubmitting.value = false
  }
}

const checkResult = async () => {
  isCheckingResult.value = true

  try {
    const resultData = await getResult(disputeId.value)
    applyResult(resultData)
  } catch (e: any) {
    showToast(e.response?.data?.message || '结果尚未公布，请稍后再试')
  } finally {
    isCheckingResult.value = false
  }
}

const resetVote = () => {
  selectedOptionId.value = null
  showResult.value = false
  hasVoted.value = false
  resultOptions.value = []
  myParticipantId.value = null
  joinName.value = ''
  loadDispute()
}

onMounted(() => {
  loadDispute()
})
</script>

<style scoped>
.decide-vote-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #e8f4f8 0%, #f7f8fa 100%);
  padding-bottom: 100px;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 16px;
}

.decision-info {
  padding: 24px 20px 16px;
  text-align: center;
}

.decision-title {
  font-size: 24px;
  font-weight: bold;
  color: #323233;
  margin: 0 0 8px 0;
}

.decision-desc {
  font-size: 14px;
  color: #969799;
  margin: 0;
}

.join-section {
  padding: 20px;
}

.join-action {
  padding: 16px 20px;
}

.join-btn {
  height: 50px;
  font-size: 18px;
}

.participant-section {
  padding: 0 20px;
  margin-bottom: 16px;
}

.options-section {
  padding: 0 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 16px 0;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.option-card:active {
  transform: scale(0.98);
}

.option-card.selected {
  border-color: #4facfe;
  background: linear-gradient(135deg, rgba(79, 172, 254, 0.05) 0%, rgba(0, 242, 254, 0.05) 100%);
}

.option-content {
  flex: 1;
}

.option-text {
  font-size: 18px;
  font-weight: 500;
  color: #323233;
}

.option-check {
  width: 28px;
  height: 28px;
  border: 2px solid #dcdee0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.option-card.selected .option-check {
  background: #4facfe;
  border-color: #4facfe;
  color: #fff;
}

.voted-notice {
  padding: 16px 20px;
  text-align: center;
}

.check-btn {
  margin-top: 12px;
}

.result-section {
  padding: 20px;
  margin-top: 20px;
  animation: fadeIn 0.5s ease-out;
}

.result-header {
  text-align: center;
  margin-bottom: 20px;
}

.result-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
  margin: 0;
}

.result-chart {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.result-bar {
  margin-bottom: 16px;
}

.result-bar:last-child {
  margin-bottom: 0;
}

.bar-label {
  font-size: 14px;
  color: #323233;
  margin-bottom: 6px;
}

.bar-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar-fill {
  height: 24px;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  border-radius: 12px;
  transition: width 0.5s ease-out;
  min-width: 40px;
}

.result-bar.winner .bar-fill {
  background: linear-gradient(90deg, #ffd700 0%, #ffed4a 100%);
}

.bar-value {
  font-size: 14px;
  font-weight: 600;
  color: #646566;
  min-width: 50px;
}

.result-bar.winner .bar-value {
  color: #b8860b;
}

.winner-announcement {
  text-align: center;
  font-size: 22px;
  font-weight: bold;
  color: #b8860b;
  padding: 20px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 237, 74, 0.1) 100%);
  border-radius: 16px;
  margin-top: 20px;
  animation: bounce 0.5s ease-out;
}

@keyframes bounce {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 20px;
  background: linear-gradient(to top, #fff 80%, transparent);
}

.submit-btn {
  height: 50px;
  font-size: 18px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border: none;
}

.reset-btn {
  height: 50px;
  font-size: 18px;
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  border: none;
  color: #333;
}
</style>