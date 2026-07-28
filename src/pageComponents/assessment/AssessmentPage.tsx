"use client";

import { CheckCircleOutlined, EyeOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { AssessmentPageConfig, FieldSchema, ModalSchema } from "@/types/assessment";
import { yearOptions } from "@/constant/assessmentData";

type Props = {
  config: AssessmentPageConfig;
};

type FormValues = Record<string, string>;

export function AssessmentPage({ config }: Props) {
  const { Title } = Typography;
  const [activeModal, setActiveModal] = useState<ModalSchema | null>(null);
  const [year, setYear] = useState(yearOptions[0].value);
  const [formValues, setFormValues] = useState<FormValues>({});

  const openModal = (schema: ModalSchema) => {
    setActiveModal(schema);
    setFormValues(
      schema.fields.reduce<FormValues>((acc, field) => {
        if (field.type === "input" || field.type === "select" || field.type === "textarea" || field.type === "year") {
          acc[field.name] = "";
        }
        return acc;
      }, {})
    );
  };

  const viewFields = useMemo(() => activeModal?.fields ?? [], [activeModal]);
  const columns = [
    { title: "指标", dataIndex: "title", key: "title", width: 160 },
    { title: "评分标准", dataIndex: "criteria", key: "criteria" },
    { title: "最高分值", dataIndex: "maxPoints", key: "maxPoints", width: 120 },
    {
      title: "基本要求",
      dataIndex: "scoreChange",
      key: "scoreChange",
      width: 240,
      render: (value: string) => value || "-",
    },
    {
      title: "操作",
      key: "actions",
      width: 220,
      render: () => (
        <Space wrap>
          {config.actions.map((action) => {
            const schema = config.modalSchemas.find((item) => item.key === action.modalKey);
            if (!schema) return null;
            return (
              <Button
                key={action.label + action.modalKey}
                type={action.variant === "success" ? "primary" : "default"}
                danger={action.variant === "danger"}
                icon={action.label.includes("查看") ? <EyeOutlined /> : <CheckCircleOutlined />}
                onClick={() => openModal(schema)}
              >
                {action.label}
              </Button>
            );
          })}
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={18} className="flex">
      <Card>
        <Space className="w-full justify-between" wrap>
          <div>
            <Title level={3} className="!mb-0">
              {config.title}
            </Title>
          </div>
        </Space>
      </Card>

      <Card classNames={{ body: "!p-0" }}>
        <Table rowKey="title" columns={columns} dataSource={config.rows} pagination={false} />
      </Card>

      <Modal
        open={Boolean(activeModal)}
        title={activeModal?.title}
        onCancel={() => setActiveModal(null)}
        onOk={() => setActiveModal(null)}
        width={860}
        destroyOnClose
      >
        <Form layout="vertical">
          <Space direction="vertical" size={12} className="mt-4 flex">
            {viewFields.map((field) => (
              <AssessmentField key={field.type + field.name} field={field} formValues={formValues} setFormValues={setFormValues} />
            ))}
          </Space>
        </Form>
      </Modal>
    </Space>
  );
}

function AssessmentField({
  field,
  formValues,
  setFormValues,
}: {
  field: FieldSchema;
  formValues: FormValues;
  setFormValues: Dispatch<SetStateAction<FormValues>>;
}) {
  if (field.type === "chips") {
    return (
      <div>
        <Typography.Text strong>{field.label}</Typography.Text>
        <div className="mt-2 flex flex-wrap gap-2">
          {field.items.map((item) => (
            <Tag key={item}>{item}</Tag>
          ))}
        </div>
      </div>
    );
  }

  if (field.type === "files") {
    return (
      <div>
        <Typography.Text strong>{field.label}</Typography.Text>
        <Space direction="vertical" className="mt-2 flex">
          {field.files.map((file) => (
            <a key={file.name} href={file.url}>
              {file.name}
            </a>
          ))}
        </Space>
      </div>
    );
  }

  if (field.type === "year") {
    return (
      <Form.Item label={field.label} className="!mb-0">
        <Select
          value={formValues[field.name] ?? ""}
          onChange={(value) => setFormValues((prev) => ({ ...prev, [field.name]: value }))}
          placeholder="请选择学年"
          options={yearOptions.map((option) => ({ label: option.label, value: option.value }))}
        />
      </Form.Item>
    );
  }

  if (field.type === "textarea") {
    return (
      <Form.Item label={field.label} className="!mb-0">
        <Input.TextArea
          rows={5}
          placeholder={field.placeholder}
          value={formValues[field.name] ?? ""}
          onChange={(e) => setFormValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
        />
      </Form.Item>
    );
  }

  return (
    <Form.Item label={field.label} className="!mb-0">
      {field.type === "input" ? (
        field.name.toLowerCase().includes("score") || field.name.toLowerCase().includes("mark") ? (
          <InputNumber
            className="w-full"
            placeholder={field.placeholder}
            value={formValues[field.name] ? Number(formValues[field.name]) : undefined}
            onChange={(value) => setFormValues((prev) => ({ ...prev, [field.name]: String(value ?? "") }))}
          />
        ) : (
          <Input
            placeholder={field.placeholder}
            value={formValues[field.name] ?? ""}
            onChange={(e) => setFormValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
          />
        )
      ) : (
        <Select
          value={formValues[field.name] ?? ""}
          onChange={(value) => setFormValues((prev) => ({ ...prev, [field.name]: value }))}
          placeholder={field.placeholder ?? "请选择"}
          options={field.options.map((option) => ({ label: option.label, value: option.value }))}
        />
      )}
    </Form.Item>
  );
}
