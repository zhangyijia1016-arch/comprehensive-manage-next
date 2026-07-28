"use client";

import { BulbOutlined, FundOutlined, TagsOutlined } from "@ant-design/icons";
import { Card, Col, Empty, Row, Skeleton, Space, Statistic, Tag, Typography } from "antd";
import { useEffect, useState } from "react";
import { getUserReportApi } from "@/services/api/report";

type ReportState = {
  score: { max: number; min: number; std_dev: number };
  analysis: string[];
  keyWords: string[];
  suggestions: string[];
};

export default function ReportQueryPage() {
  const { Title, Paragraph, Text } = Typography;
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportState>({
    score: { max: 0, min: 0, std_dev: 0 },
    analysis: [],
    keyWords: [],
    suggestions: [],
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getUserReportApi();
        setReport({
          score: {
            max: res?.data?.personal_analysis?.score_distribution?.max ?? 0,
            min: res?.data?.personal_analysis?.score_distribution?.min ?? 0,
            std_dev: res?.data?.personal_analysis?.score_distribution?.std_dev ?? 0,
          },
          analysis: [
            res?.data?.comparative_analysis?.category_contrast,
            res?.data?.comparative_analysis?.score_deviation,
            res?.data?.comparative_analysis?.trend_comparison,
          ].filter(Boolean),
          keyWords: res?.data?.key_trends ?? [],
          suggestions: res?.data?.improvement_suggestions ?? [],
        });
      } catch {
        setReport((prev) => prev);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <Space direction="vertical" size={16} style={{ display: "flex" }}>
      <Card>
        {loading ? (
          <Skeleton active title={{ width: 220 }} paragraph={{ rows: 1, width: "75%" }} />
        ) : (
          <>
            <Title level={3} style={{ margin: 0 }}>
              查询 DeepSeek 报告
            </Title>
            <Paragraph type="secondary" style={{ margin: "8px 0 0" }}>
              查看当前用户的智能分析、关键词与建议。
            </Paragraph>
          </>
        )}
      </Card>

      <Row gutter={[16, 16]}>
        {[
          { title: "智育发展", color: "#1677ff" },
          { title: "体育美育发展", color: "#13c2c2" },
          { title: "劳育发展", color: "#fa8c16" },
        ].map((item) => (
          <Col xs={24} xl={8} key={item.title}>
            <Card title={item.title}>
              {loading ? (
                <Skeleton active paragraph={{ rows: 3 }} />
              ) : (
                <Space direction="vertical" style={{ display: "flex" }}>
                  <Statistic title="最高分" value={report.score.max} valueStyle={{ color: item.color }} />
                  <Statistic title="最低分" value={report.score.min} valueStyle={{ color: item.color }} />
                  <Statistic title="标准差" value={report.score.std_dev} valueStyle={{ color: item.color }} />
                </Space>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card title={<Space><FundOutlined />分析</Space>}>
            {loading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : report.analysis.length ? (
              <Space direction="vertical" style={{ display: "flex" }}>
                {report.analysis.map((item) => (
                  <Paragraph key={item} style={{ marginBottom: 0 }}>
                    {item}
                  </Paragraph>
                ))}
              </Space>
            ) : (
              <Empty description="暂无分析数据" />
            )}
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Space direction="vertical" style={{ display: "flex" }} size={16}>
            <Card title={<Space><TagsOutlined />关键词</Space>}>
              {loading ? (
                <Skeleton active paragraph={{ rows: 2 }} />
              ) : (
                <Space wrap>
                  {(report.keyWords.length ? report.keyWords : ["暂无数据"]).map((item) => (
                    <Tag key={item} color="blue">
                      {item}
                    </Tag>
                  ))}
                </Space>
              )}
            </Card>
            <Card title={<Space><BulbOutlined />建议</Space>}>
              {loading ? (
                <Skeleton active paragraph={{ rows: 3 }} />
              ) : (
                <Space direction="vertical" style={{ display: "flex" }}>
                  {(report.suggestions.length ? report.suggestions : ["暂无数据"]).map((item) => (
                    <Text key={item}>{item}</Text>
                  ))}
                </Space>
              )}
            </Card>
          </Space>
        </Col>
      </Row>
    </Space>
  );
}
