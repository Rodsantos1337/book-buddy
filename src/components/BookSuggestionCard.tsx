import { Check, ThumbsUp, X } from "lucide-react";
import { FALLBACK_COVER_SVG } from "../lib/constants";
import type { BookSuggestion } from "../types";

interface BookSuggestionCardProps {
  suggestion: BookSuggestion;
  onRemove: (id: string) => void;
  onInterested: (id: string) => void;
  onViewDetails: (id: string) => void;
}

export default function BookSuggestionCard({
  suggestion,
  onRemove,
  onInterested,
  onViewDetails,
}: BookSuggestionCardProps) {
  const { id, title, author, coverUrl, summary, reasonForSuggestion, status } = suggestion;
  const isInterested = status === "interested";

  return (
    <div
      className={`flex w-48 cursor-pointer flex-col gap-2 rounded-lg border bg-bg-1 p-3 ${isInterested ? "border-green/40 ring-1 ring-green/40" : "border-bg-3"}`}
      onClick={() => onViewDetails(id)}
    >
      <div className="flex h-44 items-center justify-center overflow-hidden rounded bg-bg-2">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={`Cover of ${title}`}
            className="h-full w-auto object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK_COVER_SVG;
            }}
          />
        ) : (
          <span className="text-xs text-grey-0">No Cover</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-fg">{title}</h3>
        <p className="truncate text-xs text-grey-0">{author}</p>
        <p className="line-clamp-2 text-xs text-grey-2">{summary}</p>
        <p className="line-clamp-1 text-xs italic text-grey-1">{reasonForSuggestion}</p>
      </div>

      <div className="mt-auto flex flex-col gap-1.5">
        {isInterested ? (
          <span className="flex items-center justify-center gap-1 rounded bg-green/10 px-2 py-1 text-xs font-medium text-green">
            <Check className="h-3 w-3" fill="currentColor" />
            Interested
          </span>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onInterested(id);
            }}
            className="flex cursor-pointer items-center justify-center gap-1 rounded bg-green/10 px-2 py-1.5 text-xs font-medium text-green hover:bg-green/20"
          >
            <ThumbsUp className="h-3 w-3" />
            Interested
          </button>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(id);
          }}
          className="flex cursor-pointer items-center justify-center gap-1 rounded bg-red/10 px-2 py-1.5 text-xs font-medium text-red hover:bg-red/20"
        >
          <X className="h-3 w-3" />
          Remove
        </button>
      </div>
    </div>
  );
}
