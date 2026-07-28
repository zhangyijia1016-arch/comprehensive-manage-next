"use client";

import { DeleteOutlined, EditOutlined, ExclamationCircleOutlined, EyeOutlined } from "@ant-design/icons";
import { Button, Card, Modal, Select, Space, Table, Tabs, Tag, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import { years } from "@/constant/years";
import { getRecordMockData, type RecordItem } from "@/services/api/records";

type TabKey = "intellectual" | "sportsAesthetic" | "labor";

const tabs: { key: TabKey; label: string }[] = [
  { key: "intellectual", label: "智育" },
  { key: "sportsAesthetic", label: "体育美育" },
  { key: "labor", label: "劳育" },
];

export default function RecordsQueryPage() {
  const { Title, Paragraph, Text } = Typography;
  const [selectedYear, setSelectedYear] = useState(years[0].value);
  const [activeTab, setActiveTab] = useState<TabKey>("intellectual");
  const [rows, setRows] = useState<RecordItem[]>([]);
  const [reason, setReason] = useState("");
  const [reasonOpen, setReasonOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<RecordItem | null>(null);

  useEffect(() => {
    void getRecordMockData().then(setRows);
  }, [selectedYear, activeTab]);

  const filteredRows = useMemo(() => {
    return rows.filter((item) => {
      if (activeTab === "intellectual") return ["论文", "专利", "学术活动", "学术科技竞赛"].some((keyword) => item.applicationContent.includes(keyword));
      if (activeTab === "sportsAesthetic") return item.applicationContent.includes("文体");
      return item.applicationContent.includes("劳");
    });
  }, [activeTab, rows]);

  const columns = [
    { title: "序号", dataIndex: "number", key: "number", width: 80 },
    { title: "申请内容", dataIndex: "applicationContent", key: "applicationContent", width: 140 },
    { title: "分数", dataIndex: "mark", key: "mark", width: 80 },
    { title: "申请说明", dataIndex: "text", key: "text" },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (value: string) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: "操作",
      key: "actions",
      width: 220,
      render: (_: unknown, row: RecordItem) => (
        <Space wrap>
          <Button icon={<EditOutlined />}>修改</Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => openDelete(row)}>
            删除
          </Button>
          {row.reason ? (
            <Button icon={<EyeOutlined />} onClick={() => openReason(row)}>
              驳回理由
            </Button>
          ) : null}
        </Space>
      ),
    },
  ];

  const openReason = (row: RecordItem) => {
    setReason(row.reason || "暂无驳回理由");
    setReasonOpen(true);
  };

  const openDelete = (row: RecordItem) => {
    setSelectedRow(row);
    setDeleteOpen(true);
  };

  return (
    <Space direction="vertical" size={16} className="flex">
      <div className="flex justify-end">
        <Select
            className="w-[180px]"
            value={selectedYear}
            onChange={setSelectedYear}
            options={years.map((item) => ({ label: item.label, value: item.value }))}
          />
      </div>

      <Card classNames={{ body: "!p-0" }}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as TabKey)}
          items={tabs.map((tab) => ({ key: tab.key, label: tab.label }))}
          className="px-4 pt-4"
        />
        <div className="p-5">
          <Table rowKey="id" columns={columns} dataSource={filteredRows} pagination={{ pageSize: 10 }} />
        </div>
      </Card>

      <Modal open={reasonOpen} title="驳回理由" footer={null} onCancel={() => setReasonOpen(false)}>
        <Space direction="vertical" size={12} className="flex">
          <Text>{reason}</Text>
          <Button type="primary" onClick={() => setReasonOpen(false)}>
            关闭
          </Button>
        </Space>
      </Modal>

      <Modal
        open={deleteOpen}
        title="是否删除此条申请"
        okText="确定"
        cancelText="取消"
        onCancel={() => setDeleteOpen(false)}
        onOk={() => setDeleteOpen(false)}
      >
        <Space>
          <ExclamationCircleOutlined className="text-[#faad14]" />
          <Text>{selectedRow ? `确认删除 ${selectedRow.applicationContent} 这条记录？` : "确认删除这条记录？"}</Text>
        </Space>
      </Modal>
    </Space>
  );
}
