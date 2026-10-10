import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSettings } from '../data/settingsStore';
import { useMenu } from '../data/menuStore';
import { can, ROLE_INFO, ROLE_LABEL, useCurrentUser, useStaffList } from '../data/staffStore';
import { PLAN_LABEL } from '../data/plans';
import { colors, fonts } from '../theme';

type Props = {
  onOpenMenu: () => void;
  onOpenStaff: () => void;
  onOpenStock: () => void;
  onOpenBackup: () => void;
  onOpenRestaurant: () => void;
  onOpenPlan: () => void;
  onLock: () => void;
};

const OUTLET_LABEL = { counter: 'Counter', dine_in: 'Dine-in', both: 'Counter and tables' } as const;

// The restaurant's profile, plus everything used less often than billing,
// so the bottom bar never grows past four tabs.
export default function ProfileScreen({ onOpenMenu, onOpenStaff, onOpenStock, onOpenBackup, onOpenRestaurant, onOpenPlan, onLock }: Props) {
  const settings = useSettings();
  const menu = useMenu();
  const user = useCurrentUser();
  const staff = useStaffList();
  const isOwner = can(user, 'manageStaff');
  const itemCount = menu.items.filter((i) => !i.archived).length;
  const outOfStock = menu.items.filter((i) => !i.archived && !i.available).length;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(settings.restaurantName.trim()[0] ?? 'R').toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={2}>
            {settings.restaurantName}
          </Text>
          <Text style={styles.meta}>{OUTLET_LABEL[settings.outletType]}</Text>
          {!!settings.gstin && <Text style={styles.meta}>GSTIN {settings.gstin}</Text>}
        </View>
      </View>

      <Group title="You">
        <Row
          title={user?.name ?? ''}
          detail={user ? `${ROLE_LABEL[user.role]}. ${ROLE_INFO[user.role]}` : ''}
        />
      </Group>

      {isOwner && (
        <>
          <Group title="Restaurant">
            <Row
              title="Menu"
              detail={`${itemCount} items${outOfStock ? `, ${outOfStock} out of stock` : ''}`}
              onPress={onOpenMenu}
            />
            <Row
              title="Staff and PINs"
              detail={`${staff.length} ${staff.length === 1 ? 'person' : 'people'}`}
              onPress={onOpenStaff}
            />
            <Row
              title="Restaurant details"
              detail="Name, GSTIN, GST, UPI ID, tables"
              onPress={onOpenRestaurant}
            />
            <Row
              title="Backup and restore"
              detail={
                settings.lastBackupAt
                  ? `Last backup ${new Date(settings.lastBackupAt).toLocaleDateString('en-IN')}`
                  : 'No backup yet. Back up now.'
              }
              onPress={onOpenBackup}
            />
          </Group>

          <Group title="Coming soon">
            <Row title="Printers" detail="Bill and kitchen slips" soon />
            <Row title="Import menu" detail="Load your menu from a photo" soon />
          </Group>

          <Group title="Account">
            <Row title="Plan" detail={`${PLAN_LABEL[settings.plan] ?? settings.plan}. Upgrade or change`} onPress={onOpenPlan} />
          </Group>
        </>
      )}

      {!isOwner && can(user, 'toggleStock') && (
        <Group title="Today">
          <Row
            title="Stock on and off"
            detail={outOfStock ? `${outOfStock} item${outOfStock === 1 ? '' : 's'} out of stock` : 'Everything is available'}
            onPress={onOpenStock}
          />
        </Group>
      )}

      {!isOwner && (
        <Text style={styles.note}>
          Menu prices, staff and restaurant settings are managed by the owner. Tip: long-press a dish while billing to
          switch it off quickly.
        </Text>
      )}

      <Pressable
        onPress={onLock}
        style={({ pressed }) => [styles.logout, pressed && { backgroundColor: '#FBE9E7' }]}
        accessibilityRole="button"
      >
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
      <Text style={styles.logoutNote}>Goes back to the start page. Bills and data stay safe on this phone.</Text>
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
        <Text style={styles.rowDetail} numberOfLines={2}>
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
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, borderRadius: 20, backgroundColor: colors.brand },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.turmeric, borderWidth: 3, borderColor: colors.turmericDeep, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bold, fontSize: 28, color: colors.brandDeep },
  name: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 27, color: colors.paper },
  meta: { fontFamily: fonts.regular, fontSize: 14, color: '#CFE0D6', marginTop: 2 },
  group: { marginTop: 18 },
  groupTitle: { fontFamily: fonts.semibold, fontSize: 14, color: colors.muted, marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: colors.paper, borderRadius: 16, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line },
  rowTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  rowDetail: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 2 },
  chevron: { fontFamily: fonts.regular, fontSize: 26, color: colors.muted, marginTop: -2 },
  soonText: { color: colors.muted },
  dangerText: { color: colors.danger },
  note: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.muted, marginTop: 20, marginHorizontal: 4 },
  logout: { marginTop: 28, height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: colors.danger, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  logoutText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.danger },
  logoutNote: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 8 },
  soonPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: '#FBF0D2' },
  soonPillText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.turmericDeep },
});
