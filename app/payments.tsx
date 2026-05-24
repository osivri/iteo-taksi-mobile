import { useCallback, useState } from 'react';

import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Link, router, useFocusEffect } from 'expo-router';

import Colors, { IteoColors } from '@/constants/Colors';

import { useColorScheme } from '@/components/useColorScheme';

import { api, ApiResponse } from '@/lib/api';



interface Payment {
  id: string;
  type: string;
  amount: number;
  status: string;
  paidAt: string | null;
}

const paymentStatusLabels: Record<string, string> = {
  PENDING: 'Beklemede',
  SUCCESS: 'Başarılı',
  FAILED: 'Başarısız',
  CANCELLED: 'İptal',
  REFUNDED: 'İade',
};

const paymentTypeLabels: Record<string, string> = {
  DUES: 'Oda Aidatı',
  APP_FEE: 'Uygulama Ücreti',
  SERVICE_FEE: 'Hizmet Bedeli',
  OTHER: 'Diğer',
};



export default function PaymentsScreen() {

  const colorScheme = useColorScheme() ?? 'light';

  const theme = Colors[colorScheme];

  const [items, setItems] = useState<Payment[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [paying, setPaying] = useState(false);



  const load = useCallback(async () => {

    const res = await api.get<ApiResponse<Payment> & { items: Payment[] }>('/payments');

    setItems(res.items ?? []);

  }, []);



  useFocusEffect(

    useCallback(() => {

      setLoading(true);

      load()

        .catch((e) => setError((e as Error).message))

        .finally(() => setLoading(false));

    }, [load]),

  );



  async function startPayment() {

    setPaying(true);

    setError(null);

    try {

      const res = await api.post<ApiResponse<{ payment: Payment; checkoutUrl: string }>>('/payments/checkout', {

        type: 'DUES',

        amount: 150,

      });

      const payment = res.data?.payment;

      if (!payment) throw new Error('Ödeme oluşturulamadı');



      await api.post('/payments/webhook', {

        paymentId: payment.id,

        status: 'SUCCESS',

        webhookSecret: 'dev-webhook-secret',

      });



      router.push({

        pathname: '/payment/result',

        params: { status: 'SUCCESS', amount: String(payment.amount), id: payment.id },

      });

    } catch (e) {

      setError((e as Error).message);

      router.push({ pathname: '/payment/result', params: { status: 'FAILED' } });

    } finally {

      setPaying(false);

    }

  }



  return (

    <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>

      <Pressable style={styles.payBtn} onPress={startPayment} disabled={paying}>

        <Text style={styles.payBtnText}>{paying ? 'İşleniyor...' : 'Aidat Öde (150 ₺)'}</Text>

      </Pressable>



      {error && <Text style={styles.error}>{error}</Text>}

      {loading ? (

        <ActivityIndicator color={IteoColors.yellow} style={{ marginTop: 24 }} />

      ) : (

        <FlatList

          data={items}

          keyExtractor={(item) => item.id}

          contentContainerStyle={{ padding: 16, gap: 8 }}

          ListEmptyComponent={<Text style={{ color: theme.textSecondary, textAlign: 'center' }}>Ödeme yok</Text>}

          renderItem={({ item }) => (

            <Link href={`/payment/${item.id}`} asChild>

              <Pressable style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>

                <Text style={{ color: theme.text, fontWeight: '600' }}>
                  {paymentTypeLabels[item.type] ?? item.type}
                </Text>
                <Text style={{ color: theme.textSecondary, marginTop: 4 }}>
                  {item.amount.toLocaleString('tr-TR')} ₺ · {paymentStatusLabels[item.status] ?? item.status}
                </Text>

              </Pressable>

            </Link>

          )}

        />

      )}

    </View>

  );

}



const styles = StyleSheet.create({

  container: { flex: 1 },

  payBtn: {

    margin: 16,

    backgroundColor: IteoColors.yellow,

    borderRadius: 12,

    paddingVertical: 14,

    alignItems: 'center',

  },

  payBtnText: { color: IteoColors.black, fontWeight: '700', fontSize: 15 },

  error: { color: '#FCA5A5', textAlign: 'center', marginHorizontal: 16 },

  card: { borderWidth: 1, borderRadius: 12, padding: 14 },

});

