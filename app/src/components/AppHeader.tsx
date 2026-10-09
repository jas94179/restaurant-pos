import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkState } from 'expo-network';
import { colors, fonts } from '../theme';

type Props = {
  title: string;
  userName: string; // who is logged in, e.g. "Owner" (staff names come with PINs)
  onLock: () => void;
};

// Slim one-line header: where you are on the left; live status and who is logged in on the right.
export default function AppHeader({ title, userName, onLock }: Props) {
  const insets = useSafeAreaInsets();
  const net = useNetworkState();
  // Only speak up when something needs attention. Bills are always saved on the phone.
  const offline = net.isConnected === false || net.isInternetReachable === false;

  function openUserMenu() {
    Alert.alert(userName, 'Lock the app so the next person enters their PIN.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Lock app', style: 'destructive', onPress: onLock },
    ]);
  }

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
        {title}
      </Text>

      <View style={styles.right}>
        {offline && (
          <View style={styles.status} accessibilityLabel="Offline. Bills are still saved on this phone.">
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Offline</Text>
          </View>
        )}
        <Pressable
          onPress={openUserMenu}
          style={({ pressed }) => [styles.user, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel={`Logged in as ${userName}. Tap to lock.`}
          hitSlop={6}
        >
          <View style={styles.userDot}>
            <Text style={styles.userInitial}>{(userName[0] ?? '?').toUpperCase()}</Text>
          </View>
          <Text style={styles.userName} numberOfLines={1}>
            {userName}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: colors.brand, paddingBottom: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 20, color: colors.paper },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, height: 30, borderRadius: 15, backgroundColor: '#FBF0D2' },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.turmericDeep },
  statusText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.brandDeep },
  user: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 4, paddingRight: 12, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.12)' },
  userDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.turmeric, alignItems: 'center', justifyContent: 'center' },
  userInitial: { fontFamily: fonts.bold, fontSize: 13, color: colors.brandDeep },
  userName: { maxWidth: 110, fontFamily: fonts.semibold, fontSize: 14, color: colors.paper },
});
