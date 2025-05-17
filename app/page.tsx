"use client";

import React from "react";
import ReelLLMChat from "./components/ReelLLMChat";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4">
      <h1 className="text-2xl font-bold mb-4">Reelevate.ai - Reel Automation</h1>
      <ReelLLMChat />
    </main>
  );
}
