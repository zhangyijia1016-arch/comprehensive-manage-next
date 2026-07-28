"use client";

import { BulbOutlined, SendOutlined, StopOutlined } from "@ant-design/icons";
import { Avatar, Button, Input, Tag, Typography, message } from "antd";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { streamFillAssistantAnswer, type ChatMessage } from "@/services/api/assistant";

const prompts = [
  "德育材料需要上传什么？",
  "论文成果应该填到哪个模块？",
  "申请被驳回后应该怎么修改？",
  "志愿服务时长怎么认定？",
];

const initialMessages: ChatMessage[] = [
  {
    role: "assistant",
    content: "你好，我是填报小助手。你可以直接问我综测填报规则、材料要求、模块归类和审核说明。",
  },
];

export default function FillAssistantPage() {
  const { Paragraph, Text, Title } = Typography;
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [messages]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const handleSend = async (presetQuestion?: string) => {
    const nextQuestion = (presetQuestion ?? question).trim();
    if (!nextQuestion || sending) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const currentHistory = [...messages];
    setMessages([
      ...currentHistory,
      { role: "user", content: nextQuestion },
      { role: "assistant", content: "▍" },
    ]);
    setQuestion("");
    setSending(true);
    setStreaming(true);

    try {
      await streamFillAssistantAnswer({
        question: nextQuestion,
        history: currentHistory,
        signal: controller.signal,
        onChunk: (chunk) => {
          setMessages((prev) => {
            const clone = [...prev];
            const lastIndex = clone.length - 1;
            const last = clone[lastIndex];
            if (!last || last.role !== "assistant") return prev;
            clone[lastIndex] = {
              ...last,
              content: last.content === "▍" ? chunk : `${last.content.replace(/▍$/, "")}${chunk}`,
            };
            return clone;
          });
        },
      });

      setMessages((prev) =>
        prev.map((item, index) =>
          index === prev.length - 1 && item.role === "assistant"
            ? { ...item, content: item.content.replace(/▍$/, "") || "暂无返回内容" }
            : item
        )
      );
    } catch (error) {
      if ((error as { name?: string })?.name !== "AbortError") {
        message.error("流式输出失败，请稍后重试");
        setMessages((prev) => prev.slice(0, -1));
      }
    } finally {
      setSending(false);
      setStreaming(false);
      abortRef.current = null;
    }
  };

  return (
    <div className="relative flex h-[calc(100vh-110px)] flex-col overflow-hidden">
      <div className="flex-none border-b border-slate-200/80 px-8 py-6">
        <Title level={3} className="!mb-2">
          填报小助手
        </Title>
        <Text type="secondary">围绕综测填报规则、材料准备和模块归类进行智能问答。</Text>
        <div className="mt-4 flex flex-wrap gap-2">
          {prompts.map((item) => (
            <Tag key={item} color="blue" className="cursor-pointer rounded-full px-3 py-1" onClick={() => void handleSend(item)}>
              {item}
            </Tag>
          ))}
        </div>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 pb-[200px] pt-6">
        <div className="flex min-h-full flex-col justify-end gap-4">
          {messages.map((item, index) => (
            <div key={`${item.role}-${index}`} className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`flex max-w-[78%] gap-3 ${item.role === "user" ? "flex-row-reverse" : ""}`}>
                <Avatar
                  icon={item.role === "assistant" ? <BulbOutlined /> : undefined}
                  className={`mt-1 shrink-0 ${item.role === "assistant" ? "bg-sky-500" : "bg-slate-500"}`}
                >
                  {item.role === "user" ? "你" : null}
                </Avatar>

                <div
                  className={`rounded-3xl px-5 py-4 shadow-sm ${
                    item.role === "assistant"
                      ? "bg-white text-slate-700 shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
                      : "bg-gradient-to-r from-[#1677ff] to-[#3b8cff] text-white shadow-[0_10px_28px_rgba(22,119,255,0.18)]"
                  }`}
                >
                  <div className="mb-1 text-xs font-semibold opacity-80">
                    {item.role === "assistant" ? "填报小助手" : "我"}
                  </div>
                  <Paragraph className={`!mb-0 whitespace-pre-wrap !text-inherit ${item.role === "user" ? "!text-white" : ""}`}>
                    {item.content}
                  </Paragraph>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 px-6 py-4 bg-white">
        <div className="mx-auto w-full rounded-[28px] border border-slate-200 bg-white p-3">
          <Input.TextArea
            autoSize={{ minRows: 3, maxRows: 3 }}
            placeholder="请输入你在综测填报过程中遇到的问题"
            variant="borderless"
            className="text-sm"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            style={{ padding: 0, resize: "none" }}
          />

          <div className="mt-2 flex items-center justify-end gap-2">
            {streaming ? (
              <Button icon={<StopOutlined />} onClick={() => abortRef.current?.abort()}>
                停止
              </Button>
            ) : null}
            <Button
              type="primary"
              icon={<SendOutlined />}
              className="h-8 rounded-full px-4"
              loading={sending}
              onClick={() => void handleSend()}
            >
              发送
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
