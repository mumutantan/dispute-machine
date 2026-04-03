import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: {
      title: '首页'
    }
  },
  {
    path: '/luck',
    name: 'LuckCreate',
    component: () => import('@/views/luck/LuckCreate.vue'),
    meta: {
      title: '运气服人'
    }
  },
  {
    path: '/luck/battle/:id',
    name: 'LuckBattle',
    component: () => import('@/views/luck/LuckBattle.vue'),
    meta: {
      title: '两人对决'
    }
  },
  {
    path: '/luck/dice/:id',
    name: 'LuckDice',
    component: () => import('@/views/luck/LuckDice.vue'),
    meta: {
      title: '多人比拼'
    }
  },
  {
    path: '/decide',
    name: 'DecideCreate',
    component: () => import('@/views/decide/DecideCreate.vue'),
    meta: {
      title: '做个决定'
    }
  },
  {
    path: '/decide/vote/:id',
    name: 'DecideVote',
    component: () => import('@/views/decide/DecideVote.vue'),
    meta: {
      title: '投票'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫 - 设置页面标题
router.beforeEach((to, _from, next) => {
  const title = to.meta.title as string
  if (title) {
    document.title = title + ' - 争端分歧机'
  }
  next()
})

export default router