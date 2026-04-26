import './global.css';
import React, { useState, useRef, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Animated, Easing } from 'react-native';

import HomeScreen          from './app/HomeScreen';
import SavedScreen         from './app/SavedScreen';
import MapScreen           from './app/MapScreen';
import MessagesScreen      from './app/MessagesScreen';
import ChatScreen          from './app/ChatScreen';
import ProfileScreen       from './app/ProfileScreen';
import LoginScreen         from './app/LoginScreen';
import RegisterScreen      from './app/RegisterScreen';
import ListingDetailScreen from './app/ListingDetailScreen';
import NotificationsScreen from './app/NotificationsScreen';
import EditProfileScreen  from './app/EditProfileScreen';
import SecurityScreen     from './app/SecurityScreen';
import HelpScreen         from './app/HelpScreen';
import AboutScreen        from './app/AboutScreen';
import SearchFilterScreen from './app/SearchFilterScreen';

import { AuthProvider, useAuth } from './context/AuthContext';

type Screen = 'home' | 'saved' | 'map' | 'messages' | 'chat' | 'profile' | 'login' | 'register' | 'notifications' | 'editProfile' | 'security' | 'help' | 'about' | 'search_filter';

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const [screen, setScreen] = useState<Screen>('register');
  const [prevScreen, setPrevScreen] = useState<Screen | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Auto-redirect after auth state loads
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        if (screen === 'login' || screen === 'register') {
          navigate('home');
        }
      } else {
        if (screen !== 'login' && screen !== 'register') {
          navigate('login');
        }
      }
    }
  }, [isAuthenticated, isLoading]);

  const [detailId, setDetailId]           = useState<number | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [chatParams, setChatParams] = useState<{
    senderId: number; receiverId: number; listingId?: number; receiverName: string;
  } | null>(null);
  const [mapParams, setMapParams] = useState<any>(null);

  const openDetail = (id: number) => { setDetailId(id); setDetailVisible(true); };
  const closeDetail = () => setDetailVisible(false);

  const navigate = (tab: string, params?: any) => {
    const nextScreen = tab as Screen;
    if (nextScreen === screen) return;

    // Start Transition
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease)
      }),
      Animated.timing(slideAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true
      })
    ]).start(() => {
       if (tab === 'chat') {
         setChatParams(params ?? { senderId: 1, receiverId: 2, receiverName: 'Зуучлагч' });
       }
       if (tab === 'map' || tab === 'search_filter') {
         setMapParams(params);
       }
       
       setPrevScreen(screen);
       setScreen(nextScreen);

       // Fade back in
       Animated.parallel([
         Animated.timing(fadeAnim, {
           toValue: 1,
           duration: 200,
           useNativeDriver: true,
           easing: Easing.in(Easing.ease)
         }),
         Animated.spring(slideAnim, {
           toValue: 0,
           useNativeDriver: true,
           tension: 50,
           friction: 8
         })
       ]).start();
    });
  };

  const renderScreen = () => {
    if (!isAuthenticated && screen !== 'login' && screen !== 'register') {
      return <LoginScreen onNavigate={navigate} />;
    }

    switch (screen) {
      case 'login':     return <LoginScreen      onNavigate={navigate} />;
      case 'register':  return <RegisterScreen   onNavigate={navigate} />;
      case 'saved':     return <SavedScreen      onNavigate={navigate} onOpenDetail={openDetail} />;
      case 'map':       return <MapScreen        onNavigate={navigate} onOpenDetail={openDetail} params={mapParams} />;
      case 'search_filter': return <SearchFilterScreen onNavigate={navigate} />;
      case 'messages':  return <MessagesScreen   onNavigate={navigate} />;
      case 'chat':      return chatParams ? (
        <ChatScreen
          senderId={chatParams.senderId}
          receiverId={chatParams.receiverId}
          listingId={chatParams.listingId}
          receiverName={chatParams.receiverName}
          onNavigate={(s: string) => navigate(s)}
        />
      ) : null;
      case 'profile':   return <ProfileScreen    onNavigate={navigate} />;
      case 'notifications': return <NotificationsScreen onNavigate={navigate} />;
      case 'editProfile': return <EditProfileScreen onNavigate={navigate} />;
      case 'security':    return <SecurityScreen    onNavigate={navigate} />;
      case 'help':        return <HelpScreen        onNavigate={navigate} />;
      case 'about':       return <AboutScreen       onNavigate={navigate} />;
      default:          return <HomeScreen       onNavigate={navigate} onOpenDetail={openDetail} />;
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="auto" />
      <Animated.View 
        className="flex-1"
        style={{ 
          flex: 1, 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
      >
        {renderScreen()}
      </Animated.View>

      <ListingDetailScreen
        visible={detailVisible}
        listingId={detailId}
        onClose={closeDetail}
        onNavigate={navigate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
});
