import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, ActivityIndicator, Alert,
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
      
      // Update global auth state with returned user data
      // UserAPI.update returns the serialized profile which has username and email
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
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => onNavigate('profile')} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Профайл засах</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {/* Avatar Section */}
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

        {/* Form */}
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

        {/* Save Button */}
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
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  content: { padding: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 30 },
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
  card: { backgroundColor: Colors.white, borderRadius: 24, padding: 20, gap: 20 },
  group: { gap: 8 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, marginLeft: 4 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg,
    borderRadius: 14, paddingHorizontal: 14, gap: 10,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: Colors.text },
  saveBtn: {
    backgroundColor: Colors.primary, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginTop: 30,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 15, elevation: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnTxt: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
