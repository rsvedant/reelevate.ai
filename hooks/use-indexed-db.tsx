"use client"

import { useState, useEffect, useCallback } from "react"
import type { Conversation } from "@/lib/types"

const DB_NAME = "reelevateAI"
const DB_VERSION = 1
const CONVERSATIONS_STORE = "conversations"

export function useIndexedDB() {
  const [db, setDb] = useState<IDBDatabase | null>(null)

  // Initialize the database
  useEffect(() => {
    const openDB = () => {
      if (!window.indexedDB) {
        console.error("Your browser doesn't support IndexedDB")
        return
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = (event) => {
        console.error("Database error:", (event.target as IDBRequest).error)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBRequest).result

        // Create object store for conversations if it doesn't exist
        if (!db.objectStoreNames.contains(CONVERSATIONS_STORE)) {
          const store = db.createObjectStore(CONVERSATIONS_STORE, { keyPath: "id" })
          store.createIndex("updatedAt", "updatedAt", { unique: false })
        }
      }

      request.onsuccess = (event) => {
        setDb((event.target as IDBRequest).result)
      }
    }

    openDB()

    // Close the database connection when the component unmounts
    return () => {
      if (db) {
        db.close()
      }
    }
  }, [])

  // Save a single conversation to IndexedDB
  const saveConversation = useCallback(
    async (conversation: Conversation) => {
      if (!db) return

      return new Promise<void>((resolve, reject) => {
        try {
          const transaction = db.transaction(CONVERSATIONS_STORE, "readwrite")
          const store = transaction.objectStore(CONVERSATIONS_STORE)

          const request = store.put(conversation)

          request.onsuccess = () => {
            resolve()
          }

          request.onerror = (event) => {
            reject((event.target as IDBRequest).error)
          }
        } catch (error) {
          reject(error)
        }
      })
    },
    [db],
  )

  // Save all conversations to IndexedDB
  const saveConversations = useCallback(
    async (conversations: Conversation[]) => {
      if (!db) return

      return new Promise<void>((resolve, reject) => {
        try {
          const transaction = db.transaction(CONVERSATIONS_STORE, "readwrite")
          const store = transaction.objectStore(CONVERSATIONS_STORE)

          // Clear existing conversations
          const clearRequest = store.clear()

          clearRequest.onsuccess = () => {
            // Add all conversations
            conversations.forEach((conversation) => {
              store.add(conversation)
            })
          }

          transaction.oncomplete = () => {
            resolve()
          }

          transaction.onerror = (event) => {
            reject((event.target as IDBRequest).error)
          }
        } catch (error) {
          reject(error)
        }
      })
    },
    [db],
  )

  // Load conversations from IndexedDB
  const loadConversations = useCallback(async (): Promise<Conversation[]> => {
    if (!db) return []

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(CONVERSATIONS_STORE, "readonly")
        const store = transaction.objectStore(CONVERSATIONS_STORE)
        const index = store.index("updatedAt")
        const request = index.getAll()

        request.onsuccess = () => {
          // Sort by updatedAt descending (newest first)
          const conversations = request.result.sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          )
          resolve(conversations)
        }

        request.onerror = (event) => {
          reject((event.target as IDBRequest).error)
        }
      } catch (error) {
        reject(error)
      }
    })
  }, [db])

  // Delete a conversation from IndexedDB
  const deleteConversation = useCallback(
    async (conversationId: string) => {
      if (!db) return

      return new Promise<void>((resolve, reject) => {
        try {
          const transaction = db.transaction(CONVERSATIONS_STORE, "readwrite")
          const store = transaction.objectStore(CONVERSATIONS_STORE)
          const request = store.delete(conversationId)

          request.onsuccess = () => {
            resolve()
          }

          request.onerror = (event) => {
            reject((event.target as IDBRequest).error)
          }
        } catch (error) {
          reject(error)
        }
      })
    },
    [db],
  )

  // Clear all conversations from IndexedDB
  const clearAllConversations = useCallback(async (): Promise<void> => {
    if (!db) return

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(CONVERSATIONS_STORE, "readwrite")
        const store = transaction.objectStore(CONVERSATIONS_STORE)
        const request = store.clear()

        request.onsuccess = () => {
          resolve()
        }

        request.onerror = (event) => {
          reject((event.target as IDBRequest).error)
        }
      } catch (error) {
        reject(error)
      }
    })
  }, [db])

  return {
    saveConversation,
    saveConversations,
    loadConversations,
    deleteConversation,
    clearAllConversations,
  }
}
