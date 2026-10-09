import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSettings } from '../data/settingsStore';
import { useMenu } from '../data/menuStore';
import { colors, fonts } from '../theme';

type Props = {
  onOpenMenu: () => void;
  onOpenRestaurant: () => void;
  onLock: () => void;
};

const OUTLET_LABEL = { counter: 'Counter', dine_in: 'Dine-in', both: 'Counter and tables' } as const;

// Everything used less often than billing lives here, so the bottom bar never grows past four tabs.
export default function MoreScreen({ onOpenMenu, onOpenRestaurant, onLock }: Props) {
  const settings = useSettings();
  const menu = useMenu();
  const itemCount = menu.items.filter((i) => !i.archived).length;
  const outOfStock = menu.items.filter((i) => !i.archived && !i.available).length;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>More</Text>

      <Group title="Restaurant">
        <Row
          title="Menu"
          detail={`${itemCount} items${outOfStock ? `, ${outOfStock} out of stock` : ''}`}
          onPress={onOpenMenu}
        />
        <Row
          title="Restaurant details"
          detail={`${settings.restaurantName}, ${OUTLET_LABEL[settings.outletType]}`}
          onPress={onOpenRestaurant}
        />
      </Group>

      <Group title="Coming soon">
        <Row title="Staff and PINs" detail="Separate logins for cashiers and waiters" soon />
        <Row title="Printers" detail="Bill and kitchen slips" soon />
        <Row title="Backup" detail="Keep a copy of your bills online" soon />
        <Row title="Import menu" detail="Load your menu from a photo" soon />
      </Group>

      <Group title="Account">
        <Row title="Plan" detail="Pilot plan, all features free" />
        <Row title="Lock app" detail="Back to the PIN screen" onPress={onLock} danger />
      </Group>
    </ScrollView>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Row({
  title,
  detail,
  onPress,
  soon,
  danger,
}: {
  title: string;
  detail: string;
  onPress?: () => void;
  soon?: boolean;
  danger?: boolean;
}) {
  const content = (
    <>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, soon && styles.soonText, danger && styles.dangerText]}>{title}</Text>
        <Text style={styles.rowDetail} numberOfLines={1}>
          {detail}
        </Text>
      </View>
      {soon ? (
        <View style={styles.soonPill}>
          <Text style={styles.soonPillText}>Soon</Text>
        </View>
      ) : onPress ? (
        <Text style={styles.chevron}>›</Text>
      ) : null}
    </>
  );
  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.mist }]}
      accessibilityRole="button"
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mist },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontFamily: fonts.bold, fontSize: 26, color: colors.ink, marginBottom: 4 },
  group: { marginTop: 18 },
  groupTitle: { fontFamily: fonts.semibold, fontSize: 14, color: colors.muted, marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: colors.paper, borderRadius: 16, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line },
  rowTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  rowDetail: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 2 },
  chevron: { fontFamily: fonts.regular, fontSize: 26, color: colors.muted, marginTop: -2 },
  soonText: { color: colors.muted },
  dangerText: { color: colors.danger },
  soonPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: '#FBF0D2' },
  soonPillText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.turmericDeep },
});
