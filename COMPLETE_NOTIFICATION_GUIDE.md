# Complete Notification Guide - ScalpelDiary

## Overview
ScalpelDiary has two types of notifications:
1. **Push Notifications** - Sent to phone/device (requires permission)
2. **In-App Notifications** - Shown in notification bell icon and popup

---

## 👨‍🎓 RESIDENTS

### Push Notifications (Scheduled - Automatic)

#### 1. Morning Activities (7:00 AM EAT / 4:00 AM UTC)
**Sent Daily**
- 🏥 Today's activities (if assigned)
- **Example**: "🌅 Good Morning! Today's Activities\n🏥 Activities Today: OPD, OR"

#### 2. Next Day Duty Alert (8:00 PM EAT / 5:00 PM UTC)
**Sent Day Before**
- 📋 Tomorrow's duty assignments
- **Example**: "📋 Duty Alert: Tomorrow\nYou are on duty tomorrow: EOPD, ICU"

#### 3. Next Month Rotation Reminder (8:00 PM EAT / 5:00 PM UTC)
**Sent Last Day of Month**
- 📅 Next month's rotation
- **Example**: "📅 Next Month's Rotation\nYour rotation for August: Cardiothoracic"

### In-App Notifications (Event-Based)

#### 1. 🟢 Presentation Assignment (GREEN)
**When**: Chief Resident or Supervisor assigns a presentation
**Shows**: 
- Notification bell icon (with count badge)
- Notification popup on login
- Notification dropdown
**Message**: "You have been assigned a new presentation: [Title]"
**Action Button**: None (informational)

#### 2. 🟣 Procedure Rated (PURPLE)
**When**: Supervisor rates/comments on their procedure
**Shows**: 
- Notification bell icon (with count badge)
- Notification popup on login
- Notification dropdown
**Message**: "Your surgical log has been rated/commented on"
**Action Button**: None (informational)

#### 3. 🟣 Presentation Rated (PURPLE)
**When**: Supervisor rates/comments on their presentation
**Shows**: 
- Notification bell icon (with count badge)
- Notification popup on login
- Notification dropdown
**Message**: "Your presentation '[Title]' has been rated/commented on"
**Action Button**: None (informational)

#### 4. 🔵 Procedure to Rate (BLUE) - Year 2+ Only
**When**: Junior resident assigns them as supervisor on a procedure
**Shows**: 
- Notification bell icon (with count badge)
- Notification popup on login
- Notification dropdown
**Message**: "New surgical log assigned to you by [email]"
**Action Button**: "Rate Procedure" (navigates to rating page)

---

## 👨‍⚕️ SUPERVISORS

### Push Notifications (Event-Based)

#### 1. New Procedure to Rate
**When**: Resident submits a procedure and assigns them as supervisor
**Message**: "New surgical log assigned to you by [email]"
**Sent**: Immediately when procedure is submitted

#### 2. New Presentation to Rate
**When**: Resident marks presentation as "presented" and they are the moderator
**Message**: "Resident has submitted presentation: [Title]"
**Sent**: Immediately when presentation is marked as presented

### In-App Notifications (Event-Based)

#### 1. 🔵 Procedure to Rate (BLUE)
**When**: Resident submits a procedure and assigns them as supervisor
**Shows**: 
- Notification bell icon (with count badge)
- Notification popup on login
- Notification dropdown
**Message**: "New surgical log assigned to you by [email]"
**Action Button**: "Rate Procedure" (navigates to unresponded logs page)

#### 2. 🟢 Presentation to Rate (GREEN)
**When**: Resident marks presentation as "presented" and they are the moderator
**Shows**: 
- Notification bell icon (with count badge)
- Notification popup on login
- Notification dropdown
**Message**: "Resident has submitted presentation: [Title]"
**Action Button**: "Rate Presentation" (navigates to unresponded logs page)

---

## 📊 Notification Features

### Notification Bell Icon (Header)
- **Location**: Top right of header (next to profile picture)
- **Badge**: Red circle with unread count (shows "9+" for 10+)
- **Click**: Opens dropdown with all notifications
- **Available For**: Residents and Supervisors only

### Notification Dropdown
- **Shows**: All notifications (read and unread)
- **Features**:
  - Color-coded by type
  - Icons for each type
  - Timestamp
  - Action buttons for actionable notifications
  - Individual dismiss buttons
  - "Mark all as read" button
- **Auto-close**: Clicks outside dropdown

### Notification Popup (On Login)
- **Shows**: Only unread notifications
- **Appears**: Automatically when user opens app
- **Features**:
  - Beautiful gradient header
  - Color-coded notifications
  - Action buttons
  - Individual dismiss
  - "Mark all as read"
  - Close button

### Color Coding System

| Color | Type | Icon | For |
|-------|------|------|-----|
| 🔵 **BLUE** | Procedures to Rate | Activity | Supervisors & Year 2+ Residents |
| 🟢 **GREEN** | Presentations | FileText | Residents (assigned) & Supervisors (to rate) |
| 🟣 **PURPLE** | Rated Items | Star | Residents (when their work is rated) |
| 🟠 **ORANGE** | Duty Reminders | Calendar | Future Feature |
| 🟡 **YELLOW** | Activity Reminders | Activity | Future Feature |

---

## 🔔 Push Notification Setup

### Requirements:
1. User must enable push notifications in browser/app
2. User must grant permission when prompted
3. Service worker must be registered
4. VAPID keys must be configured on server

### How to Enable:
1. Open ScalpelDiary
2. Click "Enable Notifications" prompt
3. Allow notifications in browser
4. Done! Will receive push notifications

### Notification Times (East Africa Time):
- **7:00 AM** - Morning activities
- **8:00 PM** - Next day duty alert
- **8:00 PM** - Next month rotation reminder (last day of month only)

---

## 📱 User Experience Flow

### For Residents:

**Morning (7:00 AM)**
1. Receive push notification with today's activities
2. Open app
3. See activities on dashboard
4. Plan your day

**Evening (8:00 PM)**
1. Receive push notification with tomorrow's duty
2. Prepare for duty
3. Check duty details on dashboard

**Last Day of Month (8:00 PM)**
1. Receive push notification with next month's rotation
2. Prepare for rotation change
3. Review rotation schedule

**When Presentation Assigned**
1. Receive push notification
2. See green notification in bell icon
3. Open app → notification popup appears
4. View presentation details
5. Dismiss notification

**When Work is Rated**
1. Receive push notification
2. See purple notification in bell icon
3. Open app → notification popup appears
4. View rating/comment
5. Dismiss notification

### For Supervisors:

**When Procedure Submitted**
1. Receive push notification
2. See blue notification in bell icon
3. Open app → notification popup appears
4. Click "Rate Procedure" button
5. Navigate to rating page
6. Rate the procedure
7. Notification marked as read

**When Presentation Submitted**
1. Receive push notification
2. See green notification in bell icon
3. Open app → notification popup appears
4. Click "Rate Presentation" button
5. Navigate to rating page
6. Rate the presentation
7. Notification marked as read

---

## 🎯 Summary Table

### Residents Receive:

| Notification | Type | Color | When | Action |
|-------------|------|-------|------|--------|
| Morning Activities | Push | - | Daily 7 AM | View activities |
| Duty Alert | Push | - | Daily 8 PM | Prepare for duty |
| Rotation Reminder | Push | - | Last day of month 8 PM | Prepare for rotation |
| Presentation Assigned | In-App | 🟢 Green | When assigned | View details |
| Procedure Rated | In-App | 🟣 Purple | When rated | View rating |
| Presentation Rated | In-App | 🟣 Purple | When rated | View rating |
| Procedure to Rate* | In-App | 🔵 Blue | When assigned as supervisor | Rate procedure |

*Year 2+ residents only

### Supervisors Receive:

| Notification | Type | Color | When | Action |
|-------------|------|-------|------|--------|
| Procedure to Rate | Push + In-App | 🔵 Blue | When resident submits | Rate procedure |
| Presentation to Rate | Push + In-App | 🟢 Green | When resident presents | Rate presentation |

---

## 🔧 Technical Notes

### Database:
- Notifications stored in `notifications` table
- `notification_type` column determines color/icon
- `read` boolean tracks read status
- `log_id` links to related procedure/presentation

### Push Notifications:
- Use Web Push API
- Require VAPID keys
- Service worker handles background notifications
- Scheduled via cron jobs (hourly checks)

### In-App Notifications:
- Fetched from database via API
- Real-time count updates
- Persist across sessions
- Can be dismissed individually or all at once

---

## ✅ Current Status

**Implemented:**
- ✅ Push notifications for residents (scheduled)
- ✅ Push notifications for supervisors (event-based)
- ✅ In-app notification bell icon
- ✅ In-app notification dropdown
- ✅ In-app notification popup
- ✅ Color coding system
- ✅ Actionable buttons
- ✅ Read/unread tracking

**Not Yet Implemented:**
- ❌ Orange notifications (duty reminders in-app)
- ❌ Yellow notifications (activity reminders in-app)
- ❌ Scheduled notifications saved to database

**Future Enhancements:**
- Save scheduled push notifications to database
- Add in-app duty/activity reminders
- Notification preferences/settings
- Notification sound/vibration options
- Notification history/archive
