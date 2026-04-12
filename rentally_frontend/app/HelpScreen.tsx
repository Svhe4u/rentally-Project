import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface Props {
  onNavigate: (screen: string) => void;
}

const FAQS = [
  { q: 'Байр яаж түрээслэх вэ?', a: 'Та өөрт таалагдсан байраа сонгоод "Захиалга" товчийг даран түрээслэх хүсэлтээ илгээх боломжтой.' },
  { q: 'Зуучлагчаар яаж ажиллах вэ?', a: 'Профайл хэсэгт байрлах "Зуучлагчаар бүртгүүлэх" хэсэгт хүсэлтээ илгээснээр манай баг тантай холбогдоно.' },
  { q: 'Төлбөрөө яаж төлөх вэ?', a: 'QPay болон бусад банкны аппликейшн ашиглан байрны түрээсийн төлбөрийг шууд төлөх боломжтой.' },
  { q: 'Нууц үгээ мартсан бол яах вэ?', a: 'Нэвтрэх хэсэгт байрлах "Нууц үг мартсан" холбоосоор орон бүртгэлтэй и-мэйл хаягаараа сэргээх боломжтой.' },
];

function FaqItem({ q, a }: { q: string, a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity style={s.faqItem} onPress={() => setOpen(!open)} activeOpacity={0.7}>
      <View style={s.faqTop}>
        <Text style={s.faqQ}>{q}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.primary} />
      </View>
      {open && <Text style={s.faqA}>{a}</Text>}
    </TouchableOpacity>
  );
}

export default function HelpScreen({ onNavigate }: Props) {
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => onNavigate('profile')} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Тусламжийн төв</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.hero}>
          <View style={s.iconBg}>
            <Ionicons name="help-buoy" size={40} color={Colors.primary} />
          </View>
          <Text style={s.heroTitle}>Танд юугаар туслах вэ?</Text>
          <Text style={s.heroSub}>Түгээмэл асуултууд болон тусламж</Text>
        </View>

        <Text style={s.label}>Түгээмэл асуулт хариулт</Text>
        <View style={s.faqList}>
          {FAQS.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
        </View>

        <View style={s.contactCard}>
          <Text style={s.contactTitle}>Шууд холбогдох</Text>
          <Text style={s.contactSub}>Хэрэв таны асуулт хариултаас олдоогүй бол бидэнтэй холбогдоорой.</Text>
          <TouchableOpacity style={s.contactBtn}>
            <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
            <Text style={s.contactBtnTxt}>Чатлах</Text>
          </TouchableOpacity>
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
  hero: { alignItems: 'center', marginBottom: 30 },
  iconBg: {
    width: 72, height: 72, borderRadius: 24, backgroundColor: Colors.primary + '15',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  heroTitle: { fontSize: 20, fontWeight: '900', color: Colors.text },
  heroSub: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  label: { fontSize: 14, fontWeight: '800', color: Colors.text, marginBottom: 14, marginLeft: 4 },
  faqList: { gap: 12, marginBottom: 24 },
  faqItem: { backgroundColor: Colors.white, borderRadius: 16, padding: 16 },
  faqTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQ: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.text, paddingRight: 10 },
  faqA: { fontSize: 13, color: Colors.textMuted, marginTop: 12, lineHeight: 20 },
  contactCard: {
    backgroundColor: Colors.white, borderRadius: 24, padding: 20, alignItems: 'center',
    marginBottom: 40, borderStyle: 'dashed', borderWidth: 1, borderColor: Colors.primary,
  },
  contactTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  contactSub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginBottom: 16 },
  contactBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14,
  },
  contactBtnTxt: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
