"use client";

import { CheckCircleOutlined, SearchOutlined } from "@ant-design/icons";
import { Card, Input, Space, Table, Tag, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import { getParticipatedActivitiesApi, type ParticipatedActivityItem } from "@/services/api/activity";

export default function ParticipatedActivitiesPage() {
  const { Title, Paragraph } = Typography;
  const [keyword, setKeyword] = useState("");
  const [rows, setRows] = useState<ParticipatedActivityItem[]>([]);

  useEffect(() => {
    void getParticipatedActivitiesApi().then(setRows);
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((item) => item.name.includes(keyword));
  }, [keyword, rows]);

  const columns = [
    { title: "活动名称", dataIndex: "name", key: "name" },
    { title: "活动时间", dataIndex: "time", key: "time" },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (value: string) => <Tag icon={<CheckCircleOutlined />} color="success">{value}</Tag>,
    },
    { title: "计入分数", dataIndex: "score", key: "score" },
  ];

  return (
    <Space direction="vertical" size={16} style={{ display: "flex" }}>
      <Card>
        <Title level={3} style={{ margin: 0 }}>
          已参加的活动
        </Title>
        <Paragraph type="secondary" style={{ margin: "8px 0 0" }}>
          展示学生已经参加并确认的活动记录。
        </Paragraph>
      </Card>

      <Card>
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="搜索活动名称"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ width: 280 }}
        />
        <div style={{ marginTop: 16 }}>
          <Table rowKey="id" columns={columns} dataSource={filteredRows} pagination={false} />
        </div>
      </Card>
    </Space>
  );
}
