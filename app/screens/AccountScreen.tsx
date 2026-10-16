import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FocusEvent,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { Feather } from '@expo/vector-icons';
import Screen from '../components/Screen';
import { useSession } from '../context/AuthContext';
import { COLORS } from '../constants/theme';
import { useRouter } from 'expo-router';
import { tryCatchBlock } from '../utils/general';
import useKeyboardScroll from '../hooks/useKeyboardScroll';

interface AccountScreenProps {
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>
}

const AccountScreen = ({ changePassword }: AccountScreenProps) => {
  const router = useRouter();
  const { authData, signOut } = useSession();
  const { KeyboardScrollView, setTargetY } = useKeyboardScroll();

  const [showReset, setShowReset] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  // if (loading) {
  //   return (
  //     <View style={styles.loadingContainer}>
  //       <Text style={styles.loadingText}>Loading…</Text>
  //     </View>
  //   );
  // }

  const email = authData?.user.email ?? 'reviewer@example.com';
  const created_at = authData?.user.created_at ?? new Date().toISOString();
  const user = { email, created_at } as any;
  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Password too short',
        text2: 'Use at least 6 characters.',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Passwords don\'t match',
        text2: 'The new password and confirmation must be the same.',
      });
      return;
    }

    const text2 = 'Couldn\'t update password';
    const tryFunc = () => changePassword(currentPassword, newPassword);
    setSaving(true);
    await tryCatchBlock(tryFunc, text2);
    setSaving(false);

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowReset(false);
    Toast.show({
      type: 'success',
      text1: 'Password updated',
      text2: 'Use your new password next time you sign in.',
    });
  };

  const onFocus = (e: FocusEvent) => {
    e.target.measure((_x, _y, _w, height, _px, pageY) => {
      setTargetY(pageY + height);
    });
  };

  return (
    <Screen>
      <KeyboardScrollView>
        <View style={styles.wrapper}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                router.replace('/main');
              }}
              style={styles.backButton}
              accessibilityLabel="Back"
            >
              <Feather name="arrow-left" size={18} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Account</Text>
          </View>

          {/* Card Component */}
          <View style={styles.card}>
            {/* User Avatar & Status */}
            <View style={styles.avatarContainer}>
              <View style={styles.avatarCircle}>
                <Feather name="user" size={32} color={COLORS.colorThree} />
              </View>
              <Text style={styles.signedInText}>Signed in</Text>
            </View>

            {/* User Info */}
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Feather name="mail" size={20} color={COLORS.muted} style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {user.email}
                  </Text>
                </View>
              </View>

              {createdAt && (
                <View style={styles.infoRow}>
                  <Feather name="calendar" size={20} color={COLORS.muted} style={styles.infoIcon} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Member since</Text>
                    <Text style={styles.infoValue}>{createdAt}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Change Password Section */}
            {showReset ? (
              <View style={styles.resetForm}>
                <Text style={styles.sectionTitle}>Change password</Text>

                {/* Current Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Current password</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      onFocus={onFocus}
                      style={styles.input}
                      secureTextEntry={!showCurrent}
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      placeholderTextColor={COLORS.muted}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowCurrent((v) => !v)}
                      style={styles.eyeIconContainer}
                    >
                      <Feather name={showCurrent ? 'eye-off' : 'eye'} size={18} color={COLORS.muted} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* New Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>New password</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      onFocus={onFocus}
                      style={styles.input}
                      secureTextEntry={!showNew}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholderTextColor={COLORS.muted}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowNew((v) => !v)}
                      style={styles.eyeIconContainer}
                    >
                      <Feather name={showNew ? 'eye-off' : 'eye'} size={18} color={COLORS.muted} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm new password</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      onFocus={onFocus}
                      style={styles.input}
                      secureTextEntry={!showConfirm}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholderTextColor={COLORS.muted}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirm((v) => !v)}
                      style={styles.eyeIconContainer}
                    >
                      <Feather name={showConfirm ? 'eye-off' : 'eye'} size={18} color={COLORS.muted} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Reset Form Actions */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.button, styles.secondaryButton, saving && styles.buttonDisabled]}
                    onPress={() => {
                      setShowReset(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    disabled={saving}
                  >
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.primaryButton, saving && styles.buttonDisabled]}
                    onPress={handleResetPassword}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color={COLORS.colorOne} />
                    ) : (
                      <Text style={styles.primaryButtonText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => setShowReset(true)}
              >
                <Feather name="key" size={16} color={COLORS.text} style={styles.buttonIcon} />
                <Text style={styles.secondaryButtonText}>Change password</Text>
              </TouchableOpacity>
            )}

            {/* Sign Out Button */}
            <TouchableOpacity
              style={[styles.button, styles.destructiveButton]}
              onPress={signOut}
            >
              <Feather name="log-out" size={16} color={COLORS.text} style={styles.buttonIcon} />
              <Text style={styles.destructiveButtonText}>Sign out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardScrollView>
    </Screen>
  );
};

export default AccountScreen;

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: 14,
  },
  wrapper: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 24,
    gap: 24,
  },
  avatarContainer: {
    alignItems: 'center',
    gap: 8,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surface2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signedInText: {
    fontSize: 14,
    color: COLORS.muted,
  },
  infoSection: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.muted,
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.text,
  },
  resetForm: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 24,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: COLORS.muted,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: COLORS.surface2,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingRight: 40,
    fontSize: 14,
    color: COLORS.text,
  },
  eyeIconContainer: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  button: {
    height: 40,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.colorFour,
  },
  primaryButtonText: {
    color: COLORS.colorOne,
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: COLORS.surface2,
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontWeight: '500',
    fontSize: 14,
  },
  destructiveButton: {
    backgroundColor: COLORS.red,
  },
  destructiveButtonText: {
    color: '#ffffff',
    fontWeight: '500',
    fontSize: 14,
  },
});
