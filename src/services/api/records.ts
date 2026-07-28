export type RecordItem = {
  id: number;
  number: number;
  applicationContent: string;
  mark: number;
  text: string;
  status: string;
  reason?: string;
  file?: { name: string; url: string }[];
};

export async function getRecordMockData() {
  const base: RecordItem[] = [
    {
      id: 1,
      number: 1,
      applicationContent: "论文",
      mark: 36,
      text: "第一档 中科院一区论文",
      status: "班级已审核",
      file: [{ name: "paper.pdf", url: "#" }],
    },
    {
      id: 2,
      number: 2,
      applicationContent: "专利",
      mark: 6,
      text: "获得国家实用新型专利授权",
      status: "待审核",
      reason: "材料不完整",
    },
    {
      id: 3,
      number: 3,
      applicationContent: "学术活动",
      mark: 5,
      text: "学术活动申请",
      status: "已驳回",
      reason: "证明材料不清晰",
    },
  ];

  return Promise.resolve(base);
}
