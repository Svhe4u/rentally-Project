import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, Alert } from 'react-native';
import HomeScreen from './app/HomeScreen';
import LoginScreen from './app/LoginScreen';
// import SignUpScreen from './app/SignUpScreen';
import MapScreen from './app/MapScreen';


export default function App() {
  const [currentScreen, setCurrentScreen] = useState('app');

  if (currentScreen === 'home') {
    return <HomeScreen onNavigate={(tab) => console.log('Navigate to:', tab)} />;
  }

  if (currentScreen === 'login') {
    return <LoginScreen onNavigate={(tab) => console.log('Navigate to:', tab)} />;
  }

  if (currentScreen === 'signup') {
    return <SignUpScreen onNavigate={(tab) => console.log('Navigate to:', tab)} />;
  }

  if (currentScreen === 'map') {
    return <MapScreen onNavigate={(tab) => console.log('Navigate to:', tab)} />;
  } 

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Rentally</Text>
      
      <View style={styles.buttonGroup}>
        <Button 
          title="Go to Home Screen" 
          onPress={() => setCurrentScreen('home')} 
          color="#0066cc" 
        />
      </View>

      <View style={styles.buttonGroup}>
        <Button 
          title="Login" 
          onPress={() => setCurrentScreen('login')} 
          color="#33cc33" 
        />
      </View>

      <View style={styles.buttonGroup}>
        <Button 
          title="Sign Up" 
          onPress={() => setCurrentScreen('signup')} 
          color="#ff9900" 
        />
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  buttonGroup: {
    width: '80%',
    marginVertical: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
