# 争端分歧机 - 完整项目方案

## 一、项目概述

### 1.1 产品定位
产品名称：争端分歧机
产品定位：解决争端/矛盾/决策的Web工具
目标用户：各种矛盾决策场景

### 1.2 核心价值
1. 仪式感 2. 公平性 3. 便携性 4. 社交性

---

## 二、需求分析

### 2.1 Phase 1 已完成
- 两人对决（剪刀石头布）
- 多人比拼（骰子比大小）
- 做个决定（加权投票）
- 分享链接机制

### 2.2 后续版本
- Phase 2：以德服人版
- Phase 3：账号与社交
- Phase 4：小程序适配

---

## 三、技术架构

- 前端：Vue3+Vite+Vant4+Pinia
- 后端：NestJS+TypeScript
- 数据库：SQLite（sql.js）

---

## 四、数据库设计

- disputes表：争端
- participants表：参与方
- options表：选项

---

## 五、API接口

| 接口 | 方法 | 路径 |
|------|------|------|
| 创建争端 | POST | /api/disputes |
| 获取争端 | GET | /api/disputes/:id |
| 加入争端 | POST | /api/disputes/:id/join |
| 运气服人提交 | POST | /api/disputes/:id/play |
| 做决定投票 | POST | /api/disputes/:id/vote |
| 获取结果 | GET | /api/disputes/:id/result |

---

## 六、前端设计

- HomePage：首页
- LuckCreate/Battle/Dice：运气服人
- DecideCreate/Vote：做决定
- UI：深蓝黑渐变+金色强调

---

## 七、部署配置

- 前端：60001 → mxt-1.hndl.vip
- 后端：60002 → mxt-2.hndl.vip
- 监听：0.0.0.0

---

## 八、开发规范

- 测试：必须鹰眼测试通过
- 推送：GitHub+Gitea

---

## 九、版本规划

- Phase 1 ✅ 已完成
- Phase 2-4 待开发

---

## 十、仓库

- GitHub: https://github.com/mumutantan/dispute-machine
- Gitea: https://git.hndl.vip/mumutanta/dispute-machine

---
*版本：v1.0 | 2026-04-04 | 小炭*