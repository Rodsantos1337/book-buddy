import { Check, ThumbsUp, X } from "lucide-react";
import { FALLBACK_COVER_SVG } from "../lib/constants";
import type { BookSuggestion } from "../types";

interface BookDetailDrawerProps {
  suggestion: BookSuggestion | null;
  onClose: () => void;
  onInterested: (id: string) => void;
  onRemove: (id: string) => void;
}

export default function BookDetailDrawer({ suggestion, onClose, onInterested, onRemove }: BookDetailDrawerProps) {
  if (!suggestion) return null;

  const { id, title, author, coverUrl, summary, reasonForSuggestion, status } = suggestion;
  const isInterested = status === "interested";

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/20" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-40 w-80 translate-x-0 border-l border-bg-3 bg-bg-1 shadow-2xl transition-transform duration-200">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-bg-3 px-4 py-3">
            <span className="text-sm font-medium text-fg">Book Details</span>
            <button onClick={onClose} className="cursor-pointer rounded p-1 text-grey-0 hover:bg-bg-2 hover:text-fg">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5">
            <div className="mb-5 flex justify-center">
              <div className="flex h-64 w-44 items-center justify-center overflow-hidden rounded-lg bg-bg-2">
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
            </div>

            <h2 className="text-lg font-semibold leading-tight text-fg">{title}</h2>
            <p className="mt-0.5 text-sm text-grey-0">{author}</p>

            <div className="mt-4 space-y-3">
              <div>
                <p className="mb-1 text-xs font-medium text-grey-1 uppercase tracking-wider">Summary</p>
                <p className="text-sm leading-relaxed text-grey-2">{summary}</p>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium text-grey-1 uppercase tracking-wider">Why this fits</p>
                <p className="text-sm leading-relaxed italic text-grey-1">{reasonForSuggestion}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-bg-3 px-4 py-3">
            <div className="flex gap-2">
              {isInterested ? (
                <span className="flex flex-1 items-center justify-center gap-1.5 rounded bg-green/10 px-3 py-2 text-sm font-medium text-green">
                  <Check className="h-4 w-4" fill="currentColor" />
                  Interested
                </span>
              ) : (
                <button
                  onClick={() => onInterested(id)}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded bg-green/10 px-3 py-2 text-sm font-medium text-green hover:bg-green/20"
                >
                  <ThumbsUp className="h-4 w-4" />
                  Interested
                </button>
              )}

              <button
                onClick={() => onRemove(id)}
                className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded bg-red/10 px-3 py-2 text-sm font-medium text-red hover:bg-red/20"
              >
                <X className="h-4 w-4" />
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
