export type EventRegistrationItem = {
  id: number;
  name: string;
  time: string;
  status: "可报名" | "已满";
  quota: number;
};

export type ParticipatedActivityItem = {
  id: number;
  name: string;
  time: string;
  status: "已参加";
  score: number;
};

export type PendingInputItem = {
  id: number;
  name: string;
  applicant: string;
  status: "待录入";
  percent: number;
};

const eventRegistrationMock: EventRegistrationItem[] = [
  { id: 1, name: "校园志愿服务", time: "2026-09-12", status: "可报名", quota: 30 },
  { id: 2, name: "学术讲座", time: "2026-09-20", status: "已满", quota: 0 },
  { id: 3, name: "体育竞赛", time: "2026-10-08", status: "可报名", quota: 12 },
];

const participatedMock: ParticipatedActivityItem[] = [
  { id: 1, name: "校园志愿服务", time: "2026-09-12", status: "已参加", score: 2 },
  { id: 2, name: "学术讲座", time: "2026-09-20", status: "已参加", score: 1 },
  { id: 3, name: "体育竞赛", time: "2026-10-08", status: "已参加", score: 3 },
];

const pendingInputMock: PendingInputItem[] = [
  { id: 1, name: "志愿服务报名", applicant: "2026级张三", status: "待录入", percent: 30 },
  { id: 2, name: "学术讲座报名", applicant: "2026级李四", status: "待录入", percent: 55 },
  { id: 3, name: "体育竞赛报名", applicant: "2026级王五", status: "待录入", percent: 80 },
];

export async function getEventRegistrationListApi() {
  return Promise.resolve(eventRegistrationMock);
}

export async function registerEventApi(_eventId: number) {
  return Promise.resolve({ code: 200, msg: "报名成功" });
}

export async function getParticipatedActivitiesApi() {
  return Promise.resolve(participatedMock);
}

export async function getPendingInputListApi() {
  return Promise.resolve(pendingInputMock);
}
