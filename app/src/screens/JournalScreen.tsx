import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { ScrollView } from 'react-native';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../lib/design-system';
import { JournalEntry, JournalGroup } from '../types/journal';
import { mockJournalEntries } from '../data/mockJournalData';

// Helper function
function formatDate(dateString: string) {
  if (!dateString) {
    return { dayName: '', dayNumber: 0 };
  }
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return { dayName: '', dayNumber: 0 };
  }
  
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
  const dayNumber = date.getDate();
  return { dayName, dayNumber };
}


export default function JournalScreen() {
  const [entries, setEntries] = useState<JournalEntry[]>(mockJournalEntries || []);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  // Close other modals when add modal opens
  React.useEffect(() => {
    if (isAddModalVisible) {
      setSelectedEntry(null);
    }
  }, [isAddModalVisible]);

  // Close other modals when detail modal opens
  React.useEffect(() => {
    if (selectedEntry) {
      setIsAddModalVisible(false);
    }
  }, [selectedEntry]);

  // Group entries by month and year
  const groupedEntries = useMemo(() => {
    if (!entries || entries.length === 0) {
      return [];
    }
    
    const groups: JournalGroup[] = [];
    const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    sortedEntries.forEach(entry => {
      if (!entry || !entry.date) return;
      
      const date = new Date(entry.date);
      const month = date.toLocaleDateString('en-US', { month: 'long' });
      const year = date.getFullYear();
      
      let group = groups.find(g => g.month === month && g.year === year);
      if (!group) {
        group = { month, year, entries: [] };
        groups.push(group);
      }
      group.entries.push(entry);
    });
    
    return groups;
  }, [entries]);

  const handleAddEntry = () => {
    setIsAddModalVisible(true);
    // Other modals close automatically via useEffect
  };


  const handleEntryPress = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    // Other modals close automatically via useEffect
  };

  const handleDeleteEntry = (entryId: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setEntries(prev => prev.filter(e => e.id !== entryId));
            setSelectedEntry(null); // Close detail modal
          }
        }
      ]
    );
  };


  const renderEntry = ({ item: entry }: { item: JournalEntry }) => {
    if (!entry) return null;
    
    const { dayName, dayNumber } = formatDate(entry.date);
    
    return (
      <TouchableOpacity 
        style={styles.entryCard} 
        onPress={() => handleEntryPress(entry)}
        activeOpacity={0.7}
      >
        <Text style={styles.entryTitle} numberOfLines={1}>{entry.title || 'Untitled'}</Text>
        <View style={styles.entryHeader}>
          <View style={styles.dateContainer}>
            <Text style={styles.dayNumber}>{dayNumber}</Text>
            <Text style={styles.dayName}>{dayName}</Text>
          </View>
        </View>
        <Text style={styles.entryPreview} numberOfLines={2}>{entry.content || 'No content'}</Text>
      </TouchableOpacity>
    );
  };

  const renderGroup = ({ item: group }: { item: JournalGroup }) => {
    if (!group || !group.entries) return null;
    
    return (
      <View style={styles.groupContainer}>
        <View style={styles.groupHeader}>
          <Text style={styles.groupTitle}>{group.month} {group.year}</Text>
          <Text style={styles.groupSubtitle}>{group.entries.length} entries</Text>
        </View>
        {group.entries.map(entry => (
          <View key={entry.id}>
            {renderEntry({ item: entry })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container as any}>
      <View style={styles.header}>
        <Text style={styles.title}>Journal</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddEntry}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color={Colors.primary[600]} />
        </TouchableOpacity>
      </View>

      <FlatList
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        data={groupedEntries}
        keyExtractor={(item) => `${item.month}-${item.year}`}
        renderItem={renderGroup}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={64} color={Colors.neutral[400]} />
            <Text style={styles.emptyText}>No journal entries yet!</Text>
            <Text style={styles.emptySubtext}>Tap the + button above to create your first entry</Text>
          </View>
        )}
      />

      {/* Entry Detail Modal */}
      <EntryDetailModal
        entry={selectedEntry}
        visible={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        onSave={(updatedEntry) => {
          if (selectedEntry) {
            setEntries(prev => 
              prev.map(e => 
                e.id === selectedEntry.id 
                  ? { ...e, ...updatedEntry, updated_at: new Date().toISOString() }
                  : e
              )
            );
          }
        }}
        onDelete={handleDeleteEntry}
      />

      {/* Add Entry Modal */}
      <AddEditEntryModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onSave={(newEntry) => {
          const entry: JournalEntry = {
            ...newEntry,
            id: `journal_${Date.now()}`,
            user_id: 'user_1',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setEntries(prev => [entry, ...prev]);
        }}
      />

    </SafeAreaView>
  );
}

// Entry Detail Modal Component with Inline Editing
interface EntryDetailModalProps {
  entry: JournalEntry | null;
  visible: boolean;
  onClose: () => void;
  onSave: (updatedEntry: Partial<JournalEntry>) => void;
  onDelete: (entryId: string) => void;
}

function EntryDetailModal({ entry, visible, onClose, onSave, onDelete }: EntryDetailModalProps) {
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  React.useEffect(() => {
    if (entry) {
      setEditTitle(entry.title || '');
      setEditContent(entry.content || '');
    }
  }, [entry]);

  if (!entry) return null;

  const fullDate = new Date(entry.date).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const handleSave = () => {
    onSave({
      title: editTitle.trim(),
      content: editContent.trim(),
    });
    
    onClose(); // Close the modal after saving
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer as any}>
        {/* Clean Header with Clear Actions */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.headerAction}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Edit Entry</Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerAction}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            style={styles.modalContent}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
          {/* Date Section */}
          <View style={styles.metaSection}>
            <Text style={styles.dateText}>{fullDate}</Text>
          </View>
          
          {/* Title Input */}
          <View style={styles.inputSection}>
            <TextInput
              style={styles.titleInputStyled}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Give your entry a title..."
              placeholderTextColor={Colors.neutral[400]}
            />
          </View>
          
          {/* Content Input with Label */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Your thoughts</Text>
            <TextInput
              style={styles.contentInputStyled}
              value={editContent}
              onChangeText={setEditContent}
              placeholder="What's on your mind today? How are you feeling?"
              placeholderTextColor={Colors.neutral[400]}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Delete Button at Bottom */}
          <TouchableOpacity 
            onPress={() => onDelete(entry.id)} 
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={20} color={Colors.alert[600]} />
            <Text style={styles.deleteText}>Delete Entry</Text>
          </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}


// Add/Edit Entry Modal Component
interface AddEditEntryModalProps {
  visible: boolean;
  entry?: JournalEntry | null;
  onClose: () => void;
  onSave: (entry: Omit<JournalEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
}

function AddEditEntryModal({ visible, entry, onClose, onSave }: AddEditEntryModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  React.useEffect(() => {
    if (entry) {
      setTitle(entry.title);
      setContent(entry.content);
      setDate(entry.date);
    } else {
      setTitle('');
      setContent('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [entry, visible]);

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Missing Information', 'Please provide both a title and content for your journal entry.');
      return;
    }
    
    onSave({
      title: title.trim(),
      content: content.trim(),
      date,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer as any}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{entry ? 'Edit Entry' : 'New Entry'}</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            style={styles.modalContent}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Give your entry a title..."
              placeholderTextColor={Colors.neutral[400]}
            />
          </View>


          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Content</Text>
            <TextInput
              style={styles.contentInput}
              value={content}
              onChangeText={setContent}
              placeholder="What's on your mind today?"
              placeholderTextColor={Colors.neutral[400]}
              multiline
              textAlignVertical="top"
            />
          </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[100],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.neutral[50],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  title: {
    ...Typography.h1,
    color: Colors.neutral[800],
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing['5xl'],
  },
  groupContainer: {
    marginBottom: Spacing.xl,
  },
  groupHeader: {
    marginBottom: Spacing.lg,
  },
  groupTitle: {
    ...Typography.h2,
    color: Colors.neutral[800],
  },
  groupSubtitle: {
    ...Typography.bodySmall,
    color: Colors.neutral[600],
  },
  entryCard: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  dateContainer: {
    alignItems: 'center',
    minWidth: 50,
  },
  dayNumber: {
    ...Typography.h2,
    color: Colors.primary[600],
    lineHeight: 24,
  },
  dayName: {
    ...Typography.caption,
    color: Colors.neutral[600],
    textTransform: 'uppercase',
  },
  editButton: {
    padding: Spacing.xs,
  },
  entryTitle: {
    ...Typography.h3,
    color: Colors.neutral[800],
    marginBottom: Spacing.sm,
  },
  entryPreview: {
    ...Typography.body,
    color: Colors.neutral[600],
    marginBottom: Spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['5xl'],
  },
  emptyText: {
    ...Typography.h3,
    color: Colors.neutral[600],
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    ...Typography.body,
    color: Colors.neutral[500],
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  modalTitle: {
    ...Typography.h2,
    color: Colors.neutral[800],
  },
  closeButton: {
    padding: Spacing.sm,
  },
  cancelText: {
    ...Typography.body,
    color: Colors.neutral[600],
  },
  saveButton: {
    padding: Spacing.sm,
  },
  saveText: {
    ...Typography.body,
    color: Colors.primary[600],
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    padding: Spacing.sm,
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing['5xl'],
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  entryDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  entryDetailDate: {
    ...Typography.body,
    color: Colors.neutral[600],
  },
  entryDetailTitle: {
    ...Typography.h1,
    color: Colors.neutral[800],
    marginBottom: Spacing.lg,
  },
  entryDetailContent: {
    ...Typography.body,
    color: Colors.neutral[700],
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  detailTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.neutral[800],
    marginBottom: Spacing.sm,
  },
  titleInput: {
    ...Typography.body,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    backgroundColor: Colors.neutral[50],
  },
  contentInput: {
    ...Typography.body,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    backgroundColor: Colors.neutral[50],
    minHeight: 200,
  },
  headerAction: {
    padding: Spacing.sm,
    minWidth: 60,
  },
  dateText: {
    ...Typography.body,
    color: Colors.neutral[600],
    marginBottom: Spacing.lg,
  },
  inputSection: {
    marginBottom: Spacing.xl,
  },
  titleInputStyled: {
    ...Typography.h3,
    borderWidth: 0,
    borderBottomWidth: 2,
    borderBottomColor: Colors.neutral[200],
    paddingBottom: Spacing.md,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    color: Colors.neutral[800],
  },
  contentInputStyled: {
    ...Typography.body,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    backgroundColor: Colors.neutral[50],
    minHeight: 180,
    lineHeight: 22,
    fontSize: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.alert[50],
    borderWidth: 1,
    borderColor: Colors.alert[200],
  },
  deleteText: {
    ...Typography.body,
    color: Colors.alert[600],
    marginLeft: Spacing.sm,
    fontWeight: '500',
  },
});