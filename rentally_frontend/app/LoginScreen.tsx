import React, { useState } from 'react';
import {
  View, Text, ScrollView, SafeAreaView,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { ChevronLeft, Home, User, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

interface Props {
  onNavigate: (screen: string) => void;
}

export default function LoginScreen({ onNavigate }: Props) {
  const { login, isLoading, error, clearError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const canSubmit = username.trim().length > 0 && password.length >= 6;

  const handleLogin = async () => {
    if (!canSubmit) return;
    setLocalError('');
    clearError();
    try {
      await login(username.trim(), password);
      onNavigate('home');
    } catch (e: any) {
      setLocalError(e.message || 'Нэвтрэхэд алдаа гарлаа');
    }
  };

  const displayError = localError || error;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-8"
        keyboardShouldPersistTaps="handled"
      >
        {/* Header/Close */}
        <View className="p-4">
          {/* <TouchableOpacity 
            className="w-10 h-10 items-center justify-center rounded-full bg-secondary" 
            onPress={() => onNavigate('home')}
          >
            <ChevronLeft size={24} className="text-foreground" />
          </TouchableOpacity> */}
        </View>

        {/* Logo Area */}
        <View className="items-center py-6 pb-10">
          <View className="w-20 h-20 bg-primary rounded-[28px] items-center justify-center shadow-lg shadow-primary/40 mb-4">
            <Home size={40} color="white" />
          </View>
          <Text className="text-4xl font-black text-primary tracking-tighter">
            РЕНТАЛ<Text className="text-amber-400">ЛИ</Text>
          </Text>
          <Text className="text-sm font-medium text-muted-foreground mt-1 uppercase tracking-widest">
            Орон сууцны платформ
          </Text>
        </View>

        {/* Form Card */}
        <View className="px-5">
          <Card className="border-none shadow-xl shadow-black/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-extrabold text-foreground">Нэвтрэх</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Error Box */}
              {displayError ? (
                <View className="flex-row items-center bg-destructive/10 border-l-4 border-destructive p-3 rounded-lg mb-4">
                  <AlertCircle size={18} className="text-destructive mr-2" />
                  <Text className="text-destructive text-xs font-bold flex-1">{displayError}</Text>
                </View>
              ) : null}

              {/* Username */}
              <Input
                label="Хэрэглэгчийн нэр"
                placeholder="username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                leftIcon={<User size={18} className="text-muted-foreground mr-2" />}
              />

              {/* Password */}
              <Input
                label="Нууц үг"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                leftIcon={<Lock size={18} className="text-muted-foreground mr-2" />}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} className="text-muted-foreground" /> : <Eye size={18} className="text-muted-foreground" />}
                  </TouchableOpacity>
                }
              />

              <View className="pt-4">
                <Button
                  label="Нэвтрэх"
                  onPress={handleLogin}
                  disabled={!canSubmit || isLoading}
                  loading={isLoading}
                  size="lg"
                  className="rounded-2xl"
                />
              </View>

              {/* Divider */}
              <View className="flex-row items-center my-4">
                <View className="flex-1 h-[1px] bg-border" />
                <Text className="mx-4 text-xs font-bold text-muted-foreground uppercase">эсвэл</Text>
                <View className="flex-1 h-[1px] bg-border" />
              </View>

              {/* Register Link */}
              <View className="flex-row justify-center items-center pb-2">
                <Text className="text-sm text-muted-foreground">Гишүүн биш үү? </Text>
                <TouchableOpacity onPress={() => onNavigate('register')}>
                  <Text className="text-sm font-bold text-primary">Бүртгүүлэх →</Text>
                </TouchableOpacity>
              </View>
            </CardContent>
          </Card>
        </View>

        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
