import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Dimensions, DeviceEventEmitter } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { transactionsApi } from '../../api/transactions';
import { TrendUp, TrendDown, Scales, PiggyBank, SignOut } from 'phosphor-react-native';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [stats, setStats] = useState({
    income: 0,
    expense: 0,
    balance: 0,
    savingRate: 0,
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(false);

      // Check if this is the first sync (epoch time)
      const { getLocalLastSyncedAt, syncAll } = require('../../services/syncService');
      const lastSynced = await getLocalLastSyncedAt();
      const isFirstSync = lastSynced === new Date(0).toISOString();

      if (isFirstSync) {
        setLoading(true); // Ensure loading spinner is visible
        console.log('First login detected, executing blocking/awaiting syncAll...');
        await syncAll(); // Block and await first pull from server
      } else {
        // Run background sync for subsequent mounts to fetch any new updates
        syncAll();
      }

      // Fetch transactions from local SQLite database
      const res = await transactionsApi.getAll({ limit: 100 });
      if (res.data.success) {
        const rawData = res.data.data;
        const txs = Array.isArray(rawData) ? rawData : (rawData?.data || []);
        setRecentTx(txs.slice(0, 5)); // Keep 5 recent ones

        // Calculate current month statistics
        let totalIncome = 0;
        let totalExpense = 0;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        txs.forEach((t: any) => {
          const date = new Date(t.transaction_date);
          if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
            const amt = Number(t.amount);
            if (t.type === 'INCOME') {
              totalIncome += amt;
            } else {
              totalExpense += amt;
            }
          }
        });

        const balance = totalIncome - totalExpense;
        const savingRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;

        setStats({
          income: totalIncome,
          expense: totalExpense,
          balance,
          savingRate: Math.max(0, Math.round(savingRate)),
        });
      }
    } catch (e) {
      console.error('Error loading dashboard:', e);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const [error, setError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData])
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('sync-completed', () => {
      console.log('Sync complete event received in Dashboard, reloading...');
      fetchDashboardData();
    });
    return () => sub.remove();
  }, [fetchDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const getMonthYearText = () => {
    const d = new Date();
    return `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" colors={['#10b981']} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Xin chào,</Text>
          <Text style={styles.userName}>{user?.fullname || 'Thành viên'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <SignOut size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Date display & title */}
      <View style={styles.periodRow}>
        <Text style={styles.periodTitle}>Tổng quan tài chính</Text>
        <Text style={styles.periodDate}>{getMonthYearText()}</Text>
      </View>

      {/* KPI Cards Grid */}
      <View style={styles.kpiContainer}>
        {/* Card 1: Balance */}
        <View style={[styles.kpiCard, { width: width - 32 }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>Số dư khả dụng</Text>
            <Scales size={20} color="#10b981" weight="fill" />
          </View>
          <Text style={[styles.cardValue, { color: stats.balance >= 0 ? '#10b981' : '#ef4444' }]}>
            {formatCurrency(stats.balance)}
          </Text>
        </View>

        {/* Card 2 & 3 Side by Side */}
        <View style={styles.row}>
          <View style={[styles.kpiCard, { width: (width - 44) / 2 }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>Tổng thu</Text>
              <TrendUp size={20} color="#10b981" />
            </View>
            <Text style={[styles.cardValueSub, { color: '#10b981' }]}>
              {formatCurrency(stats.income)}
            </Text>
          </View>

          <View style={[styles.kpiCard, { width: (width - 44) / 2 }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>Tổng chi</Text>
              <TrendDown size={20} color="#ef4444" />
            </View>
            <Text style={[styles.cardValueSub, { color: '#ef4444' }]}>
              {formatCurrency(stats.expense)}
            </Text>
          </View>
        </View>

        {/* Card 4: Saving Rate */}
        <View style={[styles.kpiCard, { width: width - 32 }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>Tỷ lệ tiết kiệm</Text>
            <PiggyBank size={20} color="#f59e0b" weight="fill" />
          </View>
          <View style={styles.savingRateRow}>
            <Text style={[styles.cardValue, { color: '#f59e0b', marginBottom: 0 }]}>
              {stats.savingRate}%
            </Text>
            <View style={styles.savingProgressBg}>
              <View style={[styles.savingProgressFill, { width: `${Math.min(stats.savingRate, 100)}%` }]} />
            </View>
          </View>
        </View>
      </View>

      {/* Recent Transactions List */}
      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Giao dịch gần đây</Text>
        {recentTx.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Chưa có giao dịch nào trong tháng này.</Text>
          </View>
        ) : (
          recentTx.map((item) => (
            <View key={item.id} style={styles.txRow}>
              <View style={styles.txLeft}>
                <View style={[styles.colorDot, { backgroundColor: item.type === 'INCOME' ? '#10b981' : '#ef4444' }]} />
                <View>
                  <Text style={styles.txTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.txDate}>
                    {new Date(item.transaction_date).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
              </View>
              <Text style={[styles.txAmount, { color: item.type === 'INCOME' ? '#10b981' : '#ef4444' }]}>
                {item.type === 'INCOME' ? '+' : '-'}{formatCurrency(item.amount)}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1117',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 50,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f1117',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  userName: {
    color: '#f1f3f5',
    fontSize: 20,
    fontWeight: '700',
  },
  logoutBtn: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#1a1d27',
    borderWidth: 1,
    borderColor: '#2d3148',
  },
  periodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  periodTitle: {
    color: '#f1f3f5',
    fontSize: 16,
    fontWeight: '600',
  },
  periodDate: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  kpiContainer: {
    gap: 12,
    marginBottom: 24,
  },
  kpiCard: {
    backgroundColor: '#1a1d27',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2d3148',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '500',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardValueSub: {
    fontSize: 18,
    fontWeight: '700',
  },
  savingRateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  savingProgressBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#0f1117',
    borderRadius: 4,
    marginLeft: 16,
    overflow: 'hidden',
  },
  savingProgressFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 4,
  },
  recentSection: {
    marginTop: 8,
  },
  sectionTitle: {
    color: '#f1f3f5',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyCard: {
    backgroundColor: '#1a1d27',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2d3148',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1d27',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2d3148',
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  txTitle: {
    color: '#f1f3f5',
    fontSize: 15,
    fontWeight: '600',
    maxWidth: width * 0.45,
  },
  txDate: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
});
