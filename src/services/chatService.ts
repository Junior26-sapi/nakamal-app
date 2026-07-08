import { supabase } from '../lib/supabase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface Chat {
  id: string;
  type: 'direct' | 'group';
  participants: string[];
  name?: string;
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: number;
  };
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  type: 'text' | 'order_request' | 'delivery_alert' | 'image' | 'video';
  metadata: any;
  attachments?: any[];
  timestamp: number;
  readBy: string[];
}

export const chatService = {
  // Get all chats for current user
  listenToChats: (userId: string, callback: (chats: Chat[]) => void) => {
    let currentChats: Chat[] = [];

    const fetchChats = async () => {
      const localChats = (JSON.parse(localStorage.getItem('kava_local_chats') || '[]') as Chat[])
        .filter(c => c.participants.includes(userId))
        .map(c => ({
          ...c,
          lastMessage: c.lastMessage || (c as any).last_message
        }));

      try {
        const { data, error } = await supabase
          .from('chats')
          .select('*')
          .contains('participants', [userId])
          .order('last_message->timestamp', { ascending: false });

        if (!error && data) {
          const fetchedChats = data.map(d => ({
            ...d,
            lastMessage: d.last_message,
            createdAt: d.created_at
          } as Chat));
          
          // Merge local and fetched
          const merged = [...fetchedChats];
          localChats.forEach(lc => {
            if (!merged.some(mc => mc.id === lc.id)) {
              merged.push(lc);
            }
          });
          currentChats = merged;
          callback(currentChats);
        } else {
          currentChats = localChats;
          callback(currentChats);
        }
      } catch (err) {
        console.warn('[CHAT] Failed to fetch remote chats, using local only:', err);
        currentChats = localChats;
        callback(currentChats);
      }
    };

    // Initial fetch
    fetchChats();

    // Real-time subscription
    const channel = supabase
      .channel(`user-chats-${userId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'chats'
      }, (payload) => {
        const newData = payload.new as any;
        const oldData = payload.old as any;
        
        const isUserInvolved = 
          (newData?.participants?.includes(userId)) || 
          (oldData?.participants?.includes(userId));

        if (!isUserInvolved) return;

        if (payload.eventType === 'INSERT') {
          const newChat: Chat = {
            ...newData,
            lastMessage: newData.last_message,
            createdAt: newData.created_at
          };
          currentChats = [newChat, ...currentChats].sort((a, b) => 
            (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0)
          );
          callback(currentChats);
        } else if (payload.eventType === 'UPDATE') {
          const updatedChat: Chat = {
            ...newData,
            lastMessage: newData.last_message,
            createdAt: newData.created_at
          };
          currentChats = currentChats.map(c => c.id === updatedChat.id ? updatedChat : c).sort((a, b) => 
            (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0)
          );
          callback(currentChats);
        } else if (payload.eventType === 'DELETE') {
          currentChats = currentChats.filter(c => c.id !== oldData.id);
          callback(currentChats);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Get messages for a specific chat
  listenToMessages: (chatId: string, callback: (messages: ChatMessage[]) => void) => {
    let currentMessages: ChatMessage[] = [];

    const fetchMessages = async () => {
      const localMsgs = (JSON.parse(localStorage.getItem(`kava_local_msgs_${chatId}`) || '[]') as ChatMessage[]);

      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chatId)
          .order('timestamp', { ascending: true })
          .limit(100);

        if (!error && data) {
          const fetchedMessages = data.map(d => ({
            ...d,
            chatId: d.chat_id,
            senderId: d.sender_id,
            type: d.type,
            metadata: d.metadata,
            attachments: d.attachments,
            readBy: d.read_by
          } as ChatMessage));

          const merged = [...fetchedMessages];
          localMsgs.forEach(lm => {
            if (!merged.some(mm => mm.id === lm.id)) {
              merged.push(lm);
            }
          });
          currentMessages = merged.sort((a, b) => a.timestamp - b.timestamp);
          callback(currentMessages);
        } else {
          currentMessages = localMsgs.sort((a, b) => a.timestamp - b.timestamp);
          callback(currentMessages);
        }
      } catch (err) {
        console.warn('[CHAT] Failed to fetch remote messages, using local only:', err);
        currentMessages = localMsgs.sort((a, b) => a.timestamp - b.timestamp);
        callback(currentMessages);
      }
    };

    // Initial fetch
    fetchMessages();

    // Real-time subscription - filtering by chat_id as requested
    const channel = supabase
      .channel(`chat-messages-${chatId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        filter: `chat_id=eq.${chatId}`, 
        schema: 'public', 
        table: 'messages' 
      }, (payload) => {
        const raw = payload.new as any;
        const newMessage: ChatMessage = {
          ...raw,
          chatId: raw.chat_id,
          senderId: raw.sender_id,
          type: raw.type,
          metadata: raw.metadata,
          attachments: raw.attachments,
          readBy: raw.read_by
        };
        
        // Prevent duplicate messages if re-fetch and insert race
        if (!currentMessages.some(m => m.id === newMessage.id)) {
          currentMessages = [...currentMessages, newMessage];
          callback(currentMessages);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        filter: `chat_id=eq.${chatId}`,
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        const raw = payload.new as any;
        const updatedMsg: ChatMessage = {
          ...raw,
          chatId: raw.chat_id,
          senderId: raw.sender_id,
          type: raw.type,
          metadata: raw.metadata,
          attachments: raw.attachments,
          readBy: raw.read_by
        };

        currentMessages = currentMessages.map(m => m.id === updatedMsg.id ? updatedMsg : m);
        callback(currentMessages);
      })
      .on('postgres_changes', {
        event: 'DELETE',
        filter: `chat_id=eq.${chatId}`,
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        currentMessages = currentMessages.filter(m => m.id !== payload.old.id);
        callback(currentMessages);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Send a message
  sendMessage: async (chatId: string, senderId: string, text: string, type: 'text' | 'order_request' | 'delivery_alert' | 'image' | 'video' = 'text', metadata: any = {}, attachments: any[] = []) => {
    const timestamp = Date.now();
    const mockMsgId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newLocalMsg: ChatMessage = {
      id: mockMsgId,
      chatId,
      senderId,
      text,
      type,
      metadata,
      attachments,
      timestamp,
      readBy: [senderId]
    };

    // Save locally
    let localMsgs: any[] = [];
    try {
      localMsgs = JSON.parse(localStorage.getItem(`kava_local_msgs_${chatId}`) || '[]');
      if (!Array.isArray(localMsgs)) localMsgs = [];
    } catch {
      localMsgs = [];
    }
    localMsgs = localMsgs.filter(m => m && typeof m === 'object');
    localMsgs.push(newLocalMsg);
    localStorage.setItem(`kava_local_msgs_${chatId}`, JSON.stringify(localMsgs));

    // Update local chats
    let localChats: any[] = [];
    try {
      localChats = JSON.parse(localStorage.getItem('kava_local_chats') || '[]');
      if (!Array.isArray(localChats)) localChats = [];
    } catch {
      localChats = [];
    }
    localChats = localChats.filter(c => c && typeof c === 'object');
    const chatIndex = localChats.findIndex((c: any) => c && c.id === chatId);
    if (chatIndex !== -1) {
      localChats[chatIndex].last_message = {
        text,
        senderId,
        timestamp,
        type,
        attachments_count: attachments.length
      };
      localChats[chatIndex].lastMessage = localChats[chatIndex].last_message;
      localStorage.setItem('kava_local_chats', JSON.stringify(localChats));
    }

    try {
      // Step 1: Add message
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: senderId,
          text,
          type,
          metadata,
          attachments,
          timestamp,
          read_by: [senderId]
        });

      if (msgError) throw msgError;

      // Step 2: Update chat last message
      const { error: chatError } = await supabase
        .from('chats')
        .update({
          last_message: {
            text,
            senderId,
            timestamp,
            type,
            attachments_count: attachments.length
          }
        })
        .eq('id', chatId);

      if (chatError) throw chatError;
    } catch (error) {
      console.warn('[CHAT] Supabase Error sending message, but stored locally: ', error);
    }
  },

  // Cleanup messages older than 7 days
  cleanupOldMessages: async () => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .lt('timestamp', sevenDaysAgo);
      
      if (error) throw error;
      console.log('[CLEANUP] Deleted messages older than 7 days');
    } catch (err) {
      console.warn('[CLEANUP] Message cleanup failed (might be schema related or permissions):', err);
    }
  },

  // Find or create a direct chat
  getOrCreateDirectChat: async (user1: string, user2: string) => {
    try {
      if (!user1 || !user2) {
        throw new Error(`Invalid participants provided: user1=${user1}, user2=${user2}`);
      }

      const { data: existing, error } = await supabase
        .from('chats')
        .select('id, participants')
        .eq('type', 'direct')
        .contains('participants', [user1]);

      if (error) throw error;

      // Ensure we guard against any null elements in existing array, or null participants
      const chat = existing?.find(c => c && Array.isArray(c.participants) && c.participants.includes(user2));
      if (chat && chat.id) return chat.id;

      const { data: newChat, error: createError } = await supabase
        .from('chats')
        .insert({
          type: 'direct',
          participants: [user1, user2],
          created_at: Date.now(),
          last_message: {
            text: 'Conversation started',
            senderId: 'system',
            timestamp: Date.now()
          }
        })
        .select()
        .single();

      if (createError) throw createError;
      if (!newChat || !newChat.id) {
        // Safe fallback for unconfigured Supabase or restricted permissions
        const fallbackId = `mock-direct-${[user1, user2].sort().join('-')}`;
        // Let's also save to local storage chats if they don't exist
        const rawLocal = localStorage.getItem('kava_local_chats');
        let localChats: any[] = [];
        try {
          localChats = JSON.parse(rawLocal || '[]');
          if (!Array.isArray(localChats)) localChats = [];
        } catch {
          localChats = [];
        }

        // Filter out any potential nulls in localChats to prevent any subsequent crashes
        localChats = localChats.filter(c => c && typeof c === 'object');

        if (!localChats.some((c: any) => c && c.id === fallbackId)) {
          localChats.push({
            id: fallbackId,
            type: 'direct',
            participants: [user1, user2],
            created_at: Date.now(),
            last_message: {
              text: 'Conversation started',
              senderId: 'system',
              timestamp: Date.now()
            }
          });
          localStorage.setItem('kava_local_chats', JSON.stringify(localChats));
        }
        return fallbackId;
      }
      return newChat.id;
    } catch (error) {
       console.error('Supabase Error getting/creating chat: ', error);
       // Handle gracefully by returning a deterministic local id
       const safeU1 = user1 || 'system';
       const safeU2 = user2 || 'anonymous';
       return `mock-direct-${[safeU1, safeU2].sort().join('-')}`;
    }
  },

  // Create a group chat
  createGroupChat: async (name: string, participants: string[]) => {
    try {
      const { data: newChat, error } = await supabase
        .from('chats')
        .insert({
          type: 'group',
          name,
          participants,
          created_at: Date.now(),
          last_message: {
            text: `Group ${name} created`,
            senderId: 'system',
            timestamp: Date.now()
          }
        })
        .select()
        .single();

      if (error) throw error;
      if (!newChat) {
        const fallbackId = `mock-group-${Date.now()}`;
        const localChats = JSON.parse(localStorage.getItem('kava_local_chats') || '[]');
        localChats.push({
          id: fallbackId,
          type: 'group',
          name,
          participants,
          created_at: Date.now(),
          last_message: {
            text: `Group ${name} created`,
            senderId: 'system',
            timestamp: Date.now()
          }
        });
        localStorage.setItem('kava_local_chats', JSON.stringify(localChats));
        return fallbackId;
      }
      return newChat.id;
    } catch (error) {
      console.error('Supabase Error creating group chat: ', error);
      const fallbackId = `mock-group-${Date.now()}`;
      return fallbackId;
    }
  },

  // Mark messages in chat as read
  markAsRead: async (chatId: string, userId: string, messageIds: string[]) => {
    try {
      if (messageIds.length === 0) return;
      
      // Batch fetch messages to be updated
      const { data, error } = await supabase
        .from('messages')
        .select('id, read_by')
        .in('id', messageIds);

      if (error || !data) return;

      const updates = data
        .map(msg => {
          const currentReadBy = (msg.read_by || []) as string[];
          if (!currentReadBy.includes(userId)) {
            return supabase
              .from('messages')
              .update({ read_by: [...currentReadBy, userId] })
              .eq('id', msg.id);
          }
          return null;
        })
        .filter((u) => u !== null);

      if (updates.length > 0) {
        await Promise.all(updates);
      }
    } catch (error) {
      console.error('Supabase Error marking read: ', error);
    }
  },

  // Real-time typing indicators using Presence
  subscribeToTyping: (chatId: string, userId: string, onTypingUpdate: (users: string[]) => void) => {
    const channel = supabase.channel(`typing:${chatId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const typingUsers = Object.keys(state).filter(id => {
          if (id === userId) return false;
          const presences = state[id] as any[];
          return presences.some(p => p.typing === true);
        });
        onTypingUpdate(typingUsers);
      })
      .subscribe();

    return {
      setTyping: (isTyping: boolean) => {
        if (isTyping) {
          channel.track({ typing: true, at: Date.now() });
        } else {
          channel.untrack();
        }
      },
      unsubscribe: () => {
        channel.unsubscribe();
      }
    };
  }
};
