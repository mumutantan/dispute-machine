# 争端分歧机 Phase 4 - 微信小程序外包需求

## 一、背景
前三阶段是H5网页版，用户通过微信分享链接打开。
Phase 4开发微信小程序，体验更接近原生应用。

## 二、需求概述

### 2.1 小程序基本信息
- 产品名称：争端分歧机
- 主体类型：个人
- 类目：工具类 > 效率

### 2.2 核心功能
与H5一致：
- 运气服人（剪刀石头布、骰子）
- 做个决定（加权投票）
- 以德服人（说服型、讨论型）
- 微信登录
- 历史记录
- 结果分享

## 三、技术要求

### 3.1 开发框架
推荐原生微信小程序开发，或使用uni-app（Vue语法）。

### 3.2 目录结构
`
miniprogram/
├── app.js/app.json/app.wxss
├── pages/
│   ├── index/     # 首页
│   ├── luck/      # 运气服人
│   ├── decide/    # 做决定
│   ├── user/      # 我的
│   └── history/   # 历史记录
├── components/
├── utils/
└── images/
`

### 3.3 API对接
小程序通过wx.request调用后端API。
域名配置：request合法域名设为 https://mxt-2.hndl.vip

## 四、页面清单
| 页面 | 路径 |
|------|------|
| 首页 | pages/index/index |
| 运气服人创建 | pages/luck/create |
| 两人对决 | pages/luck/battle |
| 骰子比大小 | pages/luck/dice |
| 做决定创建 | pages/decide/create |
| 投票 | pages/decide/vote |
| 登录 | pages/user/login |
| 我的 | pages/user/profile |
| 历史记录 | pages/user/history |
| 结果页 | pages/result/index |

## 五、特殊功能

### 5.1 微信分享
`
Page({
  onShareAppMessage() {
    return {
      title: 争端分歧机 - 帮我做个决定,
      path: /pages/luck/battle?id=xxx
    }
  }
})
`

### 5.2 分享图片到朋友圈
使用canvas生成图片，调用wx.saveImageToPhotosAlbum保存到相册。

### 5.3 订阅消息（可选）
争端有新动态时推送通知。

## 六、验收标准
- [ ] 能正常打开小程序并显示首页
- [ ] 能完成剪刀石头布完整流程
- [ ] 能完成骰子比大小完整流程
- [ ] 能完成加权投票完整流程
- [ ] 能触发微信分享
- [ ] 能生成结果图片并保存

## 七、注意事项

### 7.1 域名要求
- 必须使用已备案域名
- 需要HTTPS证书

### 7.2 个人小程序限制
- 无法调用部分支付API（无需支付功能可忽略）

### 7.3 审核注意
- 工具类小程序审核相对宽松
- 避免诱导分享、诱导关注

*需求版本：v1.0 | 2026-04-04*