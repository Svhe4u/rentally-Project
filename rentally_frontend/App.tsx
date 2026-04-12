import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

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

import { AuthProvider, useAuth } from './context/AuthContext';

type Screen = 'home' | 'saved' | 'map' | 'messages' | 'chat' | 'profile' | 'login' | 'register' | 'notifications' | 'editProfile' | 'security' | 'help' | 'about';

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const [screen, setScreen] = useState<Screen>('register'); // Start on register

  // Auto-redirect after auth state loads
  React.useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        if (screen === 'login' || screen === 'register') {
          setScreen('home');
        }
      } else {
        // Not authenticated
        if (screen !== 'login' && screen !== 'register') {
          setScreen('login');
        }
      }
    }
  }, [isAuthenticated, isLoading, screen]);

  const [detailId, setDetailId]           = useState<number | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [chatParams, setChatParams] = useState<{
    senderId: number; receiverId: number; listingId?: number; receiverName: string;
  } | null>(null);

  const openDetail = (id: number) => { setDetailId(id); setDetailVisible(true); };
  const closeDetail = () => setDetailVisible(false);

  const navigate = (tab: string, params?: any) => {
    if (tab === 'chat') {
      setChatParams(params ?? { senderId: 1, receiverId: 2, receiverName: 'Зуучлагч' });
      setScreen('chat');
      return;
    }
    setScreen(tab as Screen);
  };

  const renderScreen = () => {
    // Top-level Auth Guard: Force login if not authenticated and trying to access private screens
    if (!isAuthenticated && screen !== 'login' && screen !== 'register') {
      return <LoginScreen onNavigate={navigate} />;
    }

    switch (screen) {
      case 'login':     return <LoginScreen      onNavigate={navigate} />;
      case 'register':  return <RegisterScreen   onNavigate={navigate} />;
      case 'saved':     return <SavedScreen      onNavigate={navigate} onOpenDetail={openDetail} />;
      case 'map':       return <MapScreen        onNavigate={navigate} onOpenDetail={openDetail} />;
      case 'messages':  return <MessagesScreen   onNavigate={navigate} />;
      case 'chat':      return chatParams ? (
        <ChatScreen
          senderId={chatParams.senderId}
          receiverId={chatParams.receiverId}
          listingId={chatParams.listingId}
          receiverName={chatParams.receiverName}
          onNavigate={(s: string) => { if (s === 'home') setScreen('home'); }}
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
      {renderScreen()}

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
  root: { flex: 1 },
});
