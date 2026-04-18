import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, ActivityIndicator, Alert, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { AuthAPI } from '../services/api';

interface Props {
  onNavigate: (screen: string) => void;
}

export default function SecurityScreen({ onNavigate }: Props) {
  const { user } = useAuth();
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const canSubmit = oldPass.length > 0 && newPass.length >= 8 && newPass === confirm;

  const handleUpdatePassword = async () => {
    try {
      await AuthAPI.changePassword(oldPass, newPass, confirm);
      Alert.alert('Амжилттай', 'Нууц үг амжилттай шинэчлэгдлээ.', [
        { text: 'OK', onPress: () => onNavigate('profile') }
      ]);
    } catch (e: any) {
      Alert.alert('Алдаа', e.message || 'Нууц үг солиход алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => onNavigate('profile')} style={s.topBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Аюулгүй байдал</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.infoCard}>
          <View style={s.infoIcon}>
            <Ionicons name="shield-checkmark" size={32} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.infoTitle}>Нууц үг солих</Text>
            <Text style={s.infoSub}>Шинэ нууц үг нь хамгийн багадаа 8 тэмдэгтээс бүрдэх ёстой.</Text>
          </View>
        </View>

        <View style={s.card}>
          <View style={s.group}>
            <Text style={s.label}>Одоогийн нууц үг</Text>
            <View style={s.inputWrap}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textLight} />
              <TextInput
                style={s.input}
                value={oldPass}
                onChangeText={setOldPass}
                secureTextEntry={!showPass}
                placeholder="••••••••"
                placeholderTextColor={Colors.textLight}
              />
            </View>
          </View>

          <View style={s.group}>
            <Text style={s.label}>Шинэ нууц үг</Text>
            <View style={s.inputWrap}>
              <Ionicons name="key-outline" size={20} color={Colors.textLight} />
              <TextInput
                style={s.input}
                value={newPass}
                onChangeText={setNewPass}
                secureTextEntry={!showPass}
                placeholder="••••••••"
                placeholderTextColor={Colors.textLight}
              />
            </View>
          </View>

          <View style={s.group}>
            <Text style={s.label}>Шинэ нууц үг давтах</Text>
            <View style={[s.inputWrap, newPass !== confirm && confirm.length > 0 && s.inputErr]}>
              <Ionicons name="checkmark-circle-outline" size={20} color={Colors.textLight} />
              <TextInput
                style={s.input}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry={!showPass}
                placeholder="••••••••"
                placeholderTextColor={Colors.textLight}
              />
            </View>
            {newPass !== confirm && confirm.length > 0 && (
              <Text style={s.errTxt}>Нууц үг таарахгүй байна</Text>
            )}
          </View>

          <TouchableOpacity style={s.showRow} onPress={() => setShowPass(!showPass)}>
            <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.primary} />
            <Text style={s.showTxt}>{showPass ? 'Нууц үг нуух' : 'Нууц үг харах'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[s.btn, (!canSubmit || loading) && s.btnOff]}
          onPress={handleUpdatePassword}
          disabled={!canSubmit || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.btnTxt}>Нууц үг шинэчлэх</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  content: { padding: 20 },
  
  infoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: Colors.white,
    borderRadius: 24, padding: 20, marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10 },
      android: { elevation: 2 },
    }),
  },
  infoIcon: {
    width: 60, height: 60, borderRadius: 20, backgroundColor: Colors.primary + '10',
    alignItems: 'center', justifyContent: 'center',
  },
  infoTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  infoSub: { fontSize: 13, color: Colors.textMuted, marginTop: 4, lineHeight: 18 },
  
  card: { 
    backgroundColor: Colors.white, borderRadius: 24, padding: 20, gap: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10 },
      android: { elevation: 2 },
    }),
  },
  group: { gap: 8 },
  label: { fontSize: 12, fontWeight: 'bold', color: Colors.textLight, textTransform: 'uppercase', letterSpacing: 1, marginLeft: 4 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg,
    borderRadius: 14, paddingHorizontal: 14, gap: 10,
  },
  inputErr: { borderColor: Colors.red, borderWidth: 1 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: Colors.text, fontWeight: '600' },
  errTxt: { fontSize: 11, color: Colors.red, marginLeft: 4 },
  
  showRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  showTxt: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  
  btn: {
    backgroundColor: Colors.primary, borderRadius: 24, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center', marginTop: 30,
  },
  btnOff: { opacity: 0.6 },
  btnTxt: { fontSize: 16, fontWeight: 'bold', color: '#fff', letterSpacing: 0.5 },
});
