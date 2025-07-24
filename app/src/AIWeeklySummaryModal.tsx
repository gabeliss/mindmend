import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function AIWeeklySummaryModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <Text style={styles.header}>Your Weekly AI Summary</Text>
          <Text style={styles.summaryText}>This week: You were 5/7 on workouts. Clean streak: 6 days. Weakest moment: Sunday 11pm.</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}><Text style={styles.statNum}>5/7</Text><Text>Workouts</Text></View>
            <View style={styles.statCard}><Text style={styles.statNum}>6</Text><Text>Clean Streak</Text></View>
            <View style={styles.statCard}><Text style={styles.statNum}>11pm</Text><Text>Weakest</Text></View>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}><Text style={styles.closeText}>Close</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: 320, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#2D3748', marginBottom: 12 },
  summaryText: { color: '#4F8EF7', fontStyle: 'italic', marginBottom: 16, textAlign: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 16 },
  statCard: { backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, alignItems: 'center', flex: 1, marginHorizontal: 4 },
  statNum: { fontSize: 18, fontWeight: 'bold', color: '#38A169' },
  closeBtn: { backgroundColor: '#4F8EF7', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 32, marginTop: 8 },
  closeText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
}); 