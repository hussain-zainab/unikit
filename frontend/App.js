import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { COLORS } from './src/constants/config';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import AnnouncementsScreen from './src/screens/AnnouncementsScreen';
import BatchesScreen from './src/screens/BatchesScreen';
import AttendanceScreen from './src/screens/AttendanceScreen';
import ViewAttendanceScreen from './src/screens/ViewAttendanceScreen';
import TimetableScreen from './src/screens/TimetableScreen';
import ComplaintsScreen from './src/screens/ComplaintsScreen';
import UsersScreen from './src/screens/UsersScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import PrintAttendanceScreen from './src/screens/PrintAttendanceScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ─── Tab Icon ──────────────────────────────────────────────────────────────────
const TabIcon = ({ emoji, label, focused }) => (
  <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
    <Text style={tabStyles.emoji}>{emoji}</Text>
    <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>{label}</Text>
  </View>
);

// ─── HOD / Admin Tabs ─────────────────────────────────────────────────────────
const AdminTabs = () => (
  <Tab.Navigator screenOptions={tabOptions}>
    <Tab.Screen
      name="Announcements"
      component={AnnouncementsScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📢" label="Home" focused={focused} /> }}
    />
    <Tab.Screen
      name="Batches"
      component={BatchesScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏫" label="Batches" focused={focused} /> }}
    />
    <Tab.Screen
      name="Attendance"
      component={AttendanceScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="✅" label="Attend." focused={focused} /> }}
    />
    <Tab.Screen
      name="ViewAttendance"
      component={ViewAttendanceScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="Stats" focused={focused} /> }}
    />
    <Tab.Screen
      name="Timetable"
      component={TimetableScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📅" label="Schedule" focused={focused} /> }}
    />
    <Tab.Screen
      name="Users"
      component={UsersScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👥" label="Users" focused={focused} /> }}
    />
    <Tab.Screen
      name="Print"
      component={PrintAttendanceScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🖨️" label="Print" focused={focused} /> }}
    />
    <Tab.Screen
      name="Complaints"
      component={ComplaintsScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📋" label="Issues" focused={focused} /> }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profile" focused={focused} /> }}
    />
  </Tab.Navigator>
);

// ─── Teacher Tabs ─────────────────────────────────────────────────────────────
const TeacherTabs = () => (
  <Tab.Navigator screenOptions={tabOptions}>
    <Tab.Screen
      name="Announcements"
      component={AnnouncementsScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📢" label="Home" focused={focused} /> }}
    />
    <Tab.Screen
      name="Attendance"
      component={AttendanceScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="✅" label="Attend." focused={focused} /> }}
    />
    <Tab.Screen
      name="ViewAttendance"
      component={ViewAttendanceScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="Stats" focused={focused} /> }}
    />
    <Tab.Screen
      name="Timetable"
      component={TimetableScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📅" label="Schedule" focused={focused} /> }}
    />
    <Tab.Screen
      name="Batches"
      component={BatchesScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏫" label="Batches" focused={focused} /> }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profile" focused={focused} /> }}
    />
  </Tab.Navigator>
);

// ─── Student Tabs ─────────────────────────────────────────────────────────────
const StudentTabs = () => (
  <Tab.Navigator screenOptions={tabOptions}>
    <Tab.Screen
      name="Announcements"
      component={AnnouncementsScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📢" label="Home" focused={focused} /> }}
    />
    <Tab.Screen
      name="ViewAttendance"
      component={ViewAttendanceScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="My Attend." focused={focused} /> }}
    />
    <Tab.Screen
      name="Timetable"
      component={TimetableScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📅" label="Schedule" focused={focused} /> }}
    />
    <Tab.Screen
      name="Complaints"
      component={ComplaintsScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📋" label="Complaints" focused={focused} /> }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profile" focused={focused} /> }}
    />
  </Tab.Navigator>
);

// ─── Tab Options ──────────────────────────────────────────────────────────────
const tabOptions = {
  headerShown: false,
  tabBarShowLabel: false,
  tabBarStyle: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: 64,
    paddingBottom: 8,
  },
};

// ─── App Navigator ────────────────────────────────────────────────────────────
const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashIcon}>🎓</Text>
        <Text style={styles.splashName}>Unikit</Text>
        <ActivityIndicator color={COLORS.white} style={{ marginTop: 24 }} />
      </View>
    );
  }

  if (!user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    );
  }

  // Role-based navigation
  const role = user.role;
  if (role === 'hod' || role === 'admin') return <AdminTabs />;
  if (role === 'teacher') return <TeacherTabs />;
  return <StudentTabs />;
};

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  splashIcon: { fontSize: 56, marginBottom: 12 },
  splashName: { fontSize: 36, fontWeight: '900', color: COLORS.white },
});

const tabStyles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center', justifyContent: 'center',
    paddingTop: 8, paddingHorizontal: 4, minWidth: 56,
  },
  iconWrapActive: {},
  emoji: { fontSize: 22 },
  label: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  labelActive: { color: COLORS.primary, fontWeight: '700' },
});
