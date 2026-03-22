import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Colors } from '../constants/colors';
import { TabName } from '../components/BottomNav';

interface Props {
  onNavigate: (tab: TabName) => void;
}

export default function LoginScreen({ onNavigate }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Close button */}
        <TouchableOpacity style={styles.closeBtn} onPress={() => onNavigate('home')}>
          <Text style={styles.closeTxt}>✕</Text>
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoBubble}>
            <Text style={styles.logoBubbleIcon}>🏠</Text>
          </View>
          <Text style={styles.logoName}>
            БАЙ<Text style={styles.logoAccent}>Р</Text>
          </Text>
        </View>

        {/* Tagline */}
        <Text style={styles.tagline}>
          Нэвтэрч орж,{'\n'}
          <Text style={styles.taglineBold}>
            Байртай холбогдох аяллаа эхлүүлэ!
          </Text>
        </Text>

        {/* Buttons */}
        <View style={styles.btnGroup}>
          <TouchableOpacity
            style={[styles.btn, styles.btnKakao]}
            onPress={() => onNavigate('home')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnKakaoTxt}>💬  Какао-гоор нэвтрэх</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnApple]}
            onPress={() => onNavigate('home')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnAppleTxt}>🍎  Apple-ээр үргэлжлүүлэх</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnEmail]}
            onPress={() => onNavigate('home')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnEmailTxt}>@  Имэйлээр нэвтрэх</Text>
          </TouchableOpacity>
        </View>

        {/* OR divider */}
        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orTxt}>эсвэл</Text>
          <View style={styles.orLine} />
        </View>

        {/* Facebook */}
        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.btnFb} activeOpacity={0.85}>
            <Text style={styles.btnFbTxt}>f</Text>
          </TouchableOpacity>
        </View>

        {/* Sign up */}
        <View style={styles.signupRow}>
          <Text style={styles.signupTxt}>Гишүүн биш үү? </Text>
          <TouchableOpacity>
            <Text style={styles.signupLink}>Бүртгүүлэх</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scroll: { flex: 1 },
  content: { paddingBottom: 32 },

  closeBtn: {
    padding: 14,
    paddingLeft: 18,
  },
  closeTxt: {
    fontSize: 22,
    color: '#333',
  },

  logoArea: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingBottom: 28,
  },
  logoBubble: {
    width: 64,
    height: 64,
    backgroundColor: Colors.primary,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  logoBubbleIcon: { fontSize: 34 },
  logoName: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: -1,
  },
  logoAccent: { color: Colors.yellow },

  tagline: {
    textAlign: 'center',
    fontSize: 17,
    color: '#222',
    lineHeight: 28,
    fontWeight: '600',
    paddingHorizontal: 32,
    marginBottom: 32,
  },
  taglineBold: { fontWeight: '800' },

  btnGroup: {
    paddingHorizontal: 22,
    gap: 11,
  },
  btn: {
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnKakao: { backgroundColor: Colors.kakao },
  btnKakaoTxt: { fontSize: 15, fontWeight: '700', color: '#191919' },

  btnApple: { backgroundColor: Colors.black },
  btnAppleTxt: { fontSize: 15, fontWeight: '700', color: Colors.white },

  btnEmail: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: '#ddd',
  },
  btnEmailTxt: { fontSize: 15, fontWeight: '600', color: '#333' },

  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 22,
    marginTop: 20,
  },
  orLine: { flex: 1, height: 1, backgroundColor: '#e0e0e0' },
  orTxt: { fontSize: 12, color: '#bbb', fontWeight: '600' },

  socialRow: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  btnFb: {
    width: 50,
    height: 50,
    backgroundColor: Colors.facebook,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnFbTxt: { color: Colors.white, fontSize: 20, fontWeight: '900' },

  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupTxt: { fontSize: 13, color: Colors.textLight },
  signupLink: { fontSize: 13, color: Colors.primary, fontWeight: '700' },
});
