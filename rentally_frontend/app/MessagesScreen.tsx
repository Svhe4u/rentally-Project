import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, SafeAreaView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { MessageThreadAPI, MessageThread } from '../services/api';

interface Props {
  onNavigate: (screen: string, params?: any) => void;
  userId?: number;
}

const timeAgo = (d: string) => {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return 'Одоо';
  if (s < 3600) return `${Math.floor(s / 60)} мин`;
  if (s < 86400) return `${Math.floor(s / 3600)} цаг`;
  if (s < 604800) return `${Math.floor(s / 86400)} өдөр`;
  return new Date(d).toLocaleDateString('mn-MN');
};

const fmtPrice = (p: number) =>
  p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

const AVATAR_COLORS = ['#2e55fa', '#ff6b6b', '#f0ad00', '#20c997', '#845ef7', '#ff922b'];
const getAvatarColor = (id: number) => AVATAR_COLORS[id % AVATAR_COLORS.length];

export default function MessagesScreen({ onNavigate, userId = 1 }: Props) {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await MessageThreadAPI.list(userId);
      setThreads(data ?? []);
    } catch {
      // silently handle — threads stay empty on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const renderItem = ({ item }: { item: MessageThread }) => (
    <TouchableOpacity
      style={s.thread}
      onPress={() => onNavigate('chat', {
        senderId: userId,
        receiverId: item.partner_id,
        listingId: item.listing_id,
        receiverName: item.partner_name,
      })}
      activeOpacity={0.8}
    >
      {/* Avatar */}
      <View style={[s.avatar, { backgroundColor: getAvatarColor(item.partner_id) }]}>
        <Text style={s.avatarLtr}>{item.partner_name?.[0]?.toUpperCase() ?? '?'}</Text>
      </View>

      {/* Content */}
      <View style={s.content}>
        <View style={s.topRow}>
          <Text style={s.name} numberOfLines={1}>{item.partner_name ?? `Хэрэглэгч #${item.partner_id}`}</Text>
          <Text style={s.time}>{timeAgo(item.last_message_created)}</Text>
        </View>

        {item.listing_title && (
          <View style={s.listingRow}>
            <Ionicons name="home-outline" size={10} color={Colors.primary} />
            <Text style={s.listingTitle} numberOfLines={1}>
              {item.listing_title}
              {item.listing_price
                ? ` · ${fmtPrice(item.listing_price)} ₮`
                : ''}
            </Text>
          </View>
        )}

        <Text style={s.preview} numberOfLines={1}>
          {item.last_message_text}
        </Text>
      </View>

      {/* Thumbnail + chevron */}
      <View style={s.rightCol}>
        {item.listing_thumb && (
          <View style={s.thumb}>
            <Ionicons name="image-outline" size={16} color="#ccc" />
          </View>
        )}
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>💬 Мессежүүд</Text>
        <TouchableOpacity style={s.addBtn}>
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={s.loadingTxt}>Уншиж байна...</Text>
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={item => String(item.partner_id)}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={Colors.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={s.sep} />}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <Ionicons name="chatbubbles-outline" size={64} color="#ddd" />
              <Text style={s.emptyTxt}>Мессеж байхгүй</Text>
              <Text style={s.emptySub}>Байрны зар дээр мессеж илгээх</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: Colors.text ,textAlign:'center'},
  addBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  list: { paddingHorizontal: 12, paddingTop: 8 },
  sep: { height: 6 },

  thread: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 14, padding: 14,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  avatarLtr: { fontSize: 20, fontWeight: '900', color: '#fff' },
  content: { flex: 1, gap: 2 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 14, fontWeight: '800', color: Colors.text, flex: 1 },
  time: { fontSize: 11, color: Colors.textMuted, marginLeft: 6 },
  listingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 2,
  },
  listingTitle: {
    fontSize: 11, color: Colors.primary, fontWeight: '600',
    flex: 1,
  },
  preview: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  rightCol: { alignItems: 'center', gap: 8, flexShrink: 0 },
  thumb: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: Colors.bg,
    alignItems: 'center', justifyContent: 'center',
  },

  emptyBox: {
    alignItems: 'center', justifyContent: 'center',
    paddingTop: 100, paddingHorizontal: 32, gap: 12,
  },
  emptyTxt: { fontSize: 17, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  emptySub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
});
