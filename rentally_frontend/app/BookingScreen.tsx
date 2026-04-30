import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, ActivityIndicator, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { BookingAPI } from '../services/api';
import NotificationModal, { NotificationType } from '../components/NotificationModal';

interface Props {
  onNavigate: (screen: string, params?: any) => void;
  listingId?: number;
  userId?: number;
  listingTitle?: string;
  pricePerMonth?: number;
}

export default function BookingScreen({
  onNavigate,
  listingId = 1,
  userId = 1,
  listingTitle = 'Байр',
  pricePerMonth = 800000,
}: Props) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');
  const [note, setNote]           = useState('');
  const [loading, setLoading]     = useState(false);

  // Modal state
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationType, setNotificationType] = useState<NotificationType>('success');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationAction, setNotificationAction] = useState<(() => void) | undefined>();

  const days = (() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate), e = new Date(endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) return 0;
    return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  })();

  // Frontend shows estimation only - backend will calculate actual price
  const totalPrice = Math.round(days * (pricePerMonth / 30));
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const startDateObj = startDate ? new Date(startDate) : null;
  if (startDateObj) startDateObj.setHours(0,0,0,0);
  const canBook    = !!startDate && !!endDate && days > 0 && startDateObj && startDateObj >= todayStart;

  const handleBook = async () => {
    if (!canBook) {
      // Show error modal explaining why the booking can't proceed
      const todayStart = new Date(); todayStart.setHours(0,0,0,0);
      const s = startDate ? new Date(startDate) : null;
      if (s) s.setHours(0,0,0,0);

      setNotificationType('error');
      setNotificationTitle('Алдаа');

      if (!startDate || !endDate) {
        setNotificationMessage('Эхлэх болон дуусах огноог заавал сонгоно уу.');
      } else if (s && s < todayStart) {
        setNotificationMessage('Эхлэх огноо өнөөгийн огнооноос өмнөх байж болохгүй.');
      } else {
        setNotificationMessage('Дуусах огноо эхлэх огнооноос хойш байх ёстой.');
      }

      setNotificationVisible(true);
      return;
    }

    setLoading(true);
    try {
      const booking = await BookingAPI.create({
        listing_id: listingId,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        notes: note,
        status: 'pending',
      });
      setNotificationType('success');
      setNotificationTitle('Захиалга амжилттай');
      setNotificationMessage(`Захиалгын дугаар: #${booking.id}\nТогтоогдох хүртэл хүлээнэ үү.`);
      setNotificationAction(() => () => onNavigate('home'));
      setNotificationVisible(true);
    } catch (e: any) {
      setNotificationType('error');
      setNotificationTitle('Алдаа');
      setNotificationMessage(e.message || 'Захиалга амжилтгүй боллоо');
      setNotificationAction(undefined);
      setNotificationVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => onNavigate('listingDetail', { listingId })} style={s.topBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Захиалга өгөх</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>

        {/* Listing summary */}
        <View style={s.card}>
          <View style={s.listingCardContent}>
            <View style={s.listingImg}><Text style={{ fontSize: 32 }}>🏢</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.listingTitle} numberOfLines={2}>{listingTitle}</Text>
              <Text style={s.listingPrice}>{pricePerMonth.toLocaleString()}₮ <Text style={s.listingPriceSub}>/ сар</Text></Text>
            </View>
          </View>
        </View>

        {/* Date inputs */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Захиалгын огноо</Text>

          <View style={s.dateRow}>
            <View style={s.dateGroup}>
              <Text style={s.label}>Эхлэх огноо</Text>
              <View style={s.inputWrap}>
                <TextInput
                  style={s.dateInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.textLight}
                  value={startDate}
                  onChangeText={setStartDate}
                />
              </View>
            </View>
            <View style={s.dateSep}><Ionicons name="arrow-forward" size={20} color={Colors.textLight} /></View>
            <View style={s.dateGroup}>
              <Text style={s.label}>Дуусах огноо</Text>
              <View style={s.inputWrap}>
                <TextInput
                  style={s.dateInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.textLight}
                  value={endDate}
                  onChangeText={setEndDate}
                />
              </View>
            </View>
          </View>

          {days > 0 && (
            <View style={s.durationBadge}>
              <Text style={s.durationTxt}>📅 {days} өдөр</Text>
            </View>
          )}
        </View>

        {/* Price breakdown */}
        {days > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Үнийн тооцоо</Text>
            {[
              [`${pricePerMonth.toLocaleString()}₮ × ${days} өдөр (÷30)`, `${totalPrice.toLocaleString()}₮`],
              ['Үйлчилгээний хураамж', '0₮'],
              ['Нийт төлбөр', `${totalPrice.toLocaleString()}₮`],
            ].map(([k, v], i) => (
              <View key={k} style={[s.priceRow, i === 2 && s.priceRowTotal]}>
                <Text style={[s.priceKey, i === 2 && s.priceKeyBold]}>{k}</Text>
                <Text style={[s.priceVal, i === 2 && s.priceValBold]}>{v}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Payment methods */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Төлбөрийн хэлбэр</Text>
          {[
            { key: 'qpay', label: '📱 QPay' },
            { key: 'bank_transfer', label: '🏦 Банкны шилжүүлэг' },
            { key: 'socialpay', label: '💳 SocialPay' },
            { key: 'cash', label: '💵 Бэлэн мөнгө' },
          ].map(pm => (
            <TouchableOpacity key={pm.key} style={s.payRow} activeOpacity={0.7}>
              <Text style={s.payLabel}>{pm.label}</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Note */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Нэмэлт тэмдэглэл</Text>
          <View style={s.inputWrapMultiline}>
            <TextInput
              style={s.noteInput}
              placeholder="Зуучлагчид мессеж үлдээх..."
              placeholderTextColor={Colors.textLight}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Terms */}
        <View style={s.card}>
          <Text style={s.termsTxt}>
            Захиалга өгснөөр{' '}
            <Text style={s.termsLink}>Үйлчилгээний нөхцөл</Text>
            {'-г зөвшөөрч байна.'}
          </Text>
        </View>

      </ScrollView>

      {/* Bottom button */}
      <View style={s.footer}>
        {days > 0 && (
          <View style={s.footerPrice}>
            <Text style={s.footerPriceLabel}>Нийт төлбөр (зөвтгөл)</Text>
            <Text style={s.footerPriceAmt}>{totalPrice.toLocaleString()}₮</Text>
          </View>
        )}
        <TouchableOpacity
          style={[s.btnBook, !canBook && s.btnOff]}
          onPress={handleBook}
          disabled={!canBook || loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={s.btnBookTxt}>Захиалга баталгаажуулах</Text>}
        </TouchableOpacity>
      </View>

      {/* Notification Modal */}
      <NotificationModal
        visible={notificationVisible}
        type={notificationType}
        title={notificationTitle}
        message={notificationMessage}
        onClose={() => setNotificationVisible(false)}
        onConfirm={notificationAction}
        confirmText={notificationType === 'success' ? 'Өмнөх хуудаст' : 'OK'}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15,
    backgroundColor: Colors.white,
  },
  topBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  content: { paddingBottom: 30 },
  
  card: { 
    marginHorizontal: 20, marginTop: 15,
    backgroundColor: Colors.white, borderRadius: 24, padding: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10 },
      android: { elevation: 2 },
    }),
  },
  cardTitle: { fontSize: 13, fontWeight: '800', color: Colors.textLight, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
  
  listingCardContent: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  listingImg:   { width: 64, height: 64, borderRadius: 16, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  listingTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, lineHeight: 22, mb: 4 },
  listingPrice: { fontSize: 18, fontWeight: '900', color: Colors.primary, marginTop: 4 },
  listingPriceSub: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  
  dateRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateGroup: { flex: 1 },
  dateSep:   { paddingHorizontal: 5 },
  label:     { fontSize: 12, fontWeight: 'bold', color: Colors.textMuted, marginBottom: 8, marginLeft: 4 },
  
  inputWrap: { backgroundColor: Colors.bg, borderRadius: 14, paddingHorizontal: 14 },
  dateInput: { paddingVertical: 14, fontSize: 14, color: Colors.text, fontWeight: '600', textAlign: 'center' },
  
  inputWrapMultiline: { backgroundColor: Colors.bg, borderRadius: 14, padding: 14 },
  noteInput: { fontSize: 14, color: Colors.text, minHeight: 80, textAlignVertical: 'top' },
  
  durationBadge: { marginTop: 15, backgroundColor: Colors.primary + '15', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, alignSelf: 'flex-start' },
  durationTxt:   { fontSize: 13, fontWeight: '800', color: Colors.primary },
  
  priceRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  priceRowTotal: { borderBottomWidth: 0, marginTop: 4, paddingTop: 16 },
  priceKey:      { fontSize: 13, color: Colors.textMuted },
  priceKeyBold:  { fontWeight: '800', color: Colors.text, fontSize: 14, textTransform: 'uppercase' },
  priceVal:      { fontSize: 13, color: Colors.text, fontWeight: '700' },
  priceValBold:  { fontWeight: '900', color: Colors.primary, fontSize: 18 },
  
  payRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  payLabel: { fontSize: 15, fontWeight: '600', color: Colors.text },
  
  termsTxt:  { fontSize: 13, color: Colors.textMuted, lineHeight: 22, textAlign: 'center' },
  termsLink: { color: Colors.primary, fontWeight: '700' },
  
  footer: { 
    paddingHorizontal: 20, paddingVertical: 15, backgroundColor: Colors.white,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 10 },
    }),
  },
  footerPrice:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  footerPriceLabel: { fontSize: 14, color: Colors.textMuted, fontWeight: 'bold' },
  footerPriceAmt:   { fontSize: 20, fontWeight: '900', color: Colors.primary },
  btnBook:   { backgroundColor: Colors.primary, borderRadius: 24, paddingVertical: 16, alignItems: 'center' },
  btnOff:    { backgroundColor: Colors.primary + '60' },
  btnBookTxt: { fontSize: 16, fontWeight: 'bold', color: Colors.white, letterSpacing: 0.5 },
});
