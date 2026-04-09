import { useState } from "react";
import { MessageCircle, Send, Image, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { clients, chatMessages } from "@/lib/dummyData";

interface ConversationPreview {
  clientId: string;
  clientName: string;
  avatar: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
}

const conversations: ConversationPreview[] = [
  { clientId: "1", clientName: "田中 太郎", avatar: "T", lastMessage: "体調バッチリです！よろしくお願いします🔥", lastTime: "20:30", unread: 1 },
  { clientId: "2", clientName: "鈴木 花子", avatar: "S", lastMessage: "今日の食事写真送ります！", lastTime: "19:00", unread: 2 },
  { clientId: "3", clientName: "佐藤 健太", avatar: "K", lastMessage: "了解しました👍", lastTime: "16:45", unread: 0 },
  { clientId: "4", clientName: "高橋 美咲", avatar: "M", lastMessage: "ストレッチの動画ありがとうございます", lastTime: "14:20", unread: 0 },
  { clientId: "5", clientName: "山田 翔太", avatar: "Y", lastMessage: "減量順調です！", lastTime: "昨日", unread: 0 },
];

const TrainerMessages = () => {
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [newMsg, setNewMsg] = useState("");
  const [messages, setMessages] = useState(chatMessages);

  const selected = conversations.find(c => c.clientId === selectedConv);

  const handleSend = () => {
    if (!newMsg.trim()) return;
    setMessages([...messages, {
      id: String(messages.length + 1),
      sender: 'trainer',
      text: newMsg.trim(),
      time: '今',
      date: '4/9',
    }]);
    setNewMsg("");
  };

  return (
    <div className="pb-24 md:pb-0">
      <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2 mb-4 sm:mb-6">
        <MessageCircle className="w-5 h-5 text-accent" />
        メッセージ
      </h1>

      <div className="md:grid md:grid-cols-[320px_1fr] md:gap-4 md:h-[calc(100vh-180px)]">
        {/* Conversation list */}
        <Card className={`overflow-hidden ${selectedConv ? 'hidden md:block' : ''}`}>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {conversations.map((conv) => (
                <button
                  key={conv.clientId}
                  onClick={() => setSelectedConv(conv.clientId)}
                  className={`w-full p-3 sm:p-4 flex items-center gap-3 text-left transition-colors hover:bg-muted/50 min-h-[60px] ${
                    selectedConv === conv.clientId ? "bg-accent/10" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl gym-gradient flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0 relative">
                    {conv.avatar}
                    {conv.unread > 0 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
                        {conv.unread}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className="font-bold text-sm truncate">{conv.clientName}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{conv.lastTime}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chat area */}
        {selectedConv ? (
          <Card className={`flex flex-col overflow-hidden ${selectedConv ? '' : 'hidden md:flex'} h-[calc(100vh-200px)] md:h-auto`}>
            {/* Chat header */}
            <div className="p-3 sm:p-4 border-b border-border flex items-center gap-3">
              <button
                onClick={() => setSelectedConv(null)}
                className="md:hidden text-muted-foreground p-1"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 rounded-lg gym-gradient flex items-center justify-center text-primary-foreground font-bold text-xs">
                {selected?.avatar}
              </div>
              <p className="font-bold text-sm">{selected?.clientName}</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'trainer' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] sm:max-w-[75%] rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 ${
                    msg.sender === 'trainer'
                      ? 'accent-gradient text-accent-foreground rounded-br-md'
                      : 'bg-muted rounded-bl-md'
                  }`}>
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-[10px] mt-1 ${msg.sender === 'trainer' ? 'opacity-70' : 'text-muted-foreground'}`}>
                      {msg.date} {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-2 sm:p-3 border-t border-border flex gap-2">
              <Button variant="ghost" size="icon" className="shrink-0 h-11 w-11">
                <Image className="w-5 h-5" />
              </Button>
              <Input
                placeholder="メッセージを入力..."
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 h-11"
              />
              <Button variant="accent" size="icon" onClick={handleSend} className="shrink-0 h-11 w-11">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="hidden md:flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">左のリストから会話を選択してください</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TrainerMessages;
