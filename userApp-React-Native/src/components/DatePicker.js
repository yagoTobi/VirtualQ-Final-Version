import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function DatePicker({ onDateSelected }) {
  const [show, setShow] = useState(false);
  const [date, setDate] = useState(null);

  const onChange = (event, selectedDate) => {
    setShow(Platform.OS === "ios");
    if (selectedDate) {
      setDate(selectedDate);
      const formattedDate = selectedDate.toISOString().split("T")[0];
      onDateSelected(formattedDate);
    }
  };

  const showDatePicker = () => {
    setShow(true);
  };

  return (
    <View>
      <TouchableOpacity onPress={showDatePicker} style={styles.dateInput}>
        <Text style={date ? {} : styles.placeholderText}>
          {date ? date.toLocaleDateString() : "Insert your date of birth"}
        </Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={date || new Date()}
          mode="date"
          display="default"
          onChange={onChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dateInput: {
    height: 50,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    justifyContent: "center",
  },
  placeholderText: {
    color: "gray",
  },
});
