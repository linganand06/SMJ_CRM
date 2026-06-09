import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ArrowLeft, User, Phone, MapPin, Building, Calendar, Info, FileText } from 'lucide-react-native';

export const LeadDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { lead } = route.params as { lead: any };

  const renderSection = (title: string, data: { label: string, value: string }[], icon: any) => {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          {icon}
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <View style={styles.sectionContent}>
          {data.map((item, index) => (
            <View key={index} style={styles.dataRow}>
              <Text style={styles.dataLabel}>{item.label}</Text>
              <Text style={styles.dataValue}>{item.value || 'N/A'}</Text>
            </View>
          ))}
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lead Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        
        <View style={styles.mainInfoCard}>
          <Text style={styles.shopName}>{lead.shop_name}</Text>
          <Text style={styles.ownerName}>{lead.owner_name}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{lead.lead_status}</Text>
          </View>
        </View>

        {renderSection('Contact Information', [
          { label: 'Mobile Number', value: lead.mobile_number },
          { label: 'WhatsApp', value: lead.whatsapp_number }
        ], <Phone size={20} color="#3498DB" />)}

        {renderSection('Location Details', [
          { label: 'Area', value: lead.area },
          { label: 'City', value: lead.city },
          { label: 'Address', value: lead.address }
        ], <MapPin size={20} color="#E74C3C" />)}

        {renderSection('Business Information', [
          { label: 'Product Interests', value: lead.product_interests ? JSON.parse(lead.product_interests).join(', ') : 'N/A' },
          { label: 'Lead Source', value: lead.lead_source },
          { label: 'Customer Requirements', value: lead.customer_requirements },
          { label: 'Special Remarks', value: lead.special_remarks }
        ], <Building size={20} color="#9B59B6" />)}

        {renderSection('Activity & Follow-up', [
          { label: 'Visit Date', value: lead.visit_date },
          { label: 'Visit Outcome', value: lead.visit_outcome },
          { label: 'Visit Notes', value: lead.visit_notes },
          { label: 'Next Follow-up', value: lead.next_followup_date },
          { label: 'Follow-up Notes', value: lead.followup_notes }
        ], <Calendar size={20} color="#2ECC71" />)}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0E6ED' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#2C3E50' },
  content: { padding: 16 },
  mainInfoCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2, alignItems: 'center' },
  shopName: { fontSize: 22, fontWeight: '700', color: '#2C3E50', marginBottom: 4 },
  ownerName: { fontSize: 16, color: '#34495E', marginBottom: 12 },
  badge: { backgroundColor: '#E8F8F5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  badgeText: { color: '#16A085', fontSize: 14, fontWeight: '600' },
  section: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F0F3F4', paddingBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#2C3E50', marginLeft: 12 },
  sectionContent: {},
  dataRow: { marginBottom: 12 },
  dataLabel: { fontSize: 13, color: '#7F8C8D', marginBottom: 4, fontWeight: '500' },
  dataValue: { fontSize: 15, color: '#2C3E50', fontWeight: '600' },
});
