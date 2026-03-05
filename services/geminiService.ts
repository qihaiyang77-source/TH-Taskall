
import { GoogleGenAI } from "@google/genai";
import { Task, Member, AiProvider, AiConfig } from "../types";

const callDify = async (config: AiConfig, prompt: string): Promise<string> => {
  if (!config.difyEndpoint || !config.difyKey) {
    throw new Error("Dify 配置不完整（Endpoint 或 API Key 缺失）");
  }

  const endpoint = config.difyEndpoint.endsWith('/') 
    ? config.difyEndpoint.slice(0, -1) 
    : config.difyEndpoint;

  const response = await fetch(`${endpoint}/chat-messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.difyKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: {},
      query: prompt,
      response_mode: 'blocking',
      user: 'TaskPulse_User'
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Dify 请求失败: ${response.status}`);
  }

  const data = await response.json();
  return data.answer || "Dify 未返回有效回复。";
};

const callGemini = async (prompt: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("系统未配置默认 Gemini API Key。");
  }
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });
  return response.text || "Gemini 未返回有效分析结果。";
};

export const analyzeProjectHealth = async (tasks: Task[], members: Member[], aiConfig: AiConfig): Promise<string> => {
  try {
    // 准备 AI 分析的背景数据
    const tasksContext = tasks.map(t => {
      const assignees = members
        .filter(m => (t.assigneeIds || []).includes(m.id))
        .map(m => m.name)
        .join(', ') || '未知';
        
      return `
        任务: ${t.title}
        负责人: ${assignees}
        交付目标: ${t.outcome}
        截止日期: ${t.dueDate}
        当前进度: ${t.progress}%
        最新进展: ${t.logs.length > 0 ? t.logs[t.logs.length - 1].note : '暂无日报记录'}
      `;
    }).join('\n---\n');

    const prompt = `
      你是一名服务于高层管理者的“T&H 项目管理 AI 指挥官”。
      管理者不需要细碎的过程描述，他们关注“风险(RISKS)”和“交付结果(OUTCOMES)”。
      
      请分析以下任务数据并给出结论：
      1. 根据截止日期和当前进度，哪些任务最有可能发生逾期交付？
      2. 哪些团队成员目前任务负载过重或进度严重卡顿？
      
      请提供一份精炼的“执行摘要”（必须使用简体中文），以 3-4 个要点的形式呈现。
      不要列出所有任务，只高亮核心问题或重大阶段性进展。
      
      任务数据如下：
      ${tasksContext}
    `;

    if (aiConfig.provider === AiProvider.DIFY) {
      return await callDify(aiConfig, prompt);
    } else {
      return await callGemini(prompt);
    }

  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    return `AI 指挥官诊断异常: ${error.message || "未知错误，请检查网络或配置"}`;
  }
};
