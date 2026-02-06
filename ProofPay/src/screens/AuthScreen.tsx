import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Button from "../components/Button";
import Input from "../components/Input";
import { colors } from "../theme/colors";
import { supabase } from "../lib/supabase";

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    setLoading(true);
    setError(null);
    const action = isSignUp
      ? supabase.auth.signUp({ email, password })
      : supabase.auth.signInWithPassword({ email, password });
    const { error: authError } = await action;
    if (authError) {
      setError(authError.message);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ProofPay</Text>
      <Text style={styles.subtitle}>Invoice & payment proof generator</Text>

      <View style={styles.form}>
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          label={loading ? "Please wait..." : isSignUp ? "Create account" : "Sign in"}
          onPress={handleAuth}
          disabled={!email || !password || loading}
        />
        <Button
          label={isSignUp ? "Already have an account" : "Create a free account"}
          onPress={() => setIsSignUp((value) => !value)}
          variant="secondary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    color: colors.textMuted,
    marginBottom: 32,
  },
  form: {
    gap: 12,
  },
  error: {
    color: colors.danger,
    marginBottom: 6,
  },
});
