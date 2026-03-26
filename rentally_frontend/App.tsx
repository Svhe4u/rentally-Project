import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import HomeScreen      from './app/HomeScreen';
import SavedScreen     from './app/SavedScreen';
import MapScreen       from './app/MapScreen';
import MessagesScreen  from './app/MessagesScreen';
import ChatScreen      from './app/ChatScreen';
import ProfileScreen   from './app/ProfileScreen';
import LoginScreen     from './app/LoginScreen';
import ListingDetailScreen from './app/ListingDetailScreen';
import { TabName } from './components/BottomNav';

type Screen = 'home' | 'saved' | 'map' | 'messages' | 'chat' | 'profile' | 'login';

export default function App() {
  const [screen, setScreen]       = useState<Screen>('home');
  const [detailId, setDetailId]   = useState<number | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  // Chat params
  const [chatParams, setChatParams] = useState<{
    senderId: number; receiverId: number; listingId?: number; receiverName: string;
  } | null>(null);

  const openDetail = (id: number) => {
    setDetailId(id);
    setDetailVisible(true);
  };
  const closeDetail = () => setDetailVisible(false);

  const navigate = (tab: TabName | 'chat', params?: any) => {
    if (tab === 'login') {
      setScreen('login');
      return;
    }
    if (tab === 'chat') {
      setChatParams(params ?? { senderId: 1, receiverId: 2, receiverName: 'Зуучлагч' });
      setScreen('chat');
      return;
    }
    setScreen(tab as Screen);
  };

  const renderScreen = () => {
    switch (screen) {
      case 'saved':   return <SavedScreen     onNavigate={navigate} onOpenDetail={openDetail} />;
      case 'map':     return <MapScreen       onNavigate={navigate} onOpenDetail={openDetail} />;
      case 'messages':return <MessagesScreen  onNavigate={navigate} />;
      case 'chat':    return chatParams ? (
        <ChatScreen
          senderId={chatParams.senderId}
          receiverId={chatParams.receiverId}
          listingId={chatParams.listingId}
          receiverName={chatParams.receiverName}
          onNavigate={(s: string) => {
            if (s === 'home') setScreen('home');
          }}
        />
      ) : null;
      case 'profile': return <ProfileScreen  onNavigate={navigate} />;
      case 'login':   return <LoginScreen    onNavigate={navigate} />;
      default:        return <HomeScreen      onNavigate={navigate} onOpenDetail={openDetail} />;
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="auto" />
      {renderScreen()}

      {/* Detail slides in from right over everything */}
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
