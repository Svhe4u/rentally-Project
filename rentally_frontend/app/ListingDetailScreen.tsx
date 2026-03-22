import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, TextInput, Modal, ActivityIndicator,
  Dimensions, Image, Alert, Animated, StatusBar, Platform,
} from 'react-native';
import { TabName } from '../components/BottomNav';

// ─── Config ──────────────────────────────────────────────────────────────────
const API_BASE = 'http://127.0.0.1:8000/api';
const CURRENT_USER_ID = 1; // Replace with real auth

const { width: W, height: H } = Dimensions.get('window');
const HERO_H = Math.round(H * 0.42);

// ─── Types ────────────────────────────────────────────────────────────────────
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
  latitude?: number; longitude?: number; price: number; price_type: string;
  created_at: string; is_active?: boolean;
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
  listingId: number;
  onBack: () => void;
  onNavigate?: (tab: TabName) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ListingDetailScreen({ listingId, onBack }: Props) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFav, setIsFav] = useState(false);
  const [utility, setUtility] = useState<UtilityFmt | null>(null);
  const [imgIdx, setImgIdx] = useState(0);

  const [msgOpen, setMsgOpen] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [msgSending, setMsgSending] = useState(false);

  const [rvOpen, setRvOpen] = useState(false);
  const [rvRating, setRvRating] = useState(5);
  const [rvText, setRvText] = useState('');
  const [rvSending, setRvSending] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  // ── Fetch ────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true); setError('');
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

  useEffect(() => { load(); }, [load]);

  // ── Fav toggle ───────────────────────────────────────────────
  const toggleFav = async () => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true, speed: 40 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 40 }),
    ]).start();
    try {
      if (isFav) {
        await fetch(`${API_BASE}/favorites/${listing!.id}/`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: CURRENT_USER_ID }),
        });
      } else {
        await fetch(`${API_BASE}/favorites/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: CURRENT_USER_ID, listing_id: listing!.id }),
        });
      }
      setIsFav(f => !f);
    } catch { Alert.alert('Алдаа', 'Хадгалахад алдаа гарлаа'); }
  };

  // ── Send message ─────────────────────────────────────────────
  const sendMsg = async () => {
    if (!msgText.trim() || !listing) return;
    setMsgSending(true);
    try {
      const r = await fetch(`${API_BASE}/messages/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  // ── Post review ──────────────────────────────────────────────
  const postReview = async () => {
    if (!rvText.trim() || !listing) return;
    setRvSending(true);
    try {
      const r = await fetch(`${API_BASE}/reviews/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: CURRENT_USER_ID, listing_id: listing.id,
          rating: rvRating, comment: rvText.trim(),
        }),
      });
      if (r.status === 409) { Alert.alert('', 'Та энэ байрыг аль хэдийн үнэлсэн байна.'); return; }
      if (!r.ok) throw new Error();
      setRvText(''); setRvOpen(false);
      Alert.alert('⭐ Баярлалаа!', 'Таны үнэлгээ нийтлэгдлээ.');
      load();
    } catch { Alert.alert('Алдаа', 'Үнэлгээ нэмэхэд алдаа гарлаа'); }
    finally { setRvSending(false); }
  };

  // ── Scroll-driven header opacity ─────────────────────────────
  const headerBg = scrollY.interpolate({
    inputRange: [HERO_H - 80, HERO_H - 20],
    outputRange: ['rgba(255,255,255,0)', 'rgba(255,255,255,1)'],
    extrapolate: 'clamp',
  });
  const headerTitleOp = scrollY.interpolate({
    inputRange: [HERO_H - 50, HERO_H],
    outputRange: [0, 1], extrapolate: 'clamp',
  });

  // ─── Loading ─────────────────────────────────────────────────
  if (loading) return (
    <SafeAreaView style={c.safe}>
      <View style={c.center}>
        <ActivityIndicator size="large" color="#1a3cff" />
        <Text style={c.loadTxt}>Уншиж байна...</Text>
      </View>
    </SafeAreaView>
  );

  if (error || !listing) return (
    <SafeAreaView style={c.safe}>
      <View style={c.center}>
        <Text style={c.errEmoji}>🏚</Text>
        <Text style={c.errTxt}>{error || 'Байр олдсонгүй'}</Text>
        <TouchableOpacity style={c.retryBtn} onPress={load}><Text style={c.retryTxt}>Дахин оролдох</Text></TouchableOpacity>
        <TouchableOpacity onPress={onBack} style={{ marginTop: 10 }}><Text style={c.backTxt}>← Буцах</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const { details, images, extra_features, reviews, owner } = listing;
  const isBroker = owner.role === 'broker' && owner.broker_profile;
  const loc = [listing.region?.parent_name, listing.region?.name].filter(Boolean).join(' › ');
  const priceLabel = fmtPrice(listing.price) + ' ₮' + (PRICE_SUFFIX[listing.price_type] ?? '');

  return (
    <View style={c.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Floating header (appears on scroll) ── */}
      <Animated.View style={[c.floatingHeader, { backgroundColor: headerBg }]} pointerEvents="box-none">
        <SafeAreaView style={c.floatingInner}>
          <TouchableOpacity style={c.fabBack} onPress={onBack}>
            <Text style={c.fabBackTxt}>←</Text>
          </TouchableOpacity>
          <Animated.Text style={[c.floatingTitle, { opacity: headerTitleOp }]} numberOfLines={1}>
            {listing.title}
          </Animated.Text>
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <TouchableOpacity style={c.fabHeart} onPress={toggleFav}>
              <Text style={c.fabHeartTxt}>{isFav ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* ── Hero image gallery ── */}
        <View style={{ height: HERO_H, backgroundColor: '#1a1a2e' }}>
          {images.length > 0 ? (
            <>
              <ScrollView
                horizontal pagingEnabled showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={e => setImgIdx(Math.round(e.nativeEvent.contentOffset.x / W))}
                style={{ height: HERO_H }}
              >
                {images.map(img => (
                  <Image key={img.id} source={{ uri: img.image_url }}
                    style={{ width: W, height: HERO_H }} resizeMode="cover" />
                ))}
              </ScrollView>
              {/* Gradient overlay */}
              <View style={c.heroGradient} pointerEvents="none" />
              {/* Dots */}
              <View style={c.dotsRow} pointerEvents="none">
                {images.map((_, i) => (
                  <View key={i} style={[c.dot, i === imgIdx && c.dotActive]} />
                ))}
              </View>
              {/* Counter badge */}
              <View style={c.heroBadge} pointerEvents="none">
                <Text style={c.heroBadgeTxt}>{imgIdx + 1} / {images.length}</Text>
              </View>
            </>
          ) : (
            <View style={c.noHero}>
              <Text style={{ fontSize: 64 }}>🏠</Text>
              <Text style={c.noHeroTxt}>Зураг байхгүй</Text>
            </View>
          )}

          {/* Category tag on hero */}
          {listing.category && (
            <View style={c.heroCatTag} pointerEvents="none">
              <Text style={c.heroCatTxt}>{listing.category.name}</Text>
            </View>
          )}
        </View>

        {/* ── Price strip ── */}
        <View style={c.priceStrip}>
          <View style={c.priceLhs}>
            <Text style={c.bigPrice}>{priceLabel}</Text>
            {details?.area_sqm && (
              <Text style={c.pricePerSqm}>
                {Math.round(listing.price / details.area_sqm).toLocaleString().replace(/,/g, ' ')} ₮/м²
              </Text>
            )}
          </View>
          <View style={c.priceRhs}>
            {listing.rating_avg !== null && (
              <View style={c.ratingChip}>
                <Text style={c.ratingChipStar}>★</Text>
                <Text style={c.ratingChipNum}>{listing.rating_avg.toFixed(1)}</Text>
                <Text style={c.ratingChipCnt}>{listing.review_count}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Title & location ── */}
        <View style={c.titleBlock}>
          <Text style={c.mainTitle}>{listing.title}</Text>
          {loc && <Text style={c.locLine}>📍 {loc}</Text>}
          {listing.address && <Text style={c.addrLine}>{listing.address}</Text>}
          <Text style={c.ageLine}>🕐 {timeAgo(listing.created_at)}</Text>
        </View>

        {/* ── Key spec bar ── */}
        {details && (
          <View style={c.keyBar}>
            {details.area_sqm && <KeyStat icon="📐" val={`${details.area_sqm}`} unit="м²" />}
            {details.floor_number != null && (
              <KeyStat icon="🏗" val={String(details.floor_number)} unit={details.building_floors ? `/ ${details.building_floors} давхар` : 'давхар'} />
            )}
            {details.year_built && <KeyStat icon="📅" val={String(details.year_built)} unit="он" />}
            <KeyStat icon="🌿" val={details.balcony ? 'Тийм' : 'Үгүй'} unit="тагт" />
            <KeyStat icon="🚗" val={details.garage ? 'Тийм' : 'Үгүй'} unit="гараж" />
          </View>
        )}

        {/* ── Specs grid ── */}
        {details && (
          <Section title="🏢 Дэлгэрэнгүй үзүүлэлт">
            <View style={c.specGrid}>
              {details.floor_type   && <SpecCard label="Шалны төрөл"   value={details.floor_type}   icon="🪵" />}
              {details.window_type  && <SpecCard label="Цонхны төрөл"  value={details.window_type}  icon="🪟" />}
              {details.door_type    && <SpecCard label="Хаалганы төрөл" value={details.door_type}   icon="🚪" />}
              {details.window_count != null && <SpecCard label="Цонхны тоо" value={`${details.window_count} ширхэг`} icon="🔢" />}
              {details.building_floors && <SpecCard label="Нийт давхар" value={`${details.building_floors} давхар`} icon="🏢" />}
              {details.year_built   && <SpecCard label="Баригдсан он"  value={`${details.year_built}`} icon="📅" />}
            </View>
            {details.payment_terms && (
              <View style={c.payCard}>
                <Text style={c.payTitle}>💳 Төлбөрийн нөхцөл</Text>
                <Text style={c.payVal}>{details.payment_terms}</Text>
              </View>
            )}
          </Section>
        )}

        {/* ── Utility estimate ── */}
        {utility && (
          <Section title="⚡ Нийтийн үйлчилгээний тооцоо">
            <View style={c.utilRow}>
              {[['🔥','Дулаан'],['💡','Цахилгаан'],['💧','Ус']].map(([ico, lbl]) => (
                <View key={lbl} style={c.utilItem}>
                  <Text style={c.utilIco}>{ico}</Text>
                  <Text style={c.utilLbl}>{lbl}</Text>
                  <Text style={c.utilRange}>{utility.min}</Text>
                  <Text style={c.utilDash}>~</Text>
                  <Text style={c.utilRange}>{utility.max}</Text>
                </View>
              ))}
            </View>
            <Text style={c.utilNote}>Улаанбаатар хотын дундаж тооцоо (сарын)</Text>
          </Section>
        )}

        {/* ── Description ── */}
        {listing.description && (
          <Section title="📝 Тайлбар">
            <Text style={c.descTxt}>{listing.description}</Text>
          </Section>
        )}

        {/* ── Extra features ── */}
        {extra_features.length > 0 && (
          <Section title="✨ Нэмэлт онцлогууд">
            <View style={c.tagWrap}>
              {extra_features.map(f => (
                <View key={f.id} style={c.tag}>
                  <Text style={c.tagTxt}>{f.key}</Text>
                  <View style={c.tagDivider} />
                  <Text style={c.tagVal}>{f.value}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {/* ── Owner / Broker ── */}
        <Section title={isBroker ? '🏢 Зуучлагч' : '👤 Эзэмшигч'}>
          <View style={c.ownerCard}>
            <View style={c.ownerLeft}>
              {isBroker && owner.broker_profile?.profile_image ? (
                <Image source={{ uri: owner.broker_profile.profile_image }} style={c.ownerAvatar} />
              ) : (
                <View style={c.ownerAvatarFallback}>
                  <Text style={c.ownerAvatarLetter}>{owner.username[0]?.toUpperCase()}</Text>
                </View>
              )}
              {isBroker && (
                <View style={c.verifiedBubble}>
                  <Text style={c.verifiedBubbleTxt}>✓</Text>
                </View>
              )}
            </View>
            <View style={c.ownerInfo}>
              <Text style={c.ownerName}>{owner.username}</Text>
              {isBroker && owner.broker_profile?.agency_name && (
                <Text style={c.agencyName}>{owner.broker_profile.agency_name}</Text>
              )}
              {isBroker && owner.broker_profile?.license_no && (
                <Text style={c.licenseTxt}>Лиценз · {owner.broker_profile.license_no}</Text>
              )}
              {owner.phone && <Text style={c.ownerPhone}>📞 {owner.phone}</Text>}
            </View>
          </View>
          {isBroker && owner.broker_profile?.bio && (
            <Text style={c.brokerBio}>{owner.broker_profile.bio}</Text>
          )}
          <TouchableOpacity style={c.msgOwnerBtn} onPress={() => setMsgOpen(true)}>
            <Text style={c.msgOwnerIco}>💬</Text>
            <Text style={c.msgOwnerTxt}>Мессеж илгээх</Text>
          </TouchableOpacity>
        </Section>

        {/* ── Reviews ── */}
        <Section
          title={`⭐ Үнэлгээ${listing.review_count > 0 ? ` · ${listing.review_count}` : ''}`}
          action={listing.rating_avg !== null ? `${listing.rating_avg.toFixed(1)} / 5` : undefined}
        >
          {reviews.length === 0 ? (
            <View style={c.noReviews}>
              <Text style={c.noReviewsEmoji}>💬</Text>
              <Text style={c.noReviewsTxt}>Одоохондоо үнэлгээ байхгүй байна</Text>
            </View>
          ) : (
            reviews.map((r, i) => (
              <View key={r.id} style={[c.reviewCard, i > 0 && c.reviewCardMt]}>
                <View style={c.reviewTop}>
                  <View style={[c.reviewAv, { backgroundColor: AVATAR_COLORS[r.user_id % AVATAR_COLORS.length] }]}>
                    <Text style={c.reviewAvTxt}>{r.username[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={c.reviewMetaRow}>
                      <Text style={c.reviewUser}>{r.username}</Text>
                      <Text style={c.reviewTime}>{timeAgo(r.created_at)}</Text>
                    </View>
                    <Text style={c.reviewStars}>{STAR(5, r.rating)}</Text>
                  </View>
                </View>
                {r.comment ? <Text style={c.reviewTxt}>{r.comment}</Text> : null}
              </View>
            ))
          )}
          <TouchableOpacity style={c.writeRvBtn} onPress={() => setRvOpen(true)}>
            <Text style={c.writeRvTxt}>✏️ Үнэлгээ бичих</Text>
          </TouchableOpacity>
        </Section>

        <View style={{ height: 110 }} />
      </Animated.ScrollView>

      {/* ── Sticky bottom bar ── */}
      <View style={c.stickyBar}>
        <View style={c.stickyLeft}>
          <Text style={c.stickyPrice}>{priceLabel}</Text>
          {details?.area_sqm && <Text style={c.stickyMeta}>{details.area_sqm} м²</Text>}
        </View>
        <TouchableOpacity style={c.callBtn}
          onPress={() => owner.phone
            ? Alert.alert('📞 Холбоо барих', owner.phone, [
                { text: 'Хаах' }, { text: 'Залгах' }
              ])
            : Alert.alert('', 'Утасны дугаар байхгүй байна')
          }>
          <Text style={c.callIco}>📞</Text>
          <Text style={c.callTxt}>Залгах</Text>
        </TouchableOpacity>
        <TouchableOpacity style={c.chatBtn} onPress={() => setMsgOpen(true)}>
          <Text style={c.chatIco}>💬</Text>
          <Text style={c.chatTxt}>Мессеж</Text>
        </TouchableOpacity>
      </View>

      {/* ── Message Modal ── */}
      <BottomModal visible={msgOpen} onClose={() => setMsgOpen(false)} title="💬 Мессеж илгээх">
        <Text style={c.modalSub}>
          {owner.username}{isBroker ? ' · ' + (owner.broker_profile?.agency_name ?? '') : ''} руу
        </Text>
        <View style={c.inputBox}>
          <TextInput
            style={c.textArea}
            placeholder="Байрны талаар асуух зүйлсээ бичнэ үү..."
            placeholderTextColor="#9ca3af"
            multiline value={msgText} onChangeText={setMsgText}
            textAlignVertical="top"
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={c.quickRow}>
          {['Байр хаана байдаг вэ?', 'Үзэж болох уу?', 'Үнэ тохирох уу?', 'Хэзээнээс гэрээ хийж болох вэ?'].map(q => (
            <TouchableOpacity key={q} style={c.quickChip} onPress={() => setMsgText(q)}>
              <Text style={c.quickChipTxt}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity
          style={[c.submitBtn, (!msgText.trim() || msgSending) && c.submitBtnDis]}
          onPress={sendMsg} disabled={!msgText.trim() || msgSending}
        >
          {msgSending
            ? <ActivityIndicator color="#fff" />
            : <Text style={c.submitBtnTxt}>Илгээх →</Text>
          }
        </TouchableOpacity>
      </BottomModal>

      {/* ── Review Modal ── */}
      <BottomModal visible={rvOpen} onClose={() => setRvOpen(false)} title="⭐ Үнэлгээ бичих">
        <View style={c.starPickRow}>
          {[1,2,3,4,5].map(n => (
            <TouchableOpacity key={n} onPress={() => setRvRating(n)} style={c.starPickBtn}>
              <Text style={[c.starPickIco, n <= rvRating && c.starPickIcoOn]}>{n <= rvRating ? '★' : '☆'}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={c.starLabel}>
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
          style={[c.submitBtn, (!rvText.trim() || rvSending) && c.submitBtnDis]}
          onPress={postReview} disabled={!rvText.trim() || rvSending}
        >
          {rvSending
            ? <ActivityIndicator color="#fff" />
            : <Text style={c.submitBtnTxt}>Нийтлэх</Text>
          }
        </TouchableOpacity>
      </BottomModal>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
const AVATAR_COLORS = ['#2e55fa','#ff6b6b','#f0ad00','#20c997','#845ef7','#ff922b'];

function Section({ title, action, children }: { title:string; action?:string; children:React.ReactNode }) {
  return (
    <View style={c.section}>
      <View style={c.sectionHead}>
        <Text style={c.sectionTitle}>{title}</Text>
        {action && <Text style={c.sectionAction}>{action}</Text>}
      </View>
      {children}
    </View>
  );
}

function KeyStat({ icon, val, unit }: { icon:string; val:string; unit:string }) {
  return (
    <View style={c.keyStat}>
      <Text style={c.keyStatIco}>{icon}</Text>
      <Text style={c.keyStatVal}>{val}</Text>
      <Text style={c.keyStatUnit}>{unit}</Text>
    </View>
  );
}

function SpecCard({ label, value, icon }: { label:string; value:string; icon:string }) {
  return (
    <View style={c.specCard}>
      <Text style={c.specCardIco}>{icon}</Text>
      <Text style={c.specCardLbl}>{label}</Text>
      <Text style={c.specCardVal}>{value}</Text>
    </View>
  );
}

function BottomModal({ visible, onClose, title, children }: {
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const c = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f2f5' },
  safe: { flex: 1, backgroundColor: '#f0f2f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  loadTxt: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  errEmoji: { fontSize: 56 },
  errTxt: { fontSize: 15, color: '#374151', fontWeight: '600', textAlign: 'center' },
  retryBtn: { backgroundColor: '#1a3cff', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 28, marginTop: 4 },
  retryTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },
  backTxt: { color: '#1a3cff', fontSize: 14, fontWeight: '700' },

  // Floating header
  floatingHeader: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
  },
  floatingInner: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingTop: Platform.OS === 'android' ? 36 : 0,
    paddingBottom: 10, gap: 10,
  },
  fabBack: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  fabBackTxt: { fontSize: 18, color: '#fff' },
  floatingTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: '#111' },
  fabHeart: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  fabHeartTxt: { fontSize: 18 },

  // Hero
  heroGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 120,
    backgroundColor: 'rgba(0,0,0,0)', // real gradient would need expo-linear-gradient
  },
  dotsRow: {
    position: 'absolute', bottom: 16, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.45)' },
  dotActive: { backgroundColor: '#fff', width: 20, borderRadius: 3 },
  heroBadge: {
    position: 'absolute', bottom: 14, right: 14,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10,
    paddingVertical: 3, paddingHorizontal: 9,
  },
  heroBadgeTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
  heroCatTag: {
    position: 'absolute', top: 14 + (Platform.OS === 'android' ? 36 : 44), left: 14,
    backgroundColor: 'rgba(26,60,255,0.85)',
    borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10,
  },
  heroCatTxt: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  noHero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  noHeroTxt: { fontSize: 14, color: '#9ca3af' },

  // Price strip
  priceStrip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 18, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#f0f2f5',
  },
  priceLhs: { flex: 1 },
  bigPrice: { fontSize: 26, fontWeight: '900', color: '#1a3cff', letterSpacing: -0.5 },
  pricePerSqm: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  priceRhs: {},
  ratingChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#fffbeb', borderRadius: 20,
    paddingVertical: 5, paddingHorizontal: 11,
    borderWidth: 1, borderColor: '#fde68a',
  },
  ratingChipStar: { color: '#f59e0b', fontSize: 14 },
  ratingChipNum: { fontSize: 14, fontWeight: '900', color: '#92400e' },
  ratingChipCnt: { fontSize: 11, color: '#b45309' },

  // Title block
  titleBlock: { backgroundColor: '#fff', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 16, gap: 4 },
  mainTitle: { fontSize: 20, fontWeight: '900', color: '#111827', lineHeight: 28 },
  locLine: { fontSize: 13, color: '#4b5563', marginTop: 2 },
  addrLine: { fontSize: 12, color: '#9ca3af' },
  ageLine: { fontSize: 11, color: '#d1d5db', marginTop: 2 },

  // Key stat bar
  keyBar: {
    flexDirection: 'row', backgroundColor: '#1a3cff',
    paddingVertical: 14, paddingHorizontal: 4,
  },
  keyStat: { flex: 1, alignItems: 'center', gap: 2 },
  keyStatIco: { fontSize: 20 },
  keyStatVal: { fontSize: 14, fontWeight: '900', color: '#fff' },
  keyStatUnit: { fontSize: 9, color: 'rgba(255,255,255,0.65)', fontWeight: '600', textAlign: 'center' },

  // Section
  section: { backgroundColor: '#fff', marginTop: 8, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 20 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: '#111827' },
  sectionAction: { fontSize: 16, fontWeight: '900', color: '#f59e0b' },

  // Spec grid
  specGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  specCard: {
    width: (W - 36 - 10) / 2,
    backgroundColor: '#f9fafb', borderRadius: 14, padding: 13,
    borderWidth: 1, borderColor: '#f0f2f5', gap: 3,
  },
  specCardIco: { fontSize: 22 },
  specCardLbl: { fontSize: 11, color: '#9ca3af', fontWeight: '600' },
  specCardVal: { fontSize: 14, fontWeight: '800', color: '#111827' },
  payCard: { marginTop: 12, backgroundColor: '#fffbeb', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#fde68a' },
  payTitle: { fontSize: 12, fontWeight: '800', color: '#92400e', marginBottom: 5 },
  payVal: { fontSize: 13, color: '#78350f', lineHeight: 20 },

  // Utility
  utilRow: { flexDirection: 'row', gap: 8 },
  utilItem: { flex: 1, backgroundColor: '#eff6ff', borderRadius: 12, padding: 12, alignItems: 'center', gap: 2, borderWidth: 1, borderColor: '#dbeafe' },
  utilIco: { fontSize: 22 },
  utilLbl: { fontSize: 11, color: '#6b7280', fontWeight: '600' },
  utilRange: { fontSize: 11, fontWeight: '800', color: '#1d4ed8', textAlign: 'center' },
  utilDash: { fontSize: 10, color: '#93c5fd' },
  utilNote: { fontSize: 10, color: '#d1d5db', textAlign: 'center', marginTop: 10 },

  // Description
  descTxt: { fontSize: 14, color: '#374151', lineHeight: 23 },

  // Tags
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#f0f4ff', borderRadius: 20,
    paddingVertical: 7, paddingHorizontal: 13,
    borderWidth: 1, borderColor: '#c7d2fe',
  },
  tagTxt: { fontSize: 12, fontWeight: '700', color: '#4338ca' },
  tagDivider: { width: 1, height: 12, backgroundColor: '#c7d2fe' },
  tagVal: { fontSize: 12, color: '#6366f1' },

  // Owner
  ownerCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  ownerLeft: { position: 'relative' },
  ownerAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#e0e7ff' },
  ownerAvatarFallback: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#1a3cff', alignItems: 'center', justifyContent: 'center',
  },
  ownerAvatarLetter: { fontSize: 24, fontWeight: '900', color: '#fff' },
  verifiedBubble: {
    position: 'absolute', bottom: 0, right: 0,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  verifiedBubbleTxt: { color: '#fff', fontSize: 10, fontWeight: '900' },
  ownerInfo: { flex: 1, gap: 2 },
  ownerName: { fontSize: 16, fontWeight: '900', color: '#111827' },
  agencyName: { fontSize: 13, color: '#4b5563' },
  licenseTxt: { fontSize: 11, color: '#9ca3af' },
  ownerPhone: { fontSize: 13, color: '#1a3cff', fontWeight: '700' },
  brokerBio: { fontSize: 13, color: '#6b7280', lineHeight: 20, marginBottom: 12 },
  msgOwnerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#eff6ff', borderRadius: 14,
    paddingVertical: 13, borderWidth: 1.5, borderColor: '#bfdbfe',
  },
  msgOwnerIco: { fontSize: 16 },
  msgOwnerTxt: { fontSize: 14, fontWeight: '800', color: '#1d4ed8' },

  // Reviews
  noReviews: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  noReviewsEmoji: { fontSize: 36 },
  noReviewsTxt: { fontSize: 13, color: '#9ca3af' },
  reviewCard: {
    backgroundColor: '#f9fafb', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#f0f2f5',
  },
  reviewCardMt: { marginTop: 10 },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  reviewAv: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  reviewAvTxt: { color: '#fff', fontWeight: '900', fontSize: 14 },
  reviewMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flex: 1 },
  reviewUser: { fontSize: 13, fontWeight: '800', color: '#111827' },
  reviewTime: { fontSize: 10, color: '#d1d5db' },
  reviewStars: { fontSize: 13, color: '#f59e0b', marginTop: 1 },
  reviewTxt: { fontSize: 13, color: '#4b5563', lineHeight: 20 },
  writeRvBtn: {
    marginTop: 14, borderRadius: 14, paddingVertical: 13,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  writeRvTxt: { fontSize: 14, fontWeight: '700', color: '#6b7280' },

  // Sticky bar
  stickyBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#e5e7eb', gap: 10,
    ...Platform.select({ ios: { paddingBottom: 24 } }),
  },
  stickyLeft: { flex: 1 },
  stickyPrice: { fontSize: 16, fontWeight: '900', color: '#1a3cff' },
  stickyMeta: { fontSize: 11, color: '#9ca3af' },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#f0f4ff', borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 16,
    borderWidth: 1.5, borderColor: '#c7d2fe',
  },
  callIco: { fontSize: 14 },
  callTxt: { fontSize: 13, fontWeight: '800', color: '#4338ca' },
  chatBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#1a3cff', borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 16,
  },
  chatIco: { fontSize: 14 },
  chatTxt: { fontSize: 13, fontWeight: '800', color: '#fff' },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 36, gap: 14,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb', alignSelf: 'center', marginBottom: 4 },
  sheetTitle: { fontSize: 20, fontWeight: '900', color: '#111827' },
  modalSub: { fontSize: 13, color: '#6b7280', marginTop: -8 },
  inputBox: { backgroundColor: '#f9fafb', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb' },
  textArea: { padding: 14, fontSize: 14, color: '#111827', minHeight: 90 },
  quickRow: { marginTop: -4 },
  quickChip: {
    backgroundColor: '#eff6ff', borderRadius: 20,
    paddingVertical: 7, paddingHorizontal: 13, marginRight: 8,
    borderWidth: 1, borderColor: '#bfdbfe',
  },
  quickChipTxt: { fontSize: 12, fontWeight: '700', color: '#1d4ed8', whiteSpace: 'nowrap' } as any,
  submitBtn: { backgroundColor: '#1a3cff', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  submitBtnDis: { opacity: 0.35 },
  submitBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '900' },

  // Star picker
  starPickRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  starPickBtn: { padding: 4 },
  starPickIco: { fontSize: 40, color: '#e5e7eb' },
  starPickIcoOn: { color: '#f59e0b' },
  starLabel: { textAlign: 'center', fontSize: 15, fontWeight: '700', color: '#4b5563', marginTop: -6 },
});
