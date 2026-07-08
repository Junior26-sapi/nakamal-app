import React, { useState, useEffect, useRef } from 'react';
import { storage } from '../lib/storage';
import { User } from '../types';
import { Send, User as UserIcon, CheckCheck, Clock, Search, MessageSquare, Users, Plus, X, Hash, ShoppingCart, Truck, AlertCircle, Package, ChevronRight, FileText, Image, Video, Paperclip } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { feedbackService } from '../services/feedbackService';
import { chatService, Chat, ChatMessage } from '../services/chatService';
import { useRealtime } from '../contexts/RealtimeContext';
import { useLanguage } from '../contexts/LanguageContext';

interface MessagesProps {
  user: User;
}

export default function Messages({ user }: MessagesProps) {
  const { triggerVibration, sendBroadcast } = useRealtime();
  const { locale, t } = useLanguage();
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'chats' | 'b2b'>('chats');
  const [inputText, setInputText] = useState('');
  const [searchContact, setSearchContact] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingControllerRef = useRef<{ setTyping: (v: boolean) => void, unsubscribe: () => void } | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaPreview, setMediaPreview] = useState<{ url: string; type: 'image' | 'video'; name: string } | null>(null);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [orderItems, setOrderItems] = useState('');

  const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});
  const [translatingMessageIds, setTranslatingMessageIds] = useState<Record<string, boolean>>({});

  const presets = [
    {
      id: 'harvest',
      name: '🌿 Penticost Kava Harvest',
      type: 'image' as const,
      url: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'traditional_shell',
      name: '🥥 Nakamal Coconut Shell Serving',
      type: 'image' as const,
      url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'port_vila',
      name: '🏢 Port Vila Kava Lounge',
      type: 'image' as const,
      url: 'https://images.unsplash.com/photo-1578345218746-50a229b3d0f8?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'tropical_sunset',
      name: '🌴 Palm Trees Coastal Sunset Video',
      type: 'video' as const,
      url: 'https://assets.mixkit.co/videos/preview/mixkit-beautiful-landscape-of-a-tropical-sunset-with-palm-trees-43243-large.mp4',
    },
    {
      id: 'island_wave',
      name: '🌊 Ocean Wave Break Video',
      type: 'video' as const,
      url: 'https://assets.mixkit.co/videos/preview/mixkit-wave-in-the-ocean-close-up-vibe-42823-large.mp4',
    },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setMediaPreview({
        url: result,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        name: file.name
      });
      triggerVibration('light');
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  const handleTranslateMessage = async (msgId: string, text: string) => {
    if (translatingMessageIds[msgId]) return;
    
    // Toggle back if already translated
    if (translatedMessages[msgId]) {
      setTranslatedMessages(prev => {
        const copy = { ...prev };
        delete copy[msgId];
        return copy;
      });
      return;
    }

    setTranslatingMessageIds(prev => ({ ...prev, [msgId]: true }));
    triggerVibration('light');

    try {
      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang: locale })
      });
      if (!response.ok) throw new Error('Translation failed');
      const data = await response.json();
      if (data.translatedText) {
        setTranslatedMessages(prev => ({ ...prev, [msgId]: data.translatedText }));
        triggerVibration('success');
      }
    } catch (err) {
      console.error('[TRANSLATION] Translation error:', err);
    } finally {
      setTranslatingMessageIds(prev => ({ ...prev, [msgId]: false }));
    }
  };
  
  const handleSendOrderRequest = async () => {
    if (!selectedChatId || !orderItems.trim()) return;
    await chatService.sendMessage(
      selectedChatId, 
      user.id, 
      `New Order Request: ${orderItems.substring(0, 30)}...`,
      'order_request',
      { items: orderItems, status: 'pending' }
    );
    setIsOrderModalOpen(false);
    setOrderItems('');
  };

  const handleSendDeliveryAlert = async (etaMinutes: number) => {
    if (!selectedChatId) return;
    await chatService.sendMessage(
      selectedChatId,
      user.id,
      `Delivery Alert: Arrival in ${etaMinutes} mins`,
      'delivery_alert',
      { eta: etaMinutes, status: 'in_transit' }
    );
    setIsDeliveryModalOpen(false);
  };

  useEffect(() => {
    setUsers(storage.getUsers().filter(u => u.id !== user.id));
    
    // Listen to chats in real-time
    try {
      const unsubscribe = chatService.listenToChats(user.id, (loadedChats) => {
        setChats(loadedChats);
      });

      return () => {
        if (typeof unsubscribe === 'function') unsubscribe();
      };
    } catch (err) {
      console.warn('[CHAT] Chat listener skipping (unconfigured)');
    }
  }, [user.id]);

  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      return;
    }

    try {
      const unsubscribe = chatService.listenToMessages(selectedChatId, (loadedMessages) => {
        setMessages(loadedMessages);
        
        // Mark as read
        const unreadIds = loadedMessages
          .filter(m => m.senderId !== user.id && !m.readBy?.includes(user.id))
          .map(m => m.id);
        
        if (unreadIds.length > 0) {
          chatService.markAsRead(selectedChatId, user.id, unreadIds);
        }
      });

      return () => {
        if (typeof unsubscribe === 'function') unsubscribe();
      };
    } catch (err) {
      console.warn('[CHAT] Message listener skipping (unconfigured)');
    }
  }, [selectedChatId, user.id]);

  useEffect(() => {
    if (!selectedChatId) {
      setTypingUsers([]);
      return;
    }

    try {
      const controller = chatService.subscribeToTyping(selectedChatId, user.id, (typingIds) => {
        setTypingUsers(typingIds);
      });
      typingControllerRef.current = controller;

      return () => {
        controller.unsubscribe();
        typingControllerRef.current = null;
      };
    } catch (err) {
      console.warn('[CHAT] Typing listener skipping (unconfigured)');
    }
  }, [selectedChatId, user.id]);

  const handleTyping = () => {
    if (!typingControllerRef.current) return;

    typingControllerRef.current.setTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      typingControllerRef.current?.setTyping(false);
    }, 3000);
  };

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChatId) return;
    if (!inputText.trim() && !mediaPreview) return;

    const text = inputText.trim();
    setInputText(''); // Quick clear for UX

    let msgType: 'text' | 'image' | 'video' = 'text';
    let metadata: any = {};

    if (mediaPreview) {
      msgType = mediaPreview.type;
      metadata = { mediaUrl: mediaPreview.url };
      setMediaPreview(null);
    }

    // Reset typing state immediately
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingControllerRef.current?.setTyping(false);

    triggerVibration('success');

    const msgText = text || (msgType === 'image' ? 'Sent a photo' : 'Sent a video');
    await chatService.sendMessage(selectedChatId, user.id, msgText, msgType, metadata);

    // Direct real-time broadcast via Sockets to alert any active recipient
    const activeChat = chats.find(c => c.id === selectedChatId);
    if (activeChat) {
      const recipientIds = activeChat.participants.filter(id => id !== user.id);
      sendBroadcast('chat_message', {
        chatId: selectedChatId,
        senderId: user.id,
        senderName: user.name,
        text: msgText,
        type: msgType,
        metadata,
        timestamp: Date.now()
      }, recipientIds);
    }
  };

  const handleStartDirectChat = async (targetUserId: string) => {
    const chatId = await chatService.getOrCreateDirectChat(user.id, targetUserId);
    setSelectedChatId(chatId);
    setSearchContact('');
    setSidebarTab('chats');
  };

  const handleCreateGroup = async () => {
    if (!groupName || selectedParticipants.length === 0) return;
    
    try {
      const chatId = await chatService.createGroupChat(groupName, [user.id, ...selectedParticipants]);
      if (chatId) {
        setSelectedChatId(chatId);
        setIsCreatingGroup(false);
        setGroupName('');
        setSelectedParticipants([]);
      }
    } catch (err) {
      console.error("Group creation failed:", err);
    }
  };

  const selectedChat = chats.find(c => c.id === selectedChatId);
  const otherParticipantId = selectedChat?.participants.find(p => p !== user.id);
  const otherParticipant = users.find(u => u.id === otherParticipantId);

  return (
    <div className="h-[calc(100vh-200px)] flex gap-6 animate-in slide-in-from-bottom-4 duration-500 overflow-hidden">
      {/* Sidebar - Chats & Contacts */}
      <div className="w-full md:w-96 flex flex-col bg-kava-surface backdrop-blur-md rounded-[40px] border border-white/20 overflow-hidden shrink-0 transition-all">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-bebas text-4xl text-kava-text tracking-tight uppercase leading-none px-2">Discussions</h2>
            <button 
              onClick={() => setIsCreatingGroup(true)}
              className="p-3 bg-kava-gold/10 text-kava-gold rounded-2xl hover:bg-kava-gold hover:text-white transition-all shadow-lg shadow-kava-gold/5"
              title="New Group Chat"
            >
              <Users size={20} />
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-kava-muted/40" size={16} />
            <input 
              type="text" 
              placeholder="Search B2B partners..."
              value={searchContact}
              onChange={(e) => {
                setSearchContact(e.target.value);
                feedbackService.trigger('type');
              }}
              className="w-full bg-white/50 border border-kava-muted/10 rounded-2xl py-3 px-10 focus:outline-none text-[10px] font-bold uppercase transition-all tracking-[0.2em]"
            />
          </div>

          {/* Toggles/Tabs for Directory coordination */}
          <div className="grid grid-cols-2 gap-2 bg-kava-text/5 p-1 rounded-2xl border border-kava-text/5">
            <button
              onClick={() => setSidebarTab('chats')}
              className={`py-2 px-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                sidebarTab === 'chats'
                  ? 'bg-kava-gold text-white shadow-md'
                  : 'text-kava-muted hover:text-kava-text'
              }`}
            >
              Discussions
            </button>
            <button
              onClick={() => setSidebarTab('b2b')}
              className={`py-2 px-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                sidebarTab === 'b2b'
                  ? 'bg-kava-gold text-white shadow-md'
                  : 'text-kava-muted hover:text-kava-text'
              }`}
            >
              🌿 B2B Directory
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar pb-6">
          {searchContact ? (
            <div className="space-y-2">
              <p className="text-[9px] font-black text-kava-muted/30 uppercase tracking-widest px-4 mb-2">New Conversations</p>
              {users
                .filter(u => u.name.toLowerCase().includes(searchContact.toLowerCase()))
                .map(contact => (
                  <button
                    key={contact.id}
                    onClick={() => handleStartDirectChat(contact.id)}
                    className="w-full flex items-center gap-4 p-4 rounded-3xl hover:bg-white/60 text-kava-text transition-all group"
                  >
                    <div className="w-12 h-12 bg-kava-text/5 text-kava-muted rounded-2xl flex items-center justify-center font-bebas text-xl group-hover:bg-kava-gold group-hover:text-white transition-colors">
                      {contact.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-sm">{contact.name}</div>
                      <div className="text-[10px] font-bold text-kava-gold uppercase tracking-widest">
                        {contact.role === 'supplier' && contact.supplierTitle ? `Supplier 🌿 ${contact.supplierTitle}` : contact.role}
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          ) : sidebarTab === 'b2b' ? (
            <div className="space-y-2 animate-in fade-in duration-300">
              <p className="text-[9px] font-black text-kava-muted/30 uppercase tracking-widest px-4 mb-2">🌿 Available B2B Partners</p>
              {users
                .map(contact => (
                  <button
                    key={contact.id}
                    onClick={() => handleStartDirectChat(contact.id)}
                    className="w-full flex items-center gap-4 p-4 rounded-3xl bg-white/40 border border-transparent hover:border-kava-gold/20 hover:bg-white/60 text-kava-text transition-all group"
                  >
                    <div className="w-12 h-12 bg-kava-text/5 text-kava-muted rounded-2xl flex items-center justify-center font-bebas text-xl group-hover:bg-kava-gold group-hover:text-white transition-colors">
                      {contact.name.charAt(0)}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{contact.name}</div>
                      <div className="text-[10px] font-bold text-kava-gold uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                        <span className="shrink-0">
                          {contact.role === 'supplier' ? '🌿 Supplier' : contact.role === 'exporter' ? '🚢 Exporter' : '🏢 Manager'}
                        </span>
                        {contact.supplierTitle && (
                          <span className="text-kava-muted/50 normal-case font-semibold truncate">({contact.supplierTitle})</span>
                        )}
                      </div>
                    </div>
                    <div className="text-[8px] font-black uppercase tracking-widest bg-kava-gold/10 text-kava-gold px-2 py-1 rounded-md shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      Chat
                    </div>
                  </button>
                ))}
            </div>
          ) : (
            <div className="space-y-2 animate-in fade-in duration-300">
              {chats.map(chat => {
                const partnerId = chat.participants.find(p => p !== user.id);
                const partner = users.find(u => u.id === partnerId);
                const chatName = chat.type === 'group' ? chat.name : (partner?.name || 'Unknown User');
                const lastMsg = chat.lastMessage;
                
                return (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChatId(chat.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all group relative border-2 ${
                      selectedChatId === chat.id 
                        ? 'bg-kava-gold text-white border-kava-gold shadow-xl shadow-kava-gold/20' 
                        : 'bg-white/40 border-transparent hover:border-kava-gold/20 text-kava-text'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center font-bebas text-2xl shrink-0 transition-colors ${
                      selectedChatId === chat.id ? 'bg-white/20 text-white' : 'bg-kava-text/5 text-kava-muted group-hover:text-kava-gold'
                    }`}>
                      {chat.type === 'group' ? <Hash size={24} /> : chatName.charAt(0)}
                    </div>
                    
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="font-bold truncate pr-2 text-sm">{chatName}</span>
                        <span className={`text-[8px] font-black uppercase tracking-widest shrink-0 ${selectedChatId === chat.id ? 'text-white/60' : 'text-kava-muted/30'}`}>
                          {partner?.role === 'supplier' && partner.supplierTitle ? `🌿 ${partner.supplierTitle}` : chat.type}
                        </span>
                      </div>
                      <div className={`text-[10px] truncate font-medium flex justify-between items-center ${selectedChatId === chat.id ? 'text-white/70' : 'text-kava-muted/50'}`}>
                        <span className="truncate">{lastMsg ? lastMsg.text : 'Start chatting'}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
              {chats.length === 0 && !searchContact && (
                 <div className="py-20 text-center space-y-4 opacity-20">
                    <MessageSquare size={48} className="mx-auto" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">No discussions found</p>
                 </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="hidden md:flex flex-1 flex-col bg-kava-surface backdrop-blur-md rounded-[40px] border border-white/20 overflow-hidden shadow-2xl relative">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-6 border-b border-kava-text/5 flex justify-between items-center bg-white/40 backdrop-blur-xl z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-kava-gold rounded-[22px] flex items-center justify-center font-bebas text-3xl text-white shadow-lg shadow-kava-gold/20">
                  {selectedChat.type === 'group' ? <Hash size={28} /> : (otherParticipant?.name.charAt(0) || '?')}
                </div>
                <div>
                  <div className="font-bold text-xl text-kava-text tracking-tight">
                    {selectedChat.type === 'group' ? selectedChat.name : (otherParticipant?.name || 'Direct Chat')}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={typingUsers.length > 0 ? "w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" : "w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"} />
                    <div className="text-[10px] font-black text-kava-gold uppercase tracking-[3px]">
                      {typingUsers.length > 0 
                        ? `${users.find(u => u.id === typingUsers[0])?.name || 'Partner'} is typing...` 
                        : `${selectedChat.type} • encrypted`}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex -space-x-4">
                {users.filter(u => selectedChat.participants.includes(u.id)).slice(0, 3).map((u, i) => (
                  <div 
                    key={u.id}
                    className="w-10 h-10 rounded-full border-2 border-white bg-kava-surface flex items-center justify-center text-[10px] font-bold shadow-sm"
                    title={u.name}
                    style={{ zIndex: 10 - i }}
                  >
                    {u.name.charAt(0)}
                  </div>
                ))}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar bg-kava-bg/5">
              {messages.length > 0 ? (
                <div className="flex flex-col space-y-6">
                  {messages.map((msg, idx) => {
                    const isMe = msg.senderId === user.id;
                    const sender = users.find(u => u.id === msg.senderId);
                    const showSender = selectedChat.type === 'group' && !isMe;
                    const showDate = idx === 0 || new Date(messages[idx-1].timestamp).toDateString() !== new Date(msg.timestamp).toDateString();

                    return (
                      <div key={msg.id} className="space-y-4">
                        {showDate && (
                          <div className="flex justify-center my-4">
                            <span className="text-[8px] font-black text-kava-muted/40 uppercase tracking-[0.4em] bg-white/40 px-6 py-2 rounded-full border border-white/20 backdrop-blur-sm shadow-sm">
                              {new Date(msg.timestamp).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        )}
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex gap-3 max-w-[85%] sm:max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                            {!isMe && (
                              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-kava-gold/20 to-rose-500/10 flex items-center justify-center font-bebas text-kava-gold shrink-0 self-end mb-1 border border-white/40 shadow-sm">
                                {sender?.name.charAt(0) || 'S'}
                              </div>
                            )}
                            <div className="space-y-1 flex flex-col group/msg">
                              {showSender && !isMe && (
                                <span className="text-[8px] font-black text-kava-gold/80 uppercase tracking-widest ml-3 mb-1">{sender?.name}</span>
                              )}
                              <div className={`p-4 sm:p-5 rounded-[28px] text-sm font-medium shadow-xl relative transition-all ${
                                isMe 
                                  ? 'bg-kava-text text-white rounded-br-none shadow-kava-text/10' 
                                  : 'bg-white/90 rounded-bl-none text-kava-text border border-white/40 backdrop-blur-md'
                              }`}>
                                {msg.type === 'order_request' ? (
                                  <div className="space-y-4 min-w-[200px]">
                                    <div className="flex items-center gap-2 pb-2 border-b border-white/20">
                                      <ShoppingCart size={16} className={isMe ? "text-kava-gold" : "text-kava-gold"} />
                                      <span className="text-[10px] font-black uppercase tracking-widest">Order Request</span>
                                    </div>
                                    <div className={`p-4 rounded-2xl ${isMe ? 'bg-white/10' : 'bg-kava-bg/50'} border border-white/10`}>
                                      <p className="text-xs leading-relaxed italic opacity-90">"{msg.metadata?.items}"</p>
                                    </div>
                                    <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-[0.2em] pt-2">
                                      <span className="opacity-50">Status:</span>
                                      <span className="text-emerald-500">{msg.metadata?.status}</span>
                                    </div>
                                  </div>
                                ) : msg.type === 'delivery_alert' ? (
                                  <div className="space-y-4 min-w-[200px]">
                                    <div className="flex items-center gap-2 pb-2 border-b border-white/20">
                                      <Truck size={16} className="text-kava-gold" />
                                      <span className="text-[10px] font-black uppercase tracking-widest">Delivery Update</span>
                                    </div>
                                    <div className="flex flex-col items-center py-4 bg-kava-gold/10 rounded-2xl border border-kava-gold/20">
                                      <div className="text-3xl font-bebas text-kava-gold tracking-widest">{msg.metadata?.eta} <span className="text-xs">MINS</span></div>
                                      <div className="text-[7px] font-black uppercase tracking-widest text-kava-gold/60 mt-1">Estimated Arrival</div>
                                    </div>
                                    <div className="flex justify-center">
                                      <div className="flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500">In Transit</span>
                                      </div>
                                    </div>
                                  </div>
                                ) : msg.type === 'image' ? (
                                  <div className="space-y-2 max-w-[280px] sm:max-w-[340px]">
                                    <div className="rounded-2xl overflow-hidden shadow-md border border-white/10 relative">
                                      <img 
                                        src={msg.metadata?.mediaUrl || msg.text} 
                                        alt="Photo attachment" 
                                        className="w-full h-auto object-cover max-h-60 rounded-xl"
                                        referrerPolicy="no-referrer"
                                      />
                                    </div>
                                    {msg.text && !msg.text.startsWith('data:') && msg.text !== 'Sent a photo' && (
                                      <p className="text-xs leading-relaxed px-1 font-medium">{translatedMessages[msg.id] || msg.text}</p>
                                    )}
                                    {!isMe && (
                                      <button 
                                        onClick={() => handleTranslateMessage(msg.id, msg.text)}
                                        className="text-[9px] text-kava-gold/80 hover:text-kava-gold font-bold flex items-center gap-1 mt-1 cursor-pointer"
                                      >
                                        {translatingMessageIds[msg.id] ? '...' : (translatedMessages[msg.id] ? t('show_original') || 'Show Original' : t('translate') || 'Translate')}
                                      </button>
                                    )}
                                  </div>
                                ) : msg.type === 'video' ? (
                                  <div className="space-y-2 max-w-[280px] sm:max-w-[340px]">
                                    <div className="rounded-2xl overflow-hidden shadow-md border border-white/10 bg-black/50">
                                      <video 
                                        src={msg.metadata?.mediaUrl || msg.text} 
                                        controls 
                                        playsInline
                                        className="w-full h-auto max-h-60 rounded-xl"
                                      />
                                    </div>
                                    {msg.text && !msg.text.startsWith('data:') && msg.text !== 'Sent a video' && (
                                      <p className="text-xs leading-relaxed px-1 font-medium">{translatedMessages[msg.id] || msg.text}</p>
                                    )}
                                    {!isMe && (
                                      <button 
                                        onClick={() => handleTranslateMessage(msg.id, msg.text)}
                                        className="text-[9px] text-kava-gold/80 hover:text-kava-gold font-bold flex items-center gap-1 mt-1 cursor-pointer"
                                      >
                                        {translatingMessageIds[msg.id] ? '...' : (translatedMessages[msg.id] ? t('show_original') || 'Show Original' : t('translate') || 'Translate')}
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <p>{translatedMessages[msg.id] || msg.text}</p>
                                    {translatedMessages[msg.id] && (
                                      <span className="block text-[8px] text-kava-gold/80 italic font-bold mt-1.5 text-right">
                                        ✨ {t('translated_by_gemini') || 'Translated via Gemini API'}
                                      </span>
                                    )}
                                  </div>
                                )}
                                <div className={`flex items-center gap-1.5 absolute bottom-1 ${isMe ? '-left-12' : '-right-12'} opacity-0 group-hover/msg:opacity-100 transition-opacity whitespace-nowrap`}>
                                   <span className="text-[7px] font-black uppercase text-kava-muted/40 tracking-tighter">
                                     {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                   </span>
                                </div>
                              </div>
                              <div className={`flex items-center gap-2 px-3 mt-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <span className="text-[7px] font-black uppercase tracking-widest text-kava-muted/20">
                                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {!isMe && msg.type !== 'order_request' && msg.type !== 'delivery_alert' && (
                                  <>
                                    <span className="text-[7px] font-black text-kava-muted/20">•</span>
                                    <button 
                                      onClick={() => handleTranslateMessage(msg.id, msg.text)}
                                      className="text-[7px] font-black uppercase tracking-widest text-kava-gold hover:underline transition-all active:scale-95"
                                    >
                                      {translatingMessageIds[msg.id] 
                                        ? (t('translating') || 'Translating...') 
                                        : translatedMessages[msg.id] 
                                          ? (t('show_original') || 'Show Original') 
                                          : (t('translate') || 'Translate')}
                                    </button>
                                  </>
                                )}
                                {isMe && (
                                  <div className="flex items-center gap-0.5">
                                    {msg.readBy?.length > 1 ? (
                                      <CheckCheck size={12} className="text-emerald-500" />
                                    ) : (
                                      <CheckCheck size={12} className="text-kava-muted/20" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                  
                  {typingUsers.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex justify-start items-center gap-3 px-4"
                    >
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-kava-gold rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-1.5 bg-kava-gold rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 bg-kava-gold rounded-full animate-bounce" />
                      </div>
                      <span className="text-[9px] font-black text-kava-muted/40 uppercase tracking-widest">
                        {typingUsers.length === 1 
                          ? `${users.find(u => u.id === typingUsers[0])?.name || 'Operative'} is typing...`
                          : `${typingUsers.length} operatives are typing...`}
                      </span>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center space-y-6 py-20">
                   <div className="bg-kava-gold/10 p-10 rounded-[40px] text-kava-gold animate-pulse">
                    <UserIcon size={64} />
                   </div>
                   <div className="text-center space-y-2">
                     <div className="font-bebas text-5xl uppercase tracking-[0.2em] text-kava-text">Secure Bridge</div>
                     <p className="text-[10px] font-black uppercase tracking-[0.4em] text-kava-muted/40">E2E Management Protocol Active</p>
                   </div>
                </div>
              )}
              <div ref={endOfMessagesRef} />
            </div>

            {/* Message Input */}
            <div className="p-10 bg-white/60 backdrop-blur-xl border-t border-white/20 space-y-6">
              {/* Quick Actions for B2B */}
              <div className="flex gap-2">
                {(user.role === 'manager' || user.role === 'exporter') && (
                  <button 
                    onClick={() => setIsOrderModalOpen(true)}
                    className="flex items-center gap-3 px-6 py-3 bg-kava-text text-white rounded-full font-black text-[9px] uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-black/10"
                  >
                    <Plus size={14} />
                    New Order Request
                  </button>
                )}
                {user.role === 'supplier' && (
                  <button 
                    onClick={() => setIsDeliveryModalOpen(true)}
                    className="flex items-center gap-3 px-6 py-3 bg-emerald-500 text-white rounded-full font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/10"
                  >
                    <Truck size={14} />
                    Update Delivery ETA
                  </button>
                )}
                <button className="flex items-center gap-3 px-6 py-3 bg-white/40 border border-white/20 rounded-full font-black text-[9px] uppercase tracking-widest hover:bg-white transition-all">
                  <FileText size={14} />
                  Shared Docs
                </button>
                <input 
                  type="file"
                  accept="image/*,video/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-3 px-6 py-3 bg-kava-gold/15 text-kava-gold border border-kava-gold/30 rounded-full font-black text-[9px] uppercase tracking-widest hover:bg-kava-gold hover:text-white transition-all cursor-pointer"
                  title="Upload Photo or Video"
                >
                  <Paperclip size={14} />
                  Upload Photo/Video
                </button>
                <button 
                  type="button"
                  onClick={() => setIsPresetModalOpen(true)}
                  className="flex items-center gap-3 px-6 py-3 bg-indigo-500/15 text-indigo-500 border border-indigo-500/30 rounded-full font-black text-[9px] uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all cursor-pointer"
                  title="Select Vanuatu Photo or Video Preset"
                >
                  <Image size={14} />
                  Presets
                </button>
              </div>

              {/* Media Preview Box */}
              {mediaPreview && (
                <div className="p-4 bg-white/90 border border-kava-gold/30 rounded-2xl flex items-center justify-between shadow-xl animate-in fade-in duration-200">
                  <div className="flex items-center gap-3">
                    {mediaPreview.type === 'image' ? (
                      <img src={mediaPreview.url} className="w-14 h-14 rounded-xl object-cover border border-white" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-neutral-900 border border-white flex flex-col items-center justify-center text-xs text-white">
                        <Video size={20} className="text-kava-gold" />
                        <span className="text-[7px] font-bold uppercase mt-1">Video</span>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-kava-text truncate max-w-[200px]">{mediaPreview.name || 'Selected Media'}</p>
                      <p className="text-[9px] text-kava-gold font-black uppercase tracking-widest">{mediaPreview.type} attachment ready</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setMediaPreview(null)} 
                    className="p-2 hover:bg-rose-500/15 text-rose-500 rounded-full transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <form onSubmit={handleSendMessage}>
                <div className="flex items-center gap-4 bg-kava-bg rounded-[32px] p-2 pr-2 pl-8 shadow-2xl border-2 border-white/20 focus-within:border-kava-gold/50 transition-all group">
                  <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value);
                      handleTyping();
                    }}
                    placeholder="Draft tactical communication..."
                    className="flex-1 bg-transparent border-none focus:ring-0 py-4 text-sm font-bold text-kava-text placeholder:text-kava-muted/30"
                  />
                  <button 
                    type="submit"
                    disabled={!inputText.trim() && !mediaPreview}
                    className="bg-kava-gold text-white p-5 rounded-[24px] hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all shadow-xl shadow-kava-gold/40 flex items-center justify-center"
                  >
                    <Send size={24} />
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-8 bg-kava-bg/5">
             <div className="p-12 bg-white/40 backdrop-blur-md rounded-[50px] border border-white/20 text-kava-gold shadow-3xl">
               <MessageSquare size={100} strokeWidth={1.5} />
             </div>
             <div className="space-y-4 max-w-md">
               <h3 className="font-bebas text-6xl text-kava-text uppercase tracking-widest leading-none">Command Center</h3>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-kava-muted leading-loose">
                  Select a B2B partner or established discussion group to initiate real-time coordination.
               </p>
             </div>
          </div>
        )}
      </div>

      {/* Group Creation Portal */}
      <AnimatePresence>
        {isCreatingGroup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-kava-text">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreatingGroup(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-kava-surface rounded-[50px] border border-white/20 shadow-3xl overflow-hidden"
            >
              <div className="p-10 space-y-10">
                <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    <h3 className="font-bebas text-5xl uppercase tracking-tight text-white">New Tactical Group</h3>
                    <p className="text-[10px] font-black text-kava-gold uppercase tracking-[0.3em] opacity-60">Assemble your B2B alliance</p>
                  </div>
                  <button onClick={() => setIsCreatingGroup(false)} className="p-4 hover:bg-rose-500/10 rounded-full text-rose-500 transition-colors">
                    <X size={32} />
                  </button>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-kava-muted uppercase tracking-[0.3em] ml-2">Objective Name</label>
                    <input 
                      type="text"
                      placeholder="Enter group designation..."
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="w-full bg-kava-bg/50 border-2 border-white/20 rounded-[30px] p-6 text-2xl font-bebas tracking-widest focus:border-kava-gold outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-kava-muted uppercase tracking-[0.3em] ml-2">Select Operatives</label>
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {users.map(u => (
                        <button
                          key={u.id}
                          onClick={() => {
                            if (selectedParticipants.includes(u.id)) {
                              setSelectedParticipants(prev => prev.filter(id => id !== u.id));
                            } else {
                              setSelectedParticipants(prev => [...prev, u.id]);
                            }
                          }}
                          className={`w-full flex items-center gap-4 p-5 rounded-[28px] border-2 transition-all ${
                            selectedParticipants.includes(u.id)
                              ? 'bg-kava-gold/10 border-kava-gold'
                              : 'bg-white/20 border-white/10 hover:border-white/40'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bebas text-lg ${
                            selectedParticipants.includes(u.id) ? 'bg-kava-gold text-white' : 'bg-white/40 text-kava-muted'
                          }`}>
                            {u.name.charAt(0)}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-bold text-sm text-white">{u.name}</div>
                            <div className="text-[8px] font-black text-kava-gold uppercase tracking-widest">{u.role}</div>
                          </div>
                          {selectedParticipants.includes(u.id) && <Plus size={20} className="text-kava-gold" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  disabled={!groupName || selectedParticipants.length === 0}
                  onClick={handleCreateGroup}
                  className="w-full py-6 bg-kava-gold text-white rounded-[30px] font-bebas text-3xl tracking-[0.3em] uppercase shadow-2xl shadow-kava-gold/40 hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all"
                >
                  Initialize Hub
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Order Modal */}
        {isOrderModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 text-kava-text">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOrderModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-2xl"
            />
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="relative w-full max-w-lg bg-kava-surface rounded-[40px] border border-white/20 shadow-3xl overflow-hidden p-10 space-y-8"
            >
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="font-bebas text-4xl uppercase tracking-widest text-white">Consignment Request</h3>
                  <p className="text-[10px] font-black text-kava-gold uppercase tracking-widest">{user.role === 'exporter' ? 'Exporter Cargo Protocol' : 'Manager Inventory Protocol'}</p>
                </div>
                <button onClick={() => setIsOrderModalOpen(false)} className="text-white/20 hover:text-rose-500 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <label className="text-[9px] font-black text-kava-muted uppercase tracking-widest ml-2">Inventory Items & Quantities</label>
                <textarea 
                  value={orderItems}
                  onChange={(e) => setOrderItems(e.target.value)}
                  placeholder="e.g. 5x Root Bags, 2x Traditional Grinders..."
                  className="w-full bg-black/20 border-2 border-white/10 rounded-3xl p-6 h-40 font-medium text-white placeholder:text-white/20 focus:border-kava-gold outline-none resize-none transition-all"
                />
              </div>

              <button 
                onClick={handleSendOrderRequest}
                className="w-full py-5 bg-kava-gold text-white rounded-3xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 shadow-xl shadow-kava-gold/20"
              >
                Dispatch Order Request
              </button>
            </motion.div>
          </div>
        )}

        {/* Delivery Modal */}
        {isDeliveryModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 text-kava-text">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeliveryModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-2xl"
            />
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="relative w-full max-w-md bg-kava-surface rounded-[40px] border border-white/20 shadow-3xl overflow-hidden p-10 space-y-8"
            >
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="font-bebas text-4xl uppercase tracking-widest text-white">Logistics Update</h3>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Supplier Transit Protocol</p>
                </div>
                <button onClick={() => setIsDeliveryModalOpen(false)} className="text-white/20 hover:text-rose-500 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[15, 30, 45, 60].map(mins => (
                  <button 
                    key={mins}
                    onClick={() => handleSendDeliveryAlert(mins)}
                    className="p-8 bg-white/5 border-2 border-white/10 rounded-3xl hover:border-emerald-500 group transition-all"
                  >
                    <div className="font-bebas text-4xl text-white group-hover:text-emerald-500">{mins}</div>
                    <div className="text-[8px] font-black text-kava-muted uppercase tracking-widest">Minutes</div>
                  </button>
                ))}
              </div>

              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                <Clock size={16} className="text-emerald-500" />
                <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Select Estimated Time of Arrival</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
