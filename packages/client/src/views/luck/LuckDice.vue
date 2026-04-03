<template>
  <div class="luck-dice-page">
    <!-- 导航栏 -->
    <van-nav-bar
      title="多人比拼"
      left-arrow
      @click-left="onBack"
    />

    <!-- 争端标题 -->
    <div class="dispute-title" v-if="disputeTitle">
      <van-icon name="fire" />
      <span>{{ disputeTitle }}</span>
    </div>

    <!-- 模式选择 -->
    <div class="mode-tabs">
      <div
        class="mode-tab"
        :class="{ active: mode === 'dice' }"
        @click="mode = 'dice'"
      >
        <van-icon name="tv-o" />
        <span>摇骰子</span>
      </div>
      <div
        class="mode-tab"
        :class="{ active: mode === 'number' }"
        @click="mode = 'number'"
      >
        <van-icon name="edit" />
        <span>写数字</span>
      </div>
    </div>

    <!-- 参与者列表 -->
    <div class="players-section">
      <div class="section-header">
        <h3>参与者 ({{ players.length }})</h3>
        <van-button
          size="small"
          type="primary"
          round
          @click="addPlayer"
          :disabled="players.length >= 10"
        >
          <van-icon name="plus" /> 添加
        </van-button>
      </div>

      <div class="players-list">
        <div
          v-for="(player, index) in players"
          :key="player.id"
          class="player-item"
          :class="{ winner: showResult && player.isWinner }"
        >
          <div class="player-rank" v-if="showResult">
            {{ getRank(index) }}
          </div>
          <div class="player-avatar">
            <van-icon name="user-o" />
          </div>
          <div class="player-info">
            <van-field
              v-model="player.name"
              placeholder="参与者名字"
              :disabled="showResult"
              class="player-name-input"
            />
          </div>
          <div class="player-result" v-if="showResult">
            <div v-if="mode === 'dice'" class="dice-display" :class="{ rolling: isRolling }">
              {{ player.result || '?' }}
            </div>
            <div v-else class="number-display">
              {{ player.result || '-' }}
            </div>
          </div>
          <div class="player-action" v-if="!showResult">
            <van-icon
              name="cross"
              class="remove-btn"
              @click="removePlayer(index)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 数字输入模式 -->
    <div class="number-input-section" v-if="mode === 'number' && !showResult">
      <van-notice-bar text="每人输入 1-100 的数字，数字最大者获胜" left-icon="info-o" />
    </div>

    <!-- 摇一摇按钮 -->
    <div class="action-section" v-if="!showResult">
      <van-button
        type="primary"
        size="large"
        round
        :loading="isRolling"
        :disabled="players.length < 2 || !canStart"
        @click="startRoll"
        class="roll-btn"
      >
        <template v-if="isRolling">
          摇啊摇...
        </template>
        <template v-else>
          🎲 {{ mode === 'dice' ? '摇一摇' : '揭晓结果' }}
        </template>
      </van-button>
    </div>

    <!-- 结果排行榜 -->
    <div class="result-section" v-if="showResult">
      <div class="result-header">
        <h3>🏆 最终结果</h3>
      </div>
      
      <div class="leaderboard">
        <div
          v-for="(player, index) in sortedPlayers"
          :key="player.id"
          class="leaderboard-item"
          :class="{
            'gold': index === 0,
            'silver': index === 1,
            'bronze': index === 2
          }"
        >
          <div class="rank-badge">
            {{ index + 1 }}
          </div>
          <div class="player-name">
            {{ player.name || '匿名参与者' }}
          </div>
          <div class="player-score">
            <template v-if="mode === 'dice'">
              🎲 {{ player.result }}
            </template>
            <template v-else>
              {{ player.result }}
            </template>
          </div>
        </div>
      </div>

      <div class="winner-announcement">
        🎊 {{ winnersText }} 获胜！
      </div>

      <van-button
        type="primary"
        size="large"
        round
        @click="resetGame"
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

const disputeTitle = ref('今晚吃什么？')
const mode = ref<'dice' | 'number'>('dice')
const isRolling = ref(false)
const showResult = ref(false)

interface Player {
  id: string
  name: string
  result: number | null
  isWinner?: boolean
}

const players = reactive<Player[]>([
  { id: '1', name: '', result: null },
  { id: '2', name: '', result: null }
])

const sortedPlayers = computed(() => {
  return [...players].sort((a, b) => {
    const aVal = a.result ?? -1
    const bVal = b.result ?? -1
    return bVal - aVal
  })
})

const winnersText = computed(() => {
  const winners = sortedPlayers.value.filter(p => p.isWinner)
  if (winners.length === 1) {
    return winners[0].name || '参与者'
  }
  return winners.map(w => w.name || '匿名').join('、')
})

const canStart = computed(() => {
  return players.every(p => p.name.trim())
})

const generateId = () => Math.random().toString(36).substring(2, 9)

const addPlayer = () => {
  if (players.length >= 10) {
    showToast('最多10人参与')
    return
  }
  players.push({ id: generateId(), name: '', result: null })
}

const removePlayer = (index: number) => {
  if (players.length <= 2) {
    showToast('至少需要2人')
    return
  }
  players.splice(index, 1)
}

const getRank = (index: number) => {
  const ranks = ['🥇', '🥈', '🥉']
  return index < 3 ? ranks[index] : `#${index + 1}`
}

const onBack = () => {
  router.back()
}

const rollDice = () => {
  return Math.floor(Math.random() * 6) + 1
}

const startRoll = () => {
  if (!canStart.value) {
    showToast('请填写所有参与者名字')
    return
  }

  isRolling.value = true

  // 模拟摇骰子动画
  let rollCount = 0
  const maxRolls = 15
  const rollInterval = setInterval(() => {
    players.forEach(p => {
      if (mode.value === 'dice') {
        p.result = Math.floor(Math.random() * 6) + 1
      } else {
        p.result = Math.floor(Math.random() * 100) + 1
      }
    })
    rollCount++
    
    if (rollCount >= maxRolls) {
      clearInterval(rollInterval)
      
      // 最终结果
      players.forEach(p => {
        if (mode.value === 'dice') {
          p.result = rollDice()
        } else {
          p.result = Math.floor(Math.random() * 100) + 1
        }
      })

      // 计算获胜者
      const maxResult = Math.max(...players.map(p => p.result || 0))
      players.forEach(p => {
        p.isWinner = p.result === maxResult
      })

      isRolling.value = false
      showResult.value = true
    }
  }, 80)
}

const resetGame = () => {
  players.forEach(p => {
    p.result = null
    p.isWinner = false
  })
  showResult.value = false
}
</script>

<style scoped>
.luck-dice-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
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

.mode-tabs {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 0 20px 20px;
}

.mode-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.3s ease;
}

.mode-tab.active {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #fff;
}

.players-section {
  padding: 0 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  color: #fff;
  font-size: 16px;
  margin: 0;
}

.players-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.player-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px;
  transition: all 0.3s ease;
}

.player-item.winner {
  background: rgba(255, 215, 0, 0.2);
  transform: scale(1.02);
}

.player-rank {
  font-size: 24px;
  width: 36px;
  text-align: center;
}

.player-avatar {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.player-info {
  flex: 1;
}

.player-name-input :deep(.van-field__control) {
  color: #fff;
}

.player-name-input :deep(.van-field__control::placeholder) {
  color: rgba(255, 255, 255, 0.5);
}

.player-result {
  min-width: 50px;
  text-align: center;
}

.dice-display {
  font-size: 32px;
  font-weight: bold;
  color: #ffd700;
}

.dice-display.rolling {
  animation: roll 0.1s linear infinite;
}

@keyframes roll {
  0% { transform: rotate(-10deg); }
  50% { transform: rotate(10deg); }
  100% { transform: rotate(-10deg); }
}

.number-display {
  font-size: 24px;
  font-weight: bold;
  color: #4facfe;
}

.remove-btn {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.5);
  padding: 8px;
  cursor: pointer;
}

.remove-btn:active {
  color: #ff4b2b;
}

.number-input-section {
  padding: 16px 20px;
}

.action-section {
  padding: 30px 20px;
}

.roll-btn {
  height: 56px;
  font-size: 20px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border: none;
}

.result-section {
  padding: 20px;
  animation: fadeIn 0.5s ease-out;
}

.result-header {
  text-align: center;
  margin-bottom: 20px;
}

.result-header h3 {
  color: #fff;
  font-size: 20px;
  margin: 0;
}

.leaderboard {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
}

.leaderboard-item.gold {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.3) 0%, rgba(255, 215, 0, 0.1) 100%);
  border: 2px solid #ffd700;
}

.leaderboard-item.silver {
  background: linear-gradient(135deg, rgba(192, 192, 192, 0.3) 0%, rgba(192, 192, 192, 0.1) 100%);
  border: 2px solid #c0c0c0;
}

.leaderboard-item.bronze {
  background: linear-gradient(135deg, rgba(205, 127, 50, 0.3) 0%, rgba(205, 127, 50, 0.1) 100%);
  border: 2px solid #cd7f32;
}

.rank-badge {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #fff;
}

.leaderboard-item.gold .rank-badge {
  background: #ffd700;
  color: #333;
}

.leaderboard-item.silver .rank-badge {
  background: #c0c0c0;
  color: #333;
}

.leaderboard-item.bronze .rank-badge {
  background: #cd7f32;
  color: #fff;
}

.player-name {
  flex: 1;
  color: #fff;
  font-weight: 500;
}

.player-score {
  color: #ffd700;
  font-size: 20px;
  font-weight: bold;
}

.winner-announcement {
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  color: #ffd700;
  padding: 20px;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 16px;
  margin-bottom: 20px;
  animation: bounce 0.5s ease-out;
}

@keyframes bounce {
  0% { transform: scale(0); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.reset-btn {
  width: 100%;
  height: 50px;
  font-size: 18px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border: none;
}
</style>
