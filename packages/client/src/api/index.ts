import axios from 'axios'

// 创建 axios 实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
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
    const message = error.response?.data?.message || '网络请求失败'
    console.error('API Error:', message)
    return Promise.reject(error)
  }
)

export default api

// ============ 类型定义 ============

export interface Participant {
  id: string
  name: string
  weight?: number
  choice?: any
}

export interface DisputeOption {
  id: string
  text: string
  weight?: number
}

export interface Dispute {
  id: string
  title: string
  description: string
  type: 'luck_rps' | 'luck_dice' | 'decide'
  status: 'pending' | 'ongoing' | 'finished'
  participants: Participant[]
  options: DisputeOption[]
  createdAt: string
  [key: string]: any
}

export interface DisputeResult {
  winner?: string
  description?: string
  [key: string]: any
}

export interface CreateDisputeDto {
  title: string
  description?: string
  type: 'luck_rps' | 'luck_dice' | 'decide'
  participantNames?: string[]
  options?: string[]
}

export interface JoinDisputeDto {
  name: string
  weight?: number
}

export interface PlayDto {
  participantId: string
  choice: string | number
}

export interface VoteDto {
  participantId: string
  optionId: string
}

// ============ 争端相关接口 ============

// 创建争端
export function createDispute(data: CreateDisputeDto): Promise<Dispute> {
  return api.post('/disputes', data)
}

// 获取争端详情
export function getDispute(id: string): Promise<Dispute> {
  return api.get(`/disputes/${id}`)
}

// 加入争端
export function joinDispute(id: string, data: JoinDisputeDto): Promise<Dispute> {
  return api.post(`/disputes/${id}/join`, data)
}

// 运气服人：提交选择
export function submitPlay(id: string, data: PlayDto): Promise<any> {
  return api.post(`/disputes/${id}/play`, data)
}

// 做决定：投票
export function submitVote(id: string, data: VoteDto): Promise<any> {
  return api.post(`/disputes/${id}/vote`, data)
}

// 获取结果
export function getResult(id: string): Promise<DisputeResult> {
  return api.get(`/disputes/${id}/result`)
}

// 生成分享链接
export function generateShareLink(path: string) {
  return `${window.location.origin}${path}`
}
