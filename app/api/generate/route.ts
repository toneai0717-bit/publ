import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const interviewText = messages
      .map((m: { role: string; content: string }) =>
        `${m.role === "assistant" ? "インタビュアー" : "著者"}：${m.content}`
      )
      .join("\n\n");

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `以下のインタビュー内容をもとに、Kindle出版向けの自伝・ビジネス書の原稿を生成してください。

【インタビュー内容】
${interviewText}

【出力形式】
以下の構成で、読み応えのある書籍原稿を生成してください。

# タイトル
（著者の人生・メッセージを反映した魅力的なタイトル）

## はじめに
（読者への呼びかけ。この本が誰のためのものか。200字程度）

## 第1章：原点
（生い立ち・子ども時代・影響を受けた人物。600字程度）

## 第2章：転機
（人生を変えた出来事・決断・挑戦。600字程度）

## 第3章：試練と成長
（失敗・挫折・そこからの立ち直り。600字程度）

## 第4章：成し遂げたこと
（誇りに思う実績・成功体験。600字程度）

## 第5章：今、そしてこれから
（現在の情熱・未来のビジョン。600字程度）

## おわりに
（読者へのメッセージ。著者の人生を凝縮した言葉。300字程度）

【注意】
- インタビューで語られた具体的なエピソード・言葉を活かすこと
- 読者が引き込まれる文体で書くこと
- 実際の書籍として出版できるクオリティを目指すこと`,
        },
      ],
    });

    const manuscript = response.content[0].type === "text" ? response.content[0].text : "";
    if (!manuscript) throw new Error("原稿生成に失敗しました");

    return NextResponse.json({ manuscript });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
