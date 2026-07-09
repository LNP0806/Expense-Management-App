import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Modal, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, DeviceEventEmitter } from 'react-native';
import { categoriesApi } from '../../api/categories';
import { Plus, Trash, Pencil, Tag, FileText, CheckCircle } from 'phosphor-react-native';

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  const [form, setForm] = useState({
    name: '',
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

  const loadCategories = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      const res = await categoriesApi.getAll({ limit: 100 });
      if (res.data.success) {
        const list = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.data || []);
        setCategories(list);
      }
    } catch (e) {
      console.error('Error loading categories:', e);
      Alert.alert('Lỗi', 'Không thể tải danh sách danh mục');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCategories(true);
    }, [loadCategories])
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('sync-completed', () => {
      console.log('Sync complete event received in Categories, reloading...');
      loadCategories(false);
    });
    return () => sub.remove();
  }, [loadCategories]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCategories();
  };

  const handleDeleteCategory = (cat: any) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa danh mục "${cat.name}" không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await categoriesApi.delete(cat.id);
              if (res.data.success) {
                setCategories((prev) => prev.filter((c) => c.id !== cat.id));
                showToast('Đã xóa danh mục thành công!', 'success');
              }
            } catch (err: any) {
              console.error(err);
              const msg = err?.response?.data?.message || err?.message || 'Không thể xóa danh mục';
              showToast(msg, 'error');
            }
          },
        },
      ]
    );
  };

  const handleOpenEdit = (cat: any) => {
    setEditingCategory(cat);
    setForm({
      name: cat.name || '',
      description: cat.description || '',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenCreate = () => {
    setForm({
      name: '',
      description: '',
    });
    setIsCreateModalOpen(true);
  };

  const handleSaveCategory = async (isEdit: boolean) => {
    if (!form.name.trim()) {
      showToast('Vui lòng nhập tên danh mục', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
      };

      if (isEdit && editingCategory) {
        const res = await categoriesApi.update(editingCategory.id, payload);
        if (res.data.success) {
          const updated = res.data.data?.updatedCategory || res.data.data?.updated_category || res.data.data;
          setCategories((prev) => prev.map((c) => (c.id === editingCategory.id ? { ...c, ...updated } : c)));
          setIsEditModalOpen(false);
          setEditingCategory(null);
          showToast('Đã cập nhật danh mục thành công!', 'success');
        }
      } else {
        const res = await categoriesApi.create(payload);
        if (res.data.success) {
          const newCat = res.data.data?.newCategory || res.data.data?.new_category || res.data.data;
          setCategories((prev) => [...prev, newCat]);
          setIsCreateModalOpen(false);
          showToast('Đã thêm danh mục mới thành công!', 'success');
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

  const renderCategoryItem = ({ item }: { item: any }) => (
    <View style={styles.catItem}>
      <View style={styles.catLeft}>
        <View style={styles.iconBg}>
          <Tag size={20} color="#10b981" weight="fill" />
        </View>
        <View style={styles.catMeta}>
          <Text style={styles.catName} numberOfLines={1}>{item.name}</Text>
          {item.description ? (
            <Text style={styles.catDesc} numberOfLines={1}>{item.description}</Text>
          ) : (
            <Text style={styles.catDescNo}>Chưa có mô tả</Text>
          )}
        </View>
      </View>

      <View style={styles.catRightActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleOpenEdit(item)}>
          <Pencil size={18} color="#10b981" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteCategory(item)}>
          <Trash size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
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
        <Text style={styles.headerTitle}>Danh mục chi tiêu</Text>
        <Text style={styles.headerSubtitle}>Phân loại các khoản chi tiêu và nguồn thu</Text>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : categories.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Chưa có danh mục nào được tạo.</Text>
        </View>
      ) : (
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
          }
        />
      )}

      {/* FAB - Create Category */}
      <TouchableOpacity style={styles.fab} onPress={handleOpenCreate}>
        <Plus size={24} color="#ffffff" weight="bold" />
      </TouchableOpacity>

      {/* Create/Edit Form Modal */}
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
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={StyleSheet.absoluteFillObject} />
            </TouchableWithoutFeedback>

            <View style={styles.bottomSheet}>
              <View style={styles.bottomSheetHeader}>
                <Text style={styles.modalTitle}>
                  {isEditModalOpen ? 'Chỉnh sửa danh mục' : 'Thêm danh mục'}
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
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Tên danh mục</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="VD: Mua sắm, Làm thêm..."
                    placeholderTextColor="#6b7280"
                    value={form.name}
                    onChangeText={(val) => setForm((prev) => ({ ...prev, name: val }))}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Mô tả</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Mô tả danh mục chi tiêu này..."
                    placeholderTextColor="#6b7280"
                    multiline
                    numberOfLines={3}
                    value={form.description}
                    onChangeText={(val) => setForm((prev) => ({ ...prev, description: val }))}
                  />
                </View>

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={() => handleSaveCategory(isEditModalOpen)}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Lưu danh mục</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
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
  catItem: {
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
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(16,185,129,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  catMeta: {
    flex: 1,
  },
  catName: {
    color: '#f1f3f5',
    fontSize: 15,
    fontWeight: '600',
  },
  catDesc: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  catDescNo: {
    color: '#4b5563',
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  catRightActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#0f1117',
    borderWidth: 1,
    borderColor: '#2d3148',
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
