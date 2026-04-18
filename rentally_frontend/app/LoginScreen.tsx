import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, SafeAreaView,
  ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';

interface Props {
  onNavigate: (screen: string) => void;
}

export default function LoginScreen({ onNavigate }: Props) {
  const { login, isLoading, error, clearError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const canSubmit = username.trim().length > 0 && password.length >= 6;

  const handleLogin = async () => {
    if (!canSubmit) return;
    setLocalError('');
    clearError();
    try {
      await login(username.trim(), password);
      onNavigate('home');
    } catch (e: any) {
      setLocalError(e.message || 'Нэвтрэхэд алдаа гарлаа');
    }
  };

  const displayError = localError || error;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header/Close */}
        <View style={s.header}>
          <TouchableOpacity style={s.closeBtn} onPress={() => onNavigate('home')}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Logo */}
        <View style={s.logoArea}>
          <View style={s.logoBubble}>
            <Ionicons name="home" size={40} color="#fff" />
          </View>
          <Text style={s.logoName}>
            РЕНТАЛ<Text style={s.logoAccent}>ЛИ</Text>
          </Text>
          <Text style={s.subtitle}>Орон сууцны платформ</Text>
        </View>

        {/* Form card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Нэвтрэх</Text>

          {/* Error */}
          {displayError ? (
            <View style={s.errorBox}>
              <Text style={s.errorTxt}>⚠️  {displayError}</Text>
            </View>
          ) : null}

          {/* Username */}
          <View style={s.fieldGroup}>
            <Text style={s.label}>Хэрэглэгчийн нэр</Text>
            <View style={s.inputWrap}>
              <Text style={s.inputIcon}>👤</Text>
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

          {/* Password */}
          <View style={s.fieldGroup}>
            <Text style={s.label}>Нууц үг</Text>
            <View style={s.inputWrap}>
              <Text style={s.inputIcon}>🔒</Text>
              <TextInput
                style={[s.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor="#bbb"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                <Text style={s.eyeTxt}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[s.btnPrimary, (!canSubmit || isLoading) && s.btnDisabled]}
            onPress={handleLogin}
            disabled={!canSubmit || isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.btnPrimaryTxt}>Нэвтрэх</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={s.orRow}>
            <View style={s.orLine} />
            <Text style={s.orTxt}>эсвэл</Text>
            <View style={s.orLine} />
          </View>

          {/* Register link */}
          <View style={s.signupRow}>
            <Text style={s.signupTxt}>Гишүүн биш үү? </Text>
            <TouchableOpacity onPress={() => onNavigate('register')}>
              <Text style={s.signupLink}>Бүртгүүлэх →</Text>
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
  content: { paddingBottom: 32 },

  closeBtn: { padding: 16 },
  closeTxt: { fontSize: 22, color: '#555' },

  logoArea: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingBottom: 28,
  },
  logoBubble: {
    width: 72,
    height: 72,
    backgroundColor: Colors.primary,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  logoName: {
    fontSize: 38,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: -1,
  },
  logoAccent: { color: Colors.yellow ?? '#FFD700' },
  subtitle: { fontSize: 13, color: '#888', marginTop: 2, fontWeight: '500' },

  card: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a2e',
    marginBottom: 20,
  },

  errorBox: {
    backgroundColor: '#fff0f0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#ff4444',
  },
  errorTxt: { color: '#cc0000', fontSize: 13, fontWeight: '600' },

  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: '#444', marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e8e8f0',
    borderRadius: 14,
    backgroundColor: '#fafafe',
    paddingHorizontal: 12,
  },
  inputIcon: { fontSize: 16, marginRight: 8 },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: '#1a1a2e',
  },
  eyeBtn: { padding: 4 },
  eyeTxt: { fontSize: 16 },

  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  btnDisabled: { backgroundColor: '#b0bdf8', shadowOpacity: 0 },
  btnPrimaryTxt: { fontSize: 16, fontWeight: '800', color: '#fff' },

  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 20,
  },
  orLine: { flex: 1, height: 1, backgroundColor: '#eee' },
  orTxt: { fontSize: 12, color: '#bbb', fontWeight: '600' },

  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupTxt: { fontSize: 14, color: '#888' },
  signupLink: { fontSize: 14, color: Colors.primary, fontWeight: '800' },
});
