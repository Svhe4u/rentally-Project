import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { Colors } from '../constants/colors';
import { BookingAPI } from '../services/api';

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

  const months = (() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate), e = new Date(endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) return 0;
    return Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  })();

  const totalPrice = months * pricePerMonth;
  const canBook    = !!startDate && !!endDate && months > 0;

  const handleBook = async () => {
    if (!canBook) return;
    setLoading(true);
    try {
      const booking = await BookingAPI.create({
        listing_id: listingId,
        user_id: userId,
        start_date: startDate,
        end_date: endDate,
        total_price: totalPrice,
        status: 'pending',
      });
      Alert.alert(
        'Захиалга амжилттай',
        `Захиалгын дугаар: #${booking.id}\nТогтоогдох хүртэл хүлээнэ үү.`,
        [{ text: 'OK', onPress: () => onNavigate('home') }],
      );
    } catch (e: any) {
      Alert.alert('Алдаа', e.message || 'Захиалга амжилтгүй боллоо');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => onNavigate('listingDetail', { listingId })} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Захиалга өгөх</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>

        {/* Listing summary */}
        <View style={s.listingCard}>
          <View style={s.listingImg}><Text style={{ fontSize: 32 }}>🏢</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.listingTitle} numberOfLines={2}>{listingTitle}</Text>
            <Text style={s.listingPrice}>{pricePerMonth.toLocaleString()}₮ / сар</Text>
          </View>
        </View>

        {/* Date inputs */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Захиалгын огноо</Text>

          <View style={s.dateRow}>
            <View style={s.dateGroup}>
              <Text style={s.label}>Эхлэх огноо</Text>
              <TextInput
                style={s.dateInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textLight}
                value={startDate}
                onChangeText={setStartDate}
              />
            </View>
            <View style={s.dateSep}><Text style={s.dateSepTxt}>→</Text></View>
            <View style={s.dateGroup}>
              <Text style={s.label}>Дуусах огноо</Text>
              <TextInput
                style={s.dateInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textLight}
                value={endDate}
                onChangeText={setEndDate}
              />
            </View>
          </View>

          {months > 0 && (
            <View style={s.durationBadge}>
              <Text style={s.durationTxt}>📅 {months} сар</Text>
            </View>
          )}
        </View>

        {/* Price breakdown */}
        {months > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Үнийн тооцоо</Text>
            {[
              [`${pricePerMonth.toLocaleString()}₮ × ${months} сар`, `${totalPrice.toLocaleString()}₮`],
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
            <View key={pm.key} style={s.payRow}>
              <Text style={s.payLabel}>{pm.label}</Text>
              <Text style={s.payArrow}>›</Text>
            </View>
          ))}
        </View>

        {/* Note */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Нэмэлт тэмдэглэл</Text>
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

        {/* Terms */}
        <View style={s.termsBox}>
          <Text style={s.termsTxt}>
            Захиалга өгснөөр{' '}
            <Text style={s.termsLink}>Үйлчилгээний нөхцөл</Text>
            {'-г зөвшөөрч байна.'}
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Bottom button */}
      <View style={s.footer}>
        {months > 0 && (
          <View style={s.footerPrice}>
            <Text style={s.footerPriceLabel}>Нийт төлбөр</Text>
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
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, gap: 14 },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 22, color: Colors.text },
  headerTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  listingCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.white, borderRadius: 14, padding: 14 },
  listingImg:   { width: 56, height: 56, borderRadius: 12, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  listingTitle: { fontSize: 14, fontWeight: '800', color: Colors.text, lineHeight: 20, marginBottom: 4 },
  listingPrice: { fontSize: 15, fontWeight: '900', color: Colors.primary },
  card:      { backgroundColor: Colors.white, borderRadius: 14, padding: 16 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: Colors.text, marginBottom: 14 },
  dateRow:   { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  dateGroup: { flex: 1 },
  dateSep:   { paddingBottom: 12, alignItems: 'center' },
  dateSepTxt: { fontSize: 18, color: Colors.textLight },
  label:     { fontSize: 12, fontWeight: '700', color: '#555', marginBottom: 6 },
  dateInput: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, fontSize: 13, color: Colors.text, backgroundColor: '#fafafa' },
  durationBadge: { marginTop: 12, backgroundColor: Colors.iconBg, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, alignSelf: 'flex-start' },
  durationTxt:   { fontSize: 13, fontWeight: '700', color: Colors.primary },
  priceRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  priceRowTotal: { borderBottomWidth: 0, marginTop: 4 },
  priceKey:      { fontSize: 13, color: Colors.textMuted },
  priceKeyBold:  { fontWeight: '800', color: Colors.text },
  priceVal:      { fontSize: 13, color: Colors.text, fontWeight: '600' },
  priceValBold:  { fontWeight: '900', color: Colors.primary, fontSize: 15 },
  payRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  payLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },
  payArrow: { fontSize: 18, color: Colors.textLight },
  noteInput: { backgroundColor: Colors.bg, borderRadius: 10, padding: 12, fontSize: 14, color: Colors.text, minHeight: 80, textAlignVertical: 'top' },
  termsBox:  { backgroundColor: Colors.white, borderRadius: 12, padding: 14 },
  termsTxt:  { fontSize: 12, color: Colors.textMuted, lineHeight: 20, textAlign: 'center' },
  termsLink: { color: Colors.primary, fontWeight: '700' },
  footer:    { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border, gap: 8 },
  footerPrice:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerPriceLabel: { fontSize: 13, color: Colors.textMuted },
  footerPriceAmt:   { fontSize: 16, fontWeight: '900', color: Colors.primary },
  btnBook:   { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  btnOff:    { backgroundColor: '#b0c0f8' },
  btnBookTxt: { fontSize: 15, fontWeight: '800', color: Colors.white },
});
