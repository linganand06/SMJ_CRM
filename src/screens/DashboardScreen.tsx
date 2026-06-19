import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getLeads } from '../database/db';
import { scheduleFollowUpNotification } from '../utils/notifications';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { Bell } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export const DashboardScreen = () => {
  const navigation = useNavigation();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchLeads = async () => {
        setLoading(true);
        try {
          // Initialize daily notification at 9:00 AM
          await scheduleFollowUpNotification();
          
          const data = await getLeads();
          setLeads(data);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      fetchLeads();
    }, [])
  );

  const screenWidth = Dimensions.get('window').width;

  const totalLeads = leads.length;
  const customers = leads.filter(l => l.lead_status === 'Customer').length;
  const newLeads = leads.filter(l => l.lead_status === 'Lead').length;

  const statusCounts = leads.reduce((acc, lead) => {
    acc[lead.lead_status] = (acc[lead.lead_status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.keys(statusCounts).map((status, index) => {
    const colors = ['#3498DB', '#2ECC71', '#E74C3C', '#F1C40F', '#9B59B6', '#34495E'];
    return {
      name: status,
      count: statusCounts[status],
      color: colors[index % colors.length],
      legendFontColor: '#7F8C8D',
      legendFontSize: 12,
    };
  });

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  const last6Months = [];
  for (let i = 5; i >= 0; i--) {
    let m = currentMonth - i;
    if (m < 0) m += 12;
    last6Months.push(m);
  }

  const monthlyCounts = last6Months.map(monthIndex => {
    return leads.filter(l => {
      if (!l.created_at) return false;
      const d = new Date(l.created_at.replace(' ', 'T'));
      return d.getMonth() === monthIndex;
    }).length;
  });

  const lineData = {
    labels: last6Months.map(m => monthNames[m]),
    datasets: [
      {
        data: monthlyCounts.length > 0 && monthlyCounts.some(c => c > 0) ? monthlyCounts : [0, 0, 0, 0, 0, 0],
      }
    ]
  };

  const chartConfig = {
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#2980B9'
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#3498DB" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Dashboard Analytics</Text>
      
      <View style={styles.cardsRow}>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.75}
          onPress={() => (navigation as any).navigate('Leads')}
        >
          <Text style={[styles.cardValue, { color: '#3498DB' }]}>{totalLeads}</Text>
          <Text style={styles.cardLabel}>Total Leads</Text>
          <ChevronRight size={14} color="#BDC3C7" style={{ marginTop: 4 }} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.75}
          onPress={() => (navigation as any).navigate('Customers')}
        >
          <Text style={[styles.cardValue, { color: '#2ECC71' }]}>{customers}</Text>
          <Text style={styles.cardLabel}>Customers</Text>
          <ChevronRight size={14} color="#BDC3C7" style={{ marginTop: 4 }} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.75}
          onPress={() => (navigation as any).navigate('Leads')}
        >
          <Text style={[styles.cardValue, { color: '#E67E22' }]}>{newLeads}</Text>
          <Text style={styles.cardLabel}>New Leads</Text>
          <ChevronRight size={14} color="#BDC3C7" style={{ marginTop: 4 }} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.followUpBanner} 
        onPress={() => (navigation as any).navigate('FollowUps')}
      >
        <View style={styles.bannerIconContainer}>
          <Bell size={24} color="#FFFFFF" />
        </View>
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerTitle}>Check Follow-ups</Text>
          <Text style={styles.bannerSubtitle}>View today's and upcoming follow-ups</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Monthly Lead Growth</Text>
        <LineChart
          data={lineData}
          width={screenWidth - 64}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>

      {pieData.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Leads by Status</Text>
          <PieChart
            data={pieData}
            width={screenWidth - 64}
            height={200}
            chartConfig={chartConfig}
            accessor={"count"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            center={[10, 0]}
            absolute
          />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 16,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F3F4',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3498DB',
  },
  cardLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34495E',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  followUpBanner: {
    flexDirection: 'row',
    backgroundColor: '#3498DB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  bannerIconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 12,
    marginRight: 16,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#E0F2FE',
  }
});
