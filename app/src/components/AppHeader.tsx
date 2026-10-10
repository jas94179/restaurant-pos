import { useEffect, useState } from 'react';
import { Alert, AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Network from 'expo-network';
import { colors, fonts } from '../theme';

type Props = {
  title: string;
  restaurantName: string; // which restaurant is open (one phone can hold several)
  userName: string; // who is logged in
  userRole: string; // their role, e.g. "Cashier"
  onLock: () => void;
};

// Slim one-line header: where you are on the left; live status and who is logged in on the right.
export default function AppHeader({ title, restaurantName, userName, userRole, onLock }: Props) {
  const insets = useSafeAreaInsets();
  // Only speak up when something needs attention. Bills are always saved on the phone.
  const offline = useOffline();

  function openUserMenu() {
    Alert.alert(`${userName}, ${userRole}`, `Signed in to ${restaurantName}. Log out to let the next person sign in with their PIN.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: onLock },
    ]);
  }

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      <View style={{ flexShrink: 1 }}>
        <Text style={styles.restaurant} numberOfLines={1}>
          {restaurantName}
        </Text>
        <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
      </View>

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
          accessibilityLabel={`Logged in as ${userName}, ${userRole}. Tap to log out.`}
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

// Live network status. The change listener alone can miss changes on some phones
// (and in Expo Go), so we also re-check every few seconds and when the app comes back.
function useOffline(): boolean {
  const live = Network.useNetworkState();
  const [checked, setChecked] = useState<Network.NetworkState | null>(null);

  useEffect(() => {
    let alive = true;
    const check = () =>
      Network.getNetworkStateAsync()
        .then((st) => alive && setChecked(st))
        .catch(() => {});
    check();
    const timer = setInterval(check, 5000);
    const sub = AppState.addEventListener('change', (st) => st === 'active' && check());
    return () => {
      alive = false;
      clearInterval(timer);
      sub.remove();
    };
    // Re-check right away whenever the live listener reports a change.
  }, [live.isConnected, live.isInternetReachable, live.type]);

  const st = checked ?? live;
  return st.isConnected === false || st.isInternetReachable === false || st.type === Network.NetworkStateType.NONE;
}

const styles = StyleSheet.create({
  bar: { backgroundColor: colors.brand, paddingBottom: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  restaurant: { fontFamily: fonts.semibold, fontSize: 12, color: '#9DB8AA' },
  title: { fontFamily: fonts.bold, fontSize: 20, color: colors.paper },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, height: 30, borderRadius: 15, backgroundColor: '#FBF0D2' },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.turmericDeep },
  statusText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.brandDeep },
  user: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 4, paddingRight: 12, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.12)' },
  userDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.turmeric, alignItems: 'center', justifyContent: 'center' },
  userInitial: { fontFamily: fonts.bold, fontSize: 13, color: colors.brandDeep },
  userName: { maxWidth: 110, fontFamily: fonts.semibold, fontSize: 14, color: colors.paper },
});
