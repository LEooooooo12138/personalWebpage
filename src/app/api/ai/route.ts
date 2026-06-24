import * as staticData from "@/lib/data-static";
import { NextResponse } from "next/server";

const isProd = process.env.NODE_ENV === "production";

type AskPayload = {
  question?: string;
  lang?: "en" | "zh";
};

const answerByKeyword = (question: string, lang: "en" | "zh", profile: Record<string, string>) => {
  const q = question.toLowerCase();
  const stack = JSON.parse(profile.stack || "[]");

  if (q.includes("stack") || q.includes("skill") || q.includes("技术") || q.includes("技能")) {
    return lang === "zh"
      ? `我的核心技术栈包括：${stack.join("、")}。`
      : `Core stack: ${stack.join(", ")}.`;
  }
  if (q.includes("project") || q.includes("项目")) {
    return lang === "zh"
      ? "目前重点项目包括：个人主页 V3、智能用电管理、YOLOv5 检测工具。"
      : "Top projects include Personal Web V3, Smart Energy Manager, and YOLOv5 Detection Toolkit.";
  }
  if (q.includes("study") || q.includes("education") || q.includes("学习") || q.includes("教育")) {
    return lang === "zh"
      ? "我在莫纳什大学完成信息技术本科后，继续在 UTS 学习软件开发硕士。"
      : "Yuanle is pursuing software development studies at UTS after an IT bachelor at Monash.";
  }
  if (q.includes("work") || q.includes("job") || q.includes("公司") || q.includes("任职")) {
    return lang === "zh"
      ? "我目前就职于智慧沟通有限公司，同时持续推进个人主页 V3。"
      : "Yuanle is currently working at AI Negotiate Co., Ltd. while iterating on Personal Website V3.";
  }
  if (q.includes("zhejiang") || q.includes("zju") || q.includes("浙大")) {
    return lang === "zh"
      ? "2025 年我在浙江大学担任研究助理，方向是 AI 视觉相关项目。"
      : "In 2025, Yuanle worked as a research assistant at Zhejiang University on AI-vision related projects.";
  }

  return lang === "zh"
    ? "我专注于全栈产品交付，适应能力强，也欢迎技术与项目合作。"
    : "Yuanle focuses on full-stack product delivery with strong adaptability, and is open to engineering collaboration.";
};

async function getProfileData(): Promise<Record<string, string>> {
  if (isProd) return staticData.getProfile();
  const { getProfile } = await import("@/lib/profile-db");
  return getProfile();
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as AskPayload;
  const question = (body.question ?? "").trim();
  const lang = body.lang === "zh" ? "zh" : "en";

  if (!question) {
    return NextResponse.json(
      { error: "Question is required." },
      { status: 400 },
    );
  }

  const profile = await getProfileData();

  return NextResponse.json({
    answer: answerByKeyword(question, lang, profile),
    source:
      lang === "zh"
        ? "基于规则的示例接口（生产环境可替换为真实 LLM）"
        : "rules-based mock endpoint (swap with LLM provider in production)",
  });
}
