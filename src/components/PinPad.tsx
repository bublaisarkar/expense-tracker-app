import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing, useTheme } from '../constants/theme';

type Props = {
  value: string;
  maxLength?: number;
  onChange: (next: string) => void;
  onComplete?: (pin: string) => void;
};

export default function PinPad({ value, maxLength = 4, onChange, onComplete }: Props) {
  const { colors } = useTheme();

  const press = (d: string) => {
    if (value.length >= maxLength) return;
    const next = value + d;
    onChange(next);
    if (next.length === maxLength) onComplete?.(next);
  };
  const back = () => onChange(value.slice(0, -1));

  const dots = Array.from({ length: maxLength });

  return (
    <View style={styles.wrap}>
      <View style={styles.dotsRow}>
        {dots.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i < value.length ? colors.primary : 'transparent',
                borderColor: i < value.length ? colors.primary : colors.border,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.pad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <PadBtn key={n} label={String(n)} onPress={() => press(String(n))} />
        ))}
        <View style={styles.btn} />
        <PadBtn label="0" onPress={() => press('0')} />
        <TouchableOpacity style={styles.btn} onPress={back}>
          <Ionicons name="backspace-outline" size={26} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PadBtn({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: colors.backgroundElement }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.btnText, { color: colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  dotsRow: { flexDirection: 'row', gap: 16, marginVertical: Spacing.five },
  dot: {
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 2,
  },
  pad: {
    flexDirection: 'row', flexWrap: 'wrap',
    width: 280, justifyContent: 'center',
  },
  btn: {
    width: 76, height: 76, borderRadius: 38,
    alignItems: 'center', justifyContent: 'center',
    margin: 6,
  },
  btnText: { fontSize: 26, fontWeight: '600' },
});