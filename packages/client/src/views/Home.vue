<template>
  <div class="home-page">
    <!-- 顶部导航栏 -->
    <van-nav-bar title="争端分歧机" fixed placeholder />
    
    <!-- 主内容区 -->
    <div class="content">
      <div class="welcome-section">
        <h1 class="title">🔥 争端分歧机</h1>
        <p class="subtitle">让分歧变得有趣</p>
        <p class="description">
          一个帮助团队或朋友在争议问题上做出决策的工具。
          每个人表达自己的立场，系统自动统计并生成最终结论。
        </p>
      </div>

      <div class="feature-section">
        <van-cell-group inset>
          <van-cell title="创建争端" icon="add-o" is-link to="/create" />
          <van-cell title="参与投票" icon="vote" is-link to="/disputes" />
          <van-cell title="历史记录" icon="clock-o" is-link to="/history" />
        </van-cell-group>
      </div>
    </div>

    <!-- 底部导航 -->
    <van-tabbar v-model="activeTab" fixed>
      <van-tabbar-item icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item icon="search">发现</van-tabbar-item>
      <van-tabbar-item icon="user-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const activeTab = ref(0)
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.content {
  padding: 16px;
  padding-bottom: 80px;
}

.welcome-section {
  text-align: center;
  padding: 32px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  margin-bottom: 16px;
}

.title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 16px;
  opacity: 0.9;
  margin-bottom: 16px;
}

.description {
  font-size: 14px;
  opacity: 0.8;
  line-height: 1.6;
}

.feature-section {
  margin-top: 16px;
}
</style>
