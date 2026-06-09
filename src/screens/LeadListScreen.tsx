import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, SafeAreaView, ScrollView, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LeadsStackParamList } from '../navigation/AppNavigator';
import { getLeads } from '../database/db';
import { Search, Plus, RefreshCw, Phone, MessageCircle, MapPin, FileText } from 'lucide-react-native';

type NavigationProp = NativeStackNavigationProp<LeadsStackParamList, 'LeadList'>;

export const LeadListScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const filters = ['All', 'Lead', 'Interested', 'Customer', 'Inactive', 'Lost'];

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

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadLeads();
    });
    return unsubscribe;
  }, [navigation]);

  const filteredLeads = leads.filter(lead => {
    const matchesFilter = activeFilter === 'All' || lead.lead_status === activeFilter;
    const matchesSearch = 
      (lead.shop_name && lead.shop_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.owner_name && lead.owner_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.mobile_number && lead.mobile_number.includes(searchQuery)) ||
      (lead.area && lead.area.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const renderSummaryCards = () => (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryCard}><Text style={styles.summaryValue}>{leads.length}</Text><Text style={styles.summaryLabel}>Total</Text></View>
      <View style={styles.summaryCard}><Text style={styles.summaryValue}>{leads.filter(l => l.lead_status === 'Customer').length}</Text><Text style={styles.summaryLabel}>Active</Text></View>
      <View style={styles.summaryCard}><Text style={styles.summaryValue}>{leads.filter(l => l.lead_status === 'Lead').length}</Text><Text style={styles.summaryLabel}>New</Text></View>
      <View style={styles.summaryCard}><Text style={styles.summaryValue}>0</Text><Text style={styles.summaryLabel}>Follow-ups</Text></View>
    </View>
  );

  const renderLeadCard = ({ item }: { item: any }) => {
    let interests = [];
    try {
      interests = item.product_interests ? JSON.parse(item.product_interests) : [];
    } catch (e) {}

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.shopName}>{item.shop_name}</Text>
            <Text style={styles.ownerName}>{item.owner_name}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.lead_status}</Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <Text style={styles.detailText}><MapPin size={14} color="#7F8C8D"/> {item.area}</Text>
          <Text style={styles.detailText}><Phone size={14} color="#7F8C8D"/> {item.mobile_number}</Text>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Last Visit</Text>
            <Text style={styles.infoValue}>{item.visit_date || 'N/A'}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Next Follow-up</Text>
            <Text style={styles.infoValue}>{item.next_followup_date || 'N/A'}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Orders/Value</Text>
            <Text style={styles.infoValue}>0 / ₹0</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Pending Amt</Text>
            <Text style={styles.infoValue}>₹0</Text>
          </View>
        </View>

        {interests.length > 0 && (
          <View style={styles.tagsContainer}>
            {interests.map((tag: string, index: number) => (
              <View key={index} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
            ))}
          </View>
        )}

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={() => Linking.openURL(`tel:${item.mobile_number}`)}>
            <Phone size={18} color="#3498DB"/>
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}><MessageCircle size={18} color="#2ECC71"/><Text style={styles.actionText}>WhatsApp</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}><MapPin size={18} color="#E74C3C"/><Text style={styles.actionText}>Map</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('LeadDetail', { lead: item })}>
            <FileText size={18} color="#9B59B6"/>
            <Text style={styles.actionText}>Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Customers</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton}><Search size={24} color="#2C3E50" /></TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('CreateLead')}><Plus size={24} color="#2C3E50" /></TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={loadLeads}><RefreshCw size={24} color="#2C3E50" /></TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredLeads}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderLeadCard}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {renderSummaryCards()}
            <View style={styles.searchContainer}>
              <Search size={20} color="#BDC3C7" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by Shop Name, Owner Name, Mobile..."
                placeholderTextColor="#BDC3C7"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <View style={styles.filterContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {filters.map(filter => (
                  <TouchableOpacity
                    key={filter}
                    style={[styles.filterChip, activeFilter === filter && styles.activeFilterChip]}
                    onPress={() => setActiveFilter(filter)}
                  >
                    <Text style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>{filter}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        }
        ListEmptyComponent={
          loading ? <ActivityIndicator size="large" color="#3498DB" style={{ marginTop: 50 }} /> : <Text style={styles.emptyText}>No leads found.</Text>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0E6ED' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#2C3E50' },
  headerActions: { flexDirection: 'row' },
  iconButton: { marginLeft: 16 },
  listContent: { padding: 16 },
  summaryContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  summaryCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 8, padding: 12, marginHorizontal: 4, alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
  summaryValue: { fontSize: 18, fontWeight: '700', color: '#2C3E50' },
  summaryLabel: { fontSize: 11, color: '#7F8C8D', marginTop: 4 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 8, paddingHorizontal: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E0E6ED' },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, color: '#2C3E50' },
  filterContainer: { marginBottom: 16 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#E0E6ED', marginRight: 8 },
  activeFilterChip: { backgroundColor: '#3498DB' },
  filterText: { color: '#34495E', fontWeight: '600', fontSize: 13 },
  activeFilterText: { color: '#FFFFFF' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  shopName: { fontSize: 16, fontWeight: '700', color: '#2C3E50' },
  ownerName: { fontSize: 14, color: '#34495E', marginTop: 2 },
  badge: { backgroundColor: '#E8F8F5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  badgeText: { color: '#16A085', fontSize: 12, fontWeight: '600' },
  cardDetails: { flexDirection: 'row', marginBottom: 16, gap: 16 },
  detailText: { fontSize: 13, color: '#7F8C8D', flex: 1 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16, backgroundColor: '#F8F9F9', borderRadius: 8, padding: 12 },
  infoCol: { width: '50%', marginBottom: 8 },
  infoLabel: { fontSize: 11, color: '#95A5A6', marginBottom: 2 },
  infoValue: { fontSize: 13, color: '#2C3E50', fontWeight: '600' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  tag: { backgroundColor: '#F0F3F4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginRight: 8, marginBottom: 8 },
  tagText: { color: '#34495E', fontSize: 11 },
  actionsContainer: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#ECF0F1', paddingTop: 12 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1 },
  actionText: { fontSize: 12, marginLeft: 4, color: '#34495E', fontWeight: '500' },
  emptyText: { textAlign: 'center', marginTop: 32, color: '#7F8C8D' }
});
