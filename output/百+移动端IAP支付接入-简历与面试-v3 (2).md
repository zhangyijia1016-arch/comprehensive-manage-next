# 百+移动端 IAP 支付接入 — 简历 & 面试（修正版 v3）

> 项目来源：百+ IOS 端及鸿蒙系统支持 IAP 支付
> 角色：H5 前端支付接入 + 后端 iOS/鸿蒙支付
> 日期：2026-07-17

---

## 一、项目背景与角色定位

### 改造前的痛点

百+移动端 H5 页面**只支持余额支付**——用户下单时如果余额充足直接扣款，余额不足则提示"**请前往 PC 端充值**"，体验很差，iOS 和鸿蒙用户更是无处可充。

### 我的职责（两期分工）

| 阶段 | 工作内容 |
|------|---------|
| **一期** | H5 前端接入安卓收银台 SDK 支付，打通 H5 → 端 SDK 的支付调起链路 |
| **二期** | **H5 前端**：接入 iOS/鸿蒙 IAP 支付，安卓继续沿用一期收银台方案；**后端**：iOS & 鸿蒙支付开发（预下单分发、余额分桶、收支记录扩展） |

### 二期改造目标

由于苹果和华为应用商店规定虚拟商品必须使用 IAP（In-App Purchase）支付，无法复用一期的安卓收银台方案。因此二期为 iOS 和鸿蒙端新增 IAP 支付通道，让用户余额不足时可以直接在端内通过 IAP 完成充值并继续下单。

---

## 二、简历写法

### 版本一：全栈版（推荐）

> **百+移动端 IAP 支付接入 ｜ 全栈开发**
>
> **一期**：负责 H5 前端接入安卓收银台 SDK 支付。
>
> **二期**：负责 iOS/鸿蒙 IAP 支付的全栈接入。**H5 前端**：在 `createPreOrder` 余额不足时进入 `payAmount` 方法，按 `deviceType` 分发 `payAndroid`/`payIos`/`payHarmony`；封装统一 IAP 桥接逻辑，按 ua 向端侧传递不同支付参数；改造 newHeatProcess 页面实现服务费卡片动态展示（余额 vs 实收金额四象限判断）、税率可配置化、Decimal.ROUND_UP 进位计算；改造 myOrder 支付弹窗和 orderDetail 待支付卡片。**后端**：改造预下单接口按 deviceType 分发 tradeType/assetsParam，扩展余额 DTO 新增分桶字段，收支记录新增 IAP 操作类型透传，采用"扩展参数、保留兼容"策略保证存量接口零改动。

### 版本二：H5 前端版

> **百+移动端 IAP 支付接入 ｜ H5 前端开发**
>
> **一期**：接入安卓收银台 SDK 支付，打通 H5 到端 SDK 的支付调起链路。
>
> **二期**：为 H5 页面接入 iOS/鸿蒙 IAP 支付。设计 `payAmount` 分发策略——`createPreOrder` 检测余额不足后统一进入 `payAmount`，按 `deviceType` 路由到 `payAndroid`（一期收银台）/ `payIos` / `payHarmony`。封装 IAP 桥接方法接续端侧原生支付能力。实现服务费卡片动态展示逻辑（余额 < 实收金额时展示，支付时重新拉取余额做四象限判断覆盖所有边界），税率由后端下发实现可配置化。联调中解决了 iOS 商品购买数量限制、跨端账号一致性校验（sdkSign 签名匹配）、鸿蒙抓包规则限制等实际问题。

---

## 三、前端支付分发策略

```
用户下单 → createOrder
     ↓
  余额充足？——→ 直接扣余额 → 完成
     ↓ 否
  preOrder(amount, deviceType)
     ↓
  payAmount(deviceType)
     ↓
  ┌──────┼──────┐
  │      │      │
payAndroid  payIos  payHarmony
（一期收银台）  (IAP)    (IAP)
  │      │      │
  ↓      ↓      ↓
收银台  App Store  华为支付
SDK     IAP      IAP
```

> **关键设计**：三种支付方式共用 `createPreOrder` → `payAmount` 入口，通过 `deviceType` 参数从入口层分流，后续各支付链路互不干扰。一期安卓收银台方案完全保留，二期只新增 iOS/鸿蒙 IAP 逻辑。

---

## 四、联调中遇到的实际问题 & 解决方案

### iOS 端

| # | 问题 | 原因 | 解决方式 |
|---|------|------|---------|
| 1 | `{"status":"1001","message":"支付失败"}` | 使用线上企业包访问测试环境，端侧支付环境未切换 | 安装 debug 包，在手百设置中开启"支付的测试环境" |
| 2 | `{"code":770003,"message":"获取到的内购产品为空"}` | 企业包不支持内购调试 | 必须使用 debug 包，并申请将设备 UDID 加入开发者列表 |
| 3 | `"下单账号与支付账号不一致"` | 线下测试账号与手百登录线上账号不一致 | 后端在测试环境将 uid 写死为线上测试账号 |
| 4 | `"skd签名失败"` | Mock 接口的 bduss 和请求头 sdkSign 签名不匹配 | 不能 mock bduss，需保持签名与登录态一致 |
| 5 | `"此项目一次不能购买超过10个"` | 原方案只申请了 1 元的商品，通过数量累计价格，但苹果限制单次最多 10 个 | 改为按计算税费后的金额申请多个 productId，支付时做金额匹配 |

### 鸿蒙端

| # | 问题 | 原因 | 解决方式 |
|---|------|------|---------|
| 1 | iOS 问题 1-4 | 同上（环境配置/账号/签名） | 同上 |
| 2 | `subCode:30007, iap failed create purchase` | 鸿蒙端不能全量抓包（`*:*` 模式会干扰 IAP 通信） | 配置特定抓包规则，避免过滤 IAP 通信 |

---

## 五、前端核心逻辑详解

### 5.1 服务费卡片的动态展示

```
展示条件：feeRate ≠ 0（后端下发税率）
        且钱包余额 < 实收金额

隐藏条件：用户点击支付时重新拉取余额
         • 余额 < 实收 + 之前没展示 → Toast 提示，展示服务费卡片，不支付
         • 余额 < 实收 + 已展示服务费 → 进入支付流程
         • 余额 ≥ 实收 + 之前展示了 → Toast 提示，隐藏卡片，不支付
         • 余额 ≥ 实收 + 之前没展示 → 进入支付流程
```

> **设计原因**：余额实时变化，点击支付时重新拉取余额做四象限判断，覆盖所有真实支付边界。

### 5.2 金额计算

```
立即支付金额 = 实收金额 / 税率（Decimal.ROUND_UP 进位，保留 2 位小数）
服务费 = 立即支付金额 - 实收金额
```

> 税率由后端接口返回、可配置，前端不写死

### 5.3 支付金额校验

```
if (支付金额 > 申请的最大价格 || 支付金额与 productId 不匹配) {
    提示"受平台限制，请前往网页端支付（https://jiare.baidu.com）"
    不进入支付流程
}
```

---

## 六、H5 预下单实现详解（SAL 层）

### 6.1 调用链路

```
前端
  ↓ deviceType ≠ IAP 走 H5 充值
BaijiaAgentServiceImpl.preOrder(:88)        ← 业务入口
  ↓
CoinService.prePayForSmartH5(:213)          ← SAL 层收口外部调用
  ↓ HTTP POST + RSA 签名
收银台 /order/prePayToken                   ← 交易中台
  ↓
返回 tradeToken → 前端拉起 H5 收银台 SDK
```

> H5 预下单被封装在 power-sal 的 `CoinService` 里，业务层只调接口，第三方服务统一在 SAL 收口。

### 6.2 技术要点

| 技术点 | 实现方式 |
|--------|---------|
| **HTTP 通信** | `HttpUtil.sendPostDataByObjectMap` POST 到 `cashierHost + /order/prePayToken`（:250-255），表单/JSON 提交 |
| **JSON 嵌套序列化** | `JsonUtil.toJson` / `jsonToMap` 做请求体与 map 互转；嵌套的 `assetsParam` 是"JSON 里再放一段 JSON 字符串"（:237-239） |
| **RSA 签名鉴权** | 参数 map 用商户私钥 `RSASign.sign(paramMap, privateKey)` 签名，`rsaSign` 放回参数（:241-248）；签名前做 `privateKey.replace("\n", "")` 换行清洗 |
| **Builder 模式** | `PreOrderRequest.builder().appKey(...).dealId(...).totalAmount(...).deviceType(...).userId(...).returnUrl(...).notifyUrl(...).build()`（:225-238） |
| **配置中心驱动** | `appKey`/`dealId`/`productId`/`cashierHost`/`payNotifyUrl`/`investNotifyUrl` 全部来自 `CoinConfiguration`，多环境（mock/offline/online）零代码切换 |
| **双通知地址** | `notifyUrl` = `payNotifyUrl`（支付结果回调），`assetsParam.notifyUrl` = `investNotifyUrl`（充值入账回调），职责分离（:224、:236） |
| **失败分层处理** | 签名失败返回 null、收银台 code≠0 或 data 为空判失败并告警，最终由上层 `preOrder` 统一转业务错误响应 |
| **无本地落单** | 预下单不写本地订单表，结果一致性依赖前端轮询外部状态和收银台回调，本条链路自身无补偿机制 |

### 6.3 核心难点

**跨系统签名一致性**：签名字段集合、顺序、编码方式必须和收银台验签端完全对齐。`replace("\n", "")` 这类 key 归一化处理稍有偏差就会验签失败，且极难排查——没有明确的错误定位信息。

**参数契约强耦合**：
- `tradeType=smartH5`、`userType=passId` 等是与交易中台约定死的魔法值
- 上游强制只允许 PASS 用户（`BaijiaAgentServiceImpl.java:98-101`），因为中台按 passId 收单——这层约束是隐性的业务契约，不了解的话容易踩坑

**双通知回调职责区分**：`notifyUrl` 和 `assetsParam.notifyUrl` 两个地址认知成本高，需要深入理解收银台协议才能清晰区分。

### 6.4 亮点设计

| 设计 | 价值 |
|------|------|
| **预下单与支付解耦** | 服务端只发令牌（tradeToken），实际扣款在收银台侧、H5 端唤起，职责清晰、安全边界明确 |
| **RSA 签名** | 私钥不出服务端，请求不可伪造 |
| **配置化** | 多环境通过配置切换 host、密钥、产品 ID，代码零改动 |
| **SAL 收口** | `CoinService` 作为统一封装层，业务方只调接口，底层变更对业务透明 |

---

## 七、二期后端 iOS/鸿蒙 IAP 支付实现详解

### 7.1 deviceType 分发策略

`BaijiaAgentService.preOrder` 是二期的统一入口，根据前端传入的 `deviceType` 决定走哪条支付通道。

```java
public class OrderAgentPreOrderRequest {
    private Integer amount;         // 充值金额（分）
    private String deviceType;      // ANDROID / IOS / HARMONY / WEBAPP
}
```

| deviceType | tradeType | assetsParam | 归属 |
|-----------|-----------|-------------|------|
| `IOS` | `IOS_IAP` | `productId`=iOS商品ID + `skuQuantity`=金额/商品单价 | **二期新增** |
| `HARMONY` | `HARMONY_IAP` | `productId`=鸿蒙商品ID（按金额匹配） | **二期新增** |
| `ANDROID` | `smartH5` | 原参数（`productId` + `notifyUrl`） | 一期沿用，不变 |
| `WEBAPP` | `smartH5` | 原参数 | 一期沿用，不变 |

> `skuQuantity` 生成逻辑：`amount / 基本商品单位`，用于 iOS 向 App Store 发起扣款请求
> productId 由 PM 向苹果/华为申请配置，后端通过配置中心获取

### 7.2 收银台 `/order/prePayToken` 参数扩展

二期对收银台请求参数做了以下变更：

| 字段 | 一期逻辑 | 二期 IAP 扩展 |
|------|---------|--------------|
| `tradeType` | 固定 `smartH5` | 按 deviceType 变更为 `IOS_IAP` / `HARMONY_IAP`，H5 保持 `smartH5` |
| `deviceType` | 业务层不使用 | 按前端实际平台传入 `IOS` / `HARMONY`，以 `WEBAPP` 兜底 |
| `assetsParam` | `productId` + `notifyUrl` | 扩展：iOS 增加 `skuQuantity`；鸿蒙使用独立 `productId` |
| `rsaSign` | 对一期参数签名 | **扩展字段参与签名**，字段集合变更后签名必须同步更新 |

其余字段（`appKey`/`tpOrderId`/`dealTitle`/`dealId`/`totalAmount`/`timestamp`/`userId`/`userType`/`notifyUrl`）保持不变。

### 7.3 余额查询分桶

**问题**：原有 `rechargeBalance` 是所有充值来源的总额，无法区分 iOS/鸿蒙/PC 的充值来源。需要分桶统计。

**查询链路**：
```
前端 → BaiPlusFinanceService.getPassBalance
         → CoinService.getBaiPlusCoinBalance
           → 资产中心 /assets/open/baiplus/balance
```

**DTO 扩展**：

```java
// SAL 层 DTO（CoinBalanceResponse.Data）
public static class Data {
    private Long uid;
    private String appKey;
    private Long rechargeBalance;       // 充值总余额（保持不动）
    private Long cashBalance;           // PC/安卓余额（一期存量）
    private Long cashIosBalance;        // iOS IAP 充值余额（二期新增）
    private Long cashHarmonyBalance;    // 鸿蒙 IAP 充值余额（二期新增）
    private Long otherBalance;          // 其他来源余额
}

// API 层 DTO（BalanceInfoDto）
public class BalanceInfoDto {
    // 保持原有字段不变
    private Long rechargeBalance;       // 充值总余额
    // 新增分桶字段
    private Long cashBalance;
    private Long cashIosBalance;
    private Long cashHarmonyBalance;
    private Long otherBalance;
    // ... fundsBalance 等已有字段
}
```

**兼容策略**：

```
rechargeBalance = cashBalance + cashIosBalance + cashHarmonyBalance + otherBalance
                    ↓
            现有下单扣费逻辑（realAssetBalance）仍使用 rechargeBalance 总额
                    ↓
         分桶字段当前仅用于端上展示、看板统计和问题排查
         后续可按平台隔离消费（冻结/扣费记录中记录资产来源）
```

> **核心原则**："扩展参数、保留兼容"——`rechargeBalance` 对外语义不变，不加字段不影响存量逻辑；新增分桶字段只读展示，暂不参与任何扣费链路的判断。

### 7.4 收支记录扩

```java
// 前端调用：/assets/open/baiplus/listrecord?operateTypes=...
// 新增类型：27（iOS IAP 充值）、121（鸿蒙 IAP 充值）
```

**变更点**：

1. 原有操作类型：15, 9, 11, 13, 19, 45, 6, 10, 12
2. **新增操作类型**：27（iOS IAP）、121（鸿蒙 IAP）
3. 后端**不做枚举强校验**，直接透传给收银台，前端可传入任意类型
4. 当前端未传入 `operateTypes` 时，后端补全全部类型（含新旧）作为兜底：15, 9, 11, 13, 19, 45, 6, 10, 12, **27, 121**
5. 返回 DTO（`CoinDetailDto.operateCode/operateType/change/balance/status/time/commandId`）保持不变

> **设计考量**：因为后端不做枚举限制，新增类型无需发版即可透传。如果后续接入其他支付来源（如谷歌支付），同样只需增加 operateType 值，代码零改动。

### 7.5 参数兼容策略（总体原则）

```
"扩展参数、保留兼容"
```

| 场景 | 策略 |
|------|------|
| **预下单** | 原入参 `amount` + `deviceType` 不变，扩展 `assetsParam` 内容，`tradeType` 按 deviceType 派生 |
| **余额查询** | `rechargeBalance` 字段名和语义不变，新增分桶字段不参与现有扣费逻辑 |
| **收支记录** | 新增 operateType 不限制枚举范围，后端透传 |
| **旧调用方** | 所有存量接口调用方无需改造 |

### 7.6 一期 vs 二期后端调用链对比

```
一期（H5 收银台）:
  preOrder(amount, deviceType=ANDROID)
    → deviceType == ANDROID → tradeType=smartH5
    → CoinService.prePayForSmartH5(...)    ← SAL 收口
      → RSA 签名 + POST 收银台
      → 返回 tradeToken
    → 前端拉起 H5 收银台 SDK

二期（iOS IAP）:
  preOrder(amount, deviceType=IOS)
    → deviceType == IOS → tradeType=IOS_IAP, assetsParam + productId + skuQuantity
    → 拼接 businessParams，研发币外部收银台
    → 返回 tradeToken + productId
    → 前端 payIAP(tradeToken, 'ios')

二期（鸿蒙 IAP）:
  preOrder(amount, deviceType=HARMONY)
    → deviceType == HARMONY → tradeType=HARMONY_IAP, assetsParam + productId
    → 返回 tradeToken
    → 前端 payIAP(tradeToken, 'harmony')
```

---

## 八、面试问题预测 & 回答准备

#### Q1：一期和二期的支付链路你是怎么设计的？安卓收银台和 iOS/鸿蒙 IAP 怎么共存的？

**关键点**：
- `createPreOrder` 是统一入口，余额不足时进入 `payAmount` 做分发
- `payAmount` 按 `deviceType` 路由：安卓走一期的 `payAndroid`（收银台 SDK），iOS/鸿蒙走二期的 `payIos`/`payHarmony`（IAP）
- 一期代码完全保留，二期以"新增"方式接入，不改动一期逻辑
- 每种支付方式各自维护自己的调起、回调、轮询逻辑，互不干扰

#### Q2：H5 页面原来只支持余额支付，你是怎么设计 IAP 支付接入方案的？链路上有几个关键节点？

**关键点**：
- H5 页面只做两件事：调起端能力 + 轮询结果，支付本身在端侧完成
- 链路：下单 → 余额不足 → preOrder 获取 tradeToken → payAmount 分发 → payIos/payHarmony 调起 IAP → 轮询充值 → 重新下单
- 前后端配合：后端生成 tradeToken 和参数，前端传给端并按 ua 分发

#### Q3：服务费卡片的四象限判断逻辑是怎么想到的？

**关键点**：
- 用户从进入页面到点击支付这段时间里，余额可能被其他订单消耗，也可能充值了
- 简单在进入页面时判断一次不够，必须点击支付时**重新拉取余额**再判断
- 余额 vs 服务费展示状态存在四种组合，每种都要正确处理
- 这个逻辑是我在实际开发中自己发现的边界问题，设计文档里没有

#### Q4：联调中遇到的 iOS 商品数量限制（10 个）是怎么解决的？

**关键点**：
- 原方案只申请了 1 元商品用 skuQuantity 累加，苹果限制单次最多 10 个
- 改为按计算税费后的金额申请多个 productId，支付时执行金额匹配
- 不匹配时提示"受平台限制，请前往网页端支付"

#### Q5：sdkSign 签名失败的问题，为什么会发生在你的链路里？

**关键点**：
- 联调 mock 了接口的 bduss cookie，但请求头的 sdkSign 是用线上 cookie 生成的
- 端侧做了请求完整性校验，签名和 cookie 必须匹配
- 最终后端在测试环境把 uid 写死为线上账号，前端不做 mock

#### Q6：把这个需求写在简历上，你觉得最有亮点的技术点是什么？

**可以选的角度**：
1. **多支付通道共存架构**：一期收银台 + 二期 IAP，同一个人口按 deviceType 分发，互不干扰
2. **处理边界情况**：服务费四象限判断、金额匹配兜底
3. **联调实战经验**：debug 包、内购产品限制、sdkSign 签名校验、鸿蒙抓包限制
4. **前后端全链路**：从下单到支付到轮询到分桶，完整闭环

---

### 6.2 追加提问（完整下单流程专项）

#### Q7：为什么需要"预下单"这一步？直接让前端调起支付不行吗？

**关键点**：

预下单承担三个关键角色：

1. **参数组装与签名**：前端拿不到私钥。预下单后端根据 `deviceType` 确定通道、获取 `productId`、构造 `assetsParam`，最后**对全量参数做 RSA 签名**。签名前做了 `privateKey.replace("\n", "")` 换行清洗——这类细节稍有偏差就会和收银台对不上，极难排查。签名私钥只放在服务端，保证请求的合法性和完整性。

2. **与交易中台交互获取凭证**：`CoinService.prePayForSmartH5` 通过 `HttpUtil.sendPostDataByObjectMap` POST 到 `cashierHost + /order/prePayToken`，向交易中台申请支付凭证（`tradeToken`）。调用链路：
   ```
   前端 → BaijiaAgentServiceImpl.preOrder(:88)     ← 业务入口
           → CoinService.prePayForSmartH5(:213)      ← SAL 收口
             → HttpUtil POST 收银台 /order/prePayToken  ← RSA 签名
             → 返回 tradeToken + tpOrderId + orderId + timestamp + appKey
   ```
   这个 `tradeToken` 是 H5 端唤起收银台 SDK 的必要凭证。

3. **实时校验**：下单时余额不够，但等到真正支付前余额可能变了、用户状态可能变了。预下单是调起支付前的最后一道实时校验。

**类比**：预下单相当于拿着购物车去收银台**开单盖章**，拿到盖章小票（tradeToken）后才能去付款。没有这步，端上不知道这笔交易合不合法、该付多少钱。

---

#### Q8：前端怎么轮询充值状态的？频率怎么定的？页面关了怎么办？

**关键点**：

**实现方式**：
```javascript
function pollRechargeStatus(orderId, maxRetries = 30) {
    let retryCount = 0;
    const check = async () => {
        const status = await api.assetOrderQuery({ orderId });  // 实时查交易中台
        if (status === 'SUCCESS') return handleSuccess();
        if (status === 'FAILED') return handleFail();
        retryCount++;
        if (retryCount >= maxRetries) return handleTimeout();
        setTimeout(check, 2000);
    };
    check();
}
```

**循环实现**：递归 `setTimeout`（而不是 `setInterval`），避免上一次请求还没回来下一次就发出了。每次请求回来再发起下一次，保证节奏可控。

**频率**：间隔 **2 秒**一次，IAP 支付通常是秒级到分钟级到账。最快也要 1-2 秒，太频繁浪费带宽、增加后端压力，太长影响用户体验。最多轮询 30 次（约 1 分钟），超时后不再轮询，提示用户去订单列表查看。

**页面关了怎么办**：
- 前端轮询基于页面生命周期，关掉页面轮询自然停止
- **但在本项目的架构下这不是问题**：充值订单权威状态在外部交易中台，`assetOrderQuery` 每次都是实时查询。关掉页面重新打开后重新查，就能拿到最新状态
- 页面上的"待支付"只是轮询中断后的过时展示，钱没丢

---

#### Q9：为什么以后端返回的充值状态作为支付成功凭证，而不是直接相信端返回的结果？

**关键点**：

**端侧回调不可信**：
- IAP 端回调在 H5 页面与 App 之间通信，理论上可以被 Hook、断点篡改或中间人攻击
- 如果有人伪造"支付成功"回调，前端直接往下走，订单会被错误地认为已支付

**真正能确认支付成功的是外部资产入账**：
- 端支付成功 ≠ 钱到账了。完整链路是：
  ```
  用户付款 → App Store/华为确认 → 收银台回调 → 资产充值入账
  ```
- 只有资产中心的账上真的多了这笔钱才算成功
- 任何端侧回调状态，在正式走业务逻辑之前，都必须**通过后端接口向交易中台/资产中心反查确认**。

**端侧回调的定位"优化体验，不是确认成功"**：
- 端回调回来 → 前端 UI 给反馈（loading/支付中），告诉用户"正在处理"
- 但真正的成功依据 → 轮询 `assetOrderQuery` 返回的结果（交易中台的实时状态）

---

#### Q10：前后端怎么防止用户对同一个订单多次支付？

**关键点**：

多层拦截链路，从外到内逐层防守：

**前端层**：点击支付后立即置灰按钮 + 显示 loading，防止 IAP 弹窗出来前连续点击。

**订单状态机**：
- `createOrder` 创建的百+投放订单有**业务状态**：`待支付 → 支付中 → 已支付 / 已关闭`
- 支付请求进来先查订单状态：只有"待支付"才允许进入流程。进入后立即标记为"支付中"，重复请求被拦截

**幂等设计**：
- 预下单接口的 `tpOrderId` 对交易中台是唯一的，收银台侧做去重，同一个 `tpOrderId` 不会生成两个 `tradeToken`
- 同一个 `tradeToken` 在端上也只能完成一次支付

**交易中台兜底**：即使前端拦截全部失效，交易中台侧收到重复请求也会拒绝处理。

```
前端按钮置灰 → 订单状态机 → 行锁 → 交易中台去重
```

---

#### Q11：用户 IAP 支付成功了，但轮询中断/关页面了，页面还显示"待支付"，钱丢了吗？

**关键点（基于本项目实际架构）**：

答案是：**钱没丢，这是前端展示问题，不是资金问题。**

**本项目不维护充值订单的权威状态**：
- `assetOrder`（`BaijiaAgentServiceImpl.java:46`）只调 `ecosystemService.preOrder` 向交易中台预下单，**本地不落充值订单状态表**，只在 CRM 记了个渠道归属
- `assetOrderQuery`（`BaijiaAgentServiceImpl.java:72`）走 `ecosystemService.orderQuery`，**查的是交易中台的实时状态**，不是本地缓存
- 支付成功回调 `/api/syncPayInfo` 只把记录插入 `pass_trade_notify_record` 且 `payStatus` 恒为 0，仅供开票用——**不会把订单改成已支付、不会给余额入账**
- 余额入账由**外部资产服务**负责，本项目只在消费扣款时读本地余额

**实际发生了什么**：

```
用户支付成功
    ↓
交易中台已记账、外部资产服务已入账
    ↓
前端轮询 `assetOrderQuery` 中断/页面关闭
    ↓
只是前端没拿到"已支付"这一帧，展示停在"待支付"
    ↓
用户下次回来 → 调 `assetOrderQuery` 或查余额
    ↓
查到的是交易中台实时状态 → 已支付、余额已入账 ✓
```

**结论**：这是**前端展示的最终一致性问题**，真相始终在外部交易中台。可靠的是 **"外部平台为准 + 客户端重新查询"** 模型，不需要服务端主动补偿，因为本项目根本就不充值时订单的权威状态。

> **面试启示**："掉单怎么补偿"是一个很常见的面试追问，但不要无脑回答"用定时任务对账"。先搞清楚**权威状态在哪、谁在维护**。如果一个项目不存充值订单状态，就不需要在这个项目里做补偿。这条链路靠的是外部交易中台的强一致性和客户端重查，不是服务端主动扫表。

---

#### Q12：`CoinService.prePayForSmartH5` 向收银台发送请求时，RSA 签名的具体实现有什么要点？踩过什么坑？

**关键点**：

实现步骤：
1. 构造参数 map（appKey, dealId, totalAmount, deviceType, userId, returnUrl, notifyUrl 等）
2. `privateKey.replace("\n", "")` 清洗私钥换行符
3. `RSASign.sign(paramMap, privateKey)` 对全量参数签名
4. 将 `rsaSign` 放回参数 map，HttpUtil POST 提交

**踩过的坑**：

**签名坑一：换行清洗**。收银台验签端会把私钥中的 `\n` 归一化处理，如果你传的私钥里带了 `\n` 不清理，两边签名结果就不一致。这个问题特别难排查——收银台只会告诉你"验签失败"，不会告诉你哪个字段不对。

**签名坑二：字段顺序**。签名时参数 map 的顺序必须和收银台验签时完全一致。如果 map 实现类不同（比如 HashMap vs TreeMap），字段遍历顺序不同，签出来的值就不一样。

**签名坑三：嵌套序列化**。`assetsParam` 是一个嵌套 JSON 字符串，需要在签名前先 JSON 序列化好再放入 map。如果序列化和收银台不一致（比如 key 排序方式），也会导致验签失败。

**其他要点**：

| 要点 | 说明 |
|------|------|
| **配置中心驱动** | appKey/dealId/cashierHost/productId 全部来自 `CoinConfiguration`，mock/offline/online 切换无代码改动 |
| **双通知地址职责** | `notifyUrl`（payNotifyUrl）收支付结果回调；`assetsParam.notifyUrl`（investNotifyUrl）收充值入账回调，两者用途不同 |
| **Builder 模式组参** | `PreOrderRequest.builder().appKey(...).dealId(...).totalAmount(...).deviceType(...).userId(...).returnUrl(...).notifyUrl(...).build()` |
| **失败分层处理** | 签名失败返回 null → 上层判空；收银台 code != 0 → 告警日志；最终由 `preOrder` 统一转业务错误响应 |

---

#### Q13：`prePayForSmartH5` 里的依赖都是配置化的，你觉得这个设计好在哪？如果让你设计你会怎么改？

**关键点**：

**现有设计的好处**：
- `CoinConfiguration` 统一管理 `appKey/dealId/productId/cashierHost/payNotifyUrl/investNotifyUrl` 等所有外部依赖
- 多环境（mock/offline/online）通过配置切换，**代码零改动**
- 配置变更无需发版，线上出问题可快速切换配置

**可以改进的地方**：
- 当前是本地配置类，可以升级为**配置中心**（如 Apollo 或 Spring Cloud Config），支持实时推送、灰度发布、配置回滚
- 当前故障处理比较朴素（超时重试没有，容错降级没有），可以用 **Resilience4j** 或 Sentinel 收口：配置超时时间、重试次数、熔断阈值
- HTTP 调用当前是裸 `HttpUtil.sendPostDataByObjectMap`，可以封装成带重试 + 熔断的 REST 客户端，统一处理签名和验签逻辑

---

#### Q14：签名时为什么用 `privateKey.replace("\n", "")` 清洗换行？这会有什么安全风险吗？

**关键点**：

**为什么需要清洗**：
- 私钥 PEM 格式文件中通常包含换行符（每 64 字符换行），便于阅读
- 但收银台验签时不希望有换行，所以需要 `replace("\n", "")` 归一化
- 这不是业务逻辑缺陷，是**不同系统对私钥格式的处理差异**

**安全考虑**：
- 私钥不出服务端，不传出接口范围
- `replace("\n", "")` 只影响格式，不影响加密强度，没有安全风险
- 真正的风险点是**不要在日志里打印 privateKey**——签名前的入参日志要脱敏

---

#### Q15：你说 H5 预下单无本地落单、无补偿机制，那如果收银台返回成功了但网络异常导致前端没拿到 tradeToken，怎么办？

**关键点**：

这种情况依赖**上层幂等 + 客户端重试**：

1. **前端重试**：用户再次点击支付，传入同一个 `tpOrderId`，交易中台侧检测到同一个 `tpOrderId` 已生成过 `tradeToken`，**返回已有的 tradeToken，不重复创建**
2. **业务层兜底**：收银台异常时前端上报告警，运营在后台重新触发
3. **无资金风险**：预下单只生成 token 不扣款，真正扣款在收银台侧支付时发生。token 生成失败没有资金损失，只有体验影响

**关键设计思想**：预下单是无副作用的——它不写本地库、不扣余额、不锁订单预占。所以失败了重试就行，没有回滚成本。

---

## 九、简历关键词速取

| 维度 | 亮点关键词 |
|------|-----------|
| **一期（H5 前端）** | 安卓收银台 SDK 接入、H5 调起端原生支付 |
| **二期（H5 前端）** | payAmount 三端分发（payAndroid/payIos/payHarmony）、IAP 能力桥接、服务费动态计算四象限、Decimal.ROUND_UP 进位、余额实时校验、税率可配置化 |
| **二期（后端）** | 预下单 deviceType 分发策略、tradeType 扩展（IOS_IAP/HARMONY_IAP）、RSA 签名、资产分桶（cashIosBalance/cashHarmonyBalance）、收支记录类型透传、向前兼容 |
| **H5 预下单 SAL 层** | CoinService.prePayForSmartH5、RSA 签名 + 换行清洗、配置中心驱动、嵌套 JSON 序列化、Builder 组参、双通知地址职责分离（payNotifyUrl/investNotifyUrl）、SAL 层收口外部调用 |
| **联调实战** | debug 包 vs 企业包、productId 阶梯匹配解决 10 个限制、sdkSign 签名校验冲突、鸿蒙抓包规则限制 |

---

> 生成时间：2026-07-17
> 用途：秋招面试准备 · H5 前端 & 后端方向