import { describe, it, expect } from 'vitest';
import {
  buildPaymentDataRequest,
  extractTokenPayload,
  isGooglePayCanceledError,
  type GooglePayRequestOptions,
} from '../googlePayService';

describe('googlePayService Unit Tests', () => {
  describe('buildPaymentDataRequest', () => {
    it('should build a valid Google Pay v2 PaymentDataRequest with dynamic real price', () => {
      const options: GooglePayRequestOptions = {
        priceAmount: 990000,
        currencyCode: 'VND',
        merchantName: 'Orca ERP',
      };

      const request = buildPaymentDataRequest(options);

      expect(request.apiVersion).toBe(2);
      expect(request.apiVersionMinor).toBe(0);
      expect(request.transactionInfo).toEqual({
        totalPrice: '990000.00',
        totalPriceStatus: 'FINAL',
        currencyCode: 'VND',
        countryCode: 'VN',
      });
      expect(request.allowedPaymentMethods).toBeDefined();
      expect(request.allowedPaymentMethods.length).toBeGreaterThan(0);
      const cardMethod = request.allowedPaymentMethods[0];
      expect(cardMethod.type).toBe('CARD');
      expect(cardMethod.tokenizationSpecification?.type).toBe('PAYMENT_GATEWAY');
    });

    it('should default currencyCode to VND and countryCode to VN when currencyCode is omitted', () => {
      const options: GooglePayRequestOptions = {
        priceAmount: 320000,
      };

      const request = buildPaymentDataRequest(options);

      expect(request.transactionInfo.totalPrice).toBe('320000.00');
      expect(request.transactionInfo.currencyCode).toBe('VND');
      expect(request.transactionInfo.countryCode).toBe('VN');
      expect(request.transactionInfo.totalPriceStatus).toBe('FINAL');
    });

    it('should throw an error if priceAmount is zero or negative', () => {
      expect(() => buildPaymentDataRequest({ priceAmount: 0 })).toThrow();
      expect(() => buildPaymentDataRequest({ priceAmount: -1000 })).toThrow();
    });

    it('should throw an error if priceAmount is NaN', () => {
      expect(() => buildPaymentDataRequest({ priceAmount: Number.NaN })).toThrow();
    });
  });

  describe('extractTokenPayload', () => {
    it('should extract paymentToken, cardNetwork, and lastFour from valid paymentData', () => {
      const paymentData = {
        paymentMethodData: {
          tokenizationData: {
            token: '{"signature":"test_sig","signedMessage":"test_msg"}',
          },
          info: {
            cardNetwork: 'MASTERCARD',
            cardDetails: '1234',
          },
        },
      };

      const result = extractTokenPayload(paymentData as any);

      expect(result).toEqual({
        paymentToken: '{"signature":"test_sig","signedMessage":"test_msg"}',
        cardNetwork: 'MASTERCARD',
        lastFour: '1234',
      });
    });

    it('should provide safe fallbacks (VISA, 4242) when info is undefined or missing', () => {
      const paymentDataWithoutInfo = {
        paymentMethodData: {
          tokenizationData: {
            token: 'example_token_string',
          },
        },
      };

      const result = extractTokenPayload(paymentDataWithoutInfo as any);

      expect(result).toEqual({
        paymentToken: 'example_token_string',
        cardNetwork: 'VISA',
        lastFour: '4242',
      });
    });

    it('should provide safe fallbacks when info fields are partially missing', () => {
      const paymentDataWithEmptyInfo = {
        paymentMethodData: {
          tokenizationData: {
            token: 'token_abc',
          },
          info: {},
        },
      };

      const result = extractTokenPayload(paymentDataWithEmptyInfo as any);

      expect(result).toEqual({
        paymentToken: 'token_abc',
        cardNetwork: 'VISA',
        lastFour: '4242',
      });
    });
  });

  describe('isGooglePayCanceledError', () => {
    it('should return true when statusCode is CANCELED', () => {
      expect(isGooglePayCanceledError({ statusCode: 'CANCELED' })).toBe(true);
    });

    it('should return true when statusMessage is CANCELED', () => {
      expect(isGooglePayCanceledError({ statusMessage: 'CANCELED' })).toBe(true);
    });

    it('should return false for other error codes such as DEVELOPER_ERROR', () => {
      expect(isGooglePayCanceledError({ statusCode: 'DEVELOPER_ERROR' })).toBe(false);
      expect(isGooglePayCanceledError({ statusMessage: 'INTERNAL_ERROR' })).toBe(false);
    });

    it('should return false for null, undefined, non-objects, or empty errors', () => {
      expect(isGooglePayCanceledError(null)).toBe(false);
      expect(isGooglePayCanceledError(undefined)).toBe(false);
      expect(isGooglePayCanceledError('CANCELED')).toBe(false);
      expect(isGooglePayCanceledError(123)).toBe(false);
      expect(isGooglePayCanceledError({})).toBe(false);
      expect(isGooglePayCanceledError(new Error('Network error'))).toBe(false);
    });
  });
});
