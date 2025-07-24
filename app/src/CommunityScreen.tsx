import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from './lib/design-system';

interface CommunityPost {
  id: string;
  content: string;
  timestamp: string;
  reactions: {
    support: number;
    strength: number;
    relate: number;
  };
  userReacted: boolean;
  tags: string[];
  anonymous: boolean;
}

interface SupportResource {
  title: string;
  description: string;
  icon: string;
  action: string;
}

export default function CommunityScreen() {
  const [posts, setPosts] = useState<CommunityPost[]>([
    {
      id: '1',
      content: 'Day 3 of my phone detox. The urge to scroll is so strong right now but I\'m pushing through. Anyone else struggling with this tonight?',
      timestamp: '2 hours ago',
      reactions: { support: 12, strength: 8, relate: 15 },
      userReacted: false,
      tags: ['phone-detox', 'evening-struggle'],
      anonymous: true
    },
    {
      id: '2', 
      content: 'Just hit 30 days clean from social media! The clarity is incredible. For anyone early in their journey - it gets so much better.',
      timestamp: '4 hours ago',
      reactions: { support: 28, strength: 22, relate: 6 },
      userReacted: true,
      tags: ['30-day-milestone', 'social-media'],
      anonymous: true
    },
    {
      id: '3',
      content: 'Relapsed yesterday after 14 days. Feeling disappointed but my coach reminded me that this is part of the process. Getting back up today. 💪',
      timestamp: '1 day ago',
      reactions: { support: 34, strength: 19, relate: 25 },
      userReacted: false,
      tags: ['relapse-recovery', 'resilience'],
      anonymous: true
    }
  ]);

  const [newPost, setNewPost] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const supportResources: SupportResource[] = [
    {
      title: 'Crisis Support',
      description: 'Immediate help when urges feel overwhelming',
      icon: '🆘',
      action: 'Get Help Now'
    },
    {
      title: 'Daily Check-in Circle',
      description: 'Join others sharing their daily wins and challenges',
      icon: '🔄',
      action: 'Join Circle'
    },
    {
      title: 'Accountability Partners',
      description: 'Connect with someone on a similar journey',
      icon: '🤝',
      action: 'Find Partner'
    },
    {
      title: 'Recovery Stories',
      description: 'Read inspiring transformation journeys',
      icon: '📖',
      action: 'Read Stories'
    }
  ];

  const filters = [
    { key: 'all', label: 'All Posts', count: posts.length },
    { key: 'struggles', label: 'Struggles', count: 8 },
    { key: 'victories', label: 'Victories', count: 12 },
    { key: 'advice', label: 'Advice', count: 6 }
  ];

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => setRefreshing(false), 1000);
  };

  const reactToPost = (postId: string, reactionType: keyof CommunityPost['reactions']) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? {
              ...post,
              reactions: {
                ...post.reactions,
                [reactionType]: post.userReacted 
                  ? post.reactions[reactionType] - 1 
                  : post.reactions[reactionType] + 1
              },
              userReacted: !post.userReacted
            }
          : post
      )
    );
  };

  const sharePost = () => {
    if (newPost.trim()) {
      const post: CommunityPost = {
        id: Date.now().toString(),
        content: newPost,
        timestamp: 'Just now',
        reactions: { support: 0, strength: 0, relate: 0 },
        userReacted: false,
        tags: [],
        anonymous: true
      };
      setPosts([post, ...posts]);
      setNewPost('');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🤝 Community Support</Text>
        <Text style={styles.headerSubtitle}>You're not alone in this journey</Text>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Support Resources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Support</Text>
          <View style={styles.resourcesGrid}>
            {supportResources.map((resource, index) => (
              <TouchableOpacity key={index} style={styles.resourceCard}>
                <Text style={styles.resourceIcon}>{resource.icon}</Text>
                <Text style={styles.resourceTitle}>{resource.title}</Text>
                <Text style={styles.resourceDescription}>{resource.description}</Text>
                <TouchableOpacity style={styles.resourceButton}>
                  <Text style={styles.resourceButtonText}>{resource.action}</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Share Something */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Share with Community</Text>
          <View style={styles.shareCard}>
            <TextInput
              style={styles.shareInput}
              placeholder="Share your struggles, victories, or encouragement... (posted anonymously)"
              placeholderTextColor={Colors.neutral[400]}
              value={newPost}
              onChangeText={setNewPost}
              multiline
              numberOfLines={3}
            />
            <View style={styles.shareFooter}>
              <Text style={styles.anonymousNote}>🔒 Always anonymous</Text>
              <TouchableOpacity 
                style={[styles.shareButton, !newPost.trim() && styles.shareButtonDisabled]}
                onPress={sharePost}
                disabled={!newPost.trim()}
              >
                <Text style={styles.shareButtonText}>Share Support</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.section}>
          <View style={styles.filtersContainer}>
            {filters.map(filter => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterChip,
                  selectedFilter === filter.key && styles.filterChipSelected
                ]}
                onPress={() => setSelectedFilter(filter.key)}
              >
                <Text style={[
                  styles.filterText,
                  selectedFilter === filter.key && styles.filterTextSelected
                ]}>
                  {filter.label} ({filter.count})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Community Posts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community Feed</Text>
          {posts.map(post => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={styles.postMeta}>
                  <Text style={styles.postUser}>Anonymous</Text>
                  <Text style={styles.postTime}>{post.timestamp}</Text>
                </View>
                <View style={styles.postTags}>
                  {post.tags.map(tag => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
              
              <Text style={styles.postContent}>{post.content}</Text>
              
              <View style={styles.postActions}>
                <TouchableOpacity 
                  style={styles.reactionButton}
                  onPress={() => reactToPost(post.id, 'support')}
                >
                  <Text style={styles.reactionIcon}>🤗</Text>
                  <Text style={styles.reactionCount}>{post.reactions.support}</Text>
                  <Text style={styles.reactionLabel}>Support</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.reactionButton}
                  onPress={() => reactToPost(post.id, 'strength')}
                >
                  <Text style={styles.reactionIcon}>💪</Text>
                  <Text style={styles.reactionCount}>{post.reactions.strength}</Text>
                  <Text style={styles.reactionLabel}>Strength</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.reactionButton}
                  onPress={() => reactToPost(post.id, 'relate')}
                >
                  <Text style={styles.reactionIcon}>🙋</Text>
                  <Text style={styles.reactionCount}>{post.reactions.relate}</Text>
                  <Text style={styles.reactionLabel}>Relate</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Community Guidelines */}
        <View style={styles.section}>
          <View style={styles.guidelinesCard}>
            <Text style={styles.guidelinesTitle}>💙 Community Guidelines</Text>
            <Text style={styles.guidelinesText}>
              • Be kind and supportive{'\n'}
              • Share honestly about your journey{'\n'}
              • Respect everyone's privacy{'\n'}
              • No judgment - we're all learning{'\n'}
              • Celebrate victories, big and small
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50]
  },
  header: {
    backgroundColor: Colors.primary[500],
    padding: Spacing.xl,
    paddingTop: Spacing['4xl'],
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl
  },
  headerTitle: {
    ...Typography.h2,
    color: '#FFFFFF',
    marginBottom: Spacing.xs
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    color: Colors.primary[100]
  },
  content: {
    flex: 1
  },
  section: {
    padding: Spacing.xl
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.neutral[800],
    marginBottom: Spacing.lg
  },
  
  // Support Resources
  resourcesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md
  },
  resourceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '48%',
    alignItems: 'center',
    ...Shadows.sm
  },
  resourceIcon: {
    fontSize: 24,
    marginBottom: Spacing.sm
  },
  resourceTitle: {
    ...Typography.button,
    color: Colors.neutral[800],
    textAlign: 'center',
    marginBottom: Spacing.xs
  },
  resourceDescription: {
    ...Typography.caption,
    color: Colors.neutral[600],
    textAlign: 'center',
    marginBottom: Spacing.md
  },
  resourceButton: {
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm
  },
  resourceButtonText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '600'
  },
  
  // Share Section
  shareCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm
  },
  shareInput: {
    ...Typography.body,
    color: Colors.neutral[800],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: Spacing.md
  },
  shareFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  anonymousNote: {
    ...Typography.caption,
    color: Colors.neutral[500]
  },
  shareButton: {
    backgroundColor: Colors.secondary[500],
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg
  },
  shareButtonDisabled: {
    backgroundColor: Colors.neutral[300]
  },
  shareButtonText: {
    ...Typography.button,
    color: '#FFFFFF'
  },
  
  // Filters
  filtersContainer: {
    flexDirection: 'row',
    gap: Spacing.sm
  },
  filterChip: {
    backgroundColor: Colors.neutral[200],
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md
  },
  filterChipSelected: {
    backgroundColor: Colors.primary[500]
  },
  filterText: {
    ...Typography.caption,
    color: Colors.neutral[700],
    fontWeight: '600'
  },
  filterTextSelected: {
    color: '#FFFFFF'
  },
  
  // Posts
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md
  },
  postMeta: {
    flex: 1
  },
  postUser: {
    ...Typography.button,
    color: Colors.neutral[800]
  },
  postTime: {
    ...Typography.caption,
    color: Colors.neutral[500]
  },
  postTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs
  },
  tag: {
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius.sm,
    paddingVertical: 2,
    paddingHorizontal: Spacing.xs
  },
  tagText: {
    ...Typography.caption,
    color: Colors.neutral[600]
  },
  postContent: {
    ...Typography.body,
    color: Colors.neutral[700],
    lineHeight: 24,
    marginBottom: Spacing.lg
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
    paddingTop: Spacing.md
  },
  reactionButton: {
    alignItems: 'center',
    flex: 1
  },
  reactionIcon: {
    fontSize: 20,
    marginBottom: Spacing.xs
  },
  reactionCount: {
    ...Typography.caption,
    color: Colors.neutral[800],
    fontWeight: '600'
  },
  reactionLabel: {
    ...Typography.caption,
    color: Colors.neutral[600]
  },
  
  // Guidelines
  guidelinesCard: {
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary[500]
  },
  guidelinesTitle: {
    ...Typography.button,
    color: Colors.primary[800],
    marginBottom: Spacing.sm
  },
  guidelinesText: {
    ...Typography.bodySmall,
    color: Colors.primary[700],
    lineHeight: 20
  }
});