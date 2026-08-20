import { useState, useCallback } from "react";
import { useChat } from "./hooks/useChat";
import Header from "./components/Header";
import ChatContainer from "./components/ChatContainer";
import BookBoard from "./components/BookBoard";
import BookDetailDrawer from "./components/BookDetailDrawer";
import SettingsModal from "./components/SettingsModal";

export default function App() {
  const {
    messages,
    boardBooks,
    isLoading,
    error,
    settings,
    updateSettings,
    resetChat,
    sendMessage,
    removeSuggestion,
    markInterested,
  } = useChat();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [detailBookId, setDetailBookId] = useState<string | null>(null);

  const detailBook = detailBookId ? (boardBooks.find((b) => b.id === detailBookId) ?? null) : null;

  const handleViewDetails = useCallback((id: string) => setDetailBookId(id), []);
  const handleCloseDetails = useCallback(() => setDetailBookId(null), []);

  return (
    <div className="flex h-dvh flex-col">
      <Header hasStarted={messages.length > 0} onReset={resetChat} onOpenSettings={() => setSettingsOpen(true)} />
      <main className="flex flex-1 overflow-hidden">
        <section className="flex w-2/5 min-w-0 flex-col overflow-hidden border-r border-bg-3">
          <ChatContainer messages={messages} isLoading={isLoading} error={error} onSend={sendMessage} />
        </section>
        <section className="flex w-3/5 min-w-0 flex-col overflow-hidden">
          <BookBoard
            books={boardBooks}
            onRemove={removeSuggestion}
            onInterested={markInterested}
            onViewDetails={handleViewDetails}
          />
        </section>
      </main>
      <BookDetailDrawer
        suggestion={detailBook}
        onClose={handleCloseDetails}
        onInterested={markInterested}
        onRemove={removeSuggestion}
      />
      {settingsOpen && (
        <SettingsModal settings={settings} onSave={updateSettings} onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}
