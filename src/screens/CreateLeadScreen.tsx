import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, SafeAreaView, KeyboardAvoidingView, Platform, PermissionsAndroid } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { insertLead, updateLead } from '../database/db';
import { ArrowLeft, Save, Calendar as CalendarIcon, CheckSquare, Square, Camera } from 'lucide-react-native';

export const CreateLeadScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { editLead } = (route.params as any) || {};

  const [formData, setFormData] = useState({
    shop_name: editLead?.shop_name || '', owner_name: editLead?.owner_name || '', mobile_number: editLead?.mobile_number || '', whatsapp_number: editLead?.whatsapp_number || '', area: editLead?.area || '', address: editLead?.address || '', city: editLead?.city || '', map_url: editLead?.map_url || '',
    lead_status: editLead?.lead_status || 'Lead', lead_source: editLead?.lead_source || 'Direct Visit',
    visit_date: editLead?.visit_date || '', visit_notes: editLead?.visit_notes || '', visit_outcome: editLead?.visit_outcome || 'Interested',
    next_followup_date: editLead?.next_followup_date || '', followup_notes: editLead?.followup_notes || '',
    customer_requirements: editLead?.customer_requirements || '', special_remarks: editLead?.special_remarks || '',
    shop_photo_uri: editLead?.shop_photo_uri || '', business_card_photo_uri: editLead?.business_card_photo_uri || ''
  });

  const initialInterests = editLead?.product_interests ? JSON.parse(editLead.product_interests) : [];
  const [productInterests, setProductInterests] = useState<string[]>(initialInterests);
  const [datePickerState, setDatePickerState] = useState<{ show: boolean, field: 'visit_date' | 'next_followup_date' | null }>({ show: false, field: null });
  const [isWhatsappSameAsMobile, setIsWhatsappSameAsMobile] = useState(
    editLead ? editLead.mobile_number === editLead.whatsapp_number : false
  );

  const statuses = ['Lead', 'Interested', 'Sample Given', 'Negotiation', 'Customer', 'Lost'];
  const sources = ['Direct Visit', 'Reference', 'Existing Customer', 'Social Media', 'Walk-in', 'Other'];
  const outcomes = ['Interested', 'Need Follow-up', 'Order Expected', 'Not Interested'];
  const interestOptions = ['Silver Anklets', 'Kids Collection', 'Premium Designs', 'Wholesale', 'Retail'];

  useEffect(() => {
    if (isWhatsappSameAsMobile) {
      setFormData(prev => ({ ...prev, whatsapp_number: prev.mobile_number }));
    }
  }, [formData.mobile_number, isWhatsappSameAsMobile]);

  const toggleInterest = (interest: string) => {
    if (productInterests.includes(interest)) {
      setProductInterests(productInterests.filter(i => i !== interest));
    } else {
      setProductInterests([...productInterests, interest]);
    }
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: "Camera Permission",
            message: "App needs camera permission to take photos.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const pickImage = async (field: 'shop_photo_uri' | 'business_card_photo_uri') => {
    Alert.alert('Select Photo', 'Choose an option', [
      {
        text: 'Camera', onPress: async () => {
          const hasPermission = await requestCameraPermission();
          if (!hasPermission) {
            Alert.alert("Permission Denied", "Camera permission is required to take photos.");
            return;
          }
          launchCamera({ mediaType: 'photo', saveToPhotos: true }, (res) => {
            if (res.assets && res.assets.length > 0) {
              setFormData({ ...formData, [field]: res.assets[0].uri || '' });
            } else if (res.errorMessage) {
              Alert.alert("Camera Error", res.errorMessage);
            }
          });
        }
      },
      {
        text: 'Gallery', onPress: () => {
          launchImageLibrary({ mediaType: 'photo' }, (res) => {
            if (res.assets && res.assets.length > 0) {
              setFormData({ ...formData, [field]: res.assets[0].uri || '' });
            }
          });
        }
      },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const handleSave = async (isCustomer: boolean = false) => {
    if (!formData.shop_name || !formData.owner_name || !formData.mobile_number || !formData.area || !formData.city || !formData.visit_date || !formData.visit_outcome || !formData.next_followup_date) {
      Alert.alert('Validation Error', 'Please fill all required fields (*).');
      return;
    }

    if (!/^\d+$/.test(formData.mobile_number)) {
      Alert.alert('Validation Error', 'Mobile number must contain only numbers, no letters or special characters.');
      return;
    }

    if (new Date(formData.visit_date) >= new Date(formData.next_followup_date)) {
      Alert.alert('Validation Error', 'Visit Date must be before the Next Follow-up Date.');
      return;
    }

    const finalData = {
      ...formData,
      lead_status: isCustomer ? 'Customer' : formData.lead_status,
      product_interests: JSON.stringify(productInterests)
    };

    try {
      if (editLead && editLead.id) {
        await updateLead(editLead.id, finalData);
      } else {
        await insertLead(finalData);
      }
      Alert.alert('Success', 'Lead saved successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save lead.');
      console.error(error);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setDatePickerState({ ...datePickerState, show: false });
    }

    if (selectedDate && datePickerState.field) {
      const currentDate = selectedDate.toISOString().split('T')[0];
      setFormData({ ...formData, [datePickerState.field]: currentDate });
    }
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderInput = (label: string, field: keyof typeof formData, required: boolean = false, placeholder?: string, editable: boolean = true, keyboardType: any = 'default') => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label} {required && <Text style={styles.required}>*</Text>}</Text>
      <TextInput
        style={[styles.input, !editable && styles.inputDisabled]}
        placeholder={placeholder || `Enter ${label}`}
        placeholderTextColor="#BDC3C7"
        value={formData[field]}
        onChangeText={(text) => setFormData({ ...formData, [field]: text })}
        editable={editable}
        keyboardType={keyboardType}
      />
    </View>
  );

  const renderDateInput = (label: string, field: 'visit_date' | 'next_followup_date', required: boolean = false) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label} {required && <Text style={styles.required}>*</Text>}</Text>
      <TouchableOpacity
        style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
        onPress={() => setDatePickerState({ show: true, field })}
      >
        <Text style={{ color: formData[field] ? '#2C3E50' : '#BDC3C7', fontSize: 16 }}>
          {formData[field] || 'Select Date'}
        </Text>
        <CalendarIcon size={20} color="#BDC3C7" />
      </TouchableOpacity>
    </View>
  );

  const renderImagePicker = (label: string, field: 'shop_photo_uri' | 'business_card_photo_uri') => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.imagePickerBtn} onPress={() => pickImage(field)}>
        <Camera size={20} color={formData[field] ? '#2ECC71' : '#3498DB'} />
        <Text style={[styles.imagePickerText, formData[field] && { color: '#2ECC71' }]}>
          {formData[field] ? 'Photo Selected (Tap to change)' : 'Select Photo'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderChips = (label: string, options: string[], selectedValue: string, onSelect: (val: string) => void) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chipsContainer}>
        {options.map(opt => (
          <TouchableOpacity key={opt} style={[styles.chip, selectedValue === opt && styles.activeChip]} onPress={() => onSelect(opt)}>
            <Text style={[styles.chipText, selectedValue === opt && styles.activeChipText]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderMultiChips = (label: string, options: string[], selectedValues: string[], onToggle: (val: string) => void) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chipsContainer}>
        {options.map(opt => (
          <TouchableOpacity key={opt} style={[styles.chip, selectedValues.includes(opt) && styles.activeChip]} onPress={() => onToggle(opt)}>
            <Text style={[styles.chipText, selectedValues.includes(opt) && styles.activeChipText]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{editLead ? 'Edit Lead' : 'Create Lead'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.formContainer} contentContainerStyle={{ paddingBottom: 40 }}>

          {renderSection('Basic Details', <>
            {renderInput('Shop Name', 'shop_name', true)}
            {renderInput('Owner Name', 'owner_name', true)}
            {renderInput('Mobile Number', 'mobile_number', true, 'e.g. 9876543210', true, 'phone-pad')}

            <TouchableOpacity style={styles.checkboxContainer} onPress={() => setIsWhatsappSameAsMobile(!isWhatsappSameAsMobile)}>
              {isWhatsappSameAsMobile ? <CheckSquare size={20} color="#3498DB" /> : <Square size={20} color="#7F8C8D" />}
              <Text style={styles.checkboxLabel}>WhatsApp same as Mobile</Text>
            </TouchableOpacity>

            {renderInput('WhatsApp Number', 'whatsapp_number', false, 'e.g. 9876543210', !isWhatsappSameAsMobile, 'phone-pad')}
            {renderInput('Area', 'area', true)}
            {renderInput('City', 'city', true)}
            {renderInput('Address', 'address')}
            {renderInput('Map URL', 'map_url', false, 'e.g. https://maps.app.goo.gl/...')}
            {renderChips('Lead Status', statuses, formData.lead_status, (val) => setFormData({ ...formData, lead_status: val }))}
          </>)}

          {renderSection('Product Interests', <>
            {renderMultiChips('Interests', interestOptions, productInterests, toggleInterest)}
          </>)}

          {renderSection('Lead Source', <>
            {renderChips('Source', sources, formData.lead_source, (val) => setFormData({ ...formData, lead_source: val }))}
          </>)}

          {renderSection('Visit Information', <>
            {renderDateInput('Visit Date', 'visit_date', true)}
            {renderChips('Visit Outcome', outcomes, formData.visit_outcome, (val) => setFormData({ ...formData, visit_outcome: val }))}
            {renderInput('Visit Notes', 'visit_notes')}
          </>)}

          {renderSection('Follow-up Information', <>
            {renderDateInput('Next Follow-up Date', 'next_followup_date', true)}
            {renderInput('Follow-up Notes', 'followup_notes')}
          </>)}

          {renderSection('Additional Notes', <>
            {renderInput('Customer Requirements', 'customer_requirements')}
            {renderInput('Special Remarks', 'special_remarks')}
          </>)}

          {renderSection('Attachments', <>
            {renderImagePicker('Shop Photo', 'shop_photo_uri')}
            {renderImagePicker('Business Card Photo', 'business_card_photo_uri')}
          </>)}

          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => handleSave(false)}>
              <Save size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>Save Lead</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={() => handleSave(false)}>
              <Text style={styles.secondaryBtnText}>Save & Add Follow-up</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.secondaryBtn, { borderColor: '#16A085' }]} onPress={() => handleSave(true)}>
              <Text style={[styles.secondaryBtnText, { color: '#16A085' }]}>Convert to Customer</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {datePickerState.show && (
        <DateTimePicker
          value={formData[datePickerState.field!] ? new Date(formData[datePickerState.field!]) : new Date()}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0E6ED' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#2C3E50' },
  formContainer: { flex: 1, padding: 16 },
  section: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#2C3E50', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#ECF0F1', paddingBottom: 8 },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#34495E', marginBottom: 8 },
  required: { color: '#E74C3C' },
  input: { backgroundColor: '#F8F9F9', borderWidth: 1, borderColor: '#E0E6ED', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#2C3E50' },
  inputDisabled: { backgroundColor: '#E0E6ED', color: '#7F8C8D' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  checkboxLabel: { fontSize: 15, color: '#34495E', marginLeft: 8, fontWeight: '500' },
  imagePickerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F3F4', borderWidth: 1, borderColor: '#BDC3C7', borderStyle: 'dashed', borderRadius: 8, padding: 16, justifyContent: 'center' },
  imagePickerText: { marginLeft: 12, fontSize: 15, color: '#3498DB', fontWeight: '600' },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { backgroundColor: '#F0F3F4', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#E0E6ED' },
  activeChip: { backgroundColor: '#3498DB', borderColor: '#3498DB' },
  chipText: { color: '#34495E', fontWeight: '500', fontSize: 14 },
  activeChipText: { color: '#FFFFFF' },
  actionsContainer: { marginTop: 8, gap: 12 },
  primaryBtn: { flexDirection: 'row', backgroundColor: '#3498DB', borderRadius: 8, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#3498DB', borderRadius: 8, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { color: '#3498DB', fontSize: 16, fontWeight: '600' }
});
