import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DatePickerInputProps {
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  style?: any;
  textStyle?: any;
}

export const DatePickerInput = ({
  value,
  onChange,
  placeholder,
  icon,
  style,
  textStyle,
}: DatePickerInputProps) => {
  const [show, setShow] = useState(false);

  // Parse YYYY-MM-DD back to a Date object, fallback to today if invalid
  const parseDateStr = (dateStr: string) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date();
  };

  const currentDate = parseDateStr(value);

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') {
      setShow(false);
    }
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.container, style]}
        activeOpacity={0.8}
        onPress={() => setShow(true)}
      >
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text style={[styles.text, !value && styles.placeholder, textStyle]}>
          {value || placeholder || 'Select Date'}
        </Text>
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={currentDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    paddingHorizontal: 12,
  },
  iconContainer: {
    marginRight: 8,
  },
  text: {
    flex: 1,
    fontSize: 15,
    color: '#2C3E50',
  },
  placeholder: {
    color: '#BDC3C7',
  },
});
