export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type StreamAssistantOptions = {
  question: string;
  history?: ChatMessage[];
  onChunk?: (chunk: string) => void;
  signal?: AbortSignal;
};

const fallbackAnswers: Array<{ match: RegExp; answer: string }> = [
  {
    match: /德育|思想|志愿/,
    answer:
      "德育材料通常包括思想教育、志愿服务、社会实践、班会参与等内容。建议先核对学院要求，再准备证明材料、照片或签字盖章文件。",
  },
  {
    match: /论文|专利|竞赛|学术/,
    answer:
      "智育相关材料一般包含论文、专利、学术活动和学术竞赛。你可以先确认成果归属、等级证明和附件是否齐全，再提交填报。",
  },
  {
    match: /体育|美育|文体/,
    answer:
      "体育美育类通常关注文体活动、比赛获奖和参与证明。填写时重点核对活动名称、时间、主办方和证明材料是否一致。",
  },
  {
    match: /劳育|社会工作|社会实践|两室/,
    answer:
      "劳育类主要包括社会工作、社会实践、两室文化建设等。建议优先确认是否满足学院认定标准，并保留对应证明附件。",
  },
];

function getFallbackAnswer(question: string) {
  return fallbackAnswers.find((item) => item.match.test(question))?.answer || "你可以把问题描述得更具体一些，我会继续帮你拆解填报步骤。";
}

async function streamText(text: string, onChunk?: (chunk: string) => void, signal?: AbortSignal) {
  for (const word of text.match(/.{1,8}/g) ?? []) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    onChunk?.(word);
    await new Promise((resolve) => setTimeout(resolve, 30));
  }
}

export async function streamFillAssistantAnswer({ question, history = [], onChunk, signal }: StreamAssistantOptions) {
  const endpoint = process.env.NEXT_PUBLIC_FILL_ASSISTANT_STREAM_URL || "http://localhost:8000/api/v1/assistant/stream";

  if (!endpoint) {
    await streamText(getFallbackAnswer(question), onChunk, signal);
    return;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question, history }),
    signal,
  });

  if (!response.ok) {
    await streamText(getFallbackAnswer(question), onChunk, signal);
    return;
  }

  if (!response.body) {
    const text = await response.text();
    await streamText(text || getFallbackAnswer(question), onChunk, signal);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line) continue;
      const trimmed = line.startsWith("data:") ? line.slice(5).trimStart() : line;
      if (!trimmed || trimmed === "[DONE]") continue;
      onChunk?.(trimmed);
    }
  }

  if (buffer.trim()) {
    const trimmed = buffer.startsWith("data:") ? buffer.slice(5).trimStart() : buffer;
    if (trimmed && trimmed !== "[DONE]") onChunk?.(trimmed);
  }
}
