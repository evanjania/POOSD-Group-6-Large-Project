import { useState } from "react";
import { Search, Plus, Send, UserPlus, X, Star, LogOut } from "lucide-react";
import logoIcon from "../assets/logo-icon.png";
import arrowBg from "../assets/arrow-background.jpg";
import { useLocation } from "wouter";

const BLUE = "#1149A8";
const BG = "#F4F3F1";

type Category = "Movies" | "TV" | "Music";
type ModalType = "add-rec" | "rec-detail" | "send-rec" | "add-friend" | null;

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

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
        >
          <Star
            size={26}
            className={(hover || value) >= s ? "fill-yellow-400 text-yellow-400" : "text-stone-300"}
          />
        </button>
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

function RecDetailModal({
  rec,
  onClose,
  onSend,
}: {
  rec: Rec;
  onClose: () => void;
  onSend: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md mx-4">
        <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition">
          <X size={20} />
        </button>

        <span
          className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3"
          style={{ backgroundColor: `${BLUE}18`, color: BLUE }}
        >
          {CATEGORY_EMOJI[rec.category]} {rec.category}
        </span>

        <h2 className="text-2xl font-bold text-stone-900 mb-2">{rec.title}</h2>
        <StarRating rating={rec.rating} size={18} />

        <div className="mt-4 p-4 rounded-2xl" style={{ backgroundColor: BG }}>
          <p className="text-sm text-stone-600 leading-relaxed">{rec.notes}</p>
        </div>

        <p className="text-xs text-stone-400 mt-3">Added {rec.date}</p>

        <button
          onClick={onSend}
          className="mt-5 w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition hover:opacity-90"
          style={{ backgroundColor: BLUE }}
        >
          <Send size={15} />
          Send to a Friend
        </button>
      </div>
    </div>
  );
}

function AddRecModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (rec: Omit<Rec, "id" | "date">) => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("Movies");
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");

  const fieldClass =
    "w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm bg-stone-50 text-stone-800 placeholder-stone-400 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:bg-white transition";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || rating === 0) return;
    onAdd({ title: title.trim(), category, rating, notes: notes.trim() });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md mx-4">
        <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition">
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-stone-900 mb-1">Add to your diary</h2>
        <p className="text-sm text-stone-400 mb-6">Save something worth recommending</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What are you recommending?"
              className={fieldClass}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className={fieldClass}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_EMOJI[c]} {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">Rating</label>
            <StarInput value={rating} onChange={setRating} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why should your friends check this out?"
              className={fieldClass + " resize-none h-24"}
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl font-bold text-sm text-white transition hover:opacity-90 mt-1"
            style={{ backgroundColor: BLUE }}
          >
            Add to Diary
          </button>
        </form>
      </div>
    </div>
  );
}

function SendRecModal({
  preSelectedRec,
  recs,
  friends,
  onClose,
}: {
  preSelectedRec: Rec | null;
  recs: Rec[];
  friends: Friend[];
  onClose: () => void;
}) {
  const [selectedRecId, setSelectedRecId] = useState<string | null>(preSelectedRec?.id ?? null);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!selectedRecId || !selectedFriendId) return;
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

function AddFriendModal({
  onClose,
  onAdd,
  pendingRequests,
  onApprove,
  onDeny,
}: {
  onClose: () => void;
  onAdd: (username: string) => void;
  pendingRequests: Friend[];
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
}) {
  const [username, setUsername] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setSearched(true);
  };

  const handleAdd = () => {
    onAdd(username.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm mx-4">
        <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition">
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-stone-900 mb-1">Add a Friend</h2>
        <p className="text-sm text-stone-400 mb-5">Search by username to connect</p>

        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            value={username}
            onChange={(e) => { setUsername(e.target.value); setSearched(false); }}
            placeholder="their_username"
            className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 text-sm bg-stone-50 text-stone-800 placeholder-stone-400 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:bg-white transition"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl text-white text-sm font-bold transition hover:opacity-90"
            style={{ backgroundColor: BLUE }}
          >
            Search
          </button>
        </form>

        {searched && username.trim() && (
          <div className="flex items-center justify-between p-4 rounded-xl mb-5" style={{ backgroundColor: BG }}>
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: BLUE }}
              >
                {username.trim()[0].toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-stone-800">@{username.trim()}</span>
            </div>
            <button
              onClick={handleAdd}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition hover:opacity-90"
              style={{ backgroundColor: BLUE }}
            >
              Add
            </button>
          </div>
        )}

        <div className="border-t border-stone-100 pt-5">
          <h3 className="text-sm font-bold text-stone-700 mb-3">
            Pending Requests
            {pendingRequests.length > 0 && (
              <span
                className="ml-2 px-2 py-0.5 rounded-full text-xs text-white font-bold"
                style={{ backgroundColor: BLUE }}
              >
                {pendingRequests.length}
              </span>
            )}
          </h3>

          {pendingRequests.length === 0 ? (
            <p className="text-sm text-stone-400 italic">No pending requests right now.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ backgroundColor: BG }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: BLUE }}
                    >
                      {req.username[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-stone-800">@{req.username}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onApprove(req.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition hover:opacity-90"
                      style={{ backgroundColor: BLUE }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => onDeny(req.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-stone-500 bg-stone-100 hover:bg-stone-200 transition"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const username = localStorage.getItem("username") || "user";
  const [recs, setRecs] = useState<Rec[]>(INITIAL_RECS);
  const [friends, setFriends] = useState<Friend[]>(INITIAL_FRIENDS);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
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

  const addRec = (rec: Omit<Rec, "id" | "date">) => {
    setRecs((prev) => [{ ...rec, id: Date.now().toString(), date: "Today" }, ...prev]);
  };

  const addFriend = (username: string) => {
    if (!username || friends.some((f) => f.username === username)) return;
    setFriends((prev) => [...prev, { id: Date.now().toString(), username }]);
  };

  const removeFriend = (id: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== id));
  };

  const approveFriend = (id: string) => {
    const req = pendingRequests.find((r) => r.id === id);
    if (!req) return;
    setPendingRequests((prev) => prev.filter((r) => r.id !== id));
    if (!friends.some((f) => f.username === req.username)) {
      setFriends((prev) => [...prev, req]);
    }
  };

  const denyFriend = (id: string) => {
    setPendingRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const openDetail = (rec: Rec) => {
    setSelectedRec(rec);
    setModal("rec-detail");
  };

  const openSendFromDetail = () => {
    setSendRec(selectedRec);
    setModal("send-rec");
  };

  const closeModal = () => {
    setModal(null);
    setSelectedRec(null);
    setSendRec(null);
  };

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
              {friends.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-stone-50 transition cursor-default"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: BLUE }}
                  >
                    {f.username[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-stone-700 truncate flex-1">@{f.username}</span>
                  <button
                    onClick={() => removeFriend(f.id)}
                    className="text-stone-400 hover:text-red-500 transition text-base leading-none shrink-0"
                    aria-label={`Remove ${f.username}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setModal("add-friend")}
              className="mt-3 w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border-2 transition hover:opacity-80"
              style={{ color: BLUE, borderColor: BLUE }}
            >
              <UserPlus size={15} />
              Add Friend
            </button>
          </div>

        </div>
      </div>

      {/* ── MODALS ── */}
      {modal === "add-rec" && (
        <AddRecModal onClose={closeModal} onAdd={addRec} />
      )}
      {modal === "rec-detail" && selectedRec && (
        <RecDetailModal rec={selectedRec} onClose={closeModal} onSend={openSendFromDetail} />
      )}
      {modal === "send-rec" && (
        <SendRecModal preSelectedRec={sendRec} recs={recs} friends={friends} onClose={closeModal} />
      )}
      {modal === "add-friend" && (
        <AddFriendModal
          onClose={closeModal}
          onAdd={addFriend}
          pendingRequests={pendingRequests}
          onApprove={approveFriend}
          onDeny={denyFriend}
        />
      )}
    </div>
  );
}
