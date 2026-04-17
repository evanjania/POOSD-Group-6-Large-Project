// React hook for storing component state
import { useState, type FormEvent } from "react";

// icons used in the modal UI
import { X, Send} from "lucide-react";

// color constants used for styling buttons and labels
const BLUE = "#1149A8";
const BG = "#F4F3F1";


// these are the allowed categories for recommendations
// defining them as a type prevents invalid values from being used
type Category = "Movies" | "TV" | "Music";


// shape of a recommendation object coming from dashboard.tsx
// this keeps the modal strongly typed and prevents missing fields

interface Rec
{
	id: string;
	title: string;
	category: Category;
	rating: number;
	notes: string;
	date: string;
}


// props expected from dashboard.tsx
// dashboard controls the modal behavior and passes functions into it
interface RecDetailModalProps
{
	rec: Rec;								// recommendation currently being viewed
	onClose: () => void;					// closes modal
	onSend: () => void;						// opens SendRec modal
	onDelete: (id: string) => void;			// deletes recommendation
	onEdit: (updatedRec: Rec) => Promise<void>;	// updates recommendation
}


// category dropdown options
// storing separately lets us reuse easily
const CATEGORIES: Category[] = ["Movies", "TV", "Music"];


// emoji displayed beside category labels
// improves UI readability
const CATEGORY_EMOJI: Record<Category, string> =
{
	Movies: "🎬",
	TV: "📺",
	Music: "🎵",
};


// reusable component that displays filled/unfilled stars
// used only for viewing rating (not editing)
function StarRating({ rating, size = 18 }: { rating: number; size?: number })
{
	return (
		<div className="flex gap-0.5">
		{
			[1,2,3,4,5].map((s) =>
			(
				<span
					key={s}
					className="text-yellow-400"
					style={{ fontSize: `${size}px` }}
				>
					{s <= rating ? "★" : "☆"}
				</span>
			))
		}
		</div>
	);
}


// main modal component
export default function RecDetailModal(
{
	rec,
	onClose,
	onSend,
	onDelete,
	onEdit
}: RecDetailModalProps)
{
	// controls whether modal is showing READ MODE or EDIT MODE
	// default is read-only view
	const [isEditing, setIsEditing] = useState(false);


	// editable versions of recommendation fields
	// initialized with existing values so user can modify them
	const [title, setTitle] = useState(rec.title);
	const [category, setCategory] = useState<Category>(rec.category);
	const [rating, setRating] = useState(rec.rating);
	const [notes, setNotes] = useState(rec.notes);


	// loading state disables button during API request
	const [loading, setLoading] = useState(false);


	// message shown if validation fails or request errors
	const [message, setMessage] = useState("");


	// runs when user presses SAVE after editing
	// sends updated recommendation back to dashboard.tsx
	const handleSave = async (e: FormEvent) =>
	{
		// prevents browser page refresh
		e.preventDefault();

		// clear previous messages
		setMessage("");


		// validate title
		if(!title.trim())
		{
			setMessage("Please enter a title.");
			return;
		}


		// validate rating
		if(rating < 1 || rating > 5)
		{
			setMessage("Please choose a rating from 1 to 5.");
			return;
		}


		try
		{
			// show loading spinner
			setLoading(true);


			// send updated recommendation back to dashboard
			// dashboard handles backend PATCH request
			await onEdit(
			{
				...rec,
				title: title.trim(),
				category,
				rating,
				notes: notes.trim()
			});


			// exit edit mode after successful save
			setIsEditing(false);
		}
		catch(error)
		{
			console.error("EDIT MODAL SAVE ERROR:", error);
			setMessage("Failed to save changes.");
		}
		finally
		{
			setLoading(false);
		}
	};


	// runs when DELETE button pressed
	// removes recommendation then closes modal
	const handleDelete = () =>
	{
		onDelete(rec.id);
		onClose();
	};


	return(
		<div className="fixed inset-0 z-50 flex items-center justify-center">

			{/* background overlay closes modal when clicked */}
			<div
				className="absolute inset-0 bg-black/40"
				onClick={onClose}
			/>

			{/* modal container */}
			<div className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md mx-4">

				{/* close button (top right X icon) */}
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition"
				>
					<X size={20}/>
				</button>


				{/* READ MODE (default view) */}
				{
					!isEditing ? (
					<>

						{/* category label */}
						<span
							className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3"
							style={{ backgroundColor: `${BLUE}18`, color: BLUE }}
						>
							{CATEGORY_EMOJI[rec.category]} {rec.category}
						</span>


						{/* recommendation title */}
						<h2 className="text-2xl font-bold text-stone-900 mb-2">
							{rec.title}
						</h2>


						{/* star rating display */}
						<StarRating rating={rec.rating} size={18}/>


						{/* notes box */}
						<div
							className="mt-4 p-4 rounded-2xl"
							style={{ backgroundColor: BG }}
						>
							<p className="text-sm text-stone-600 leading-relaxed">
								{rec.notes || "No notes added."}
							</p>
						</div>


						{/* date added */}
						<p className="text-xs text-stone-400 mt-3">
							Added {rec.date}
						</p>


						{/* SEND recommendation button */}
						<button
							onClick={onSend}
							className="mt-5 w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition hover:opacity-90"
							style={{ backgroundColor: BLUE }}
						>
							<Send size={15}/>
							Send to a Friend
						</button>


						{/* switch to edit mode */}
						<button
							onClick={() => setIsEditing(true)}
							className="mt-3 w-full py-3 rounded-xl font-bold text-sm border-2 transition hover:opacity-90"
							style={{ color: BLUE, borderColor: BLUE }}
						>
							Edit Recommendation
						</button>


						{/* delete recommendation */}
						<button
							onClick={handleDelete}
							className="mt-3 w-full py-3 rounded-xl font-bold text-sm text-white bg-red-500 hover:bg-red-600 transition"
						>
							Delete Recommendation
						</button>

					</>
					)


					/* EDIT MODE */
					: (

					<form onSubmit={handleSave} className="space-y-4">

						<h2 className="text-xl font-bold text-stone-900 mb-1">
							Edit Recommendation
						</h2>

						<p className="text-sm text-stone-400 mb-4">
							Update the fields below
						</p>


						{/* title input */}
						<input
							value={title}
							onChange={(e)=>setTitle(e.target.value)}
							className="w-full px-4 py-2.5 rounded-xl border border-stone-200"
						/>


						{/* category dropdown */}
						<select
							value={category}
							onChange={(e)=>setCategory(e.target.value as Category)}
							className="w-full px-4 py-2.5 rounded-xl border border-stone-200"
						>
							{
								CATEGORIES.map((c)=>
								(
									<option key={c} value={c}>
										{CATEGORY_EMOJI[c]} {c}
									</option>
								))
							}
						</select>


						{/* star rating input */}
						<div className="flex gap-1">
						{
							[1,2,3,4,5].map((starValue)=>(
								<button
									key={starValue}
									type="button"
									onClick={()=>setRating(starValue)}
								>
									{starValue <= rating ? "★" : "☆"}
								</button>
							))
						}
						</div>


						{/* notes input */}
						<textarea
							value={notes}
							onChange={(e)=>setNotes(e.target.value)}
							className="w-full px-4 py-2.5 rounded-xl border border-stone-200"
						/>


						{/* error message */}
						{message && <p className="text-red-500">{message}</p>}


						{/* save button */}
						<button
							type="submit"
							disabled={loading}
							className="w-full py-3 rounded-xl font-bold text-white"
							style={{ backgroundColor: BLUE }}
						>
							{
								loading
								? "Saving..."
								: "Save Changes"
							}
						</button>


						{/* cancel editing */}
						<button
							type="button"
							onClick={() =>
							{
								setTitle(rec.title);
								setCategory(rec.category);
								setRating(rec.rating);
								setNotes(rec.notes);
								setMessage("");
								setIsEditing(false);
							}}
							className="w-full py-3 rounded-xl font-bold bg-stone-100"
						>
							Cancel
						</button>

					</form>
					)
				}

			</div>
		</div>
	);
}