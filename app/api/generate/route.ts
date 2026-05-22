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
以下の構成で、Kindle出版向けの書籍原稿を生成してください。目標は200ページ相当（約10万字）です。

# タイトル
（著者の人生・メッセージを反映した、思わず手に取りたくなるタイトル）

## はじめに
（読者への呼びかけ。この本が誰のためのものか。1000字程度）

## 第1章：原点
（生い立ち・子ども時代・影響を受けた人物。情景描写・会話・感情を交えて3000字程度）

## 第2章：青春と模索
（10代〜20代の葛藤・夢・出会い。3000字程度）

## 第3章：転機
（人生を変えた出来事・決断の瞬間。その日の情景から丁寧に描く。3000字程度）

## 第4章：暗黒期と再生
（試練・挫折・どん底の日々。そこでの感情・生活・人との関わりを詳細に。3000字程度）

## 第5章：覚醒
（何かが変わった瞬間・行動を起こした理由。3000字程度）

## 第6章：成し遂げたこと
（誇りに思う実績・成功体験。プロセスと感情を丁寧に。3000字程度）

## 第7章：今、そしてこれから
（現在の情熱・未来のビジョン・大切にしている価値観。3000字程度）

## おわりに
（読者へのメッセージ。著者の人生を凝縮した言葉。1500字程度）

【注意】
- インタビューで語られた具体的なエピソード・言葉・情景を最大限活かすこと
- 「その時こう感じた」「こんな言葉が浮かんだ」など感情の描写を豊かに入れること
- 会話文・情景描写・心理描写を織り交ぜた小説のような読み心地にすること
- 読者が「自分のことのように感じる」普遍的な感情を引き出す文体にすること
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
