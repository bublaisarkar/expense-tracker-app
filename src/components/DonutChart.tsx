import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '../constants/theme';

const SIZE = 220;
const STROKE = 28;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

export type Segment = {
  key: string;
  value: number;
  color: string;
  label: string;
};

type Props = {
  segments: Segment[];
  total: number;
  /** Pre-formatted value shown in the center (e.g. from formatMoney). */
  centerValue?: string;
  /** Label above the center value. Defaults to "Total". */
  centerLabel?: string;
  /** Shown inside the ring when total is 0. */
  emptyLabel?: string;
};

export default function DonutChart({
  segments,
  total,
  centerValue,
  centerLabel = 'Total',
  emptyLabel = 'No data',
}: Props) {
  const { colors } = useTheme();
  let cumulative = 0;

  const isEmpty = !total || segments.length === 0;

  return (
    <View style={styles.wrap}>
      <Svg width={SIZE} height={SIZE}>
        <G rotation={-90} origin={`${SIZE / 2}, ${SIZE / 2}`}>
          {/* Track */}
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={colors.border}
            strokeWidth={STROKE}
            fill="none"
          />

          {/* Slices */}
          {!isEmpty &&
            segments.map((s) => {
              const pct = s.value / total;
              const dash = pct * CIRC;
              const offset = cumulative * CIRC;
              cumulative += pct;
              return (
                <Circle
                  key={s.key}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  stroke={s.color}
                  strokeWidth={STROKE}
                  fill="none"
                  strokeDasharray={`${dash} ${CIRC - dash}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                />
              );
            })}
        </G>
      </Svg>

      {/* Center label */}
      <View style={styles.center} pointerEvents="none">
        {isEmpty ? (
          <Text style={[styles.centerValue, { color: colors.textSecondary }]}>
            {emptyLabel}
          </Text>
        ) : (
          <>
            <Text style={[styles.centerSmall, { color: colors.textSecondary }]}>
              {centerLabel}
            </Text>
            <Text
              style={[styles.centerValue, { color: colors.text }]}
              numberOfLines={1}
            >
              {centerValue ?? '—'}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: SIZE,
    height: SIZE,
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  centerSmall: {
    fontSize: 12,
  },
  centerValue: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
});