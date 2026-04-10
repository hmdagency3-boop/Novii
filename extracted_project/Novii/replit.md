# Novii - Social Media Platform

## Overview
Novii is an Instagram-inspired social media platform offering a responsive, bilingual (English/Arabic) UI with dark/light themes. Built with React, TypeScript, Express, and PostgreSQL, it provides content sharing, real-time interactions, comprehensive user management, and an admin system. The platform aims to deliver a rich, production-ready social media experience.

## User Preferences
- Language preference stored in localStorage
- Theme preference stored in localStorage via next-themes
- Automatic RTL layout switching for Arabic users
- **CRITICAL DATABASE RULE:** Whenever any code modification requires database changes:
    1. **IMMEDIATELY** generate the SQL code for those changes
    2. Save it in `database/` directory with clear naming
    3. Provide the SQL code without waiting for request
    4. Do NOT delay or skip this step
    5. Format: Well-commented SQL with clear sections

## System Architecture

### Tech Stack
- **Frontend:** React 19 + TypeScript + Vite
- **Backend:** Express.js + TypeScript with Supabase JavaScript client
- **Database:** Supabase PostgreSQL
- **Styling:** Tailwind CSS 4 with custom design system
- **UI Components:** Radix UI primitives
- **Routing:** Wouter
- **State Management:** TanStack Query
- **Authentication:** Supabase Auth (email/password, Google OAuth)

### Key Features
- **Core Social Functionality:** Social media feed, stories, reels, explore page, messaging, notifications.
- **User Management:** Profiles, settings, and device tracking.
- **Admin Dashboard:** Platform control, user management, and statistics.
- **Internationalization:** Full bilingual support (English/Arabic) with RTL layout.
- **Theming:** Dark and light modes.
- **Responsive Design:** Optimized for desktop and mobile.
- **Advanced Post Controls:** Pinning, hiding likes, comment control, insights, deletion.
- **Search & Explore:** User and content discovery.
- **Robust Interactions:** Like functionality with optimistic UI, enhanced comment cards with nested replies.
- **Visitor Detection:** Device signature-based tracking.
- **Badge System:** Gold, Silver, Bronze Early Member, and Beta Tester badges.
- **Username Validation:** Strict validation with real-time feedback, reserved names, and blacklist filtering.
- **Communities Feature:** Group messaging with real-time updates via Supabase subscriptions, creation, membership management, invite codes, moderation (mute, kick, promote/demote admin), and kick prevention.
- **Invite Codes:** Unique 8-character codes for community access; owner can view and regenerate.
- **Advanced Create Page:** Dedicated content creation interface for Posts, Stories, or Reels with drag-and-drop, media preview, and detailed forms.
- **Professional Suggestions Sidebar:** Enhanced desktop recommendations with follow status tracking.
- **Real-time Profile Updates:** Immediate UI updates upon profile changes.

### UI/UX Decisions
- Instagram-inspired aesthetic with custom design system, smooth animations, and transitions.
- Mobile-first responsive design.
- Enhanced post card design with hover effects and animated action buttons.
- Distinct mobile and desktop reel viewers.
- Comment cards with distinct styling and interactive elements.
- Bilingual welcome banners and full RTL alignment for Arabic content.
- Mobile comments utilize a full-height bottom sheet.
- Animated glowing badges integrated into profile displays.
- Cleaned up feed layout with enhanced story bar, clean posts feed, empty state design, and loading skeletons.
- Dynamic mobile header based on page location.
- Verified and Official badges displayed in headers and profile cards.

### System Design Choices
- Unified development server for frontend and backend.
- API routes prefixed with `/api`.
- Comprehensive PostgreSQL database schema with RLS, triggers, and performance indexes.
- Admin role and banning capabilities.
- Database migrations for new features.
- Visitor detection via backend endpoint `POST /api/devices/check-visitor`.
- Efficient data management with `currentUser.id` in React Query keys.

## External Dependencies
- **Supabase:** PostgreSQL database, authentication, and real-time features.
- **Vite:** Frontend build tool and development server.
- **Tailwind CSS:** Utility-first CSS framework.
- **Radix UI:** Headless UI component library.
- **Wouter:** Lightweight React router.
- **TanStack Query:** Data fetching and state management.
- **Drizzle ORM:** TypeScript ORM for PostgreSQL.

## 🗑️ MESSAGE MODERATION SYSTEM (Nov 25, 2025)

### Soft Delete Implementation:
- ✅ **Soft Delete Messages** - Admins can delete messages with permanent audit trail
  - Message shows "تم حذف هذه الرسالة بواسطة الأدمن" / "This message was deleted by an admin"
  - Message stays in database (soft delete - not hard deleted)
  - Records `is_deleted`, `deleted_by`, and `deleted_at` for audit trail
  - Deleted messages show gray background with trash icon
  - Username hidden for deleted messages
  - No delete button appears for deleted messages
  - **Backend:** `/api/communities/:id/messages/:messageId` (DELETE) → Updates `is_deleted=true`
  - **Frontend:** Checks `msg.is_deleted` and shows replacement message
  - **Full Arabic Support:** "تم حذف هذه الرسالة بواسطة الأدمن"

### Complete Message Deletion Features:
- 👁️ **Hover Delete Button** - Admin sees trash icon on hover
- 🔴 **Admin Only** - Regular members cannot delete messages
- ✨ **Instant Update** - Message changes to deleted state immediately
- 📝 **Toast Notification** - "تم حذف الرسالة" / "Message deleted"
- 🌍 **Bilingual** - Full English/العربية support

### Community Management Features (Nov 25, 2025):
- ✏️ **Edit Community Info** - Owner can update name, description, and avatar
  - **Edit Button** - Appears in header only for community owner
  - **Modal Interface** - Clean form with image preview
  - **Image Upload** - Support for community avatar via Supabase Storage bucket `avatars` (path: `community/{userId}/{timestamp}.ext`)
  - **Backend Endpoint:** `PATCH /api/communities/:id` → Updates community info
  - **API Functions:** `uploadCommunityAvatar()` and `updateCommunity()`
  - **Full Arabic Support:** ثنائي اللغة كامل
  - **⚡ Instant UI Update:** Cache updated immediately after save - no waiting for server
  - **🔄 Real-time Sync:** Changes broadcast to all members via Supabase real-time subscriptions
- 👥 **Owner-Only Access** - Edit button only visible to community creator
- 💾 **Instant Updates** - Changes reflected immediately in your UI + broadcast to members
- 🖼️ **Image Management** - Upload and replace community avatars (stored in public Supabase storage)
- 📡 **Live Sync** - All members see updates instantly via real-time subscriptions

### 🎨 Image Crop Feature (Nov 25, 2025):
- ✂️ **Interactive Image Cropping** - User can crop image before uploading
  - **Crop Modal** - Beautiful UI for selecting desired image area
  - **Zoom Control** - Slider to zoom in/out (1x to 3x)
  - **Preview** - Grid overlay for precise cropping
  - **Round Crop Shape** - Optimized for circular community avatars
  - **Canvas Processing** - Server-side canvas rendering to blob
  - **JPEG Optimization** - 90% quality compression for file size optimization
- 📐 **Aspect Ratio** - 1:1 (square) for circular avatars
- 🔄 **Smooth Workflow** - Select → Crop → Edit → Save
- 🌍 **Full Arabic/English Support** - قص الصورة / Crop Image

### 📸 Avatar Display Fix (Nov 25, 2025):
- ✅ **Communities List** - Avatars now display correctly using Avatar component
- ✅ **Community Chat Header** - Avatars now display correctly using Avatar component
- 🎯 **Fallback Support** - If no avatar, shows first letter of community name
- 🔄 **Real-time Updates** - Changes visible immediately in UI and broadcast to members

### 🏅 Verified & Official Badges in Chat (Nov 25, 2025):
- ✅ **Badge Display** - Verified (✓ blue) and Official (🛡️ purple) badges appear next to usernames in community messages
- 📍 **Position** - Badges display inline with username for clean, compact display - **Same as Private Chat**
- 🎯 **Visual Indicators** - Uses VerifiedBadge & OfficialBadge components for consistent styling
- 💬 **Bilingual Support** - Arabic labels: "موثق" (Verified), "رسمي" (Official)
- 📊 **Data Source** - Pulls from user profile `is_verified` and `is_official` fields
- 🔄 **Real-time Sync** - Badge status updates via real-time subscriptions when user profile changes
- ⚡ **Instant Recognition** - Users can instantly identify verified and official accounts in chat
- 🎨 **Consistent Design** - Matches the exact badge design used in private chat conversations
- 🌈 **Username Gradient** - Verified users get special gradient color (purple→pink animation) on their username
- ✨ **Animated Effect** - Gradient shifts smoothly for verified accounts, same as private chat display

### 🏆 Community Owner Official Badge Display (Nov 25, 2025):
- ✅ **Badge on Community Name** - If community owner has Official badge, it displays next to community name in chat header
- 📍 **Position** - Badge displays inline with community name, properly positioned for RTL/LTR
- ✅ **Badge in Communities List** - Official badge also appears in the communities sidebar list
- 🎯 **Smart Detection** - Automatically pulls `creator_is_official` status from community creator's profile
- 💬 **Bilingual Support** - Full Arabic/English support with proper text direction
- 🔄 **Real-time Updates** - Badge status updates when creator profile changes
- 🔗 **API Integration** - Backend returns `creator_is_official` field in communities list
- 🌍 **Responsive Layout** - Works correctly in RTL (Arabic) and LTR (English) modes

### ℹ️ Community Info Modal (Nov 25, 2025):
- ✅ **Unified Info Button** - Info button in community chat header
- 📱 **Community Information Tab:**
  - Community name with Official badge
  - Community avatar (centered display)
  - Member count
  - Community description (if available)
  - **Invite Code Display:**
    - Full invite code visible
    - Copy button to clipboard
    - Toast notification "Code copied!" (bilingual)
  - **Edit Button** - Only visible to community owner
    - Seamlessly switches to edit modal
- 👥 **Members Tab:**
  - Active members list with member count
  - Admin badges (Crown icon for admins)
  - Mute status indicator
  - Clean list UI with hover effects
- 🎨 **Design:**
  - Modal interface with tabs (Info / Members)
  - Tab-based navigation for organized layout
  - ScrollArea for long member lists
  - Consistent styling with platform design
- 💬 **Bilingual:** Full Arabic/English support with RTL/LTR layout
- 🔗 **Integration:** Uses existing `currentCommunity`, `communityMembers` data
- ⚡ **Performance:** No additional API calls (uses cached data)

### 👑 Premium Community Theme (Nov 25, 2025):
- ✨ **Verified/Official Communities** - Special theme for communities with official creators
- 🎨 **Header Styling:**
  - Gradient background (purple-900 → purple-800 → amber-700)
  - Purple glow shadow effect for elevated appearance
  - Dynamic color transition with smooth animations
  - Professional, luxurious appearance
- 📝 **Community Name:**
  - Animated gradient text (purple → pink → amber)
  - Pulsing animation for attention
  - Shows authority and prestige
- 💬 **Messages Area:**
  - Gradient background (purple-950 fade effect)
  - Creates immersive, premium chat experience
  - Maintains readability with dark theme
- 💭 **Message Bubbles:**
  - Purple glow shadow effect on received messages
  - Ring border with purple tint (ring-purple-500/20)
  - Hover effects enhance interactivity
  - Creates premium feel throughout chat
- 🎯 **Smart Detection:**
  - Automatically activates when `creator_is_official === true`
  - Uses `currentCommunity?.creator_is_official` to determine theme
  - No manual configuration needed
- 🌍 **Bilingual:** Fully supports Arabic and English RTL/LTR layouts
- ⚡ **Performance:** Zero overhead - uses CSS transitions and shadows
- 🔄 **Real-time:** Theme updates instantly when creator status changes

### 📋 Premium Communities List (Nov 25, 2025):
- 🎨 **Special Styling in Sidebar:** Official communities highlighted with premium appearance
- **Background Gradient:**
  - Subtle gradient (purple-900 → amber-900) with 5% opacity
  - Purple glow shadow effect on cards
  - Ring border with purple tint (ring-purple-500/10)
- **Active State:**
  - Brighter gradient (purple-500/20 → amber-500/20) when selected
  - Enhanced purple glow shadow (shadow-purple-500/20)
  - Ring-1 with purple-500/30 for emphasis
- **Avatar:**
  - Ring-2 border with purple tint (ring-purple-500/40)
  - Shadow glow effect (shadow-purple-500/20)
  - Gradient fallback (purple-600 → amber-600) for official communities
- **Community Name:**
  - Animated gradient text (purple → pink → amber) with text-transparent
  - bg-clip-text for smooth gradient display
  - Smooth transitions on hover
- **Hover Effects:**
  - Dynamic gradient hover (purple-500/10 → amber-500/10)
  - Smooth transitions for all states
- ✅ **Differentiation:** Official communities stand out immediately from regular ones
- 💬 **Bilingual:** Full RTL/LTR support in community lists
- ⚡ **Performance:** CSS-only styling with no API overhead

### 🌟 Official User Distinctive Bubble & Box in Community Chat (Nov 25, 2025)
- ✨ **Distinctive Username Box:** Official members' usernames now appear in a highlighted box
  - **Background:** Purple-to-pink gradient (purple-600/30 → pink-600/30)
  - **Border:** Ring with purple tint (ring-purple-500/50)
  - **Shadow:** Glowing shadow effect (shadow-purple-500/20)
  - **Text:** Bold username for extra emphasis
- 💬 **Distinctive Message Bubble:** Official users' messages have premium styling
  - **Background:** Multi-layer gradient (purple-600/40 → pink-600/30 → purple-600/40)
  - **Border:** Enhanced ring effect (ring-purple-400/50) with 1.5px thickness
  - **Shadow:** Strong purple glow (shadow-purple-500/40)
  - **Hover State:** Intensified effects (shadow-purple-500/50, ring-purple-400/70)
- 🎯 **Smart Application:** Only applied to official users' messages, not the current user
- 🔄 **Real-time:** Updates instantly when user's official status changes
- 💬 **Bilingual:** Full Arabic/English support with proper RTL/LTR handling
- ⚡ **Performance:** Pure CSS styling with no API overhead

### 🐛 Bug Hunter Community - Animated Bug Swarm (Nov 25, 2025)
- 🦟 **Animated Bug Swarm Background:** Exclusive feature for Bug Hunter community
  - **50-150 Animated Bugs** - Individual bugs rendered with canvas animation
  - **Realistic Bug Design:**
    - Oval-shaped body with 3D perspective
    - Detailed head with eyes
    - Antennae with curve animation
    - 6 animated legs (3 on each side)
    - Orange glowing eyes for visibility
  - **Movement Physics:**
    - Random walking behavior with velocity and acceleration
    - Realistic bouncing off edges with damping
    - Smooth rotation based on movement direction
  - **Text Formation Feature:**
    - Every 300 animation frames, bugs gather to form "Bug Hunter" text
    - Smart target calculation - bugs follow waypoints to spell text
    - Fluid transition between scattered and formed states
    - Bugs scatter randomly when not forming text
- 🎨 **Visual Effects:**
  - Canvas-based rendering for smooth performance
  - Screen blend mode for natural integration with background
  - 60% opacity overlay for message readability
  - Dark semi-transparent background (black/80) for contrast
- 🎯 **Smart Activation:**
  - Only appears in Bug Hunter community (by name detection)
  - Other communities show default styling
  - Automatic detection of community name
  - Zero impact on other community chats
- ⚡ **Performance:**
  - Efficient canvas rendering with 60 FPS target
  - Responsive canvas resizing on window changes
  - Cleanup on component unmount
  - No memory leaks with proper animation frame cancellation
- 🌍 **Bilingual Compatible:** Works perfectly with both Arabic (RTL) and English (LTR) layouts
- 🔧 **Implementation:**
  - New component: `BugSwarmAnimation` in `client/src/components/bug-swarm-animation.tsx`
  - Integrated into messages page community chat area
  - Canvas-based rendering for optimal performance
  - Condition: Shows only when `currentCommunity?.name === "Bug Hunter"`
