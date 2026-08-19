import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { aiApi } from '../../api/ai';
import { transactionsApi } from '../../api/transactions';
import { categoriesApi } from '../../api/categories';
import { Camera, Image as ImageIcon, Sparkle, CheckCircle, ArrowLeft, X, Trash, ArrowClockwise } from 'phosphor-react-native';

const { width } = Dimensions.get('window');
const VIEWPORT_SIZE = width - 40;

export default function QuickCaptureScreen() {
  const router = useRouter();
  const cameraRef = useRef<any>(null);
  
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');

  // Image & caption states
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');

  // AI & Form states
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: '',
    amount: '',
    type: 'EXPENSE' as 'EXPENSE' | 'INCOME',
    categoryId: '',
    date: new Date().toISOString().substring(0, 10),
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

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await categoriesApi.getAll({ limit: 100 });
        if (res.data.success) {
          const list = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.data || []);
          setCategories(list);
        }
      } catch (e) {
        console.error('Error loading categories:', e);
      }
    }
    loadCategories();
  }, []);

  // Request permissions if not granted
  const handleRequestPermission = async () => {
    await requestPermission();
  };

  // Launch gallery picker
  const handleLaunchLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Yêu cầu quyền truy cập', 'Vui lòng cấp quyền truy cập album để chọn ảnh hóa đơn.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Take photo using expo-camera
  const handleTakePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.85,
          skipProcessing: false,
        });
        if (photo && photo.uri) {
          setImageUri(photo.uri);
        }
      } catch (e) {
        console.error('Take photo error:', e);
        Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
      }
    }
  };

  const handleRemoveImage = () => {
    setImageUri(null);
  };

  const toggleCameraFacing = () => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  // Trigger AI parsing
  const handleStartAnalysis = async () => {
    if (!caption.trim()) {
      Alert.alert('Thông báo', 'Vui lòng điền mô tả giao dịch (VD: Đi ăn phở 45k)');
      return;
    }

    setStep(2);
    setLoading(true);

    try {
      const res = await aiApi.parseTransaction(caption.trim());
      if (res.data.success) {
        const aiData = res.data.data;
        setForm({
          title: aiData.title || '',
          amount: aiData.amount ? String(aiData.amount) : '',
          type: aiData.type || 'EXPENSE',
          categoryId: aiData.category_id || '',
          date: new Date().toISOString().substring(0, 10),
          description: caption.trim(),
        });
        setStep(3); // Go to confirmation form
      }
    } catch (e: any) {
      console.error('AI parse error:', e);
      // Fallback
      setForm({
        title: '',
        amount: '',
        type: 'EXPENSE',
        categoryId: '',
        date: new Date().toISOString().substring(0, 10),
        description: caption.trim(),
      });
      setStep(3);
      Alert.alert('AI Phân Tích Lỗi', 'Không thể tự động phân tích cú pháp. Bạn có thể tự điền giao dịch ở bước sau.');
    } finally {
      setLoading(false);
    }
  };

  // Save Transaction
  const handleSaveTransaction = async () => {
    if (!form.title.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập tiêu đề');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      Alert.alert('Thông báo', 'Vui lòng nhập số tiền hợp lệ');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('amount', String(form.amount));
      formData.append('type', form.type);
      formData.append('transaction_date', form.date);
      if (form.description.trim()) formData.append('description', form.description.trim());
      if (form.categoryId) formData.append('category_id', form.categoryId);

      if (imageUri) {
        const filename = imageUri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append('image', {
          uri: imageUri,
          name: filename,
          type,
        } as any);
      }

      const res = await transactionsApi.create(formData);
      if (res.data.success) {
        showToast('Giao dịch đã được lưu thành công!', 'success');
        setTimeout(() => {
          resetFlow();
          router.replace('/(tabs)');
        }, 1500);
      }
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.message || e?.message || 'Có lỗi xảy ra khi lưu giao dịch';
      Alert.alert('Lỗi', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const resetFlow = () => {
    setCaption('');
    setImageUri(null);
    setStep(1);
  };

  // Handle permission loading/states
  if (!permission) {
    return (
      <View style={styles.permissionScreen}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!permission.granted && step === 1) {
    return (
      <View style={styles.permissionScreen}>
        <Camera size={64} color="#10b981" weight="fill" style={{ marginBottom: 16 }} />
        <Text style={styles.permissionTitle}>Quyền truy cập Camera</Text>
        <Text style={styles.permissionText}>
          SmartSpend cần truy cập Camera để bạn có thể chụp ảnh hóa đơn theo phong cách Locket cực chất.
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={handleRequestPermission}>
          <Text style={styles.permissionBtnText}>Cấp quyền Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.galleryFallbackBtn} onPress={handleLaunchLibrary}>
          <Text style={styles.galleryFallbackBtnText}>Chọn ảnh từ thư viện</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {toast.visible && (
        <View style={[styles.toastBanner, toast.type === 'success' ? styles.toastSuccess : styles.toastError]}>
          <CheckCircle size={20} color="#ffffff" weight="fill" />
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}
      {/* Step Header */}
      {step < 4 && (
        <View style={styles.header}>
          {step > 1 && (
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep((prev) => (prev - 1) as any)}>
              <ArrowLeft size={20} color="#f1f3f5" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Chụp hóa đơn AI</Text>
          <View style={styles.stepDots}>
            <View style={[styles.dot, step >= 1 && styles.dotActive]} />
            <View style={[styles.dot, step >= 2 && styles.dotActive]} />
            <View style={[styles.dot, step >= 3 && styles.dotActive]} />
          </View>
        </View>
      )}

      {/* Step 1: Locket Camera Shutter and Caption */}
      {step === 1 && (
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* Locket Camera Viewport */}
          <View style={styles.viewportContainer}>
            <View style={styles.cameraViewport}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.viewportImage} />
              ) : (
                <CameraView ref={cameraRef} style={styles.camera} facing={facing} />
              )}
            </View>
          </View>

          {/* Shutter controls OR Caption layout */}
          {!imageUri ? (
            /* Layout 1: Live camera view -> capture shutter buttons */
            <View style={styles.controlsRow}>
              {/* Gallery button */}
              <TouchableOpacity style={styles.controlSubBtn} onPress={handleLaunchLibrary}>
                <ImageIcon size={24} color="#f1f3f5" weight="fill" />
              </TouchableOpacity>

              {/* Shutter capture button */}
              <TouchableOpacity style={styles.shutterButton} onPress={handleTakePhoto} activeOpacity={0.85}>
                <View style={styles.shutterButtonInner} />
              </TouchableOpacity>

              {/* Flip camera button */}
              <TouchableOpacity style={styles.controlSubBtn} onPress={toggleCameraFacing}>
                <ArrowClockwise size={24} color="#f1f3f5" weight="bold" />
              </TouchableOpacity>
            </View>
          ) : (
            /* Layout 2: Photo taken -> fill in caption details */
            <View style={styles.captionContainer}>
              <View style={styles.captionInputWrapper}>
                <TextInput
                  style={styles.captionInput}
                  placeholder="Nhập mô tả giao dịch (VD: Ăn phở bò 45k)..."
                  placeholderTextColor="#6b7280"
                  multiline
                  value={caption}
                  onChangeText={setCaption}
                  maxLength={100}
                />
              </View>

              <View style={styles.captionActionsRow}>
                {/* Cancel/Retake */}
                <TouchableOpacity style={styles.retakeBtn} onPress={handleRemoveImage}>
                  <Trash size={22} color="#ef4444" weight="fill" />
                  <Text style={styles.retakeText}>Chụp lại</Text>
                </TouchableOpacity>

                {/* AI Parse */}
                <TouchableOpacity style={styles.analyzeBtn} onPress={handleStartAnalysis}>
                  <Sparkle size={20} color="#ffffff" weight="fill" />
                  <Text style={styles.analyzeText}>AI Phân tích</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

        </ScrollView>
      )}

      {/* Step 2: Scanning Overlay */}
      {step === 2 && (
        <View style={styles.centeredContent}>
          {imageUri && (
            <View style={[styles.viewportContainer, { marginBottom: 30 }]}>
              <View style={styles.cameraViewport}>
                <Image source={{ uri: imageUri }} style={styles.viewportImage} />
                <View style={styles.scanningOverlay}>
                  <ActivityIndicator size="large" color="#10b981" />
                </View>
              </View>
            </View>
          )}
          <Text style={styles.loadingTitle}>Đang phân tích hóa đơn...</Text>
          <Text style={styles.loadingSubtitle}>Trợ lý AI đang đọc nội dung hóa đơn và mô tả của bạn</Text>
        </View>
      )}

      {/* Step 3: Confirmation Form */}
      {step === 3 && (
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.formTitleText}>Xác nhận Giao dịch</Text>

          {imageUri && (
            <View style={[styles.viewportContainer, { marginBottom: 20 }]}>
              <View style={[styles.cameraViewport, { width: 140, height: 140, borderRadius: 16 }]}>
                <Image source={{ uri: imageUri }} style={styles.viewportImage} />
              </View>
            </View>
          )}

          {/* Toggle Type */}
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

          {/* Inputs */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tiêu đề</Text>
            <TextInput
              style={styles.input}
              value={form.title}
              onChangeText={(val) => setForm((prev) => ({ ...prev, title: val }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số tiền (VND)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={form.amount}
              onChangeText={(val) => setForm((prev) => ({ ...prev, amount: val }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ngày giao dịch</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
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
              {categories.map((c) => (
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
              multiline
              numberOfLines={3}
              value={form.description}
              onChangeText={(val) => setForm((prev) => ({ ...prev, description: val }))}
            />
          </View>

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSaveTransaction}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.saveBtnText}>Lưu & Hoàn Tất</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1117',
  },
  permissionScreen: {
    flex: 1,
    backgroundColor: '#0f1117',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f3f5',
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  permissionBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  permissionBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  galleryFallbackBtn: {
    paddingVertical: 12,
  },
  galleryFallbackBtnText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#1a1d27',
    borderBottomWidth: 1,
    borderColor: '#2d3148',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f1f3f5',
  },
  stepDots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#374151',
  },
  dotActive: {
    backgroundColor: '#10b981',
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 40,
  },
  viewportContainer: {
    width: VIEWPORT_SIZE,
    height: VIEWPORT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  cameraViewport: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#2d3148',
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  viewportImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: VIEWPORT_SIZE,
    paddingHorizontal: 20,
    marginTop: 24,
  },
  controlSubBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1a1d27',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2d3148',
  },
  shutterButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
  },
  captionContainer: {
    width: VIEWPORT_SIZE,
    marginTop: 20,
  },
  captionInputWrapper: {
    backgroundColor: '#1a1d27',
    borderWidth: 1,
    borderColor: '#2d3148',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  captionInput: {
    color: '#f1f3f5',
    fontSize: 15,
    minHeight: 56,
    textAlignVertical: 'top',
  },
  captionActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  retakeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    gap: 6,
  },
  retakeText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  analyzeBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 14,
    paddingVertical: 12,
    gap: 6,
  },
  analyzeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f1f3f5',
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  formTitleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f3f5',
    marginBottom: 16,
  },
  formToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#1a1d27',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2d3148',
    width: '100%',
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
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1d27',
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
    backgroundColor: '#1a1d27',
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
    marginBottom: 40,
    width: '100%',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f1f3f5',
    marginTop: 20,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 32,
  },
  successBtnPrimary: {
    backgroundColor: '#10b981',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  successBtnTextPrimary: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  successBtnSecondary: {
    backgroundColor: '#1a1d27',
    borderWidth: 1,
    borderColor: '#2d3148',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  successBtnTextSecondary: {
    color: '#9ca3af',
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
