"use client"

import { useState, useEffect, useCallback } from "react"
import type { Conversation } from "@/lib/types"

const DB_NAME = "reelevateAI"
const DB_VERSION = 1
const CONVERSATIONS_STORE = "conversations"

export function useIndexedDB() {
  const [db, setDb] = useState<IDBDatabase | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const openDB = () => {
      if (!window.indexedDB) {
        console.error("Your browser doesn't support IndexedDB")
        setIsReady(true) // Set ready even if not supported to prevent infinite loading
        return
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = (event) => {
        console.error("Database error:", (event.target as IDBRequest).error)
        setIsReady(true) // Set ready even on error to prevent infinite loading
      }

      request.onupgradeneeded = (event) => {
        console.log("Database upgrade needed")
        const db = (event.target as IDBRequest).result

        // Create object store for conversations if it doesn't exist
        if (!db.objectStoreNames.contains(CONVERSATIONS_STORE)) {
          console.log("Creating conversations store")
          const store = db.createObjectStore(CONVERSATIONS_STORE, { keyPath: "id" })
          store.createIndex("updatedAt", "updatedAt", { unique: false })
          store.createIndex("createdAt", "createdAt", { unique: false })
        }
      }

      request.onsuccess = (event) => {
        console.log("Database opened successfully")
        const database = (event.target as IDBRequest).result
        setDb(database)
        setIsReady(true)
      }
    }

    openDB()

    return () => {
      if (db) {
        db.close()
      }
    }
  }, [])

  // Save a single conversation to IndexedDB
  const saveConversation = useCallback(
    async (conversation: Conversation) => {
      if (!db || !isReady) {
        console.warn("Database not ready for saving")
        return
      }

      return new Promise<void>((resolve, reject) => {
        try {
          console.log("Saving conversation:", conversation.id)
          const transaction = db.transaction(CONVERSATIONS_STORE, "readwrite")
          const store = transaction.objectStore(CONVERSATIONS_STORE)

          const request = store.put(conversation)

          request.onsuccess = () => {
            console.log("Conversation saved successfully:", conversation.id)
            resolve()
          }

          request.onerror = (event) => {
            console.error("Error saving conversation:", (event.target as IDBRequest).error)
            reject((event.target as IDBRequest).error)
          }

          transaction.onerror = (event) => {
            console.error("Transaction error:", event)
            reject(new Error("Transaction failed"))
          }
        } catch (error) {
          console.error("Error in saveConversation:", error)
          reject(error)
        }
      })
    },
    [db, isReady],
  )

  // Load conversations from IndexedDB
  const loadConversations = useCallback(async (): Promise<Conversation[]> => {
    if (!db || !isReady) {
      console.warn("Database not ready for loading")
      return []
    }

    return new Promise((resolve, reject) => {
      try {
        console.log("Loading conversations from IndexedDB")
        const transaction = db.transaction(CONVERSATIONS_STORE, "readonly")
        const store = transaction.objectStore(CONVERSATIONS_STORE)
        const request = store.getAll()

        request.onsuccess = () => {
          console.log("Raw conversations loaded:", request.result)
          // Sort by updatedAt descending
          const conversations = request.result.sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          )
          console.log("Sorted conversations:", conversations)
          resolve(conversations)
        }

        request.onerror = (event) => {
          console.error("Error loading conversations:", (event.target as IDBRequest).error)
          reject((event.target as IDBRequest).error)
        }

        transaction.onerror = (event) => {
          console.error("Transaction error during load:", event)
          reject(new Error("Load transaction failed"))
        }
      } catch (error) {
        console.error("Error in loadConversations:", error)
        reject(error)
      }
    })
  }, [db, isReady])

  // Delete a conversation from IndexedDB
  const deleteConversation = useCallback(
    async (conversationId: string) => {
      if (!db || !isReady) {
        console.warn("Database not ready for deletion")
        return
      }

      return new Promise<void>((resolve, reject) => {
        try {
          console.log("Deleting conversation:", conversationId)
          const transaction = db.transaction(CONVERSATIONS_STORE, "readwrite")
          const store = transaction.objectStore(CONVERSATIONS_STORE)
          const request = store.delete(conversationId)

          request.onsuccess = () => {
            console.log("Conversation deleted successfully:", conversationId)
            resolve()
          }

          request.onerror = (event) => {
            console.error("Error deleting conversation:", (event.target as IDBRequest).error)
            reject((event.target as IDBRequest).error)
          }
        } catch (error) {
          console.error("Error in deleteConversation:", error)
          reject(error)
        }
      })
    },
    [db, isReady],
  )

  const clearAllConversations = useCallback(async (): Promise<void> => {
    if (!db || !isReady) {
      console.warn("Database not ready for clearing")
      return
    }

    return new Promise((resolve, reject) => {
      try {
        console.log("Clearing all conversations")
        const transaction = db.transaction(CONVERSATIONS_STORE, "readwrite")
        const store = transaction.objectStore(CONVERSATIONS_STORE)
        const request = store.clear()

        request.onsuccess = () => {
          console.log("All conversations cleared successfully")
          resolve()
        }

        request.onerror = (event) => {
          console.error("Error clearing conversations:", (event.target as IDBRequest).error)
          reject((event.target as IDBRequest).error)
        }
      } catch (error) {
        console.error("Error in clearAllConversations:", error)
        reject(error)
      }
    })
  }, [db, isReady])

  return {
    saveConversation,
    loadConversations,
    deleteConversation,
    clearAllConversations,
    isReady,
  }
}
