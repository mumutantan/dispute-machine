import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 应用状态
  const loading = ref(false)
  const userInfo = ref<Record<string, unknown> | null>(null)

  // 设置加载状态
  function setLoading(value: boolean) {
    loading.value = value
  }

  // 设置用户信息
  function setUserInfo(info: Record<string, unknown> | null) {
    userInfo.value = info
  }

  return {
    loading,
    userInfo,
    setLoading,
    setUserInfo
  }
})
