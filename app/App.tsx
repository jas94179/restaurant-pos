import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from '@expo-google-fonts/bricolage-grotesque/useFonts';
import { BricolageGrotesque_400Regular } from '@expo-google-fonts/bricolage-grotesque/400Regular';
import { BricolageGrotesque_600SemiBold } from '@expo-google-fonts/bricolage-grotesque/600SemiBold';
import { BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque/800ExtraBold';
import BillingScreen from './src/screens/BillingScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import TablesScreen from './src/screens/TablesScreen';
import MenuScreen from './src/screens/MenuScreen';
import WelcomeScreen from './src/screens/onboarding/WelcomeScreen';
import SetupScreen from './src/screens/onboarding/SetupScreen';
import LockScreen from './src/screens/onboarding/LockScreen';
import AppHeader from './src/components/AppHeader';
import ProfileSheet from './src/components/ProfileSheet';
import { useSettings } from './src/data/settingsStore';
import { colors, fonts } from './src/theme';

type Tab = 'billing' | 'tables' | 'bills' | 'report' | 'menu';

export default function App() {
  const [fontsLoaded] = useFonts({
    BricolageGrotesque_400Regular,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_800ExtraBold,
  });
  const settings = useSettings();
  const [onboarding, setOnboarding] = useState<'welcome' | 'setup'>('welcome');
  const [unlocked, setUnlocked] = useState(false);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: colors.brand }} />;

  // First time on this phone: welcome, then setup.
  if (!settings.setupDone) {
    return (
      <>
        {onboarding === 'welcome' ? (
          <WelcomeScreen onStart={() => setOnboarding('setup')} />
        ) : (
          <SetupScreen onBack={() => setOnboarding('welcome')} onDone={() => setUnlocked(true)} />
        )}
        <StatusBar style={onboarding === 'welcome' ? 'light' : 'dark'} />
      </>
    );
  }

  // Every time the app opens: PIN first.
  if (!unlocked) {
    return (
      <>
        <LockScreen onUnlock={() => setUnlocked(true)} />
        <StatusBar style="light" />
      </>
    );
  }

  return <MainApp onLock={() => setUnlocked(false)} />;
}

// Simple tab switcher for the prototype. We will move to Expo Router
// when the app has more screens (settings, staff, dashboard).
function MainApp({ onLock }: { onLock: () => void }) {
  const settings = useSettings();
  const showTables = settings.outletType !== 'counter';
  const [tab, setTab] = useState<Tab>(settings.outletType === 'dine_in' ? 'tables' : 'billing');
  const [activeTable, setActiveTable] = useState<number | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  // If the outlet is switched to counter-only, leave the Tables tab.
  useEffect(() => {
    if (!showTables) {
      setActiveTable(null);
      setTab((t) => (t === 'tables' ? 'billing' : t));
    }
  }, [showTables]);

  return (
    <View style={styles.root}>
      <AppHeader onProfile={() => setProfileOpen(true)} />
      {/* All screens stay alive so a half-made bill is not lost when switching tabs. */}
      <View style={[styles.body, tab !== 'billing' && styles.hidden]}>
        <BillingScreen
          tableNo={activeTable}
          onPickTable={() => setTab('tables')}
          onLeaveTable={() => setActiveTable(null)}
          onTableSettled={() => setActiveTable(null)}
        />
      </View>
      {showTables && (
        <View style={[styles.body, tab !== 'tables' && styles.hidden]}>
          <TablesScreen
            visible={tab === 'tables'}
            activeTable={activeTable}
            onOpenTable={(n) => {
              setActiveTable(n);
              setTab('billing');
            }}
          />
        </View>
      )}
      <View style={[styles.body, tab !== 'bills' && styles.hidden]}>
        <TransactionsScreen visible={tab === 'bills'} />
      </View>
      <View style={[styles.body, tab !== 'report' && styles.hidden]}>
        <DashboardScreen visible={tab === 'report'} />
      </View>
      <View style={[styles.body, tab !== 'menu' && styles.hidden]}>
        <MenuScreen />
      </View>

      <View style={styles.tabBar}>
        <TabButton label="Billing" active={tab === 'billing'} onPress={() => setTab('billing')} />
        {showTables && <TabButton label="Tables" active={tab === 'tables'} onPress={() => setTab('tables')} />}
        <TabButton label="Bills" active={tab === 'bills'} onPress={() => setTab('bills')} />
        <TabButton label="Insights" active={tab === 'report'} onPress={() => setTab('report')} />
        <TabButton label="Menu" active={tab === 'menu'} onPress={() => setTab('menu')} />
      </View>

      {profileOpen && <ProfileSheet onClose={() => setProfileOpen(false)} onLock={onLock} />}
      <StatusBar style="light" />
    </View>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={styles.tab} onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: active }}>
      <View style={[styles.indicator, active && styles.indicatorActive]} />
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.mist },
  body: { flex: 1 },
  hidden: { display: 'none' },
  tabBar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.paper, paddingBottom: 24 },
  tab: { flex: 1, alignItems: 'center', paddingBottom: 6 },
  indicator: { height: 3, width: 40, borderRadius: 2, backgroundColor: 'transparent', marginBottom: 8 },
  indicatorActive: { backgroundColor: colors.turmeric },
  tabText: { fontSize: 13, color: colors.muted, fontFamily: fonts.semibold },
  tabTextActive: { color: colors.brand },
});
