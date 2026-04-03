<template>
  <div class="luck-battle-page">
    <!-- 导航栏 -->
    <van-nav-bar
      title="两人对决"
      left-arrow
      @click-left="onBack"
    />

    <!-- 争端标题 -->
    <div class="dispute-title" v-if="disputeTitle">
      <van-icon name="fire" />
      <span>{{ disputeTitle }}</span>
    </div>

    <!-- 对决区域 -->
    <div class="battle-area">
      <!-- 玩家1 -->
      <div class="player-zone player1">
        <div class="player-header">
          <van-icon name="user-o" size="24" />
          <span>玩家 1</span>
        </div>
        <van-field
          v-model="player1.name"
          placeholder="输入名字"
          class="name-input"
          clearable
        />
        <div class="choice-area">
          <div
            v-for="choice in choices"
            :key="choice.value"
            class="choice-btn"
            :class="{ active: player1.choice === choice.value, shaking: isShaking && player1.choice === choice.value }"
            @click="selectChoice(1, choice.value)"
          >
            <span class="choice-emoji">{{ choice.emoji }}</span>
            <span class="choice-text">{{ choice.label }}</span>
          </div>
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
          <span>玩家 2</span>
        </div>
        <van-field
          v-model="player2.name"
          placeholder="输入名字"
          class="name-input"
          clearable
        />
        <div class="choice-area">
          <div
            v-for="choice in choices"
            :key="choice.value"
            class="choice-btn"
            :class="{ active: player2.choice === choice.value, shaking: isShaking && player2.choice === choice.value }"
            @click="selectChoice(2, choice.value)"
          >
            <span class="choice-emoji">{{ choice.emoji }}</span>
            <span class="choice-text">{{ choice.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 开战按钮 -->
    <div class="battle-action" v-if="!showResult">
      <van-button
        type="primary"
        size="large"
        round
        :disabled="!canStart"
        @click="startBattle"
        class="battle-btn"
      >
        ⚔️ 开战
      </van-button>
    </div>

    <!-- 结果展示 -->
    <div class="result-section" v-if="showResult" :class="{ 'show': showResult }">
      <div class="result-title">{{ resultText }}</div>
      
      <div class="result-choices">
        <div class="result-choice" :class="{ winner: result.winner === 1 }">
          <div class="choice-display">{{ getChoiceEmoji(player1.choice) }}</div>
          <div class="choice-name">{{ player1.choice ? getChoiceName(player1.choice) : '-' }}</div>
          <div class="player-name">{{ player1.name || '玩家1' }}</div>
        </div>
        
        <div class="result-vs">VS</div>
        
        <div class="result-choice" :class="{ winner: result.winner === 2 }">
          <div class="choice-display">{{ getChoiceEmoji(player2.choice) }}</div>
          <div class="choice-name">{{ player2.choice ? getChoiceName(player2.choice) : '-' }}</div>
          <div class="player-name">{{ player2.name || '玩家2' }}</div>
        </div>
      </div>

      <div class="winner-banner" v-if="result.winner !== 0">
        🏆 {{ result.winner === 1 ? (player1.name || '玩家1') : (player2.name || '玩家2') }} 获胜！
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'

const router = useRouter()

const disputeTitle = ref('谁请客？')

const choices = [
  { value: 'rock', label: '石头', emoji: '✊' },
  { value: 'scissors', label: '剪刀', emoji: '✌️' },
  { value: 'paper', label: '布', emoji: '✋' }
]

const player1 = reactive({
  name: '',
  choice: null as 'rock' | 'scissors' | 'paper' | null
})

const player2 = reactive({
  name: '',
  choice: null as 'rock' | 'scissors' | 'paper' | null
})

const isShaking = ref(false)
const showResult = ref(false)
const result = reactive({
  winner: 0 as 0 | 1 | 2
})

const canStart = computed(() => {
  return player1.choice && player2.choice
})

const resultText = computed(() => {
  if (result.winner === 0) return '势均力敌！'
  return '胜负已分！'
})

const getChoiceEmoji = (choice: 'rock' | 'scissors' | 'paper' | null) => {
  if (!choice) return '❓'
  const found = choices.find(c => c.value === choice)
  return found?.emoji || '❓'
}

const getChoiceName = (choice: 'rock' | 'scissors' | 'paper' | null) => {
  if (!choice) return ''
  const found = choices.find(c => c.value === choice)
  return found?.label || ''
}

const onBack = () => {
  router.back()
}

const selectChoice = (player: 1 | 2, choice: 'rock' | 'scissors' | 'paper') => {
  if (showResult.value) return
  
  if (player === 1) {
    player1.choice = choice
  } else {
    player2.choice = choice
  }
}

const startBattle = () => {
  if (!canStart.value) {
    showToast('请双方都选择手势')
    return
  }

  isShaking.value = true
  
  // 动画效果后显示结果
  setTimeout(() => {
    isShaking.value = false
    calculateResult()
    showResult.value = true
  }, 1000)
}

const calculateResult = () => {
  const p1 = player1.choice
  const p2 = player2.choice

  if (p1 === p2) {
    result.winner = 0
    return
  }

  // 赢的条件
  const wins: Record<string, string> = {
    rock: 'scissors',
    scissors: 'paper',
    paper: 'rock'
  }

  if (wins[p1!] === p2) {
    result.winner = 1
  } else {
    result.winner = 2
  }
}

const resetBattle = () => {
  player1.choice = null
  player2.choice = null
  showResult.value = false
  result.winner = 0
}
</script>

<style scoped>
.luck-battle-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  padding-bottom: 30px;
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

.name-input {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin-bottom: 16px;
}

.name-input :deep(.van-field__control) {
  color: #fff;
  text-align: center;
}

.name-input :deep(.van-field__control::placeholder) {
  color: rgba(255, 255, 255, 0.5);
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

.choice-btn.shaking {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px) rotate(-5deg); }
  75% { transform: translateX(10px) rotate(5deg); }
}

.choice-emoji {
  font-size: 36px;
}

.choice-text {
  font-size: 14px;
  color: #fff;
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
