import { Tabs } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';
import { House, List, Camera, Wallet, Tag } from 'phosphor-react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a1d27',
          borderTopColor: '#2d3148',
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tổng quan',
          tabBarIcon: ({ color }) => <House color={color as string} size={22} weight="fill" />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Giao dịch',
          tabBarIcon: ({ color }) => <List color={color as string} size={22} weight="bold" />,
        }}
      />
      <Tabs.Screen
        name="capture"
        options={{
          tabBarLabel: () => null,
          tabBarButton: (props) => (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <TouchableOpacity
                onPress={props.onPress ?? undefined}
                onLongPress={props.onLongPress ?? undefined}
                activeOpacity={0.85}
                style={{
                  position: 'absolute',
                  top: -18,
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: '#10b981',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 4,
                  borderColor: '#1a1d27',
                  shadowColor: '#10b981',
                  shadowOpacity: 0.4,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: 5,
                }}
              >
                <Camera color="#ffffff" size={26} weight="fill" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: 'Ngân sách',
          tabBarIcon: ({ color }) => <Wallet color={color as string} size={22} weight="fill" />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Danh mục',
          tabBarIcon: ({ color }) => <Tag color={color as string} size={22} weight="fill" />,
        }}
      />
    </Tabs>
  );
}
