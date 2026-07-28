"use client";

import { CheckCircleOutlined, DashboardOutlined, FileDoneOutlined } from "@ant-design/icons";
import { Button, Card, Col, Progress, Row, Select, Skeleton, Space, Statistic, Typography } from "antd";
import { useEffect, useState } from "react";
import { years } from "@/constant/years";
import { verifiedScoreApi } from "@/services/api/student";

type AuditedItem = {
  label: string;
  mark: number;
  text?: string;
};

type AuditedGroup = {
  title: string;
  total: number;
  items: AuditedItem[];
};

export default function AuditedScorePage() {
  const { Title, Paragraph, Text } = Typography;
  const [selectedYear, setSelectedYear] = useState(years[0].value);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<AuditedGroup[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await verifiedScoreApi(selectedYear);
        const data = res?.data ?? [];
        setGroups(
          Array.isArray(data)
            ? data.map((group: any, index: number) => ({
                title: group?.title ?? ["智育成绩", "体育美育成绩", "劳育成绩"][index] ?? `分组${index + 1}`,
                total: group?.total ?? 0,
                items: Array.isArray(group?.children)
                  ? group.children.map((item: any, itemIndex: number) => ({
                      label: item?.label ?? `项目${itemIndex + 1}`,
                      mark: Number(item?.mark ?? 0),
                      text: item?.text ?? "",
                    }))
                  : [],
              }))
            : []
        );
      } catch {
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [selectedYear]);

  const fallbackGroups: AuditedGroup[] = [
    {
      title: "智育成绩",
      total: 0,
      items: [
        { label: "论文", mark: 0 },
        { label: "专利", mark: 0 },
        { label: "学术科技竞赛", mark: 0 },
        { label: "学术活动", mark: 0 },
        { label: "学术讲座", mark: 0 },
      ],
    },
    {
      title: "体育美育成绩",
      total: 0,
      items: [
        { label: "文体活动", mark: 0 },
        { label: "其他", mark: 0 },
      ],
    },
    {
      title: "劳育成绩",
      total: 0,
      items: [
        { label: "社会工作", mark: 0 },
        { label: "社会实践", mark: 0 },
        { label: "两室文化建设", mark: 0 },
      ],
    },
  ];

  const viewGroups = groups.length ? groups : fallbackGroups;

  return (
    <Space direction="vertical" size={16} style={{ display: "flex" }}>
      <Card>
        <Space style={{ width: "100%", justifyContent: "space-between" }} wrap>
          <div>
            {loading ? (
              <Skeleton active title={{ width: 180 }} paragraph={{ rows: 1, width: "70%" }} />
            ) : (
              <>
                <Title level={3} style={{ margin: 0 }}>
                  已审核成绩
                </Title>
                <Paragraph type="secondary" style={{ margin: "8px 0 0" }}>
                  按学年查看已审核成绩汇总
                </Paragraph>
              </>
            )}
          </div>
          {loading ? (
            <Skeleton.Input active style={{ width: 180, height: 32 }} />
          ) : (
            <Select
              style={{ width: 180 }}
              value={selectedYear}
              onChange={setSelectedYear}
              options={years.map((item) => ({ label: item.label, value: item.value }))}
            />
          )}
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        {(loading ? fallbackGroups : viewGroups).map((group, index) => (
          <Col xs={24} xl={8} key={group.title}>
            <Card
              title={group.title}
              extra={<Text type="secondary">总分 {group.total}</Text>}
              styles={{ header: { borderBottom: "none" } }}
              actions={[
                <Statistic key="count" title="项目数" value={group.items.length} prefix={<DashboardOutlined />} />,
              ]}
            >
              <Space direction="vertical" style={{ display: "flex" }} size={12}>
                {loading ? (
                  <Skeleton active paragraph={{ rows: 4 }} />
                ) : (
                  <>
                    {group.items.map((item) => (
                      <Card key={item.label} size="small" styles={{ body: { padding: "12px 14px" } }}>
                        <Space style={{ width: "100%", justifyContent: "space-between" }}>
                          <Text>{item.label}</Text>
                          <Text strong>+{item.mark}</Text>
                        </Space>
                      </Card>
                    ))}
                    <Progress percent={Math.min(group.total * 10, 100)} showInfo={false} />
                  </>
                )}
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Card>
        {loading ? (
          <Skeleton active title={{ width: 120 }} paragraph={{ rows: 2 }} />
        ) : (
          <Space style={{ width: "100%", justifyContent: "space-between" }} wrap>
            <div>
              <Title level={4} style={{ margin: 0 }}>
                操作
              </Title>
              <Paragraph type="secondary" style={{ margin: "8px 0 0" }}>
                提交已审核成绩和查看最终成绩后续可在这里接回真实接口。
              </Paragraph>
            </div>
            <Space>
              <Button icon={<FileDoneOutlined />}>查看最终成绩</Button>
              <Button type="primary" icon={<CheckCircleOutlined />}>
                提交已审核成绩
              </Button>
            </Space>
          </Space>
        )}
      </Card>
    </Space>
  );
}
