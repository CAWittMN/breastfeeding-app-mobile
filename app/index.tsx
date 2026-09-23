import { Link, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChestIllustration } from '@/components/ChestIllustration';
import { useFeedState } from '@/state/feedState';
import { useSubscription } from '@/services/purchases';

export default function MainScreen() {
  const router = useRouter();
  const { loading, isSubscribed } = useSubscription();
  const { hydrated, fullSide, lastFedAt, recordFeed, reset } = useFeedState();

  // Gate behind paywall.
  useEffect(() => {
    if (!loading && !isSubscribed) {
      router.replace('/paywall');
    }
  }, [loading, isSubscribed, router]);

  if (loading || !hydrated) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!isSubscribed) return null; // redirecting to paywall

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Which one did I use last?</Text>
        <Link href="/settings" asChild>
          <Pressable style={styles.settingsBtn} accessibilityLabel="Settings">
            <Text style={styles.settingsTxt}>⚙︎</Text>
          </Pressable>
        </Link>
      </View>

      <View style={styles.body}>
        {fullSide === 'both' && (
          <View style={styles.instructions}>
            <Text style={styles.instructionsTitle}>Both sides loaded. 🍼</Text>
            <Text style={styles.instructionsBody}>
              Next time you feed, tap whichever one you used and we&apos;ll keep
              track from there.
            </Text>
            <Text style={styles.instructionsAside}>
              …unless you already remember which side you used last — in which
              case, tap away. (And maybe ask yourself why you downloaded this
              app.)
            </Text>
          </View>
        )}
        <ChestIllustration
          fullSide={fullSide}
          onTapLeft={() => recordFeed('left')}
          onTapRight={() => recordFeed('right')}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.lastFed}>
          {lastFedAt
            ? `Last fed: ${formatRelative(lastFedAt)}`
            : 'No feeds recorded yet.'}
        </Text>
        <Pressable onPress={reset} style={styles.resetBtn}>
          <Text style={styles.resetTxt}>Reset (both full)</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#3D2418' },
  settingsBtn: { padding: 8 },
  settingsTxt: { fontSize: 22 },
  body: { flex: 1, justifyContent: 'center' },
  instructions: {
    paddingHorizontal: 12,
    paddingBottom: 24,
    gap: 8,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3D2418',
    textAlign: 'center',
  },
  instructionsBody: {
    fontSize: 15,
    color: '#5A4A45',
    textAlign: 'center',
    lineHeight: 21,
  },
  instructionsAside: {
    fontSize: 13,
    color: '#8A7A75',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 19,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
    gap: 12,
  },
  lastFed: { color: '#7A6A65', fontSize: 13 },
  resetBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: '#F1E2DA',
  },
  resetTxt: { color: '#5A2A1A', fontWeight: '600' },
});
