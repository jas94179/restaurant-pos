import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Alert, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { pickAndRestore } from '../../data/backup';
import { APP_NAME, colors, fonts } from '../../theme';

// First screen on a new phone. One moment of motion: a coin drops into the cash-box slot.
export default function WelcomeScreen({ onStart }: { onStart: () => void }) {
  const drop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) {
        drop.setValue(1);
        return;
      }
      Animated.timing(drop, {
        toValue: 1,
        duration: 900,
        delay: 300,
        easing: Easing.bounce,
        useNativeDriver: true,
      }).start();
    });
    return () => {
      cancelled = true;
    };
  }, [drop]);

  const translateY = drop.interpolate({ inputRange: [0, 1], outputRange: [-140, 0] });
  const opacity = drop.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 1] });

  return (
    <View style={styles.screen}>
      <View style={styles.top}>
        <View style={styles.mark}>
          <Animated.View style={[styles.coin, { opacity, transform: [{ translateY }] }]}>
            <Text style={styles.coinText}>₹</Text>
          </Animated.View>
          <View style={styles.slot} />
        </View>
        <Text style={styles.wordmark} accessibilityRole="header">
          {APP_NAME}
        </Text>
        <Text style={styles.tagline}>Billing for your counter and tables. Works even when the internet doesn't.</Text>
      </View>

      <View style={styles.bottom}>
        <View style={styles.points}>
          <Point text="Bills, tokens and GST in a few taps" />
          <Point text="Every bill saved on this phone" />
          <Point text="Today's sales at a glance" />
        </View>
        <Pressable
          style={({ pressed }) => [styles.cta, pressed && { backgroundColor: colors.turmericDeep }]}
          onPress={onStart}
          accessibilityRole="button"
        >
          <Text style={styles.ctaText}>Set up my restaurant</Text>
        </Pressable>
        <Text style={styles.small}>Takes about 2 minutes.</Text>
        <Pressable
          onPress={async () => {
            const error = await pickAndRestore();
            if (error) Alert.alert('Restore', error);
          }}
          hitSlop={8}
          accessibilityRole="button"
          style={styles.restore}
        >
          <Text style={styles.restoreText}>Moving from another phone? Restore from a backup</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Point({ text }: { text: string }) {
  return (
    <View style={styles.point}>
      <View style={styles.pointDot} />
      <Text style={styles.pointText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.brand, paddingHorizontal: 28, paddingTop: 96, paddingBottom: 40, justifyContent: 'space-between' },
  top: {},
  mark: { width: 84, height: 96, justifyContent: 'flex-end', marginBottom: 20 },
  coin: { position: 'absolute', top: 10, left: 14, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.turmeric, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.turmericDeep },
  coinText: { fontFamily: fonts.bold, fontSize: 26, color: colors.brandDeep, marginTop: -2 },
  slot: { height: 12, borderRadius: 6, backgroundColor: colors.brandDeep, borderWidth: 2, borderColor: 'rgba(255,255,255,0.18)' },
  wordmark: { fontFamily: fonts.bold, fontSize: 88, lineHeight: 92, color: colors.paper, letterSpacing: -3 },
  tagline: { fontFamily: fonts.regular, fontSize: 19, lineHeight: 27, color: '#CFE0D6', marginTop: 12, maxWidth: 320 },
  bottom: {},
  points: { gap: 12, marginBottom: 28 },
  point: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pointDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.turmeric },
  pointText: { fontFamily: fonts.regular, fontSize: 16, color: colors.paper },
  cta: { height: 58, borderRadius: 16, backgroundColor: colors.turmeric, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: fonts.bold, fontSize: 18, color: colors.brandDeep },
  restore: { marginTop: 14, alignItems: 'center' },
  restoreText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.turmeric, textDecorationLine: 'underline' },
  small: { fontFamily: fonts.regular, fontSize: 13, color: '#9DB8AA', textAlign: 'center', marginTop: 12 },
});
