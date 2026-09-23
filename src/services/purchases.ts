import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
} from 'react-native-purchases';

/**
 * Single entitlement we check throughout the app. Both the monthly and annual
 * plans should be configured in RevenueCat to grant this entitlement.
 */
export const PRO_ENTITLEMENT = 'pro';

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
const BYPASS = process.env.EXPO_PUBLIC_BYPASS_PAYWALL === '1';

let configured = false;

export function configurePurchases() {
  if (configured) return;
  const apiKey = Platform.select({ ios: IOS_KEY, android: ANDROID_KEY });
  if (!apiKey || apiKey.includes('REPLACE_ME')) {
    // No key configured — running in dev / Expo Go. Skip.
    return;
  }
  Purchases.configure({ apiKey });
  configured = true;
}

export function isEntitled(info: CustomerInfo | null): boolean {
  if (BYPASS) return true;
  if (!info) return false;
  return info.entitlements.active[PRO_ENTITLEMENT] !== undefined;
}

/**
 * Hook that returns the current subscription state. Refreshes when the SDK
 * reports a customer-info update (e.g., after a purchase or restore).
 */
export function useSubscription() {
  const [info, setInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (BYPASS || !configured) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const current = await Purchases.getCustomerInfo();
        if (!cancelled) setInfo(current);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const listener = (next: CustomerInfo) => setInfo(next);
    Purchases.addCustomerInfoUpdateListener(listener);

    return () => {
      cancelled = true;
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, []);

  return {
    loading,
    isSubscribed: isEntitled(info),
    info,
  };
}

export async function fetchOffering(): Promise<PurchasesOffering | null> {
  if (!configured) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch {
    return null;
  }
}

export async function restorePurchases(): Promise<boolean> {
  if (!configured) return false;
  try {
    const info = await Purchases.restorePurchases();
    return isEntitled(info);
  } catch {
    return false;
  }
}
