import { useState, useEffect, useRef } from 'react';
import type { Message } from '../../types';
import { MessageAPI } from '../../api/api';
import './Messages.css';

interface Conversation {
  userId: number;
  username: string;
  lastMessage: string;
  lastMessageTime: string;
  isRead: boolean;
}

interface MessagesProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function Messages({ onSuccess, onError }: MessagesProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUsername, setSelectedUsername] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInbox();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchInbox = async () => {
    try {
      setLoading(true);
      const data = await MessageAPI.getInbox();

      // The inbox endpoint returns metadata; we need to fetch each conversation
      // to build the conversation list with last message info.
      // If the API returns conversation_user_ids, fetch each one.
      const convIds = data.conversation_user_ids || [];
      const convList: Conversation[] = [];

      for (const userId of convIds) {
        try {
          const convData = await MessageAPI.getConversation(userId);
          const msgs = convData.messages || [];
          const lastMsg = msgs[msgs.length - 1];
          convList.push({
            userId,
            username: convData.with_username || `User #${userId}`,
            lastMessage: lastMsg?.content || '',
            lastMessageTime: lastMsg?.created_at || '',
            isRead: lastMsg ? !lastMsg.is_read || lastMsg.sender === userId : true,
          });
        } catch {
          // Skip failed conversations
        }
      }

      setConversations(convList);
    } catch (error) {
      console.error('Failed to fetch inbox:', error);
      onError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (userId: number, username: string) => {
    setSelectedUserId(userId);
    setSelectedUsername(username);
    setLoadingMessages(true);

    try {
      const convData = await MessageAPI.getConversation(userId);
      setMessages(convData.messages || []);

      // Mark conversation as read in local state
      setConversations((prev) =>
        prev.map((c) => (c.userId === userId ? { ...c, isRead: true } : c))
      );
    } catch (error) {
      console.error('Failed to fetch conversation:', error);
      onError('Failed to load conversation');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSend = async () => {
    if (!selectedUserId || !newMessage.trim()) return;

    try {
      setSending(true);
      const message = await MessageAPI.send({
        recipient_id: selectedUserId,
        content: newMessage.trim(),
      });

      setMessages((prev) => [...prev, message]);
      setNewMessage('');

      // Update conversation list with new last message
      setConversations((prev) =>
        prev.map((c) =>
          c.userId === selectedUserId
            ? { ...c, lastMessage: newMessage.trim(), lastMessageTime: message.created_at }
            : c
        )
      );

      onSuccess('Message sent');
    } catch (error: any) {
      onError(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="messages-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="messages-page">
      <div className="messages-container">
        {/* Sidebar - Conversation List */}
        <div className="conversations-panel">
          <div className="conversations-header">
            <h2>Messages</h2>
          </div>

          <div className="conversations-list">
            {conversations.length === 0 ? (
              <div className="conversations-empty">
                <span className="empty-icon">💬</span>
                <p>No conversations yet</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.userId}
                  className={`conversation-item ${selectedUserId === conv.userId ? 'active' : ''} ${!conv.isRead ? 'unread' : ''}`}
                  onClick={() => selectConversation(conv.userId, conv.username)}
                >
                  <div className="conversation-avatar">
                    {getInitials(conv.username)}
                  </div>
                  <div className="conversation-info">
                    <div className="conversation-top">
                      <span className="conversation-name">{conv.username}</span>
                      <span className="conversation-time">
                        {conv.lastMessageTime ? formatTime(conv.lastMessageTime) : ''}
                      </span>
                    </div>
                    <span className="conversation-preview">
                      {conv.lastMessage.length > 50
                        ? conv.lastMessage.substring(0, 50) + '...'
                        : conv.lastMessage}
                    </span>
                  </div>
                  {!conv.isRead && <div className="unread-dot"></div>}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Panel */}
        <div className="chat-panel">
          {selectedUserId ? (
            <>
              <div className="chat-header">
                <div className="chat-header-avatar">
                  {getInitials(selectedUsername)}
                </div>
                <div className="chat-header-info">
                  <h3>{selectedUsername}</h3>
                </div>
              </div>

              <div className="chat-messages">
                {loadingMessages ? (
                  <div className="chat-loading">
                    <div className="spinner"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="chat-empty">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.sender !== selectedUserId;
                    return (
                      <div
                        key={msg.id}
                        className={`message-bubble ${isOwn ? 'own' : 'other'}`}
                      >
                        <div className="message-content">{msg.content}</div>
                        <div className="message-time">{formatTime(msg.created_at)}</div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-input-area">
                <textarea
                  className="chat-input"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  rows={1}
                  disabled={sending}
                />
                <button
                  className="chat-send-btn"
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sending}
                >
                  {sending ? '...' : '➤'}
                </button>
              </div>
            </>
          ) : (
            <div className="chat-placeholder">
              <span className="placeholder-icon">💬</span>
              <h3>Select a conversation</h3>
              <p>Choose a conversation from the sidebar to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}