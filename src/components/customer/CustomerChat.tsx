import { useState } from "react";
import { Send, MessageCircle } from "lucide-react";
import { chatMessages } from "@/lib/dummyData";

const CustomerChat = () => {
  const [messages, setMessages] = useState(chatMessages);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg = {
      id: String(Date.now()),
      sender: "customer" as const,
      text: input.trim(),
      time: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
      date: "4/9",
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] slide-up">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full gym-gradient flex items-center justify-center text-primary-foreground font-bold text-sm">
            Y
          </div>
          <div>
            <p className="font-bold text-sm">山本 コーチ</p>
            <p className="text-xs text-success font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-success rounded-full inline-block" />
              オンライン
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => {
          const showDate = i === 0 || messages[i - 1].date !== msg.date;
          return (
            <div key={msg.id}>
              {showDate && (
                <div className="text-center my-3">
                  <span className="text-[10px] text-muted-foreground bg-muted px-3 py-1 rounded-full font-medium">
                    {msg.date}
                  </span>
                </div>
              )}
              <div className={`flex ${msg.sender === "customer" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
                    msg.sender === "customer"
                      ? "accent-gradient text-accent-foreground rounded-br-md"
                      : "bg-card border border-border rounded-bl-md shadow-sm"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${
                    msg.sender === "customer" ? "text-accent-foreground/60" : "text-muted-foreground"
                  }`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border glass">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力..."
            className="flex-1 bg-secondary rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/30 transition-all placeholder:text-muted-foreground"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-10 h-10 rounded-xl accent-gradient flex items-center justify-center text-accent-foreground disabled:opacity-40 transition-opacity shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerChat;
