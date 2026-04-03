# 争端分歧机 - 技术方案

## 编写日期
2026-04-03

## 编写人
客栈话（技术总监/架构师）

---

## 一、技术栈选型

| 层级 | 选型 | 理由 |
|------|------|------|
| **前端框架** | Vue 3 + Vite | H5优先、生态成熟、小程序可复用逻辑 |
| **UI 组件库** | Vant 4 | 移动端首选，组件丰富 |
| **状态管理** | Pinia | Vue 3 官方推荐，轻量TypeScript友好 |
| **后端框架** | Node.js + NestJS | TypeScript全栈统一，架构清晰 |
| **数据库** | SQLite（MVP） | 轻量、零运维、单文件 |
| **缓存** | Redis | 会话管理、实时状态 |
| **部署** | Docker + 云服务器 | 初期成本可控 |
| **CI/CD** | GitHub Actions | 仓库公开，免费额度足够 |

---

## 二、系统架构设计

### 模块划分

```
H5端
├── 用户模块
├── 争端模块
├── 协议模块
├── 评分模块
└── 结果模块

API Gateway (NestJS)
├── Auth Service
├── Dispute Service
├── Agreement Service
├── Score Service
└── Notification Service

数据层
├── SQLite
├── Redis
└── OSS/COS
```

### 核心数据流

```
创建争端 → 邀请参与方 → 签署协议 → 提交理由/数据 → 打分投票 → 生成结果 → 存档协议
```

---

## 三、数据库设计

### 核心表结构

```sql
-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    openid VARCHAR(64) UNIQUE NOT NULL,
    nickname VARCHAR(64),
    avatar_url VARCHAR(512),
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

-- 争端表
CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(128) NOT NULL,
    description TEXT,
    type VARCHAR(32) NOT NULL,
    mode VARCHAR(32) NOT NULL,
    success_rule VARCHAR(32),
    is_anonymous BOOLEAN DEFAULT FALSE,
    status VARCHAR(32) DEFAULT 'pending',
    creator_id UUID REFERENCES users(id),
    config JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    finished_at TIMESTAMP
);

-- 参与方表
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id UUID REFERENCES disputes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    role VARCHAR(32) DEFAULT 'participant',
    weight DECIMAL(3,2) DEFAULT 1.00,
    joined_at TIMESTAMP,
    UNIQUE(dispute_id, user_id)
);

-- 协议签署表
CREATE TABLE agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id UUID REFERENCES disputes(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES participants(id),
    signed_at TIMESTAMP DEFAULT NOW(),
    signature_image VARCHAR(512),
    ip_address VARCHAR(64)
);

-- 理由表
CREATE TABLE arguments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id UUID REFERENCES disputes(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES participants(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 评分表
CREATE TABLE scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id UUID REFERENCES disputes(id) ON DELETE CASCADE,
    argument_id UUID REFERENCES arguments(id),
    voter_id UUID REFERENCES users(id),
    score INT CHECK (score >= 0 AND score <= 100),
    is_support BOOLEAN,
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(dispute_id, argument_id, voter_id)
);

-- 随机结果表
CREATE TABLE luck_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id UUID REFERENCES disputes(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES participants(id),
    result_type VARCHAR(32),
    result_value VARCHAR(64),
    is_winner BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 历史记录表
CREATE TABLE dispute_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    dispute_id UUID REFERENCES disputes(id),
    result_summary TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 四、API 设计概要

### 用户模块
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/auth/wechat` | 微信登录 |
| GET | `/users/me` | 获取当前用户信息 |
| GET | `/users/me/history` | 查询历史争端记录 |

### 争端模块
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/disputes` | 创建争端 |
| GET | `/disputes/:id` | 获取争端详情 |
| POST | `/disputes/:id/join` | 加入争端 |
| POST | `/disputes/:id/sign` | 签署协议 |
| POST | `/disputes/:id/argument` | 提交理由/论点 |
| POST | `/disputes/:id/score` | 打分/投票 |
| POST | `/disputes/:id/luck` | 运气模式执行 |
| GET | `/disputes/:id/result` | 获取最终结果 |

---

## 五、分支策略

```
main
  └── develop
        ├── feature/auth
        ├── feature/dispute-core
        ├── feature/luck-mode
        ├── feature/persuade-mode
        └── bugfix/xxx
```

---

## 六、开发排期

| 阶段 | 周期 | 目标 |
|------|------|------|
| Phase 0 | 1周 | 项目初始化 |
| Phase 1 | 2周 | 用户系统（后续） |
| Phase 2 | 3周 | 运气服人版MVP |
| Phase 3 | 2周 | 协议系统 |
| Phase 4 | 3周 | 以德服人版 |
| Phase 5 | 2周 | 做决定模式 |
| Phase 6 | 2周 | 小程序适配 |

**MVP预计：3周**

---

## 七、风险评估

| 风险 | 等级 | 应对 |
|------|------|------|
| 微信登录限制 | 中 | 提前申请账号 |
| 多人实时同步 | 中 | WebSocket+Redis |
| 协议法律效力 | 高 | 免责声明 |
| 小程序审核 | 中 | 避免敏感词 |

---

*编写人：客栈话 | 2026-04-03*