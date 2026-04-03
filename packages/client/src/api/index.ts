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
  type: string
  status: string
  createdAt: string
}

export interface CreateDisputeDto {
  title: string
  description: string
  type: string
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

// 更新争端
export function updateDispute(id: string, data: Partial<CreateDisputeDto>) {
  return api.patch<Dispute>(`/disputes/${id}`, data)
}

// 删除争端
export function deleteDispute(id: string) {
  return api.delete(`/disputes/${id}`)
}
