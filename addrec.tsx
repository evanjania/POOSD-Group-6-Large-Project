import { useState, type FormEvent } from "react";
import { X, Loader2, Star } from "lucide-react";
import { fetchWithAuth } from "../util/api";

const BLUE = "#1149A8";

type Category = "Movies" | "TV" | "Music"

//shape of recommendation object that will be sent back to parent page after successful add
export interface NewRec {
    id: string;
    title: string;
    category: Category;
    rating: number;
    notes: string;
    date: string;
    error: string;
}


//props the modal needs from dashboard
//onClose: closes modal window, onAddSuccess: sends NewRec back to dashboard state
interface AddRecModalProps {
    onClose:() => void;
    onAddSuccess: (rec: NewRec) => void;
}

// These are the categories shown in the dropdown.
// Keeping them in an array makes it easy to render the select options.
const CATEGORIES: Category[] = ["Movies", "TV", "Music"];

// This maps each category to an emoji for display in the dropdown.
const CATEGORY_EMOJI: Record<Category, string> = {
  Movies: "🎬",
  TV: "📺",
  Music: "🎵",
};


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



export default function AddRecModal({ onClose, onAddSuccess }: AddRecModalProps) {
    //title stores user title input
    const[title, setTitle] = useState("");
    //category stores the current dropdown selection, the default is movies
    const [category, setCategory] = useState<Category>("Movies");
    //rating stores user pick, default is 0 stars
    const [rating, setRating] = useState(0);
    //notes stores user text input
    const [notes, setNotes] = useState("");

    //loading tells ui when api request is running, helps disable buttons
    const [loading, setLoading] = useState(false);
    //message stores any success oor error text to show the user
    const [message, setMessage] = useState(""); 

    //shared Tailwind styling for input fields
    const fieldClass = "w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm bg-stone-50 text-stone-800 placeholder-stone-400 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:bg-white transition";
    

    //this function runs when the user submits the form
    //it validates the input, calls the backend api,
    //and updates the dashboard if the database insert was successful
    const handleSubmit = async (e: FormEvent) => {
        //prevent browser from refreshing page on form submit
        e.preventDefault();

        //clear old messages before starting a new request
        setMessage("");

        //title.trim() removes extra spaces from begin & end
        //check for a title because backend requires it
        if(!title.trim()) {
            setMessage("Please enter a title.");
            return;
        }
        //check for a star selection. backend requires it
        if(rating === 0) {
            setMessage("Please choose a rating.");
            return;
        }

        //get the logged in username from localStorage
        // /api/recs/add route expects username in request body
        const username = localStorage.getItem("username");

        //if username is missing, the user is logged out, display message
        if(!username) {
            setMessage("Could not find logged in user.");
            return;
        }

        try {
            //show loading state before staring the fetch call
            setLoading(true);

            //send recommendation data to backend to recommendations api route
            // POST /api/recs/add
            const response = await fetchWithAuth("/api/recs/add", {
                method: "POST",
                body: JSON.stringify({
                    username,
                    title: title.trim(), //trims the extra spaces
                    category,
                    rating,
                    notes: notes.trim()//trim extra spaces
                }),
            });

            //convert server response into json so we can read the message or error
            const data = await response.json();

            //if the response was not OK, show the server's error if available
            if(!response.ok) {
                setMessage(data.error || "Failed to add recommendation.");
                return;
            }

            //build new recommendation object for frontend state
            //backend returns insertedId as id
            //we store it so later actions like send/delete can use the real DB id
            const newRec: NewRec = {
                id: String(data.id),
                title: title.trim(),
                category,
                rating,
                notes: notes.trim(),
                date: data.date || "Today",
                error: "",
            };

            //tell the parent dashboard to add this rec to its rec list
            //this updates ui immediately after the database insert succeds
            onAddSuccess(newRec);
            //close modal after sucess
            onClose();

        }//end try
        catch (error) {
            //if fetch fails completly, usually means server/network problem
            console.error("ADD REC ERROR:", error);
            setMessage("Failed to connect to server.");
        } finally {
            //stop loading whether it succeeded or failed
            setLoading(false);
        }
    };//end handleSubmit

    return (
        // This fixed container covers the whole screen so the modal appears centered.
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Dark overlay behind the modal.
            Clicking the dark area closes the popup. */}
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />

        {/* This is the actual white modal box. */}
        <div className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md mx-4">
            {/* X button in the top right so the user can close the modal manually. */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition"
            >
                <X size={20} />
            </button>

            {/* Modal heading */}
            <h2 className="text-xl font-bold text-stone-900 mb-1">Add to your diary</h2>
            <p className="text-sm text-stone-400 mb-6">Save something worth recommending</p>

            {/* Form wrapper. onSubmit connects this form to handleSubmit above. */}
            <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title input */}
            <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                    Title
                </label>
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What are you recommending?"
                    className={fieldClass}
                    required
                />
            </div>

            {/* Category dropdown */}
            <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                Category
                </label>
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

            {/* Rating stars */}
            <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                    Rating
                </label>
            
            <StarInput value={rating} onChange={setRating} />
            </div>

            {/* Notes text area */}
            <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                    Notes
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Why should your friends check this out?"
                    className={fieldClass + " resize-none h-24"}
                />
            </div>

            {/* Error or status message */}
            {message && (
                <p className="text-sm font-semibold text-red-500">
                    {message}
                </p>
            )}

            {/* Submit button */}
            <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-sm text-white transition hover:opacity-90 mt-1 disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ backgroundColor: BLUE }}
            >
                {loading ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        Adding...
                    </>
                ) : (
                    "Add to Diary"
                )}
            </button>
        </form>
      </div>
    </div>
  );

}//end export AddRecModal