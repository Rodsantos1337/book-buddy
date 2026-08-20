import { RotateCcw, Settings } from "lucide-react";

interface HeaderProps {
  hasStarted: boolean;
  onReset: () => void;
  onOpenSettings: () => void;
}

export default function Header({ hasStarted, onReset, onOpenSettings }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-bg-3 bg-bg-1 px-6 py-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold tracking-tight">BookBuddy</h1>
        <button
          onClick={() => {
            if (window.confirm("Start a new conversation? This will clear the chat and the book board.")) {
              onReset();
            }
          }}
          className="cursor-pointer rounded-lg p-2 text-grey-0 hover:bg-bg-2 hover:text-fg"
          title="Reset conversation"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <a
          href="https://github.com/Rodsantos1337/book-buddy"
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer rounded-lg p-2 text-grey-0 hover:bg-bg-2 hover:text-fg"
          title="GitHub repo"
        >
          <span className="text-sm font-medium">GitHub</span>
        </a>
        <button
          onClick={onOpenSettings}
          className="cursor-pointer rounded-lg p-2 text-grey-0 hover:bg-bg-2 hover:text-fg"
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
