"use client";

import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import ReactMarkdown from 'react-markdown';
import { listen } from '@tauri-apps/api/event';

interface LlmModel {
  name: string;
  size_mb: number;
  url: string;
  description: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface DownloadProgress {
  progress: number;
  modelName: string;
  status?: string;
  total?: number;
  downloaded?: number;
  error?: string;
  message?: string;
}

const ReelLLMChat: React.FC = () => {
  const [models, setModels] = useState<LlmModel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedModel, setSelectedModel] = useState<LlmModel | null>(null);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadStatus, setDownloadStatus] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [thinking, setThinking] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [deletingModelName, setDeletingModelName] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Set up event listeners for download progress
    const unlisten = listen<DownloadProgress>('download-progress', (event) => {
      const { progress, status, error, message } = event.payload;
      
      setDownloadProgress(progress);
      
      if (status) {
        setDownloadStatus(status);
      }
      
      if (error) {
        alert(`Download error: ${message}`);
        setDownloading(false);
      }
      
      if (status?.startsWith('completed')) {
        setDownloading(false);
        setDownloadStatus(status);
      }
    });
    
    // Set up validation event listener
    const unlistenValidation = listen<DownloadProgress>('validation-progress', (event) => {
      const { progress } = event.payload;
      setDownloadStatus(`Validating model: ${Math.floor(progress)}%`);
    });
    
    return () => {
      unlisten.then(unlistenFn => unlistenFn());
      unlistenValidation.then(unlistenFn => unlistenFn());
    };
  }, []);

  useEffect(() => {
    // Fetch available models
    const fetchModels = async () => {
      try {
        const availableModels = await invoke('get_models') as LlmModel[];
        setModels(availableModels);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch models:', error);
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  useEffect(() => {
    // Scroll to bottom of chat
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleModelSelect = (model: LlmModel) => {
    setSelectedModel(model);
  };

  const handleDeleteModel = async (modelName: string) => {
    if (deleting) return;
    
    setDeleting(true);
    setDeletingModelName(modelName);
    try {
      const result = await invoke('delete_model', {
        modelName: modelName,
      }) as string;
      
      console.log(result);
      
      // If we're deleting the selected model, clear selection
      if (selectedModel?.name === modelName) {
        setSelectedModel(null);
      }
      
      // If we have messages and deleted the active model, clear the chat
      if (messages.length > 0) {
        setMessages([]);
      }
      
      // Show success message
      alert(`Model ${modelName} has been deleted.`);
      
    } catch (error) {
      console.error('Failed to delete model:', error);
      alert(`Error deleting model: ${error}`);
    } finally {
      setDeleting(false);
      setDeletingModelName(null);
    }
  };

  const handleDownloadModel = async () => {
    if (!selectedModel) return;

    setDownloading(true);
    setDownloadProgress(0);
    setDownloadStatus('Starting download...');
    
    try {
      const result = await invoke('download_model', {
        modelInfo: selectedModel,
      }) as string;
      
      console.log(result);
      
      // The "completed" status will be received via the event listener,
      // which will set downloading to false and add the welcome message
      
    } catch (error) {
      console.error('Failed to download model:', error);
      alert(`Error downloading model: ${error}`);
      setDownloading(false);
      setDownloadStatus('');
    }
  };
  
  // Add welcome message when download completes
  useEffect(() => {
    if (downloadStatus === 'completed' && !thinking) {
      // Add welcome message after model is loaded
      setMessages([
        { 
          role: 'assistant', 
          content: "I'm ready to help you create your reel story! What theme or concept would you like to explore?" 
        }
      ]);
      setDownloadStatus('');
    }
  }, [downloadStatus, thinking]);

  const handleSendMessage = async () => {
    if (!input.trim() || thinking) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setThinking(true);

    try {
      const response = await invoke('chat', {
        messages: [...messages, userMessage],
      }) as string;

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${error}`,
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  // Format bytes to a human-readable format
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col w-full max-w-4xl bg-black text-white rounded-lg shadow-lg">
      {/* Model Selection */}
      {!messages.length && (
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Select an AI Model for Your Reel Story</h2>
          
          {loading ? (
            <p>Loading available models...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {models.map(model => (
                <div 
                  key={model.name}
                  className={`p-4 border rounded-lg ${
                    selectedModel?.name === model.name ? 'border-blue-500 bg-blue-900' : 'border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => handleModelSelect(model)}
                    >
                      <h3 className="font-medium">{model.name}</h3>
                      <p className="text-sm text-gray-300 mt-1">{model.description}</p>
                      <p className="text-xs text-gray-400 mt-2">Size: {model.size_mb} MB</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Are you sure you want to delete ${model.name}?`)) {
                          handleDeleteModel(model.name);
                        }
                      }}
                      disabled={deleting}
                      className="ml-2 px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded disabled:bg-gray-700 disabled:cursor-not-allowed"
                    >
                      {deleting && deletingModelName === model.name ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <button
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-700 disabled:cursor-not-allowed"
            disabled={!selectedModel || downloading}
            onClick={handleDownloadModel}
          >
            {downloading ? 'Downloading...' : 'Download & Use Selected Model'}
          </button>
          
          {downloading && (
            <div className="mt-4">
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${downloadProgress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs mt-1 text-gray-400">
                <span>{downloadStatus || 'Downloading...'}</span>
                <span>{downloadProgress}%</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chat Interface */}
      {messages.length > 0 && (
        <>
          <div className="flex-1 p-4 overflow-y-auto max-h-[500px]">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-4 ${
                  msg.role === 'user' ? 'ml-auto bg-blue-900' : 'mr-auto bg-gray-800'
                } rounded-lg p-3 max-w-[80%]`}
              >
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            ))}
            <div ref={messagesEndRef} />
            
            {thinking && (
              <div className="flex items-center space-x-2 text-gray-400">
                <span>AI thinking</span>
                <span className="animate-pulse">...</span>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Describe your reel story idea..."
                className="flex-1 p-2 border rounded-lg bg-gray-800 border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={thinking}
              />
              <button
                onClick={handleSendMessage}
                disabled={thinking}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-700"
              >
                Send
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Ask the AI to help you craft a compelling reel story concept
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default ReelLLMChat;