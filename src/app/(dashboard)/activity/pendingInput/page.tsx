"use client";

import { ExclamationCircleOutlined, SearchOutlined } from "@ant-design/icons";
import { Card, Input, Progress, Space, Table, Tag, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import { getPendingInputListApi, type PendingInputItem } from "@/services/api/activity";

export default function PendingInputPage() {
  const { Title, Paragraph } = Typography;
  const [keyword, setKeyword] = useState("");
  const [rows, setRows] = useState<PendingInputItem[]>([]);

  useEffect(() => {
    void getPendingInputListApi().then(setRows);
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((item) => item.name.includes(keyword) || item.applicant.includes(keyword));
  }, [keyword, rows]);

  const columns = [
    { title: "活动名称", dataIndex: "name", key: "name" },
    { title: "申请人", dataIndex: "applicant", key: "applicant" },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (value: string) => <Tag icon={<ExclamationCircleOutlined />} color="processing">{value}</Tag>,
    },
    {
      title: "进度",
      dataIndex: "percent",
      key: "percent",
      render: (value: number) => <Progress percent={value} size="small" />,
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ display: "flex" }}>
      <Card>
        <Title level={3} style={{ margin: 0 }}>
          待录入情况
        </Title>
        <Paragraph type="secondary" style={{ margin: "8px 0 0" }}>
          用于查看待录入活动和填写进度。
        </Paragraph>
      </Card>

      <Card>
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="搜索活动或申请人"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ width: 320 }}
        />
        <div style={{ marginTop: 16 }}>
          <Table rowKey="id" columns={columns} dataSource={filteredRows} pagination={false} />
        </div>
      </Card>
    </Space>
  );
}
