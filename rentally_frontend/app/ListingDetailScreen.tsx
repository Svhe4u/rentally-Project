import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Modal, ActivityIndicator,
  Dimensions, Image, Alert, Animated, StatusBar, Pressable,
} from 'react-native';
import {
  ChevronLeft, Heart, Share2, MapPin, Star,
  Bed, Bath, Scaling, Flame, Layers, Wind,
  Calendar as CalendarIcon, ArrowRight, MessageCircle,
  CheckCircle2, X, CreditCard, ChevronRight,
  Home, Building2, DoorOpen, Eye,
} from 'lucide-react-native';
import { DatePicker } from '../components/ui/DatePicker';
import { TabName } from '../components/BottomNav';
import {
  FavoriteAPI, ListingAPI, MessageAPI,
  MongoliaAPI, ReviewAPI, UserAPI, BookingAPI,
} from '../services/api';
import { cn } from '../utils/cn';
import { Badge } from '../components/ui/Badge';

const { width: W, height: H } = Dimensions.get('window');
const HERO_H = Math.round(H * 0.45);

// ─── Local Types ──────────────────────────────────────────────
interface Details {
  bedrooms?: number; bathrooms?: number; area_sqm?: number;
  floor_type?: string; window_type?: string; door_type?: string;
  balcony?: boolean; garage?: boolean; year_built?: number;
  floor_number?: number; building_floors?: number; window_count?: number;
  payment_terms?: string; heating_type?: string; air_type?: string;
  utilities_estimated?: number;
}
interface ExtraFeature { id: number; key: string; value: string; }
interface Review {
  id: number; user: number; user_username: string;
  rating: number; comment: string; created_at: string;
}
interface Owner {
  id: number; username: string; phone?: string; role: string;
  broker_profile?: { agency_name?: string; profile_image?: string; is_verified?: boolean };
}
interface Listing {
  id: number; title: string; description?: string; address?: string;
  price: number; price_type: string; created_at: string;
  owner: Owner;
  category?: { id: number; name: string };
  region?: { id: number; name: string };
  details?: Details;
  images: { id: number; image_url: string }[];
  extra_features: ExtraFeature[];
  reviews: Review[];
  review_count?: number;
  rating_avg: number | null;
}
interface UtilityFmt { min: string; max: string; }

interface Props {
  visible: boolean;
  listingId: number | null;
  onClose: () => void;
  onNavigate?: (tab: TabName) => void;
}

// ─── Helpers ──────────────────────────────────────────────────
const fmt = (p: number) => p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const PRICE_SUFFIX: Record<string, string> = { monthly: '/сар', yearly: '/жил', daily: '/өдөр' };
const timeAgo = (d: string) => {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return 'Саяхан';
  if (s < 3600) return `${Math.floor(s / 60)} мин өмнө`;
  if (s < 86400) return `${Math.floor(s / 3600)} цаг өмнө`;
  return `${Math.floor(s / 86400)} өдөр өмнө`;
};

// ─── Main Component ───────────────────────────────────────────
export default function ListingDetailScreen({ visible, listingId, onClose }: Props) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFav, setIsFav]     = useState(false);
  const [imgIdx, setImgIdx]   = useState(0);
  const [utility, setUtility] = useState<UtilityFmt | null>(null);
  const [similar, setSimilar] = useState<Listing[]>([]);

  // Messaging
  const [msgOpen, setMsgOpen]       = useState(false);
  const [msgText, setMsgText]       = useState('');
  const [msgSending, setMsgSending] = useState(false);

  // Reviews
  const [rvOpen, setRvOpen]         = useState(false);
  const [rvRating, setRvRating]     = useState(0);
  const [rvText, setRvText]         = useState('');
  const [rvSending, setRvSending]   = useState(false);

  // Booking
  const [bookingOpen, setBookingOpen]     = useState(false);
  const [startDate, setStartDate]         = useState<Date | null>(null);
  const [endDate, setEndDate]             = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker]     = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Animations
  const scrollY    = useRef(new Animated.Value(0)).current;
  const slideX     = useRef(new Animated.Value(W)).current;
  const backdropOp = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  // Slide-in / slide-out animation
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideX, { toValue: 0, useNativeDriver: true, tension: 70, friction: 12 }),
        Animated.timing(backdropOp, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideX, { toValue: W, duration: 300, useNativeDriver: true }),
        Animated.timing(backdropOp, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideX, { toValue: W, duration: 300, useNativeDriver: true }),
      Animated.timing(backdropOp, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  // ── Data loading ──────────────────────────────────────────
  const load = useCallback(async () => {
    if (!listingId) return;
    setLoading(true);
    setListing(null);
    setUtility(null);
    setSimilar([]);
    setImgIdx(0);
    try {
      const raw = (await ListingAPI.detail(listingId)) as any;

      const d: Listing = {
        ...raw,
        price: parseFloat(String(raw.price)),
        owner: {
          id: raw.owner?.id ?? raw.owner,
          username: raw.owner?.username ?? raw.owner_username ?? 'Хэрэглэгч',
          phone: raw.owner?.phone,
          role: raw.owner?.role ?? 'user',
          broker_profile: raw.owner?.broker_profile,
        },
        category: raw.category ? { id: raw.category, name: raw.category_name ?? '' } : undefined,
        region: raw.region_name ? { id: raw.region, name: raw.region_name } : undefined,
        details: raw.detail ?? {},
        images: (raw.images ?? []).map((img: any) => ({ id: img.id, image_url: img.image_url })),
        extra_features: (raw.features ?? []).map((f: any) => ({ id: f.id, key: f.name, value: f.value })),
        reviews: raw.reviews ?? [],
        review_count: raw.review_count ?? 0,
        rating_avg: raw.average_rating ?? null,
      };

      setListing(d);

      // Side-load: favorite status
      FavoriteAPI.check(listingId).then(ck => setIsFav(!!ck.is_favorited)).catch(() => {});

      // Side-load: utility estimate
      if (d.details?.area_sqm) {
        MongoliaAPI.utilityEstimate(Number(d.details.area_sqm))
          .then(ud => { if (ud?.formatted) setUtility(ud.formatted); })
          .catch(() => {});
      }

      // Side-load: similar listings from same owner
      ListingAPI.list({ owner_id: d.owner.id, page_size: 5 })
        .then(res => setSimilar((res.results ?? []).filter((it: any) => it.id !== listingId)))
        .catch(() => {});

    } catch (e: any) {
      Alert.alert('Алдаа', e.message ?? 'Байр ачаалахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => { if (visible && listingId) load(); }, [visible, listingId]);

  // ── Actions ───────────────────────────────────────────────
  const toggleFav = async () => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true, tension: 100, friction: 10 }),
      Animated.spring(heartScale, { toValue: 1,   useNativeDriver: true, tension: 100, friction: 10 }),
    ]).start();
    try {
      if (isFav) { await FavoriteAPI.remove(listing!.id); setIsFav(false); }
      else        { await FavoriteAPI.toggle(listing!.id); setIsFav(true); }
    } catch { Alert.alert('Алдаа', 'Хадгалахад алдаа гарлаа'); }
  };

  const sendMsg = async () => {
    if (!msgText.trim() || !listing) return;
    setMsgSending(true);
    try {
      await MessageAPI.send({ recipient_id: listing.owner.id, content: msgText.trim(), listing_id: listing.id });
      setMsgText(''); setMsgOpen(false);
      Alert.alert('✅', 'Мессеж амжилттай илгээгдлээ!');
    } catch { Alert.alert('Алдаа', 'Мессеж илгээхэд алдаа гарлаа'); }
    finally  { setMsgSending(false); }
  };

  const postReview = async () => {
    if (rvRating === 0 || !listing) return;
    setRvSending(true);
    try {
      await ReviewAPI.create({ listing_id: listing.id, rating: rvRating, comment: rvText.trim() || undefined });
      setRvText(''); setRvRating(0); setRvOpen(false); load();
    } catch (e: any) { Alert.alert('Алдаа', e.message ?? 'Үнэлгээ нэмэхэд алдаа гарлаа'); }
    finally { setRvSending(false); }
  };

  const handleBooking = async () => {
    if (!startDate || !endDate || !listing) return;
    setBookingLoading(true);
    try {
      await BookingAPI.create({
        listing_id: listing.id,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      });
      setBookingOpen(false);
      Alert.alert('🎉 Амжилттай!', 'Таны түрээсийн хүсэлт илгээгдлээ. Зуучлагч удалгүй холбогдох болно.', [
        { text: 'Ойлголоо', onPress: handleClose }
      ]);
    } catch (e: any) { Alert.alert('Алдаа', e.message ?? 'Бүртгэхэд алдаа гарлаа'); }
    finally { setBookingLoading(false); }
  };

  // ── Derived ───────────────────────────────────────────────
  const days = () => {
    if (!startDate || !endDate) return 0;
    return Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / 86400000);
  };
  const totalPrice = (() => {
    if (!startDate || !endDate || !listing) return 0;
    const d = days();
    const price = listing.price ?? 0;

    // Calculate based on price type
    switch (listing.price_type) {
      case 'daily':
        return d * price;
      case 'monthly':
        // Approximate: 1 month = 30 days
        return Math.ceil((d / 30) * price);
      case 'yearly':
        // Approximate: 1 year = 365 days
        return Math.ceil((d / 365) * price);
      default:
        return d * price;
    }
  })();

  const headerBg = scrollY.interpolate({
    inputRange: [HERO_H - 100, HERO_H - 50],
    outputRange: ['rgba(255,255,255,0)', 'rgba(255,255,255,1)'],
    extrapolate: 'clamp',
  });
  const headerTextOp = scrollY.interpolate({
    inputRange: [HERO_H - 50, HERO_H],
    outputRange: [0, 1], extrapolate: 'clamp',
  });

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View
        style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', opacity: backdropOp }}
        pointerEvents="none"
      />
      <Animated.View style={{ flex: 1, backgroundColor: '#fff', transform: [{ translateX: slideX }] }}>
        <StatusBar barStyle="light-content" />

        {/* ── Floating Header ── */}
        <Animated.View
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
            backgroundColor: headerBg,
          }}
        >
          <SafeAreaView>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16 }}>
              <TouchableOpacity onPress={handleClose} style={styles.navBtn}>
                <ChevronLeft size={22} color="#fff" />
              </TouchableOpacity>
              <Animated.Text style={{ opacity: headerTextOp, flex: 1, textAlign: 'center', fontWeight: '900', color: '#1e293b', marginHorizontal: 12 }} numberOfLines={1}>
                {listing?.title}
              </Animated.Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={styles.navBtn}><Share2 size={18} color="#fff" /></TouchableOpacity>
                <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                  <TouchableOpacity onPress={toggleFav} style={styles.navBtn}>
                    <Heart size={18} fill={isFav ? '#ef4444' : 'none'} color={isFav ? '#ef4444' : '#fff'} />
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>
          </SafeAreaView>
        </Animated.View>

        {/* ── Loading ── */}
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={{ color: '#94a3b8', fontWeight: '700' }}>Байр уншиж байна...</Text>
          </View>
        ) : !listing ? null : (
          <>
            <Animated.ScrollView
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 130 }}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: false }
              )}
            >
              {/* ── Hero Image Pager ── */}
              <View style={{ height: HERO_H }}>
                <ScrollView
                  horizontal pagingEnabled showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={e => setImgIdx(Math.round(e.nativeEvent.contentOffset.x / W))}
                >
                  {listing.images.length === 0 ? (
                    <View style={{ width: W, height: HERO_H, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' }}>
                      <Home size={64} color="#94a3b8" />
                    </View>
                  ) : listing.images.map(img => (
                    <Image key={img.id} source={{ uri: img.image_url }} style={{ width: W, height: HERO_H }} resizeMode="cover" />
                  ))}
                </ScrollView>
                {/* Dots */}
                <View style={{ position: 'absolute', bottom: 20, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                  {listing.images.map((_, i) => (
                    <View key={i} style={{ height: 4, borderRadius: 4, backgroundColor: 'white', width: i === imgIdx ? 20 : 6, opacity: i === imgIdx ? 1 : 0.5 }} />
                  ))}
                </View>
                {/* Category badge */}
                <View style={{ position: 'absolute', bottom: 20, left: 20 }}>
                  <Badge label={listing.category?.name ?? 'Байр'} variant="default"
                    className="bg-slate-900 border-none px-4 py-1.5"
                    labelClasses="text-[10px] font-black uppercase text-white" />
                </View>
              </View>

              {/* ── Card start ── */}
              <View style={styles.card}>

                {/* Price + Rating */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.price}>
                      {fmt(listing.price)} ₮
                      <Text style={styles.priceSuffix}> {PRICE_SUFFIX[listing.price_type] ?? ''}</Text>
                    </Text>
                  </View>
                  {listing.rating_avg !== null && (
                    <View style={styles.ratingBadge}>
                      <Star size={12} fill="#fff" color="#fff" />
                      <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12 }}>{listing.rating_avg.toFixed(1)}</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.title}>{listing.title}</Text>

                {/* Location + Time */}
                <View style={{ flexDirection: 'row', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                  {(listing.region?.name || listing.address) && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <MapPin size={14} color="#3b82f6" />
                      <Text style={styles.meta}>{listing.region?.name ?? listing.address}</Text>
                    </View>
                  )}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <CalendarIcon size={14} color="#94a3b8" />
                    <Text style={styles.meta}>{timeAgo(listing.created_at)}</Text>
                  </View>
                </View>

                {/* ── Stat Cards: Bedrooms / Bathrooms / Area ── */}
                <SectionLabel>Үндсэн үзүүлэлт</SectionLabel>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                  <StatCard icon={Bed}     label={`${listing.details?.bedrooms ?? 0}`}   sub="Өрөө" />
                  <StatCard icon={Bath}    label={`${listing.details?.bathrooms ?? 0}`}  sub="Угаалга" />
                  <StatCard icon={Scaling} label={`${listing.details?.area_sqm ?? 0} м²`} sub="Талбай" />
                  {listing.details?.floor_number != null && listing.details?.building_floors != null && (
                    <StatCard icon={Layers} label={`${listing.details.floor_number}/${listing.details.building_floors}`} sub="Давхар" />
                  )}
                </View>

                {/* ── Heating & Air ── */}
                {(listing.details?.heating_type || listing.details?.air_type) && (
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
                    {listing.details?.heating_type && (
                      <View style={styles.infoChip}>
                        <Flame size={16} color="#3b82f6" />
                        <View>
                          <Text style={styles.chipLabel}>Халаалт</Text>
                          <Text style={styles.chipValue}>{listing.details.heating_type}</Text>
                        </View>
                      </View>
                    )}
                    {listing.details?.air_type && (
                      <View style={styles.infoChip}>
                        <Wind size={16} color="#3b82f6" />
                        <View>
                          <Text style={styles.chipLabel}>Агаар</Text>
                          <Text style={styles.chipValue}>{listing.details.air_type}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* ── Description ── */}
                <SectionLabel>Тайлбар</SectionLabel>
                <Text style={styles.description}>{listing.description ?? 'Тайлбар байхгүй байна.'}</Text>

                {/* ── Building Specs ── */}
                <SectionLabel>Барилгын үзүүлэлт</SectionLabel>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                  {listing.details?.floor_type   && <SpecBadge label="Шал"           value={listing.details.floor_type} />}
                  {listing.details?.window_type  && <SpecBadge label="Цонх"          value={listing.details.window_type} />}
                  {listing.details?.door_type    && <SpecBadge label="Хаалга"        value={listing.details.door_type} />}
                  {listing.details?.window_count != null && <SpecBadge label="Цонхны тоо"  value={`${listing.details.window_count}`} />}
                  {listing.details?.year_built   && <SpecBadge label="Баригдсан он"  value={`${listing.details.year_built}`} />}
                  <SpecBadge label="Тагт"  value={listing.details?.balcony ? 'Тийм ✓' : 'Үгүй'} />
                  <SpecBadge label="Гараж" value={listing.details?.garage  ? 'Тийм ✓' : 'Үгүй'} />
                </View>

                {/* ── Extra Features / Amenities ── */}
                {listing.extra_features.length > 0 && <>
                  <SectionLabel>Нэмэлт боломжууд</SectionLabel>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                    {listing.extra_features.map(f => (
                      <View key={f.id} style={styles.featureChip}>
                        <CheckCircle2 size={12} color="#3b82f6" />
                        <Text style={styles.featureText}>{f.key}</Text>
                        {f.value ? <Text style={styles.featureVal}> — {f.value}</Text> : null}
                      </View>
                    ))}
                  </View>
                </>}

                {/* ── Payment Terms ── */}
                {listing.details?.payment_terms && (
                  <View style={styles.darkCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <CreditCard size={14} color="rgba(255,255,255,0.5)" />
                      <Text style={styles.darkCardLabel}>Төлбөрийн нөхцөл</Text>
                    </View>
                    <Text style={styles.darkCardText}>{listing.details.payment_terms}</Text>
                  </View>
                )}

                {/* ── Utility Estimate ── */}
                {utility && (
                  <View style={[styles.darkCard, { backgroundColor: '#1e3a5f', marginBottom: 24 }]}>
                    <Text style={styles.darkCardLabel}>⚡ Сарын нийтийн үйлчилгээ (тооцоо)</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 }}>
                      <UtilItem label="Хамгийн бага" value={utility.min} />
                      <UtilItem label="Хамгийн их"   value={utility.max} />
                    </View>
                  </View>
                )}

                {/* ── Broker / Owner Card ── */}
                <SectionLabel>Зуучлагч</SectionLabel>
                <View style={styles.brokerCard}>
                  <View style={styles.brokerAvatar}>
                    <Text style={{ fontSize: 22, fontWeight: '900', color: '#3b82f6' }}>
                      {listing.owner.username[0]?.toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '900', fontSize: 15, color: '#1e293b' }}>{listing.owner.username}</Text>
                    <Text style={{ fontSize: 12, color: '#3b82f6', fontWeight: '700' }}>
                      {listing.owner.broker_profile?.agency_name ?? 'Бие даасан зуучлагч'}
                    </Text>
                    {listing.owner.broker_profile?.is_verified && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <CheckCircle2 size={11} color="#22c55e" />
                        <Text style={{ fontSize: 10, color: '#22c55e', fontWeight: '700' }}>Баталгаажсан</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => setMsgOpen(true)} style={styles.msgBtn}>
                    <MessageCircle size={20} color="#3b82f6" />
                  </TouchableOpacity>
                </View>

                {/* ── Reviews ── */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <SectionLabel style={{ marginBottom: 0 }}>
                    Үнэлгээ {listing.review_count ? `(${listing.review_count})` : ''}
                  </SectionLabel>
                  <TouchableOpacity onPress={() => setRvOpen(true)}>
                    <Text style={{ fontSize: 12, color: '#3b82f6', fontWeight: '700' }}>+ Үнэлэх</Text>
                  </TouchableOpacity>
                </View>

                {listing.reviews.length === 0 ? (
                  <View style={styles.emptyReview}>
                    <Text style={{ color: '#94a3b8', fontWeight: '700', fontSize: 13 }}>Одоогоор үнэлгээ байхгүй байна.</Text>
                  </View>
                ) : listing.reviews.slice(0, 3).map(r => (
                  <View key={r.id} style={styles.reviewCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <View style={styles.reviewAvatar}>
                        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>{r.user_username[0]?.toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '800', fontSize: 13, color: '#1e293b' }}>{r.user_username}</Text>
                        <Text style={{ fontSize: 10, color: '#94a3b8' }}>{timeAgo(r.created_at)}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                        <Star size={10} fill="#f59e0b" color="#f59e0b" />
                        <Text style={{ fontSize: 11, fontWeight: '900', color: '#92400e' }}>{r.rating}</Text>
                      </View>
                    </View>
                    {r.comment ? <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20 }}>{r.comment}</Text> : null}
                  </View>
                ))}

                {/* ── Similar Listings ── */}
                {similar.length > 0 && <>
                  <SectionLabel>Зуучлагчийн бусад байрнууд</SectionLabel>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -24 }} contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}>
                    {similar.map(s => (
                      <View key={s.id} style={styles.similarCard}>
                        {s.images?.[0] ? (
                          <Image source={{ uri: (s as any).cover_image ?? s.images[0].image_url }} style={{ width: 150, height: 100, borderRadius: 16 }} />
                        ) : (
                          <View style={{ width: 150, height: 100, borderRadius: 16, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' }}>
                            <Building2 size={28} color="#94a3b8" />
                          </View>
                        )}
                        <Text style={{ fontWeight: '800', fontSize: 12, color: '#1e293b', marginTop: 8 }} numberOfLines={2}>{s.title}</Text>
                        <Text style={{ fontWeight: '900', fontSize: 13, color: '#3b82f6', marginTop: 2 }}>{fmt(s.price)} ₮</Text>
                      </View>
                    ))}
                  </ScrollView>
                </>}

              </View>{/* end card */}
            </Animated.ScrollView>

            {/* ── Sticky Bottom Bar ── */}
            <View style={styles.bottomBar}>
              <TouchableOpacity onPress={() => setMsgOpen(true)} style={styles.bottomSecBtn}>
                <MessageCircle size={22} color="#1e293b" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setBookingOpen(true)} style={styles.bottomPrimaryBtn}>
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 }}>ЗАХИАЛГА ӨГӨХ</Text>
                <ChevronRight size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ═══════════════════════════════ BOOKING SHEET */}
        <Modal visible={bookingOpen} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Хугацаа сонгох</Text>
              <Text style={styles.sheetSub}>Байр түрээслэх эхлэх ба дуусах огноогоо сонгоно уу</Text>

              {/* Date display */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.datePill}>
                  <Text style={styles.datePillLabel}>ЭХЛЭХ</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <CalendarIcon size={13} color="#3b82f6" />
                    <Text style={styles.datePillVal}>{startDate ? startDate.toLocaleDateString('mn-MN') : 'Сонгоогүй'}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.datePill}>
                  <Text style={styles.datePillLabel}>ДУУСАХ</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <CalendarIcon size={13} color="#3b82f6" />
                    <Text style={styles.datePillVal}>{endDate ? endDate.toLocaleDateString('mn-MN') : 'Сонгоогүй'}</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <DatePicker
                 visible={showStartPicker}
                 value={startDate}
                 onChange={(d) => { setStartDate(d); setShowStartPicker(false); }}
                 onClose={() => setShowStartPicker(false)}
              />
              <DatePicker
                 visible={showEndPicker}
                 value={endDate}
                 minDate={startDate || new Date()}
                 onChange={(d) => { setEndDate(d); setShowEndPicker(false); }}
                 onClose={() => setShowEndPicker(false)}
              />

              {/* Quick select */}
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8', marginBottom: 10 }}>Хурдан сонгох:</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                {[
                  { label: '1 сар', days: 30 },
                  { label: '3 сар', days: 90 },
                  { label: '6 сар', days: 180 },
                  { label: '1 жил', days: 365 },
                ].map(opt => {
                  const isActive = endDate && days() === opt.days;
                  return (
                    <TouchableOpacity
                      key={opt.label}
                      onPress={() => { const s = new Date(); setStartDate(s); setEndDate(new Date(s.getTime() + opt.days * 86400000)); }}
                      style={[styles.quickBtn, isActive && styles.quickBtnActive]}
                    >
                      <Text style={[styles.quickBtnText, isActive && { color: '#fff' }]}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Total */}
              {startDate && endDate && (
                <View style={styles.totalRow}>
                  <View>
                    <Text style={{ fontSize: 10, fontWeight: '900', color: '#3b82f6', letterSpacing: 1 }}>НИЙТ ДҮН</Text>
                    <Text style={{ fontSize: 22, fontWeight: '900', color: '#3b82f6' }}>{fmt(totalPrice)} ₮</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748b' }}>{days()} хоног</Text>
                    <Text style={{ fontSize: 10, color: '#94a3b8' }}>Татвар багтсан</Text>
                  </View>
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                <TouchableOpacity onPress={() => setBookingOpen(false)} style={[styles.sheetBtn, { backgroundColor: '#f1f5f9', flex: 1 }]}>
                  <Text style={{ fontWeight: '900', color: '#1e293b' }}>БОЛИХ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleBooking}
                  disabled={!startDate || !endDate || bookingLoading}
                  style={[styles.sheetBtn, { flex: 2, backgroundColor: '#3b82f6', opacity: (!startDate || !endDate) ? 0.5 : 1 }]}
                >
                  {bookingLoading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={{ fontWeight: '900', color: '#fff' }}>БАТАЛГААЖДУУЛАХ</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ═══════════════════════════════ MESSAGE SHEET */}
        <Modal visible={msgOpen} transparent animationType="slide">
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }} onPress={() => setMsgOpen(false)}>
            <Pressable onPress={e => e.stopPropagation()}>
              <View style={styles.sheet}>
                <TouchableOpacity onPress={() => setMsgOpen(false)} style={{ position: 'absolute', top: 20, right: 20, zIndex: 10, padding: 6 }}>
                  <X size={20} color="#94a3b8" />
                </TouchableOpacity>
                <View style={styles.sheetHandle} />
                <Text style={styles.sheetTitle}>Мессеж илгээх</Text>
                <Text style={styles.sheetSub}>{listing?.owner.username} руу чатлах</Text>
                <View style={{ backgroundColor: '#f1f5f9', borderRadius: 20, padding: 16, height: 120, marginBottom: 16 }}>
                  <TextInput multiline placeholder="Бичнэ үү..." style={{ fontSize: 14, fontWeight: '600', color: '#1e293b', flex: 1 }} value={msgText} onChangeText={setMsgText} />
                </View>
                <TouchableOpacity onPress={sendMsg} disabled={!msgText.trim() || msgSending} style={[styles.sheetBtn, { backgroundColor: '#3b82f6', opacity: (!msgText.trim() || msgSending) ? 0.5 : 1 }]}>
                  {msgSending ? <ActivityIndicator color="#fff" /> : <Text style={{ fontWeight: '900', color: '#fff' }}>ИЛГЭЭХ</Text>}
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* ═══════════════════════════════ REVIEW SHEET */}
        <Modal visible={rvOpen} transparent animationType="slide">
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }} onPress={() => setRvOpen(false)}>
            <Pressable onPress={e => e.stopPropagation()}>
              <View style={styles.sheet}>
                <TouchableOpacity onPress={() => setRvOpen(false)} style={{ position: 'absolute', top: 20, right: 20, zIndex: 10, padding: 6 }}>
                  <X size={20} color="#94a3b8" />
                </TouchableOpacity>
                <View style={styles.sheetHandle} />
                <Text style={styles.sheetTitle}>Үнэлгээ өгөх</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
                  {[1,2,3,4,5].map(n => (
                    <TouchableOpacity key={n} onPress={() => setRvRating(n)}>
                      <Star size={36} fill={n <= rvRating ? '#f59e0b' : 'none'} color="#f59e0b" />
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={{ backgroundColor: '#f1f5f9', borderRadius: 20, padding: 16, height: 120, marginBottom: 16 }}>
                  <TextInput multiline placeholder="Сэтгэгдэл бичих (заавал биш)..." style={{ fontSize: 14, fontWeight: '600', color: '#1e293b', flex: 1 }} value={rvText} onChangeText={setRvText} />
                </View>
                <TouchableOpacity onPress={postReview} disabled={rvRating === 0 || rvSending} style={[styles.sheetBtn, { backgroundColor: '#f59e0b', opacity: (rvRating === 0 || rvSending) ? 0.5 : 1 }]}>
                  {rvSending ? <ActivityIndicator color="#fff" /> : <Text style={{ fontWeight: '900', color: '#1e293b' }}>ҮНЭЛЭХ</Text>}
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

      </Animated.View>
    </Modal>
  );
}

// ─── Helper Components ────────────────────────────────────────
function SectionLabel({ children, style }: { children: React.ReactNode; style?: any }) {
  return <Text style={[{ fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12, marginTop: 4 }, style]}>{children}</Text>;
}

function StatCard({ icon: Icon, label, sub }: any) {
  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', paddingVertical: 14, paddingHorizontal: 10, borderRadius: 20, alignItems: 'center', gap: 4 }}>
      <Icon size={18} color="#3b82f6" />
      <Text style={{ fontWeight: '900', fontSize: 13, color: '#1e293b', textAlign: 'center' }}>{label}</Text>
      {sub && <Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>{sub}</Text>}
    </View>
  );
}

function SpecBadge({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, minWidth: '30%' }}>
      <Text style={{ fontSize: 9, fontWeight: '900', color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>{label}</Text>
      <Text style={{ fontSize: 12, fontWeight: '900', color: '#1e293b' }}>{value}</Text>
    </View>
  );
}

function UtilItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' }}>{label}</Text>
      <Text style={{ fontSize: 16, color: '#fff', fontWeight: '900', marginTop: 2 }}>{value}</Text>
    </View>
  );
}

// ─── StyleSheet constants ─────────────────────────────────────
const styles = {
  navBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center' as const, justifyContent: 'center' as const },
  card: { backgroundColor: '#fff', borderTopLeftRadius: 40, borderTopRightRadius: 40, marginTop: -36, paddingHorizontal: 24, paddingTop: 32 },
  price: { fontSize: 28, fontWeight: '900' as const, color: '#1e293b', letterSpacing: -0.5 },
  priceSuffix: { fontSize: 13, fontWeight: '600' as const, color: '#94a3b8' },
  ratingBadge: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, backgroundColor: '#f59e0b', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  title: { fontSize: 20, fontWeight: '800' as const, color: '#1e293b', marginBottom: 10, lineHeight: 26 },
  meta: { fontSize: 13, fontWeight: '700' as const, color: '#64748b' },
  description: { fontSize: 15, color: '#475569', lineHeight: 24, fontWeight: '500' as const, marginBottom: 24 },
  infoChip: { flex: 1, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, backgroundColor: '#eff6ff', padding: 14, borderRadius: 20, borderWidth: 1, borderColor: '#bfdbfe' },
  chipLabel: { fontSize: 9, fontWeight: '900' as const, color: '#93c5fd', letterSpacing: 1, textTransform: 'uppercase' as const },
  chipValue: { fontSize: 12, fontWeight: '800' as const, color: '#1e3a8a' },
  featureChip: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  featureText: { fontSize: 11, fontWeight: '700' as const, color: '#1e293b' },
  featureVal: { fontSize: 11, color: '#64748b', fontWeight: '500' as const },
  darkCard: { backgroundColor: '#0f172a', borderRadius: 28, padding: 20, marginBottom: 16 },
  darkCardLabel: { fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: '900' as const, letterSpacing: 1.5, textTransform: 'uppercase' as const },
  darkCardText: { fontSize: 13, color: '#fff', fontWeight: '600' as const, lineHeight: 20, marginTop: 4 },
  brokerCard: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 14, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', padding: 16, borderRadius: 28, marginBottom: 24 },
  brokerAvatar: { width: 52, height: 52, borderRadius: 18, backgroundColor: '#eff6ff', alignItems: 'center' as const, justifyContent: 'center' as const },
  msgBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#eff6ff', alignItems: 'center' as const, justifyContent: 'center' as const },
  emptyReview: { backgroundColor: '#f8fafc', borderRadius: 20, padding: 24, alignItems: 'center' as const, marginBottom: 24 },
  reviewCard: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 20, padding: 16, marginBottom: 10 },
  reviewAvatar: { width: 32, height: 32, borderRadius: 12, backgroundColor: '#1e293b', alignItems: 'center' as const, justifyContent: 'center' as const },
  similarCard: { width: 150 },
  bottomBar: { position: 'absolute' as const, bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 36, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9', flexDirection: 'row' as const, gap: 12 },
  bottomSecBtn: { width: 60, height: 60, borderRadius: 20, borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center' as const, justifyContent: 'center' as const },
  bottomPrimaryBtn: { flex: 1, height: 60, borderRadius: 20, backgroundColor: '#3b82f6', flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8, shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
  // sheets
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 44, borderTopRightRadius: 44, padding: 28, paddingBottom: 44 },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 4, alignSelf: 'center' as const, marginBottom: 24 },
  sheetTitle: { fontSize: 20, fontWeight: '900' as const, color: '#1e293b', marginBottom: 4 },
  sheetSub: { fontSize: 13, color: '#94a3b8', fontWeight: '500' as const, marginBottom: 20 },
  datePill: { flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', padding: 14, borderRadius: 20, gap: 4 },
  datePillLabel: { fontSize: 9, color: '#94a3b8', fontWeight: '900' as const, letterSpacing: 1.5, textTransform: 'uppercase' as const },
  datePillVal: { fontSize: 13, fontWeight: '800' as const, color: '#1e293b' },
  quickBtn: { flex: 1, paddingVertical: 10, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center' as const },
  quickBtnActive: { backgroundColor: '#3b82f6' },
  quickBtnText: { fontSize: 12, fontWeight: '800' as const, color: '#1e293b' },
  totalRow: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between', backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 24, padding: 18, marginBottom: 16 },
  sheetBtn: { height: 58, borderRadius: 20, alignItems: 'center' as const, justifyContent: 'center' as const, flexDirection: 'row' as const, gap: 8 },
};