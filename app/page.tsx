import ChatInterface from "@/components/chat-interface"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            Reelevate.AI
          </h1>
          <p className="text-zinc-400 mt-2">Chat with AI to craft your next viral reel</p>
        </header>

        <ChatInterface />
      </div>
    </main>
  )
}
