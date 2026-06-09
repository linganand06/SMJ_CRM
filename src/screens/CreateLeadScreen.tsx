import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { insertLead } from '../database/db';
import { ArrowLeft, Save, Calendar as CalendarIcon } from 'lucide-react-native';

export const CreateLeadScreen = () => {
  const navigation = useNavigation();

  const [formData, setFormData] = useState({
    shop_name: '', owner_name: '', mobile_number: '', whatsapp_number: '', area: '', address: '', city: '',
    lead_status: 'Lead', lead_source: 'Direct Visit',
    visit_date: '', visit_notes: '', visit_outcome: 'Interested',
    next_followup_date: '', followup_notes: '',
    customer_requirements: '', special_remarks: '',
    shop_photo_uri: '', business_card_photo_uri: ''
  });

  const [productInterests, setProductInterests] = useState<string[]>([]);
  const [datePickerState, setDatePickerState] = useState<{show: boolean, field: 'visit_date' | 'next_followup_date' | null}>({show: false, field: null});

  const statuses = ['Lead', 'Interested', 'Sample Given', 'Negotiation', 'Customer', 'Lost'];
  const sources = ['Direct Visit', 'Reference', 'Existing Customer', 'Social Media', 'Walk-in', 'Other'];
  const outcomes = ['Interested', 'Need Follow-up', 'Order Expected', 'Not Interested'];
  const interestOptions = ['Silver Anklets', 'Kids Collection', 'Premium Designs', 'Wholesale', 'Retail'];

  const toggleInterest = (interest: string) => {
    if (productInterests.includes(interest)) {
      setProductInterests(productInterests.filter(i => i !== interest));
    } else {
      setProductInterests([...productInterests, interest]);
    }
  };

  const handleSave = async (isCustomer: boolean = false) => {
    if (!formData.shop_name || !formData.owner_name || !formData.mobile_number || !formData.area || !formData.next_followup_date) {
      Alert.alert('Validation Error', 'Please fill all required fields (*).');
      return;
    }

    const finalData = {
      ...formData,
      lead_status: isCustomer ? 'Customer' : formData.lead_status,
      product_interests: JSON.stringify(productInterests)
    };

    try {
      await insertLead(finalData);
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

  const renderInput = (label: string, field: keyof typeof formData, required: boolean = false, placeholder?: string) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label} {required && <Text style={styles.required}>*</Text>}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder || `Enter ${label}`}
        placeholderTextColor="#BDC3C7"
        value={formData[field]}
        onChangeText={(text) => setFormData({ ...formData, [field]: text })}
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
        <Text style={styles.headerTitle}>Create Lead</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.formContainer} contentContainerStyle={{ paddingBottom: 40 }}>
          
          {renderSection('Basic Details', <>
            {renderInput('Shop Name', 'shop_name', true)}
            {renderInput('Owner Name', 'owner_name', true)}
            {renderInput('Mobile Number', 'mobile_number', true)}
            {renderInput('WhatsApp Number', 'whatsapp_number')}
            {renderInput('Area', 'area', true)}
            {renderInput('Address', 'address')}
            {renderInput('City', 'city')}
            {renderChips('Lead Status', statuses, formData.lead_status, (val) => setFormData({ ...formData, lead_status: val }))}
          </>)}

          {renderSection('Product Interests', <>
            {renderMultiChips('Interests', interestOptions, productInterests, toggleInterest)}
          </>)}

          {renderSection('Lead Source', <>
            {renderChips('Source', sources, formData.lead_source, (val) => setFormData({ ...formData, lead_source: val }))}
          </>)}

          {renderSection('Visit Information', <>
            {renderDateInput('Visit Date', 'visit_date', false)}
            {renderInput('Visit Notes', 'visit_notes')}
            {renderChips('Visit Outcome', outcomes, formData.visit_outcome, (val) => setFormData({ ...formData, visit_outcome: val }))}
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
            {renderInput('Shop Photo URL', 'shop_photo_uri')}
            {renderInput('Business Card Photo URL', 'business_card_photo_uri')}
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
