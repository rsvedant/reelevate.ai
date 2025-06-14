"use client"

import { useState, useEffect, useCallback } from "react"
import type { Message } from "@/lib/types"

const DB_NAME = "reelevateAI"
const DB_VERSION = 1
const MESSAGES_STORE = "chatMessages"

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

        // Create object store for messages if it doesn't exist
        if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
          const store = db.createObjectStore(MESSAGES_STORE, { keyPath: "id" })
          store.createIndex("timestamp", "timestamp", { unique: false })
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

  // Save messages to IndexedDB
  const saveMessages = useCallback(
    async (messages: Message[]) => {
      if (!db) return

      return new Promise<void>((resolve, reject) => {
        try {
          const transaction = db.transaction(MESSAGES_STORE, "readwrite")
          const store = transaction.objectStore(MESSAGES_STORE)

          // Clear existing messages
          const clearRequest = store.clear()

          clearRequest.onsuccess = () => {
            // Add all messages
            messages.forEach((message) => {
              store.add(message)
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

  // Load messages from IndexedDB
  const loadMessages = useCallback(async (): Promise<Message[]> => {
    if (!db) return []

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(MESSAGES_STORE, "readonly")
        const store = transaction.objectStore(MESSAGES_STORE)
        const index = store.index("timestamp")
        const request = index.getAll()

        request.onsuccess = () => {
          resolve(request.result)
        }

        request.onerror = (event) => {
          reject((event.target as IDBRequest).error)
        }
      } catch (error) {
        reject(error)
      }
    })
  }, [db])

  // Clear all messages from IndexedDB
  const clearAllMessages = useCallback(async (): Promise<void> => {
    if (!db) return

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(MESSAGES_STORE, "readwrite")
        const store = transaction.objectStore(MESSAGES_STORE)
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
    saveMessages,
    loadMessages,
    clearAllMessages,
  }
}
