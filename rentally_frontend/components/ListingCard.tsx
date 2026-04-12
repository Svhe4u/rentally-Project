import React, { useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  Animated, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

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
  /** Card width (default: screen-width - 32) */
  width?: number;
  /** Show compact layout for horizontal scroll */
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

  if (compact) {
    return (
      <TouchableOpacity
        style={[c.card, c.cardCompact, { width: width ?? 200 }]}
        onPress={() => onPress?.(id)}
        activeOpacity={0.85}
      >
        {/* Image */}
        <View style={c.imgWrapCompact}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={c.imgCompact} resizeMode="cover" />
          ) : (
            <View style={c.imgPlaceholder}>
              <Ionicons name="home-outline" size={32} color="#ccc" />
            </View>
          )}
          {/* Favorite */}
          <TouchableOpacity style={c.favBtnCompact} onPress={handleFavorite} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={20}
                color={isFavorite ? Colors.red : '#fff'}
              />
            </Animated.View>
          </TouchableOpacity>
          {/* Price badge */}
          <View style={c.priceBadgeCompact}>
            <Text style={c.priceBadgeTxt}>{priceLabel}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={c.infoCompact}>
          <Text style={c.titleCompact} numberOfLines={1}>{title}</Text>
          <Text style={c.locCompact} numberOfLines={1}>{location}</Text>
          <View style={c.specRow}>
            {rooms && <Text style={c.specTxt}>{rooms} өрөө</Text>}
            {area && <Text style={c.specTxt}>{area} м²</Text>}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[c.card, { width: width ?? undefined }]}
      onPress={() => onPress?.(id)}
      activeOpacity={0.85}
    >
      {/* Image */}
      <View style={c.imgWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={c.img} resizeMode="cover" />
        ) : (
          <View style={c.imgPlaceholder}>
            <Ionicons name="home-outline" size={48} color="#ccc" />
          </View>
        )}
        {/* Favorite */}
        <TouchableOpacity style={c.favBtn} onPress={handleFavorite} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? Colors.red : '#fff'}
            />
          </Animated.View>
        </TouchableOpacity>
        {/* Price overlay */}
        <View style={c.priceOverlay}>
          <Text style={c.priceOverlayTxt}>{priceLabel}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={c.info}>
        <View style={c.infoTop}>
          <Text style={c.title} numberOfLines={2}>{title}</Text>
          {location ? <Text style={c.loc} numberOfLines={1}>📍 {location}</Text> : null}
        </View>

        <View style={c.specRow}>
          {rooms && (
            <View style={c.spec}>
              <Ionicons name="bed-outline" size={14} color={Colors.textMuted} />
              <Text style={c.specTxt}>{rooms} өрөө</Text>
            </View>
          )}
          {area && (
            <View style={c.spec}>
              <Ionicons name="resize-outline" size={14} color={Colors.textMuted} />
              <Text style={c.specTxt}>{area} м²</Text>
            </View>
          )}
        </View>

        {(rating != null || reviewCount) && (
          <View style={c.ratingRow}>
            {rating != null && (
              <View style={c.ratingChip}>
                <Ionicons name="star" size={12} color="#f59e0b" />
                <Text style={c.ratingNum}>{rating.toFixed(1)}</Text>
              </View>
            )}
            {reviewCount != null && reviewCount > 0 && (
              <Text style={c.reviewCnt}>({reviewCount} үнэлгээ)</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const RADIUS = 24;
const c = StyleSheet.create({
  // ── Full card ──────────────────────────────────────────────
  card: {
    backgroundColor: Colors.white,
    borderRadius: RADIUS,
    overflow: 'hidden',
    marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  imgWrap: { height: 180, backgroundColor: Colors.bg },
  img: { width: '100%', height: '100%' },
  imgPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e8eaf0' },
  favBtn: {
    position: 'absolute', top: 10, right: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  priceOverlay: {
    position: 'absolute', bottom: 10, left: 10,
    backgroundColor: 'rgba(46,85,250,0.88)',
    borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10,
  },
  priceOverlayTxt: { color: '#fff', fontSize: 12, fontWeight: '900' },

  info: { padding: 14 },
  infoTop: { marginBottom: 8 },
  title: { fontSize: 16, fontWeight: '800', color: Colors.text, lineHeight: 22, marginBottom: 4 },
  loc: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  specRow: { flexDirection: 'row', gap: 14, marginBottom: 8 },
  spec: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  specTxt: { fontSize: 13, color: Colors.textMuted, fontWeight: '700' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#fffbeb', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 12, borderWidth: 1, borderColor: '#fde68a' },
  ratingNum: { fontSize: 12, fontWeight: '800', color: '#92400e' },
  reviewCnt: { fontSize: 11, color: Colors.textMuted },

  // ── Compact card ────────────────────────────────────────────
  cardCompact: { marginBottom: 0, marginRight: 12 },
  imgWrapCompact: { height: 120, backgroundColor: Colors.bg, position: 'relative' },
  imgCompact: { width: '100%', height: '100%' },
  favBtnCompact: {
    position: 'absolute', top: 8, right: 8,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  priceBadgeCompact: {
    position: 'absolute', bottom: 8, left: 8,
    backgroundColor: 'rgba(46,85,250,0.88)',
    borderRadius: 14, paddingVertical: 3, paddingHorizontal: 8,
  },
  priceBadgeTxt: { color: '#fff', fontSize: 11, fontWeight: '900' },
  infoCompact: { padding: 10 },
  titleCompact: { fontSize: 13, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  locCompact: { fontSize: 11, color: Colors.textMuted, marginBottom: 4 },
});
