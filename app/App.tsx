import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import BillingScreen from './src/screens/BillingScreen';
import ReportScreen from './src/screens/ReportScreen';

type Tab = 'billing' | 'report';

// Simple two-tab switcher for the prototype. We will move to Expo Router
// when the app has more screens (menu setup, tables, settings).
export default function App() {
  const [tab, setTab] = useState<Tab>('billing');

  return (
    <View style={styles.root}>
      {/* Both screens stay alive so a half-made bill is not lost when switching tabs. */}
      <View style={[styles.body, tab !== 'billing' && styles.hidden]}>
        <BillingScreen />
      </View>
      <View style={[styles.body, tab !== 'report' && styles.hidden]}>
        <ReportScreen visible={tab === 'report'} />
      </View>

      <View style={styles.tabBar}>
        <TabButton label="Billing" active={tab === 'billing'} onPress={() => setTab('billing')} />
        <TabButton label="Today's sales" active={tab === 'report'} onPress={() => setTab('report')} />
      </View>
      <StatusBar style="dark" />
    </View>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={styles.tab} onPress={onPress}>
      <View style={[styles.indicator, active && styles.indicatorActive]} />
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAF8F5' },
  body: { flex: 1 },
  hidden: { display: 'none' },
  tabBar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#E7E3DE', backgroundColor: '#fff', paddingBottom: 24 },
  tab: { flex: 1, alignItems: 'center', paddingTop: 0, paddingBottom: 6 },
  indicator: { height: 3, width: 40, borderRadius: 2, backgroundColor: 'transparent', marginBottom: 8 },
  indicatorActive: { backgroundColor: '#C2410C' },
  tabText: { fontSize: 14, color: '#6B6870', fontWeight: '600' },
  tabTextActive: { color: '#1C1B1F' },
});
