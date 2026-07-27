import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { api, setToken } from "@/lib/api";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError(null);
    try {
      const { token } = await api.login(email, password);
      await setToken(token);
      router.replace("/(tabs)/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 justify-center bg-white px-6">
      <Text className="mb-1 text-3xl font-bold text-black">GymFlow</Text>
      <Text className="mb-8 text-gray-500">Sign in to manage your gym</Text>

      <Text className="mb-1 text-xs font-medium text-gray-500">Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        className="mb-4 rounded-xl border border-gray-200 px-4 py-3"
      />

      <Text className="mb-1 text-xs font-medium text-gray-500">Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        className="mb-4 rounded-xl border border-gray-200 px-4 py-3"
      />

      {error && <Text className="mb-3 text-sm text-destructive">{error}</Text>}

      <Pressable
        onPress={handleLogin}
        disabled={loading}
        className="items-center rounded-xl bg-black py-3.5"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="font-semibold text-white">Sign in</Text>
        )}
      </Pressable>

      <Text className="mt-4 text-center text-xs text-gray-400">
        Seed login: iprasanth282002@gmail.com / demo1234
      </Text>
    </SafeAreaView>
  );
}
