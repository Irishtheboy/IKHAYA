import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { leadService } from '../../services/leadService';
import { getCollectionPath } from '../../types/firestore-schema';
import { Message } from '../../types/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface MessagingInterfaceProps {
  leadId: string;
  recipientName: string;
}

/**
 * Messaging Interface Component
 * Chat-style interface for communication between landlords and tenants
 * Includes real-time message updates using Firestore listeners
 *
 * Requirements: 4.3, 4.4, 4.5, 4.6 - Lead Generation and Communication
 */
export const MessagingInterface: React.FC<MessagingInterfaceProps> = ({
  leadId,
  recipientName,
}) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Set up real-time listener for messages
  useEffect(() => {
    if (!leadId) return;

    const messagesCollectionPath = getCollectionPath.messages(leadId);
    const messagesQuery = query(
      collection(db, messagesCollectionPath),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messagesData: Message[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Message[];

        setMessages(messagesData);
        scrollToBottom();

        // Mark unread messages as read
        messagesData.forEach((msg) => {
          if (!msg.read && msg.senderId !== currentUser?.uid) {
            leadService.markMessageAsRead(leadId, msg.id).catch((err) => {
              console.error('Error marking message as read:', err);
            });
          }
        });
      },
      (err) => {
        console.error('Error listening to messages:', err);
        setError('Failed to load messages');
      }
    );

    return () => unsubscribe();
  }, [leadId, currentUser?.uid]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentUser) {
      setError('You must be logged in to send messages');
      return;
    }

    if (!newMessage.trim()) {
      return;
    }

    setLoading(true);

    try {
      await leadService.sendMessage({
        leadId,
        senderId: currentUser.uid,
        content: newMessage.trim(),
      });

      setNewMessage('');
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold">Conversation with {recipientName}</h2>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderId === currentUser?.uid;
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    isOwnMessage
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {formatTimestamp(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mb-2 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="px-6 py-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={1000}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !newMessage.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {newMessage.length}/1000 characters
        </p>
      </form>
    </div>
  );
};

export default MessagingInterface;
