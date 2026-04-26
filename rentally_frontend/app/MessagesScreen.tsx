import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity,
  FlatList, SafeAreaView, ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { SquarePen, MessageSquareOff, CheckCheck, Check } from 'lucide-react-native';
import { MessageThreadAPI, MessageThread } from '../services/api';
import BottomNav, { TabName } from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/colors';
import { cn } from '../utils/cn';

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

const AVATAR_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#f97316'];
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

  const renderItem = ({ item }: { item: MessageThread }) => {
    const hasUnread = item.unread_count > 0;
    
    return (
      <TouchableOpacity
        className="flex-row items-center px-5 py-4"
        onPress={() => onNavigate('chat', {
          senderId: currentUser?.id,
          receiverId: item.partner_id,
          listingId: item.listing_id,
          receiverName: item.partner_name,
        })}
        activeOpacity={0.7}
      >
        <View className="relative">
          {item.partner_avatar ? (
            <Image source={{ uri: item.partner_avatar }} className="w-16 h-16 rounded-full" />
          ) : (
            <View 
              className="w-16 h-16 rounded-full items-center justify-center border-2 border-white" 
              style={{ backgroundColor: getAvatarColor(item.partner_id) }}
            >
              <Text className="text-2xl font-black text-white">{item.partner_name?.[0]?.toUpperCase() ?? '?'}</Text>
            </View>
          )}
          {/* Online indicator mock */}
          <View className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-white" />
        </View>

        <View className="flex-1 ml-4 justify-center">
          <View className="flex-row justify-between items-center mb-1">
            <Text className={cn("text-base font-black tracking-tight", hasUnread ? "text-foreground" : "text-foreground/80")} numberOfLines={1}>
              {item.partner_name}
            </Text>
            <Text className={cn("text-xs font-bold", hasUnread ? "text-primary" : "text-muted-foreground")}>
              {formatSimpleTime(item.last_message_created)}
            </Text>
          </View>

          <View className="flex-row items-center">
            {item.is_outgoing && (
              <View className="mr-1">
                {hasUnread ? (
                  <Check size={14} className="text-muted-foreground" />
                ) : (
                  <CheckCheck size={14} className="text-primary" />
                )}
              </View>
            )}
            <Text className={cn("text-sm flex-1", hasUnread ? "text-foreground font-black" : "text-muted-foreground font-medium")} numberOfLines={1}>
              {item.last_message_text}
            </Text>
            {hasUnread && (
              <View className="bg-primary w-5 h-5 rounded-full items-center justify-center ml-2">
                <Text className="text-[10px] font-black text-white">{item.unread_count}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" style={{ flex: 1 }}>
      {/* Header */}
      <View className="px-5 py-4 border-b border-border flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-black text-foreground tracking-tight">Чатууд</Text>
          <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Таны харилцан ярианууд</Text>
        </View>
        <TouchableOpacity className="w-10 h-10 rounded-xl bg-secondary items-center justify-center border border-border">
          <SquarePen size={20} className="text-foreground" />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={item => String(item.partner_id)}
          renderItem={renderItem}
          className="flex-1"
          contentContainerClassName="py-2 pb-24"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-32 px-10 gap-4">
              <View className="w-20 h-20 bg-muted rounded-full items-center justify-center">
                <MessageSquareOff size={40} className="text-muted-foreground/30" />
              </View>
              <Text className="text-lg font-black text-foreground text-center">Мессеж байхгүй байна</Text>
              <Text className="text-sm font-medium text-muted-foreground text-center">
                Түрээсийн зарууд дээр очиж эзэнтэй нь чатлаж эхлээрэй.
              </Text>
            </View>
          }
        />
      )}
      
      <BottomNav active="messages" onNavigate={onNavigate} />
    </SafeAreaView>
  );
}
