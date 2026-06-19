import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  ShoppingBag,
  Trash2,
  PlusCircle,
  Scale,
  Package,
  IndianRupee,
  CalendarDays,
  FileText,
  AlertCircle,
  CreditCard,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
} from 'lucide-react-native';
import {
  addCustomerOrder,
  getCustomerOrders,
  deleteCustomerOrder,
  addOrderPayment,
  getOrderPayments,
  deleteOrderPayment,
} from '../database/db';
import { DatePickerInput } from '../components/DatePickerInput';

// ─── helpers ────────────────────────────────────────────────────────────────

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const fmt = (v: number) =>
  v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Returns 'overdue' | 'soon' | 'future' | 'none' */
const dueDateStatus = (dueDate?: string | null): 'overdue' | 'soon' | 'future' | 'none' => {
  if (!dueDate) return 'none';
  const diff = Math.ceil(
    (new Date(dueDate).getTime() - new Date(todayStr()).getTime()) / 86400000
  );
  if (diff < 0) return 'overdue';
  if (diff <= 7) return 'soon';
  return 'future';
};

const DUE_COLOR: Record<string, string> = {
  overdue: '#E74C3C',
  soon: '#E67E22',
  future: '#2ECC71',
  none: '#95A5A6',
};

// ─── PaymentTimeline sub-component ──────────────────────────────────────────

const PaymentTimeline = ({
  orderId,
  onRefresh,
}: {
  orderId: number;
  onRefresh: () => void;
}) => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add-payment form
  const [payAmt, setPayAmt] = useState('');
  const [payDate, setPayDate] = useState(todayStr());
  const [nextDue, setNextDue] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPayments(await getOrderPayments(orderId));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useFocusEffect(useCallback(() => { load(); }, [orderId]));

  const handleAddPayment = async (pendingAmount: number) => {
    const amt = parseFloat(payAmt);
    if (!payAmt || isNaN(amt) || amt <= 0) {
      Alert.alert('Validation', 'Enter a valid payment amount.');
      return;
    }
    if (amt > pendingAmount + 0.01) {
      Alert.alert('Validation', `Amount cannot exceed pending ₹${fmt(pendingAmount)}.`);
      return;
    }
    setSaving(true);
    try {
      await addOrderPayment({
        order_id: orderId,
        amount_paid: amt,
        payment_date: payDate || todayStr(),
        next_due_date: nextDue.trim() || undefined,
        notes: payNotes.trim(),
      });
      setPayAmt('');
      setPayDate(todayStr());
      setNextDue('');
      setPayNotes('');
      await load();
      onRefresh();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not save payment.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePayment = (id: number) => {
    Alert.alert('Delete Payment', 'Remove this payment record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteOrderPayment(id, orderId);
            await load();
            onRefresh();
          } catch (e) { console.error(e); }
        },
      },
    ]);
  };

  if (loading) return <ActivityIndicator color="#3498DB" style={{ marginVertical: 12 }} />;

  return (
    <View style={tlStyles.container}>

      {/* ── Timeline ── */}
      {payments.length > 0 && (
        <View style={tlStyles.section}>
          <Text style={tlStyles.sectionTitle}>Payment History</Text>
          {payments.map((p, idx) => (
            <View key={p.id} style={tlStyles.timelineRow}>
              {/* Dot + line */}
              <View style={tlStyles.dotCol}>
                <View style={tlStyles.dot} />
                {idx < payments.length - 1 && <View style={tlStyles.line} />}
              </View>

              {/* Content */}
              <View style={tlStyles.timelineContent}>
                <View style={tlStyles.timelineHeader}>
                  <Text style={tlStyles.timelineAmt}>₹{fmt(p.amount_paid)}</Text>
                  <TouchableOpacity onPress={() => handleDeletePayment(p.id)} style={tlStyles.delBtn}>
                    <Trash2 size={13} color="#E74C3C" />
                  </TouchableOpacity>
                </View>
                <View style={tlStyles.timelineMeta}>
                  <CalendarDays size={11} color="#95A5A6" />
                  <Text style={tlStyles.timelineDate}> Paid: {p.payment_date}</Text>
                </View>
                {p.next_due_date ? (
                  <View style={tlStyles.timelineMeta}>
                    <Clock size={11} color={DUE_COLOR[dueDateStatus(p.next_due_date)]} />
                    <Text style={[tlStyles.timelineDate, { color: DUE_COLOR[dueDateStatus(p.next_due_date)] }]}>
                      {' '}Next Due: {p.next_due_date}
                    </Text>
                  </View>
                ) : null}
                {p.notes ? (
                  <Text style={tlStyles.timelineNotes}>{p.notes}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ── Add Payment form (shown only when returned from parent via prop) ── */}
      <AddPaymentForm
        orderId={orderId}
        payAmt={payAmt}
        setPayAmt={setPayAmt}
        payDate={payDate}
        setPayDate={setPayDate}
        nextDue={nextDue}
        setNextDue={setNextDue}
        payNotes={payNotes}
        setPayNotes={setPayNotes}
        saving={saving}
        onSubmit={handleAddPayment}
      />
    </View>
  );
};

// ─── AddPaymentForm sub-component ───────────────────────────────────────────

const AddPaymentForm = ({
  orderId,
  payAmt, setPayAmt,
  payDate, setPayDate,
  nextDue, setNextDue,
  payNotes, setPayNotes,
  saving,
  onSubmit,
}: any) => (
  <View style={tlStyles.formBox}>
    <Text style={tlStyles.formBoxTitle}>Record New Payment</Text>

    <Text style={tlStyles.flabel}>Amount Paid (₹)</Text>
    <View style={tlStyles.inputRow}>
      <IndianRupee size={14} color="#95A5A6" style={{ marginRight: 6 }} />
      <TextInput
        style={tlStyles.input}
        placeholder="0.00"
        placeholderTextColor="#BDC3C7"
        keyboardType="decimal-pad"
        value={payAmt}
        onChangeText={setPayAmt}
      />
    </View>

    <Text style={tlStyles.flabel}>Payment Date</Text>
    <View style={tlStyles.inputRow}>
      <DatePickerInput
        value={payDate}
        onChange={setPayDate}
        icon={<CalendarDays size={14} color="#95A5A6" style={{ marginRight: 6 }} />}
        style={{ flex: 1, paddingVertical: 0, paddingHorizontal: 0 }}
        textStyle={{ fontSize: 14 }}
      />
    </View>

    <Text style={tlStyles.flabel}>Next Due Date</Text>
    <View style={tlStyles.inputRow}>
      <DatePickerInput
        value={nextDue}
        onChange={setNextDue}
        placeholder="Optional"
        icon={<Clock size={14} color="#95A5A6" style={{ marginRight: 6 }} />}
        style={{ flex: 1, paddingVertical: 0, paddingHorizontal: 0 }}
        textStyle={{ fontSize: 14 }}
      />
    </View>

    <Text style={tlStyles.flabel}>Notes (optional)</Text>
    <View style={tlStyles.inputRow}>
      <FileText size={14} color="#95A5A6" style={{ marginRight: 6 }} />
      <TextInput
        style={tlStyles.input}
        placeholder="Remarks..."
        placeholderTextColor="#BDC3C7"
        value={payNotes}
        onChangeText={setPayNotes}
      />
    </View>

    <TouchableOpacity
      style={[tlStyles.submitBtn, saving && { opacity: 0.6 }]}
      onPress={onSubmit}
      disabled={saving}
      activeOpacity={0.8}
    >
      {saving
        ? <ActivityIndicator color="#FFFFFF" size="small" />
        : <>
            <CreditCard size={15} color="#FFFFFF" />
            <Text style={tlStyles.submitBtnText}>Record Payment</Text>
          </>
      }
    </TouchableOpacity>
  </View>
);

// ─── OrderCard sub-component ─────────────────────────────────────────────────

const OrderCard = ({
  item,
  customer,
  isExpanded,
  onToggle,
  onDelete,
  onRefresh,
  onPreview,
}: {
  item: any;
  customer: any;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: (id: number) => void;
  onRefresh: () => void;
  onPreview: (item: any) => void;
}) => {
  const isSettled = item.pending_amount <= 0;
  const dueStatus = dueDateStatus(item.next_due_date);

  return (
    <View style={[styles.orderCard, isExpanded && styles.orderCardExpanded]}>
      {/* ── Top row: category + status + delete ── */}
      <View style={styles.orderCardTop}>
        <View style={styles.orderCategoryBadge}>
          <Text style={styles.orderCategoryText}>{item.category}</Text>
        </View>
        <View style={styles.orderTopRight}>
          {isSettled
            ? <View style={styles.settledBadge}>
                <CheckCircle2 size={12} color="#2ECC71" />
                <Text style={styles.settledText}> Settled</Text>
              </View>
            : item.next_due_date
              ? <View style={[styles.dueBadge, { backgroundColor: DUE_COLOR[dueStatus] + '22', borderColor: DUE_COLOR[dueStatus] }]}>
                  <Clock size={11} color={DUE_COLOR[dueStatus]} />
                  <Text style={[styles.dueText, { color: DUE_COLOR[dueStatus] }]}>
                    {' '}Due {item.next_due_date}
                  </Text>
                </View>
              : null
          }
          <TouchableOpacity onPress={() => onPreview(item)} style={[styles.deleteBtn, { marginRight: 8, backgroundColor: '#ECF0F1' }]}>
            <FileText size={15} color="#3498DB" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.deleteBtn}>
            <Trash2 size={15} color="#E74C3C" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Metrics row ── */}
      <View style={styles.orderRow}>
        <View style={styles.orderMeta}>
          <Text style={styles.orderMetaLabel}>Qty</Text>
          <Text style={styles.orderMetaValue}>{item.quantity} {item.order_unit}</Text>
        </View>
        <View style={styles.orderMeta}>
          <Text style={styles.orderMetaLabel}>Net Value</Text>
          <Text style={styles.orderMetaValue}>₹{fmt(item.net_value)}</Text>
        </View>
        <View style={styles.orderMeta}>
          <Text style={styles.orderMetaLabel}>Paid</Text>
          <Text style={[styles.orderMetaValue, { color: '#2ECC71' }]}>₹{fmt(item.amount_paid)}</Text>
        </View>
        <View style={styles.orderMeta}>
          <Text style={styles.orderMetaLabel}>Pending</Text>
          <Text style={[styles.orderMetaValue, { color: isSettled ? '#2ECC71' : '#E74C3C' }]}>
            ₹{fmt(item.pending_amount)}
          </Text>
        </View>
      </View>

      {/* ── Footer: order date + notes ── */}
      <View style={styles.orderFooter}>
        <CalendarDays size={12} color="#95A5A6" />
        <Text style={styles.orderDate}> Order: {item.order_date}</Text>
        {item.notes ? <>
          <Text style={styles.orderDateSep}>  ·  </Text>
          <FileText size={12} color="#95A5A6" />
          <Text style={styles.orderDate}> {item.notes}</Text>
        </> : null}
      </View>

      {/* ── Expand toggle ── */}
      <TouchableOpacity style={styles.expandBtn} onPress={onToggle} activeOpacity={0.7}>
        {isExpanded
          ? <><ChevronUp size={14} color="#3498DB" /><Text style={styles.expandText}> Hide Payments</Text></>
          : <><ChevronDown size={14} color="#3498DB" /><Text style={styles.expandText}> {isSettled ? 'View Payments' : 'Payments & Settle Debt'}</Text></>
        }
      </TouchableOpacity>

      {/* ── Expanded: timeline + add-payment form ── */}
      {isExpanded && (
        <PaymentTimeline orderId={item.id} onRefresh={onRefresh} />
      )}
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

export const CustomerOrdersScreen = () => {
  const navigation = useNavigation();
  const route = useRoute() as any;
  const customer = route.params?.customer;

  // ── new-order form ─────────────────────────────────────────
  const [category, setCategory] = useState('');
  const [orderUnit, setOrderUnit] = useState<'grams' | 'piece'>('piece');
  const [quantity, setQuantity] = useState('');
  const [netValue, setNetValue] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [orderDate, setOrderDate] = useState(todayStr());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // ── list + expand ──────────────────────────────────────────
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const formPending = Math.max(0, (parseFloat(netValue) || 0) - (parseFloat(amountPaid) || 0));
  const totalPending = orders.reduce((s, o) => s + (o.pending_amount || 0), 0);
  const totalOrders = orders.length;
  const totalValue = orders.reduce((s, o) => s + (o.net_value || 0), 0);

  const loadOrders = async () => {
    if (!customer) return;
    setLoading(true);
    try {
      setOrders(await getCustomerOrders(customer.id));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { loadOrders(); }, [customer]));

  const handleAddOrder = async () => {
    if (!category.trim()) { Alert.alert('Validation', 'Please enter a category.'); return; }
    if (!quantity || isNaN(parseFloat(quantity))) { Alert.alert('Validation', 'Please enter a valid quantity.'); return; }
    if (!netValue || isNaN(parseFloat(netValue))) { Alert.alert('Validation', 'Please enter a valid net value.'); return; }
    const paid = parseFloat(amountPaid) || 0;
    const net = parseFloat(netValue);
    if (paid > net) { Alert.alert('Validation', 'Amount paid cannot exceed net value.'); return; }
    setSaving(true);
    try {
      await addCustomerOrder({
        customer_id: customer.id,
        category: category.trim(),
        order_unit: orderUnit,
        quantity: parseFloat(quantity),
        net_value: net,
        amount_paid: paid,
        pending_amount: net - paid,
        order_date: orderDate,
        notes: notes.trim(),
      });
      setCategory(''); setQuantity(''); setNetValue(''); setAmountPaid('');
      setOrderDate(todayStr()); setNotes('');
      await loadOrders();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not save the order.');
    } finally { setSaving(false); }
  };

  const handleDeleteOrder = (id: number) => {
    Alert.alert('Delete Order', 'This will delete the order and all its payment records.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteCustomerOrder(id);
            if (expandedId === id) setExpandedId(null);
            await loadOrders();
          } catch (e) { console.error(e); }
        },
      },
    ]);
  };

  // ── List header (summary + add-order form) ──────────────────
  const ListHeader = (
    <>
      {/* Summary strip */}
      <View style={styles.summaryStrip}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryVal}>{totalOrders}</Text>
          <Text style={styles.summaryLabel}>Orders</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryVal}>₹{fmt(totalValue)}</Text>
          <Text style={styles.summaryLabel}>Total Value</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryVal, { color: totalPending > 0 ? '#E74C3C' : '#2ECC71' }]}>
            ₹{fmt(totalPending)}
          </Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
      </View>

      {/* Add Order form */}
      <View style={styles.formCard}>
        <View style={styles.formCardHeader}>
          <PlusCircle size={18} color="#3498DB" />
          <Text style={styles.formCardTitle}>Add New Order</Text>
        </View>

        <Text style={styles.fieldLabel}>Category</Text>
        <View style={styles.inputRow}>
          <Package size={16} color="#95A5A6" style={styles.inputIcon} />
          <TextInput style={styles.textInput} placeholder="e.g. Silver Anklets"
            placeholderTextColor="#BDC3C7" value={category} onChangeText={setCategory} />
        </View>

        <Text style={styles.fieldLabel}>Order Unit</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleBtn, orderUnit === 'grams' && styles.toggleBtnActive]}
            onPress={() => setOrderUnit('grams')}>
            <Scale size={14} color={orderUnit === 'grams' ? '#FFFFFF' : '#7F8C8D'} />
            <Text style={[styles.toggleText, orderUnit === 'grams' && styles.toggleTextActive]}>Grams</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleBtn, orderUnit === 'piece' && styles.toggleBtnActive]}
            onPress={() => setOrderUnit('piece')}>
            <Package size={14} color={orderUnit === 'piece' ? '#FFFFFF' : '#7F8C8D'} />
            <Text style={[styles.toggleText, orderUnit === 'piece' && styles.toggleTextActive]}>Piece</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.fieldLabel}>Quantity ({orderUnit === 'grams' ? 'grams' : 'pieces'})</Text>
        <View style={styles.inputRow}>
          <Scale size={16} color="#95A5A6" style={styles.inputIcon} />
          <TextInput style={styles.textInput} placeholder="0" placeholderTextColor="#BDC3C7"
            keyboardType="decimal-pad" value={quantity} onChangeText={setQuantity} />
        </View>

        <Text style={styles.fieldLabel}>Net Value (₹)</Text>
        <View style={styles.inputRow}>
          <IndianRupee size={16} color="#95A5A6" style={styles.inputIcon} />
          <TextInput style={styles.textInput} placeholder="0.00" placeholderTextColor="#BDC3C7"
            keyboardType="decimal-pad" value={netValue} onChangeText={setNetValue} />
        </View>

        <Text style={styles.fieldLabel}>Initial Amount Paid (₹)</Text>
        <View style={styles.inputRow}>
          <IndianRupee size={16} color="#95A5A6" style={styles.inputIcon} />
          <TextInput style={styles.textInput} placeholder="0.00" placeholderTextColor="#BDC3C7"
            keyboardType="decimal-pad" value={amountPaid} onChangeText={setAmountPaid} />
        </View>

        <Text style={styles.fieldLabel}>Pending Amount (auto)</Text>
        <View style={[styles.inputRow, styles.pendingRow]}>
          <AlertCircle size={16} color={formPending > 0 ? '#E74C3C' : '#2ECC71'} style={styles.inputIcon} />
          <Text style={[styles.pendingText, { color: formPending > 0 ? '#E74C3C' : '#2ECC71' }]}>
            ₹ {fmt(formPending)}
          </Text>
        </View>

        <Text style={styles.fieldLabel}>Order Date</Text>
        <View style={styles.inputRow}>
          <DatePickerInput
            value={orderDate}
            onChange={setOrderDate}
            icon={<CalendarDays size={16} color="#95A5A6" style={styles.inputIcon} />}
            style={{ flex: 1, paddingVertical: 0, paddingHorizontal: 0 }}
            textStyle={{ fontSize: 14 }}
          />
        </View>

        <Text style={styles.fieldLabel}>Notes (optional)</Text>
        <View style={[styles.inputRow, { alignItems: 'flex-start', paddingTop: 10 }]}>
          <FileText size={16} color="#95A5A6" style={[styles.inputIcon, { marginTop: 2 }]} />
          <TextInput style={[styles.textInput, styles.multilineInput]} placeholder="Any remarks..."
            placeholderTextColor="#BDC3C7" multiline numberOfLines={3}
            value={notes} onChangeText={setNotes} />
        </View>

        <TouchableOpacity style={[styles.addBtn, saving && { opacity: 0.7 }]}
          onPress={handleAddOrder} disabled={saving} activeOpacity={0.8}>
          {saving
            ? <ActivityIndicator color="#FFFFFF" size="small" />
            : <><ShoppingBag size={18} color="#FFFFFF" /><Text style={styles.addBtnText}>Add Order</Text></>
          }
        </TouchableOpacity>
      </View>

      {orders.length > 0 && <Text style={styles.historyHeading}>Order History</Text>}
    </>
  );

  const handlePreviewInvoice = (item: any) => {
    navigation.navigate('InvoicePreview' as never, { order: item, customer, totalPending } as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#2C3E50" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{customer?.shop_name || 'Orders'}</Text>
          <Text style={styles.headerSub}>{customer?.owner_name}</Text>
        </View>
        {totalPending > 0 && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>₹{fmt(totalPending)} due</Text>
          </View>
        )}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <OrderCard
              item={item}
              customer={customer}
              isExpanded={expandedId === item.id}
              onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
              onDelete={handleDeleteOrder}
              onRefresh={loadOrders}
              onPreview={handlePreviewInvoice}
            />
          )}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            loading
              ? <ActivityIndicator size="large" color="#3498DB" style={{ marginTop: 20 }} />
              : <View style={styles.emptyContainer}>
                  <ShoppingBag size={40} color="#BDC3C7" />
                  <Text style={styles.emptyText}>No orders yet</Text>
                  <Text style={styles.emptySubText}>Use the form above to add the first order.</Text>
                </View>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const tlStyles = StyleSheet.create({
  container: { borderTopWidth: 1, borderTopColor: '#E0E6ED', marginTop: 10, paddingTop: 10 },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#95A5A6', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },

  // Timeline rows
  timelineRow: { flexDirection: 'row', marginBottom: 4 },
  dotCol: { alignItems: 'center', width: 20, marginRight: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#3498DB', marginTop: 3 },
  line: { width: 2, flex: 1, backgroundColor: '#D5E8F5', marginTop: 2 },
  timelineContent: { flex: 1, backgroundColor: '#F0F7FF', borderRadius: 8, padding: 10, marginBottom: 8 },
  timelineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  timelineAmt: { fontSize: 14, fontWeight: '700', color: '#2C3E50' },
  delBtn: { padding: 4, backgroundColor: '#FDECEA', borderRadius: 4 },
  timelineMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  timelineDate: { fontSize: 11, color: '#95A5A6' },
  timelineNotes: { fontSize: 11, color: '#7F8C8D', marginTop: 4, fontStyle: 'italic' },

  // Add payment form inside expanded card
  formBox: { backgroundColor: '#F8F9F9', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E0E6ED' },
  formBoxTitle: { fontSize: 13, fontWeight: '700', color: '#2C3E50', marginBottom: 10 },
  flabel: { fontSize: 11, fontWeight: '600', color: '#95A5A6', marginTop: 8, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 7, borderWidth: 1, borderColor: '#E0E6ED', paddingHorizontal: 10, paddingVertical: Platform.OS === 'ios' ? 10 : 0 },
  input: { flex: 1, fontSize: 14, color: '#2C3E50', paddingVertical: 8 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#27AE60', borderRadius: 8, paddingVertical: 12, marginTop: 12, gap: 6 },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#E0E6ED',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#2C3E50' },
  headerSub: { fontSize: 12, color: '#7F8C8D', marginTop: 1 },
  pendingBadge: { backgroundColor: '#FDECEA', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#F5B7B1' },
  pendingBadgeText: { fontSize: 12, fontWeight: '700', color: '#E74C3C' },
  listContent: { padding: 16, paddingBottom: 60 },

  // Summary strip
  summaryStrip: { flexDirection: 'row', backgroundColor: '#2C3E50', borderRadius: 12, padding: 16, marginBottom: 16, justifyContent: 'space-around', alignItems: 'center' },
  summaryItem: { alignItems: 'center' },
  summaryVal: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  summaryLabel: { fontSize: 11, color: '#BDC3C7', marginTop: 2 },
  summaryDivider: { width: 1, height: 36, backgroundColor: '#4A6274' },

  // Add order form
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  formCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F0F3F4' },
  formCardTitle: { fontSize: 16, fontWeight: '700', color: '#2C3E50', marginLeft: 8 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#7F8C8D', marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9F9', borderRadius: 8, borderWidth: 1, borderColor: '#E0E6ED', paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 12 : 0 },
  inputIcon: { marginRight: 8 },
  textInput: { flex: 1, fontSize: 15, color: '#2C3E50', paddingVertical: 10 },
  multilineInput: { minHeight: 72, textAlignVertical: 'top' },
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, borderWidth: 1.5, borderColor: '#E0E6ED', backgroundColor: '#F8F9F9', gap: 6 },
  toggleBtnActive: { backgroundColor: '#3498DB', borderColor: '#3498DB' },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#7F8C8D' },
  toggleTextActive: { color: '#FFFFFF' },
  pendingRow: { backgroundColor: '#FEF9F9', borderColor: '#F5B7B1' },
  pendingText: { fontSize: 16, fontWeight: '700' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3498DB', borderRadius: 10, paddingVertical: 14, marginTop: 20, gap: 8, elevation: 2 },
  addBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  // History heading
  historyHeading: { fontSize: 14, fontWeight: '700', color: '#34495E', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Order cards
  orderCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  orderCardExpanded: { borderWidth: 1.5, borderColor: '#3498DB' },
  orderCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  orderCategoryBadge: { backgroundColor: '#EBF5FB', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  orderCategoryText: { fontSize: 13, fontWeight: '700', color: '#2980B9' },
  orderTopRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settledBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EAFAF1', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#A9DFBF' },
  settledText: { fontSize: 11, fontWeight: '700', color: '#2ECC71' },
  dueBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  dueText: { fontSize: 11, fontWeight: '600' },
  deleteBtn: { padding: 6, backgroundColor: '#FDECEA', borderRadius: 6 },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F8F9F9', borderRadius: 8, padding: 10, marginBottom: 8 },
  orderMeta: { alignItems: 'center', flex: 1 },
  orderMetaLabel: { fontSize: 10, color: '#95A5A6', marginBottom: 3 },
  orderMetaValue: { fontSize: 13, fontWeight: '600', color: '#2C3E50' },
  orderFooter: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  orderDate: { fontSize: 12, color: '#95A5A6' },
  orderDateSep: { fontSize: 12, color: '#BDC3C7' },

  // Expand toggle
  expandBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#F0F3F4' },
  expandText: { fontSize: 13, fontWeight: '600', color: '#3498DB' },

  // Empty state
  emptyContainer: { alignItems: 'center', paddingTop: 24, paddingBottom: 16 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#BDC3C7', marginTop: 12 },
  emptySubText: { fontSize: 13, color: '#BDC3C7', marginTop: 4, textAlign: 'center' },
});
