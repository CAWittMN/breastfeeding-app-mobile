import { Alert, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { restorePurchases } from '@/services/purchases';
import { useFeedState } from '@/state/feedState';

const PRIVACY_URL = 'https://example.com/privacy';
const TERMS_URL = 'https://example.com/terms';
const SUPPORT_EMAIL = 'support@example.com';

export default function SettingsScreen() {
  const { reset } = useFeedState();

  const onReset = () => {
    Alert.alert('Reset state?', 'Both sides will be marked as full.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: reset },
    ]);
  };

  const onRestore = async () => {
    const ok = await restorePurchases();
    Alert.alert(
      ok ? 'Restored' : 'Nothing to restore',
      ok ? 'Your subscription is active.' : 'No active subscription was found.',
    );
  };

  const openManageSubscription = () => {
    const url =
      Platform.OS === 'ios'
        ? 'https://apps.apple.com/account/subscriptions'
        : 'https://play.google.com/store/account/subscriptions';
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Section title="Subscription">
        <Row label="Restore purchases" onPress={onRestore} />
        <Row label="Manage subscription" onPress={openManageSubscription} />
      </Section>

      <Section title="App">
        <Row label="Reset (both sides full)" onPress={onReset} destructive />
      </Section>

      <Section title="About">
        <Row label="Privacy policy" onPress={() => Linking.openURL(PRIVACY_URL)} />
        <Row label="Terms of use" onPress={() => Linking.openURL(TERMS_URL)} />
        <Row label="Contact support" onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} />
      </Section>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Row({
  label,
  onPress,
  destructive,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
    >
      <Text style={[styles.rowLabel, destructive && { color: '#B33A1F' }]}>{label}</Text>
      <Text style={styles.rowChevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 24 },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7A6A65',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 12,
  },
  sectionBody: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EFE3DC',
  },
  rowLabel: { fontSize: 15, color: '#3D2418' },
  rowChevron: { fontSize: 20, color: '#B0A39E' },
});
