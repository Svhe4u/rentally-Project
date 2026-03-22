import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import HomeScreen    from './app/HomeScreen';
import LoginScreen   from './app/LoginScreen';
import MapScreen     from './app/MapScreen';
import ProfileScreen from './app/ProfileScreen';
import ListingDetailScreen from './app/ListingDetailScreen';
import { TabName } from './components/BottomNav';

type Screen = 'home' | 'login' | 'map' | 'profile';

export default function App() {
  const [screen, setScreen]   = useState<Screen>('home');
  const [detailId, setDetailId] = useState<number | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const openDetail = (id: number) => {
    setDetailId(id);
    setDetailVisible(true);
  };
  const closeDetail = () => setDetailVisible(false);

  const navigate = (tab: TabName) => {
    if (tab === 'home' || tab === 'map' || tab === 'profile') {
      setScreen(tab as Screen);
    }
  };

  const renderScreen = () => {
    switch (screen) {
      case 'login':   return <LoginScreen   onNavigate={navigate} />;
      case 'map':     return <MapScreen     onNavigate={navigate} onOpenDetail={openDetail} />;
      case 'profile': return <ProfileScreen onNavigate={navigate} />;
      default:        return <HomeScreen    onNavigate={navigate} />;
    }
  };

  return (
    <View style={s.root}>
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

const s = StyleSheet.create({
  root: { flex: 1 },
});
