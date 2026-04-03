<template>
  <div class="decide-vote-page">
    <!-- 导航栏 -->
    <van-nav-bar
      title="投票"
      left-arrow
      @click-left="onBack"
    />

    <!-- 决定信息 -->
    <div class="decision-info">
      <h2 class="decision-title">{{ decision.title || '决定标题' }}</h2>
      <p class="decision-desc" v-if="decision.description">{{ decision.description }}</p>
    </div>

    <!-- 参与者信息 -->
    <div class="participant-section">
      <van-cell-group inset>
        <van-field
          v-model="participantName"
          label="参与者"
          placeholder="请输入你的名字"
          clearable
        />
      </van-cell-group>
    </div>

    <!-- 选项列表 -->
    <div class="options-section">
      <h3 class="section-title">请选择</h3>
      
      <div class="options-list">
        <div
          v-for="option in decision.options"
          :key="option.id"
          class="option-card"
          :class="{
            selected: selectedOptionId === option.id,
            winner: showResult && option.isWinner
          }"
          @click="selectOption(option)"
        >
          <div class="option-content">
            <div class="option-text">{{ option.text }}</div>
            <div class="option-weight" v-if="option.weight > 1">
              权重 ×{{ option.weight }}
            </div>
          </div>
          <div class="option-check">
            <van-icon v-if="selectedOptionId === option.id" name="success" />
          </div>
        </div>
      </div>
    </div>

    <!-- 结果展示 -->
    <div class="result-section" v-if="showResult">
      <div class="result-header">
        <h3>📊 投票结果</h3>
      </div>

      <div class="result-chart">
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
              :style="{ width: option.percentage + '%' }"
            ></div>
            <div class="bar-value">{{ option.percentage }}%</div>
          </div>
        </div>
      </div>

      <div class="winner-announcement" v-if="winnerOption">
        🏆 {{ winnerOption.text }} 胜出！
      </div>

      <div class="vote-summary">
        <p>总投票权重：{{ totalWeight }} / {{ totalPossibleWeight }}</p>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="bottom-actions" v-if="!showResult">
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

    <div class="bottom-actions" v-else>
      <van-button
        type="primary"
        size="large"
        round
        @click="resetVote"
        class="reset-btn"
      >
        🔄 重新投票
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'

const router = useRouter()

interface Option {
  id: string
  text: string
  weight: number
  percentage?: number
  isWinner?: boolean
}

const decision = reactive<{
  title: string
  description: string
  options: Option[]
}>({
  title: '今天中午吃什么？',
  description: '选择困难症犯了，大家来投票决定吧！',
  options: [
    { id: '1', text: '火锅', weight: 1 },
    { id: '2', text: '烧烤', weight: 1 },
    { id: '3', text: '日料', weight: 1 },
    { id: '4', text: '川菜', weight: 2 }
  ]
})

const participantName = ref('')
const selectedOptionId = ref<string | null>(null)
const isSubmitting = ref(false)
const showResult = ref(false)

const selectedOption = computed(() => {
  return decision.options.find(opt => opt.id === selectedOptionId.value)
})

const canSubmit = computed(() => {
  return participantName.value.trim() && selectedOptionId.value
})

const totalWeight = computed(() => {
  if (!selectedOption.value) return 0
  return selectedOption.value.weight
})

const totalPossibleWeight = computed(() => {
  return decision.options.reduce((sum, opt) => sum + opt.weight, 0)
})

const sortedResults = computed(() => {
  return [...decision.options].sort((a, b) => {
    const aPct = a.percentage || 0
    const bPct = b.percentage || 0
    return bPct - aPct
  })
})

const winnerOption = computed(() => {
  return decision.options.find(opt => opt.isWinner)
})

const selectOption = (option: Option) => {
  if (showResult.value) return
  selectedOptionId.value = option.id
}

const onBack = () => {
  router.back()
}

const submitVote = async () => {
  if (!canSubmit.value) {
    showToast('请填写名字并选择选项')
    return
  }

  isSubmitting.value = true
  showLoadingToast({ message: '投票中...', forbidClick: true })

  try {
    // 模拟投票计算
    await new Promise(resolve => setTimeout(resolve, 600))
    
    // 计算加权结果（模拟其他人的投票）
    const votes = decision.options.map(opt => ({
      ...opt,
      votes: opt.id === selectedOptionId.value ? opt.weight : Math.floor(Math.random() * 5) + 1,
      totalWeight: 0
    }))

    // 计算总权重
    const total = votes.reduce((sum, v) => sum + v.votes * v.weight, 0)
    
    // 计算百分比
    votes.forEach(v => {
      v.percentage = Math.round((v.votes * v.weight / total) * 100)
    })

    // 更新选项数据
    decision.options = votes.map(v => ({
      id: v.id,
      text: v.text,
      weight: v.weight,
      percentage: v.percentage,
      isWinner: v.percentage === Math.max(...votes.map(x => x.percentage || 0))
    }))

    closeToast()
    showResult.value = true
    showToast('投票成功！')
  } catch {
    closeToast()
    showToast('投票失败，请重试')
  } finally {
    isSubmitting.value = false
  }
}

const resetVote = () => {
  selectedOptionId.value = null
  showResult.value = false
  decision.options.forEach(opt => {
    opt.percentage = undefined
    opt.isWinner = undefined
  })
}
</script>

<style scoped>
.decide-vote-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #e8f4f8 0%, #f7f8fa 100%);
  padding-bottom: 100px;
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

.participant-section {
  padding: 0 20px;
  margin-bottom: 16px;
}

.participant-section :deep(.van-cell-group--inset) {
  border-radius: 12px;
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

.option-card.winner {
  border-color: #ffd700;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%);
}

.option-content {
  flex: 1;
}

.option-text {
  font-size: 18px;
  font-weight: 500;
  color: #323233;
}

.option-weight {
  font-size: 12px;
  color: #969799;
  margin-top: 4px;
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

.option-card.winner .option-check {
  background: #ffd700;
  border-color: #ffd700;
  color: #fff;
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

.vote-summary {
  text-align: center;
  margin-top: 16px;
}

.vote-summary p {
  font-size: 14px;
  color: #969799;
  margin: 0;
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
