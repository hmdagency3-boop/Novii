import { pgTable, text, uuid, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Profiles table (extends Supabase auth.users)
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  username: text("username").notNull().unique(),
  fullName: text("full_name"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  coverUrl: text("cover_url"),
  website: text("website"),
  location: text("location"),
  gender: text("gender"), // 'male' | 'female' | 'other'
  isVerified: boolean("is_verified").default(false),
  isPrivate: boolean("is_private").default(false),
  followersCount: integer("followers_count").default(0),
  followingCount: integer("following_count").default(0),
  postsCount: integer("posts_count").default(0),
  role: text("role").default("user"), // 'user' | 'admin'
  isBanned: boolean("is_banned").default(false),
  bannedReason: text("banned_reason"),
  banUntil: timestamp("ban_until"), // null = permanent ban
  // Official & Badge Status
  isOfficial: boolean("is_official").default(false),
  isCreator: boolean("is_creator").default(false),
  isPremium: boolean("is_premium").default(false),
  isPopular: boolean("is_popular").default(false),
  isActive: boolean("is_active").default(false),
  // Badges/Medals
  isGoldEarlyMember: boolean("is_gold_early_member").default(false),
  goldEarlyMemberAt: timestamp("gold_early_member_at"),
  isSilverEarlyMember: boolean("is_silver_early_member").default(false),
  silverEarlyMemberAt: timestamp("silver_early_member_at"),
  isBronzeEarlyMember: boolean("is_bronze_early_member").default(false),
  bronzeEarlyMemberAt: timestamp("bronze_early_member_at"),
  isBetaTester: boolean("is_beta_tester").default(false),
  betaTesterAt: timestamp("beta_tester_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Posts table
export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  caption: text("caption"),
  imageUrl: text("image_url"),
  location: text("location"),
  likesCount: integer("likes_count").default(0),
  commentsCount: integer("comments_count").default(0),
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Comments table
export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  gifUrl: text("gif_url"), // URL of GIF if comment contains one
  likesCount: integer("likes_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Likes table
export const likes = pgTable("likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }),
  commentId: uuid("comment_id").references(() => comments.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Follows table
export const follows = pgTable("follows", {
  id: uuid("id").primaryKey().defaultRandom(),
  followerId: uuid("follower_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  followingId: uuid("following_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Stories table
export const stories = pgTable("stories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  mediaUrl: text("media_url").notNull(),
  mediaType: text("media_type").default("image"),
  viewsCount: integer("views_count").default(0),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Story views table
export const storyViews = pgTable("story_views", {
  id: uuid("id").primaryKey().defaultRandom(),
  storyId: uuid("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  viewedAt: timestamp("viewed_at").defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  senderId: uuid("sender_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  receiverId: uuid("receiver_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  storyId: uuid("story_id").references(() => stories.id, { onDelete: "cascade" }),
  isRead: boolean("is_read").default(false),
  isDeleted: boolean("is_deleted").default(false),
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
  originalContent: text("original_content"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Message reactions table
export const messageReactions = pgTable("message_reactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  messageId: uuid("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  reaction: text("reaction").notNull(), // '❤️', '😂', '😮', '😢', etc
  createdAt: timestamp("created_at").defaultNow(),
});

// Communities table
export const communities = pgTable("communities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  avatarUrl: text("avatar_url"),
  inviteCode: text("invite_code").unique().notNull(), // كود الدعوة السري - unique وملزوم
  createdBy: uuid("created_by").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  membersCount: integer("members_count").default(1),
  isPrivate: boolean("is_private").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Community members table
export const communityMembers = pgTable("community_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  communityId: uuid("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  role: text("role").default("member"), // 'admin', 'moderator', 'member'
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Community messages table
export const communityMessages = pgTable("community_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  communityId: uuid("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  actorId: uuid("actor_id").references(() => profiles.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }),
  commentId: uuid("comment_id").references(() => comments.id, { onDelete: "cascade" }),
  content: text("content"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Saved posts table
export const savedPosts = pgTable("saved_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// User statistics table
export const userStatistics = pgTable("user_statistics", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  totalLikesGiven: integer("total_likes_given").default(0),
  totalCommentsCreated: integer("total_comments_created").default(0),
  totalPostsViewed: integer("total_posts_viewed").default(0),
  totalTimeSpentSeconds: integer("total_time_spent_seconds").default(0),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admins table (منفصل للتحكم في صلاحيات الأدمن)
export const admins = pgTable("admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique().references(() => profiles.id, { onDelete: "cascade" }),
  role: text("role").default("moderator"),
  permissions: text("permissions").default("full"),
  isActive: boolean("is_active").default(true),
  canManageUsers: boolean("can_manage_users").default(false),
  canManageContent: boolean("can_manage_content").default(false),
  canManageAdmins: boolean("can_manage_admins").default(false),
  canManageReports: boolean("can_manage_reports").default(false),
  canViewAnalytics: boolean("can_view_analytics").default(false),
  canManageSettings: boolean("can_manage_settings").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin activity logs table (سجل نشاط الأدمن)
export const adminLogs = pgTable("admin_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminUserId: uuid("admin_user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: uuid("target_id"),
  details: text("details"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Platform settings table (إعدادات المنصة)
export const platformSettings = pgTable("platform_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  value: text("value"),
  updatedBy: uuid("updated_by").references(() => profiles.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Badges catalog table - Contains all available badges
export const badges = pgTable("badges", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(), // 'Gold Early Member', 'Verified User', etc
  description: text("description"), // detailed description
  type: text("type").notNull().unique(), // 'gold_early_member', 'silver_early_member', 'beta_tester', 'verified', 'official', 'premium', 'creator', 'popular', 'active'
  category: text("category").notNull(), // 'medal' | 'verification' | 'status' | 'achievement'
  icon: text("icon"), // icon name or emoji
  color: text("color"), // hex color code
  imageUrl: text("image_url"), // path to medal image
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User badges junction table (many-to-many relationship) - Tracks which badges users have
export const userBadges = pgTable("user_badges", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  badgeId: uuid("badge_id").notNull().references(() => badges.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").default(true), // TRUE = badge is enabled for user
  awardedAt: timestamp("awarded_at").defaultNow(),
});

// Relations
export const profilesRelations = relations(profiles, ({ many, one }) => ({
  posts: many(posts),
  comments: many(comments),
  likes: many(likes),
  followers: many(follows, { relationName: "following" }),
  following: many(follows, { relationName: "follower" }),
  stories: many(stories),
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "receiver" }),
  messageReactions: many(messageReactions),
  notifications: many(notifications),
  savedPosts: many(savedPosts),
  statistics: one(userStatistics),
  admin: one(admins, {
    fields: [profiles.id],
    references: [admins.userId],
  }),
  userBadges: many(userBadges),
  communitiesCreated: many(communities, { relationName: "creator" }),
  communityMembers: many(communityMembers),
  communityMessages: many(communityMessages),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(profiles, {
    fields: [posts.userId],
    references: [profiles.id],
  }),
  comments: many(comments),
  likes: many(likes),
  savedBy: many(savedPosts),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(profiles, {
    fields: [comments.userId],
    references: [profiles.id],
  }),
  likes: many(likes),
}));

export const messageReactionsRelations = relations(messageReactions, ({ one }) => ({
  message: one(messages, {
    fields: [messageReactions.messageId],
    references: [messages.id],
  }),
  user: one(profiles, {
    fields: [messageReactions.userId],
    references: [profiles.id],
  }),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  post: one(posts, {
    fields: [likes.postId],
    references: [posts.id],
  }),
  comment: one(comments, {
    fields: [likes.commentId],
    references: [comments.id],
  }),
  user: one(profiles, {
    fields: [likes.userId],
    references: [profiles.id],
  }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(profiles, {
    fields: [follows.followerId],
    references: [profiles.id],
    relationName: "follower",
  }),
  following: one(profiles, {
    fields: [follows.followingId],
    references: [profiles.id],
    relationName: "following",
  }),
}));

export const storiesRelations = relations(stories, ({ one, many }) => ({
  author: one(profiles, {
    fields: [stories.userId],
    references: [profiles.id],
  }),
  views: many(storyViews),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(profiles, {
    fields: [messages.senderId],
    references: [profiles.id],
    relationName: "sender",
  }),
  receiver: one(profiles, {
    fields: [messages.receiverId],
    references: [profiles.id],
    relationName: "receiver",
  }),
  story: one(stories, {
    fields: [messages.storyId],
    references: [stories.id],
  }),
}));

export const userStatisticsRelations = relations(userStatistics, ({ one }) => ({
  user: one(profiles, {
    fields: [userStatistics.userId],
    references: [profiles.id],
  }),
}));

export const adminsRelations = relations(admins, ({ one }) => ({
  user: one(profiles, {
    fields: [admins.userId],
    references: [profiles.id],
  }),
}));

export const badgesRelations = relations(badges, ({ many }) => ({
  users: many(userBadges),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(profiles, {
    fields: [userBadges.userId],
    references: [profiles.id],
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
}));

export const communitiesRelations = relations(communities, ({ one, many }) => ({
  creator: one(profiles, {
    fields: [communities.createdBy],
    references: [profiles.id],
    relationName: "creator",
  }),
  members: many(communityMembers),
  messages: many(communityMessages),
}));

export const communityMembersRelations = relations(communityMembers, ({ one }) => ({
  community: one(communities, {
    fields: [communityMembers.communityId],
    references: [communities.id],
  }),
  user: one(profiles, {
    fields: [communityMembers.userId],
    references: [profiles.id],
  }),
}));

export const communityMessagesRelations = relations(communityMessages, ({ one }) => ({
  community: one(communities, {
    fields: [communityMessages.communityId],
    references: [communities.id],
  }),
  sender: one(profiles, {
    fields: [communityMessages.senderId],
    references: [profiles.id],
  }),
}));

// User Devices table (Device tracking for security)
export const userDevices = pgTable("user_devices", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  deviceFingerprint: text("device_fingerprint").notNull(),
  ipAddress: text("ip_address").notNull(),
  browser: text("browser"),
  browserVersion: text("browser_version"),
  deviceType: text("device_type"),
  deviceName: text("device_name"),
  deviceModel: text("device_model"),
  osName: text("os_name"),
  osVersion: text("os_version"),
  country: text("country"),
  countryCode: text("country_code"),
  city: text("city"),
  screenResolution: text("screen_resolution"),
  timezone: text("timezone"),
  language: text("language"),
  isTrusted: boolean("is_trusted").default(false),
  status: text("status").default("active"),
  loginCount: integer("login_count").default(1),
  lastLoginIp: text("last_login_ip"),
  sessionToken: text("session_token"),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  firstLoginAt: timestamp("first_login_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userDevicesRelations = relations(userDevices, ({ one }) => ({
  user: one(profiles, {
    fields: [userDevices.userId],
    references: [profiles.id],
  }),
}));
