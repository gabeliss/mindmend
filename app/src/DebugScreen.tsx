import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  SafeAreaView,
} from 'react-native';
import { useDebugLogs } from './utils/debugLogger';

/**
 * Debug Screen Component
 * 
 * This component can be temporarily added to your app to view authentication
 * and API logs directly on the mobile device. This is especially useful when
 * debugging authentication issues.
 * 
 * To use this screen:
 * 1. Import it in your main App.tsx
 * 2. Add it as a tab or modal that you can access during testing
 * 3. Use it to view real-time logs while testing login/signup
 * 4. Share logs with developers if needed
 */
export default function DebugScreen() {
  const { logs, getLogsAsString, clearLogs, exportLogs } = useDebugLogs();
  const [filter, setFilter] = useState<'all' | 'auth' | 'api' | 'ui'>('all');

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.category.toLowerCase() === filter;
  });

  const handleShareLogs = async () => {
    try {
      const logsString = getLogsAsString();
      await Share.share({
        message: `MindMend Debug Logs:\n\n${logsString}`,
        title: 'MindMend Debug Logs',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share logs');
    }
  };

  const handleClearLogs = () => {
    Alert.alert(
      'Clear Logs',
      'Are you sure you want to clear all debug logs?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearLogs },
      ]
    );
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error': return '#FF6B6B';
      case 'warn': return '#FFD93D';
      case 'info': return '#4ECDC4';
      default: return '#6C7B7F';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Debug Logs</Text>
        <Text style={styles.subtitle}>Authentication & API Debugging</Text>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {['all', 'auth', 'api', 'ui'].map((filterOption) => (
          <TouchableOpacity
            key={filterOption}
            style={[
              styles.filterButton,
              filter === filterOption && styles.filterButtonActive
            ]}
            onPress={() => setFilter(filterOption as any)}
          >
            <Text style={[
              styles.filterButtonText,
              filter === filterOption && styles.filterButtonTextActive
            ]}>
              {filterOption.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleShareLogs}>
          <Text style={styles.actionButtonText}>📤 Share Logs</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.clearButton]} 
          onPress={handleClearLogs}
        >
          <Text style={styles.actionButtonText}>🗑️ Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Logs List */}
      <ScrollView style={styles.logsContainer} showsVerticalScrollIndicator={true}>
        {filteredLogs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No logs found for "{filter}" category
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Try logging in or signing up to see authentication logs
            </Text>
          </View>
        ) : (
          filteredLogs.map((log, index) => (
            <View key={index} style={styles.logItem}>
              <View style={styles.logHeader}>
                <Text style={[styles.logLevel, { color: getLogColor(log.level) }]}>
                  {log.level.toUpperCase()}
                </Text>
                <Text style={styles.logCategory}>[{log.category}]</Text>
                <Text style={styles.logTimestamp}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </Text>
              </View>
              <Text style={styles.logMessage}>{log.message}</Text>
              {log.data && (
                <View style={styles.logDataContainer}>
                  <Text style={styles.logDataLabel}>Data:</Text>
                  <Text style={styles.logData}>{log.data}</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          💡 This debug screen shows real-time authentication and API logs.
          Use it to troubleshoot login/signup issues.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#4F8EF7',
    borderColor: '#4F8EF7',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#4F8EF7',
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#FF6B6B',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  logsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
  },
  logItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#E2E8F0',
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  logLevel: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
  },
  logCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F8EF7',
  },
  logTimestamp: {
    fontSize: 10,
    color: '#94A3B8',
    marginLeft: 'auto',
  },
  logMessage: {
    fontSize: 14,
    color: '#2D3748',
    lineHeight: 20,
  },
  logDataContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 4,
  },
  logDataLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  logData: {
    fontSize: 11,
    color: '#4A5568',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  instructions: {
    padding: 16,
    backgroundColor: '#FFF7ED',
    borderTopWidth: 1,
    borderTopColor: '#FED7AA',
  },
  instructionsText: {
    fontSize: 12,
    color: '#C2410C',
    textAlign: 'center',
    lineHeight: 16,
  },
});