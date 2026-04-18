import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, ActivityIndicator, Alert, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { UserAPI } from '../services/api';

interface Props {
  onNavigate: (screen: string) => void;
}

export default function EditProfileScreen({ onNavigate }: Props) {
  const { user, updateUser } = useAuth(); 
  const [name, setName]     = useState(user?.username || '');
  const [email, setEmail]   = useState(user?.email || '');
  const [phone, setPhone]   = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res: any = await UserAPI.update({
        username: name,
        email,
        phone,
      });
      
      await updateUser({
        username: res.username || name,
        email: res.email || email,
        phone: res.phone || phone,
      });
      
      Alert.alert('Амжилттай', 'Профайлын мэдээлэл шинэчлэгдлээ.');
    } catch (e: any) {
      Alert.alert('Алдаа', e.message || 'Шинэчлэхэд алдаа гарлаа');
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
        <Text style={s.headerTitle}>Профайл засах</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.avatarSection}>
          <View style={s.avatarCircle}>
            <Ionicons name="person" size={48} color={Colors.primary} />
            <TouchableOpacity style={s.editBadge}>
              <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={s.userName}>{user?.username || 'Хэрэглэгч'}</Text>
          <Text style={s.userRole}>{user?.role === 'broker' ? 'Мэргэжлийн зуучлагч' : 'Хэрэглэгч'}</Text>
        </View>

        <View style={s.card}>
          <View style={s.group}>
            <Text style={s.label}>Хэрэглэгчийн нэр</Text>
            <View style={s.inputWrap}>
              <Ionicons name="person-outline" size={20} color={Colors.textLight} />
              <TextInput
                style={s.input}
                value={name}
                onChangeText={setName}
                placeholder="Таны нэр"
                placeholderTextColor={Colors.textLight}
              />
            </View>
          </View>

          <View style={s.group}>
            <Text style={s.label}>И-мэйл хаяг</Text>
            <View style={s.inputWrap}>
              <Ionicons name="mail-outline" size={20} color={Colors.textLight} />
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={s.group}>
            <Text style={s.label}>Утасны дугаар</Text>
            <View style={s.inputWrap}>
              <Ionicons name="call-outline" size={20} color={Colors.textLight} />
              <TextInput
                style={s.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[s.saveBtn, loading && s.saveBtnDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.saveBtnTxt}>Шинэчлэх</Text>
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
  avatarSection: { alignItems: 'center', marginBottom: 20 },
  avatarCircle: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.primary + '15',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: Colors.primary, width: 32, height: 32, borderRadius: 16,
    borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  userName: { fontSize: 18, fontWeight: '900', color: Colors.text },
  userRole: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  
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
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: Colors.text, fontWeight: '600' },
  
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: 24, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center', marginTop: 30,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnTxt: { fontSize: 16, fontWeight: 'bold', color: '#fff', letterSpacing: 0.5 },
});
