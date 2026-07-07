import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Modal, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { transactionsApi } from '../../api/transactions';
import { categoriesApi } from '../../api/categories';
import { Pencil, Trash, Plus, MagnifyingGlass, Funnel, Calendar, Tag, FileText, CheckCircle } from 'phosphor-react-native';

const toLocalDateString = (dateInput: string | Date) => {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatAmountInput = (text: string) => {
  const cleanNumber = text.replace(/[^0-9]/g, '');
  if (!cleanNumber) return '';
  return new Intl.NumberFormat('vi-VN').format(Number(cleanNumber));
};

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');

  // Detail Modal
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Create/Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    amount: '',
    type: 'EXPENSE' as 'EXPENSE' | 'INCOME',
    categoryId: '',
    date: '',
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

  // Fetch categories & transactions
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

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await transactionsApi.getAll({ limit: 100 });
      if (res.data.success) {
        const rawData = res.data.data;
        const list = Array.isArray(rawData) ? rawData : (rawData?.data || []);
        setTransactions(list);
      }
    } catch (e) {
      console.error('Error loading transactions:', e);
      Alert.alert('Lỗi', 'Không thể tải lịch sử giao dịch');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
      loadTransactions();
    }, [loadTransactions])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  // Delete transaction
  const handleDeleteTx = (id: string) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa giao dịch này không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await transactionsApi.delete(id);
              if (res.data.success) {
                setTransactions((prev) => prev.filter((t) => t.id !== id));
                setIsDetailModalOpen(false);
                setSelectedTx(null);
                Alert.alert('Thành công', 'Đã xóa giao dịch');
              }
            } catch (err) {
              console.error(err);
              Alert.alert('Lỗi', 'Không thể xóa giao dịch');
            }
          },
        },
      ]
    );
  };

  // Open Edit Modal
  const handleOpenEdit = (tx: any) => {
    setEditingId(tx.id);
    setForm({
      title: tx.title || '',
      amount: tx.amount ? formatAmountInput(String(Math.round(Number(tx.amount)))) : '',
      type: tx.type || 'EXPENSE',
      categoryId: tx.category_id || '',
      date: tx.transaction_date ? toLocalDateString(tx.transaction_date) : toLocalDateString(new Date()),
      description: tx.description || '',
    });
    setIsDetailModalOpen(false);
    setIsEditModalOpen(true);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setForm({
      title: '',
      amount: '',
      type: 'EXPENSE',
      categoryId: '',
      date: toLocalDateString(new Date()),
      description: '',
    });
    setIsCreateModalOpen(true);
  };

  // Save Transaction (Create or Edit)
  const handleSaveTransaction = async (isEdit: boolean) => {
    if (!form.title.trim()) {
      showToast('Vui lòng nhập tiêu đề', 'error');
      return;
    }
    
    const rawAmount = Number(form.amount.replace(/[^0-9]/g, ''));
    if (!form.amount || rawAmount <= 0) {
      showToast('Vui lòng nhập số tiền hợp lệ', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        amount: rawAmount,
        type: form.type,
        transaction_date: form.date,
        description: form.description.trim() || null,
        category_id: form.categoryId || null,
      };

      if (isEdit && editingId) {
        const res = await transactionsApi.update(editingId, payload);
        if (res.data.success) {
          const updated = res.data.data?.updatedTransaction || res.data.data?.updated_transaction || res.data.data;
          setTransactions((prev) => prev.map((t) => (t.id === editingId ? { ...t, ...updated } : t)));
          setIsEditModalOpen(false);
          setEditingId(null);
          showToast('Đã cập nhật giao dịch thành công!', 'success');
        }
      } else {
        // Create manual
        const formData = new FormData();
        formData.append('title', payload.title);
        formData.append('amount', String(payload.amount));
        formData.append('type', payload.type);
        formData.append('transaction_date', payload.transaction_date);
        if (payload.description) formData.append('description', payload.description);
        if (payload.category_id) formData.append('category_id', payload.category_id);

        const res = await transactionsApi.create(formData);
        if (res.data.success) {
          const newTx = res.data.data?.newTransaction || res.data.data?.new_transaction || res.data.data;
          setTransactions((prev) => [newTx, ...prev]);
          setIsCreateModalOpen(false);
          showToast('Đã thêm giao dịch mới thành công!', 'success');
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
    if (!catId) return 'Chưa phân loại';
    return categories[catId]?.name || 'Chưa phân loại';
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  // Filter transactions
  const filteredTxs = transactions.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = selectedType === 'ALL' || t.type === selectedType;

    return matchesSearch && matchesType;
  });

  const renderTxItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.txItem}
      onPress={() => {
        setSelectedTx(item);
        setIsDetailModalOpen(true);
      }}
    >
      <View style={styles.txLeft}>
        <View style={[styles.categoryColorDot, { backgroundColor: item.type === 'INCOME' ? '#10b981' : '#ef4444' }]} />
        <View style={styles.txMeta}>
          <Text style={styles.txTitleText} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.txSubText}>
            {getCategoryName(item.category_id)} • {new Date(item.transaction_date).toLocaleDateString('vi-VN')}
          </Text>
        </View>
      </View>
      <Text style={[styles.txAmountText, { color: item.type === 'INCOME' ? '#10b981' : '#ef4444' }]}>
        {item.type === 'INCOME' ? '+' : '-'}{formatCurrency(item.amount)}
      </Text>
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
      {/* Search and Filters Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Giao dịch</Text>
        
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <MagnifyingGlass size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm giao dịch..."
            placeholderTextColor="#6b7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(['ALL', 'EXPENSE', 'INCOME'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterPill,
                selectedType === type && styles.activeFilterPill,
              ]}
              onPress={() => setSelectedType(type)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  selectedType === type && styles.activeFilterPillText,
                ]}
              >
                {type === 'ALL' ? 'Tất cả' : type === 'EXPENSE' ? 'Chi tiêu' : 'Thu nhập'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : filteredTxs.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Không tìm thấy giao dịch nào.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTxs}
          renderItem={renderTxItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
          }
        />
      )}

      {/* FAB - Add Transaction */}
      <TouchableOpacity style={styles.fab} onPress={handleOpenCreate}>
        <Plus size={24} color="#ffffff" weight="bold" />
      </TouchableOpacity>

      {/* 1. Detail Modal */}
      <Modal
        visible={isDetailModalOpen}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={() => setIsDetailModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.modalTitle}>Chi tiết giao dịch</Text>
              <TouchableOpacity onPress={() => setIsDetailModalOpen(false)}>
                <Text style={styles.closeText}>Đóng</Text>
              </TouchableOpacity>
            </View>

            {selectedTx && (
              <ScrollView style={styles.modalScroll}>
                <View style={styles.detailContainer}>
                  {/* Big amount header */}
                  <View style={styles.detailAmountSection}>
                    <Text style={styles.detailTitleLabel}>{selectedTx.title}</Text>
                    <Text style={[styles.detailAmountValue, { color: selectedTx.type === 'INCOME' ? '#10b981' : '#ef4444' }]}>
                      {selectedTx.type === 'INCOME' ? '+' : '-'}{formatCurrency(selectedTx.amount)}
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  {/* Date, Category, Description Details */}
                  <View style={styles.detailRow}>
                    <Calendar size={18} color="#9ca3af" />
                    <View style={styles.detailTextCol}>
                      <Text style={styles.detailLabel}>Ngày thực hiện</Text>
                      <Text style={styles.detailValue}>
                        {new Date(selectedTx.transaction_date).toLocaleDateString('vi-VN')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Tag size={18} color="#9ca3af" />
                    <View style={styles.detailTextCol}>
                      <Text style={styles.detailLabel}>Danh mục</Text>
                      <Text style={styles.detailValue}>{getCategoryName(selectedTx.category_id)}</Text>
                    </View>
                  </View>

                  {selectedTx.description ? (
                    <View style={styles.detailRow}>
                      <FileText size={18} color="#9ca3af" />
                      <View style={styles.detailTextCol}>
                        <Text style={styles.detailLabel}>Ghi chú</Text>
                        <Text style={styles.detailValue}>{selectedTx.description}</Text>
                      </View>
                    </View>
                  ) : null}
                </View>

                {/* Buttons */}
                <View style={styles.modalActionRow}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteBtn]}
                    onPress={() => handleDeleteTx(selectedTx.id)}
                  >
                    <Trash size={18} color="#ef4444" />
                    <Text style={styles.deleteBtnText}>Xóa</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.editBtn]}
                    onPress={() => handleOpenEdit(selectedTx)}
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
        statusBarTranslucent={true}
        onRequestClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <View style={styles.bottomSheet}>
                <View style={styles.bottomSheetHeader}>
                  <Text style={styles.modalTitle}>
                    {isEditModalOpen ? 'Chỉnh sửa giao dịch' : 'Thêm giao dịch'}
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

                <ScrollView 
                  style={styles.modalScroll} 
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ flexGrow: 1 }}
                >
                  {/* Type Toggle */}
                  <View style={styles.formToggleRow}>
                    <TouchableOpacity
                      style={[styles.toggleBtn, form.type === 'EXPENSE' && styles.toggleBtnActiveExpense]}
                      onPress={() => setForm((prev) => ({ ...prev, type: 'EXPENSE' }))}
                    >
                      <Text style={[styles.toggleText, form.type === 'EXPENSE' && styles.toggleTextActive]}>Chi tiêu</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.toggleBtn, form.type === 'INCOME' && styles.toggleBtnActiveIncome]}
                      onPress={() => setForm((prev) => ({ ...prev, type: 'INCOME' }))}
                    >
                      <Text style={[styles.toggleText, form.type === 'INCOME' && styles.toggleTextActive]}>Thu nhập</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Form Fields */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Tiêu đề</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Tên giao dịch (VD: Ăn tối)..."
                      placeholderTextColor="#6b7280"
                      value={form.title}
                      onChangeText={(val) => setForm((prev) => ({ ...prev, title: val }))}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Số tiền</Text>
                    <View style={styles.amountInputContainer}>
                      <TextInput
                        style={[styles.input, { flex: 1, paddingRight: 40 }]}
                        placeholder="Nhập số tiền..."
                        placeholderTextColor="#6b7280"
                        keyboardType="numeric"
                        value={form.amount}
                        onChangeText={(val) => setForm((prev) => ({ ...prev, amount: formatAmountInput(val) }))}
                      />
                      <Text style={styles.amountSuffix}>đ</Text>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Ngày thực hiện</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#6b7280"
                      value={form.date}
                      onChangeText={(val) => setForm((prev) => ({ ...prev, date: val }))}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Danh mục</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catSelectionRow}>
                      <TouchableOpacity
                        style={[styles.catOption, form.categoryId === '' && styles.catOptionActive]}
                        onPress={() => setForm((prev) => ({ ...prev, categoryId: '' }))}
                      >
                        <Text style={styles.catOptionText}>Chưa phân loại</Text>
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
                    <Text style={styles.label}>Ghi chú</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Mô tả chi tiết giao dịch (nếu có)..."
                      placeholderTextColor="#6b7280"
                      multiline
                      numberOfLines={3}
                      value={form.description}
                      onChangeText={(val) => setForm((prev) => ({ ...prev, description: val }))}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={() => handleSaveTransaction(isEditModalOpen)}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.saveBtnText}>Lưu giao dịch</Text>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
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
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f1117',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#2d3148',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: '#f1f3f5',
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0f1117',
    borderWidth: 1,
    borderColor: '#2d3148',
  },
  activeFilterPill: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  filterPillText: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '600',
  },
  activeFilterPillText: {
    color: '#ffffff',
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
  txItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1d27',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2d3148',
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  txMeta: {
    flex: 1,
  },
  txTitleText: {
    color: '#f1f3f5',
    fontSize: 15,
    fontWeight: '600',
  },
  txSubText: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  txAmountText: {
    fontSize: 15,
    fontWeight: '700',
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
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountInputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  amountSuffix: {
    position: 'absolute',
    right: 16,
    color: '#9ca3af',
    fontSize: 15,
    fontWeight: '600',
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
  detailAmountSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  detailTitleLabel: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 6,
  },
  detailAmountValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#2d3148',
    marginVertical: 16,
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
  formToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#0f1117',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2d3148',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleBtnActiveExpense: {
    backgroundColor: '#ef4444',
  },
  toggleBtnActiveIncome: {
    backgroundColor: '#10b981',
  },
  toggleText: {
    color: '#9ca3af',
    fontWeight: '600',
    fontSize: 14,
  },
  toggleTextActive: {
    color: '#ffffff',
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
