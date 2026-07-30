# 百+移动端 IAP 支付接入 — 简历描述 & 面试 Q&A

> 项目来源：百+ IOS 端及鸿蒙系统支持 IAP 支付
> 角色：全栈开发
> 日期：2026-07-17

---

## 一、项目概述

**项目名称**：百+移动端 IAP 支付接入（iOS & 鸿蒙）

**项目背景**：百+移动端已支持通过收银台充值并完成下单，但 iOS 和鸿蒙端受平台政策限制，无法使用现有的 H5/安卓支付通道，需接入苹果 App Store 和华为应用市场的 IAP（In-App Purchase）支付能力，使移动端在余额不足时可按端平台拉起对应 IAP 支付，并在百+余额、收支明细中区分 PC&安卓、iOS、鸿蒙等充值来源。

**核心变更**：

| 维度 | 变更内容 |
|------|---------|
| 新增支付通道 | iOS IAP + 鸿蒙 IAP，与现有安卓 H5 支付三端并行 |
| 预下单接口 | 按 deviceType 扩展 tradeType/assetsParam，支持 iOS productId/skuQuantity 和鸿蒙 productId |
| 余额分桶 | 新增 cashBalance、cashIosBalance、cashHarmonyBalance 分桶字段，保持 rechargeBalance 向后兼容 |
| 收支记录 | 新增操作类型 27、121 |
| 前端页面改造 | newHeatProcess（服务费卡片）、myOrder（支付弹窗）、orderDetail（待支付卡片+立即支付） |
| IAP 支付接入 | iOS 传 productId，鸿蒙传 tradeToken，同一方法封装，按 ua 判断分发 |

---

## 二、简历写法

### 版本一：全栈版（推荐）

> **百+移动端 IAP 支付接入 ｜ 全栈开发**
>
> 负责 iOS/鸿蒙 IAP 支付通道的全栈接入。后端改造预下单接口，按 deviceType 分发不同支付参数（iOS 传 `productId`+`skuQuantity`，鸿蒙传 `productId`，安卓/WEB 走原有逻辑），扩展余额查询接口新增 `cashIosBalance`/`cashHarmonyBalance` 分桶字段，采用"扩展参数、保留兼容"策略保证存量接口向前兼容。前端封装统一 `payIAP` 方法桥接 iOS/鸿蒙 IAP 原生能力；改造 newHeatProcess 页面实现服务费卡片动态展示（基于余额 vs 实收金额）、税率可配置化，重构立即支付按钮金额计算逻辑（Decimal.ROUND_UP 进位）；改造 myOrder 支付弹窗和 orderDetail 待支付卡片。覆盖下单、支付、余额、明细全链路。

### 版本二：全栈细节版

> **百+移动端 IAP 支付接入 ｜ 全栈开发**
>
> 为百+移动端接入 iOS 和鸿蒙 IAP 支付能力。**后端**：重构预下单 `BaijiaAgentService.preOrder` 接口，根据 `deviceType=IOS/HARMONY/ANDROID/WEBAPP` 分别构造 `tradeType` 和 `assetsParam`；扩展资产中心余额 DTO 新增三端分桶字段；收支记录新增 IAP 操作类型透传，保持全量参数向前兼容。**前端**：实现 `payIAP` 统一方法封装 iOS/鸿蒙 IAP 调用，按 ua 分发不同入参；改造 newHeatProcess 页面，基于钱包余额与实收金额判断展示服务费卡片和 Popover 提示，金额计算使用 `Decimal.ROUND_UP` 进位；税率改为后端可配置；改造 myOrder 页面支付弹窗（含服务费明细）和 orderDetail 待支付卡片。

### 简历关键词速取

| 维度 | 亮点关键词 |
|------|-----------|
| **后端** | 预下单接口重构、deviceType 分发策略、资产分桶（cashIosBalance/cashHarmonyBalance）、RSA 签名、收银台对接、参数向前兼容 |
| **前端** | IAP 原生桥接（sendIAPRequest）、多端统一支付方法、服务费动态计算（余额 vs 实收）、Decimal.ROUND_UP 进位、Popover 交互、税率可配置化 |
| **业务价值** | iOS/鸿蒙支付通道从 0 到 1、提升百+移动端支付转化、扩大客户规模 |

---

## 三、面试问题预测 & 回答准备

### 后端方向

#### Q1：IAP 的预下单接口你是怎么设计的？不同端之间有什么区别？

**关键点**：
- 共用一个预下单接口，通过 `deviceType` 参数分发
- `deviceType=IOS`：`tradeType=IOS_IAP`，`assetsParam` 传 `productId` + `skuQuantity`
- `deviceType=HARMONY`：`tradeType=HARMONY_IAP`，`assetsParam` 传 `productId`
- `deviceType=ANDROID/WEBAPP`：走原 `smartH5` 逻辑
- `skuQuantity = amount / 基础商品单价`，生成后全量参数做 RSA 签名再调收银台

#### Q2：余额分桶是怎么做的？为什么不直接用现有字段？

**关键点**：
- 现有 `rechargeBalance` 是所有来源的充值总额，无法区分端来源
- 新增 `cashBalance`（PC/安卓）、`cashIosBalance`（iOS）、`cashHarmonyBalance`（鸿蒙）、`otherBalance`（其他）
- 保持 `rechargeBalance = 总额` 不变化，存量接口不受影响
- 分桶字段当前用于问题排查和数据看板，暂不介入下单扣费逻辑（后续可按平台隔离消费）

#### Q3：收支记录新增了操作类型，你是怎么处理的？

**关键点**：
- 新增类型 27、121 对应 iOS/鸿蒙 IAP 充值
- 后端不做枚举强校验，直接透传给收银台
- 前端不传 type 时后端兜底补全全部类型（含新旧）
- 返回 DTO 字段（operateCode/operateType/change/balance）保持不变

#### Q4：你提到"扩展参数、保留兼容"，具体怎么做的？

**关键点**：
- `BaijiaAgentService.preOrder` 原有入参 `amount` + `deviceType` 不变，扩展新参数
- 余额 DTO 保持 `rechargeBalance` 语义不变，新增字段不参与现有下单扣费逻辑
- 收支记录透传新增类型，不限制枚举范围
- 后端代码旧调用方无需改造

#### Q5：服务费的计算逻辑在前后端是怎么划分的？

**关键点**：
- 后端传入税率（feeRate），前端计算：`立即支付金额 = 实收金额 / 税率`
- 前端用 `Decimal.ROUND_UP` 保留两位小数（不管第三位多少都进位）
- 税率可配置化，由后端接口返回，前端不写死
- 服务费 `= 立即支付金额 - 实收金额`
- 钱包余额 < 实收金额时才展示服务费卡片

#### Q6：点击 "立即支付" 时余额变化的边界情况怎么处理的？

**关键点**：
- 点击时**再次调用余额接口**（进入页面时已调过一次）
- 四种情况：
  - 余额 < 实收金额 + 之前没展示服务费 → Toast 提示，展示服务费卡片，**不支付**
  - 余额 < 实收金额 + 已经展示服务费 → 进入支付流程
  - 余额 ≥ 实收金额 + 之前展示了服务费 → Toast 提示，隐藏服务费卡片，**不支付**
  - 余额 ≥ 实收金额 + 之前没展示服务费 → 进入支付流程

#### Q7：iOS 和鸿蒙的 IAP 支付在前端是怎么统一封装的？

**关键点**：
- 封装 `payIAP(tradeToken, platform)` 方法，按 `platform` 分发不同参数
- iOS：传 `productId: 'com.baidu.baijia'` + `tradeToken`，通过 `baiduboxapp://utils/sendIAPRequest` scheme 调用
- 鸿蒙：传 `payParam: { tradeToken }` + `secondCallback`，同样通过 sendIAPRequest 调用
- 安卓/web 走原有 `payAmount` 方法，互不干扰
- 支付失败（余额不足）调起充值页面时，通过 `deviceType` 判断走 IAP 还是 H5 支付

#### Q8：IAP 支付接入中遇到过什么坑？

**关键点**：
- iOS 和鸿蒙虽然是同一个能力，但参数结构不同（iOS 要 productId + skuQuantity，鸿蒙只要 tradeToken + 回调方式不同）
- 生成 `skuQuantity` 时金额除不尽的问题，需要确定小数位数处理策略
- 支付金额与苹果/华为后台配置的 productId 对应的价格不匹配时，需要提示用户"受平台限制，请前往网页端支付"
- 收银台返回的 tradeToken 需要原样透传给前端，不能额外处理

---

## 四、项目亮点总结

1. **支付通道从 1 到 3**：从仅支持安卓 H5 支付，扩展到 iOS IAP + 鸿蒙 IAP + 安卓三端并行
2. **全链路覆盖**：从下单、预下单、支付、余额查询、收支明细到数据看板，完整支付闭环
3. **向前兼容设计**：采用"扩展参数、保留兼容"策略，存量接口和调用方零改动
4. **前端抽象**：统一的 `payIAP` 方法桥接 iOS/鸿蒙原生能力，业务代码屏蔽端差异
5. **复杂支付状态机**：余额 vs 实收金额的四象限判定逻辑，覆盖了所有真实支付场景