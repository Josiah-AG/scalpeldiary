# Resident Notification Schedule Guide

## Overview

Residents receive automated push notifications at specific times to keep them informed about their duties, activities, and rotations.

---

## 📋 Notification Types & Timing

### 1. **DUTY ALERT (Previous Day at 5:00 PM UTC / 8:00 PM EAT)**

**When:** Every day at 5:00 PM UTC (8:00 PM East Africa Time)

**Purpose:** Notify residents about duties scheduled for the NEXT day

**Example Notification:**
```
Title: 📋 Duty Alert: Tomorrow

Message:
You have Duty tomorrow EOPD role
```

Or if multiple duties:
```
Title: 📋 Duty Alert: Tomorrow

Message:
You have Duty tomorrow EOPD, Senior, Consultation role
```

**What's Included:**
- Duty category names (EOPD, Senior, Consultation, etc.)
- Simple, clear format

**Note:** Only sent if the resident has duties scheduled for the next day

---

### 2. **MORNING SCHEDULE (4:00 AM UTC / 7:00 AM EAT)**

**When:** Every day at 4:00 AM UTC (7:00 AM East Africa Time)

**Purpose:** Morning briefing about today's activities and current rotation

**Example Notification:**
```
Title: 🌅 Good Morning! Your Schedule

Message:
🏥 Activities Today: Grand Rounds, Clinic
🔄 Current Rotation: General Surgery
```

**What's Included:**
- Activities scheduled for today
- Current month's rotation assignment

**Note:** Only sent if the resident has activities scheduled or is in an active rotation

---

### 3. **MONTHLY ROTATION REMINDER (Last Day of Month at 8:00 PM UTC / 11:00 PM EAT)**

**When:** Last day of each month at 8:00 PM UTC (11:00 PM East Africa Time)

**Purpose:** Remind residents about their rotation for the upcoming month

**Example Notification:**
```
Title: 📅 Upcoming Rotation Reminder

Message:
Your rotation for April is: Cardiothoracic Surgery. Get ready!
```

**What's Included:**
- Next month's rotation assignment
- Encouragement to prepare

**Note:** Only sent on the last day of the month if the resident has a rotation assigned for next month

---

## 📅 Complete Daily Schedule

### For East Africa Time (EAT - UTC+3):

| Time (EAT) | Time (UTC) | Notification Type | Content |
|------------|------------|-------------------|---------|
| **7:00 AM** | 4:00 AM | Morning Schedule | Activities for today + Current rotation |
| **8:00 PM** | 5:00 PM | Duty Alert | Duties scheduled for tomorrow |
| **11:00 PM** (last day of month) | 8:00 PM | Monthly Rotation | Next month's rotation |

---

## 🔔 Example: A Resident's Day

### **Wednesday, March 5, 2026**

**7:00 AM (Morning):**
```
🌅 Good Morning! Your Schedule

🏥 Activities Today: Morning Rounds, Outpatient Clinic
🔄 Current Rotation: Orthopedic Surgery
```

**8:00 PM (Evening):**
```
📋 Duty Alert: Tomorrow

You have Duty tomorrow EOPD role
```

### **Thursday, March 6, 2026**

**7:00 AM (Morning):**
```
🌅 Good Morning! Your Schedule

🏥 Activities Today: Grand Rounds
🔄 Current Rotation: Orthopedic Surgery
```

**8:00 PM (Evening):**
- No notification (no duty scheduled for Friday)

### **Monday, March 31, 2026 (Last Day of Month)**

**7:00 AM (Morning):**
```
🌅 Good Morning! Your Schedule

🏥 Activities Today: Case Presentation
🔄 Current Rotation: Orthopedic Surgery
```

**8:00 PM (Evening):**
```
📋 Duty Alert: Tomorrow

You have Duty tomorrow Senior, Consultation role
```

**11:00 PM (End of Month):**
```
📅 Upcoming Rotation Reminder

Your rotation for April is: Neurosurgery. Get ready!
```

---

## ✅ Requirements

To receive notifications, residents must:

1. ✅ Enable push notifications when prompted in the app
2. ✅ Have the app installed (as PWA or accessed via browser)
3. ✅ Have duties, activities, or rotations assigned in the system
4. ✅ Keep the device connected to the internet

---

## 🎯 Benefits

### For Duty Alerts (Previous Day):
- **Advance notice** - Know the night before if you have duty
- **Better preparation** - Time to arrange personal matters
- **Reduced surprises** - No last-minute scrambling

### For Morning Schedule:
- **Daily briefing** - Start the day informed
- **Activity awareness** - Know what's on your schedule
- **Rotation reminder** - Stay aware of your current assignment

### For Monthly Rotation:
- **Advance planning** - Prepare for next month's rotation
- **Mental preparation** - Get ready for rotation changes
- **Study time** - Review relevant material before rotation starts

---

## 🔧 Technical Details

- **Timezone:** All times are calculated in UTC and converted to local time
- **Frequency:** Scheduler checks every hour
- **Delivery:** Push notifications to all registered devices
- **Reliability:** Automatic retry on failure
- **Privacy:** Only the resident receives their own schedule

---

## 📱 Device Support

Notifications work on:
- ✅ Android phones (Chrome, Firefox)
- ✅ iOS 16.4+ (Safari)
- ✅ Desktop browsers (Chrome, Edge, Firefox)
- ✅ Installed PWA apps

---

## 🚀 Deployment Status

✅ Notification system is live and running
✅ Scheduler starts automatically with server
✅ Runs 24/7 on Railway backend
✅ No manual intervention required
