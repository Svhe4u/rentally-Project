import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { MessageAPI, Message } from '../services/api';

interface Props {
  onNavigate: (screen: string, params?: any) => void;
  senderId?: number;
  receiverId?: number;
  listingId?: number;
  receiverName?: string;
}

export default function ChatScreen({
  onNavigate,
  senderId = 1,
  receiverId = 2,
  listingId,
  receiverName = 'Зуучлагч',
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText]         = useState('');
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const flatRef = useRef<FlatList>(null);

  const load = async () => {
    try {
      const data = await MessageAPI.thread(senderId, receiverId);
      setMessages(data.reverse()); // oldest first for display
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      const msg = await MessageAPI.send({
        sender_id: senderId,
        receiver_id: receiverId,
        listing_id: listingId,
        message: trimmed,
      });
      setMessages(prev => [...prev, msg]);
      setText('');
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {}
    finally { setSending(false); }
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isMine = item.sender_id === senderId;
    return (
      <View style={[c.bubble, isMine ? c.bubbleMine : c.bubbleTheirs]}>
        <Text style={[c.bubbleTxt, isMine ? c.bubbleTxtMine : c.bubbleTxtTheirs]}>
          {item.message}
        </Text>
        <Text style={[c.bubbleTime, isMine ? c.bubbleTimeMine : c.bubbleTimeTheirs]}>
          {new Date(item.created_at).toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={c.safe}>
      {/* Header */}
      <View style={c.header}>
        <TouchableOpacity onPress={() => onNavigate('messages')} style={c.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={c.headerCenter}>
          <View style={c.avatar}>
            <Text style={c.avatarLtr}>{receiverName[0]?.toUpperCase()}</Text>
          </View>
          <View>
            <Text style={c.headerName}>{receiverName}</Text>
            <Text style={c.headerSub}>Онлайн</Text>
          </View>
        </View>
        <TouchableOpacity style={c.callBtn}>
          <Ionicons name="call-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Listing context banner */}
      {listingId && (
        <View style={c.listingBanner}>
          <View style={c.bannerIcon}>
            <Ionicons name="home-outline" size={18} color={Colors.primary} />
          </View>
          <Text style={c.bannerTxt} numberOfLines={1}>Байрны зар #{listingId}</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
        </View>
      )}

      {/* Messages */}
      {loading ? (
        <View style={c.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : (
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={c.messageList}
          ListEmptyComponent={
            <View style={c.emptyBox}>
              <Ionicons name="chatbubbles-outline" size={48} color="#ddd" />
              <Text style={c.emptyTxt}>Одоо чат эхлээгүй байна</Text>
              <Text style={c.emptySub}>Мессеж илгээж эхлэх</Text>
            </View>
          }
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* Input bar */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={c.inputBar}>
          <TouchableOpacity style={c.attachBtn}>
            <Ionicons name="attach-outline" size={22} color={Colors.textMuted} />
          </TouchableOpacity>
          <TextInput
            style={c.input}
            placeholder="Мессеж бичих..."
            placeholderTextColor={Colors.textLight}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[c.sendBtn, (!text.trim() || sending) && c.sendBtnOff]}
            onPress={sendMessage}
            disabled={!text.trim() || sending}
            activeOpacity={0.85}
          >
            {sending
              ? <ActivityIndicator color={Colors.white} size="small" />
              : <Ionicons name="send" size={18} color={Colors.white} />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const c = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, paddingVertical: 10,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginLeft: 4 },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLtr: { fontSize: 16, fontWeight: '900', color: '#fff' },
  headerName: { fontSize: 15, fontWeight: '800', color: Colors.text },
  headerSub:  { fontSize: 11, color: '#22c55e', fontWeight: '600' },
  callBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  listingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.iconBg,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  bannerIcon: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  bannerTxt:   { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.primary },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messageList: { padding: 16, gap: 8 },
  bubble: { maxWidth: '78%', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 4 },
  bubbleMine:   { alignSelf: 'flex-end', backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { alignSelf: 'flex-start', backgroundColor: Colors.white, borderBottomLeftRadius: 4 },
  bubbleTxt:       { fontSize: 14, lineHeight: 20 },
  bubbleTxtMine:   { color: Colors.white },
  bubbleTxtTheirs: { color: Colors.text },
  bubbleTime:       { fontSize: 10, marginTop: 4 },
  bubbleTimeMine:   { color: 'rgba(255,255,255,0.65)', textAlign: 'right' },
  bubbleTimeTheirs: { color: Colors.textLight },

  emptyBox:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyTxt:  { fontSize: 16, fontWeight: '800', color: Colors.text },
  emptySub:  { fontSize: 13, color: Colors.textMuted },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: Colors.white,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  attachBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  input: {
    flex: 1, backgroundColor: Colors.bg, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    fontSize: 14, color: Colors.text, maxHeight: 100,
  },
  sendBtn:    { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnOff: { backgroundColor: '#b0c0f8' },
});
