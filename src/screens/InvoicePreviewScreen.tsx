import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import WebView from 'react-native-webview';
import { ArrowLeft, Download, Share2 } from 'lucide-react-native';
import { getInvoiceHtml, downloadInvoice, shareInvoice } from '../utils/InvoiceGenerator';

export const InvoicePreviewScreen = () => {
  const route = useRoute() as any;
  const navigation = useNavigation();
  const { order, customer, totalPending } = route.params || {};

  if (!order || !customer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={22} color="#2C3E50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Missing order or customer details.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const htmlContent = getInvoiceHtml(order, customer, totalPending);

  const handleDownload = () => {
    downloadInvoice(order, customer, totalPending);
  };

  const handleShare = () => {
    shareInvoice(order, customer, totalPending);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preview Invoice</Text>
      </View>
      
      <View style={styles.webviewContainer}>
        <WebView 
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          style={{ flex: 1 }}
          scalesPageToFit={Platform.OS === 'android'}
          bounces={false}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload} activeOpacity={0.8}>
          <Download size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.downloadText}>Download PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
          <Share2 size={20} color="#3498DB" style={{ marginRight: 8 }} />
          <Text style={styles.shareText}>Share</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E6ED',
  },
  backBtn: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E6ED',
  },
  downloadBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#3498DB',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  downloadText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#ECF0F1',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  shareText: {
    color: '#3498DB',
    fontSize: 16,
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#E74C3C',
  },
});
