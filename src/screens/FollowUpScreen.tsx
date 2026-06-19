import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DrawerParamList, LeadsStackParamList } from '../navigation/AppNavigator';
import { getLeads } from '../database/db';
import { Calendar, AlertCircle, Clock, ChevronRight } from 'lucide-react-native';

type NavigationProp = NativeStackNavigationProp<LeadsStackParamList, 'LeadList'>;

export const FollowUpScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Today' | 'Upcoming' | 'Overdue'>('Today');

  const loadLeads = async () => {
    setLoading(true);
    try {
      const data = await getLeads();
      setLeads(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadLeads();
    }, [])
  );

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredLeads = leads.filter(lead => {
    if (!lead.next_followup_date) return false;
    // Don't show follow ups for won or lost leads
    if (lead.lead_status === 'Customer' || lead.lead_status === 'Lost') return false;

    if (activeTab === 'Today') {
      return lead.next_followup_date === todayStr;
    } else if (activeTab === 'Upcoming') {
      return lead.next_followup_date > todayStr;
    } else if (activeTab === 'Overdue') {
      return lead.next_followup_date < todayStr;
    }
    return false;
  }).sort((a, b) => {
    // Sort by date ascending
    return new Date(a.next_followup_date).getTime() - new Date(b.next_followup_date).getTime();
  });

  const renderLeadCard = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => (navigation as any).navigate('Leads', { screen: 'LeadDetail', params: { lead: item } })}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.shopName}>{item.shop_name}</Text>
          <Text style={styles.ownerName}>{item.owner_name}</Text>
        </View>
        <ChevronRight size={20} color="#BDC3C7" />
      </View>
      <View style={styles.cardDetails}>
        <Text style={styles.detailLabel}>Follow-up Note:</Text>
        <Text style={styles.detailValue} numberOfLines={2}>
          {item.followup_notes || 'No specific notes recorded.'}
        </Text>
        <View style={styles.dateContainer}>
           <Calendar size={14} color={activeTab === 'Overdue' ? '#E74C3C' : '#3498DB'} />
           <Text style={[styles.dateText, activeTab === 'Overdue' && styles.overdueText]}>
             Scheduled for: {item.next_followup_date}
           </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Follow-ups</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Today' && styles.activeTab]} 
          onPress={() => setActiveTab('Today')}
        >
          <Clock size={16} color={activeTab === 'Today' ? '#3498DB' : '#7F8C8D'} />
          <Text style={[styles.tabText, activeTab === 'Today' && styles.activeTabText]}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Upcoming' && styles.activeTab]} 
          onPress={() => setActiveTab('Upcoming')}
        >
          <Calendar size={16} color={activeTab === 'Upcoming' ? '#3498DB' : '#7F8C8D'} />
          <Text style={[styles.tabText, activeTab === 'Upcoming' && styles.activeTabText]}>Upcoming</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Overdue' && styles.activeTab]} 
          onPress={() => setActiveTab('Overdue')}
        >
          <AlertCircle size={16} color={activeTab === 'Overdue' ? '#E74C3C' : '#7F8C8D'} />
          <Text style={[styles.tabText, activeTab === 'Overdue' && styles.activeTabTextOverdue]}>Overdue</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3498DB" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredLeads}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderLeadCard}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No {activeTab.toLowerCase()} follow-ups.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0E6ED' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#2C3E50' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E0E6ED' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 6 },
  activeTab: { backgroundColor: '#F0F8FF' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#7F8C8D' },
  activeTabText: { color: '#3498DB' },
  activeTabTextOverdue: { color: '#E74C3C' },
  listContent: { padding: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  shopName: { fontSize: 16, fontWeight: '700', color: '#2C3E50' },
  ownerName: { fontSize: 14, color: '#7F8C8D', marginTop: 2 },
  cardDetails: { backgroundColor: '#F8F9F9', padding: 12, borderRadius: 8 },
  detailLabel: { fontSize: 12, color: '#95A5A6', marginBottom: 4 },
  detailValue: { fontSize: 14, color: '#34495E', marginBottom: 12 },
  dateContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 13, color: '#3498DB', fontWeight: '500' },
  overdueText: { color: '#E74C3C' },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#95A5A6' }
});
