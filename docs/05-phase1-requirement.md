# 争端分歧机 Phase 1 - 运气服人版外包需求

## 一、产品定位
做一个解决争端/矛盾/决策的网页工具。把日常矛盾通过规则化对抗的方式解决，结果有仪式感、可分享。
目标：微信里直接打开链接就能用，无需下载、无需登录。

## 二、功能需求

### 2.1 首页
- 大标题：争端分歧机
- 副标题：让矛盾有仪式感
- 两个入口按钮：运气服人、做个决定

### 2.2 运气服人模式

#### 2.2.1 两人对决（剪刀石头布）
1. 创建者填写标题（如石头剪刀布决定谁洗碗）
2. 生成唯一链接，分享给对方
3. 双方打开链接，各自选择✊✌️✋
4. 双方都选完后，显示结果（带翻牌动画）
5. 平局时随机决定胜负

#### 2.2.2 多人比拼（骰子比大小）
1. 创建者填写标题，添加参与者
2. 每人点击摇骰子按钮（随机1-6或自选数字）
3. 所有人提交后显示排行榜，最大值获胜

### 2.3 做个决定模式（加权投票）
1. 创建决定：标题、选项（至少2个）、参与者权重（默认1）
2. 分享链接给对方
3. 对方输入名字加入，选择一个选项投票
4. 投票完成后显示加权结果（选项得分=投票者权重之和）

## 三、技术要求

### 3.1 前端
- 技术：Vue3 + Vite + Vant4
- 移动端优先（微信内打开）
- 配色：深色主题（深蓝黑渐变#1a1a2e→#16213e），金色强调#ffd700
- 动画：页面切换fade，按钮点击缩放，结果揭晓bounce

### 3.2 后端
- 技术：NestJS + TypeScript
- 数据库：SQLite（用sql.js，纯JS无需编译）
- 端口：后端60002，前端60001，监听0.0.0.0

### 3.3 访问地址
- 前端：http://mxt-1.hndl.vip
- 后端：http://mxt-2.hndl.vip/api

## 四、数据结构

### 4.1 争端表（disputes）
- id: UUID主键
- title: 标题
- description: 描述
- type: 类型(luck_rps/luck_dice/decide)
- status: 状态(pending/playing/finished)
- result: 结果JSON
- created_at/finished_at: 时间

### 4.2 参与方表（participants）
- id: UUID
- dispute_id: 争端ID
- name: 名字
- weight: 权重（投票用）
- choice: 选择内容
- is_winner: 是否获胜(0/1)

### 4.3 选项表（options）- 仅投票用
- id: UUID
- dispute_id: 争端ID
- content: 选项内容

## 五、接口清单

| 接口 | 方法 | 路径 |
|------|------|------|
| 创建争端 | POST | /api/disputes |
| 获取争端 | GET | /api/disputes/:id |
| 加入争端 | POST | /api/disputes/:id/join |
| 运气服人提交 | POST | /api/disputes/:id/play |
| 做决定投票 | POST | /api/disputes/:id/vote |
| 获取结果 | GET | /api/disputes/:id/result |

## 六、页面清单

| 页面 | 路由 |
|------|------|
| 首页 | / |
| 运气服人-创建 | /luck/create |
| 两人对决 | /luck/battle/:id |
| 多人骰子 | /luck/dice/:id |
| 做决定-创建 | /decide/create |
| 做决定-投票 | /decide/vote/:id |

## 七、验收标准

### 功能验收
- [ ] 首页两个入口能正常跳转
- [ ] 能创建剪刀石头布争端并分享
- [ ] 两人能各自选择，结束后显示正确胜负
- [ ] 能创建骰子比大小争端，排行榜正确
- [ ] 能创建加权投票，选项可添加/删除
- [ ] 投票后正确计算加权结果

### 体验验收
- [ ] 微信内打开流畅
- [ ] 页面配色符合深色主题
- [ ] 结果揭晓有动画效果
- [ ] 中文显示正常无乱码

### 技术验收
- [ ] 前端能访问后端API无跨域问题
- [ ] 数据能正确存入SQLite
- [ ] 服务能通过域名从外网访问

---

## 交付物

1. 完整源码（前端+后端）
2. 部署说明
3. API文档

## 仓库参考
- GitHub: https://github.com/mumutantan/dispute-machine
- Gitea: https://git.hndl.vip/mumutanta/dispute-machine

*需求版本：v1.0 | 2026-04-04*