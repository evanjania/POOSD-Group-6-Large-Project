import { useState, useEffect, type Dispatch, type SetStateAction } from "react";
import { X, Loader2 } from "lucide-react";
import { fetchWithAuth } from "../util/api";

const BLUE = "#1149A8";
const BG = "#F4F3F1";

// all api logics
const API_BASE = "/api/follow";

export const friendApi = {
  search: async (query: string) => {
    const res = await fetchWithAuth(`${API_BASE}/users/search?q=${query}`);
    if (!res.ok) throw new Error("Search failed");
    return res.json();
  },

  getPending: async () => {
    const res = await fetchWithAuth(`${API_BASE}/pending/`);
    if (!res.ok) throw new Error("Failed to fetch pending");
    return res.json();
  },

  request: async (followingId: string) => {
    const res = await fetchWithAuth(`${API_BASE}/request`, {
      method: "POST",
      body: JSON.stringify({ followingId }),
    });
    if (!res.ok) throw new Error("Failed to send request");
    return res.json();
  },

  approve: async (requestId: string) => {
    const res = await fetchWithAuth(`${API_BASE}/approve`, {
      method: "POST",
      body: JSON.stringify({ requestId }),
    });
    if (!res.ok) throw new Error("Failed to approve");
    return res.json();
  },

  deny: async (requestId: string) => {
    const res = await fetchWithAuth(`${API_BASE}/deny`, {
      method: "POST",
      body: JSON.stringify({ requestId }),
    });
    if (!res.ok) throw new Error("Failed to deny");
    return res.json();
  },

  remove: async (friendId: string) => {
    const res = await fetchWithAuth(`${API_BASE}/remove`, {
      method: "POST",
      body: JSON.stringify({ friendId }),
    });
    if (!res.ok) throw new Error("Failed to remove friend");
    return res.json();
  },

  getFriends: async () => {
    const res = await fetchWithAuth(`${API_BASE}/friends/`);
    if (!res.ok) throw new Error("Failed to fetch friends");
    return res.json();
  },
};

// interfaces
interface SearchedUser {
  _id: string;
  username: string;
  fullname?: string;
}

interface FollowRequest {
  _id: string;
  followerId: string;
  username: string;
  fullname?: string;
}

interface Friend {
  id: string;
  username: string;
}

interface AddFriendModalProps {
  onClose: () => void;
  friends: Friend[];
  setFriends: Dispatch<SetStateAction<Friend[]>>;// direct state setter
}

// modal
export default function AddFriendModal({ onClose, friends, setFriends }: AddFriendModalProps) {
  // search state
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchedUser[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // pending requests state
  const [pendingRequests, setRequests] = useState<FollowRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // fetch pending requests
  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true);
      const currentUserId = localStorage.getItem("userId");

      if (!currentUserId) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await friendApi.getPending();
        setRequests(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleSearch = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    setSearched(true);
    setIsSearching(true);

    try {
      const data = await friendApi.search(query);
      const currentUserId = localStorage.getItem("userId");
      const filteredResults = data.filter((user: SearchedUser) => user._id !== currentUserId);
      setResults(filteredResults);
    } catch (error) {
      console.error(error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdd = async (userToFollow: SearchedUser) => {
    setLoadingId(userToFollow._id);
    try {
      const currentUserId = localStorage.getItem("userId");
      if (!currentUserId) {
        alert("Must be logged in to do this.");
        return;
      }
      await friendApi.request(userToFollow._id);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingId(null);
    }
  };

  const handleRemove = async (friendId: string) => {
    setLoadingId(friendId);
    try {
      const currentUserId = localStorage.getItem("userId");
      if (!currentUserId) return;
      
      setFriends((prev) => prev.filter((f) => f.id !== friendId));

      await friendApi.remove(friendId);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingId(null);
    }
  };

  const handleApprove = async (req: FollowRequest) => {
    setProcessingId(req._id);
    try {
      await friendApi.approve(req._id);

      setRequests((prev) => prev.filter((r) => r._id !== req._id));

      setFriends((prev) => {
        if (prev.some((f) => f.username === req.username)) return prev;
        return [...prev, { id: req.followerId, username: req.username }];
      });
    } catch (error) {
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeny = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await friendApi.deny(requestId);
      setRequests((prev) => prev.filter((req) => req._id !== requestId));
    } catch (error) {
      console.error(error);
    } finally {
      setProcessingId(null);
    }
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
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearched(false);
            }}
            placeholder="their_username"
            className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 text-sm bg-stone-50 text-stone-800 placeholder-stone-400 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:bg-white transition"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="px-4 py-2.5 rounded-xl text-white text-sm font-bold transition hover:opacity-90 disabled:opacity-70"
            style={{ backgroundColor: BLUE }}
          >
            {isSearching ? <Loader2 size={16} className="animate-spin" /> : "Search"}
          </button>
        </form>

        {searched && query.trim() && (
          <div className="mb-5 mt-2">
            {isSearching ? (
              <div className="p-4 text-center rounded-xl flex justify-center items-center gap-2" style={{ backgroundColor: BG }}>
                <Loader2 size={16} className="animate-spin text-stone-400" />
                <span className="text-sm text-stone-500">Searching database...</span>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-2">
                {results.map((user) => {
                  const isFriend = friends.some((f) => f.id === user._id);

                  return (
                    <div key={user._id} className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: BG }}>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white uppercase shrink-0"
                          style={{ backgroundColor: BLUE }}
                        >
                          {user.username[0]}
                        </div>
                        <span className="text-sm font-semibold text-stone-800">@{user.username}</span>
                      </div>
                      
                      {isFriend ? (
                        <button
                          onClick={() => handleRemove(user._id)}
                          disabled={loadingId === user._id}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 transition disabled:opacity-50 shrink-0 border border-red-200"
                        >
                          {loadingId === user._id ? "..." : "Remove"}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAdd(user)}
                          disabled={loadingId === user._id}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50 shrink-0"
                          style={{ backgroundColor: BLUE }}
                        >
                          {loadingId === user._id ? "..." : "Add"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center rounded-xl" style={{ backgroundColor: BG }}>
                <p className="text-sm text-stone-500 font-medium">No user found matching "{query}".</p>
              </div>
            )}
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

          {isLoading ? (
            <p className="text-sm text-stone-400 italic">Loading requests...</p>
          ) : pendingRequests.length === 0 ? (
            <p className="text-sm text-stone-400 italic">No pending requests right now.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {pendingRequests.map((req) => (
                <div key={req._id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: BG }}>
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 uppercase"
                      style={{ backgroundColor: BLUE }}
                    >
                      {req.username[0]}
                    </div>
                    <span className="text-sm font-semibold text-stone-800">@{req.username}</span>
                  </div>
                  <div className="flex gap-1.5">
                    {processingId === req._id ? (
                      <span className="text-xs text-stone-400 pr-4">Processing...</span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleApprove(req)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition hover:opacity-90"
                          style={{ backgroundColor: BLUE }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleDeny(req._id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-stone-500 bg-stone-100 hover:bg-stone-200 transition"
                        >
                          Deny
                        </button>
                      </>
                    )}
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