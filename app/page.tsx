"use client";

import { useState, useRef, useEffect } from "react";

type Screen = "top" | "interview" | "generating" | "manuscript";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("top");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [manuscript, setManuscript] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [listening, setListening] = useState(false);
  const [toast, setToast] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);
  const lastAiRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<unknown>(null);

  useEffect(() => {
    if (lastAiRef.current && chatRef.current) {
      const container = chatRef.current;
      const el = lastAiRef.current;
      container.scrollTop = el.offsetTop - container.offsetTop - 16;
    }
  }, [messages]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  }

  function toggleListening() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("このブラウザは音声入力に対応していません");
      return;
    }

    if (listening) {
      (recognitionRef.current as { stop: () => void })?.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.continuous = true;
    recognition.interimResults = true;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition as unknown;
    recognition.start();
    setListening(true);
  }

  async function startInterview() {
    setScreen("interview");
    setLoading(true);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [] }),
      });
      const data = await res.json();
      setMessages([{ role: "assistant", content: data.reply }]);
    } catch {
      showToast("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user" as const, content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      const aiMsg = { role: "assistant" as const, content: data.reply };
      setMessages([...newMessages, aiMsg]);
      if (data.isComplete) setIsComplete(true);
    } catch {
      showToast("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  async function generateManuscript() {
    setScreen("generating");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      const data = await res.json();
      if (data.manuscript) {
        setManuscript(data.manuscript);
        setScreen("manuscript");
      } else {
        showToast("原稿生成に失敗しました");
        setScreen("interview");
      }
    } catch {
      showToast("通信エラーが発生しました");
      setScreen("interview");
    }
  }

  function downloadText() {
    const blob = new Blob([manuscript], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "manuscript.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadMarkdown() {
    const blob = new Blob([manuscript], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "manuscript.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    setScreen("top");
    setMessages([]);
    setIsComplete(false);
    setManuscript("");
    setInput("");
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-600 text-white px-5 py-3 rounded-2xl shadow-lg text-sm font-medium z-50">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="bg-stone-900 text-white px-6 py-3 flex justify-between items-center">
        <button
          onClick={reset}
          className="font-black tracking-widest text-lg text-amber-400 hover:opacity-70 transition-opacity"
        >
          PUBL
        </button>
        <p className="text-xs text-stone-400">AI自伝・書籍生成</p>
      </header>

      {/* Top screen */}
      {screen === "top" && (
        <div className="min-h-[calc(100vh-52px)] bg-stone-900 text-white flex flex-col">

          {/* Hero */}
          <div className="flex flex-col items-center text-center px-8 py-24 max-w-3xl mx-auto w-full">
            <p className="text-xs tracking-widest text-amber-400 uppercase mb-4">Your Story, Published</p>
            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
              <span className="block">あなたの人生を、</span>
              <span className="block">
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">一冊の本</span>にする。
              </span>
            </h1>
            <p className="text-stone-400 text-base md:text-lg max-w-xl leading-relaxed mb-10">
              AIとの対話で、あなたの経験・転機・メッセージを引き出す。<br />
              インタビューに答えるだけで、書籍原稿が完成する。
            </p>
            <button
              onClick={startInterview}
              className="bg-amber-500 hover:bg-amber-400 text-stone-900 font-black px-12 py-4 rounded-2xl text-sm transition-colors"
            >
              インタビューを始める →
            </button>
          </div>

          {/* How it works */}
          <div className="bg-stone-800 px-6 py-16">
            <div className="max-w-2xl mx-auto">
              <p className="text-center text-xs tracking-widest text-stone-400 uppercase mb-10">How it works</p>
              <div className="space-y-4">
                {[
                  { step: "01", title: "AIのインタビューに答える", desc: "生い立ち・転機・失敗・成功・メッセージ。AIが自然な対話で引き出します。" },
                  { step: "02", title: "AIが原稿を自動生成", desc: "インタビュー内容をもとに、出版クオリティの書籍原稿を自動生成。" },
                  { step: "03", title: "ダウンロードして完成", desc: "テキスト・Markdownでダウンロード。Kindle出版にそのまま使えます。" },
                ].map((item) => (
                  <div key={item.step} className="flex gap-5 items-start bg-stone-700/50 rounded-2xl p-5">
                    <p className="text-3xl font-black text-amber-500/30 flex-shrink-0">{item.step}</p>
                    <div>
                      <p className="font-bold text-sm mb-1">{item.title}</p>
                      <p className="text-xs text-stone-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-10">
                <button
                  onClick={startInterview}
                  className="bg-amber-500 hover:bg-amber-400 text-stone-900 font-black px-10 py-4 rounded-2xl text-sm transition-colors"
                >
                  無料で試す →
                </button>
                <p className="text-xs text-stone-600 mt-3">登録不要 · 今すぐ開始</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interview screen */}
      {screen === "interview" && (
        <div className="flex flex-col h-[calc(100dvh-52px)]">
          <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-stone-50">
            {messages.map((msg, i) => {
              const isLastAi = msg.role === "assistant" && messages.slice(i + 1).every(m => m.role !== "assistant");
              return (
                <div key={i} ref={isLastAi ? lastAiRef : null} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "assistant"
                      ? "bg-white border border-stone-200 text-stone-700 rounded-tl-sm shadow-sm"
                      : "bg-amber-500 text-white rounded-tr-sm"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="bg-white border-t border-stone-200 px-4 py-4">
            {isComplete ? (
              <button
                onClick={generateManuscript}
                className="w-full bg-amber-500 hover:bg-amber-400 text-stone-900 font-black py-4 rounded-2xl text-sm transition-colors"
              >
                📖 原稿を生成する →
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    rows={2}
                    placeholder={listening ? "🎤 話してください..." : "回答を入力してください..."}
                    className={`flex-1 border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none transition-colors ${listening ? "border-red-400 bg-red-50 focus:border-red-400" : "border-stone-200 focus:border-amber-400"}`}
                    disabled={loading}
                  />
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={toggleListening}
                      className={`rounded-xl px-4 py-2 font-bold text-sm transition-colors ${listening ? "bg-red-500 hover:bg-red-400 text-white animate-pulse" : "bg-stone-200 hover:bg-stone-300 text-stone-600"}`}
                    >
                      {listening ? "⏹" : "🎤"}
                    </button>
                    <button
                      onClick={sendMessage}
                      disabled={!input.trim() || loading}
                      className="bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold px-4 py-2 rounded-xl disabled:opacity-30 transition-colors text-sm"
                    >
                      送信
                    </button>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    const lastAiMsg = [...messages].reverse().find(m => m.role === "assistant");
                    if (!lastAiMsg) return;
                    setSuggesting(true);
                    try {
                      const res = await fetch("/api/suggest", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ lastQuestion: lastAiMsg.content, messages }),
                      });
                      const data = await res.json();
                      if (data.suggestion) setInput(data.suggestion);
                    } catch {
                      showToast("サンプル生成に失敗しました");
                    } finally {
                      setSuggesting(false);
                    }
                  }}
                  disabled={suggesting || loading}
                  className="text-xs text-stone-400 hover:text-amber-500 transition-colors disabled:opacity-30 text-left"
                >
                  {suggesting ? "生成中..." : "💡 回答例を生成"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generating screen */}
      {screen === "generating" && (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-52px)] gap-6">
          <div className="w-12 h-12 border-4 border-stone-200 border-t-amber-500 rounded-full animate-spin" />
          <div className="text-center">
            <p className="font-bold text-stone-800 text-lg mb-2">原稿を生成中...</p>
            <p className="text-sm text-stone-500">あなたの人生ストーリーを書籍にしています</p>
          </div>
        </div>
      )}

      {/* Manuscript screen */}
      {screen === "manuscript" && manuscript && (
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm mb-6">
            <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-4">生成された原稿</p>
            <div className="text-sm leading-relaxed whitespace-pre-wrap text-stone-700">
              {manuscript}
            </div>
          </div>

          <div className="flex gap-3 mb-3">
            <button
              onClick={downloadText}
              className="flex-1 bg-stone-900 text-white rounded-xl py-3 font-semibold hover:bg-stone-700 transition-colors text-sm"
            >
              📄 テキストで保存
            </button>
            <button
              onClick={downloadMarkdown}
              className="flex-1 bg-amber-500 text-stone-900 rounded-xl py-3 font-semibold hover:bg-amber-400 transition-colors text-sm"
            >
              📝 Markdownで保存
            </button>
          </div>
          <button
            onClick={reset}
            className="w-full border border-stone-200 text-stone-500 rounded-xl py-3 font-semibold hover:bg-stone-50 transition-colors text-sm"
          >
            最初からやり直す
          </button>
        </div>
      )}
    </div>
  );
}
