import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Radius, Shadow, useTheme } from '@/constants/theme';
import { useTransactionModal } from '@/context/TransactionModalContext';

const ICONS: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
  index:      ['home', 'home-outline'],
  statistics: ['stats-chart', 'stats-chart-outline'],
  wallet:     ['wallet', 'wallet-outline'],
  profile:    ['person', 'person-outline'],
};

export default function CustomTabBar({ state, navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { openAdd } = useTransactionModal();   // ← use context, not prop

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: colors.backgroundElement,
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      <View style={styles.bar}>
        {state.routes.map((route: any, index: number) => {
          const focused = state.index === index;
          const [active, inactive] = ICONS[route.name] || ['ellipse', 'ellipse-outline'];

          // Insert FAB before index 2 (Wallet)
          if (index === 2) {
            return (
              <React.Fragment key={route.key}>
                <TouchableOpacity
                  style={[styles.fabWrap, { backgroundColor: colors.backgroundElement }]}
                  onPress={openAdd}        // ← opens context modal, refreshes Home
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.primaryLight]}
                    style={styles.fab}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="add" size={30} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>

                <TabBtn
                  route={route}
                  focused={focused}
                  navigation={navigation}
                  activeIcon={active}
                  inactiveIcon={inactive}
                  activeColor={colors.primary}
                  inactiveColor={colors.textSecondary}
                />
              </React.Fragment>
            );
          }

          return (
            <TabBtn
              key={route.key}
              route={route}
              focused={focused}
              navigation={navigation}
              activeIcon={active}
              inactiveIcon={inactive}
              activeColor={colors.primary}
              inactiveColor={colors.textSecondary}
            />
          );
        })}
      </View>
    </View>
  );
}

function TabBtn({
  route,
  focused,
  navigation,
  activeIcon,
  inactiveIcon,
  activeColor,
  inactiveColor,
}: any) {
  return (
    <TouchableOpacity
      style={styles.tab}
      onPress={() => navigation.navigate(route.name)}
      activeOpacity={0.7}
    >
      <Ionicons
        name={focused ? activeIcon : inactiveIcon}
        size={22}
        color={focused ? activeColor : inactiveColor}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    ...Shadow.tabBar,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 12,
    height: 62,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  fabWrap: {
    top: -22,
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.card,
  },
  fab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
});