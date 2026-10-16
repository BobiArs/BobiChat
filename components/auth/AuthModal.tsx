import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import {
  Lock,
  LogIn,
  Mail,
  Sparkles,
  User,
  UserPlus,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { AuthService } from "@/services/authService";
import { makeRedirectUri } from "expo-auth-session";
import GoogleIcon from "../common/GoogleIcon";

WebBrowser.maybeCompleteAuthSession();

interface AuthModalProps {
  visible: boolean;
  onSuccess: () => void;
}

export default function AuthModal({ visible, onSuccess }: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Отримуємо redirectUri для Google Auth
  const redirectUri = makeRedirectUri();

  console.log("EXPO REDIRECT URI (PROXY):", redirectUri);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId:
      "271564893162-u4c9enr9bpf6nkgcuajrmooo605a6ns5.apps.googleusercontent.com",
    webClientId:
      "271564893162-opa9o0q8396hir64dp7liaujsnqpenav.apps.googleusercontent.com",
    redirectUri,
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      fetchGoogleUserInfo(authentication?.accessToken);
    }
  }, [response]);

  const fetchGoogleUserInfo = async (token?: string) => {
    if (!token) return;
    try {
      setIsLoading(true);
      const res = await fetch("https://www.googleapis.com/userinfo/v2/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const googleUser = await res.json();

      const result = await AuthService.login(
        googleUser.email,
        "123456",
        "google",
        googleUser.name || googleUser.given_name || "Гугл Користувач",
      );

      setIsLoading(false);
      if (result.success) {
        onSuccess();
      } else {
        setErrorMsg(result.error || "Не вдалося увійти через Google");
      }
    } catch (e) {
      console.error("Google Auth Error:", e);
      setIsLoading(false);
      setErrorMsg("Помилка підключення до Google Сервісу");
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    if (request) {
      promptAsync();
    } else {
      setIsLoading(true);
      const result = await AuthService.login(
        "google.user@gmail.com",
        "123456",
        "google",
        "Гугл Користувач",
      );
      setIsLoading(false);
      if (result.success) {
        onSuccess();
      } else {
        setErrorMsg(result.error || "Помилка входу через Google");
      }
    }
  };

  const handleSubmit = async () => {
    setErrorMsg("");
    const cleanEmail = email.trim();
    const cleanPass = password.trim();
    const cleanName = username.trim();

    if (!cleanEmail || !cleanPass) {
      setErrorMsg("Будь ласка, заповніть email та пароль");
      return;
    }

    if (isRegister && !cleanName) {
      setErrorMsg("Будь ласка, вкажіть ваш нікнейм");
      return;
    }

    setIsLoading(true);
    let result;
    if (isRegister) {
      result = await AuthService.register(
        cleanName,
        cleanEmail,
        cleanPass,
        "email",
      );
    } else {
      result = await AuthService.login(cleanEmail, cleanPass, "email");
    }

    setIsLoading(false);
    if (result.success) {
      setEmail("");
      setPassword("");
      setUsername("");
      onSuccess();
    } else {
      setErrorMsg(result.error || "Помилка авторизації");
    }
  };

  if (!visible) return null;

  return (
    <Modal animationType="fade" transparent={false} visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-[#1E1A17] justify-center px-6"
      >
        <View className="items-center mb-8">
          <View className="w-20 h-20 rounded-3xl bg-[#E89D43] items-center justify-center mb-3 border-2 border-[#3A322C] shadow-lg">
            <Text className="text-[#1E1A17] font-black text-4xl">B</Text>
          </View>
          <Text className="text-[#F4EAE1] text-2xl font-bold tracking-wide text-center">
            {isRegister ? "Створити новий акаунт" : "Вітаємо у Bobi Chat"}
          </Text>
          <View className="flex-row items-center mt-2 bg-[#2A2420] px-3 py-1 rounded-full border border-[#3A322C]">
            <Sparkles size={12} color="#E89D43" />
            <Text className="text-[#A6988B] text-xs font-semibold ml-1.5">
              Pure Firebase Auth • 1080p 60FPS
            </Text>
          </View>
        </View>

        {errorMsg ? (
          <View className="bg-red-500/15 border border-red-500/40 p-3.5 rounded-2xl mb-4">
            <Text className="text-red-400 text-xs font-semibold text-center">
              {errorMsg}
            </Text>
          </View>
        ) : null}

        <View className="space-y-3.5 mb-6">
          {isRegister && (
            <View className="bg-[#2A2420] border border-[#3A322C] rounded-2xl px-4 py-3.5 flex-row items-center">
              <User size={18} color="#A6988B" className="mr-3" />
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Ваше ім'я / Нікнейм"
                placeholderTextColor="#A6988B"
                autoCapitalize="words"
                autoCorrect={false}
                className="flex-1 text-[#F4EAE1] text-sm font-medium"
              />
            </View>
          )}

          <View className="bg-[#2A2420] border border-[#3A322C] rounded-2xl px-4 py-3.5 flex-row items-center">
            <Mail size={18} color="#A6988B" className="mr-3" />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Google Email адреса"
              placeholderTextColor="#A6988B"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              className="flex-1 text-[#F4EAE1] text-sm font-medium"
            />
          </View>

          <View className="bg-[#2A2420] border border-[#3A322C] rounded-2xl px-4 py-3.5 flex-row items-center">
            <Lock size={18} color="#A6988B" className="mr-3" />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Пароль"
              placeholderTextColor="#A6988B"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              className="flex-1 text-[#F4EAE1] text-sm font-medium"
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.8}
          className="bg-[#E89D43] py-4 rounded-2xl flex-row items-center justify-center mb-4 active:opacity-90"
        >
          {isLoading ? (
            <ActivityIndicator color="#1E1A17" />
          ) : (
            <>
              {isRegister ? (
                <UserPlus size={18} color="#1E1A17" className="mr-2" />
              ) : (
                <LogIn size={18} color="#1E1A17" className="mr-2" />
              )}
              <Text className="text-[#1E1A17] font-bold text-base">
                {isRegister
                  ? "Зареєструватися у Firebase"
                  : "Увійти через Firebase"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View className="flex-row items-center my-2">
          <View className="flex-1 h-[1px] bg-[#3A322C]" />
          <Text className="text-[#A6988B] text-xs font-semibold mx-3">або</Text>
          <View className="flex-1 h-[1px] bg-[#3A322C]" />
        </View>

        <TouchableOpacity
          onPress={handleGoogleLogin}
          disabled={isLoading}
          activeOpacity={0.8}
          className="bg-[#2A2420] border border-[#3A322C] py-3.5 rounded-2xl flex-row items-center justify-center mb-6 active:bg-[#3A322C]"
        >
          <GoogleIcon size={20} />
          <Text className="text-[#F4EAE1] font-semibold text-sm ml-3">
            Продовжити через Google
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setIsRegister(!isRegister);
            setErrorMsg("");
          }}
          className="py-2"
        >
          <Text className="text-[#A6988B] text-xs text-center">
            {isRegister ? "Вже є створений акаунт? " : "Вперше у Bobi Chat? "}
            <Text className="text-[#E89D43] font-bold">
              {isRegister ? "Увійти" : "Зареєстраватися"}
            </Text>
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}
