import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/UI';
import { COLORS, APP_NAME, APP_TAGLINE } from '../constants/config';

export default function LoginScreen() {
  const { login, setFirstPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [firstLoginState, setFirstLoginState] = useState(null); // { userId, name }
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!email.trim()) return setError('Please enter your email');

    setLoading(true);
    try {
      const result = await login(email.trim().toLowerCase(), password);
      if (result.firstLogin) {
        setFirstLoginState({ userId: result.userId, name: result.name });
      }
      // If not firstLogin, AuthContext updates user → App navigates automatically
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async () => {
    setError('');
    if (!newPassword || newPassword.length < 6) {
      return setError('Password must be at least 6 characters');
    }
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match');
    }
    setLoading(true);
    try {
      await setFirstPassword(firstLoginState.userId, newPassword);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoWrap}>
              <Text style={styles.logoIcon}>🎓</Text>
            </View>
            <Text style={styles.appName}>{APP_NAME}</Text>
            <Text style={styles.tagline}>{APP_TAGLINE}</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {!firstLoginState ? (
              <>
                <Text style={styles.cardTitle}>Welcome Back</Text>
                <Text style={styles.cardSubtitle}>Sign in to your account</Text>

                <Input
                  label="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@university.edu"
                  keyboardType="email-address"
                />
                <Input
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry={!showPass}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                      <Text style={styles.showHide}>{showPass ? 'Hide' : 'Show'}</Text>
                    </TouchableOpacity>
                  }
                />

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Button
                  title="Sign In"
                  onPress={handleLogin}
                  loading={loading}
                  style={styles.loginBtn}
                />

                <Text style={styles.hint}>
                  First time? Enter your email and leave{'\n'}the password blank to set it up.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.cardTitle}>👋 Hello, {firstLoginState.name}!</Text>
                <Text style={styles.cardSubtitle}>
                  This is your first login. Please create a secure password.
                </Text>

                <Input
                  label="New Password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="At least 6 characters"
                  secureTextEntry
                />
                <Input
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repeat your password"
                  secureTextEntry
                />

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Button
                  title="Set Password & Continue"
                  onPress={handleSetPassword}
                  loading={loading}
                  style={styles.loginBtn}
                />

                <TouchableOpacity onPress={() => { setFirstLoginState(null); setError(''); }}>
                  <Text style={styles.backLink}>← Back to login</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
  kav: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  logoWrap: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  logoIcon: { fontSize: 40 },
  appName: { fontSize: 32, fontWeight: '800', color: COLORS.white, letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 24, lineHeight: 20 },
  loginBtn: { marginTop: 8 },
  error: {
    color: COLORS.danger, fontSize: 13, marginBottom: 12,
    backgroundColor: COLORS.dangerLight, padding: 10, borderRadius: 8,
  },
  showHide: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  hint: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginTop: 16, lineHeight: 18 },
  backLink: { fontSize: 14, color: COLORS.primary, textAlign: 'center', marginTop: 16, fontWeight: '600' },
});
