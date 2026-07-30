⚙️ 从能跑到可上线：一个 Skill 的开发复盘——输入门控、图表脚本与平台适配的几个真实经验
很多 Skill 初版都能跑，但一到真实场景就容易出问题：输入缺了还继续生成、输出格式每次不一样、图表在某个平台不显示、报告正文被后续工具调用覆盖。后来我越来越觉得，做 Skill 不能只靠把 Prompt 写长，更像是在做一个轻量工程：有入口、有门控、有模板、有脚本、有兜底，也要有上线后的修复记录。
下面以一个面试评估类 Skill 的开发过程为例，整理一些比较通用的经验。

01｜先把 Skill 拆成工程结构 🧩
一个可维护的 Skill，最好不要只有一个 SKILL.md。主文件负责调度，参考文件负责模板，脚本负责确定性任务，CHANGELOG 记录真实踩坑。
interview-insight/
├── SKILL.md                    # 主执行流程、输入门控、平台适配规则
├── CHANGELOG.md                # 版本记录、问题根因、修复方案
├── references/
│   └── interview_template.md    # 评估模板、模块规则、动态维度
├── scripts/
│   └── radar_chart.py           # 雷达图生成脚本
└── mcp_server.py                # JD 门控、分析流程工具
[图片]
这里的思路很简单：SKILL.md 不承载所有细节，能沉淀成模板的放到 references，能确定性执行的交给 scripts，关键流程可以工具化。这样排查问题时，不用在一整段 Prompt 里反复找规则。

02｜输入门控：该拦的时候就别继续生成 🚧
很多输出不稳定，其实是因为输入不完整。以面试评估为例，如果没有 JD，模型也能生成一套评分维度，但这个标准很可能来自模型默认理解，不一定来自岗位要求。
所以我在 Skill 里加了 JD 强制确认门：
## JD 强制确认门（最高优先级）

收到面试材料后，必须先输出 JD 确认提示，结束本轮。
在用户回复之前，不得产生任何评估内容。

通过条件（满足其一即可）：
- 用户提供了 JD
- 材料中包含岗位信息
- 用户明确表示无 JD

[图片]
如果进一步工具化，可以把门控放到 MCP 流程里，不只靠模型“自觉遵守”。
def check_jd(has_jd: bool, contains_position_info: bool, user_confirmed_no_jd: bool) -> dict:
    passed = has_jd or contains_position_info or user_confirmed_no_jd
    if not passed:
        return {
            "passed": False,
            "message": "当前缺少岗位 JD 或岗位信息，请先补充后再生成评估报告。"
        }
    return {"passed": True, "message": "JD 门控已通过，可以进入正式分析。"}


def start_analysis(jd_check_result: dict) -> dict:
    if not jd_check_result.get("passed"):
        return {"started": False, "reason": "JD 门控未通过"}
    return {"started": True, "next_step": "start_interview_analysis"}
[图片]
check_jd → 通过 JD 门控 → start_analysis → 正式分析

03｜模板要稳定，但维度不能写死 📐
评估类 Skill 很容易写成固定维度，比如专业能力、沟通能力、学习能力、稳定性。固定维度确实稳定，但不同岗位关注点不同，全部套一张表会不够贴合业务。
我在模板里用的是折中方式：核心维度从 JD 抽取，通用维度固定追加。
JD / 岗位信息
  ↓
抽取岗位职责与任职要求
  ↓
生成 5–8 个评价维度
  ↓
固定追加：沟通表达与协作能力、动机稳定性与可用性
  ↓
采用 1–9 分制评分
[图片]
这样做的好处是：不同岗位能生成不同评价框架，但面试场景里的共性维度不会丢。对于多候选人对比，也能先用同一套维度做分析，再放到一张表里横向比较。
| 候选人 | 综合判断 | 主要优势 | 关键风险 | 建议动作 |
|---|---|---|---|---|
| A | 优先推进 | 专业背景更贴近岗位 | AI 应用深度需确认 | 二面重点追问 |
| B | 备选观察 | 工具经验较强 | 审计理解不足 | 补充案例测试 |

04｜图表不要完全交给模型，能脚本化就脚本化 📊
图表是 Skill 里最容易出平台问题的部分。雷达图尤其明显：有的平台不支持图表语法，有的平台能显示但中文标签容易挤在一起，还有的平台会吞掉配置。
更稳的做法是：模型负责生成维度和分数，Python 脚本负责生成图片。
# 单人雷达图
python3 scripts/radar_chart.py \
  --output output/<候选人>_radar.png \
  --name "<候选人>" \
  --dimensions '["维度1","维度2","维度3","维度4","维度5"]' \
  --scores '[88, 75, 82, 90, 70]'

[图片]
# 多人对比雷达图
python3 scripts/radar_chart.py \
  --output output/对比_radar.png \
  --dimensions '["维度1","维度2","维度3","维度4","维度5"]' \
  --compare '{"候选人A":[88,75,82,90,70],"候选人B":[78,85,76,80,88]}'
[图片]
脚本里比较实用的几个点：支持单人和多人模式，自动检测中文字体，支持评分文字映射。比如“强、较强、中、较弱、弱、待验证”可以转成数值，方便画图。
SCORE_MAP = {
    "强": 9,
    "较强": 8,
    "中": 6,
    "较弱": 4,
    "弱": 3,
    "待验证": 0
}

def parse_score(value):
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).strip()
    if text in SCORE_MAP:
        return SCORE_MAP[text]
    try:
        return float(text)
    except ValueError:
        return 0
中文字体也要单独处理，不然图里容易乱码。
CANDIDATE_FONTS = [
    "Microsoft YaHei",
    "SimHei",
    "PingFang SC",
    "Noto Sans CJK SC"
]
[图片]
这里有一个原则：图表是增强展示，不是主结果。即使雷达图生成失败，报告里也必须保留文字和表格，不能让一张图影响整份报告输出。
📌 配图建议：放 scripts/radar_chart.py 中三块截图：参数解析、中文字体检测、评分文字映射。再放一张最终雷达图效果图。

05｜平台适配：报告要原子化输出 🧯
这次最小众、也最值得记录的问题，是 dodo 和龙虾的展示差异。同一个 Skill 在龙虾里可以完整输出，但在 dodo 里出现过正文内容消失，只显示最后一条消息。
后来复盘根因，不是模型没生成，而是正文输出和工具调用交错，导致部分平台最终只保留最后一条消息。
修复方案写进了 v1.0.1：
## v1.0.1 修复：dodo 平台报告内容消失

根因：正文输出和工具调用交错，导致部分平台最终只显示最后一条消息。

修复方案 — 严格执行顺序：
1. 所有工具调用前置完成（雷达图生成、BOS上传、TodoWrite、memory）
2. 工具调用全部完成后，再开始输出正文报告
3. 报告整体作为一次完整输出（原子化输出）
4. 报告输出后直接结束本轮，不再追加任何工具调用
这次修复的重点不是继续改 Prompt，而是改执行顺序：先跑完工具，再集中输出报告，输出完就结束。
def run_skill(input_payload: dict) -> str:
    jd_check = check_jd(
        has_jd=input_payload.get("has_jd", False),
        contains_position_info=input_payload.get("contains_position_info", False),
        user_confirmed_no_jd=input_payload.get("user_confirmed_no_jd", False)
    )

    if not jd_check["passed"]:
        return jd_check["message"]

    analysis_result = start_analysis(jd_check)

    radar_path = None
    try:
        radar_path = generate_radar_chart(analysis_result)
    except Exception:
        radar_path = None

    final_report = render_markdown_report(
        analysis_result=analysis_result,
        radar_path=radar_path
    )

    return final_report
[图片]
工具调用前置 → 中间结果生成 → 正文报告一次性输出 → 结束本轮

06｜上线前别只测一个样例 ✅
Skill 上线前最好准备一个小测试矩阵，不要只用“完美输入”跑通一次。
测试类型
重点看什么
标准输入
是否能稳定输出完整报告
缺失输入
是否触发门控，而不是继续生成
长文本输入
是否截断或丢失重点
多对象输入
是否统一维度和评价口径
图表输入
雷达图是否正常生成，失败后是否兜底
多平台测试
dodo / 龙虾展示是否一致
[图片]
上线后也要继续看失败样例。很多问题只有真实使用才会暴露，比如平台消息流、图表渲染、用户输入不规范、报告过长等。修完之后最好写进 CHANGELOG.md，不然下次很容易重复踩坑。

07｜最后给一个检查清单
# Skill 工程化检查清单

## 结构
✅ 是否有 SKILL.md 作为主执行文件
✅ 是否有 references 沉淀模板和规则
✅ 是否有 scripts 处理图表等确定性任务
✅ 是否有 CHANGELOG 记录问题和修复

## 输入
✅ 是否设置关键输入门控
✅ 是否在材料不足时中断
✅ 是否避免证据不足时输出确定性结论

## 输出
✅ 是否有稳定的 Markdown 模板
✅ 是否控制表格字段和标题层级
✅ 是否保留依据、风险和人工确认项

## 工具
✅ 图表是否由脚本生成
✅ 是否处理中文字体、评分映射和多人对比
✅ 图表失败时是否保留主报告

## 平台
✅ 工具调用是否前置完成
✅ 正文报告是否一次性输出
✅ 输出后是否避免继续调用工具
✅ 是否测试 dodo / 龙虾等平台差异

收尾
这次开发后，我对 Skill 的理解有一点变化：Prompt 只是入口，真正决定稳定性的，是输入门控、执行顺序、模板约束、脚本兜底和平台适配。
一个能上线给别人用的 Skill，不只是“模型会说”，更重要的是：
输入可拦截
过程可复用
输出可预测
异常可兜底
平台可展示
很多问题一开始看起来像模型问题，最后有效的修复其实是工程问题。

本次引用的案例＋skill
伯乐 Interview Insight https://console.cloud.baidu-int.com/onetool/skills/6890
它现在主要能做这些事：
能力
说明
📝 面试分析
从 ASR / 面试记录中提取关键信息
🧭 JD 对齐
基于岗位要求动态生成能力维度
👤 候选人画像
输出优势、风险、匹配度
💬 面试官反馈
提取面试官态度和推进信号
🚦 推进建议
生成绿 / 黄 / 红 / 灰灯判断
📊 雷达图
自动生成能力可视化
🆚 多人对比
支持候选人横向比较
🔗 会议联动
可结合会议类 Skill 使用
[图片] 