/**
 * Google Pay Web Client SDK Service
 * Handles loading Google Pay JavaScript library, checking readiness,
 * constructing payment requests with real pricing, and extracting payment tokens.
 */

export interface GooglePayRequestOptions {
  priceAmount: number;
  currencyCode?: string;
  merchantName?: string;
}

export interface ExtractedTokenPayload {
  paymentToken: string;
  cardNetwork: string;
  lastFour: string;
}

const GPAY_SCRIPT_URL = 'https://pay.google.com/gp/p/js/pay.js';

export function loadGooglePayScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  const win = window as any;
  if (win.google?.payments?.api?.PaymentsClient) {
    return Promise.resolve();
  }

  const existingScript = document.querySelector(`script[src="${GPAY_SCRIPT_URL}"]`);
  if (existingScript) {
    return new Promise((resolve, reject) => {
      if (win.google?.payments?.api?.PaymentsClient) {
        resolve();
      } else {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () =>
          reject(new Error('Failed to load Google Pay script'))
        );
      }
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GPAY_SCRIPT_URL;
    script.async = true;
    script.setAttribute('data-gpay-loaded', 'true');
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Pay script'));
    document.body.appendChild(script);
  });
}

export function getPaymentsClient(
  environment: 'TEST' | 'PRODUCTION' = ((import.meta as any).env?.VITE_GPAY_ENVIRONMENT as 'TEST' | 'PRODUCTION') || 'TEST'
): any {
  if (typeof window === 'undefined' || !(window as any).google?.payments?.api?.PaymentsClient) {
    throw new Error('Google Pay PaymentsClient is not available. Ensure loadGooglePayScript() has completed.');
  }
  return new (window as any).google.payments.api.PaymentsClient({ environment });
}

export function buildPaymentDataRequest(options: GooglePayRequestOptions): any {
  if (
    typeof options.priceAmount !== 'number' ||
    Number.isNaN(options.priceAmount) ||
    options.priceAmount <= 0
  ) {
    throw new Error('Invalid priceAmount: must be a positive number');
  }

  return {
    apiVersion: 2,
    apiVersionMinor: 0,
    allowedPaymentMethods: [
      {
        type: 'CARD',
        parameters: {
          allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
          allowedCardNetworks: ['MASTERCARD', 'VISA', 'JCB', 'AMEX'],
          billingAddressRequired: false,
        },
        tokenizationSpecification: {
          type: 'PAYMENT_GATEWAY',
          parameters: {
            gateway: 'example',
            gatewayMerchantId: 'exampleGatewayMerchantId',
          },
        },
      },
    ],
    merchantInfo: {
      merchantId: '12345678901234567890',
      merchantName: options.merchantName || 'ERP Platform Subscription',
    },
    transactionInfo: {
      totalPrice: options.priceAmount.toFixed(2),
      totalPriceStatus: 'FINAL',
      currencyCode: options.currencyCode || 'VND',
      countryCode: 'VN',
    },
  };
}

export function extractTokenPayload(paymentData: any): ExtractedTokenPayload {
  const paymentMethodData = paymentData?.paymentMethodData;
  const token = paymentMethodData?.tokenizationData?.token || '';
  const cardNetwork = paymentMethodData?.info?.cardNetwork || 'VISA';
  const lastFour = paymentMethodData?.info?.cardDetails || '4242';

  return {
    paymentToken: token,
    cardNetwork,
    lastFour,
  };
}

export function isGooglePayCanceledError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) {
    return false;
  }
  const e = err as Record<string, unknown>;
  return e.statusCode === 'CANCELED' || e.statusMessage === 'CANCELED';
}

export async function isGooglePayReady(client: any): Promise<boolean> {
  const allowedPaymentMethods = [
    {
      type: 'CARD',
      parameters: {
        allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
        allowedCardNetworks: ['MASTERCARD', 'VISA', 'JCB', 'AMEX'],
      },
    },
  ];

  try {
    const response = await client.isReadyToPay({
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods,
    });
    return !!response?.result;
  } catch {
    return false;
  }
}

export async function requestGooglePayPayment(
  options: GooglePayRequestOptions
): Promise<ExtractedTokenPayload> {
  await loadGooglePayScript();
  const client = getPaymentsClient();
  const paymentDataRequest = buildPaymentDataRequest(options);
  const paymentData = await client.loadPaymentData(paymentDataRequest);
  return extractTokenPayload(paymentData);
}
