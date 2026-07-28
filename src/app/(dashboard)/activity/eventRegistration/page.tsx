"use client";

import { CalendarOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Card, Col, DatePicker, Empty, Input, Row, Space, Table, Tag, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import { getEventRegistrationListApi, registerEventApi, type EventRegistrationItem } from "@/services/api/activity";

export default function EventRegistrationPage() {
  const { Title, Paragraph } = Typography;
  const [keyword, setKeyword] = useState("");
  const [rows, setRows] = useState<EventRegistrationItem[]>([]);

  useEffect(() => {
    void getEventRegistrationListApi().then(setRows);
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
      render: (value: string) => <Tag color={value === "可报名" ? "green" : "red"}>{value}</Tag>,
    },
    { title: "剩余名额", dataIndex: "quota", key: "quota" },
    {
      title: "操作",
      key: "action",
      render: (_: unknown, row: EventRegistrationItem) => (
        <Button type="primary" onClick={() => void registerEventApi(row.id)}>
          报名
        </Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ display: "flex" }}>
      <Card>
        <Title level={3} style={{ margin: 0 }}>
          活动报名
        </Title>
        <Paragraph type="secondary" style={{ margin: "8px 0 0" }}>
          这里后续可接入活动列表、报名接口和名额校验。
        </Paragraph>
      </Card>

      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Card>
            <Space>
              <CalendarOutlined />
              <span>可报名活动</span>
            </Space>
            <div style={{ marginTop: 12, fontSize: 32, fontWeight: 600 }}>12</div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Space>
              <CalendarOutlined />
              <span>已报名活动</span>
            </Space>
            <div style={{ marginTop: 12, fontSize: 32, fontWeight: 600 }}>4</div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Space>
              <CalendarOutlined />
              <span>待审核报名</span>
            </Space>
            <div style={{ marginTop: 12, fontSize: 32, fontWeight: 600 }}>2</div>
          </Card>
        </Col>
      </Row>

      <Card>
        <Space style={{ width: "100%", justifyContent: "space-between" }} wrap>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索活动名称"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 280 }}
          />
          <DatePicker placeholder="筛选日期" />
        </Space>

        <div style={{ marginTop: 16 }}>
          {filteredRows.length ? <Table rowKey="id" columns={columns} dataSource={filteredRows} pagination={false} /> : <Empty />}
        </div>
      </Card>
    </Space>
  );
}
