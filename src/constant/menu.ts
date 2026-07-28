export const menuGroups = [
  {
    key: "home",
    label: "首页",
    items: [{ href: "/home", label: "首页概览" }],
  },
  {
    key: "assessmentManagement",
    label: "测评管理",
    items: [
      { href: "/assessmentManagement/moralEducation", label: "德育" },
      { href: "/assessmentManagement/intellectualEducation", label: "智育" },
      { href: "/assessmentManagement/sportsAestheticEducation", label: "体育、美育" },
      { href: "/assessmentManagement/laborEducation", label: "劳育" },
    ],
  },
  {
    key: "scoreManagement",
    label: "成绩管理",
    items: [
      { href: "/scoreManagement/recordsQuery", label: "申请记录查询" },
      { href: "/scoreManagement/auditedScore", label: "已审核成绩" },
    ],
  },
  {
    key: "comprehensiveAgent",
    label: "综测智能体",
    items: [
      { href: "/comprehensiveAgent/reportQuery", label: "查询DeepSeek报告" },
      { href: "/comprehensiveAgent/fillAssistant", label: "填报小助手" },
    ],
  },
] as const;
