const currentYear = new Date().getFullYear();

export const yearOptions = [
  { label: `${currentYear}-${currentYear + 1}`, value: `${currentYear}-${currentYear + 1}` },
  { label: `${currentYear - 1}-${currentYear}`, value: `${currentYear - 1}-${currentYear}` },
  { label: `${currentYear - 2}-${currentYear - 1}`, value: `${currentYear - 2}-${currentYear - 1}` },
];

export const thesisLevelOptions = [
  { label: "第一档 中科院一区论文", value: "36" },
  { label: "第二档 SCI检索Q1区", value: "24" },
  { label: "第三档 SCI检索Q2区+北大核心前10%+本学科顶会", value: "12" },
  { label: "第四档 SCI检索Q3区", value: "6" },
  { label: "第五档 SCI检索Q4区+EI检索期刊+北大核心前20%", value: "5" },
  { label: "第六档 EI会议+北大核心期刊前30%", value: "3" },
  { label: "第七档 北大核心前50%", value: "2" },
];

export const patentOptions = [
  {
    label: "发明专利",
    value: "invention",
  },
  {
    label: "实用新型专利",
    value: "utility",
  },
];

export const sportLevelOptions = [
  { label: "个人 / 省部级及以上 / 第一名", value: "8" },
  { label: "个人 / 省部级及以上 / 第二名", value: "6" },
  { label: "个人 / 省部级及以上 / 第三名", value: "4" },
  { label: "个人 / 省部级及以上 / 第四名", value: "2" },
];

export const socialWorkOptions = [
  { label: "校级研究生组织主席团、主任", value: "5" },
  { label: "带班兼职辅导员", value: "5" },
  { label: "校级研究生组织部门负责人", value: "4" },
  { label: "校级研究生组织干事", value: "3" },
];
