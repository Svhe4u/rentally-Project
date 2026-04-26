import React, { useRef } from 'react';
import {
  View, Text, TouchableOpacity, Image,
  Animated,
} from 'react-native';
import { Heart, MapPin, Bed, Maximize, Star } from 'lucide-react-native';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { cn } from '../utils/cn';

interface ListingCardProps {
  id: number;
  title: string;
  price: number;
  priceType: string;
  address?: string;
  regionName?: string;
  districtName?: string;
  imageUrl?: string;
  area?: number;
  rooms?: number;
  rating?: number | null;
  reviewCount?: number;
  isFavorite?: boolean;
  onPress?: (id: number) => void;
  onFavorite?: (id: number) => void;
  width?: number;
  compact?: boolean;
}

const PRICE_SUFFIX: Record<string, string> = {
  monthly: '/сар', yearly: '/жил', daily: '/өдөр', total: '',
};

const fmtPrice = (p: number) =>
  p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export default function ListingCard({
  id, title, price, priceType, address, regionName, districtName,
  imageUrl, area, rooms, rating, reviewCount,
  isFavorite = false, onPress, onFavorite, width, compact = false,
}: ListingCardProps) {
  const heartScale = useRef(new Animated.Value(1)).current;

  const handleFavorite = () => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true, speed: 40 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 30 }),
    ]).start();
    onFavorite?.(id);
  };

  const priceLabel = `${fmtPrice(price)} ₮${PRICE_SUFFIX[priceType] ?? ''}`;
  const location = [districtName, regionName].filter(Boolean).join(', ') || address || '';

  return (
    <TouchableOpacity
      onPress={() => onPress?.(id)}
      activeOpacity={0.85}
      style={width ? { width } : undefined}
      className={cn('mr-4 last:mr-0', !compact && 'w-full mb-4 mr-0')}
    >
      <Card className="overflow-hidden border-border bg-card shadow-sm shadow-black/5">
        {/* Image Area */}
        <View className={cn('relative bg-muted', compact ? 'h-48' : 'h-64')}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <MapPin size={48} className="text-muted-foreground/20" />
            </View>
          )}

          {/* Favorite Badge */}
          <TouchableOpacity 
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md items-center justify-center border border-white/20"
            onPress={handleFavorite}
          >
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Heart 
                size={22} 
                fill={isFavorite ? '#ef4444' : 'transparent'} 
                color={isFavorite ? '#ef4444' : 'white'} 
              />
            </Animated.View>
          </TouchableOpacity>

          {/* Price Tag */}
          <View className="absolute bottom-4 left-4">
            <Badge 
              label={priceLabel} 
              variant="default" 
              className="bg-primary px-3 py-1.5 h-auto rounded-xl" 
              labelClasses="text-sm font-black" 
            />
          </View>
        </View>

        {/* Info Area */}
        <View className="p-5">
          <View className="mb-2">
            <Text className="text-lg font-black text-foreground tracking-tight leading-6" numberOfLines={2}>
              {title}
            </Text>
            {location ? (
              <View className="flex-row items-center mt-1">
                <MapPin size={12} className="text-muted-foreground mr-1" />
                <Text className="text-xs font-semibold text-muted-foreground" numberOfLines={1}>
                  {location}
                </Text>
              </View>
            ) : null}
          </View>

          <View className="flex-row items-center gap-4 mt-2">
            {rooms && (
              <View className="flex-row items-center gap-1.5 bg-secondary px-2.5 py-1.5 rounded-lg border border-border">
                <Bed size={14} className="text-primary" />
                <Text className="text-xs font-bold text-foreground">{rooms} өрөө</Text>
              </View>
            )}
            {area && (
              <View className="flex-row items-center gap-1.5 bg-secondary px-2.5 py-1.5 rounded-lg border border-border">
                <Maximize size={14} className="text-primary" />
                <Text className="text-xs font-bold text-foreground">{area} м²</Text>
              </View>
            )}
            {rating != null && (
               <View className="flex-row items-center gap-1.5 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-100 ml-auto">
                 <Star size={14} fill="#f59e0b" color="#f59e0b" />
                 <Text className="text-xs font-black text-amber-700">{rating.toFixed(1)}</Text>
               </View>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}
