<template>
  <div class="luck-dice-page">
    <!-- 导航栏 -->
    <van-nav-bar
      title="多人比拼"
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
      <!-- 争端标题 -->
      <div class="dispute-title" v-if="dispute?.title">
        <van-icon name="fire" />
        <span>{{ dispute.title }}</span>
      </div>

      <!-- 模式选择 -->
      <div class="mode-tabs" v-if="!showResult">
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
          <h3>参与者 ({{ participants.length }})</h3>
          <van-button
            v-if="!showResult"
            size="small"
            type="primary"
            round
            @click="addPlayer"
            :disabled="participants.length >= 10"
          >
            <van-icon name="plus" /> 添加
          </van-button>
        </div>

        <!-- 添加玩家输入 -->
        <div v-if="showAddPlayer" class="add-player-form">
          <van-field
            v-model="newPlayerName"
            placeholder="输入新玩家名字"
            clearable
          />
          <div class="add-player-actions">
            <van-button size="small" @click="showAddPlayer = false">取消</van-button>
            <van-button size="small" type="primary" :loading="isAdding" @click="confirmAddPlayer">确认</van-button>
          </div>
        </div>

        <div class="players-list">
          <div
            v-for="(player, index) in participants"
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
              <span class="player-name">{{ player.name || '匿名参与者' }}</span>
            </div>
            <div class="player-result" v-if="showResult">
              <div class="dice-display">{{ player.result ?? '?' }}</div>
            </div>
            <div class="player-choice" v-if="!showResult && player.choice != null">
              <span class="choice-tag">已提交</span>
            </div>
            <div class="player-action" v-if="!showResult">
              <van-button
                size="mini"
                type="primary"
                :disabled="!!player.choice"
                @click="submitPlayerChoice(player)"
              >
                {{ player.choice != null ? '已提交' : (mode === 'dice' ? '🎲 摇' : '✏️ 写') }}
              </van-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 摇骰子按钮（所有人提交后揭晓） -->
      <div class="action-section" v-if="!showResult && participants.length >= 2">
        <van-button
          type="primary"
          size="large"
          round
          :loading="isFetchingResult"
          :disabled="!allSubmitted"
          @click="fetchResult"
          class="roll-btn"
        >
          {{ allSubmitted ? '🎲 揭晓结果' : `等待提交 (${submittedCount}/${participants.length})` }}
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
              🎲 {{ player.result }}
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
const mode = ref<'dice' | 'number'>('dice')
const showAddPlayer = ref(false)
const newPlayerName = ref('')
const isAdding = ref(false)
const isFetchingResult = ref(false)
const showResult = ref(false)

interface PlayerData {
  id: string
  name: string
  choice?: any
  result?: number
  isWinner?: boolean
}

const dispute = ref<any>(null)
const participants = ref<PlayerData[]>([])

const sortedPlayers = computed(() => {
  return [...participants.value].sort((a, b) => (b.result ?? -1) - (a.result ?? -1))
})

const winnersText = computed(() => {
  const winners = sortedPlayers.value.filter(p => p.isWinner)
  if (winners.length === 0) return ''
  if (winners.length === 1) return winners[0].name || '参与者'
  return winners.map(w => w.name || '匿名').join('、')
})

const submittedCount = computed(() => {
  return participants.value.filter(p => p.choice != null).length
})

const allSubmitted = computed(() => {
  return participants.value.length >= 2 && participants.value.every(p => p.choice != null)
})

const getRank = (index: number) => {
  const ranks = ['🥇', '🥈', '🥉']
  return index < 3 ? ranks[index] : `#${index + 1}`
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
    participants.value = data.participants || []

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
  
  if (resultData && resultData.players) {
    // 后端返回的玩家结果
    const maxVal = Math.max(...resultData.players.map((p: any) => p.result || 0))
    participants.value = resultData.players.map((p: any) => ({
      id: p.id,
      name: p.name,
      result: p.result,
      isWinner: p.result === maxVal
    }))
  } else if (resultData && resultData.results) {
    const results = resultData.results
    const maxVal = Math.max(...Object.values(results).map(Number))
    participants.value = participants.value.map(p => ({
      ...p,
      result: Number(results[p.id]) || 0,
      isWinner: Number(results[p.id]) === maxVal
    }))
  }
}

const addPlayer = () => {
  showAddPlayer.value = true
  newPlayerName.value = ''
}

const confirmAddPlayer = async () => {
  if (!newPlayerName.value.trim()) {
    showToast('请输入玩家名字')
    return
  }

  isAdding.value = true

  try {
    const data = await joinDispute(disputeId.value, { name: newPlayerName.value.trim() })
    dispute.value = data
    participants.value = data.participants || []
    showAddPlayer.value = false
    showToast('添加成功')
  } catch (e: any) {
    showToast(e.response?.data?.message || '添加失败')
  } finally {
    isAdding.value = false
  }
}

const submitPlayerChoice = async (player: PlayerData) => {
  if (player.choice != null) return

  showLoadingToast({ message: '提交中...', forbidClick: true })

  try {
    // 摇骰子模式自动生成随机数
    let choice: number
    if (mode.value === 'dice') {
      choice = Math.floor(Math.random() * 6) + 1
    } else {
      choice = Math.floor(Math.random() * 100) + 1
    }

    await submitPlay(disputeId.value, {
      participantId: player.id,
      choice
    })

    // 刷新数据
    const data = await getDispute(disputeId.value)
    dispute.value = data
    participants.value = data.participants || []

    closeToast()
    showToast(`${player.name} 提交成功`)
  } catch (e: any) {
    closeToast()
    showToast(e.response?.data?.message || '提交失败')
  }
}

const fetchResult = async () => {
  isFetchingResult.value = true
  showLoadingToast({ message: '揭晓结果中...', forbidClick: true })

  try {
    const resultData = await getResult(disputeId.value)
    applyResult(resultData)
    closeToast()
  } catch (e: any) {
    closeToast()
    showToast(e.response?.data?.message || '获取结果失败')
  } finally {
    isFetchingResult.value = false
  }
}

const resetGame = () => {
  showResult.value = false
  loadDispute()
}

onMounted(() => {
  loadDispute()
})
</script>

<style scoped>
.luck-dice-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
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

.add-player-form {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 16px;
}

.add-player-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
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

.player-name {
  color: #fff;
  font-weight: 500;
}

.player-choice {
  margin-right: 4px;
}

.choice-tag {
  font-size: 12px;
  color: #4ade80;
  background: rgba(74, 222, 128, 0.15);
  padding: 2px 8px;
  border-radius: 10px;
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