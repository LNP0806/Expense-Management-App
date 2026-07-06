import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Modal, ScrollView, Alert, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { budgetsApi } from '../../api/budgets';
import { categoriesApi } from '../../api/categories';
import { Plus, Trash, Pencil, Calendar, Tag, FileText, Wallet, CheckCircle } from 'phosphor-react-native';

const toLocalDateString = (dateInput: string | Date) => {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const { width } = Dimensions.get('window');

export default function BudgetsScreen() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [categories, setCategories] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Detail Modal
  const [selectedBudget, setSelectedBudget] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Create/Edit Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    amount: '',
    categoryId: '',
    startDate: '',
    endDate: '',
    description: '',
  });
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2500);
  };

  const [submitting, setSubmitting] = useState(false);

  const loadCategories = async () => {
    try {
      const res = await categoriesApi.getAll({ limit: 100 });
      if (res.data.success) {
        const list = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.data || []);
        const catMap: Record<string, any> = {};
        list.forEach((c: any) => {
          catMap[c.id] = c;
        });
        setCategories(catMap);
      }
    } catch (e) {
      console.error('Error loading categories:', e);
    }
  };

  const loadBudgets = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Fetch budgets list (schema fields)
      const resBudgets = await budgetsApi.getAll({ limit: 100 });
      
      // 2. Fetch progress data (spent/remaining calculation)
      let progressMap: Record<string, any> = {};
      try {
        const resProgress = await budgetsApi.getSpent();
        if (resProgress.data.success) {
          const rawProgress = resProgress.data.data;
          const progressList = Array.isArray(rawProgress) ? rawProgress : (rawProgress?.data || []);
          progressList.forEach((p: any) => {
            progressMap[p.id] = p;
          });
        }
      } catch (err) {
        console.warn('Real budget progress API failed, using fallback:', err);
      }

      if (resBudgets.data.success) {
        const rawBudgets = resBudgets.data.data;
        const budgetsList = Array.isArray(rawBudgets) ? rawBudgets : (rawBudgets?.data || []);
        
        const budgetsData = budgetsList.map((b: any) => {
          const progress = progressMap[b.id];
          const spent = progress ? Number(progress.spent || 0) : 0;
          const percentage = b.amount > 0 ? (spent * 100) / b.amount : 0;
          
          let status: 'normal' | 'warning' | 'exceeded' = 'normal';
          if (percentage >= 100) status = 'exceeded';
          else if (percentage >= 80) status = 'warning';

          return {
            ...b,
            spent,
            percentage: Math.round(percentage),
            status,
          };
        });

        setBudgets(budgetsData);
      }
    } catch (e) {
      console.error('Error loading budgets:', e);
      showToast('Không thể tải danh sách ngân sách', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
      loadBudgets();
    }, [loadBudgets])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadBudgets();
  };

  const handleDeleteBudget = (id: string) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa ngân sách này không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await budgetsApi.delete(id);
              if (res.data.success) {
                setBudgets((prev) => prev.filter((b) => b.id !== id));
                setIsDetailModalOpen(false);
                setSelectedBudget(null);
                Alert.alert('Thành công', 'Đã xóa ngân sách');
              }
            } catch (err) {
              console.error(err);
              Alert.alert('Lỗi', 'Không thể xóa ngân sách');
            }
          },
        },
      ]
    );
  };

  const handleOpenEdit = (b: any) => {
    setEditingId(b.id);
    setForm({
      title: b.title || '',
      amount: b.amount ? String(b.amount) : '',
      categoryId: b.category_id || '',
      startDate: b.start_date ? toLocalDateString(b.start_date) : toLocalDateString(new Date()),
      endDate: b.end_date ? toLocalDateString(b.end_date) : toLocalDateString(new Date()),
      description: b.description || '',
    });
    setIsDetailModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleOpenCreate = () => {
    const today = new Date();
    const firstDay = toLocalDateString(new Date(today.getFullYear(), today.getMonth(), 1));
    const lastDay = toLocalDateString(new Date(today.getFullYear(), today.getMonth() + 1, 0));
    
    setForm({
      title: '',
      amount: '',
      categoryId: '',
      startDate: firstDay,
      endDate: lastDay,
      description: '',
    });
    setIsCreateModalOpen(true);
  };

  const handleSaveBudget = async (isEdit: boolean) => {
    if (!form.title.trim()) {
      showToast('Vui lòng nhập tên ngân sách', 'error');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      showToast('Vui lòng nhập số tiền hợp lệ', 'error');
      return;
    }
    if (!form.startDate || !form.endDate) {
      showToast('Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc', 'error');
      return;
    }
    if (new Date(form.startDate) > new Date(form.endDate)) {
      showToast('Ngày kết thúc phải sau ngày bắt đầu', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        amount: Number(form.amount),
        start_date: form.startDate,
        end_date: form.endDate,
        description: form.description.trim() || null,
        category_id: form.categoryId || null,
      };

      if (isEdit && editingId) {
        const res = await budgetsApi.update(editingId, payload);
        if (res.data.success) {
          setIsEditModalOpen(false);
          setEditingId(null);
          loadBudgets(); // Refresh list to get computed spent/progress
          showToast('Đã cập nhật ngân sách thành công!', 'success');
        }
      } else {
        const res = await budgetsApi.create(payload);
        if (res.data.success) {
          setIsCreateModalOpen(false);
          loadBudgets();
          showToast('Đã tạo ngân sách mới thành công!', 'success');
        }
      }
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.message || e?.message || 'Có lỗi xảy ra khi lưu';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryName = (catId: string) => {
    if (!catId) return 'Tất cả danh mục';
    return categories[catId]?.name || 'Tất cả danh mục';
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const getStatusColor = (status: string) => {
    if (status === 'exceeded') return '#ef4444';
    if (status === 'warning') return '#f59e0b';
    return '#10b981';
  };

  const renderBudgetItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.budgetCard,
        item.status === 'exceeded' && styles.cardExceeded,
        item.status === 'warning' && styles.cardWarning,
      ]}
      onPress={() => {
        setSelectedBudget(item);
        setIsDetailModalOpen(true);
      }}
    >
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={[styles.cardPercentage, { color: getStatusColor(item.status) }]}>
          {item.percentage}%
        </Text>
      </View>

      <Text style={styles.cardLimit}>Hạn mức: {formatCurrency(item.amount)}</Text>
      
      <Text style={styles.cardDateRange}>
        {new Date(item.start_date).toLocaleDateString('vi-VN')} - {new Date(item.end_date).toLocaleDateString('vi-VN')}
      </Text>

      {/* Progress Bar */}
      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            {
              backgroundColor: getStatusColor(item.status),
              width: `${Math.min(item.percentage, 100)}%`,
            },
          ]}
        />
      </View>

      <View style={styles.cardSpentRow}>
        <Text style={styles.cardSpentText}>Đã chi: {formatCurrency(item.spent)}</Text>
        <Text style={styles.cardRemainingText}>
          Còn lại:{' '}
          <Text style={{ color: item.amount - item.spent < 0 ? '#ef4444' : '#10b981', fontWeight: '700' }}>
            {formatCurrency(item.amount - item.spent)}
          </Text>
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {toast.visible && (
        <View style={[styles.toastBanner, toast.type === 'success' ? styles.toastSuccess : styles.toastError]}>
          <CheckCircle size={20} color="#ffffff" weight="fill" />
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Ngân sách chi tiêu</Text>
        <Text style={styles.headerSubtitle}>Quản lý hạn mức chi tiêu hàng tháng</Text>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : budgets.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Chưa có ngân sách nào được thiết lập.</Text>
        </View>
      ) : (
        <FlatList
          data={budgets}
          renderItem={renderBudgetItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
          }
        />
      )}

      {/* FAB - Create Budget */}
      <TouchableOpacity style={styles.fab} onPress={handleOpenCreate}>
        <Plus size={24} color="#ffffff" weight="bold" />
      </TouchableOpacity>

      {/* 1. Detail Modal */}
      <Modal
        visible={isDetailModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsDetailModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.modalTitle}>Chi tiết ngân sách</Text>
              <TouchableOpacity onPress={() => setIsDetailModalOpen(false)}>
                <Text style={styles.closeText}>Đóng</Text>
              </TouchableOpacity>
            </View>

            {selectedBudget && (
              <ScrollView style={styles.modalScroll}>
                <View style={styles.detailContainer}>
                  <Text style={styles.detailTitle}>{selectedBudget.title}</Text>
                  
                  <View style={styles.statBox}>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Hạn mức tổng:</Text>
                      <Text style={styles.statValueBold}>{formatCurrency(selectedBudget.amount)}</Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Đã chi tiêu:</Text>
                      <Text style={styles.statValueBold}>{formatCurrency(selectedBudget.spent)}</Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Còn lại:</Text>
                      <Text
                        style={[
                          styles.statValueBold,
                          { color: selectedBudget.amount - selectedBudget.spent < 0 ? '#ef4444' : '#10b981' },
                        ]}
                      >
                        {formatCurrency(selectedBudget.amount - selectedBudget.spent)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.detailRow}>
                    <Calendar size={18} color="#9ca3af" />
                    <View style={styles.detailTextCol}>
                      <Text style={styles.detailLabel}>Thời hạn áp dụng</Text>
                      <Text style={styles.detailValue}>
                        {new Date(selectedBudget.start_date).toLocaleDateString('vi-VN')} -{' '}
                        {new Date(selectedBudget.end_date).toLocaleDateString('vi-VN')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Tag size={18} color="#9ca3af" />
                    <View style={styles.detailTextCol}>
                      <Text style={styles.detailLabel}>Danh mục áp dụng</Text>
                      <Text style={styles.detailValue}>{getCategoryName(selectedBudget.category_id)}</Text>
                    </View>
                  </View>

                  {selectedBudget.description ? (
                    <View style={styles.detailRow}>
                      <FileText size={18} color="#9ca3af" />
                      <View style={styles.detailTextCol}>
                        <Text style={styles.detailLabel}>Mô tả</Text>
                        <Text style={styles.detailValue}>{selectedBudget.description}</Text>
                      </View>
                    </View>
                  ) : null}
                </View>

                {/* Buttons */}
                <View style={styles.modalActionRow}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteBtn]}
                    onPress={() => handleDeleteBudget(selectedBudget.id)}
                  >
                    <Trash size={18} color="#ef4444" />
                    <Text style={styles.deleteBtnText}>Xóa</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.editBtn]}
                    onPress={() => handleOpenEdit(selectedBudget)}
                  >
                    <Pencil size={18} color="#10b981" />
                    <Text style={styles.editBtnText}>Chỉnh sửa</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* 2. Create/Edit Form Modal */}
      <Modal
        visible={isCreateModalOpen || isEditModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardContainer}
          >
            <View style={styles.bottomSheet}>
              <View style={styles.bottomSheetHeader}>
                <Text style={styles.modalTitle}>
                  {isEditModalOpen ? 'Chỉnh sửa ngân sách' : 'Tạo ngân sách'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                >
                  <Text style={styles.closeText}>Hủy</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Tên ngân sách</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="VD: Chi tiêu gia đình..."
                    placeholderTextColor="#6b7280"
                    value={form.title}
                    onChangeText={(val) => setForm((prev) => ({ ...prev, title: val }))}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Số tiền hạn mức (VND)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập số tiền..."
                    placeholderTextColor="#6b7280"
                    keyboardType="numeric"
                    value={form.amount}
                    onChangeText={(val) => setForm((prev) => ({ ...prev, amount: val }))}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Ngày bắt đầu</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#6b7280"
                    value={form.startDate}
                    onChangeText={(val) => setForm((prev) => ({ ...prev, startDate: val }))}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Ngày kết thúc</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#6b7280"
                    value={form.endDate}
                    onChangeText={(val) => setForm((prev) => ({ ...prev, endDate: val }))}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Danh mục áp dụng</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catSelectionRow}>
                    <TouchableOpacity
                      style={[styles.catOption, form.categoryId === '' && styles.catOptionActive]}
                      onPress={() => setForm((prev) => ({ ...prev, categoryId: '' }))}
                    >
                      <Text style={styles.catOptionText}>Tất cả danh mục</Text>
                    </TouchableOpacity>
                    {Object.values(categories).map((c: any) => (
                      <TouchableOpacity
                        key={c.id}
                        style={[styles.catOption, form.categoryId === c.id && styles.catOptionActive]}
                        onPress={() => setForm((prev) => ({ ...prev, categoryId: c.id }))}
                      >
                        <Text style={styles.catOptionText}>{c.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Mô tả</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Mô tả ngân sách (nếu có)..."
                    placeholderTextColor="#6b7280"
                    multiline
                    numberOfLines={3}
                    value={form.description}
                    onChangeText={(val) => setForm((prev) => ({ ...prev, description: val }))}
                  />
                </View>

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={() => handleSaveBudget(isEditModalOpen)}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Lưu ngân sách</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

import { RefreshControl } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1117',
  },
  headerContainer: {
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#1a1d27',
    borderBottomWidth: 1,
    borderColor: '#2d3148',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f1f3f5',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#9ca3af',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 15,
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
  budgetCard: {
    backgroundColor: '#1a1d27',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2d3148',
  },
  cardExceeded: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  cardWarning: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f1f3f5',
    maxWidth: width * 0.7,
  },
  cardPercentage: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardLimit: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  cardDateRange: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 16,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#0f1117',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  cardSpentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardSpentText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  cardRemainingText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 17, 23, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSheet: {
    backgroundColor: '#1a1d27',
    borderRadius: 24,
    width: '92%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#2d3148',
    overflow: 'hidden',
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderColor: '#2d3148',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f1f3f5',
  },
  closeText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '600',
  },
  modalScroll: {
    padding: 20,
  },
  detailContainer: {
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f3f5',
    marginBottom: 16,
  },
  statBox: {
    backgroundColor: '#0f1117',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#2d3148',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    color: '#9ca3af',
  },
  statValueBold: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f1f3f5',
  },
  divider: {
    height: 1,
    backgroundColor: '#2d3148',
    marginVertical: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  detailTextCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#f1f3f5',
    fontWeight: '500',
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 10,
    marginBottom: 30,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  deleteBtn: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  deleteBtnText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 14,
  },
  editBtn: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  editBtnText: {
    color: '#10b981',
    fontWeight: '600',
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0f1117',
    borderWidth: 1,
    borderColor: '#2d3148',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#f1f3f5',
    fontSize: 15,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  catSelectionRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  catOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#0f1117',
    borderWidth: 1,
    borderColor: '#2d3148',
    marginRight: 8,
  },
  catOptionActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  catOptionText: {
    color: '#f1f3f5',
    fontSize: 12,
    fontWeight: '500',
  },
  saveBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 30,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  toastBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 45,
    left: 20,
    right: 20,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 9999,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  toastSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.95)',
    borderColor: '#34d399',
  },
  toastError: {
    backgroundColor: 'rgba(239, 68, 68, 0.95)',
    borderColor: '#f87171',
  },
  toastText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
