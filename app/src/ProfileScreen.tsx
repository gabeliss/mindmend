import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Switch, ScrollView, Modal, TextInput, Alert } from 'react-native';

interface Habit {
  id: string;
  name: string;
  freq: string;
  time: string;
  description?: string;
  triggerTags: string[];
  isEnabled: boolean;
}

interface CoachStyle {
  name: string;
  description: string;
  preview: string;
  icon: string;
}

interface UpgradeBenefit {
  title: string;
  description: string;
  icon: string;
}

const goodHabits: Habit[] = [
  { 
    id: '1', 
    name: 'Morning Workout', 
    freq: 'Mon/Wed/Fri', 
    time: '7:00 AM',
    description: 'Exercise boosts my mood and gives me energy for the day',
    triggerTags: ['morning', 'energy', 'routine'],
    isEnabled: true
  },
  { 
    id: '3', 
    name: 'Evening Reading', 
    freq: 'Daily', 
    time: '8:00 PM',
    description: 'Reading helps me wind down and avoid screen time',
    triggerTags: ['evening', 'relaxation', 'screen-alternative'],
    isEnabled: true
  }
];

const badHabits: Habit[] = [
  { 
    id: '2', 
    name: 'No phone in bed', 
    freq: 'Daily', 
    time: '10:00 PM',
    description: 'Phone use in bed disrupts my sleep and triggers mindless scrolling',
    triggerTags: ['bedtime', 'phone', 'sleep'],
    isEnabled: true
  },
  { 
    id: '4', 
    name: 'Avoid social media', 
    freq: 'Weekends', 
    time: 'All day',
    description: 'Weekend social media use often leads to comparison and time waste',
    triggerTags: ['weekend', 'social-media', 'comparison'],
    isEnabled: false
  }
];

const coachStyles: CoachStyle[] = [
  {
    name: 'Chill Monk',
    description: 'Zen, mindful, patient approach',
    preview: '"Breathe. This urge is like a wave - observe it, don\'t fight it. It will pass. 🧘"',
    icon: '🧘'
  },
  {
    name: 'Tough Love',
    description: 'Direct, no-nonsense accountability',
    preview: '"Stop making excuses. You know what you need to do. Get up and do it. NOW. 💪"',
    icon: '💪'
  },
  {
    name: 'Therapist',
    description: 'Empathetic, understanding support',
    preview: '"I understand this is difficult. What do you think triggered this feeling? Let\'s explore it together. 🤗"',
    icon: '🤗'
  },
  {
    name: 'Motivational Bro',
    description: 'Energetic, pump-you-up style',
    preview: '"YOOO! You\'ve got this! Remember why you started! Let\'s CRUSH this day! 🔥"',
    icon: '🔥'
  }
];

const upgradeBenefits: UpgradeBenefit[] = [
  {
    title: 'Deeper AI Feedback',
    description: 'Advanced pattern recognition and personalized insights',
    icon: '🤖'
  },
  {
    title: 'Unlimited Habits',
    description: 'Track as many habits as you need for complete life design',
    icon: '♾️'
  },
  {
    title: 'Relapse Prediction',
    description: 'AI alerts when you\'re at high risk based on your patterns',
    icon: '🔮'
  },
  {
    title: 'Weekly Reports',
    description: 'Exportable streak reports and email summaries',
    icon: '📊'
  },
  {
    title: 'Priority Support',
    description: 'Get help faster when you need it most',
    icon: '⭐'
  }
];

const frequencyOptions = [
  'Daily', 'Mon/Wed/Fri', 'Tue/Thu', 'Weekdays', 'Weekends', 'Weekly', 'Custom'
];

const availableTriggerTags = [
  'morning', 'evening', 'bedtime', 'work', 'stress', 'boredom', 'social', 
  'phone', 'energy', 'routine', 'relaxation', 'weekend', 'loneliness'
];

export default function ProfileScreen() {
  const [selectedCoach, setSelectedCoach] = useState<string>('Chill Monk');
  const [showCoachPreview, setShowCoachPreview] = useState<string | null>(null);
  const [habitView, setHabitView] = useState<'overview' | 'good' | 'bad'>('overview');
  const [showUpgradeBenefits, setShowUpgradeBenefits] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState({
    morningCheckin: true,
    eveningCheckin: true,
    relapseReminders: false,
    weeklyReport: true
  });
  const [showExportModal, setShowExportModal] = useState(false);
  const [userEmail, setUserEmail] = useState('user@example.com');
  
  const handleExportReport = () => {
    Alert.alert(
      'Report Sent!',
      `Your weekly streak report has been sent to ${userEmail}`,
      [{ text: 'OK', onPress: () => setShowExportModal(false) }]
    );
  };
  
  const renderHabitsOverview = () => (
    <View style={styles.habitsOverview}>
      <View style={styles.habitSection}>
        <View style={styles.habitSectionHeader}>
          <Text style={styles.sectionTitle}>🌱 Good Habits</Text>
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => setHabitView('good')}
          >
            <Text style={styles.viewAllText}>View All ({goodHabits.length})</Text>
          </TouchableOpacity>
        </View>
        {goodHabits.slice(0, 2).map(habit => (
          <View key={habit.id} style={[styles.habitRow, styles.goodHabitRow]}>
            <View style={styles.habitInfo}>
              <Text style={styles.habitName}>{habit.name}</Text>
              <Text style={styles.habitMeta}>{habit.freq} | {habit.time}</Text>
            </View>
            <Switch 
              value={habit.isEnabled} 
              onValueChange={() => {/* toggle habit */}}
              trackColor={{ false: '#E2E8F0', true: '#48BB78' }}
              thumbColor={habit.isEnabled ? '#38A169' : '#A0AEC0'}
            />
          </View>
        ))}
      </View>
      
      <View style={styles.habitSection}>
        <View style={styles.habitSectionHeader}>
          <Text style={styles.sectionTitle}>🚫 Bad Habits</Text>
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => setHabitView('bad')}
          >
            <Text style={styles.viewAllText}>View All ({badHabits.length})</Text>
          </TouchableOpacity>
        </View>
        {badHabits.slice(0, 2).map(habit => (
          <View key={habit.id} style={[styles.habitRow, styles.badHabitRow]}>
            <View style={styles.habitInfo}>
              <Text style={styles.habitName}>{habit.name}</Text>
              <Text style={styles.habitMeta}>{habit.freq} | {habit.time}</Text>
            </View>
            <Switch 
              value={habit.isEnabled} 
              onValueChange={() => {/* toggle habit */}}
              trackColor={{ false: '#E2E8F0', true: '#F56565' }}
              thumbColor={habit.isEnabled ? '#E53E3E' : '#A0AEC0'}
            />
          </View>
        ))}
      </View>
    </View>
  );
  
  const renderHabitDetails = (habits: Habit[], type: 'good' | 'bad') => (
    <View style={styles.habitDetails}>
      <View style={styles.habitDetailsHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setHabitView('overview')}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.habitDetailsTitle}>
          {type === 'good' ? '🌱 Good Habits' : '🚫 Bad Habits'}
        </Text>
      </View>
      
      {habits.map(habit => (
        <View key={habit.id} style={[styles.habitCard, type === 'good' ? styles.goodHabitCard : styles.badHabitCard]}>
          <View style={styles.habitCardHeader}>
            <View style={styles.habitCardInfo}>
              <Text style={styles.habitCardName}>{habit.name}</Text>
              <Text style={styles.habitCardFreq}>{habit.freq} at {habit.time}</Text>
            </View>
            <Switch 
              value={habit.isEnabled} 
              onValueChange={() => {/* toggle habit */}}
              trackColor={{ false: '#E2E8F0', true: type === 'good' ? '#48BB78' : '#F56565' }}
              thumbColor={habit.isEnabled ? (type === 'good' ? '#38A169' : '#E53E3E') : '#A0AEC0'}
            />
          </View>
          
          {habit.description && (
            <Text style={styles.habitDescription}>{habit.description}</Text>
          )}
          
          <View style={styles.triggerTags}>
            <Text style={styles.triggerTagsLabel}>Triggers:</Text>
            <View style={styles.tagContainer}>
              {habit.triggerTags.map(tag => (
                <View key={tag} style={styles.triggerTag}>
                  <Text style={styles.triggerTagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      ))}
      
      <TouchableOpacity style={[styles.addBtn, type === 'good' ? styles.addGoodBtn : styles.addBadBtn]}>
        <Text style={styles.addBtnText}>+ Add {type === 'good' ? 'Good' : 'Bad'} Habit</Text>
      </TouchableOpacity>
    </View>
  );
  
  return (
    <ScrollView style={[styles.container, darkMode && styles.darkContainer]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, darkMode && styles.darkText]}>Profile</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.exportButton}
            onPress={() => setShowExportModal(true)}
          >
            <Text style={styles.exportButtonText}>📊 Export</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Habits Section */}
      <View style={[styles.section, darkMode && styles.darkSection]}>
        {habitView === 'overview' && renderHabitsOverview()}
        {habitView === 'good' && renderHabitDetails(goodHabits, 'good')}
        {habitView === 'bad' && renderHabitDetails(badHabits, 'bad')}
      </View>
      
      {/* Coach Style Section */}
      <View style={[styles.section, darkMode && styles.darkSection]}>
        <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>🤖 AI Coach Style</Text>
        <Text style={[styles.sectionSubtitle, darkMode && styles.darkSubtext]}>Choose how your AI coach communicates with you</Text>
        
        <View style={styles.coachGrid}>
          {coachStyles.map((coach) => (
            <TouchableOpacity
              key={coach.name}
              style={[
                styles.coachCard,
                selectedCoach === coach.name && styles.coachCardSelected,
                darkMode && styles.darkCard
              ]}
              onPress={() => setSelectedCoach(coach.name)}
              onLongPress={() => setShowCoachPreview(coach.name)}
            >
              <Text style={styles.coachIcon}>{coach.icon}</Text>
              <Text style={[styles.coachName, darkMode && styles.darkText]}>{coach.name}</Text>
              <Text style={[styles.coachDescription, darkMode && styles.darkSubtext]}>{coach.description}</Text>
              <TouchableOpacity 
                style={styles.previewButton}
                onPress={() => setShowCoachPreview(coach.name)}
              >
                <Text style={styles.previewButtonText}>Preview 👁️</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Settings Section */}
      <View style={[styles.section, darkMode && styles.darkSection]}>
        <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>⚙️ Settings</Text>
        
        <View style={[styles.settingRow, darkMode && styles.darkSettingRow]}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, darkMode && styles.darkText]}>Dark Mode</Text>
            <Text style={[styles.settingDescription, darkMode && styles.darkSubtext]}>Reduce screen brightness for dopamine detox</Text>
          </View>
          <Switch 
            value={darkMode} 
            onValueChange={setDarkMode}
            trackColor={{ false: '#E2E8F0', true: '#4A5568' }}
            thumbColor={darkMode ? '#2D3748' : '#A0AEC0'}
          />
        </View>
        
        <View style={[styles.settingRow, darkMode && styles.darkSettingRow]}>
          <Text style={[styles.settingLabel, darkMode && styles.darkText]}>Morning Check-In</Text>
          <Switch 
            value={notifications.morningCheckin} 
            onValueChange={(value) => setNotifications(prev => ({ ...prev, morningCheckin: value }))}
          />
        </View>
        
        <View style={[styles.settingRow, darkMode && styles.darkSettingRow]}>
          <Text style={[styles.settingLabel, darkMode && styles.darkText]}>Evening Check-In</Text>
          <Switch 
            value={notifications.eveningCheckin} 
            onValueChange={(value) => setNotifications(prev => ({ ...prev, eveningCheckin: value }))}
          />
        </View>
        
        <View style={[styles.settingRow, darkMode && styles.darkSettingRow]}>
          <Text style={[styles.settingLabel, darkMode && styles.darkText]}>Relapse Reminders</Text>
          <Switch 
            value={notifications.relapseReminders} 
            onValueChange={(value) => setNotifications(prev => ({ ...prev, relapseReminders: value }))}
          />
        </View>
        
        <View style={[styles.settingRow, darkMode && styles.darkSettingRow]}>
          <Text style={[styles.settingLabel, darkMode && styles.darkText]}>Weekly Report Email</Text>
          <Switch 
            value={notifications.weeklyReport} 
            onValueChange={(value) => setNotifications(prev => ({ ...prev, weeklyReport: value }))}
          />
        </View>
      </View>
      
      {/* Subscription Section */}
      <View style={[styles.section, darkMode && styles.darkSection]}>
        <View style={styles.subscriptionHeader}>
          <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>💳 Subscription</Text>
          <View style={styles.planBadge}>
            <Text style={styles.planBadgeText}>FREE</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.upgradeBtn}
          onPress={() => setShowUpgradeBenefits(true)}
        >
          <View style={styles.upgradeBtnContent}>
            <Text style={styles.upgradeText}>Upgrade to MindMend+</Text>
            <Text style={styles.upgradeSubtext}>Unlock advanced features</Text>
          </View>
          <Text style={styles.upgradeArrow}>→</Text>
        </TouchableOpacity>
      </View>
      
      {/* Danger Zone */}
      <View style={[styles.section, darkMode && styles.darkSection]}>
        <Text style={styles.sectionTitleDanger}>⚠️ Danger Zone</Text>
        <TouchableOpacity style={styles.dangerBtn}>
          <Text style={styles.dangerText}>Reset All Streaks</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dangerBtn}>
          <Text style={styles.dangerText}>Delete Account</Text>
        </TouchableOpacity>
      </View>
      
      {/* Coach Preview Modal */}
      <Modal
        visible={showCoachPreview !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCoachPreview(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, darkMode && styles.darkModal]}>
            {showCoachPreview && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalIcon}>
                    {coachStyles.find(c => c.name === showCoachPreview)?.icon}
                  </Text>
                  <Text style={[styles.modalTitle, darkMode && styles.darkText]}>
                    {showCoachPreview} Preview
                  </Text>
                </View>
                <View style={styles.previewContainer}>
                  <Text style={[styles.previewLabel, darkMode && styles.darkSubtext]}>Sample Response:</Text>
                  <Text style={[styles.previewText, darkMode && styles.darkText]}>
                    {coachStyles.find(c => c.name === showCoachPreview)?.preview}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.modalCloseBtn}
                  onPress={() => setShowCoachPreview(null)}
                >
                  <Text style={styles.modalCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Upgrade Benefits Modal */}
      <Modal
        visible={showUpgradeBenefits}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUpgradeBenefits(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, styles.upgradeModal, darkMode && styles.darkModal]}>
            <View style={styles.upgradeModalHeader}>
              <Text style={styles.upgradeModalTitle}>MindMend+</Text>
              <Text style={styles.upgradeModalPrice}>$9.99/month</Text>
            </View>
            
            <View style={styles.benefitsList}>
              {upgradeBenefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Text style={styles.benefitIcon}>{benefit.icon}</Text>
                  <View style={styles.benefitText}>
                    <Text style={[styles.benefitTitle, darkMode && styles.darkText]}>{benefit.title}</Text>
                    <Text style={[styles.benefitDescription, darkMode && styles.darkSubtext]}>{benefit.description}</Text>
                  </View>
                </View>
              ))}
            </View>
            
            <View style={styles.upgradeModalActions}>
              <TouchableOpacity style={styles.upgradeModalBtn}>
                <Text style={styles.upgradeModalBtnText}>Start Free Trial</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.upgradeModalCancel}
                onPress={() => setShowUpgradeBenefits(false)}
              >
                <Text style={styles.upgradeModalCancelText}>Maybe Later</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Export Modal */}
      <Modal
        visible={showExportModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowExportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, darkMode && styles.darkModal]}>
            <Text style={[styles.modalTitle, darkMode && styles.darkText]}>Export Streak Report</Text>
            <Text style={[styles.modalSubtitle, darkMode && styles.darkSubtext]}>Get a detailed summary of your progress</Text>
            
            <View style={styles.exportOptions}>
              <TouchableOpacity style={styles.exportOption}>
                <Text style={styles.exportOptionIcon}>📊</Text>
                <Text style={[styles.exportOptionText, darkMode && styles.darkText]}>Weekly Summary</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportOption}>
                <Text style={styles.exportOptionIcon}>📈</Text>
                <Text style={[styles.exportOptionText, darkMode && styles.darkText]}>Monthly Report</Text>
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[styles.emailInput, darkMode && styles.darkInput]}
              value={userEmail}
              onChangeText={setUserEmail}
              placeholder="Email address"
              placeholderTextColor={darkMode ? '#A0AEC0' : '#718096'}
            />
            
            <View style={styles.exportModalActions}>
              <TouchableOpacity style={styles.exportBtn} onPress={handleExportReport}>
                <Text style={styles.exportBtnText}>Send Report</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.exportCancel}
                onPress={() => setShowExportModal(false)}
              >
                <Text style={styles.exportCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC', 
    padding: 20 
  },
  darkContainer: {
    backgroundColor: '#1A202C'
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3748'
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8
  },
  exportButton: {
    backgroundColor: '#4F8EF7',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  
  // Sections
  section: { 
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  darkSection: {
    backgroundColor: '#2D3748'
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 8, 
    color: '#2D3748' 
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 16
  },
  
  // Dark mode text
  darkText: {
    color: '#F7FAFC'
  },
  darkSubtext: {
    color: '#A0AEC0'
  },
  darkCard: {
    backgroundColor: '#4A5568'
  },
  darkModal: {
    backgroundColor: '#2D3748'
  },
  darkInput: {
    backgroundColor: '#4A5568',
    borderColor: '#718096',
    color: '#F7FAFC'
  },
  darkSettingRow: {
    borderBottomColor: '#4A5568'
  },
  
  // Habits Overview
  habitsOverview: {
    gap: 20
  },
  habitSection: {
    marginBottom: 8
  },
  habitSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  viewAllButton: {
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  viewAllText: {
    color: '#4A5568',
    fontSize: 12,
    fontWeight: '600'
  },
  habitRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#F7FAFC',
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 8,
    borderLeftWidth: 4
  },
  goodHabitRow: {
    borderLeftColor: '#48BB78'
  },
  badHabitRow: {
    borderLeftColor: '#F56565'
  },
  habitInfo: {
    flex: 1
  },
  habitName: { 
    fontWeight: 'bold', 
    color: '#2D3748',
    fontSize: 16,
    marginBottom: 4
  },
  habitMeta: { 
    color: '#718096',
    fontSize: 14
  },
  
  // Habit Details
  habitDetails: {
    gap: 16
  },
  habitDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  backButton: {
    marginRight: 12
  },
  backButtonText: {
    color: '#4F8EF7',
    fontSize: 16,
    fontWeight: '600'
  },
  habitDetailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748'
  },
  habitCard: {
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4
  },
  goodHabitCard: {
    borderLeftColor: '#48BB78'
  },
  badHabitCard: {
    borderLeftColor: '#F56565'
  },
  habitCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  habitCardInfo: {
    flex: 1
  },
  habitCardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 4
  },
  habitCardFreq: {
    fontSize: 14,
    color: '#718096'
  },
  habitDescription: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
    marginBottom: 12,
    fontStyle: 'italic'
  },
  triggerTags: {
    marginTop: 8
  },
  triggerTagsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#718096',
    marginBottom: 6
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  triggerTag: {
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 6
  },
  triggerTagText: {
    color: '#4A5568',
    fontSize: 10,
    fontWeight: '600'
  },
  
  // Add Button
  addBtn: { 
    borderRadius: 12, 
    paddingVertical: 12, 
    marginTop: 8, 
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center'
  },
  addGoodBtn: {
    backgroundColor: '#48BB78'
  },
  addBadBtn: {
    backgroundColor: '#F56565'
  },
  addBtnText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  
  // Coach Style
  coachGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  coachCard: {
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0'
  },
  coachCardSelected: {
    borderColor: '#4F8EF7',
    backgroundColor: '#EBF8FF'
  },
  coachIcon: {
    fontSize: 32,
    marginBottom: 8
  },
  coachName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 4,
    textAlign: 'center'
  },
  coachDescription: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 8
  },
  previewButton: {
    backgroundColor: '#4F8EF7',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  previewButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600'
  },
  
  // Settings
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  settingInfo: {
    flex: 1,
    marginRight: 12
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 2
  },
  settingDescription: {
    fontSize: 12,
    color: '#718096'
  },
  
  // Subscription
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  planBadge: {
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  planBadgeText: {
    color: '#4A5568',
    fontSize: 12,
    fontWeight: 'bold'
  },
  upgradeBtn: { 
    backgroundColor: '#4F8EF7', 
    borderRadius: 12, 
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#4F8EF7',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  upgradeBtnContent: {
    flex: 1
  },
  upgradeText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 18,
    marginBottom: 4
  },
  upgradeSubtext: {
    color: '#E6FFFA',
    fontSize: 14
  },
  upgradeArrow: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold'
  },
  
  // Danger Zone
  sectionTitleDanger: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 12, 
    color: '#E53E3E' 
  },
  dangerBtn: { 
    backgroundColor: '#FED7D7', 
    borderRadius: 12, 
    paddingVertical: 12, 
    marginBottom: 8, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEB2B2'
  },
  dangerText: { 
    color: '#C53030', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20
  },
  modalIcon: {
    fontSize: 32,
    marginBottom: 8
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
    textAlign: 'center'
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 20
  },
  previewContainer: {
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#718096',
    marginBottom: 8
  },
  previewText: {
    fontSize: 16,
    color: '#2D3748',
    lineHeight: 24,
    fontStyle: 'italic'
  },
  modalCloseBtn: {
    backgroundColor: '#4F8EF7',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center'
  },
  modalCloseBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  
  // Upgrade Modal
  upgradeModal: {
    maxWidth: 450
  },
  upgradeModalHeader: {
    alignItems: 'center',
    marginBottom: 24
  },
  upgradeModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4F8EF7',
    marginBottom: 4
  },
  upgradeModalPrice: {
    fontSize: 18,
    color: '#718096',
    fontWeight: '600'
  },
  benefitsList: {
    marginBottom: 24
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  benefitIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2
  },
  benefitText: {
    flex: 1
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 4
  },
  benefitDescription: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20
  },
  upgradeModalActions: {
    gap: 12
  },
  upgradeModalBtn: {
    backgroundColor: '#4F8EF7',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center'
  },
  upgradeModalBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  upgradeModalCancel: {
    alignItems: 'center',
    paddingVertical: 8
  },
  upgradeModalCancelText: {
    color: '#718096',
    fontSize: 16
  },
  
  // Export Modal
  exportOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20
  },
  exportOption: {
    flex: 1,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  exportOptionIcon: {
    fontSize: 24,
    marginBottom: 8
  },
  exportOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    textAlign: 'center'
  },
  emailInput: {
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20
  },
  exportModalActions: {
    gap: 12
  },
  exportBtn: {
    backgroundColor: '#38A169',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center'
  },
  exportBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  exportCancel: {
    alignItems: 'center',
    paddingVertical: 8
  },
  exportCancelText: {
    color: '#718096',
    fontSize: 16
  }
}); 