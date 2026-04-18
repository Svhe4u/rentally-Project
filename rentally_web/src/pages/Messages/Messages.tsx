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
  listingTitle?: string | null;
}

interface MessagesProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function Messages({ onSuccess, onError }: MessagesProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUsername, setSelectedUsername] = useState('');
  const [selectedListingTitle, setSelectedListingTitle] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedUserRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    selectedUserRef.current = selectedUserId;
  }, [selectedUserId]);

  useEffect(() => {
    fetchInbox();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    const token = localStorage.getItem('access');
    if (!token) return;

    // Use ws:// for local dev, wss:// for production
    const wsUrl = `ws://localhost:8000/ws/chat/?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat.message') {
          const msg = data.message;
          const senderId = msg.sender;

          // If the message is from the user we are currently chatting with
          if (selectedUserRef.current === senderId) {
            setMessages((prev) => [...prev, msg]);
            // Can optionally mark as read here automatically
          }

          // Update conversation list
          setConversations((prev) => {
            const existingIndex = prev.findIndex((c) => c.userId === senderId);
            if (existingIndex >= 0) {
              const newList = [...prev];
              newList[existingIndex] = {
                ...newList[existingIndex],
                lastMessage: msg.content,
                lastMessageTime: msg.created_at,
                isRead: selectedUserRef.current === senderId,
              };
              const conv = newList.splice(existingIndex, 1)[0];
              newList.unshift(conv); // move to top
              return newList;
            } else {
              return [{
                userId: senderId,
                username: `Шинэ мессеж #${senderId}`, // Will need real fetch for name IRL
                lastMessage: msg.content,
                lastMessageTime: msg.created_at,
                isRead: selectedUserRef.current === senderId,
                listingTitle: msg.listing?.title || null,
              }, ...prev];
            }
          });
        }
      } catch (err) {
        console.error("Error parsing websocket message", err);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      // basic reconnect could be added here
    };

    wsRef.current = ws;
  };

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

      const convList: Conversation[] = (data.conversations || []).map((conv) => ({
        userId: conv.partner_id,
        username: conv.partner_name,
        lastMessage: conv.last_message_text,
        lastMessageTime: conv.last_message_created,
        isRead: conv.unread_count === 0,
        listingTitle: conv.listing_title,
      }));

      setConversations(convList);
    } catch (error) {
      console.error('Failed to fetch inbox:', error);
      onError('Мессеж уншиж чадсангүй');
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (userId: number, username: string, listingTitle?: string | null) => {
    setSelectedUserId(userId);
    setSelectedUsername(username);
    setSelectedListingTitle(listingTitle || null);
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
      onError('Харилцан яриа уншиж чадсангүй');
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

      onSuccess('Мессеж илгээгдлээ');
    } catch (error: any) {
      onError(error.message || 'Мессеж илгээж чадсангүй');
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
      return 'Өчигдөр';
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
            <h2>Мессеж</h2>
          </div>

          <div className="conversations-list">
            {conversations.length === 0 ? (
              <div className="conversations-empty">
                <span className="empty-icon">💬</span>
                <p>Одоогоор харилцан яриа байхгүй байна</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.userId}
                  className={`conversation-item ${selectedUserId === conv.userId ? 'active' : ''} ${!conv.isRead ? 'unread' : ''}`}
                  onClick={() => selectConversation(conv.userId, conv.username, conv.listingTitle)}
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
                    {conv.listingTitle && (
                      <span className="conversation-listing" style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '2px' }}>
                        🏨 {conv.listingTitle}
                      </span>
                    )}
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
                  {selectedListingTitle && (
                    <span className="chat-header-listing" style={{ fontSize: '0.8rem', color: '#666' }}>
                      Сонирхож буй байр: <strong>{selectedListingTitle}</strong>
                    </span>
                  )}
                </div>
              </div>

              <div className="chat-messages">
                {loadingMessages ? (
                  <div className="chat-loading">
                    <div className="spinner"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="chat-empty">
                    <p>Одоогоор мессеж байхгүй байна. Яриагаа эхлүүлээрэй!</p>
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
                  placeholder="Мессеж бичих..."
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
              <h3>Харилцан яриа сонгоно уу</h3>
              <p>Мессеж бичихийн тулд хажуугийн самбараас харилцан яриа сонгоно уу</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}