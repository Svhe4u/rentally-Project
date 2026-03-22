import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, TextInput, Modal, ActivityIndicator,
  Dimensions, Image, Alert, Animated, StatusBar, Platform,
} from 'react-native';
import { TabName } from '../components/BottomNav';

// ─── Config ───────────────────────────────────────────────────
const API_BASE = 'http://127.0.0.1:8000/api';
const CURRENT_USER_ID = 1;

const { width: W, height: H } = Dimensions.get('window');
const HERO_H = Math.round(H * 0.40);

// ─── Types ────────────────────────────────────────────────────
interface BrokerProfile {
  bio?: string; profile_image?: string;
  agency_name?: string; license_no?: string; is_verified?: boolean;
}
interface Owner {
  id: number; username: string; email?: string; phone?: string;
  role: string; broker_profile?: BrokerProfile;
}
interface Details {
  floor_type?: string; balcony?: boolean; year_built?: number; garage?: boolean;
  window_type?: string; building_floors?: number; door_type?: string;
  area_sqm?: number; floor_number?: number; window_count?: number;
  payment_terms?: string;
}
interface ListingImage { id: number; image_url: string; sort_order: number; }
interface ExtraFeature { id: number; key: string; value: string; }
interface Review {
  id: number; user_id: number; username: string;
  rating: number; comment: string; created_at: string;
}
interface UtilityFmt { min: string; max: string; }
interface Listing {
  id: number; title: string; description?: string; address?: string;
  price: number; price_type: string; created_at: string;
  owner: Owner;
  category?: { id: number; name: string };
  region?: { id: number; name: string; parent_name?: string };
  details?: Details;
  images: ListingImage[];
  extra_features: ExtraFeature[];
  availability: any[];
  reviews: Review[];
  review_count: number;
  rating_avg: number | null;
}

interface Props {
  visible: boolean;
  listingId: number | null;
  onClose: () => void;
  onNavigate?: (tab: TabName) => void;
}

// ─── Helpers ──────────────────────────────────────────────────
const fmtPrice = (p: number) =>
  p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

const timeAgo = (d: string) => {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return 'Саяхан';
  if (s < 3600) return `${Math.floor(s / 60)} мин өмнө`;
  if (s < 86400) return `${Math.floor(s / 3600)} цаг өмнө`;
  return `${Math.floor(s / 86400)} өдөр өмнө`;
};

const STAR = (n: number, filled: number) =>
  Array.from({ length: n }, (_, i) => (i < filled ? '★' : '☆')).join('');

const PRICE_SUFFIX: Record<string, string> = {
  monthly: '/сар', yearly: '/жил', daily: '/өдөр',
};

const AVATAR_COLORS = ['#2e55fa','#ff6b6b','#f0ad00','#20c997','#845ef7','#ff922b'];

// ─── Main ─────────────────────────────────────────────────────
export default function ListingDetailScreen({ visible, listingId, onClose }: Props) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [isFav, setIsFav]   = useState(false);
  const [utility, setUtility] = useState<UtilityFmt | null>(null);
  const [imgIdx, setImgIdx]   = useState(0);

  const [msgOpen, setMsgOpen]     = useState(false);
  const [msgText, setMsgText]     = useState('');
  const [msgSending, setMsgSending] = useState(false);

  const [rvOpen, setRvOpen]       = useState(false);
  const [rvRating, setRvRating]   = useState(5);
  const [rvText, setRvText]       = useState('');
  const [rvSending, setRvSending] = useState(false);

  // ── Right-to-left slide animation ─────────────────────────
  const slideX   = useRef(new Animated.Value(W)).current;
  const backdropOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // slide in from right
      Animated.parallel([
        Animated.spring(slideX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 68,
          friction: 11,
        }),
        Animated.timing(backdropOp, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // slide out to right
      Animated.parallel([
        Animated.timing(slideX, {
          toValue: W,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOp, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideX, {
        toValue: W,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOp, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  // ── Fetch ─────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!listingId) return;
    setLoading(true); setError(''); setListing(null); setUtility(null); setImgIdx(0);
    try {
      const r = await fetch(`${API_BASE}/listings/${listingId}/full/`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d: Listing = await r.json();
      setListing(d);
      if (d.details?.area_sqm) {
        const u = await fetch(`${API_BASE}/mongolia/utility-estimate/?area_sqm=${d.details.area_sqm}`);
        const ud = await u.json();
        setUtility(ud.formatted);
      }
    } catch (e: any) {
      setError(e.message || 'Алдаа гарлаа');
    } finally { setLoading(false); }
  }, [listingId]);

  useEffect(() => { if (visible && listingId) load(); }, [visible, listingId]);

  // ── Fav ──────────────────────────────────────────────────
  const heartScale = useRef(new Animated.Value(1)).current;
  const toggleFav = async () => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.45, useNativeDriver: true, speed: 40 }),
      Animated.spring(heartScale, { toValue: 1,    useNativeDriver: true, speed: 30 }),
    ]).start();
    try {
      if (isFav) {
        await fetch(`${API_BASE}/favorites/${listing!.id}/`, {
          method: 'DELETE', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: CURRENT_USER_ID }),
        });
      } else {
        await fetch(`${API_BASE}/favorites/`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: CURRENT_USER_ID, listing_id: listing!.id }),
        });
      }
      setIsFav(f => !f);
    } catch { Alert.alert('Алдаа', 'Хадгалахад алдаа гарлаа'); }
  };

  // ── Message ───────────────────────────────────────────────
  const sendMsg = async () => {
    if (!msgText.trim() || !listing) return;
    setMsgSending(true);
    try {
      const r = await fetch(`${API_BASE}/messages/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: CURRENT_USER_ID, receiver_id: listing.owner.id,
          listing_id: listing.id, message: msgText.trim(),
        }),
      });
      if (!r.ok) throw new Error();
      setMsgText(''); setMsgOpen(false);
      Alert.alert('✅', 'Мессеж амжилттай илгээгдлээ!');
    } catch { Alert.alert('Алдаа', 'Мессеж илгээхэд алдаа гарлаа'); }
    finally { setMsgSending(false); }
  };

  // ── Review ────────────────────────────────────────────────
  const postReview = async () => {
    if (!rvText.trim() || !listing) return;
    setRvSending(true);
    try {
      const r = await fetch(`${API_BASE}/reviews/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: CURRENT_USER_ID, listing_id: listing.id,
          rating: rvRating, comment: rvText.trim(),
        }),
      });
      if (r.status === 409) { Alert.alert('', 'Та аль хэдийн үнэлсэн байна.'); return; }
      if (!r.ok) throw new Error();
      setRvText(''); setRvOpen(false);
      Alert.alert('⭐ Баярлалаа!', 'Таны үнэлгээ нийтлэгдлээ.');
      load();
    } catch { Alert.alert('Алдаа', 'Үнэлгээ нэмэхэд алдаа гарлаа'); }
    finally { setRvSending(false); }
  };

  // ── Scroll header ─────────────────────────────────────────
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerBg = scrollY.interpolate({
    inputRange: [HERO_H - 70, HERO_H - 10],
    outputRange: ['rgba(255,255,255,0)', 'rgba(255,255,255,1)'],
    extrapolate: 'clamp',
  });
  const titleOp = scrollY.interpolate({
    inputRange: [HERO_H - 50, HERO_H],
    outputRange: [0, 1], extrapolate: 'clamp',
  });

  if (!visible && slideX._value >= W) return null;

  const priceLabel = listing
    ? fmtPrice(listing.price) + ' ₮' + (PRICE_SUFFIX[listing.price_type] ?? '')
    : '';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      {/* dim backdrop */}
      <Animated.View style={[c.backdrop, { opacity: backdropOp }]}
        pointerEvents="none" />

      {/* sliding panel */}
      <Animated.View style={[c.panel, { transform: [{ translateX: slideX }] }]}>
        <StatusBar barStyle="light-content" />

        {/* ── Floating top bar ── */}
        <Animated.View style={[c.topBar, { backgroundColor: headerBg }]}>
          <SafeAreaView style={c.topBarInner}>
            <TouchableOpacity style={c.backBtn} onPress={handleClose}>
              <Text style={c.backArrow}>‹</Text>
            </TouchableOpacity>
            <Animated.Text style={[c.topTitle, { opacity: titleOp }]} numberOfLines={1}>
              {listing?.title ?? ''}
            </Animated.Text>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <TouchableOpacity style={c.heartBtn} onPress={toggleFav}>
                <Text style={c.heartTxt}>{isFav ? '❤️' : '♡'}</Text>
              </TouchableOpacity>
            </Animated.View>
          </SafeAreaView>
        </Animated.View>

        {/* ── Content ── */}
        {loading ? (
          <View style={c.center}>
            <ActivityIndicator size="large" color="#2e55fa" />
            <Text style={c.loadTxt}>Уншиж байна...</Text>
          </View>
        ) : error || !listing ? (
          <View style={c.center}>
            <Text style={{ fontSize: 52 }}>🏚</Text>
            <Text style={c.errTxt}>{error || 'Байр олдсонгүй'}</Text>
            <TouchableOpacity style={c.retryBtn} onPress={load}>
              <Text style={c.retryTxt}>Дахин оролдох</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Animated.ScrollView
              showsVerticalScrollIndicator={false}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: false }
              )}
              scrollEventThrottle={16}
            >
              {/* Hero */}
              <View style={{ height: HERO_H, backgroundColor: '#0a0f1e' }}>
                {listing.images.length > 0 ? (
                  <>
                    <ScrollView
                      horizontal pagingEnabled showsHorizontalScrollIndicator={false}
                      onMomentumScrollEnd={e =>
                        setImgIdx(Math.round(e.nativeEvent.contentOffset.x / W))}
                      style={{ height: HERO_H }}
                    >
                      {listing.images.map(img => (
                        <Image key={img.id} source={{ uri: img.image_url }}
                          style={{ width: W, height: HERO_H }} resizeMode="cover" />
                      ))}
                    </ScrollView>
                    <View style={c.dotsRow} pointerEvents="none">
                      {listing.images.map((_, i) => (
                        <View key={i} style={[c.dot, i === imgIdx && c.dotOn]} />
                      ))}
                    </View>
                    <View style={c.imgCounter} pointerEvents="none">
                      <Text style={c.imgCounterTxt}>{imgIdx + 1} / {listing.images.length}</Text>
                    </View>
                  </>
                ) : (
                  <View style={c.noImg}>
                    <Text style={{ fontSize: 60 }}>🏠</Text>
                  </View>
                )}
                {listing.category && (
                  <View style={c.catTag} pointerEvents="none">
                    <Text style={c.catTagTxt}>{listing.category.name}</Text>
                  </View>
                )}
              </View>

              {/* Price strip */}
              <View style={c.priceStrip}>
                <View style={{ flex: 1 }}>
                  <Text style={c.bigPrice}>{priceLabel}</Text>
                  {listing.details?.area_sqm && (
                    <Text style={c.pricePerM}>
                      {Math.round(listing.price / listing.details.area_sqm)
                        .toLocaleString().replace(/,/g,' ')} ₮/м²
                    </Text>
                  )}
                </View>
                {listing.rating_avg !== null && (
                  <View style={c.ratingChip}>
                    <Text style={c.ratingStar}>★</Text>
                    <Text style={c.ratingNum}>{listing.rating_avg.toFixed(1)}</Text>
                    <Text style={c.ratingCnt}>({listing.review_count})</Text>
                  </View>
                )}
              </View>

              {/* Title */}
              <View style={c.titleBlock}>
                <Text style={c.mainTitle}>{listing.title}</Text>
                {[listing.region?.parent_name, listing.region?.name].filter(Boolean).join(' › ')
                  ? <Text style={c.loc}>📍 {[listing.region?.parent_name, listing.region?.name].filter(Boolean).join(' › ')}</Text>
                  : null}
                {listing.address && <Text style={c.addr}>{listing.address}</Text>}
                <Text style={c.age}>🕐 {timeAgo(listing.created_at)}</Text>
              </View>

              {/* Key bar */}
              {listing.details && (
                <View style={c.keyBar}>
                  {listing.details.area_sqm && <KeyStat icon="📐" val={`${listing.details.area_sqm}`} unit="м²" />}
                  {listing.details.floor_number != null && (
                    <KeyStat icon="🏗" val={String(listing.details.floor_number)}
                      unit={listing.details.building_floors ? `/ ${listing.details.building_floors}Д` : 'давхар'} />
                  )}
                  {listing.details.year_built && <KeyStat icon="📅" val={String(listing.details.year_built)} unit="он" />}
                  <KeyStat icon="🌿" val={listing.details.balcony ? 'Тийм' : 'Үгүй'} unit="тагт" />
                  <KeyStat icon="🚗" val={listing.details.garage ? 'Тийм' : 'Үгүй'} unit="гараж" />
                </View>
              )}

              {/* Spec grid */}
              {listing.details && (
                <Sec title="🏢 Дэлгэрэнгүй үзүүлэлт">
                  <View style={c.specGrid}>
                    {listing.details.floor_type  && <SpecCard label="Шал"     value={listing.details.floor_type}  icon="🪵" />}
                    {listing.details.window_type && <SpecCard label="Цонх"    value={listing.details.window_type} icon="🪟" />}
                    {listing.details.door_type   && <SpecCard label="Хаалга"  value={listing.details.door_type}   icon="🚪" />}
                    {listing.details.window_count != null && <SpecCard label="Цонхны тоо" value={`${listing.details.window_count}`} icon="🔢" />}
                    {listing.details.building_floors && <SpecCard label="Нийт давхар" value={`${listing.details.building_floors}Д`} icon="🏢" />}
                    {listing.details.year_built  && <SpecCard label="Баригдсан он" value={`${listing.details.year_built}`} icon="📅" />}
                  </View>
                  {listing.details.payment_terms && (
                    <View style={c.payCard}>
                      <Text style={c.payTitle}>💳 Төлбөрийн нөхцөл</Text>
                      <Text style={c.payVal}>{listing.details.payment_terms}</Text>
                    </View>
                  )}
                </Sec>
              )}

              {/* Utility */}
              {utility && (
                <Sec title="⚡ Нийтийн үйлчилгээ (сарын тооцоо)">
                  <View style={c.utilRow}>
                    {[['🔥','Дулаан'],['💡','Цахилгаан'],['💧','Ус']].map(([ico,lbl]) => (
                      <View key={lbl} style={c.utilItem}>
                        <Text style={c.utilIco}>{ico}</Text>
                        <Text style={c.utilLbl}>{lbl}</Text>
                        <Text style={c.utilRange}>{utility.min} ~ {utility.max}</Text>
                      </View>
                    ))}
                  </View>
                </Sec>
              )}

              {/* Description */}
              {listing.description && (
                <Sec title="📝 Тайлбар">
                  <Text style={c.desc}>{listing.description}</Text>
                </Sec>
              )}

              {/* Extra features */}
              {listing.extra_features.length > 0 && (
                <Sec title="✨ Нэмэлт онцлог">
                  <View style={c.tagWrap}>
                    {listing.extra_features.map(f => (
                      <View key={f.id} style={c.tag}>
                        <Text style={c.tagKey}>{f.key}</Text>
                        <View style={c.tagDiv} />
                        <Text style={c.tagVal}>{f.value}</Text>
                      </View>
                    ))}
                  </View>
                </Sec>
              )}

              {/* Owner */}
              <Sec title={listing.owner.role === 'broker' ? '🏢 Зуучлагч' : '👤 Эзэмшигч'}>
                <View style={c.ownerRow}>
                  <View style={c.ownerAvWrap}>
                    {listing.owner.broker_profile?.profile_image ? (
                      <Image source={{ uri: listing.owner.broker_profile.profile_image }} style={c.ownerAv} />
                    ) : (
                      <View style={c.ownerAvFb}>
                        <Text style={c.ownerAvLtr}>{listing.owner.username[0]?.toUpperCase()}</Text>
                      </View>
                    )}
                    {listing.owner.role === 'broker' && (
                      <View style={c.verifiedBadge}><Text style={c.verifiedTxt}>✓</Text></View>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={c.ownerName}>{listing.owner.username}</Text>
                    {listing.owner.broker_profile?.agency_name && (
                      <Text style={c.agency}>{listing.owner.broker_profile.agency_name}</Text>
                    )}
                    {listing.owner.broker_profile?.license_no && (
                      <Text style={c.license}>Лиценз · {listing.owner.broker_profile.license_no}</Text>
                    )}
                    {listing.owner.phone && <Text style={c.ownerPhone}>📞 {listing.owner.phone}</Text>}
                  </View>
                </View>
                {listing.owner.broker_profile?.bio && (
                  <Text style={c.bio}>{listing.owner.broker_profile.bio}</Text>
                )}
                <TouchableOpacity style={c.msgOwnerBtn} onPress={() => setMsgOpen(true)}>
                  <Text style={c.msgOwnerTxt}>💬 Мессеж илгээх</Text>
                </TouchableOpacity>
              </Sec>

              {/* Reviews */}
              <Sec title={`⭐ Үнэлгээ${listing.review_count > 0 ? ` · ${listing.review_count}` : ''}`}
                   action={listing.rating_avg !== null ? `${listing.rating_avg.toFixed(1)} / 5` : undefined}>
                {listing.reviews.length === 0 ? (
                  <View style={c.noRv}>
                    <Text style={c.noRvTxt}>Одоохондоо үнэлгээ байхгүй</Text>
                  </View>
                ) : (
                  listing.reviews.map((r, i) => (
                    <View key={r.id} style={[c.rvCard, i > 0 && { marginTop: 10 }]}>
                      <View style={c.rvTop}>
                        <View style={[c.rvAv, { backgroundColor: AVATAR_COLORS[r.user_id % AVATAR_COLORS.length] }]}>
                          <Text style={c.rvAvTxt}>{r.username[0]?.toUpperCase()}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={c.rvMeta}>
                            <Text style={c.rvUser}>{r.username}</Text>
                            <Text style={c.rvTime}>{timeAgo(r.created_at)}</Text>
                          </View>
                          <Text style={c.rvStars}>{STAR(5, r.rating)}</Text>
                        </View>
                      </View>
                      {r.comment ? <Text style={c.rvTxt}>{r.comment}</Text> : null}
                    </View>
                  ))
                )}
                <TouchableOpacity style={c.writeRvBtn} onPress={() => setRvOpen(true)}>
                  <Text style={c.writeRvTxt}>✏️ Үнэлгээ бичих</Text>
                </TouchableOpacity>
              </Sec>

              <View style={{ height: 120 }} />
            </Animated.ScrollView>

            {/* Sticky bar */}
            <View style={c.stickyBar}>
              <View style={{ flex: 1 }}>
                <Text style={c.stickyPrice}>{priceLabel}</Text>
                {listing.details?.area_sqm && (
                  <Text style={c.stickyMeta}>{listing.details.area_sqm} м²</Text>
                )}
              </View>
              <TouchableOpacity style={c.callBtn}
                onPress={() => listing.owner.phone
                  ? Alert.alert('📞 Холбоо барих', listing.owner.phone,
                      [{ text: 'Хаах' }, { text: 'Залгах' }])
                  : Alert.alert('', 'Утасны дугаар байхгүй')
                }>
                <Text style={c.callTxt}>📞 Залгах</Text>
              </TouchableOpacity>
              <TouchableOpacity style={c.chatBtn} onPress={() => setMsgOpen(true)}>
                <Text style={c.chatTxt}>💬 Мессеж</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── Message sheet ── */}
        <Sheet visible={msgOpen} onClose={() => setMsgOpen(false)} title="💬 Мессеж илгээх">
          <Text style={c.sheetSub}>{listing?.owner.username} руу мессеж</Text>
          <View style={c.inputBox}>
            <TextInput
              style={c.textArea}
              placeholder="Байрны талаар асуух зүйлсээ бичнэ үү..."
              placeholderTextColor="#9ca3af"
              multiline value={msgText} onChangeText={setMsgText}
              textAlignVertical="top"
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['Байр хаана байдаг вэ?','Үзэж болох уу?','Үнэ тохирох уу?','Хэзээнээс гэрээ?'].map(q => (
              <TouchableOpacity key={q} style={c.qChip} onPress={() => setMsgText(q)}>
                <Text style={c.qChipTxt}>{q}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={[c.submitBtn, (!msgText.trim() || msgSending) && c.submitDis]}
            onPress={sendMsg} disabled={!msgText.trim() || msgSending}>
            {msgSending
              ? <ActivityIndicator color="#fff" />
              : <Text style={c.submitTxt}>Илгээх →</Text>}
          </TouchableOpacity>
        </Sheet>

        {/* ── Review sheet ── */}
        <Sheet visible={rvOpen} onClose={() => setRvOpen(false)} title="⭐ Үнэлгээ бичих">
          <View style={c.starRow}>
            {[1,2,3,4,5].map(n => (
              <TouchableOpacity key={n} onPress={() => setRvRating(n)}>
                <Text style={[c.starIco, n <= rvRating && c.starOn]}>{n <= rvRating ? '★' : '☆'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={c.starLbl}>
            {['','Муу','Дунд','Сайн','Маш сайн','Гайхалтай'][rvRating]}
          </Text>
          <View style={c.inputBox}>
            <TextInput
              style={c.textArea}
              placeholder="Сэтгэгдлээ бичнэ үү..."
              placeholderTextColor="#9ca3af"
              multiline value={rvText} onChangeText={setRvText}
              textAlignVertical="top"
            />
          </View>
          <TouchableOpacity
            style={[c.submitBtn, (!rvText.trim() || rvSending) && c.submitDis]}
            onPress={postReview} disabled={!rvText.trim() || rvSending}>
            {rvSending
              ? <ActivityIndicator color="#fff" />
              : <Text style={c.submitTxt}>Нийтлэх</Text>}
          </TouchableOpacity>
        </Sheet>
      </Animated.View>
    </Modal>
  );
}

// ─── Sub-components ───────────────────────────────────────────
function Sec({ title, action, children }: { title:string; action?:string; children:React.ReactNode }) {
  return (
    <View style={c.sec}>
      <View style={c.secHead}>
        <Text style={c.secTitle}>{title}</Text>
        {action && <Text style={c.secAction}>{action}</Text>}
      </View>
      {children}
    </View>
  );
}

function KeyStat({ icon, val, unit }: { icon:string; val:string; unit:string }) {
  return (
    <View style={c.keyStat}>
      <Text style={c.keyIco}>{icon}</Text>
      <Text style={c.keyVal}>{val}</Text>
      <Text style={c.keyUnit}>{unit}</Text>
    </View>
  );
}

function SpecCard({ label, value, icon }: { label:string; value:string; icon:string }) {
  return (
    <View style={c.specCard}>
      <Text style={c.specIco}>{icon}</Text>
      <Text style={c.specLbl}>{label}</Text>
      <Text style={c.specVal}>{value}</Text>
    </View>
  );
}

function Sheet({ visible, onClose, title, children }: {
  visible:boolean; onClose:()=>void; title:string; children:React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={c.overlay} activeOpacity={1} onPress={onClose}>
        <View style={c.sheet}>
          <View style={c.sheetHandle} />
          <Text style={c.sheetTitle}>{title}</Text>
          {children}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const BLUE = '#2e55fa';
const NAVY = '#0a0f1e';

const c = StyleSheet.create({
  // panel — full screen sliding from right
  panel: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: '#f0f2f5',
  },
  backdrop: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  // top bar
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
  },
  topBarInner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'android' ? 36 : 0,
    paddingBottom: 10,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.38)',
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 28, color: '#fff', lineHeight: 32, marginTop: -2 },
  topTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: '#111' },
  heartBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.38)',
    alignItems: 'center', justifyContent: 'center',
  },
  heartTxt: { fontSize: 18 },

  // states
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  loadTxt: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  errTxt:  { fontSize: 15, color: '#374151', fontWeight: '600', textAlign: 'center' },
  retryBtn: { backgroundColor: BLUE, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 28, marginTop: 6 },
  retryTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // hero
  noImg: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dotsRow: {
    position: 'absolute', bottom: 14, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 5,
  },
  dot:   { width: 6,  height: 6, borderRadius: 3,  backgroundColor: 'rgba(255,255,255,0.4)' },
  dotOn: { width: 20, height: 6, borderRadius: 3,  backgroundColor: '#fff' },
  imgCounter: {
    position: 'absolute', bottom: 12, right: 14,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10,
    paddingVertical: 3, paddingHorizontal: 9,
  },
  imgCounterTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
  catTag: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 36 + 14 : 44 + 14,
    left: 14,
    backgroundColor: 'rgba(46,85,250,0.88)',
    borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10,
  },
  catTagTxt: { color: '#fff', fontSize: 11, fontWeight: '900' },

  // price
  priceStrip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 18, paddingVertical: 16,
  },
  bigPrice: { fontSize: 26, fontWeight: '900', color: BLUE },
  pricePerM: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  ratingChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#fffbeb', borderRadius: 20,
    paddingVertical: 5, paddingHorizontal: 11,
    borderWidth: 1, borderColor: '#fde68a',
  },
  ratingStar: { color: '#f59e0b', fontSize: 14 },
  ratingNum:  { fontSize: 14, fontWeight: '900', color: '#92400e' },
  ratingCnt:  { fontSize: 11, color: '#b45309' },

  // title
  titleBlock: { backgroundColor: '#fff', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 16, gap: 3 },
  mainTitle:  { fontSize: 20, fontWeight: '900', color: '#111827', lineHeight: 28 },
  loc:        { fontSize: 13, color: '#4b5563' },
  addr:       { fontSize: 12, color: '#9ca3af' },
  age:        { fontSize: 11, color: '#d1d5db', marginTop: 2 },

  // key bar
  keyBar: { flexDirection: 'row', backgroundColor: BLUE, paddingVertical: 14 },
  keyStat: { flex: 1, alignItems: 'center', gap: 2 },
  keyIco:  { fontSize: 18 },
  keyVal:  { fontSize: 13, fontWeight: '900', color: '#fff' },
  keyUnit: { fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: '600', textAlign: 'center' },

  // section
  sec: { backgroundColor: '#fff', marginTop: 8, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 20 },
  secHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  secTitle:  { fontSize: 15, fontWeight: '900', color: '#111827' },
  secAction: { fontSize: 15, fontWeight: '900', color: '#f59e0b' },

  // spec grid
  specGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  specCard: {
    width: (W - 36 - 10) / 2,
    backgroundColor: '#f9fafb', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#f0f2f5', gap: 2,
  },
  specIco: { fontSize: 20 },
  specLbl: { fontSize: 11, color: '#9ca3af', fontWeight: '600' },
  specVal: { fontSize: 13, fontWeight: '800', color: '#111827' },
  payCard: { marginTop: 12, backgroundColor: '#fffbeb', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#fde68a' },
  payTitle: { fontSize: 12, fontWeight: '800', color: '#92400e', marginBottom: 4 },
  payVal:   { fontSize: 13, color: '#78350f', lineHeight: 20 },

  // utility
  utilRow: { flexDirection: 'row', gap: 8 },
  utilItem: {
    flex: 1, backgroundColor: '#eff6ff', borderRadius: 12, padding: 12,
    alignItems: 'center', gap: 3, borderWidth: 1, borderColor: '#dbeafe',
  },
  utilIco:   { fontSize: 20 },
  utilLbl:   { fontSize: 11, color: '#6b7280', fontWeight: '600' },
  utilRange: { fontSize: 11, fontWeight: '800', color: '#1d4ed8', textAlign: 'center' },

  // desc
  desc: { fontSize: 14, color: '#374151', lineHeight: 22 },

  // tags
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#f0f4ff', borderRadius: 20,
    paddingVertical: 6, paddingHorizontal: 12,
    borderWidth: 1, borderColor: '#c7d2fe',
  },
  tagKey: { fontSize: 12, fontWeight: '700', color: '#4338ca' },
  tagDiv: { width: 1, height: 11, backgroundColor: '#c7d2fe' },
  tagVal: { fontSize: 12, color: '#6366f1' },

  // owner
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  ownerAvWrap: { position: 'relative' },
  ownerAv:   { width: 58, height: 58, borderRadius: 29, backgroundColor: '#e0e7ff' },
  ownerAvFb: { width: 58, height: 58, borderRadius: 29, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  ownerAvLtr: { fontSize: 22, fontWeight: '900', color: '#fff' },
  verifiedBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  verifiedTxt:  { color: '#fff', fontSize: 9,  fontWeight: '900' },
  ownerName:    { fontSize: 15, fontWeight: '900', color: '#111827' },
  agency:       { fontSize: 13, color: '#4b5563' },
  license:      { fontSize: 11, color: '#9ca3af' },
  ownerPhone:   { fontSize: 13, color: BLUE, fontWeight: '700' },
  bio:          { fontSize: 13, color: '#6b7280', lineHeight: 20, marginBottom: 12 },
  msgOwnerBtn:  {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#eff6ff', borderRadius: 14,
    paddingVertical: 13, borderWidth: 1.5, borderColor: '#bfdbfe',
  },
  msgOwnerTxt: { fontSize: 14, fontWeight: '800', color: '#1d4ed8' },

  // reviews
  noRv:    { alignItems: 'center', paddingVertical: 20 },
  noRvTxt: { fontSize: 13, color: '#9ca3af' },
  rvCard:  { backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#f0f2f5' },
  rvTop:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  rvAv:    { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  rvAvTxt: { color: '#fff', fontWeight: '900', fontSize: 13 },
  rvMeta:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flex: 1 },
  rvUser:  { fontSize: 13, fontWeight: '800', color: '#111827' },
  rvTime:  { fontSize: 10, color: '#d1d5db' },
  rvStars: { fontSize: 12, color: '#f59e0b' },
  rvTxt:   { fontSize: 13, color: '#4b5563', lineHeight: 20 },
  writeRvBtn: {
    marginTop: 14, borderRadius: 12, paddingVertical: 13,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#e5e7eb', borderStyle: 'dashed',
  },
  writeRvTxt: { fontSize: 14, fontWeight: '700', color: '#6b7280' },

  // sticky
  stickyBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#e5e7eb', gap: 10,
    ...Platform.select({ ios: { paddingBottom: 26 } }),
  },
  stickyPrice: { fontSize: 16, fontWeight: '900', color: BLUE },
  stickyMeta:  { fontSize: 11, color: '#9ca3af' },
  callBtn: {
    backgroundColor: '#f0f4ff', borderRadius: 13,
    paddingVertical: 12, paddingHorizontal: 16,
    borderWidth: 1.5, borderColor: '#c7d2fe',
  },
  callTxt: { fontSize: 13, fontWeight: '800', color: '#4338ca' },
  chatBtn: {
    backgroundColor: BLUE, borderRadius: 13,
    paddingVertical: 12, paddingHorizontal: 16,
  },
  chatTxt: { fontSize: 13, fontWeight: '800', color: '#fff' },

  // sheet modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:   { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36, gap: 14 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb', alignSelf: 'center', marginBottom: 4 },
  sheetTitle:  { fontSize: 20, fontWeight: '900', color: '#111827' },
  sheetSub:    { fontSize: 13, color: '#6b7280', marginTop: -8 },
  inputBox:    { backgroundColor: '#f9fafb', borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb' },
  textArea:    { padding: 14, fontSize: 14, color: '#111827', minHeight: 90 },
  qChip: {
    backgroundColor: '#eff6ff', borderRadius: 20,
    paddingVertical: 7, paddingHorizontal: 12, marginRight: 8,
    borderWidth: 1, borderColor: '#bfdbfe',
  },
  qChipTxt:   { fontSize: 12, fontWeight: '700', color: '#1d4ed8' },
  submitBtn:  { backgroundColor: BLUE, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  submitDis:  { opacity: 0.35 },
  submitTxt:  { color: '#fff', fontSize: 16, fontWeight: '900' },
  starRow:    { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  starIco:    { fontSize: 40, color: '#e5e7eb' },
  starOn:     { color: '#f59e0b' },
  starLbl:    { textAlign: 'center', fontSize: 15, fontWeight: '700', color: '#4b5563', marginTop: -6 },
});