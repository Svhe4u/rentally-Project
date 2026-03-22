import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
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
      setMessages(data.reverse()); // oldest first
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
      <View style={[s.bubble, isMine ? s.bubbleMine : s.bubbleTheirs]}>
        <Text style={[s.bubbleTxt, isMine ? s.bubbleTxtMine : s.bubbleTxtTheirs]}>
          {item.message}
        </Text>
        <Text style={[s.bubbleTime, isMine ? s.bubbleTimeMine : s.bubbleTimeTheirs]}>
          {new Date(item.created_at).toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => onNavigate('home')} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <View style={s.avatar}><Text style={{ fontSize: 18 }}>👤</Text></View>
          <View>
            <Text style={s.headerName}>{receiverName}</Text>
            <Text style={s.headerSub}>Онлайн</Text>
          </View>
        </View>
        <TouchableOpacity style={s.callBtn}>
          <Text style={{ fontSize: 20 }}>📞</Text>
        </TouchableOpacity>
      </View>

      {/* Listing context banner */}
      {listingId && (
        <TouchableOpacity
          style={s.listingBanner}
          onPress={() => onNavigate('listingDetail', { listingId })}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 18 }}>🏢</Text>
          <Text style={s.bannerTxt} numberOfLines={1}>Байрны зар #{listingId}</Text>
          <Text style={s.bannerArrow}>›</Text>
        </TouchableOpacity>
      )}

      {/* Messages */}
      {loading ? (
        <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : (
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={s.messageList}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <Text style={s.emptyIcon}>💬</Text>
              <Text style={s.emptyTxt}>Харилцааны эхлэл</Text>
              <Text style={s.emptySub}>Мессеж илгээж эхлэх</Text>
            </View>
          }
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* Input bar */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.inputBar}>
          <TouchableOpacity style={s.attachBtn}>
            <Text style={{ fontSize: 20 }}>📎</Text>
          </TouchableOpacity>
          <TextInput
            style={s.input}
            placeholder="Мессеж бичих..."
            placeholderTextColor={Colors.textLight}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!text.trim() || sending) && s.sendBtnOff]}
            onPress={sendMessage}
            disabled={!text.trim() || sending}
            activeOpacity={0.85}
          >
            {sending
              ? <ActivityIndicator color={Colors.white} size="small" />
              : <Text style={s.sendIcon}>➤</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 22, color: Colors.text },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginLeft: 4 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
  headerName: { fontSize: 15, fontWeight: '800', color: Colors.text },
  headerSub:  { fontSize: 11, color: Colors.primary },
  callBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  listingBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.iconBg, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  bannerTxt:   { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.primary },
  bannerArrow: { fontSize: 18, color: Colors.primary },
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
  emptyIcon: { fontSize: 48 },
  emptyTxt:  { fontSize: 16, fontWeight: '800', color: Colors.text },
  emptySub:  { fontSize: 13, color: Colors.textMuted },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border },
  attachBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, backgroundColor: Colors.bg, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, color: Colors.text, maxHeight: 100 },
  sendBtn:    { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnOff: { backgroundColor: '#b0c0f8' },
  sendIcon:   { color: Colors.white, fontSize: 16 },
});
