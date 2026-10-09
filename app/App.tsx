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
import MoreScreen from './src/screens/MoreScreen';
import WelcomeScreen from './src/screens/onboarding/WelcomeScreen';
import SetupScreen from './src/screens/onboarding/SetupScreen';
import LockScreen from './src/screens/onboarding/LockScreen';
import AppHeader from './src/components/AppHeader';
import ProfileSheet from './src/components/ProfileSheet';
import { useSettings } from './src/data/settingsStore';
import { colors, fonts } from './src/theme';

type Tab = 'orders' | 'bills' | 'insights' | 'more';
type OrderMode = 'counter' | 'tables';

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
  const hasTables = settings.outletType !== 'counter';
  const showModeSwitch = settings.outletType === 'both';
  const [tab, setTab] = useState<Tab>('orders');
  // Inside Orders: counter billing or the tables floor.
  const [mode, setMode] = useState<OrderMode>(settings.outletType === 'dine_in' ? 'tables' : 'counter');
  const [activeTable, setActiveTable] = useState<number | null>(null);
  const [morePage, setMorePage] = useState<'list' | 'menu'>('list');
  const [profileOpen, setProfileOpen] = useState(false);

  // Keep the order mode valid when the outlet type changes in Restaurant details.
  useEffect(() => {
    if (settings.outletType === 'counter') {
      setActiveTable(null);
      setMode('counter');
    } else if (settings.outletType === 'dine_in') {
      setMode('tables');
    }
  }, [settings.outletType]);

  const onTablesFloor = mode === 'tables' && activeTable == null;

  return (
    <View style={styles.root}>
      <AppHeader onProfile={() => setProfileOpen(true)} />

      {/* Orders: counter billing, or tables then a table's bill. Screens stay alive so nothing is lost. */}
      <View style={[styles.body, tab !== 'orders' && styles.hidden]}>
        {showModeSwitch && (
          <View style={styles.switchRow}>
            {(['counter', 'tables'] as const).map((m) => (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                style={[styles.switchBtn, mode === m && styles.switchBtnActive]}
                accessibilityRole="tab"
                accessibilityState={{ selected: mode === m }}
              >
                <Text style={[styles.switchText, mode === m && styles.switchTextActive]}>
                  {m === 'counter' ? 'Counter' : 'Tables'}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
        <View style={[styles.body, onTablesFloor && styles.hidden]}>
          <BillingScreen
            tableNo={mode === 'tables' ? activeTable : null}
            onBackToTables={() => setActiveTable(null)}
            onTableSettled={() => setActiveTable(null)}
          />
        </View>
        {hasTables && (
          <View style={[styles.body, !onTablesFloor && styles.hidden]}>
            <TablesScreen
              visible={tab === 'orders' && onTablesFloor}
              activeTable={activeTable}
              onOpenTable={(n) => setActiveTable(n)}
            />
          </View>
        )}
      </View>

      <View style={[styles.body, tab !== 'bills' && styles.hidden]}>
        <TransactionsScreen visible={tab === 'bills'} />
      </View>
      <View style={[styles.body, tab !== 'insights' && styles.hidden]}>
        <DashboardScreen visible={tab === 'insights'} />
      </View>
      <View style={[styles.body, tab !== 'more' && styles.hidden]}>
        {morePage === 'menu' ? (
          <MenuScreen onBack={() => setMorePage('list')} />
        ) : (
          <MoreScreen
            onOpenMenu={() => setMorePage('menu')}
            onOpenRestaurant={() => setProfileOpen(true)}
            onLock={onLock}
          />
        )}
      </View>

      <View style={styles.tabBar}>
        <TabButton label="Orders" active={tab === 'orders'} onPress={() => setTab('orders')} />
        <TabButton label="Bills" active={tab === 'bills'} onPress={() => setTab('bills')} />
        <TabButton label="Insights" active={tab === 'insights'} onPress={() => setTab('insights')} />
        <TabButton
          label="More"
          active={tab === 'more'}
          onPress={() => {
            // Tapping More again returns to its main list.
            if (tab === 'more') setMorePage('list');
            setTab('more');
          }}
        />
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
  switchRow: { flexDirection: 'row', gap: 6, marginHorizontal: 16, marginTop: 12, padding: 4, borderRadius: 14, backgroundColor: colors.line },
  switchBtn: { flex: 1, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  switchBtnActive: { backgroundColor: colors.paper },
  switchText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.muted },
  switchTextActive: { color: colors.brand },
  tabText: { fontSize: 14, color: colors.muted, fontFamily: fonts.semibold },
  tabTextActive: { color: colors.brand },
});
