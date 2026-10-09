import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import BillingScreen from './src/screens/BillingScreen';
import ReportScreen from './src/screens/ReportScreen';
import TablesScreen from './src/screens/TablesScreen';
import MenuScreen from './src/screens/MenuScreen';

type Tab = 'billing' | 'tables' | 'report' | 'menu';

// Simple tab switcher for the prototype. We will move to Expo Router
// when the app has more screens (menu setup, settings).
export default function App() {
  const [tab, setTab] = useState<Tab>('billing');
  const [activeTable, setActiveTable] = useState<number | null>(null);

  return (
    <View style={styles.root}>
      {/* All screens stay alive so a half-made bill is not lost when switching tabs. */}
      <View style={[styles.body, tab !== 'billing' && styles.hidden]}>
        <BillingScreen
          tableNo={activeTable}
          onPickTable={() => setTab('tables')}
          onLeaveTable={() => setActiveTable(null)}
          onTableSettled={() => setActiveTable(null)}
        />
      </View>
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
      <View style={[styles.body, tab !== 'report' && styles.hidden]}>
        <ReportScreen visible={tab === 'report'} />
      </View>
      <View style={[styles.body, tab !== 'menu' && styles.hidden]}>
        <MenuScreen />
      </View>

      <View style={styles.tabBar}>
        <TabButton label="Billing" active={tab === 'billing'} onPress={() => setTab('billing')} />
        <TabButton label="Tables" active={tab === 'tables'} onPress={() => setTab('tables')} />
        <TabButton label="Sales" active={tab === 'report'} onPress={() => setTab('report')} />
        <TabButton label="Menu" active={tab === 'menu'} onPress={() => setTab('menu')} />
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
  tab: { flex: 1, alignItems: 'center', paddingBottom: 6 },
  indicator: { height: 3, width: 40, borderRadius: 2, backgroundColor: 'transparent', marginBottom: 8 },
  indicatorActive: { backgroundColor: '#C2410C' },
  tabText: { fontSize: 14, color: '#6B6870', fontWeight: '600' },
  tabTextActive: { color: '#1C1B1F' },
});
