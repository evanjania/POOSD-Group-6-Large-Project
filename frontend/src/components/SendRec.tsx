import { useState } from "react";
import { X, Send } from "lucide-react";
import { fetchWithAuth } from "../util/api";

const BLUE = "#1149A8";
const BG = "#F4F3F1";

type Category = "Movies" | "TV" | "Music";

interface Rec {
  id: string;
  title: string;
  category: Category;
  rating: number;
  notes: string;
  date: string;
}

interface Friend {
  id: string;
  username: string;
}

interface SendRecModalProps {
  preSelectedRec: Rec | null;
  recs: Rec[];
  friends: Friend[];
  onClose: () => void;
  onSent?: () => void;
}

const CATEGORY_EMOJI: Record<Category, string> = {
  Movies: "🎬",
  TV: "📺",
  Music: "🎵",
};

export default function SendRecModal({
  preSelectedRec,
  recs,
  friends,
  onClose,
  onSent,
}: SendRecModalProps) {
  const [selectedRecId, setSelectedRecId] = useState<string | null>(
    preSelectedRec?.id ?? null
  );
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");

  const handleSend = async () => {
    setMessage("");

    const senderId = localStorage.getItem("userId");
    if (!senderId) {
      setMessage("Could not find logged in user.");
      return;
    }

    if (!selectedFriendId) {
      setMessage("Please choose a friend.");
      return;
    }

    const rec = recs.find((r) => r.id === selectedRecId) ?? preSelectedRec;
    if (!rec) {
      setMessage("Please choose a recommendation.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetchWithAuth("/api/sendRecommendation/send", {
        method: "POST",
        body: JSON.stringify({
          senderId,
          receiverId: selectedFriendId,
          title: rec.title,
          category: rec.category,
          rating: rec.rating,
          notes: rec.notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Failed to send recommendation.");
        return;
      }

      setSent(true);

      if (onSent) {
        onSent();
      }

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("SEND REC ERROR:", error);
      setMessage("Failed to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm mx-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition"
        >
          <X size={20} />
        </button>

        {sent ? (
          <div className="text-center py-6">
            <p className="text-5xl mb-3">🤌</p>
            <p className="text-lg font-bold text-stone-900">Sent!</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-stone-900 mb-1">
              Send a Recommendation
            </h2>
            <p className="text-sm text-stone-400 mb-5">Pick a rec and a friend</p>

            {!preSelectedRec && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                  Recommendation
                </label>
                <select
                  value={selectedRecId ?? ""}
                  onChange={(e) => setSelectedRecId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm bg-stone-50 text-stone-800 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                >
                  <option value="">Select a recommendation...</option>
                  {recs.map((r) => (
                    <option key={r.id} value={r.id}>
                      {CATEGORY_EMOJI[r.category]} {r.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {preSelectedRec && (
              <div
                className="mb-4 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2"
                style={{ backgroundColor: `${BLUE}12`, color: BLUE }}
              >
                {CATEGORY_EMOJI[preSelectedRec.category]} {preSelectedRec.title}
              </div>
            )}

            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
              Send to
            </label>

            <div className="space-y-2 max-h-52 overflow-y-auto mb-5">
              {friends.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFriendId(f.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition"
                  style={{
                    backgroundColor: selectedFriendId === f.id ? `${BLUE}12` : BG,
                    border: `2px solid ${selectedFriendId === f.id ? BLUE : "transparent"}`,
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: BLUE }}
                  >
                    {f.username[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-stone-800">
                    @{f.username}
                  </span>
                </button>
              ))}
            </div>

            {message && (
              <p className="text-sm font-semibold text-red-500 mb-3">
                {message}
              </p>
            )}

            <button
              onClick={handleSend}
              disabled={loading || !selectedRecId || !selectedFriendId}
              className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: BLUE }}
            >
              <Send size={15} />
              {loading ? "Sending..." : "Send Recommendation"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
