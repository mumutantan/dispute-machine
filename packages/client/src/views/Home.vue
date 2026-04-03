<template>
  <div class="home-page">
    <!-- 顶部标题区域 -->
    <div class="hero-section">
      <div class="logo-wrapper">
        <van-icon name="fire" class="logo-icon" />
      </div>
      <h1 class="title">争端分歧机</h1>
      <p class="slogan">让结果说话，不伤和气</p>
    </div>

    <!-- 功能入口卡片 -->
    <div class="entry-cards">
      <div class="entry-card luck-card" @click="goToLuck">
        <div class="card-icon">
          <van-icon name="coupon-o" size="48" />
        </div>
        <h3 class="card-title">运气服人</h3>
        <p class="card-desc">剪刀石头布 / 骰子比大小</p>
        <div class="card-arrow">
          <van-icon name="arrow" />
        </div>
      </div>

      <div class="entry-card decide-card" @click="goToDecide">
        <div class="card-icon">
          <van-icon name="balance-o" size="48" />
        </div>
        <h3 class="card-title">做个决定</h3>
        <p class="card-desc">加权投票，一键定胜负</p>
        <div class="card-arrow">
          <van-icon name="arrow" />
        </div>
      </div>
    </div>

    <!-- 历史记录入口 -->
    <div class="history-section" @click="goToHistory">
      <van-icon name="clock-o" size="20" />
      <span>历史记录</span>
      <van-icon name="arrow" class="history-arrow" />
    </div>

    <!-- 装饰动画 -->
    <div class="decoration decoration-1"></div>
    <div class="decoration decoration-2"></div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { showToast } from 'vant'

const router = useRouter()

const goToLuck = () => {
  router.push('/luck')
}

const goToDecide = () => {
  router.push('/decide')
}

const goToHistory = () => {
  showToast('历史记录功能 Phase 3 实现')
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
  position: relative;
  overflow: hidden;
}

/* 装饰动画 */
.decoration {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.decoration-1 {
  width: 200px;
  height: 200px;
  top: -50px;
  right: -50px;
}

.decoration-2 {
  width: 150px;
  height: 150px;
  bottom: -30px;
  left: -30px;
  animation-delay: -3s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-20px) scale(1.05);
  }
}

/* 顶部标题 */
.hero-section {
  text-align: center;
  margin-bottom: 50px;
  animation: fadeInDown 0.8s ease-out;
}

.logo-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  margin-bottom: 20px;
  animation: pulse 2s ease-in-out infinite;
}

.logo-icon {
  font-size: 56px;
  color: #fff;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 20px rgba(255, 255, 255, 0);
  }
}

.title {
  font-size: 32px;
  font-weight: bold;
  color: #fff;
  margin: 0 0 12px 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.slogan {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

/* 功能卡片 */
.entry-cards {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 40px;
}

.entry-card {
  background: #fff;
  border-radius: 20px;
  padding: 28px 24px;
  display: flex;
  align-items: center;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  animation: fadeInUp 0.6s ease-out backwards;
}

.entry-card:nth-child(1) {
  animation-delay: 0.2s;
}

.entry-card:nth-child(2) {
  animation-delay: 0.4s;
}

.entry-card:active {
  transform: scale(0.98);
}

.luck-card .card-icon {
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-right: 20px;
}

.decide-card .card-icon {
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-right: 20px;
}

.card-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin: 0 0 6px 0;
}

.card-desc {
  font-size: 14px;
  color: #999;
  margin: 0;
}

.card-arrow {
  position: absolute;
  right: 20px;
  color: #ccc;
  font-size: 20px;
}

/* 历史记录 */
.history-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.3s ease;
  animation: fadeIn 0.8s ease-out 0.6s backwards;
}

.history-section:active {
  background: rgba(255, 255, 255, 0.25);
}

.history-arrow {
  margin-left: 4px;
}

/* 动画 */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
