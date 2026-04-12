import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, SafeAreaView, ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { MessageThreadAPI, MessageThread } from '../services/api';
import BottomNav, { TabName } from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';

interface Props {
  onNavigate: (target: TabName | string, params?: any) => void;
}

const formatSimpleTime = (d: string) => {
  const date = new Date(d);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

  if (diffDays === 0) {
    return date.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Өчигдөр';
  if (diffDays < 7) {
    const days = ['Ням', 'Дав', 'Мяг', 'Лха', 'Пүр', 'Баа', 'Бям'];
    return days[date.getDay()];
  }
  return date.toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' });
};

const AVATAR_COLORS = ['#2e55fa', '#ff6b6b', '#f0ad00', '#20c997', '#845ef7', '#ff922b'];
const getAvatarColor = (id: number) => AVATAR_COLORS[id % AVATAR_COLORS.length];

export default function MessagesScreen({ onNavigate }: Props) {
  const { user: currentUser } = useAuth();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const resp = await MessageThreadAPI.list();
      setThreads(resp?.conversations ?? []);
    } catch (e) {
      console.error('Failed to load inbox:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const renderItem = ({ item }: { item: MessageThread }) => (
    <TouchableOpacity
      style={s.thread}
      onPress={() => onNavigate('chat', {
        senderId: currentUser?.id,
        receiverId: item.partner_id,
        listingId: item.listing_id,
        receiverName: item.partner_name,
      })}
      activeOpacity={0.7}
    >
      {/* Avatar Container */}
      <View style={s.avatarContainer}>
        {item.partner_avatar ? (
          <Image source={{ uri: item.partner_avatar }} style={s.avatar} />
        ) : (
          <View style={[s.avatar, { backgroundColor: getAvatarColor(item.partner_id) }]}>
            <Text style={s.avatarLtr}>{item.partner_name?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
        )}
      </View>

      {/* Text Content */}
      <View style={s.textContainer}>
        <View style={s.row}>
          <Text style={[s.name, item.unread_count > 0 && s.unreadText]} numberOfLines={1}>
            {item.partner_name}
          </Text>
          <Text style={[s.time, item.unread_count > 0 && s.unreadTime]}>
            {formatSimpleTime(item.last_message_created)}
          </Text>
        </View>

        <View style={s.row}>
          <Text style={[s.preview, item.unread_count > 0 && s.unreadText]} numberOfLines={1}>
            {item.is_outgoing ? 'Та: ' : ''}{item.last_message_text}
          </Text>
          {item.unread_count > 0 && (
            <View style={s.unreadDot} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Чатууд</Text>
        <TouchableOpacity style={s.addBtn}>
          <Ionicons name="create-outline" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={s.center}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={item => String(item.partner_id)}
          renderItem={renderItem}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <Ionicons name="chatbubble-ellipses-outline" size={60} color="#eee" />
              <Text style={s.emptyTxt}>Мессеж байхгүй байна</Text>
            </View>
          }
        />
      )}
      <BottomNav active="message" onNavigate={onNavigate} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.text },
  addBtn: {
    width: 36, height: 36, borderRadius: 18, 
    backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center'
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingVertical: 8 },
  
  thread: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 10,
  },
  avatarContainer: { position: 'relative' },
  avatar: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLtr: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  
  textContainer: { flex: 1, marginLeft: 14, justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  time: { fontSize: 13, color: Colors.textMuted },
  preview: { fontSize: 14, color: Colors.textMuted, flex: 1, marginRight: 8 },
  
  unreadText: { fontWeight: 'bold', color: Colors.text },
  unreadTime: { color: Colors.primary, fontWeight: '600' },
  unreadDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary },
  
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyTxt: { marginTop: 12, fontSize: 16, color: Colors.textMuted, fontWeight: '500' },
});
