import axios from 'axios'

// 创建 axios 实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可在此添加 token 等认证信息
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    // 统一错误处理
    const message = error.response?.data?.message || '网络请求失败'
    console.error('API Error:', message)
    return Promise.reject(error)
  }
)

export default api

// ============ 争端相关接口 ============

export interface Dispute {
  id: string
  title: string
  description: string
  type: 'battle' | 'dice' | 'vote'
  mode?: string
  status: 'pending' | 'ongoing' | 'finished'
  createdAt: string
  shareCode?: string
}

export interface CreateDisputeDto {
  title: string
  description: string
  type: 'battle' | 'dice' | 'vote'
  mode?: string
}

// 获取争端列表
export function getDisputes() {
  return api.get<Dispute[]>('/disputes')
}

// 获取争端详情
export function getDispute(id: string) {
  return api.get<Dispute>(`/disputes/${id}`)
}

// 创建争端
export function createDispute(data: CreateDisputeDto) {
  return api.post<Dispute>('/disputes', data)
}

// 删除争端
export function deleteDispute(id: string) {
  return api.delete(`/disputes/${id}`)
}

// ============ 运气服人 - 两人对决 ============

export interface BattlePlayer {
  id: string
  name: string
  choice: 'rock' | 'paper' | 'scissors' | null
}

export interface BattleResult {
  player1: BattlePlayer
  player2: BattlePlayer
  winner: 1 | 2 | 0 // 0 表示平局
  winningChoice: 'rock' | 'paper' | 'scissors'
}

// 提交对决结果
export function submitBattleResult(disputeId: string, player1Choice: string, player2Choice: string) {
  return api.post<BattleResult>(`/disputes/${disputeId}/battle`, {
    player1Choice,
    player2Choice
  })
}

// ============ 运气服人 - 多人比拼 ============

export interface DicePlayer {
  id: string
  name: string
  result: number | null
  isWinner?: boolean
}

export interface DiceResult {
  players: DicePlayer[]
  winnerIds: string[]
  maxValue: number
}

// 摇骰子
export function rollDice(disputeId: string, results: { playerId: string; value: number }[]) {
  return api.post<DiceResult>(`/disputes/${disputeId}/dice`, { results })
}

// ============ 做个决定 ============

export interface DecideOption {
  id: string
  text: string
  weight: number
}

export interface DecideVote {
  optionId: string
  weight: number
}

export interface DecideResult {
  options: {
    id: string
    text: string
    totalWeight: number
    percentage: number
  }[]
  winner: string
}

// 创建决定
export function createDecision(data: { title: string; description: string; options: DecideOption[] }) {
  return api.post<Dispute & { options: DecideOption[] }>('/decisions', data)
}

// 获取决定详情
export function getDecision(id: string) {
  return api.get<Dispute & { options: DecideOption[] }>(`/decisions/${id}`)
}

// 投票
export function submitVote(disputeId: string, vote: DecideVote) {
  return api.post<DecideResult>(`/decisions/${disputeId}/vote`, vote)
}

// 获取投票结果
export function getVoteResult(disputeId: string) {
  return api.get<DecideResult>(`/decisions/${disputeId}/result`)
}

// ============ Mock 数据模拟 ============
// 后端未完成时使用这些 mock 函数

const mockDisputes: Dispute[] = []
const mockDecisions: (Dispute & { options: DecideOption[] })[] = []

// Mock: 生成分享链接
export function generateShareLink(type: string, id: string) {
  const baseUrl = window.location.origin
  return `${baseUrl}/share/${type}/${id || Math.random().toString(36).substring(7)}`
}

// Mock: 获取历史记录
export function getHistory() {
  return Promise.resolve([...mockDisputes, ...mockDecisions])
}
