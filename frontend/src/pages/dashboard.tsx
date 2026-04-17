import { useState, useEffect } from "react";
import { Search, Plus, UserPlus, X, Star, LogOut } from "lucide-react";
import logoIcon from "../assets/logo-icon.png";
import arrowBg from "../assets/arrow-background.jpg";
import { useLocation } from "wouter";

import AddFriendModal, { friendApi } from "../src/components/friends";
import ChatLayer, { messageApi, buildRecMessage, type RecPayload, type ChatMessage } from "../src/components/chat";
import AddRecModal from "../src/components/addrec";
//import RecDetailModal from "../components/RecDetail";

// ── stub for hardcoding to get webpage to build, delete later ──────────────
/*type Category = "Movies" | "TV" | "Music";
interface RecPayload { title: string; category: Category; rating: number; notes: string; }
interface ChatMessage { id: string; senderId: string; content: string; timestamp: string; type: "text" | "rec"; recPayload?: RecPayload; }
const messageApi = { sendMessage: async (_a: string, _b: string, _c: string) => {} };
const buildRecMessage = (senderId: string, payload: RecPayload): ChatMessage => ({ id: Date.now().toString(), senderId, content: payload.title, timestamp: new Date().toISOString(), type: "rec", recPayload: payload });
const ChatLayer = (_props: { friends: unknown[]; openChatIds: string[]; onClose: (id: string) => void; injectMessages: Record<string, ChatMessage | null>; onAddRec: (rec: Omit<Rec, "id" | "date">) => void }) => null;
*/
// ── End stub ─────────────────────────────────────────────────────────────────

type Category = "Movies" | "TV" | "Music";
const BLUE = "#1149A8";
const BG = "#F4F3F1";

type ModalType = "add-rec" | "rec-detail" | "send-rec" | "add-friend" | null;

interface Rec {
  id: string;
  title: string;
  category: Category;
  rating: number;
  notes: string;
  date: string;
  error: string;
}

interface Friend {
  id: string;
  username: string;
}

const CATEGORIES: Category[] = ["Movies", "TV", "Music"];

const CATEGORY_EMOJI: Record<Category, string> = {
  Movies: "🎬",
  TV: "📺",
  Music: "🎵",
};

const INITIAL_RECS: Rec[] = [];

const INITIAL_FRIENDS: Friend[] = [];

function StarRating({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          className={s <= rating ? "fill-yellow-400 text-yellow-400" : "text-stone-200"}
        />
      ))}
    </div>
  );
}

function RecCard({ rec, onClick }: { rec: Rec; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-64 bg-white rounded-2xl p-5 text-left shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 border border-stone-100"
    >
      <p className="text-xl mb-1">{CATEGORY_EMOJI[rec.category]}</p>
      <h4 className="text-base font-bold text-stone-900 leading-snug mb-2 line-clamp-2">{rec.title}</h4>
      <StarRating rating={rec.rating} size={16} />
      <p className="text-sm text-stone-400 mt-3 line-clamp-3 leading-relaxed">{rec.notes}</p>
    </button>
  );
}


function SendRecModal({
  preSelectedRec,
  recs,
  friends,
  onClose,
  onSent,
}: {
  preSelectedRec: Rec | null;
  recs: Rec[];
  friends: Friend[];
  onClose: () => void;
  onSent: (friendId: string, msg: ChatMessage) => void;
}) {
  const [selectedRecId, setSelectedRecId] = useState<string | null>(preSelectedRec?.id ?? null);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!selectedFriendId) return;
    const rec = recs.find((r) => r.id === selectedRecId) ?? preSelectedRec;
    if (!rec) return;

    const userId = localStorage.getItem("userId") || "";
    const payload: RecPayload = {
      title: rec.title,
      category: rec.category,
      rating: rec.rating,
      notes: rec.notes,
    };
    const msg = buildRecMessage(userId, selectedFriendId, payload);
    await messageApi.sendMessage(userId, selectedFriendId, msg.messageText);
    onSent(selectedFriendId, msg);
    setSent(true);
    setTimeout(onClose, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm mx-4">
        <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition">
          <X size={20} />
        </button>

        {sent ? (
          <div className="text-center py-6">
            <p className="text-5xl mb-3">🤌</p>
            <p className="text-lg font-bold text-stone-900">Sent!</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-stone-900 mb-1">Send a Recommendation</h2>
            <p className="text-sm text-stone-400 mb-5">Pick a rec and a friend</p>

            {!preSelectedRec && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Recommendation</label>
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

            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Send to</label>
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
                  <span className="text-sm font-medium text-stone-800">@{f.username}</span>
                </button>
              ))}
            </div>

            <button
              onClick={handleSend}
              disabled={!selectedRecId || !selectedFriendId}
              className="w-full py-3 rounded-xl font-bold text-sm text-white transition hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: BLUE }}
            >
              Send Recommendation
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const username = localStorage.getItem("username") || "user";
  const [recs, setRecs] = useState<Rec[]>(INITIAL_RECS);
  const [friends, setFriends] = useState<Friend[]>(INITIAL_FRIENDS);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [openChatIds, setOpenChatIds] = useState<string[]>([]);
  const [injectMessages, setInjectMessages] = useState<Record<string, ChatMessage | null>>({});
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalType>(null);
  const [selectedRec, setSelectedRec] = useState<Rec | null>(null);
  const [sendRec, setSendRec] = useState<Rec | null>(null);

  const filteredRecs = search.trim()
    ? recs.filter(
        (r) =>
          r.title.toLowerCase().includes(search.toLowerCase()) ||
          r.category.toLowerCase().includes(search.toLowerCase())
      )
    : recs;

  const recsByCategory = CATEGORIES.reduce<Record<Category, Rec[]>>(
    (acc, cat) => { acc[cat] = filteredRecs.filter((r) => r.category === cat); return acc; },
    { Movies: [], TV: [], Music: [] }
  );


  /*const addRec = (rec: Rec) => {
    setRecs((prev) => [rec, ...prev]);
  };*/

  // sends updated recommendation to backend and updates dashboard UI
  const editRec = async (updatedRec: Rec) => {
	  try {

		  // call backend PATCH route to update recommendation in MongoDB
		  const response = await fetch("/api/recs/edit", {
			  method: "PATCH",
			  headers: {
				  "Content-Type": "application/json",
			  },

			  // send updated recommendation fields to server
			  body: JSON.stringify({
				  id: updatedRec.id,
				  title: updatedRec.title,
				  category: updatedRec.category,
				  rating: updatedRec.rating,
				  notes: updatedRec.notes,
			  }),
		  });

		  // convert server response to JSON
		  const data: Rec = await response.json();

		  // if server returns error, stop execution
		  if (!response.ok) {
			  console.error(data.error || "Failed to edit recommendation");
			  return;
		  }

		  // update recommendation inside dashboard state
		  // this refreshes the UI immediately after edit succeeds
      setRecs((prev) =>
	      prev.map((rec : Rec) =>
		      rec.id === updatedRec.id ? data : rec
	      )
      );

		  // update selectedRec so modal reflects new values immediately
      setSelectedRec(data);

	  } catch (error) {
		  console.error("EDIT REC ERROR:", error);
	  }
  };


  const deleteRec = async (id: string) => {
    try {
      const response = await fetch("/api/recs/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        console.error("Failed to delete recommendation");
        return;
      }

      // remove from UI after backend deletion succeeds
      setRecs((prev) => prev.filter((rec: Rec) => rec.id !== id));
    } catch (error) {
      console.error("DELETE REC ERROR:", error);
    }
  };



  const handleSidebarRemove = async (id: string) => {
    const currentUserId = localStorage.getItem("userId");
    if (!currentUserId) return;

    setFriends((prev) => prev.filter((f) => f.id !== id));
    closeChat(id);
    try {
      await friendApi.remove(id);
    } catch (error) {
      console.error(error);
    }
  };

  const toggleChat = (friendId: string) => {
    setOpenChatIds((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const closeChat = (friendId: string) => {
    setOpenChatIds((prev) => prev.filter((id) => id !== friendId));
  };

  const handleRecSent = (friendId: string, msg: ChatMessage) => {
    setOpenChatIds((prev) => (prev.includes(friendId) ? prev : [...prev, friendId]));
    setInjectMessages((prev) => ({ ...prev, [friendId]: msg }));
  };

  const openDetail = (rec: Rec) => {
    setSelectedRec(rec);
    setModal("rec-detail");
  };

  const openSendFromDetail = () => {
    setSendRec(selectedRec);
    setModal("send-rec");
  };

  const refreshPendingCount = async () => {
    const currentUserId = localStorage.getItem("userId");
    if (!currentUserId) return;
    try {
      const requests = await friendApi.getPending();
      setPendingCount(requests.length);
    } catch {}
  };

  const closeModal = () => {
    if (modal === "add-friend") refreshPendingCount();
    setModal(null);
    setSelectedRec(null);
    setSendRec(null);
  };

  useEffect(() => {
    const currentUserId = localStorage.getItem("userId");
    if (!currentUserId) return;

    friendApi.getFriends()
      .then(setFriends)
      .catch((e) => console.error("Failed to load friends list:", e));

    refreshPendingCount();
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: BG }}>

      {/* ── NAVBAR ── */}
      <nav className="bg-white border-b border-stone-100 px-6 py-3 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-2.5">
          <img src={logoIcon} alt="Ugotta" className="h-7 w-7 object-contain" />
          <span className="text-lg font-bold" style={{ color: BLUE }}>Ugotta</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-base font-bold text-stone-700">{username}</span>
           <button
            onClick={() => { localStorage.removeItem("userId"); localStorage.removeItem("username"); navigate("/"); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition hover:opacity-80"
            style={{ color: BLUE, backgroundColor: `${BLUE}12` }}
            title="Log out"
         >
            <LogOut size={15} />
            Log out
          </button>
        </div>
      </nav>

      {/* ── MAIN CONTENT ── */}
      <div className="flex flex-1 overflow-hidden gap-4 p-4">

        {/* ── LEFT — Recommendations ── */}
        <div
          className="flex-1 rounded-2xl shadow-sm overflow-y-auto p-6"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.82), rgba(255,255,255,0.82)), url(${arrowBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <h1 className="text-2xl font-bold text-stone-900 mb-7">Your Recommendations:</h1>

          {CATEGORIES.map((cat) => {
            const catRecs = recsByCategory[cat];
            if (catRecs.length === 0 && search.trim()) return null;
            return (
              <div key={cat} className="mb-8">
                <h2 className="text-base font-bold text-stone-700 mb-3 flex items-center gap-2">
                  <span>{CATEGORY_EMOJI[cat]}</span>
                  <span>{cat}:</span>
                </h2>
                {catRecs.length === 0 ? (
                 <div className="bg-white rounded-2xl px-6 py-5 inline-block shadow-sm border border-stone-100">
                    <p className="text-base text-stone-400 italic">
                      No {cat.toLowerCase()} yet — hit the + to add one!
                    </p>
                  </div>
                ) : (
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {catRecs.map((rec) => (
                      <RecCard key={rec.id} rec={rec} onClick={() => openDetail(rec)} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── RIGHT — Sidebar ── */}
        <div className="w-60 flex flex-col gap-3 shrink-0">

          {/* Add to Library */}
          <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3">
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Add to Library</p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 min-w-0 flex-1">
                <Search size={14} className="text-stone-400 shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Find a rec..."
                  className="w-full text-sm bg-transparent text-stone-700 placeholder-stone-400 outline-none"
                />
              </div>
              <button
                onClick={() => setModal("add-rec")}
                className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white transition hover:opacity-90"
                style={{ backgroundColor: BLUE }}
                title="Add recommendation"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Friends List */}
          <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col flex-1 min-h-0">
            <h3 className="text-sm font-bold text-stone-700 mb-3">Friends List</h3>

            <div className="flex-1 overflow-y-auto space-y-0.5 min-h-0">
              {friends.length === 0 && (
                <p className="text-sm text-stone-400 italic text-center mt-4 px-2">
                  :( No friends yet — add one below!
                </p>
              )}
              {friends.map((f) => {
                const isChatOpen = openChatIds.includes(f.id);
                return (
                  <div
                    key={f.id}
                    className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-stone-50 transition cursor-pointer"
                    onClick={() => toggleChat(f.id)}
                    title={`Chat with @${f.username}`}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: isChatOpen ? "#0e3d8a" : BLUE }}
                    >
                      {f.username[0].toUpperCase()}
                    </div>
                    <span
                      className="text-sm truncate flex-1"
                      style={{ color: isChatOpen ? BLUE : "#44403c", fontWeight: isChatOpen ? 700 : 400 }}
                    >
                      @{f.username}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmRemoveId(f.id); }}
                      className="text-stone-400 hover:text-red-500 transition text-base leading-none shrink-0"
                      aria-label={`Remove ${f.username}`}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="relative mt-3">
              <button
                onClick={() => setModal("add-friend")}
                className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border-2 transition hover:opacity-80"
                style={{ color: BLUE, borderColor: BLUE }}
              >
                <UserPlus size={15} />
                Add Friend
              </button>
              {pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                  {pendingCount}
                </span>
              )}
            </div>
          </div>
          
        </div>
      </div>

      {/* ── MODALS ── */}
      
      {modal === "add-rec" && (
        <AddRecModal
          onClose={closeModal}
          onAddSuccess={(newRec: Rec) => {
            setRecs((prev) => [newRec, ...prev]);
          }}
        />
      )}


      {/*{modal === "rec-detail" && selectedRec && (
        <RecDetailModal
          rec={selectedRec}
          onClose={closeModal}
          onSend={openSendFromDetail}
          onDelete={deleteRec}
          onEdit={editRec}
        />
      )}*/}


      {modal === "send-rec" && (
        <SendRecModal
          preSelectedRec={sendRec}
          recs={recs}
          friends={friends}
          onClose={closeModal}
          onSent={handleRecSent}
        />
      )}
      {modal === "add-friend" && (
        <AddFriendModal
          onClose={closeModal}
          friends={friends}
          setFriends={setFriends}
        />
      )}

      {/* ── CHAT WINDOWS ── */}
      <ChatLayer
        friends={friends}
        openChatIds={openChatIds}
        onClose={closeChat}
        injectMessages={injectMessages}

        onAddRec={(rec: Omit<Rec, "id" | "date">) =>
          setRecs((prev) => [
            { ...rec, id: Date.now().toString(), date: "Today" },
            ...prev,
          ])
        }

      />

      {confirmRemoveId && (() => {
        const friend = friends.find((f) => f.id === confirmRemoveId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmRemoveId(null)} />
            <div className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-xs mx-4 text-center">
              <p className="text-3xl mb-3">🤔</p>
              <h2 className="text-lg font-bold text-stone-900 mb-1">Remove friend?</h2>
              <p className="text-sm text-stone-500 mb-6">
                Are you sure you want to remove{" "}
                <span className="font-semibold text-stone-700">@{friend?.username}</span>{" "}
                from your friends list?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmRemoveId(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleSidebarRemove(confirmRemoveId);
                    setConfirmRemoveId(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}