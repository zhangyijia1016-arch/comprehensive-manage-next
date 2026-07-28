import { AssessmentPageConfig } from "@/types/assessment";
import { patentOptions, socialWorkOptions, sportLevelOptions, thesisLevelOptions } from "@/constant/assessmentData";

export const moralConfig: AssessmentPageConfig = {
  title: "德育申请表",
  actions: [{ label: "查看", modalKey: "thought" }],
  rows: [
    { title: "思想教育", criteria: "思想政治教育相关内容", maxPoints: 4, scoreChange: "参评学业奖学金基本要求" },
    { title: "日常表现", criteria: "日常学习生活表现", maxPoints: 6, scoreChange: "参评学业奖学金基本要求" },
    { title: "奖惩", criteria: "奖励与处分", maxPoints: 10, scoreChange: "参评学业奖学金基本要求" },
  ],
  modalSchemas: [
    {
      key: "thought",
      title: "思想教育记录",
      mode: "view",
      fields: [
        { type: "year", name: "year", label: "请选择学年", options: [] },
        { type: "chips", name: "records", label: "思想教育", items: ["班会参与", "主题教育", "志愿服务"] },
      ],
    },
    {
      key: "daily",
      title: "日常表现",
      mode: "view",
      fields: [
        { type: "year", name: "year", label: "请选择学年", options: [] },
        { type: "chips", name: "records", label: "日常表现", items: ["迟到", "缺勤", "宿舍卫生"] },
      ],
    },
    {
      key: "reward",
      title: "奖惩记录",
      mode: "view",
      fields: [
        { type: "year", name: "year", label: "请选择学年", options: [] },
        { type: "chips", name: "records", label: "奖惩内容", items: ["校级奖励", "院级奖励", "处分记录"] },
      ],
    },
  ],
};

export const intellectualConfig: AssessmentPageConfig = {
  title: "智育申请表",
  actions: [
    { label: "查看", modalKey: "view" },
    { label: "申请", modalKey: "apply", variant: "success" },
  ],
  rows: [
    { title: "论文", criteria: "学术论文成果", maxPoints: 36, scoreChange: "按论文等级计分" },
    { title: "专利", criteria: "专利成果", maxPoints: 6, scoreChange: "按专利级别计分" },
    { title: "学术科技竞赛", criteria: "竞赛获奖", maxPoints: 8, scoreChange: "按竞赛等级计分" },
    { title: "学术活动", criteria: "学术活动参与", maxPoints: 5, scoreChange: "按活动内容计分" },
    { title: "学术讲座", criteria: "学术讲座参与", maxPoints: 2, scoreChange: "按讲座次数计分" },
  ],
  modalSchemas: [
    {
      key: "view",
      title: "学习成绩查看",
      mode: "view",
      fields: [
        { type: "input", name: "score", label: "系统导出所有课程平均成绩", placeholder: "0" },
        { type: "input", name: "gpa", label: "自动折算学习成绩", placeholder: "0" },
      ],
    },
    {
      key: "apply",
      title: "智育申请",
      mode: "apply",
      fields: [
        { type: "year", name: "year", label: "学年", options: [] },
        { type: "input", name: "name", label: "名称", placeholder: "请输入名称" },
        { type: "select", name: "level", label: "级别", options: thesisLevelOptions, placeholder: "请选择级别" },
      ],
    },
    {
      key: "patent",
      title: "专利申请",
      mode: "apply",
      fields: [
        { type: "year", name: "year", label: "学年", options: [] },
        { type: "input", name: "name", label: "专利名称", placeholder: "请输入专利名称" },
        { type: "select", name: "level", label: "作者身份及专利级别", options: patentOptions, placeholder: "请选择专利级别" },
      ],
    },
    {
      key: "competition",
      title: "学术科技竞赛申请",
      mode: "apply",
      fields: [
        { type: "year", name: "year", label: "学年", options: [] },
        { type: "input", name: "name", label: "竞赛名称", placeholder: "请输入竞赛名称" },
        { type: "select", name: "level", label: "竞赛等级", options: sportLevelOptions, placeholder: "请选择竞赛等级" },
      ],
    },
    {
      key: "activity",
      title: "学术活动申请",
      mode: "apply",
      fields: [
        { type: "year", name: "year", label: "学年", options: [] },
        { type: "input", name: "name", label: "活动名称", placeholder: "请输入活动名称" },
        { type: "input", name: "score", label: "应加分数", placeholder: "请输入分数" },
      ],
    },
    {
      key: "lecture",
      title: "学术讲座查看",
      mode: "view",
      fields: [
        { type: "year", name: "year", label: "学年", options: [] },
        { type: "chips", name: "records", label: "讲座记录", items: ["讲座A", "讲座B", "讲座C"] },
      ],
    },
  ],
};

export const sportsConfig: AssessmentPageConfig = {
  title: "体育美育申请表",
  actions: [
    { label: "查看", modalKey: "view" },
    { label: "申请", modalKey: "apply", variant: "success" },
  ],
  rows: [
    { title: "文体活动", criteria: "文体赛事、活动参与", maxPoints: 8, scoreChange: "按等级计分" },
    { title: "其他", criteria: "其他体育美育项目", maxPoints: 4, scoreChange: "按实际情况计分" },
  ],
  modalSchemas: [
    {
      key: "view",
      title: "文体活动查看",
      mode: "view",
      fields: [
        { type: "year", name: "year", label: "请选择学年", options: [] },
        { type: "textarea", name: "text", label: "活动详情", placeholder: "活动详情" },
        { type: "files", name: "files", label: "证明材料下载", files: [{ name: "证明文件.pdf", url: "#" }] },
      ],
    },
    {
      key: "apply",
      title: "文体活动申请",
      mode: "apply",
      fields: [
        { type: "year", name: "year", label: "学年", options: [] },
        { type: "input", name: "name", label: "活动名称", placeholder: "请输入活动名称" },
        { type: "input", name: "score", label: "得分", placeholder: "请输入得分" },
      ],
    },
  ],
};

export const laborConfig: AssessmentPageConfig = {
  title: "劳育申请表",
  actions: [
    { label: "查看", modalKey: "view" },
    { label: "申请", modalKey: "apply", variant: "success" },
  ],
  rows: [
    { title: "社会工作", criteria: "社会工作相关表现", maxPoints: 5, scoreChange: "按职务计分" },
    { title: "社会实践", criteria: "社会实践与志愿服务", maxPoints: 5, scoreChange: "按类别计分" },
    { title: "两室文化建设", criteria: "宿舍和实验室建设", maxPoints: 5, scoreChange: "按项目计分" },
  ],
  modalSchemas: [
    {
      key: "view",
      title: "劳育记录查看",
      mode: "view",
      fields: [
        { type: "year", name: "year", label: "请选择学年", options: [] },
        { type: "chips", name: "records", label: "劳育记录", items: ["社会工作", "社会实践", "两室文化建设"] },
      ],
    },
    {
      key: "apply",
      title: "劳育申请",
      mode: "apply",
      fields: [
        { type: "year", name: "year", label: "学年", options: [] },
        { type: "input", name: "name", label: "名称", placeholder: "请输入名称" },
        { type: "select", name: "level", label: "等级", options: socialWorkOptions, placeholder: "请选择等级" },
      ],
    },
  ],
};
