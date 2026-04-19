"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";

interface Document {
  id: string;
  title: string;
  updatedAt: string;
  owner: { id: string; name: string };
}

export default function DashboardPage() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, token, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!token) { router.replace("/login"); return; }
    api.get("/api/documents").then(({ data }) => setDocs(data)).finally(() => setLoading(false));
  }, [token, router]);

  const createDoc = async () => {
    const { data } = await api.post("/api/documents");
    router.push(`/document/${data.id}`);
  };

  const deleteDoc = async (id: string) => {
    await api.delete(`/api/documents/${id}`);
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen" style={{ background: "#0f0f0f" }}>
      {/* Navbar */}
      <nav style={{ background: "#111", borderBottom: "1px solid #1f1f1f" }} className="px-6 py-4 flex justify-between items-center sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-semibold text-white">Collab Notes</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              {user?.name ? getInitial(user.name) : "?"}
            </div>
            <span className="text-sm" style={{ color: "#888" }}>{user?.name}</span>
          </div>
          <button
            onClick={() => { logout(); router.push("/login"); }}
            className="text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{ color: "#666", border: "1px solid #2a2a2a" }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "#f87171"; (e.target as HTMLElement).style.borderColor = "rgba(239,68,68,0.3)"; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "#666"; (e.target as HTMLElement).style.borderColor = "#2a2a2a"; }}
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-xl font-semibold text-white">My Workspace</h2>
            <p className="text-sm mt-1" style={{ color: "#555" }}>{docs.length} document{docs.length !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={createDoc}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            New Document
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="font-medium text-white">No documents yet</p>
            <p className="text-sm mt-1" style={{ color: "#555" }}>Create your first document to get started</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="group flex justify-between items-center px-5 py-4 rounded-xl transition-all cursor-pointer"
                style={{ background: "#141414", border: "1px solid #1f1f1f" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#2a2a2a"; (e.currentTarget as HTMLElement).style.background = "#181818"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#1f1f1f"; (e.currentTarget as HTMLElement).style.background = "#141414"; }}
                onClick={() => router.push(`/document/${doc.id}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#1f1f1f" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{doc.title || "Untitled"}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#555" }}>
                      {doc.owner.id === user?.id ? "You" : doc.owner.name} · {formatDate(doc.updatedAt)}
                    </p>
                  </div>
                </div>
                {doc.owner.id === user?.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteDoc(doc.id); }}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-lg transition-all"
                    style={{ color: "#555" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f87171"; (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#555"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
