import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  SafeAreaView, Alert,
} from 'react-native';
import { 
  Settings, 
  ChevronRight, 
  Heart, 
  MessageSquare, 
  Calendar, 
  Building2, 
  User, 
  ShieldCheck, 
  Bell, 
  HelpCircle, 
  Info, 
  LogOut,
  Camera,
  Star
} from 'lucide-react-native';
import { Colors } from '../constants/colors';
import BottomNav, { TabName } from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import { FavoriteAPI, MessageThreadAPI, BookingAPI } from '../services/api';
import { cn } from '../utils/cn';

interface Props {
  onNavigate: (tab: TabName) => void;
}

function MenuItem({ icon: Icon, title, sub, onPress, isDestructive }: any) {
  return (
    <TouchableOpacity 
      className="flex-row items-center justify-between px-5 py-4" 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      <View className="flex-row items-center gap-4">
        <View className={cn(
          "w-10 h-10 rounded-xl items-center justify-center",
          isDestructive ? "bg-red-50" : "bg-primary/5"
        )}>
          <Icon size={20} className={cn(isDestructive ? "text-red-500" : "text-primary")} />
        </View>
        <View>
          <Text className={cn("text-base font-bold", isDestructive ? "text-red-500" : "text-foreground")}>{title}</Text>
          {sub && <Text className="text-xs font-medium text-muted-foreground mt-0.5">{sub}</Text>}
        </View>
      </View>
      <ChevronRight size={18} className="text-muted-foreground/30" />
    </TouchableOpacity>
  );
}

function StatItem({ icon: Icon, label, count, onPress }: any) {
  return (
    <TouchableOpacity className="flex-1 items-center gap-2" onPress={onPress} activeOpacity={0.7}>
      <View className="w-12 h-12 rounded-2xl bg-card items-center justify-center border border-border shadow-sm shadow-black/5">
        <Icon size={22} className="text-primary" />
      </View>
      <View className="items-center">
        <Text className="text-lg font-black text-foreground tracking-tight">{count}</Text>
        <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ onNavigate }: Props) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ favorites: 0, messages: 0, bookings: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [favs, msgs, bks] = await Promise.all([
          FavoriteAPI.list(),
          MessageThreadAPI.list(),
          BookingAPI.list(),
        ]);
        const favRows = (favs as any)?.results ?? favs;
        setStats({
          favorites: Array.isArray(favRows) ? favRows.length : 0,
          messages: msgs?.conversations?.length || 0,
          bookings: Array.isArray(bks) ? bks.length : 0,
        });
      } catch (e) {
        console.error('Stats fetch error:', e);
      }
    };
    if (user) fetchStats();
  }, [user]);

  const handleLogout = () => {
    Alert.alert(
      'Системээс гарах',
      'Та системээс гарахдаа итгэлтэй байна уу?',
      [
        { text: 'Буцах', style: 'cancel' },
        { text: 'Гарах', style: 'destructive', onPress: logout }
      ]
    );
  };

  const userInitials = user?.username?.slice(0, 2).toUpperCase() || '??';

  return (
    <SafeAreaView className="flex-1 bg-background" style={{ flex: 1 }}>
      <ScrollView
        className="flex-1"
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pt-6 pb-32"
      >
        {/* User Card */}
        <View className="mx-5 bg-card border border-border rounded-[32px] p-6 shadow-sm shadow-black/5 relative overflow-hidden">
          <View className="absolute -right-10 -top-10 w-40 h-40 bg-primary/5 rounded-full" />
          
          <View className="flex-row items-center">
            <View className="relative">
              <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center border-2 border-primary/20">
                <Text className="text-3xl font-black text-primary">{userInitials}</Text>
              </View>
              <TouchableOpacity className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary border-4 border-white items-center justify-center shadow-sm">
                <Camera size={12} color="white" strokeWidth={3} />
              </TouchableOpacity>
            </View>
            
            <View className="flex-1 ml-5">
              <View className="flex-row items-center gap-2 mb-1">
                <Text className="text-xl font-black text-foreground tracking-tight">{user?.username || 'Зочин'}</Text>
                {user?.role === 'broker' && <Star size={16} fill="#f59e0b" color="#f59e0b" />}
              </View>
              <Text className="text-sm font-medium text-muted-foreground">{user?.email || 'И-мэйл байхгүй'}</Text>
              <View className="bg-primary/10 px-2.5 py-1 rounded-full self-start mt-3">
                <Text className="text-[10px] font-black text-primary uppercase tracking-wider">
                  {user?.role === 'broker' ? 'Баталгаажсан зуучлагч' : 'Ренталли хэрэглэгч'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View className="mx-5 mt-8 flex-row items-center justify-between">
          <StatItem icon={Heart} label="Хадгалсан" count={stats.favorites} onPress={() => onNavigate('saved')} />
          <StatItem icon={MessageSquare} label="Мессеж" count={stats.messages} onPress={() => onNavigate('messages')} />
          <StatItem icon={Calendar} label="Захиалга" count={stats.bookings} onPress={() => Alert.alert('Тун удахгүй')} />
        </View>

        {/* Broker CTA */}
        {user?.role !== 'broker' && (
          <TouchableOpacity 
            className="mx-5 mt-10 bg-slate-900 rounded-[32px] p-6 flex-row items-center justify-between overflow-hidden relative" 
            activeOpacity={0.9}
            onPress={() => Alert.alert('Зуучлагч болох хүсэлт илгээх үү?')}
          >
            <View className="absolute -right-6 -top-10 w-24 h-24 bg-primary/20 rounded-full" />
            <View className="flex-row items-center gap-4">
              <View className="w-14 h-14 rounded-2xl bg-primary items-center justify-center shadow-lg shadow-primary/20">
                <Building2 size={28} color="white" strokeWidth={1.5} />
              </View>
              <View className="flex-1 pr-4">
                <Text className="text-white font-black text-lg tracking-tight">Зуучлагч болох уу?</Text>
                <Text className="text-slate-400 text-xs font-medium mt-0.5">Үл хөдлөх хөрөнгөө түрээслүүлж, орлогоо нэмэгдүүл.</Text>
              </View>
            </View>
            <ChevronRight size={20} color="white" />
          </TouchableOpacity>
        )}

        {/* Menu Sections */}
        <View className="mx-5 mt-10 bg-card border border-border rounded-[32px] overflow-hidden">
          <View className="px-5 pt-8 pb-4 border-b border-border/50">
            <Text className="text-[11px] font-black text-muted-foreground uppercase tracking-[2px]">Миний тохиргоо</Text>
          </View>
          <MenuItem icon={User} title="Профайл засах" sub="Нэр, утасны дугаар шинэчлэх" />
          <MenuItem icon={ShieldCheck} title="Аюулгүй байдал" sub="Нууц үг солих, хамгаалалт" />
          <MenuItem icon={Bell} title="Мэдэгдэл" sub="Мэдэгдлийн тохиргоо" />
        </View>

        <View className="mx-5 mt-6 bg-card border border-border rounded-[32px] overflow-hidden">
          <View className="px-5 pt-8 pb-4 border-b border-border/50">
            <Text className="text-[11px] font-black text-muted-foreground uppercase tracking-[2px]">Дэмжлэг & Тусламж</Text>
          </View>
          <MenuItem icon={HelpCircle} title="Тусламжийн төв" sub="Түгээмэл асуулт хариулт" />
          <MenuItem icon={Info} title="Бидний тухай" sub="Апп-ын мэдээлэл" />
          <MenuItem icon={LogOut} title="Системээс гарах" isDestructive onPress={handleLogout} />
        </View>

        {/* Settings Button */}
        <TouchableOpacity className="mx-5 mt-6 bg-secondary h-16 rounded-[24px] border border-border items-center justify-center flex-row gap-2">
          <Settings size={18} className="text-muted-foreground" />
          <Text className="text-sm font-black text-muted-foreground">Нэмэлт тохиргоо</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View className="mt-12 items-center">
          <View className="w-12 h-1 bg-border rounded-full mb-4" />
          <Text className="text-foreground/30 font-black tracking-[4px] text-[10px]">RENTALLY V1.0.4</Text>
          <Text className="text-[9px] font-bold text-foreground/20 mt-1 uppercase">Cloud Property Management Systems</Text>
        </View>
      </ScrollView>

      <BottomNav active="profile" onNavigate={onNavigate} />
    </SafeAreaView>
  );
}
