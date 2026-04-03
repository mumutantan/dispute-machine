<template>
  <div class="luck-battle-page">
    <!-- 导航栏 -->
    <van-nav-bar
      title="两人对决"
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

    <!-- 主内容 -->
    <template v-else>
      <!-- 争端标题 -->
      <div class="dispute-title" v-if="dispute?.title">
        <van-icon name="fire" />
        <span>{{ dispute.title }}</span>
      </div>

      <!-- 参与方不足提示 -->
      <div v-if="dispute.participants?.length < 2" class="join-section">
        <van-notice-bar text="需要至少2人参与，请先加入" left-icon="warning" />
        
        <div class="join-form">
          <van-cell-group inset>
            <van-field
              v-model="joinName"
              placeholder="输入你的名字"
              clearable
            />
          </van-cell-group>
          <van-button
            type="primary"
            size="large"
            round
            :loading="isJoining"
            @click="joinGame"
            class="join-btn"
          >
            加入游戏
          </van-button>
        </div>
      </div>

      <!-- 提示 -->
      <div class="tip-bar" v-if="dispute?.participants?.length >= 2 && !showResult">
        <van-notice-bar text="请两位玩家各自在自己区域选择手势" left-icon="info-o" />
      </div>

      <!-- 对决区域 -->
      <div class="battle-area" v-else>
        <!-- 玩家1 -->
        <div class="player-zone player1">
          <div class="player-header">
            <van-icon name="user-o" size="24" />
            <span>{{ dispute.participants[0]?.name || '玩家 1' }}</span>
          </div>
          <div class="choice-area">
            <div
              v-for="choice in choices"
              :key="choice.value"
              class="choice-btn"
              :class="{
                active: player1Choice === choice.value,
                disabled: !!player1Choice
              }"
              @click="selectChoice(0, choice.value)"
            >
              <span class="choice-emoji">{{ choice.emoji }}</span>
              <span class="choice-text">{{ choice.label }}</span>
            </div>
          </div>
          <div v-if="player1Choice" class="selected-choice">
            已选择: {{ getChoiceEmoji(player1Choice) }} {{ getChoiceName(player1Choice) }}
          </div>
          <div v-else class="waiting-choice">
            等待选择...
          </div>
        </div>

        <!-- VS -->
        <div class="vs-section">
          <div class="vs-text">VS</div>
        </div>

        <!-- 玩家2 -->
        <div class="player-zone player2">
          <div class="player-header">
            <van-icon name="user-o" size="24" />
            <span>{{ dispute.participants[1]?.name || '玩家 2' }}</span>
          </div>
          <div class="choice-area">
            <div
              v-for="choice in choices"
              :key="choice.value"
              class="choice-btn"
              :class="{
                active: player2Choice === choice.value,
                disabled: !!player2Choice
              }"
              @click="selectChoice(1, choice.value)"
            >
              <span class="choice-emoji">{{ choice.emoji }}</span>
              <span class="choice-text">{{ choice.label }}</span>
            </div>
          </div>
          <div v-if="player2Choice" class="selected-choice">
            已选择: {{ getChoiceEmoji(player2Choice) }} {{ getChoiceName(player2Choice) }}
          </div>
          <div v-else class="waiting-choice">
            等待选择...
          </div>
        </div>
      </div>

      <!-- 确认按钮 -->
      <div class="battle-action" v-if="dispute?.participants?.length >= 2 && !showResult">
        <van-button
          type="primary"
          size="large"
          round
          :disabled="!canPlay"
          @click="submitChoice"
          class="battle-btn"
        >
          {{ player1Choice && player2Choice ? '⚔️ 开战' : '请双方选择手势' }}
        </van-button>
      </div>

      <!-- 结果展示 -->
      <div class="result-section" v-if="showResult" :class="{ 'show': showResult }">
        <div class="result-title">{{ resultText }}</div>
        
        <div class="result-choices">
          <div class="result-choice" :class="{ winner: result?.winner === 1 }">
            <div class="choice-display">{{ getChoiceEmoji(player1Choice) }}</div>
            <div class="choice-name">{{ player1Choice ? getChoiceName(player1Choice) : '-' }}</div>
            <div class="player-name">{{ dispute.participants[0]?.name || '玩家1' }}</div>
          </div>
          
          <div class="result-vs">VS</div>
          
          <div class="result-choice" :class="{ winner: result?.winner === 2 }">
            <div class="choice-display">{{ getChoiceEmoji(player2Choice) }}</div>
            <div class="choice-name">{{ player2Choice ? getChoiceName(player2Choice) : '-' }}</div>
            <div class="player-name">{{ dispute.participants[1]?.name || '玩家2' }}</div>
          </div>
        </div>

        <div class="winner-banner" v-if="result?.winner !== 0">
          🏆 {{ result?.winner === 1 ? dispute.participants[0]?.name : dispute.participants[1]?.name }} 获胜！
        </div>
        <div class="winner-banner draw" v-else>
          🤝 平局！
        </div>

        <van-button
          type="primary"
          size="large"
          round
          @click="resetBattle"
          class="reset-btn"
        >
          🔄 再来一局
        </van-button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { getDispute, joinDispute, submitPlay, getResult } from '@/api'

const router = useRouter()
const route = useRoute()

const disputeId = computed(() => route.params.id as string)

const loading = ref(true)
const error = ref('')
const isJoining = ref(false)
const joinName = ref('')

const dispute = ref<any>(null)
const player1Choice = ref<string | null>(null)
const player2Choice = ref<string | null>(null)

const showResult = ref(false)
const result = ref<any>(null)

const hasSubmitted = computed(() => {
  if (!dispute.value?.participants) return false
  return dispute.value.participants.some((p: any) => p.choice)
})

const choices = [
  { value: 'rock', label: '石头', emoji: '✊' },
  { value: 'scissors', label: '剪刀', emoji: '✌️' },
  { value: 'paper', label: '布', emoji: '✋' }
]

const canPlay = computed(() => {
  return player1Choice.value && player2Choice.value
})

const resultText = computed(() => {
  if (result.value?.winner === 0) return '势均力敌！'
  return '胜负已分！'
})

const getChoiceEmoji = (choice: string | null) => {
  if (!choice) return '❓'
  const found = choices.find(c => c.value === choice)
  return found?.emoji || '❓'
}

const getChoiceName = (choice: string | null) => {
  if (!choice) return ''
  const found = choices.find(c => c.value === choice)
  return found?.label || ''
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

    // 已有选择时恢复状态
    if (data.participants && data.participants.length >= 2) {
      player1Choice.value = data.participants[0]?.choice || null
      player2Choice.value = data.participants[1]?.choice || null

      // 双方都已选择，查询结果
      if (player1Choice.value && player2Choice.value) {
        const resultData = await getResult(disputeId.value)
        result.value = resultData
        showResult.value = true
      }
    }
  } catch (e: any) {
    error.value = e.response?.data?.message || '加载失败，请重试'
  } finally {
    loading.value = false
  }
}

const joinGame = async () => {
  if (!joinName.value.trim()) {
    showToast('请输入名字')
    return
  }

  isJoining.value = true

  try {
    const data = await joinDispute(disputeId.value, { name: joinName.value.trim() })
    dispute.value = data
    showToast('加入成功')
  } catch (e: any) {
    showToast(e.response?.data?.message || '加入失败')
  } finally {
    isJoining.value = false
  }
}

const selectChoice = async (playerIndex: number, choice: string) => {
  if (showResult.value) return
  if (!dispute.value?.participants || dispute.value.participants.length < 2) {
    showToast('等待更多玩家加入')
    return
  }

  // 根据 playerIndex 确定是哪个玩家
  const participantId = dispute.value.participants[playerIndex]?.id
  if (!participantId) return

  // 检查该玩家是否已选择
  if (playerIndex === 0 && player1Choice.value) {
    showToast('你已经选择过了')
    return
  }
  if (playerIndex === 1 && player2Choice.value) {
    showToast('你已经选择过了')
    return
  }

  showLoadingToast({ message: '提交中...', forbidClick: true })

  try {
    await submitPlay(disputeId.value, {
      participantId,
      choice
    })

    // 更新本地状态
    if (playerIndex === 0) {
      player1Choice.value = choice as 'rock' | 'scissors' | 'paper'
    } else {
      player2Choice.value = choice as 'rock' | 'scissors' | 'paper'
    }

    closeToast()

    // 双方都选了，自动获取结果
    const p1Choice = playerIndex === 0 ? choice : player1Choice.value
    const p2Choice = playerIndex === 1 ? choice : player2Choice.value
    if (p1Choice && p2Choice) {
      showLoadingToast({ message: '揭晓结果...', forbidClick: true })
      try {
        const resultData = await getResult(disputeId.value)
        result.value = resultData
        showResult.value = true
        closeToast()
      } catch (e: any) {
        closeToast()
        showToast('获取结果失败')
      }
    } else {
      showToast('已提交，等待对方...')
    }
  } catch (e: any) {
    closeToast()
    showToast(e.response?.data?.message || '提交失败')
  }
}

const submitChoice = async () => {
  // 这个按钮保留但实际上选择时自动提交
  showToast('请选择你的手势')
}

const resetBattle = async () => {
  player1Choice.value = null
  player2Choice.value = null
  showResult.value = false
  result.value = null
  
  // 刷新数据
  await loadDispute()
}

onMounted(() => {
  loadDispute()
})
</script>

<style scoped>
.luck-battle-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  padding-bottom: 30px;
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

.dispute-title {
  text-align: center;
  padding: 16px;
  color: #ffd700;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.tip-bar {
  padding: 0 12px;
}

.join-section {
  padding: 20px;
}

.join-form {
  margin-top: 20px;
}

.join-btn {
  margin-top: 16px;
  height: 50px;
  font-size: 18px;
}

.battle-area {
  display: flex;
  justify-content: space-around;
  align-items: flex-start;
  padding: 20px;
  min-height: 400px;
}

.player-zone {
  flex: 1;
  max-width: 160px;
  text-align: center;
}

.player-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}

.choice-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.choice-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.choice-btn:active {
  transform: scale(0.95);
}

.choice-btn.active {
  background: rgba(255, 215, 0, 0.2);
  border-color: #ffd700;
}

.choice-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.choice-emoji {
  font-size: 36px;
}

.choice-text {
  font-size: 14px;
  color: #fff;
}

.selected-choice {
  margin-top: 12px;
  font-size: 14px;
  color: rgba(255, 215, 0, 0.9);
}

.waiting-choice {
  margin-top: 12px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.4);
}

.vs-section {
  display: flex;
  align-items: center;
  padding-top: 60px;
}

.vs-text {
  font-size: 28px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}

.battle-action {
  padding: 20px;
}

.battle-btn {
  height: 56px;
  font-size: 20px;
  background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%);
  border: none;
}

.result-section {
  padding: 20px;
  animation: fadeIn 0.5s ease-out;
}

.result-title {
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 30px;
}

.result-choices {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-bottom: 30px;
}

.result-choice {
  text-align: center;
  padding: 20px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.result-choice.winner {
  background: rgba(255, 215, 0, 0.2);
  transform: scale(1.1);
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.3);
}

.choice-display {
  font-size: 72px;
  margin-bottom: 8px;
}

.choice-name {
  font-size: 18px;
  color: #fff;
  margin-bottom: 4px;
}

.player-name {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.result-vs {
  font-size: 24px;
  font-weight: bold;
  color: #ffd700;
}

.winner-banner {
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  color: #ffd700;
  padding: 16px;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 12px;
  margin-bottom: 20px;
  animation: bounce 0.5s ease-out;
}

.winner-banner.draw {
  color: #4facfe;
  background: rgba(79, 172, 254, 0.1);
}

@keyframes bounce {
  0% { transform: scale(0); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.reset-btn {
  width: 100%;
  height: 50px;
  font-size: 18px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border: none;
}
</style>