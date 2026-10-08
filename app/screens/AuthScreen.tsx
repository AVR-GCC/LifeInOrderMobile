import { useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSession } from '../context/AuthContext';
import { COLORS } from '../constants/theme';
import { useRouter } from 'expo-router';

const Login = () => {
  const router = useRouter();
  const { signUp, signIn } = useSession();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  // const [googleLoading, setGoogleLoading] = useState(false);
  // const [checkEmail, setCheckEmail] = useState(false);

  const handleEmailAuth = async () => {
    setLoading(true);
    try {
      const func = mode === 'signup' ? signUp : signIn;
      await func(email, password);
      if (mode === 'signup') {
        router.replace(`/email-confirm?email=${email}&password=${password}`);
      }
    } catch (err) {
      console.log('sign err', err);
    } finally {
      setLoading(false);
    }
  };

  // const handleGoogle = async () => {
  //   setGoogleLoading(true);
  //   const result = await lovable.auth.signInWithOAuth('google', {
  //     redirect_uri: window.location.origin,
  //   });
  //   if (result.error) {
  //     toast({
  //       title: 'Google sign in failed',
  //       description: result.error.message,
  //       variant: 'destructive',
  //     });
  //     setGoogleLoading(false);
  //     return;
  //   }
  //   if (result.redirected) return; // browser is navigating to Google
  //   router.replace(`/main`)
  // };

  // if (checkEmail) {
  //   return (
  //     <div class='min-h-screen flex items-center justify-center bg-background p-4'>
  //       <div class='w-full max-w-sm bg-card border border-border rounded-lg p-6 text-center space-y-3'>
  //         <h1 class='text-xl font-semibold text-card-foreground'>Check your email</h1>
  //         <p class='text-sm text-muted-foreground'>
  //           We sent a confirmation link to <span class='text-foreground'>{email}</span>. Click it
  //           to activate your account, then sign in.
  //         </p>
  //         <TouchableOpacity
  //           variant='outline'
  //           class='w-full'
  //           onClick={() => {
  //             setCheckEmail(false);
  //             setMode('login');
  //           }}
  //         >
  //           Back to sign in
  //         </TouchableOpacity>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Life in Order</Text>
          <Text style={styles.subtitle}>
            {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
          </Text>
        </View>

        {/* <TouchableOpacity */}
        {/*   type='button' */}
        {/*   variant='outline' */}
        {/*   class='w-full' */}
        {/*   onClick={handleGoogle} */}
        {/*   disabled={googleLoading || loading} */}
        {/* > */}
        {/*   {googleLoading ? ( */}
        {/*     <Loader2 class='w-4 h-4 mr-2 animate-spin' /> */}
        {/*   ) : ( */}
        {/*     <svg class='w-4 h-4 mr-2' viewBox='0 0 24 24'> */}
        {/*       <path */}
        {/*         fill='currentColor' */}
        {/*         d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z' */}
        {/*       /> */}
        {/*       <path */}
        {/*         fill='currentColor' */}
        {/*         d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z' */}
        {/*       /> */}
        {/*       <path */}
        {/*         fill='currentColor' */}
        {/*         d='M5.84 14.1a7.16 7.16 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z' */}
        {/*       /> */}
        {/*       <path */}
        {/*         fill='currentColor' */}
        {/*         d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z' */}
        {/*       /> */}
        {/*     </svg> */}
        {/*   )} */}
        {/*   Continue with Google */}
        {/* </TouchableOpacity> */}

        {/* <View class='flex items-center gap-3'> */}
        {/*   <View class='h-px flex-1 bg-border' /> */}
        {/*   <span class='text-xs text-muted-foreground'>or</span> */}
        {/*   <View class='h-px flex-1 bg-border' /> */}
        {/* </View> */}

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              autoComplete='email'
              keyboardType='email-address'
              autoCapitalize='none'
              value={email}
              onChangeText={setEmail}
              placeholder='you@example.com'
              placeholderTextColor={COLORS.muted}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChangeText={setPassword}
              placeholder='••••••••'
              placeholderTextColor={COLORS.muted}
            />
          </View>
          <TouchableOpacity
            style={styles.submitButton}
            disabled={loading /* || googleLoading */}
            onPress={handleEmailAuth}
          >
            {loading && <ActivityIndicator size='small' color={COLORS.text} />}
            <Text style={styles.submitButtonText}>{mode === 'login' ? 'Sign in' : 'Create account'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{mode === 'login' ? 'Don\'t have an account?' : 'Already have an account?'}{' '}</Text>
          <TouchableOpacity
            onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
          >
            <Text style={styles.footerLink}>{mode === 'login' ? 'Sign up' : 'Sign in'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 384,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 24,
    gap: 24,
  },
  header: {
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: COLORS.text,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    color: COLORS.text,
    backgroundColor: COLORS.surface2,
  },
  submitButton: {
    width: '100%',
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.colorTwo,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: COLORS.muted,
  },
  footerLink: {
    fontSize: 14,
    color: COLORS.colorThree,
  },
});

export default Login;
