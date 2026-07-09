import { Settings } from "lucide-react";

interface HeaderProps {
  onOpenSettings: () => void;
}

export default function Header({ onOpenSettings }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-bg-3 bg-bg-1 px-6 py-4">
      <h1 className="text-xl font-bold tracking-tight">BookBuddy</h1>
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
