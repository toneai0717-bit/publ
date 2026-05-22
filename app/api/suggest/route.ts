import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { lastQuestion, messages } = await req.json();

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      system: `あなたは自伝インタビューの回答サンプルを生成するAIです。
インタビュアーの質問に対して、面白い人生を歩んできた人物が答えるようなサンプル回答を生成してください。

【重要】
- 具体的なエピソード・情景・感情を含む、読み応えのある回答
- 150〜250文字程度の自然な話し言葉
- 「例えば〜」のような書き方でOK
- 人生の深みや個性が感じられる内容にする
- これまでの会話の流れに自然につながる内容にする`,
      messages: [
        {
          role: "user",
          content: `インタビュアーの質問：\n${lastQuestion}\n\nこれまでの会話（参考）：\n${messages.slice(-6).map((m: { role: string; content: string }) => `${m.role === "assistant" ? "インタビュアー" : "著者"}：${m.content}`).join("\n\n")}\n\nこの質問に対するサンプル回答を1つ生成してください。`,
        },
      ],
    });

    const suggestion = response.content[0].type === "text" ? response.content[0].text : "";
    if (!suggestion) throw new Error("サンプル生成に失敗しました");

    return NextResponse.json({ suggestion });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
