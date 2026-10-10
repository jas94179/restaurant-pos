import { Component, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { recordError, shareReport } from '../data/crash';
import { colors, fonts } from '../theme';

type State = { failed: boolean };

// If a screen crashes, show a calm message instead of a blank app.
// Bills are saved the moment they are made, so nothing is lost.
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    recordError(error, false);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.text}>
          Don't worry, your bills are saved. Tap Try again to continue. If it keeps happening, send a problem report to galla.
        </Text>
        <Pressable style={styles.primary} onPress={() => this.setState({ failed: false })} accessibilityRole="button">
          <Text style={styles.primaryText}>Try again</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={() => shareReport()} accessibilityRole="button">
          <Text style={styles.secondaryText}>Send problem report</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mist, padding: 28, justifyContent: 'center' },
  title: { fontFamily: fonts.bold, fontSize: 26, color: colors.ink },
  text: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 23, color: colors.muted, marginTop: 10 },
  primary: { height: 54, borderRadius: 14, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  primaryText: { fontFamily: fonts.bold, fontSize: 16, color: colors.paper },
  secondary: { height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  secondaryText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
});
