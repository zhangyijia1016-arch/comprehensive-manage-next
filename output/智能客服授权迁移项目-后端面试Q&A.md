# 智能客服授权体系迁移项目 — 后端面试 Q&A 全记录

> 项目来源：巧舱 → 企业号平台智能客服授权迁移
> 角色：全栈开发（后端为主）
> 日期：2026-07-16

---

## 目录

- [一、项目概述](#一项目概述)
- [二、第一轮：项目理解 & 业务层面（面试官提问）](#二第一轮项目理解--业务层面面试官提问)
- [三、第二轮：后端深度 — 候选人回答](#三第二轮后端深度--候选人回答)
- [四、第三轮：更多后端问题（面试官追加）](#四第三轮更多后端问题面试官追加)
- [五、附录：简历写法参考](#五附录简历写法参考)

---

## 一、项目概述

**项目名称**：智能客服授权体系迁移（巧舱 → 企业号平台）

**项目背景**：人工客服和智能客服分别在企业号平台和巧舱平台两个系统上管理，体验割裂。需要将智能客服的授权、绑定、管理能力完整迁移到企业号平台，统一用户体验。

**核心变更**：

| 维度 | 变更内容 |
|------|---------|
| 授权方向 | 「UC 账号添加 Pass 账号」→「Pass 账号绑定 UC 账号」 |
| 核心接口 | bind 接口入参从 ucId 改为 encodePassId |
| DB 扩展 | `corp_agent_bind` 表新增 5 个字段（customerServiceId、customerServiceName、effectiveScene、source、effectiveTime） |
| 状态扩展 | 两态 → 四态（isAuthorize + authNum/total） |
| 新增接口 | 客服列表获取、绑定/更换/解绑客服、批量更换营销账号 |
| 覆盖业务线 | 企业号、巧舱、营销通 |

---

## 二、第一轮：项目理解 & 业务层面（面试官提问）

### Q1：先简单介绍一下这个项目是做什么的？背景和目标是什么？

> 考察点：对项目全局的理解、两条业务线的关系、核心价值

### Q2：这个需求的"四态"是指什么？你怎么设计状态管理的？

> 考察点：状态推导逻辑（isAuthorize × authNum）、前端 vs 后端状态管理

---

## 三、第二轮：后端深度（候选人回答）

### Q3：分布式锁设计

**面试官**：你说引入了分布式锁来解决并发授权，具体怎么设计的？锁的 key 粒度是什么？如果持有锁的节点挂了怎么兜底？

**候选人**：

**背景**：一个 Pass 账号只能被一个 UC 账号绑定，多个请求同时给同一个 passId 授权就会出现重复绑定或数据覆盖。

**Key 粒度**：按 **passId 维度**，格式为 `auth:lock:passId:{encodePassId}`。不同用户的授权请求天然隔离，细粒度锁最大化并发性能。

**实现方案**：

```
SET auth:lock:passId:{encodePassId} {UUID} NX EX 5
```

- **NX**：保证互斥（key 不存在才能成功）
- **EX 5**：5 秒自动过期，防止死锁
- **Value = UUID**：标识锁的持有者，解锁时校验
- **解锁用 Lua 脚本**：先 GET 对比 UUID，匹配后 DEL，保证原子性
- **配合 @Transactional**：锁释放需等事务提交后，防止其他线程读到未提交数据

**节点挂了怎么办**：
- 5 秒过期时间就是兜底方案，节点宕机锁自动释放
- Trade-off：过期时间太短（1 秒）→ 业务没执行完锁就释放；太长 → 影响用户体验
- 更完善的方案：Redisson 看门狗机制，每隔 10 秒续期一次，业务执行完手动释放

**为什么不用 synchronized**：
后端多实例部署，synchronized 只对单进程生效，跨实例必须用分布式锁。

---

### Q4：兼容性设计

**面试官**：`corp_agent_bind` 表扩展了 5 个新字段，你有考虑过兼容性问题吗？线上已有数据怎么处理的？

**候选人**：

从三个层面保证兼容性：

**1. 数据库变更**
- 5 个新字段全部设置**默认值**（空字符串或 0），存量记录自动兼容
- DDL 使用 Online DDL（gh-ost），避免锁表影响线上读写
- 所有新字段允许为 NULL，NULL 表示"不适用"

**2. 存量数据前端兼容**
- `effectiveTime` 为 0/NULL → 前端不展示豁免时间提示
- `source` 为空 → 操作列不做来源判断，维持旧逻辑

**3. 业务逻辑兼容**
- 接口层参数级别向前兼容，旧调用方不受影响
- 新增接口使用新端点，不干扰旧调用方
- 数据层面无需迁移脚本

**4. 灰度策略**
- 小流量验证 → 全量放开
- 先验证新接口和状态逻辑，后扩展存量

---

### Q5：跨系统数据一致性（修正版）

**面试官**："更换客服/接入智能客服"接口中，只是调用巧舱 API 获取可绑定的客服列表，这种情况下数据一致性怎么保证？

**候选人**：

感谢纠正。实际调用链路如下：

**接口分工**：
- **获取客服列表接口**：调用巧舱 API 查询可用智能客服列表（**纯读取**），不涉及任何写操作
- **绑定/更换/解绑客服接口**：完全在企业号系统内部完成，只操作 `corp_agent_bind` 表，不涉及跨系统写

**1. 获取客服列表（调巧舱 API - 只读）**

纯读操作，不存在一致性问题。只需要关注：
- **容错兜底**：巧舱 API 超时/不可用时，前端展示空列表或降级提示
- **调用方式**：直接透传巧舱返回数据，不做本地缓存（实时性要求）
- **异常处理**：超时阈值设 3 秒，超时后返回空列表并告警

**2. 绑定/更换/解绑客服（企业号内部）**

完全在企业号 DB 内完成，单表操作：

```sql
UPDATE corp_agent_bind SET
    customer_service_id = #{csId},
    customer_service_name = #{csName},
    effective_scene = #{scene},
    status = 'BOUND'
WHERE user_id = #{userId}
```

- `@Transactional` 保证原子性
- 并发场景用行锁（`SELECT ... FOR UPDATE`）或乐观锁（`version` 字段）防止覆盖

**总结**：

| 场景 | 一致性方案 |
|------|-----------|
| 获取客服列表 | 调巧舱只读 API，不涉及写操作 |
| 绑定/更换/解绑客服 | 本地 `@Transactional` + 行锁，单库事务保证 ACID |
| 真正的跨系统写（bind 授权） | 如涉及，才需要最终一致性/补偿机制 |

---

### Q5（旧版本）：跨系统数据一致性（保留备查）

> 此版本为基于"跨系统写入"假设的回答，经确认该场景在"更换客服/接入智能客服"接口中不存在，保留作为分布式事务方案的参考。

**方案选择：最终一致性**。远程 RPC 不支持 XA/TCC 二阶段提交，只能做最终一致性。

**流程**：
1. 先写本地 DB，状态设为 `PROCESSING`
2. 调用巧舱绑定接口
3. 成功 → 更新为 `SUCCESS`；失败 → 更新为 `FAILED`

**补偿机制**：
- 定时任务扫描 `PROCESSING` 且超时（>30s）的记录
- 反查巧舱实际绑定状态，对账修复
- 管理后台提供手动对账入口

**为什么不先调巧舱再写本地**：巧舱成功 → 本地失败，补偿任务扫描不到，数据将永久不一致。

---

### Q6：授权方向翻转

**面试官**：授权方向从「UC 账号添加 Pass 账号」改成「Pass 账号绑定 UC 账号」，带来了哪些改动？

**候选人**：

**1. 接口入参变化**
- 旧链路：`bind(ucId, agentId)` — 巧舱驱动，UC 账号维度的授权
- 新链路：`bind(encodePassId, ucId)` — 企业号驱动，Pass 账号维度的绑定

**2. 授权页面展示逻辑翻转**
- 旧：传 ucId，页面展示"这个 UC 有哪些 pass 可添加"，勾选 → 确定 → 批量添加
- 新：传 passId，页面展示"这个 pass 可以绑定到哪些 UC"，选择 UC → 确定 → 绑定

**3. bind 接口重写**
- 旧：`CorpMerchantAgentService/bind`，入参 `ucId`
- 新：入参改为 `encodePassId` + `ucId`
- 需兼容旧调用方（适配器模式 / 参数版本号区分）

**4. 批量能力变化**
- 旧：多个 Pass 账号一次授权给一个 UC 账号
- 新：多个 passId 批量更换/绑定 UC 账号

**5. 数据表维度翻转**
- 原来以 `ucId` 为主维度
- 现在以 `userId`（passId）为主维度，记录它绑定的 `ucId`

**6. 前端跳转链路变化**
- 旧：巧舱卡片 → 巧舱平台 → 工具页面 → 企业号授权页（传 ucId）
- 新：巧舱卡片 → 企业号巧舱授权页（传 passId）→ 选择 UC → 确定授权

**7. 分布式锁 key 调整**
- 锁粒度从 ucId 维度改为 passId 维度

---

## 四、第三轮：后端问题（面试官追加）

### Q7：防重设计

**面试官**：用户在前端连续点击两次"接入智能客服"，后端收到了两个相同的请求。你怎么防止同一个员工号被绑定两次？

**考察点**：

- **接口幂等性**：passId + 请求唯一标识（幂等键），重复请求直接返回已有结果
- **数据库约束**：`corp_agent_bind` 表加唯一索引 `(user_id, customer_service_id)`，DB 层面兜底
- **乐观锁**：`UPDATE ... WHERE status = 'UNBOUND'`，更新行数为 0 说明已被操作
- **分布式锁**：按 passId 粒度加锁，防止并发写入
- 推荐**多层防御**：前端防重复点击 + 后端幂等表 + 数据库约束兜底

---

### Q8：列表接口设计

**面试官**：`bindList` 接口新增按"已接入/未接入智能客服"Tab 筛选，还要分页并返回各维度数量。怎么设计？数据量大怎么保证性能？

**考察点**：

**接口设计**：
```
GET /bindList?status=ALL&pageNum=1&pageSize=20
```
- status 参数：ALL / BOUND / UNBOUND
- 额外返回 totalCount、boundCount、unboundCount 供 Tab 展示

**分页性能优化**：
- 常规 `LIMIT ... OFFSET` 在深分页时性能下降
- 优化方案：游标分页（`WHERE id > #{lastId} LIMIT #{size}`）
- 索引：`(status, id)` 复合索引，覆盖筛选 + 排序

**Count 优化**：
- 如果 count 查询慢，考虑缓存或异步统计

---

### Q9：事务边界设计

**面试官**：批量更换营销账号，一次勾选 10 个员工号。事务怎么设计——全部成功才提交，还是部分成功部分回滚？

**考察点**：

两种方案对比：

| 方案 | 机制 | 优点 | 缺点 |
|------|------|------|------|
| 一个大事务 | `@Transactional` 包裹 for 循环 | 数据完全一致 | 大事务耗时久，锁范围大 |
| 逐条独立提交 | `TransactionTemplate` 编程事务 | 失败不影响成功项 | 可能出现部分成功 |

**推荐方案**：**逐条独立提交**。10 个账号间无业务耦合，不需要因为一个失败回滚其他 9 个。

**前端交互**：后端返回批量处理结果（成功列表 + 失败列表 + 失败原因），前端分段展示。

```java
for (String userId : userIdList) {
    try {
        transactionTemplate.execute(status -> {
            // 单条绑定逻辑
            bindCustomerService(userId, csId);
            return null;
        });
        successList.add(userId);
    } catch (Exception e) {
        failList.add(new FailItem(userId, e.getMessage()));
    }
}
return Result.batch(successList, failList);
```

---

### Q10：旧接口兼容

**面试官**：授权接口入参从 `ucId` 改成 `encodePassId`，但旧调用方还传旧参数。怎么兼容？什么时候能下线旧逻辑？

**考察点**：

**方案一：适配器模式**
- 新接口实现新逻辑
- 旧接口保留但内部调用新逻辑 + 参数转换

**方案二：参数版本号**
```java
public Result bind(BindRequest request) {
    if (StringUtils.isNotBlank(request.getEncodePassId())) {
        return bindV2(request);  // 新逻辑
    } else {
        return bindV1(request);  // 旧逻辑兼容
    }
}
```

**下线策略**：
1. 监控旧接口调用量，确认零调用
2. 发公告 + 设置下线时间窗口（如 3 个月）
3. 写 `@Deprecated` 注解，日志打印调用方信息便于追踪
4. 到期下线旧逻辑

---

### Q11：状态机设计

**面试官**：员工号有多维状态——"未授权/已授权"、"未接入/已接入"、"生效中/豁免待生效"，且有依赖关系。后端怎么设计状态管理？

**考察点**：

**状态定义**：
```
UNAUTHORIZED → AUTHORIZED → BOUND（已接入）
                              ├── EFFECTIVE（已生效）
                              └── PENDING（豁免待生效）
```

**数据库层面兜底**（最简单的方案）：
```sql
UPDATE corp_agent_bind
SET status = 'BOUND'
WHERE user_id = ? AND status = 'AUTHORIZED'
```
利用 `WHERE` 条件 + 行锁天然保证状态不乱跳，更新行数为 0 则说明当前状态不合法。

**状态机模式**：
- 定义 State Transition Table（S → T 的合法映射）
- 每次更新校验状态流转是否合法
- 状态数少（4-5 种）→ if-else 够用
- 状态数多（>10 种）→ 引入状态机框架（如 Spring Statemachine）

---

### Q12：慢查询与索引

**面试官**：`bindList` 接口支持按 `status`、`source`、`effectiveTime` 多个筛选条件 + 排序 + 分页。怎么设计索引？

**考察点**：

**索引设计原则（MySQL 最左匹配）**：

```sql
-- 核心查询场景 1：按 status 筛选 + 分页
KEY idx_status_id (status, id)

-- 核心查询场景 2：按 status + 时间排序
KEY idx_status_time (status, effective_time, id)

-- 场景 3：按 source + status 筛选
KEY idx_source_status (source, status, id)
```

**注意事项**：
- `status` 区分度高（两个值），作为索引前缀效果好
- `source` 只有"企业号/高商侧"两种值，区分度低，单独放索引前缀效果有限
- **覆盖索引**：查询只需要部分字段时，覆盖索引避免回表
- 用 `EXPLAIN` 分析执行计划，根据实际查询调优

---

### Q13：代码复用设计

**面试官**：巧舱卡片和营销通卡片的授权逻辑高度相似。你是独立写两套还是做了复用？

**考察点**：

**先不做过度设计**：如果两个平台差异很小（当前只有入口不同，流程一致），用 `source` 字段 + if-else 就够。

**拆分时机**：当差异点增多到 3 个以上时，引入以下模式：

**策略模式**：
```java
// 策略接口
interface AuthorizationStrategy {
    void authorize(AuthorizeRequest request);
    StatusVO getStatus(String userId);
}

// 具体策略
@Component("qiaoCangStrategy")
class QiaoCangStrategy implements AuthorizationStrategy { ... }

@Component("yingXiaoTongStrategy")
class YingXiaoTongStrategy implements AuthorizationStrategy { ... }

// 工厂
class StrategyFactory {
    AuthorizationStrategy getStrategy(String source) {
        return applicationContext.getBean(source + "Strategy");
    }
}
```

**DB 统一**：共用一个 `corp_agent_bind` 表，用 `source` 字段区分平台来源。

**核心原则**：复用是手段，不是目的。先写简单清晰的代码，等真正出现差异点再抽。

---

## 五、附录：简历写法参考

### 版本一：全栈版（推荐）

> **智能客服授权体系迁移与统一管理 ｜ 全栈开发**
>
> 负责将智能客服授权与配置能力从巧舱平台迁移至企业号平台，实现客服管理的统一体验。后端重构了授权绑定逻辑，将授权方向从「UC 账号添加 Pass 账号」转为「Pass 账号绑定 UC 账号」，重新设计数据库表结构扩展 5 个新字段，引入分布式锁（Redis）避免并发写脏数据，配合 @Transactional 保证事务原子性。新增智能客服列表、绑定/解绑/更换客服等完整 API 链路。前端开发了客服启用指南引导流程、智能客服卡片四态展示、矩阵号客服管理半屏抽屉（支持按接入状态筛选、批量更换营销账号、客服接入/更换/解绑等操作），以及巧舱授权页面改造，覆盖企业号、巧舱、营销通三大入口。

### 版本二：后端架构版

> **智能客服授权体系迁移 ｜ 后端开发**
>
> 主导智能客服授权体系从巧舱平台到企业号平台的迁移改造。重新设计授权绑定链路，将原有「UC 账号管理 Pass 账号」模式重构为「Pass 账号绑定 UC 账号」，实现企业号维度的统一授权管理。针对并发授权场景引入基于 passId 粒度的分布式锁（Redis + UUID 标识 + 过期自动释放机制），有效防止重复授权脏数据。扩展 `corp_agent_bind` 表，新增客服 ID/名称、生效场景、生效时间、接入来源等字段。新增智能客服列表获取、绑定/更换/解绑智能客服、批量更换营销账号等后端接口，保障高并发场景下的数据一致性。

### 技术亮点关键词

| 维度 | 可写在简历上的关键词 |
|------|-------------------|
| 后端技术 | 分布式锁（Redis SET NX + Lua）、@Transactional 事务、防并发/防脏数据、数据库表扩展（DDL）、Restful API 设计、幂等性设计 |
| 前端技术 | 半屏抽屉、Tab 筛选、状态驱动 UI、状态联动、生效时间格式化 |
| 业务价值 | 巧舱→企业号迁移、统一客服授权入口、私信留联豁免、矩阵号管理 |
| 软素质 | 全栈开发、跨团队协作、三条业务线（企业号/巧舱/营销通）覆盖 |

---

> 生成时间：2026-07-16
> 用途：秋招面试准备 · 后端方向