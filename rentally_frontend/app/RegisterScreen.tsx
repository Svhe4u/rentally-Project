import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { AuthAPI } from '../services/api';

interface Props {
  onNavigate: (screen: string) => void;
}

export default function RegisterScreen({ onNavigate }: Props) {
  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [agreed, setAgreed]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showPass, setShowPass] = useState(false);

  const passwordsMatch = confirm.length === 0 || password === confirm;
  const canSubmit = agreed && !!username && !!email && password.length >= 8 && password === confirm;

  const handleRegister = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      await AuthAPI.register({
        username,
        email,
        password,
        password2: confirm,
        first_name: '', // Required by backend serializer
        last_name: '',  // Required by backend serializer
        phone
      });
      // Navigate to login after successful register
      onNavigate('login');
    } catch (e: any) {
      setError(e.message || 'Бүртгэл амжилтгүй боллоо. Дахин оролдно уу.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => onNavigate('login')} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Бүртгүүлэх</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={s.logoRow}>
          <View style={s.bubble}>
            <Ionicons name="person-add" size={36} color="#fff" />
          </View>
          <Text style={s.logoName}>
            РЕНТАЛ<Text style={s.logoAccent}>ЛИ</Text>
          </Text>
          <Text style={s.logoSub}>Шинэ бүртгэл үүсгэх</Text>
        </View>

        <View style={s.card}>
          {/* Error */}
          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorTxt}>⚠️  {error}</Text>
            </View>
          ) : null}

          {/* Username */}
          <View style={s.group}>
            <Text style={s.label}>Хэрэглэгчийн нэр *</Text>
            <View style={s.inputWrap}>
              <Text style={s.icon}>👤</Text>
              <TextInput
                style={s.input}
                placeholder="username"
                placeholderTextColor="#bbb"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Email */}
          <View style={s.group}>
            <Text style={s.label}>Имэйл *</Text>
            <View style={s.inputWrap}>
              <Text style={s.icon}>📧</Text>
              <TextInput
                style={s.input}
                placeholder="email@example.com"
                placeholderTextColor="#bbb"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Phone */}
          <View style={s.group}>
            <Text style={s.label}>Утасны дугаар</Text>
            <View style={s.inputWrap}>
              <Text style={s.icon}>📱</Text>
              <TextInput
                style={s.input}
                placeholder="99xxxxxx"
                placeholderTextColor="#bbb"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Password */}
          <View style={s.group}>
            <Text style={s.label}>Нууц үг * (8+)</Text>
            <View style={s.inputWrap}>
              <Text style={s.icon}>🔒</Text>
              <TextInput
                style={[s.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor="#bbb"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ padding: 4 }}>
                <Text style={{ fontSize: 16 }}>{showPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm password */}
          <View style={s.group}>
            <Text style={s.label}>Нууц үг давтах *</Text>
            <View style={[s.inputWrap, !passwordsMatch && s.inputWrapErr]}>
              <Text style={s.icon}>🔐</Text>
              <TextInput
                style={[s.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor="#bbb"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
            </View>
            {!passwordsMatch && (
              <Text style={s.errHint}>Нууц үг таарахгүй байна</Text>
            )}
          </View>

          {/* Terms */}
          <TouchableOpacity style={s.agreeRow} onPress={() => setAgreed(!agreed)} activeOpacity={0.7}>
            <View style={[s.check, agreed && s.checkOn]}>
              {agreed && <Text style={s.checkMark}>✓</Text>}
            </View>
            <Text style={s.agreeTxt}>
              <Text style={s.agreeLink}>Үйлчилгээний нөхцөл</Text>
              {' болон '}
              <Text style={s.agreeLink}>Нууцлалын бодлого</Text>
              {'-г зөвшөөрч байна'}
            </Text>
          </TouchableOpacity>

          {/* Submit */}
          <TouchableOpacity
            style={[s.btnPrimary, (!canSubmit || loading) && s.btnOff]}
            onPress={handleRegister}
            disabled={!canSubmit || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.btnPrimaryTxt}>Бүртгүүлэх →</Text>
            )}
          </TouchableOpacity>

          {/* Login link */}
          <View style={s.loginRow}>
            <Text style={s.loginTxt}>Аль хэдийн бүртгэлтэй юу? </Text>
            <TouchableOpacity onPress={() => onNavigate('login')}>
              <Text style={s.loginLink}>Нэвтрэх</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f7ff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 22, color: '#333' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1a1a2e' },

  content: { paddingBottom: 32 },

  logoRow: { alignItems: 'center', paddingVertical: 20, gap: 6 },
  bubble: {
    width: 60, height: 60, backgroundColor: Colors.primary,
    borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  logoName: { fontSize: 30, fontWeight: '900', color: Colors.primary },
  logoAccent: { color: Colors.yellow ?? '#FFD700' },
  logoSub: { fontSize: 13, color: '#999', fontWeight: '500' },

  card: {
    marginHorizontal: 18,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 5,
  },

  errorBox: {
    backgroundColor: '#fff0f0', borderRadius: 10, padding: 12,
    marginBottom: 16, borderLeftWidth: 3, borderLeftColor: '#ff4444',
  },
  errorTxt: { color: '#cc0000', fontSize: 13, fontWeight: '600' },



  group: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '700', color: '#444', marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#e8e8f0',
    borderRadius: 13, backgroundColor: '#fafafe', paddingHorizontal: 12,
  },
  inputWrapErr: { borderColor: '#ff4444' },
  icon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, paddingVertical: 13, fontSize: 14, color: '#1a1a2e' },
  errHint: { fontSize: 11, color: '#ff4444', marginTop: 4 },

  agreeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginVertical: 16 },
  check: {
    width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: '#ddd',
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  checkOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkMark: { fontSize: 12, color: '#fff', fontWeight: '900' },
  agreeTxt: { flex: 1, fontSize: 13, color: '#777', lineHeight: 20 },
  agreeLink: { color: Colors.primary, fontWeight: '700' },

  btnPrimary: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center', marginBottom: 16,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  btnOff: { backgroundColor: '#b0bdf8', shadowOpacity: 0 },
  btnPrimaryTxt: { fontSize: 16, fontWeight: '800', color: '#fff' },

  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginTxt: { fontSize: 13, color: '#888' },
  loginLink: { fontSize: 13, color: Colors.primary, fontWeight: '800' },
});
