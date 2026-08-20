import { RotateCcw, Settings } from "lucide-react";

interface HeaderProps {
  hasStarted: boolean;
  onReset: () => void;
  onOpenSettings: () => void;
}

export default function Header({ hasStarted, onReset, onOpenSettings }: HeaderProps) {
  const handleReset = () => {
    if (window.confirm("Start a new conversation? This will clear the chat and the book board.")) {
      onReset();
    }
  };

  return (
    <header className="flex items-center justify-between border-b border-bg-3 bg-bg-1 px-6 py-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold tracking-tight">BookBuddy</h1>
        {hasStarted && (
          <button
            onClick={handleReset}
            className="cursor-pointer rounded-lg p-2 text-grey-0 hover:bg-bg-2 hover:text-fg"
            title="Start a new conversation"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>
      <button
        onClick={onOpenSettings}
        className="cursor-pointer rounded-lg p-2 text-grey-0 hover:bg-bg-2 hover:text-fg"
        title="Settings"
      >
        <Settings className="h-5 w-5" />
      </button>
    </header>
  );
}
