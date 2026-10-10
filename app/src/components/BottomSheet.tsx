import { useEffect, useRef, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

type Props = {
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode; // buttons that always stay visible at the bottom
  background?: string;
  dismissible?: boolean; // false: no swipe or tap-outside to close (e.g. while paying)
};

// One bottom sheet for every pop-up: opens above the tab bar, slides up from the
// bottom, drag the handle (or tap outside) to close, content scrolls, buttons stay
// visible above the phone's home bar.
export default function BottomSheet({ onClose, children, footer, background = colors.paper, dismissible = true }: Props) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const translateY = useRef(new Animated.Value(height)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const closing = useRef(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [translateY, fade]);

  function close() {
    if (closing.current) return;
    closing.current = true;
    Animated.parallel([
      Animated.timing(translateY, { toValue: height, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  }

  const closeRef = useRef(close);
  closeRef.current = dismissible ? close : () => Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 120 || g.vy > 1.2) closeRef.current();
        else Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
      },
    }),
  ).current;

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={dismissible ? close : () => {}}>
      <Animated.View style={[styles.backdrop, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismissible ? close : undefined} accessibilityLabel="Close" />
      </Animated.View>
      <KeyboardAvoidingView style={styles.wrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: background, maxHeight: height - insets.top - 24, transform: [{ translateY }] },
          ]}
        >
          <View {...pan.panHandlers} style={styles.handleArea} accessibilityLabel="Drag down to close">
            <View style={styles.handle} />
          </View>
          <View style={styles.body}>{children}</View>
          {footer ? (
            <View style={[styles.footer, { paddingBottom: insets.bottom + 12, backgroundColor: background }]}>{footer}</View>
          ) : (
            <View style={{ height: insets.bottom + 12 }} />
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,42,31,0.55)' },
  wrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  handleArea: { alignItems: 'center', paddingTop: 10, paddingBottom: 8 },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.line },
  body: { flexShrink: 1, paddingHorizontal: 20 },
  footer: { paddingHorizontal: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.line },
});
