import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Appbar, Avatar, Divider } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { useWarranty } from '../context/WarrantyContext';
import { WarrantyStatus } from '../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../utils/theme';

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { warranties } = useWarranty();
  
  if (!user) {
    return null;
  }
  
  // Calculate statistics
  const totalWarranties = warranties.length;
  const pendingWarranties = warranties.filter(w => w.status === WarrantyStatus.PENDING).length;
  const approvedWarranties = warranties.filter(w => w.status === WarrantyStatus.APPROVED).length;
  const rejectedWarranties = warranties.filter(w => w.status === WarrantyStatus.REJECTED).length;
  const manualReviewWarranties = warranties.filter(w => w.status === WarrantyStatus.MANUAL_REVIEW).length;
  
  // Get the initials for the avatar
  const getInitials = () => {
    if (!user.username) return '?';
    
    const names = user.username.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };
  
  return (
    <View style={styles.screen}>
      <Appbar.Header>
        <Appbar.Content title="Profile" />
      </Appbar.Header>
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <View style={styles.profileHeader}>
            <Avatar.Text
              size={80}
              label={getInitials()}
              style={{ backgroundColor: COLORS.primary }}
              color={COLORS.background}
            />
            <View style={styles.userInfo}>
              <Text style={styles.userUsername}>{user.username}</Text>
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Warranty Statistics</Text>
          
          <View style={styles.statsContainer}>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Text style={styles.statValue}>{totalWarranties}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </Card.Content>
            </Card>
            
            <Card style={[styles.statCard, { borderTopColor: COLORS.warning }]}>
              <Card.Content style={styles.statContent}>
                <Text style={styles.statValue}>{pendingWarranties}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </Card.Content>
            </Card>
            
            <Card style={[styles.statCard, { borderTopColor: COLORS.success }]}>
              <Card.Content style={styles.statContent}>
                <Text style={styles.statValue}>{approvedWarranties}</Text>
                <Text style={styles.statLabel}>Approved</Text>
              </Card.Content>
            </Card>
            
            <Card style={[styles.statCard, { borderTopColor: COLORS.error }]}>
              <Card.Content style={styles.statContent}>
                <Text style={styles.statValue}>{rejectedWarranties}</Text>
                <Text style={styles.statLabel}>Rejected</Text>
              </Card.Content>
            </Card>

            <Card style={[styles.statCard, { borderTopColor: COLORS.error }]}>
              <Card.Content style={styles.statContent}>
                <Text style={styles.statValue}>{manualReviewWarranties}</Text>
                <Text style={styles.statLabel}>Manual Review</Text>
              </Card.Content>
            </Card>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.actionsContainer}>
            <Button
              mode="contained"
              icon="logout"
              style={styles.logoutButton}
              onPress={logout}
            >
              Logout
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: SPACING.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  userInfo: {
    marginLeft: SPACING.lg,
    flex: 1,
  },
  userName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  userUsername: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
  },
  userCompany: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  divider: {
    marginVertical: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    marginBottom: SPACING.md,
    borderTopWidth: 3,
    borderTopColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  statValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
  },
  actionsContainer: {
    marginTop: SPACING.lg,
  },
  actionButton: {
    marginBottom: SPACING.md,
    borderColor: COLORS.primary,
  },
  logoutButton: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.error,
  },
});

export default ProfileScreen; 