import { Radius, Shadow, Spacing, useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { useSettings } from '../context/SettingsContext';

type Props = { balance: number; income: number; expense: number };

export default function BalanceCard({ balance, income, expense }: Props) {
  const { colors } = useTheme();
  const { formatMoney } = useSettings();

  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryLight]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <Text style={styles.label}>Total Balance</Text>
        <Ionicons name="wallet-outline" size={22} color="rgba(255,255,255,0.9)" />
      </View>

      <Text style={styles.balance}>{formatMoney(balance)}</Text>

      <View style={styles.row}>
        <View style={styles.statBox}>
          <View style={[styles.dot, { backgroundColor: '#55EFC4' }]}>
            <Ionicons name="arrow-down" size={14} color="#0B0B0F" />
          </View>
          <View>
            <Text style={styles.statLabel}>Income</Text>
            <Text style={styles.statValue}>{formatMoney(income)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.statBox}>
          <View style={[styles.dot, { backgroundColor: '#FFB8B8' }]}>
            <Ionicons name="arrow-up" size={14} color="#0B0B0F" />
          </View>
          <View>
            <Text style={styles.statLabel}>Expense</Text>
            <Text style={styles.statValue}>{formatMoney(expense)}</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.xl, padding: Spacing.four, ...Shadow.card },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },
  balance: { color: '#FFFFFF', fontSize: 34, fontWeight: '800', marginTop: 8, marginBottom: Spacing.four },
  row: { flexDirection: 'row', alignItems: 'center' },
  statBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  statLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  statValue: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginTop: 2 },
  divider: { width: 1, height: 34, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: Spacing.two },
});