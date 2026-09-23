import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Purchases, { type PurchasesOffering, type PurchasesPackage } from 'react-native-purchases';
import { fetchOffering, restorePurchases, useSubscription } from '@/services/purchases';

const PRIVACY_URL = 'https://example.com/privacy';
const TERMS_URL = 'https://example.com/terms';

export default function PaywallScreen() {
  const router = useRouter();
  const { isSubscribed } = useSubscription();
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (isSubscribed) router.replace('/');
  }, [isSubscribed, router]);

  useEffect(() => {
    (async () => {
      const o = await fetchOffering();
      setOffering(o);
      setLoading(false);
    })();
  }, []);

  const buy = async (pkg: PurchasesPackage) => {
    setPurchasing(true);
    try {
      await Purchases.purchasePackage(pkg);
      router.replace('/');
    } catch (e: unknown) {
      const err = e as { userCancelled?: boolean; message?: string };
      if (!err.userCancelled) {
        Alert.alert('Purchase failed', err.message ?? 'Please try again.');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const restore = async () => {
    const ok = await restorePurchases();
    if (ok) router.replace('/');
    else Alert.alert('No purchases found', 'We could not find an active subscription on this account.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.emoji}>🤱</Text>
        <Text style={styles.title}>The Boob App</Text>
        <Text style={styles.subtitle}>
          Never wonder which side you used last. Mommy brain — solved.
        </Text>

        <View style={styles.bullets}>
          <Bullet text="One-tap tracking" />
          <Bullet text="Works offline" />
          <Bullet text="No ads, ever" />
          <Bullet text="7-day free trial" />
        </View>

        <View style={styles.plans}>
          {loading ? (
            <ActivityIndicator />
          ) : offering ? (
            <>
              {offering.annual && (
                <PlanButton
                  title="Annual"
                  price={offering.annual.product.priceString}
                  subtitle="Best value · 7-day free trial"
                  highlight
                  disabled={purchasing}
                  onPress={() => buy(offering.annual!)}
                />
              )}
              {offering.monthly && (
                <PlanButton
                  title="Monthly"
                  price={`${offering.monthly.product.priceString} / mo`}
                  subtitle="7-day free trial"
                  disabled={purchasing}
                  onPress={() => buy(offering.monthly!)}
                />
              )}
            </>
          ) : (
            <Text style={styles.noOffering}>
              Subscriptions aren&apos;t available right now. Make sure you&apos;re running a
              development build (not Expo Go) and that your store products are configured.
            </Text>
          )}
        </View>

        <Pressable onPress={restore} style={styles.linkBtn}>
          <Text style={styles.linkTxt}>Restore purchases</Text>
        </Pressable>

        <Text style={styles.fineprint}>
          Subscriptions auto-renew until canceled. Manage or cancel anytime in your
          App Store or Google Play account settings.
        </Text>

        <View style={styles.legalRow}>
          <Pressable onPress={() => Linking.openURL(PRIVACY_URL)}>
            <Text style={styles.legalLink}>Privacy</Text>
          </Pressable>
          <Text style={styles.legalDot}>·</Text>
          <Pressable onPress={() => Linking.openURL(TERMS_URL)}>
            <Text style={styles.legalLink}>Terms</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletTxt}>{text}</Text>
    </View>
  );
}

function PlanButton({
  title,
  price,
  subtitle,
  highlight,
  disabled,
  onPress,
}: {
  title: string;
  price: string;
  subtitle: string;
  highlight?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.plan,
        highlight && styles.planHighlight,
        pressed && { opacity: 0.85 },
        disabled && { opacity: 0.6 },
      ]}
    >
      <View>
        <Text style={[styles.planTitle, highlight && styles.planTitleHighlight]}>
          {title}
        </Text>
        <Text style={[styles.planSubtitle, highlight && styles.planSubtitleHighlight]}>
          {subtitle}
        </Text>
      </View>
      <Text style={[styles.planPrice, highlight && styles.planPriceHighlight]}>
        {price}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24, gap: 16 },
  emoji: { fontSize: 56, textAlign: 'center' },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', color: '#3D2418' },
  subtitle: { fontSize: 15, color: '#7A6A65', textAlign: 'center', marginBottom: 8 },
  bullets: { gap: 6, alignSelf: 'center', marginVertical: 12 },
  bulletRow: { flexDirection: 'row', gap: 8 },
  bulletDot: { color: '#C46A4F', fontWeight: '700' },
  bulletTxt: { color: '#3D2418', fontSize: 15 },
  plans: { gap: 12, marginTop: 8 },
  plan: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E8D8D2',
    backgroundColor: '#FFFFFF',
  },
  planHighlight: {
    borderColor: '#C46A4F',
    backgroundColor: '#FFC4B0',
  },
  planTitle: { fontWeight: '700', fontSize: 17, color: '#3D2418' },
  planTitleHighlight: { color: '#5A2A1A' },
  planSubtitle: { fontSize: 12, color: '#7A6A65', marginTop: 2 },
  planSubtitleHighlight: { color: '#5A2A1A' },
  planPrice: { fontWeight: '700', fontSize: 16, color: '#3D2418' },
  planPriceHighlight: { color: '#5A2A1A' },
  noOffering: { color: '#7A6A65', fontSize: 13, textAlign: 'center' },
  linkBtn: { alignSelf: 'center', padding: 8 },
  linkTxt: { color: '#C46A4F', fontWeight: '600' },
  fineprint: { fontSize: 11, color: '#998A85', textAlign: 'center', lineHeight: 16 },
  legalRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 4 },
  legalLink: { color: '#7A6A65', textDecorationLine: 'underline', fontSize: 12 },
  legalDot: { color: '#7A6A65' },
});
