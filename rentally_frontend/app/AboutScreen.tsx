import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface Props {
  onNavigate: (screen: string) => void;
}

export default function AboutScreen({ onNavigate }: Props) {
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => onNavigate('profile')} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Бидний тухай</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.logoCard}>
          <View style={s.logoCircle}>
            <Text style={s.logoText}>Р</Text>
          </View>
          <Text style={s.brandName}>РЕНТАЛЛИ</Text>
          <Text style={s.version}>Хувилбар 1.0.4</Text>
        </View>

        <View style={s.card}>
          <Text style={s.secTitle}>Бидний зорилго</Text>
          <Text style={s.secTxt}>
            Рентэлли бол түрээслэгч болон түрээслүүлэгч нарыг хамгийн хурдан, найдвартай бөгөөд хялбараар холбох зорилготой Монголын анхны ухаалаг түрээсийн платформ юм.
          </Text>
          <Text style={s.secTxt}>
            Бид үл хөдлөх хөрөнгийн зах зээл дэх зуучлалын процессыг ил тод, технологид суурилсан болгохын төлөө ажилладаг.
          </Text>
        </View>

        <View style={s.card}>
          <Text style={s.secTitle}>Холбоо барих</Text>
          <View style={s.row}>
            <Ionicons name="call-outline" size={20} color={Colors.primary} />
            <Text style={s.rowTxt}>+976 7700 1234</Text>
          </View>
          <View style={s.row}>
            <Ionicons name="mail-outline" size={20} color={Colors.primary} />
            <Text style={s.rowTxt}>info@rentally.mn</Text>
          </View>
          <View style={s.row}>
            <Ionicons name="location-outline" size={20} color={Colors.primary} />
            <Text style={s.rowTxt}>Улаанбаатар хот, БЗД, 26-р хороо</Text>
          </View>
        </View>

        <View style={s.footer}>
          <Text style={s.copy}>© 2024 Rentally LLC. Бүх эрх хуулиар хамгаалагдсан.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  content: { padding: 20 },
  logoCard: { alignItems: 'center', marginBottom: 30, paddingVertical: 20 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 28, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 12,
  },
  logoText: { fontSize: 40, fontWeight: '900', color: '#fff' },
  brandName: { fontSize: 24, fontWeight: '900', color: Colors.primary, letterSpacing: 2 },
  version: { fontSize: 12, color: Colors.textMuted, marginTop: 4, fontWeight: '600' },
  card: { backgroundColor: Colors.white, borderRadius: 24, padding: 20, marginBottom: 20 },
  secTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  secTxt: { fontSize: 14, color: Colors.textMuted, lineHeight: 22, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  rowTxt: { fontSize: 14, color: Colors.text, fontWeight: '600' },
  footer: { alignItems: 'center', marginTop: 20, marginBottom: 40 },
  copy: { fontSize: 11, color: Colors.textLight },
});
