import { describe, it, expect } from 'vitest';
import { FeatureGate, createFeatureGate, checkFeatureAccess, FEATURES } from './featureTier';
import type { ApiCredentials } from '../store/types';

describe('FeatureGate', () => {
  const freeCredentials: ApiCredentials = {
    premiumTier: false,
  };

  const premiumCredentials: ApiCredentials = {
    fastf1ApiKey: 'test-key',
    premiumTier: true,
  };

  describe('isFeatureAvailable', () => {
    it('should allow free features for free tier', () => {
      const gate = new FeatureGate(freeCredentials);
      expect(gate.isFeatureAvailable('basic-telemetry')).toBe(true);
      expect(gate.isFeatureAvailable('historical-data')).toBe(true);
      expect(gate.isFeatureAvailable('basic-charts')).toBe(true);
    });

    it('should block premium features for free tier', () => {
      const gate = new FeatureGate(freeCredentials);
      expect(gate.isFeatureAvailable('high-frequency-updates')).toBe(false);
      expect(gate.isFeatureAvailable('extended-telemetry')).toBe(false);
      expect(gate.isFeatureAvailable('extended-charts')).toBe(false);
    });

    it('should allow all features for premium tier', () => {
      const gate = new FeatureGate(premiumCredentials);

      FEATURES.forEach((feature) => {
        expect(gate.isFeatureAvailable(feature.id)).toBe(true);
      });
    });

    it('should return false for unknown features', () => {
      const gate = new FeatureGate(freeCredentials);
      expect(gate.isFeatureAvailable('unknown-feature')).toBe(false);
    });
  });

  describe('getCurrentTier', () => {
    it('should return free for free credentials', () => {
      const gate = new FeatureGate(freeCredentials);
      expect(gate.getCurrentTier()).toBe('free');
    });

    it('should return premium for premium credentials', () => {
      const gate = new FeatureGate(premiumCredentials);
      expect(gate.getCurrentTier()).toBe('premium');
    });
  });

  describe('getAvailableFeatures', () => {
    it('should return only free features for free tier', () => {
      const gate = new FeatureGate(freeCredentials);
      const available = gate.getAvailableFeatures();

      expect(available.every((f) => f.tier === 'free')).toBe(true);
    });

    it('should return all features for premium tier', () => {
      const gate = new FeatureGate(premiumCredentials);
      const available = gate.getAvailableFeatures();

      expect(available.length).toBe(FEATURES.length);
    });
  });

  describe('getLockedFeatures', () => {
    it('should return premium features for free tier', () => {
      const gate = new FeatureGate(freeCredentials);
      const locked = gate.getLockedFeatures();

      expect(locked.every((f) => f.tier === 'premium')).toBe(true);
      expect(locked.length).toBeGreaterThan(0);
    });

    it('should return no locked features for premium tier', () => {
      const gate = new FeatureGate(premiumCredentials);
      const locked = gate.getLockedFeatures();

      expect(locked.length).toBe(0);
    });
  });

  describe('getFeaturesByCategory', () => {
    it('should return features for specific category', () => {
      const gate = new FeatureGate(freeCredentials);
      const dataFeatures = gate.getFeaturesByCategory('data');

      expect(dataFeatures.every((f) => f.category === 'data')).toBe(true);
      expect(dataFeatures.length).toBeGreaterThan(0);
    });
  });

  describe('createFeatureGate', () => {
    it('should create a feature gate instance', () => {
      const gate = createFeatureGate(freeCredentials);
      expect(gate).toBeInstanceOf(FeatureGate);
    });
  });

  describe('checkFeatureAccess', () => {
    it('should check feature access correctly', () => {
      expect(checkFeatureAccess(freeCredentials, 'basic-telemetry')).toBe(true);
      expect(checkFeatureAccess(freeCredentials, 'extended-telemetry')).toBe(false);
      expect(checkFeatureAccess(premiumCredentials, 'extended-telemetry')).toBe(true);
    });
  });
});
