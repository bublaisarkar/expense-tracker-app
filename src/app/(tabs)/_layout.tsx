import React, { useState } from 'react';
import { Tabs } from 'expo-router';
import CustomTabBar from '../../components/CustomTabBar';
import TransactionModal from '../../components/TransactionModal';

export default function TabsLayout() {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => (
          <CustomTabBar {...props} onAddPress={() => setModalVisible(true)} />
        )}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="statistics" />
        <Tabs.Screen name="wallet" />
        <Tabs.Screen name="profile" />
      </Tabs>

      <TransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}