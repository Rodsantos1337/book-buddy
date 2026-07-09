import type { BookSuggestion } from "../types";
import BookSuggestionCard from "./BookSuggestionCard";

interface BookBoardProps {
  books: BookSuggestion[];
  onRemove: (id: string) => void;
  onInterested: (id: string) => void;
  onViewDetails: (id: string) => void;
}

export default function BookBoard({ books, onRemove, onInterested, onViewDetails }: BookBoardProps) {
  const visible = books.filter((b) => b.status !== "removed");

  if (visible.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center text-grey-1">
          <p className="text-sm">Book recommendations will appear here</p>
          <p className="mt-1 text-xs">as you chat with BookBuddy.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-bg-3 px-5 py-3">
        <p className="text-sm text-grey-0">
          Books on the board <span className="text-fg font-semibold">({visible.length})</span>
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="flex flex-row flex-wrap gap-3 content-start">
          {visible.map((book) => (
            <BookSuggestionCard
              key={book.id}
              suggestion={book}
              onRemove={onRemove}
              onInterested={onInterested}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
