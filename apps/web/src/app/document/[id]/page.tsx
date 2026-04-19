"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { getSocket, disconnectSocket } from "@/lib/socket";

interface ActiveUser {
  userId: string;
  name: string;
}

interface Document {
  id: string;
  title: string;
  content: string;
  ownerId: string;
  collaborators: { user: { id: string; name: string; email: string } }[];
}

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

export default function DocumentPage() {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuthStore();
  const router = useRouter();

  const [doc, setDoc] = useState<Document | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [shareEmail, setShareEmail] = useState("");
  const [shareMsg, setShareMsg] = useState("");
  const [shareMsgType, setShareMsgType] = useState<"success" | "error">("success");
  const [saved, setSaved] = useState(true);
  const [showShare, setShowShare] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRemoteUpdate = useRef(false);

  useEffect(() => {
    if (!token) { router.replace("/login"); return; }

    api.get(`/api/documents/${id}`).then(({ data }) => {
      setDoc(data);
      setTitle(data.title);
      setContent(data.content);
    }).catch(() => router.replace("/dashboard"));

    const socket = getSocket(token);
    socket.emit("join-document", { documentId: id, userName: user?.name });
    socket.on("document-update", ({ content: c }: { content: string }) => {
      isRemoteUpdate.current = true;
      setContent(c);
    });
    socket.on("title-update", ({ title: t }: { title: string }) => {
      isRemoteUpdate.current = true;
      setTitle(t);
    });
    socket.on("active-users", (users: ActiveUser[]) => setActiveUsers(users));

    return () => {
      socket.off("document-update");
      socket.off("title-update");
      socket.off("active-users");
      disconnectSocket();
    };
  }, [id, token, user, router]);

  const autoSave = useCallback((newTitle: string, newContent: string) => {
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await api.patch(`/api/documents/${id}`, { title: newTitle, content: newContent });
      setSaved(true);
    }, 1000);
  }, [id]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    if (!isRemoteUpdate.current) {
      const socket = getSocket(token!);
      socket.emit("document-change", { documentId: id, content: val });
      autoSave(title, val);
    }
    isRemoteUpdate.current = false;
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!isRemoteUpdate.current) {
      const socket = getSocket(token!);
      socket.emit("title-change", { documentId: id, title: val });
      autoSave(val, content);
    }
    isRemoteUpdate.current = false;
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post(`/api/documents/${id}/share`, { email: shareEmail });
      setShareMsg(data.message);
      setShareMsgType("success");
      setShareEmail("");
    } catch (err: unknown) {
      setShareMsg((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed");
      setShareMsgType("error");
    }
    setTimeout(() => setShareMsg(""), 3000);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  if (!doc) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f0f0f" }}>
      <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0f0f0f" }}>
      {/* Navbar */}
      <nav className="flex justify-between items-center px-6 py-3 sticky top-0 z-10" style={{ background: "rgba(15,15,15,0.9)", borderBottom: "1px solid #1f1f1f", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-sm transition-colors"
            style={{ color: "#555" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#888")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Dashboard
          </button>
          <span style={{ color: "#2a2a2a" }}>|</span>
          <span className="text-sm" style={{ color: "#444" }}>{title || "Untitled"}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Active users */}
          <div className="flex items-center -space-x-2">
            {activeUsers.slice(0, 4).map((u, i) => (
              <div
                key={u.userId}
                title={u.name}
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white ring-2"
                style={{ background: COLORS[i % COLORS.length], ringColor: "#0f0f0f" }}
              >
                {u.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>

          {/* Save status */}
          <div className="flex items-center gap-1.5 text-xs" style={{ color: saved ? "#4ade80" : "#888" }}>
            {saved ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Saved
              </>
            ) : (
              <>
                <div className="w-3 h-3 rounded-full border border-gray-500 border-t-transparent animate-spin" />
                Saving...
              </>
            )}
          </div>

          {/* Share button */}
          {doc.ownerId === user?.id && (
            <button
              onClick={() => setShowShare(!showShare)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all"
              style={{ background: showShare ? "#3730a3" : "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Share
            </button>
          )}
        </div>
      </nav>

      {/* Share panel */}
      {showShare && doc.ownerId === user?.id && (
        <div className="px-6 py-4" style={{ background: "#111", borderBottom: "1px solid #1f1f1f" }}>
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleShare} className="flex gap-2">
              <input
                type="email"
                placeholder="Enter email to invite..."
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg text-sm text-white placeholder-gray-600 outline-none"
                style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
                onFocus={(e) => e.target.style.borderColor = "#6366f1"}
                onBlur={(e) => e.target.style.borderColor = "#2a2a2a"}
                required
              />
              <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                Invite
              </button>
            </form>
            {shareMsg && (
              <p className="text-xs mt-2" style={{ color: shareMsgType === "success" ? "#4ade80" : "#f87171" }}>{shareMsg}</p>
            )}
            {doc.collaborators.length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs" style={{ color: "#555" }}>Collaborators:</span>
                {doc.collaborators.map(({ user: u }) => (
                  <span key={u.id} className="text-xs px-2 py-1 rounded-full" style={{ background: "#1f1f1f", color: "#888" }}>{u.name}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <input
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled"
          className="w-full text-4xl font-bold outline-none mb-6 bg-transparent placeholder-gray-800"
          style={{ color: "#e8e8e8", caretColor: "#6366f1" }}
        />
        <textarea
          value={content}
          onChange={handleContentChange}
          placeholder="Start writing..."
          className="w-full min-h-[65vh] outline-none resize-none bg-transparent leading-relaxed placeholder-gray-800"
          style={{ color: "#aaa", caretColor: "#6366f1", fontSize: "16px" }}
        />
      </div>

      {/* Footer */}
      <div className="px-6 py-3 flex justify-end" style={{ borderTop: "1px solid #1a1a1a" }}>
        <span className="text-xs" style={{ color: "#333" }}>{wordCount} words</span>
      </div>
    </div>
  );
}
