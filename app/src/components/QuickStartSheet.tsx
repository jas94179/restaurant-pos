import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import BottomSheet from './BottomSheet';
import type { Role } from '../db/database';
import { colors, fonts } from '../theme';

type Card = { title: string; steps: string[] };

function cardsFor(role: Role, hasTables: boolean): Card[] {
  const cards: Card[] = [
    {
      title: 'Make a bill',
      steps: [
        'Tap ADD on a dish. Use − and + to change how many.',
        'Tap the green bar at the bottom to open the bill.',
        'Choose Cash, UPI or Card, then Save bill. UPI shows a QR with the exact amount.',
        'Dish finished? Long-press it to mark it out of stock.',
      ],
    },
  ];
  if (hasTables) {
    cards.push({
      title: 'Tables and kitchen',
      steps: [
        'Open Tables and tap a table to add its order.',
        'Add a note for the kitchen, like "less spicy", under any item.',
        'Tap Send to kitchen. Only new items go on the slip.',
        'Show bill lets the guest see the bill and scan to pay. Then Settle.',
      ],
    });
  }
  cards.push({
    title: 'End of the day',
    steps: [
      'Paid a vendor from the cash drawer? Add it in Profile, Expenses.',
      'At night, open Profile, Close the day, and count the cash.',
      role === 'cashier'
        ? 'Enter what you counted. The owner checks the result.'
        : 'galla shows if the cash matches, is short, or is extra.',
    ],
  });
  cards.push({
    title: role === 'owner' ? 'Keep it safe' : 'Your PIN',
    steps:
      role === 'owner'
        ? [
            'Give every staff member their own PIN in Profile, Staff and PINs.',
            'Back up once a week in Profile, Backup. Save the file outside this phone.',
            'Choose your printer in Profile, Printer.',
            'Bills from galla follow GST rules, but confirm your setup with your CA.',
          ]
        : [
            'Your PIN is only yours. Do not share it.',
            'Every bill shows who made it.',
            'Tap your name at the top, then Log out, when you leave the counter.',
          ],
  });
  return cards;
}

// Short first-use guide, shown once per person (and from Profile, Quick start).
export default function QuickStartSheet({ role, hasTables, onClose }: { role: Role; hasTables: boolean; onClose: () => void }) {
  const cards = cardsFor(role, hasTables);
  const [i, setI] = useState(0);
  const card = cards[i];
  const last = i === cards.length - 1;

  return (
    <BottomSheet
      onClose={onClose}
      footer={
        <View style={styles.footer}>
          <View style={styles.dots}>
            {cards.map((_, n) => (
              <View key={n} style={[styles.dot, n === i && styles.dotOn]} />
            ))}
          </View>
          <View style={styles.buttons}>
            {i > 0 ? (
              <Pressable style={[styles.btn, styles.ghost]} onPress={() => setI(i - 1)} accessibilityRole="button">
                <Text style={styles.ghostText}>Back</Text>
              </Pressable>
            ) : (
              <Pressable style={[styles.btn, styles.ghost]} onPress={onClose} accessibilityRole="button">
                <Text style={styles.ghostText}>Skip</Text>
              </Pressable>
            )}
            <Pressable style={[styles.btn, styles.primary]} onPress={() => (last ? onClose() : setI(i + 1))} accessibilityRole="button">
              <Text style={styles.primaryText}>{last ? 'Start billing' : 'Next'}</Text>
            </Pressable>
          </View>
        </View>
      }
    >
      <Text style={styles.kicker}>
        Quick start · {i + 1} of {cards.length}
      </Text>
      <Text style={styles.title}>{card.title}</Text>
      {card.steps.map((s, n) => (
        <View key={n} style={styles.step}>
          <View style={styles.num}>
            <Text style={styles.numText}>{n + 1}</Text>
          </View>
          <Text style={styles.stepText}>{s}</Text>
        </View>
      ))}
      <View style={{ height: 12 }} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  kicker: { fontFamily: fonts.semibold, fontSize: 13, color: colors.turmericDeep, marginTop: 4 },
  title: { fontFamily: fonts.bold, fontSize: 24, color: colors.ink, marginTop: 4, marginBottom: 8 },
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginTop: 12 },
  num: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E6F4EA', alignItems: 'center', justifyContent: 'center' },
  numText: { fontFamily: fonts.bold, fontSize: 14, color: colors.brand },
  stepText: { flex: 1, fontFamily: fonts.regular, fontSize: 16, lineHeight: 23, color: colors.ink },
  footer: { gap: 12 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.line },
  dotOn: { width: 22, backgroundColor: colors.brand },
  buttons: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  ghost: { borderWidth: 1.5, borderColor: colors.line },
  ghostText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  primary: { backgroundColor: colors.brand },
  primaryText: { fontFamily: fonts.bold, fontSize: 16, color: colors.paper },
});
