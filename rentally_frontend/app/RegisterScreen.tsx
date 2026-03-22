import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { Colors } from '../constants/colors';
import { AuthAPI } from '../services/api';

interface Props { onNavigate: (screen: string) => void; }

export default function RegisterScreen({ onNavigate }: Props) {
  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [agreed, setAgreed]     = useState(false);
  const [loading, setLoading]   = useState(false);

  const canSubmit = agreed && !!username && !!email && password.length >= 6 && password === confirm;

  const handleRegister = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await AuthAPI.register({ username, email, password, phone });
      Alert.alert('Амжилттай', 'Бүртгэл амжилттай үүслээ!', [
        { text: 'Нэвтрэх', onPress: () => onNavigate('login') },
      ]);
    } catch (e: any) {
      Alert.alert('Алдаа', e.message || 'Бүртгэл амжилтгүй боллоо');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { label: 'Хэрэглэгчийн нэр', value: username, set: setUsername, placeholder: 'username', kb: 'default' as const, secure: false },
    { label: 'Имэйл',            value: email,    set: setEmail,    placeholder: 'email@mail.com', kb: 'email-address' as const, secure: false },
    { label: 'Утас',             value: phone,    set: setPhone,    placeholder: '99xxxxxx', kb: 'phone-pad' as const, secure: false },
    { label: 'Нууц үг',         value: password, set: setPassword, placeholder: '6+ тэмдэгт', kb: 'default' as const, secure: true },
    { label: 'Нууц үг давтах',  value: confirm,  set: setConfirm,  placeholder: '••••••••', kb: 'default' as const, secure: true },
  ];

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => onNavigate('login')} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Бүртгүүлэх</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <View style={s.logoRow}>
          <View style={s.bubble}><Text style={{ fontSize: 28 }}>🏠</Text></View>
          <Text style={s.logoName}>БАЙ<Text style={s.logoAccent}>Р</Text></Text>
        </View>

        {fields.map(f => (
          <View key={f.label} style={s.group}>
            <Text style={s.label}>{f.label}</Text>
            <TextInput
              style={[s.input,
                f.label === 'Нууц үг давтах' && confirm.length > 0 && confirm !== password
                  ? s.inputErr : null]}
              placeholder={f.placeholder}
              placeholderTextColor={Colors.textLight}
              value={f.value}
              onChangeText={f.set}
              keyboardType={f.kb}
              secureTextEntry={f.secure}
              autoCapitalize="none"
            />
            {f.label === 'Нууц үг давтах' && confirm.length > 0 && confirm !== password && (
              <Text style={s.errTxt}>Нууц үг таарахгүй байна</Text>
            )}
          </View>
        ))}

        <TouchableOpacity style={s.agreeRow} onPress={() => setAgreed(!agreed)} activeOpacity={0.7}>
          <View style={[s.check, agreed && s.checkOn]}>
            {agreed && <Text style={s.checkMark}>✓</Text>}
          </View>
          <Text style={s.agreeTxt}>
            <Text style={s.agreeLink}>Үйлчилгээний нөхцөл</Text>{' болон '}
            <Text style={s.agreeLink}>Нууцлалын бодлого</Text>{'-г зөвшөөрч байна'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.btnPrimary, !canSubmit && s.btnOff]}
          onPress={handleRegister}
          disabled={!canSubmit || loading}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color={Colors.white} />
            : <Text style={s.btnPrimaryTxt}>Бүртгүүлэх</Text>}
        </TouchableOpacity>

        <View style={s.divRow}>
          <View style={s.divLine} /><Text style={s.divTxt}>эсвэл</Text><View style={s.divLine} />
        </View>

        <TouchableOpacity style={s.btnKakao} activeOpacity={0.85}>
          <Text style={s.btnKakaoTxt}>💬  Какао-гоор бүртгүүлэх</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnApple} activeOpacity={0.85}>
          <Text style={s.btnAppleTxt}>🍎  Apple-ээр бүртгүүлэх</Text>
        </TouchableOpacity>

        <View style={s.loginRow}>
          <Text style={s.loginTxt}>Аль хэдийн бүртгэлтэй юу? </Text>
          <TouchableOpacity onPress={() => onNavigate('login')}>
            <Text style={s.loginLink}>Нэвтрэх</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.white },
  content: { paddingHorizontal: 22, paddingBottom: 16 },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 22, color: Colors.text },
  headerTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  logoRow: { alignItems: 'center', paddingVertical: 24, gap: 6 },
  bubble:  { width: 56, height: 56, backgroundColor: Colors.primary, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  logoName: { fontSize: 28, fontWeight: '900', color: Colors.primary },
  logoAccent: { color: Colors.yellow },
  group:   { marginBottom: 14 },
  label:   { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 6 },
  input:   { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, fontSize: 14, color: Colors.text, backgroundColor: '#fafafa' },
  inputErr: { borderColor: Colors.red },
  errTxt:  { fontSize: 11, color: Colors.red, marginTop: 4 },
  agreeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginVertical: 16 },
  check:   { width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkMark: { fontSize: 12, color: Colors.white, fontWeight: '900' },
  agreeTxt: { flex: 1, fontSize: 13, color: Colors.textMuted, lineHeight: 20 },
  agreeLink: { color: Colors.primary, fontWeight: '700' },
  btnPrimary: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 16 },
  btnOff:  { backgroundColor: '#b0c0f8' },
  btnPrimaryTxt: { fontSize: 15, fontWeight: '800', color: Colors.white },
  divRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  divLine: { flex: 1, height: 1, backgroundColor: '#e0e0e0' },
  divTxt:  { fontSize: 12, color: '#bbb', fontWeight: '600' },
  btnKakao: { backgroundColor: Colors.kakao, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  btnKakaoTxt: { fontSize: 14, fontWeight: '700', color: '#191919' },
  btnApple: { backgroundColor: Colors.black, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 20 },
  btnAppleTxt: { fontSize: 14, fontWeight: '700', color: Colors.white },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginTxt: { fontSize: 13, color: Colors.textLight },
  loginLink: { fontSize: 13, color: Colors.primary, fontWeight: '700' },
});
