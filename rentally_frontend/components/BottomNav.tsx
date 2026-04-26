import React from 'react';
import {
  View, TouchableOpacity, Text, Platform,
} from 'react-native';
import { 
  Home, 
  Heart, 
  Map as MapIcon, 
  MessageSquare, 
  User 
} from 'lucide-react-native';
import { cn } from '../utils/cn';

export type TabName = 'home' | 'saved' | 'map' | 'messages' | 'profile';

interface NavItem {
  key: TabName;
  icon: any;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'home',      icon: Home,          label: 'Нүүр' },
  { key: 'saved',     icon: Heart,         label: 'Хадгалсан' },
  { key: 'map',       icon: MapIcon,       label: 'Газар' },
  { key: 'messages',  icon: MessageSquare, label: 'Мессеж' },
  { key: 'profile',   icon: User,          label: 'Профайл' },
];

interface Props {
  active: TabName;
  onNavigate: (tab: TabName) => void;
}

export default function BottomNav({ active, onNavigate }: Props) {
  return (
    <View 
      className={cn(
        "absolute bottom-0 left-0 right-0 bg-background/95 border-t border-border flex-row items-center justify-around px-2",
        Platform.OS === 'ios' ? "pb-8 h-24" : "pb-2 h-18"
      )}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 20
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = active === item.key;
        const Icon = item.icon;

        return (
          <TouchableOpacity
            key={item.key}
            onPress={() => onNavigate(item.key)}
            className="flex-1 items-center justify-center py-2 gap-1"
            activeOpacity={0.7}
          >
            <View className={cn(
              "w-12 h-8 rounded-full items-center justify-center transition-all",
              isActive ? "bg-primary/10" : "bg-transparent"
            )}>
              <Icon 
                size={22} 
                className={cn(isActive ? "text-primary" : "text-muted-foreground")} 
                strokeWidth={isActive ? 2.5 : 2}
              />
            </View>
            <Text className={cn(
              "text-[10px] font-bold tracking-tight",
              isActive ? "text-primary" : "text-muted-foreground"
            )}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
