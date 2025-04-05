import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { v4 as uuidv4 } from "uuid";
import { io } from "socket.io-client";
import { Ban, Smile, Flag } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { createClient } from "@supabase/supabase-js";

const socket = io("http://localhost:4000"); // Backend URL

const BANNED_WORDS = ["hate", "kill", "stupid"];

// Supabase Config
const supabaseUrl = "https://nbvpabrqfwevccffbqzh.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5idnBhYnJxZndldmNjZmZicXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NDM3OTIsImV4cCI6MjA1OTQxOTc5Mn0.KdDOYQsSuMqboMmeJvKTy683cFZziifDN-bo6PoHqlo";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const availableRooms = ["exam-anxiety", "social-anxiety", "academic-stress", "homesickness"];

const PeerSupportCircle = () => {
  const [nickname, setNickname] = useState("");
  const [room, setRoom] = useState("exam-anxiety");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [reportedMessages, setReportedMessages] = useState([]);

  useEffect(() => {
    const generatedName = `Calm${Math.floor(Math.random() * 1000)}`;
    setNickname(generatedName);
    socket.emit("join_room", room);

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("room", room);

      if (error) {
        console.error("Error fetching messages:", error);
      } else {
        setMessages(data);
      }
    };

    fetchMessages();

    socket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.disconnect();
    };
  }, [room]);

  const containsBannedWords = (text) => {
    return BANNED_WORDS.some((word) => text.toLowerCase().includes(word));
  };

  const sendMessage = async () => {
    if (message.trim() === "") return;
    if (containsBannedWords(message)) {
      alert("⚠️ Message contains inappropriate language.");
      return;
    }

    const msgData = {
      id: uuidv4(),
      sender: nickname,
      text: message,
      timestamp: new Date().toLocaleTimeString(),
      room,
    };

    socket.emit("send_message", msgData);
    setMessages((prev) => [...prev, msgData]);
    setMessage("");

    const { error } = await supabase.from("messages").insert([msgData]);
    if (error) {
      console.error("Supabase insert error:", error);
    }
  };

  const onEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
  };

  const handleReport = async (msgId) => {
    if (!reportedMessages.includes(msgId)) {
      setReportedMessages((prev) => [...prev, msgId]);
      alert("✅ Message reported. Our team will review it shortly.");

      await supabase.from("reports").insert([
        {
          reporter: nickname,
          messageId: msgId,
          room,
          timestamp: new Date().toISOString(),
        },
      ]);
    } else {
      alert("⚠️ You've already reported this message.");
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gradient-to-r from-blue-100 to-indigo-100">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">
          🧑‍🤝‍ Peer Support Circle: {room.replace("-", " ")}
        </h1>

        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">Choose a support group:</label>
          <select
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            className="p-2 rounded-md border border-gray-300"
          >
            {availableRooms.map((r) => (
              <option key={r} value={r}>
                {r.replace("-", " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 h-[500px] overflow-y-scroll mb-4">
          {messages.map((msg) => (
            <div key={msg.id} className="mb-3">
              <p className="text-sm text-gray-500">
                {msg.sender} • {msg.timestamp}
              </p>
              <p className="text-md font-medium flex items-center gap-2">
                {msg.text}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleReport(msg.id)}
                  className="text-red-500 hover:text-red-700"
                  title="Report message"
                >
                  <Flag className="w-4 h-4" />
                </Button>
              </p>
            </div>
          ))}
        </div>

        <div className="relative mb-2">
          {showEmoji && (
            <div className="absolute bottom-16 z-50">
              <EmojiPicker onEmojiClick={onEmojiClick} height={300} width={300} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowEmoji((prev) => !prev)}
            className="rounded-full px-3"
          >
            <Smile className="w-5 h-5" />
          </Button>

          <Input
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1"
          />

          <Button onClick={sendMessage}>Send</Button>
        </div>
      </div>
    </div>
  );
};

export default PeerSupportCircle;
