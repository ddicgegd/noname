// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import HoloCardPaymentSheet, { type PricingPlan } from '../HoloCardPaymentSheet';
import * as googlePayService from '../../services/googlePayService';
import * as subscriptionService from '../../services/subscriptionService';
import * as unifiedAuth from '../../lib/unifiedAuth';

// Mock DOM APIs not available in JSDOM
if (typeof window !== 'undefined') {
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  }

  if (!window.IntersectionObserver) {
    class MockIntersectionObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
    Object.defineProperty(window, 'IntersectionObserver', {
      writable: true,
      value: MockIntersectionObserver,
    });
  }

  if (!window.ResizeObserver) {
    class MockResizeObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
    Object.defineProperty(window, 'ResizeObserver', {
      writable: true,
      value: MockResizeObserver,
    });
  }
}

vi.mock('../../services/googlePayService', () => ({
  requestGooglePayPayment: vi.fn(),
  isGooglePayCanceledError: vi.fn((err: unknown) => {
    if (!err || typeof err !== 'object') return false;
    const e = err as { statusCode?: string; statusMessage?: string };
    return e.statusCode === 'CANCELED' || e.statusMessage === 'CANCELED';
  }),
  isGooglePayReady: vi.fn().mockResolvedValue(true),
  loadGooglePayScript: vi.fn().mockResolvedValue(undefined),
  getPaymentsClient: vi.fn(),
  buildPaymentDataRequest: vi.fn(),
  extractTokenPayload: vi.fn(),
}));

vi.mock('../../services/subscriptionService', () => ({
  registerGooglePaySubscription: vi.fn(),
  purchaseOneTimeSubscription: vi.fn(),
}));

vi.mock('../../lib/unifiedAuth', () => ({
  getUnifiedAccessToken: vi.fn(() => 'mock-jwt-token'),
  getEffectiveAccessToken: vi.fn(() => 'mock-jwt-token'),
}));

vi.mock('../../lib/api', () => ({
  getUnifiedAccessToken: vi.fn(() => 'mock-jwt-token'),
  getApiBaseUrl: vi.fn(() => 'http://localhost:8080'),
}));

describe('HoloCardPaymentSheet - Google Pay Native Integration (T002)', () => {
  const mockPlan: PricingPlan = {
    id: 'pro',
    planCode: 'PLATINUM_12M',
    priceAmount: 990000,
    name: 'Gói Chuyên Nghiệp',
    price: '990.000₫',
    period: '/năm',
    features: ['Feature 1', 'Feature 2'],
    buttonText: 'Nâng cấp ngay',
    bgGradient: 'from-amber-500 to-yellow-600',
    hoverBorderColor: 'border-amber-400',
    checkIconColor: 'text-amber-500',
    buttonClass: 'bg-amber-500',
    foilTint: 'gold',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    rimColor: '#f59e0b',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  it('1. MUST call requestGooglePayPayment with active plan price amount (NOT 0.00) when user clicks pay', async () => {
    const mockRequestGPay = vi.mocked(googlePayService.requestGooglePayPayment);
    mockRequestGPay.mockResolvedValueOnce({
      paymentToken: 'valid_gpay_token_123',
      cardNetwork: 'VISA',
      lastFour: '4242',
    });

    vi.mocked(subscriptionService.registerGooglePaySubscription).mockResolvedValueOnce({
      success: true,
      planName: mockPlan.name,
      expiryTime: '2027-10-15T00:00:00Z',
    } as any);

    render(
      <HoloCardPaymentSheet
        plan={mockPlan}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const ctaButton = screen.getByRole('button', { name: /Dùng thử miễn phí với Google Pay/i });
    fireEvent.click(ctaButton);

    await waitFor(() => {
      expect(mockRequestGPay).toHaveBeenCalledTimes(1);
    }, { timeout: 1000 });

    const callArgs = mockRequestGPay.mock.calls[0][0];
    expect(callArgs.priceAmount).toBeDefined();
    expect(callArgs.priceAmount).toBe(990000);
    expect(callArgs.priceAmount).not.toBe(0);
    expect(callArgs.priceAmount).not.toBe(0.00);
  });

  it('2. MUST pass extracted token, cardNetwork, and lastFour from requestGooglePayPayment to registerGooglePaySubscription (NOT hardcoded mock)', async () => {
    const mockExtractedResult = {
      paymentToken: 'real_production_native_token_xyz_888',
      cardNetwork: 'MASTERCARD',
      lastFour: '9876',
    };

    const mockRequestGPay = vi.mocked(googlePayService.requestGooglePayPayment);
    mockRequestGPay.mockResolvedValueOnce(mockExtractedResult);

    const mockRegisterSubscription = vi.mocked(subscriptionService.registerGooglePaySubscription);
    mockRegisterSubscription.mockResolvedValueOnce({
      success: true,
      planName: mockPlan.name,
      expiryTime: '2027-10-15T00:00:00Z',
    } as any);

    render(
      <HoloCardPaymentSheet
        plan={mockPlan}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const ctaButton = screen.getByRole('button', { name: /Dùng thử miễn phí với Google Pay/i });
    fireEvent.click(ctaButton);

    await waitFor(() => {
      expect(mockRegisterSubscription).toHaveBeenCalledTimes(1);
    }, { timeout: 1000 });

    // Verify it received the real extracted token payload, NOT the hardcoded mock string 'gpay_client_token'
    expect(mockRegisterSubscription).toHaveBeenCalledWith({
      planCode: 'PLATINUM_12M',
      paymentToken: 'real_production_native_token_xyz_888',
      cardNetwork: 'MASTERCARD',
      lastFour: '9876',
    });

    expect(mockRegisterSubscription).not.toHaveBeenCalledWith(
      expect.objectContaining({
        paymentToken: 'gpay_client_token',
      })
    );
  });

  it('3. MUST handle Google Pay CANCELED gracefully: turn off processing, show no error, and NEVER call registerGooglePaySubscription', async () => {
    const mockRequestGPay = vi.mocked(googlePayService.requestGooglePayPayment);
    mockRequestGPay.mockRejectedValueOnce({ statusCode: 'CANCELED' });

    const mockRegisterSubscription = vi.mocked(subscriptionService.registerGooglePaySubscription);

    render(
      <HoloCardPaymentSheet
        plan={mockPlan}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const ctaButton = screen.getByRole('button', { name: /Dùng thử miễn phí với Google Pay/i });
    fireEvent.click(ctaButton);

    await waitFor(() => {
      // Button must NOT be disabled (processing turned off)
      expect((ctaButton as HTMLButtonElement).disabled).toBe(false);
      expect(screen.queryByText(/Đang xử lý giao dịch/i)).toBeNull();
    }, { timeout: 1000 });

    // registerGooglePaySubscription MUST NEVER be called
    expect(mockRegisterSubscription).not.toHaveBeenCalled();

    // No error message banner should be displayed
    expect(screen.queryByText(/Thanh toán chưa thành công/i)).toBeNull();
  });
});
