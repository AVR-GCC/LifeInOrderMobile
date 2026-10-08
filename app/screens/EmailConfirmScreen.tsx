import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MailCheck from '@expo/vector-icons/Feather'; // Using Feather/Lucide vector icons
import { useSession } from '../context/AuthContext';
import { COLORS } from '../constants/theme';

const OTP_VALIDITY_SECONDS = 600; // 10 minutes
const RESEND_COOLDOWN_SECONDS = 60;

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function ConfirmEmail() {
  const { confirmEmail, signUp } = useSession();
  const { email, password } = useLocalSearchParams<{ email: string, password: string }>();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [validityLeft, setValidityLeft] = useState(OTP_VALIDITY_SECONDS);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  const router = useRouter();

  useEffect(() => {
    const t = setInterval(() => {
      setValidityLeft((v) => Math.max(0, v - 1));
      setCooldownLeft((v) => Math.max(0, v - 1));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const expired = validityLeft === 0;

  const handleVerify = async () => {
    if (expired || otp.length < 6) return;
    setLoading(true);

    try {
      const otpNum = parseInt(otp, 10);
      await confirmEmail(email, otpNum);
    } catch (err) {
      Alert.alert(
        'Verification failed',
        err instanceof Error ? err.message : 'Invalid or expired code'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await signUp(email, password);
      setValidityLeft(OTP_VALIDITY_SECONDS);
      setCooldownLeft(RESEND_COOLDOWN_SECONDS);
      setOtp('');
      Alert.alert('Code resent', `A new code was sent to ${email}.`);
    } catch (err) {
      Alert.alert(
        'Couldn\'t resend code',
        err instanceof Error ? err.message : 'Something went wrong'
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <MailCheck name='mail' size={24} color='#2563eb' />
              </View>
              <Text style={styles.title}>Confirm your email</Text>
              <Text style={styles.subtitle}>
                We sent a 6-digit code to{' '}
                <Text style={styles.emailText}>{email}</Text>. Enter it below to
                activate your account.
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirmation code</Text>
                <TextInput
                  style={styles.input}
                  keyboardType='number-pad'
                  textContentType='oneTimeCode'
                  maxLength={6}
                  value={otp}
                  onChangeText={(text) => setOtp(text.replace(/\D/g, ''))}
                  placeholder='123456'
                  placeholderTextColor='#9ca3af'
                />
              </View>

              <Text
                style={[
                  styles.timerText,
                  expired ? styles.expiredText : styles.validText,
                ]}
              >
                {expired
                  ? 'This code has expired — request a new one below.'
                  : `Code valid for ${formatTime(validityLeft)}`}
              </Text>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.primaryButton,
                  (loading || expired || otp.length < 6) && styles.disabledButton,
                ]}
                onPress={handleVerify}
                disabled={loading || expired || otp.length < 6}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color='#ffffff' size='small' />
                ) : (
                  <Text style={styles.primaryButtonText}>Confirm email</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.outlineButton,
                  (resendLoading || cooldownLeft > 0) && styles.disabledButton,
                ]}
                onPress={handleResend}
                disabled={resendLoading || cooldownLeft > 0}
                activeOpacity={0.8}
              >
                {resendLoading ? (
                  <ActivityIndicator color='#1f2937' size='small' />
                ) : (
                  <Text style={styles.outlineButtonText}>
                    {cooldownLeft > 0
                      ? `Resend code in ${cooldownLeft}s`
                      : 'Resend code'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.ghostButton]}
                onPress={() => router.replace('/auth')}
                activeOpacity={0.8}
              >
                <Text style={styles.ghostButtonText}>Back to sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 24,
    gap: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  emailText: {
    color: COLORS.muted,
    fontWeight: '500',
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.muted,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 20,
    textAlign: 'center',
    letterSpacing: 8,
    color: COLORS.text,
    backgroundColor: COLORS.surface2,
  },
  timerText: {
    fontSize: 14,
    textAlign: 'center',
  },
  expiredText: {
    color: '#ef4444',
  },
  validText: {
    color: '#6b7280',
  },
  actions: {
    gap: 8,
  },
  button: {
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  primaryButton: {
    backgroundColor: COLORS.colorTwo,
  },
  primaryButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  outlineButtonText: {
    color: COLORS.colorTwo,
    fontSize: 14,
    fontWeight: '500',
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  ghostButtonText: {
    color: COLORS.colorThree,
    fontSize: 14,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
