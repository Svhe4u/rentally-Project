import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './app/HomeScreen';
import LoginScreen from './app/LoginScreen';
import MapScreen from './app/MapScreen';
import ProfileScreen from './app/ProfileScreen';
import ListingDetailScreen from './app/ListingDetailScreen';
import { TabName } from './components/BottomNav';

type Screen = 'home' | 'login' | 'map' | 'profile' | 'detail';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [detailId, setDetailId] = useState<number | null>(null);

  const navigate = (tab: TabName) => {
    if (tab === 'home')    setScreen('home');
    else if (tab === 'map')     setScreen('map');
    else if (tab === 'profile') setScreen('profile');
    else if (tab === 'saved')   setScreen('home'); // TODO: saved screen
    else if (tab === 'community') setScreen('home'); // TODO: community
  };

  const openDetail = (id: number) => {
    setDetailId(id);
    setScreen('detail');
  };

  const goBack = () => {
    // Return to wherever we came from (map if detailId was set via map)
    setScreen(detailId ? 'map' : 'home');
  };

  if (screen === 'detail' && detailId !== null) {
    return (
      <>
        <StatusBar style="light" />
        <ListingDetailScreen
          listingId={detailId}
          onBack={goBack}
          onNavigate={navigate}
        />
      </>
    );
  }

  if (screen === 'map') {
    return (
      <>
        <StatusBar style="dark" />
        <MapScreen onNavigate={navigate} onOpenDetail={openDetail} />
      </>
    );
  }

  if (screen === 'login') {
    return <LoginScreen onNavigate={navigate} />;
  }

  if (screen === 'profile') {
    return <ProfileScreen onNavigate={navigate} />;
  }

  // Default: home
  return (
    <>
      <StatusBar style="dark" />
      <HomeScreen onNavigate={navigate} />
    </>
  );
}
