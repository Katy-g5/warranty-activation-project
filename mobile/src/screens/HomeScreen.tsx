import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import WarrantyFormScreen from './WarrantyFormScreen';
import WarrantiesListScreen from './WarrantiesListScreen';
import ProfileScreen from './ProfileScreen';
import { COLORS } from '../utils/theme';
import { IconButton } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
};

type BottomTabParamList = {
  WarrantyForm: undefined;
  WarrantiesList: undefined;
  Profile: undefined;
  InvoiceWebView: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const Tab = createBottomTabNavigator<BottomTabParamList>();

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { logout, user } = useAuth();
  
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <IconButton
          icon="logout"
          iconColor={COLORS.primary}
          size={24}
          onPress={handleLogout}
        />
      ),
      title: `Welcome, ${user?.username || 'Installer'}`,
    });
  }, [navigation, user]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tab.Screen
        name="WarrantyForm"
        component={WarrantyFormScreen}
        options={{
          tabBarLabel: 'New Warranty',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="note-plus" color={color} size={size} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="WarrantiesList"
        component={WarrantiesListScreen}
        options={{
          tabBarLabel: 'Warranties',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="format-list-bulleted" color={color} size={size} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" color={color} size={size} />
          ),
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
};

export default HomeScreen; 