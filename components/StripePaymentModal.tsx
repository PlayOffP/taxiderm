import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { X } from 'lucide-react-native';

interface StripePaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (paymentIntentId: string) => void;
  jobId: string;
  amount: number;
  paymentType: 'deposit' | 'final';
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

export default function StripePaymentModal({
  visible,
  onClose,
  onSuccess,
  jobId,
  amount,
  paymentType,
}: StripePaymentModalProps) {
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createPaymentIntent = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error('Supabase configuration is missing');
      }

      console.log('Creating payment intent...', { jobId, amount, paymentType });

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/stripe-payment/create-payment-intent`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jobId,
            amount,
            paymentType,
          }),
        }
      );

      const data = await response.json();
      console.log('Payment intent response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent');
      }

      setClientSecret(data.clientSecret);
    } catch (err) {
      console.error('Error creating payment intent:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize payment');
      Alert.alert('Error', 'Failed to initialize payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (visible && !clientSecret) {
      createPaymentIntent();
    }
  }, [visible]);

  const handleMessage = async (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('Received message from WebView:', message);

      if (message.type === 'payment_success') {
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/stripe-payment/confirm-payment`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              jobId,
              paymentIntentId: message.paymentIntentId,
              amount,
              paymentType,
              processingFee: message.processingFee || 0,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to confirm payment');
        }

        onSuccess(message.paymentIntentId);
        onClose();
      } else if (message.type === 'payment_error') {
        Alert.alert('Payment Failed', message.error || 'An error occurred during payment');
      }
    } catch (err) {
      console.error('Error handling payment message:', err);
      Alert.alert('Error', 'Failed to process payment confirmation');
    }
  };

  const stripeHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
        <script src="https://js.stripe.com/v3/"></script>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            background: #F9FAFB;
          }
          #payment-form {
            max-width: 500px;
            margin: 0 auto;
          }
          #card-element {
            background: white;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid #E5E7EB;
            margin-bottom: 16px;
          }
          #submit-button {
            width: 100%;
            background: #059669;
            color: white;
            padding: 14px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
          }
          #submit-button:hover {
            background: #047857;
          }
          #submit-button:disabled {
            background: #D1D5DB;
            cursor: not-allowed;
          }
          #error-message {
            color: #EF4444;
            margin-top: 12px;
            font-size: 14px;
          }
          .amount-display {
            background: white;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid #E5E7EB;
            margin-bottom: 20px;
            text-align: center;
          }
          .amount-label {
            font-size: 14px;
            color: #6B7280;
            margin-bottom: 4px;
          }
          .amount-value {
            font-size: 32px;
            font-weight: 700;
            color: #111827;
          }
          .processing {
            text-align: center;
            padding: 20px;
          }
        </style>
      </head>
      <body>
        <form id="payment-form">
          <div class="amount-display">
            <div class="amount-label">${paymentType === 'deposit' ? 'Deposit Amount' : 'Final Payment'}</div>
            <div class="amount-value">$${amount.toFixed(2)}</div>
          </div>
          <div id="card-element"></div>
          <button id="submit-button" type="submit">
            <span id="button-text">Pay Now</span>
            <span id="spinner" style="display: none;">Processing...</span>
          </button>
          <div id="error-message"></div>
        </form>

        <script>
          const stripe = Stripe('${STRIPE_PUBLISHABLE_KEY}');
          const elements = stripe.elements();

          const cardElement = elements.create('card', {
            hidePostalCode: false,
            style: {
              base: {
                fontSize: '16px',
                color: '#111827',
                '::placeholder': {
                  color: '#9CA3AF',
                },
              },
            },
          });

          cardElement.mount('#card-element');

          const form = document.getElementById('payment-form');
          const submitButton = document.getElementById('submit-button');
          const buttonText = document.getElementById('button-text');
          const spinner = document.getElementById('spinner');
          const errorMessage = document.getElementById('error-message');

          form.addEventListener('submit', async (event) => {
            event.preventDefault();

            submitButton.disabled = true;
            buttonText.style.display = 'none';
            spinner.style.display = 'inline';
            errorMessage.textContent = '';

            const { error, paymentIntent } = await stripe.confirmCardPayment(
              '${clientSecret}',
              {
                payment_method: {
                  card: cardElement,
                },
              }
            );

            if (error) {
              errorMessage.textContent = error.message;
              submitButton.disabled = false;
              buttonText.style.display = 'inline';
              spinner.style.display = 'none';

              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'payment_error',
                error: error.message,
              }));
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'payment_success',
                paymentIntentId: paymentIntent.id,
              }));
            }
          });
        </script>
      </body>
    </html>
  `;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Secure Payment</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#059669" />
            <Text style={styles.loadingText}>Initializing payment...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={createPaymentIntent}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && clientSecret && (
          <WebView
            source={{ html: stripeHtml }}
            style={styles.webview}
            onMessage={handleMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
