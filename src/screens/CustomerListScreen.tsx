import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, SafeAreaView, Linking, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CustomerStackParamList } from '../navigation/AppNavigator';
import { getLeads, getCustomerOrderSummary } from '../database/db';
import { Search, RefreshCw, Phone, MessageCircle, MapPin, FileText, ShoppingBag } from 'lucide-react-native';

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList, 'CustomerList'>;

export const CustomerListScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderSummaries, setOrderSummaries] = useState<Record<number, any>>({});

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await getLeads();
      const customersOnly = data.filter((lead: any) => lead.lead_status === 'Customer');
      setLeads(customersOnly);
      // Fetch order summaries for every customer
      const summaries: Record<number, any> = {};
      await Promise.all(
        customersOnly.map(async (c: any) => {
          summaries[c.id] = await getCustomerOrderSummary(c.id);
        })
      );
      setOrderSummaries(summaries);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadCustomers();
    }, [])
  );

  const filteredLeads = leads.filter(lead => {
    return (lead.shop_name && lead.shop_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.owner_name && lead.owner_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.mobile_number && lead.mobile_number.includes(searchQuery)) ||
      (lead.area && lead.area.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const renderLeadCard = ({ item }: { item: any }) => {
    const summary = orderSummaries[item.id] || { total_orders: 0, total_value: 0, total_pending: 0 };
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.shopName}>{item.shop_name}</Text>
            <Text style={styles.ownerName}>{item.owner_name}</Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <Text style={styles.detailText}><MapPin size={14} color="#7F8C8D" /> {item.area}</Text>
          <Text style={styles.detailText}><Phone size={14} color="#7F8C8D" /> {item.mobile_number}</Text>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Last Visit</Text>
            <Text style={styles.infoValue}>{item.visit_date || 'N/A'}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Orders/Value</Text>
            <Text style={styles.infoValue}>
              {summary.total_orders} / ₹{(summary.total_value || 0).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Pending Amt</Text>
            <Text style={[styles.infoValue, { color: (summary.total_pending || 0) > 0 ? '#E74C3C' : '#2ECC71' }]}>
              ₹{(summary.total_pending || 0).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={() => {
            Linking.openURL(`tel:${item.mobile_number}`).catch(() => Alert.alert('Error', 'Could not open phone dialer.'));
          }}>
            <Phone size={18} color="#3498DB" />
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => {
            if (item.whatsapp_number) {
              Linking.openURL(`whatsapp://send?phone=${item.whatsapp_number}`).catch(() => Alert.alert('Error', 'Could not open WhatsApp.'));
            } else {
              Alert.alert('Not Available', 'No WhatsApp number recorded for this lead.');
            }
          }}>
            <MessageCircle size={18} color="#2ECC71" />
            <Text style={styles.actionText}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => {
            if (item.map_url) {
              const url = item.map_url.trim();
              if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('geo:')) {
                Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open map URL.'));
              } else {
                const encodedAddress = encodeURIComponent(url);
                Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`).catch(() => Alert.alert('Error', 'Could not open map.'));
              }
            } else {
              Alert.alert('Not Available', 'No map URL recorded for this lead.');
            }
          }}>
            <MapPin size={18} color="#E74C3C" />
            <Text style={styles.actionText}>Map</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => (navigation as any).navigate('Leads', { screen: 'LeadDetail', params: { lead: item }})}>
            <FileText size={18} color="#9B59B6" />
            <Text style={styles.actionText}>Details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('CustomerOrders', { customer: item })}
          >
            <ShoppingBag size={18} color="#E67E22" />
            <Text style={styles.actionText}>Orders</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Customer Management</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={loadCustomers}><RefreshCw size={24} color="#2C3E50" /></TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredLeads}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderLeadCard}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.searchContainer}>
              <Search size={20} color="#BDC3C7" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search customers..."
                placeholderTextColor="#BDC3C7"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </>
        }
        ListEmptyComponent={
          loading ? <ActivityIndicator size="large" color="#3498DB" style={{ marginTop: 50 }} /> : <Text style={styles.emptyText}>No customers found.</Text>
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
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 8, paddingHorizontal: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E0E6ED' },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, color: '#2C3E50' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  shopName: { fontSize: 16, fontWeight: '700', color: '#2C3E50' },
  ownerName: { fontSize: 14, color: '#34495E', marginTop: 2 },
  cardDetails: { flexDirection: 'row', marginBottom: 16, gap: 16 },
  detailText: { fontSize: 13, color: '#7F8C8D', flex: 1 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16, backgroundColor: '#F8F9F9', borderRadius: 8, padding: 12 },
  infoCol: { width: '33%', marginBottom: 8 },
  infoLabel: { fontSize: 11, color: '#95A5A6', marginBottom: 2 },
  infoValue: { fontSize: 13, color: '#2C3E50', fontWeight: '600' },
  actionsContainer: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#ECF0F1', paddingTop: 12 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1 },
  actionText: { fontSize: 12, marginLeft: 4, color: '#34495E', fontWeight: '500' },
  emptyText: { textAlign: 'center', marginTop: 32, color: '#7F8C8D' }
});
