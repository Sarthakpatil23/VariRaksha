# VariRaksha — Cross-Platform (App + Web + Supabase) Architecture Specification

## 1. Objective

Build a unified emergency safety ecosystem for the Pandharpur Wari pilgrimage by connecting an **Expo React Native mobile application** and a **Next.js web application** to a single **Supabase backend**.

The mobile app and web application act as two purpose-built interfaces into the same underlying data:
- **Mobile Client:** Native-first emergency SOS, offline SQLite caching, simulated BLE mesh communication, GPS tracking, and push notifications.
- **Web Client:** Universal QR-based emergency card viewer (`/p/[id]`), real-time responder and volunteer triage dashboard (`/dashboard`), and administrative monitoring.
- **Supabase Backend:** PostgreSQL database, Phone/OTP Authentication, Row Level Security (RLS), and Realtime WebSocket subscriptions for instant synchronization.

---

## 2. System Architecture & Repository Layout

### Repository Structure
A multi-folder workspace structure within a single repository keeps shared contracts and deployments organized:

```text
variraksha/
├── app/                        # Mobile: Expo React Native application
│   ├── components/             # Mobile UI components (Chatbot, VoiceBlob, Cards)
│   ├── constants/              # Theme tokens (Saffron, Maroon, Gold, Typography)
│   ├── lib/                    # Supabase client, SQLite helpers, UserStore
│   ├── locales/                # Multi-language translations (en, mr, hi)
│   ├── navigation/             # Role navigators & Deep linking configuration
│   ├── screens/                # Mobile screens (Onboarding, SOS, Dindi, Medical, etc.)
│   └── types/                  # Canonical TypeScript interfaces
├── web/                        # Web: Next.js + Tailwind CSS application
│   ├── src/
│   │   ├── app/                # App Router (/p/[id] emergency card, /dashboard, /sos)
│   │   ├── components/         # Web UI components & Realtime map/radar
│   │   ├── lib/                # Web Supabase client & shared helpers
│   │   └── types/              # Types aligned with backend schemas
├── supabase/                   # Backend: Migrations & Schema definitions
│   └── migrations/             # SQL DDL, RLS policies, triggers, seed data
├── assets/                     # Shared branding, images, and audio assets
├── app.json                    # Expo config (deep linking scheme & app links)
└── package.json                # Mobile dependencies & workspace scripts
```

---

## 3. Canonical Data Models & Role Standards

To prevent naming divergences between PostgreSQL, Mobile, and Web, all systems adhere to the following **canonical enum and table schemas**:

### Canonical User Roles
```sql
CREATE TYPE user_role AS ENUM ('varkari', 'dindi_leader', 'volunteer', 'medical_staff', 'admin');
```

### PostgreSQL Database Schema
```sql
-- 1. Profiles (Pilgrims, Leaders, Volunteers, Medical Staff)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    mobile_number TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'varkari',
    preferred_language TEXT NOT NULL DEFAULT 'mr', -- 'mr', 'hi', 'en'
    emergency_card_id TEXT UNIQUE NOT NULL,        -- Alphanumeric public QR ID
    dindi_group_id UUID REFERENCES dindi_groups(id) ON DELETE SET NULL,
    age INT,
    gender TEXT,
    avatar_url TEXT,
    is_onboarded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Medical Profiles (Linked to Pilgrim)
CREATE TABLE medical_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    blood_group TEXT NOT NULL,                     -- e.g. 'B+', 'O+', 'A+'
    allergies TEXT[] DEFAULT '{}',
    chronic_conditions TEXT[] DEFAULT '{}',
    current_medications TEXT[] DEFAULT '{}',
    organ_donor BOOLEAN DEFAULT FALSE,
    critical_notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Emergency Contacts
CREATE TABLE emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE
);

-- 4. Dindi Groups (Pilgrim groups marching together)
CREATE TABLE dindi_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,                            -- e.g. 'Dindi #12 - Sant Tukaram'
    leader_id UUID REFERENCES profiles(id),
    leader_phone TEXT NOT NULL,
    route_sector TEXT NOT NULL,                    -- e.g. 'Wakhari -> Phaltan'
    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,
    total_members INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SOS & Emergency Events (Realtime Triggered)
CREATE TABLE sos_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pilgrim_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    dindi_group_id UUID REFERENCES dindi_groups(id),
    status TEXT NOT NULL DEFAULT 'active',         -- 'active', 'acknowledged', 'resolved'
    severity TEXT NOT NULL DEFAULT 'critical',     -- 'critical', 'moderate', 'info'
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    location_name TEXT,
    trigger_type TEXT NOT NULL,                    -- 'button_press', 'qr_scan', 'medical_triage'
    responder_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 6. Broadcast Announcements (Leader to Dindi Members)
CREATE TABLE broadcast_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dindi_group_id UUID NOT NULL REFERENCES dindi_groups(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id),
    message TEXT NOT NULL,
    is_urgent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Universal QR Entry & Deep Linking Flow

### Universal HTTPS Link Format
All printed badges, wristbands, and stickers embed universal HTTPS URLs:
```text
https://<variraksha-domain>/p/<emergency_card_id>
```

### Routing Decision Flow
```text
                  [User Scans QR Code]
                           │
                           ▼
              https://<domain>/p/<id>
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
     [App Installed?]            [App Not Installed]
             │                           │
    (iOS Universal Links /               │
     Android App Links)                  │
             │                           │
             ▼                           ▼
    Opens Mobile App             Opens Next.js Web
   Navigates to Medical Card    Displays Instant Emergency Card
   (Authenticated Context)      (Public Read via Supabase RLS)
```

1. **Public Emergency Web Card (`/p/[id]`):**
   - Instant loading with zero app install required.
   - Shows pilgrim photo, blood group, allergies, critical medications, and emergency contacts.
   - Includes **"One-Tap Call Leader"** and **"Trigger Responder Alert"** buttons.
2. **Mobile Universal Linking Configuration:**
   - Scheme: `variraksha://`
   - Associated Domains: `applinks:<variraksha-domain>`
   - Path Prefix: `/p/` -> maps to `MedicalIDScreen` in the mobile navigator.

---

## 5. Supabase Realtime Synchronization Architecture

```text
  [ Mobile Pilgrim App ]                     [ Next.js Web Dashboard ]
           │                                            │
           │ (1) User holds SOS button (2s)             │
           ▼                                            │
  [ Insert into `sos_events` ]                          │
           │                                            │
           ▼                                            │
  [ Supabase Realtime Engine ] ─────────────────────────┼──► (2) Instant Live Alert on Map & Radar
           │                                            │    (Plays alarm sound & shows location)
           │                                            │
           │ (4) Receives acknowledgement update ◄──────┼─── (3) Responder clicks "Acknowledge"
           ▼                                                 or "Dispatch Ambulance"
  [ Mobile Status: "Help is on the way!" ]
```

- **Row Level Security (RLS):**
  - `profiles` & `medical_profiles`: Public read allowed for specific `emergency_card_id` lookups. Writes restricted to authenticated user.
  - `sos_events`: Authenticated users can insert; volunteers/leaders/staff can update status. Realtime enabled on `INSERT` and `UPDATE`.

---

## 6. Offline Storage & Native Capabilities Strategy

### 1. SQLite Local Caching (Mobile)
- When a pilgrim logs in or completes onboarding, their profile, medical details, emergency contacts, and active Dindi route are stored in local SQLite (`variraksha.db`).
- If network connection drops completely, the Mobile Medical Card and Emergency ID remain 100% functional locally.

### 2. BLE Mesh Communication
- **Architecture Standard:** UI-simulated mesh relay layer with native haptics/audio and optimistic local queuing for hackathon demonstrations.
- If connectivity is restored, queued broadcast packets and SOS statuses synchronize automatically with Supabase.

---

## 7. Hackathon Implementation Roadmap

```text
Phase 1: Canonical Database & Supabase Setup
  ├── Write SQL Migration script in supabase/migrations/
  ├── Configure RLS policies (public QR read, authenticated writes)
  └── Seed realistic Pandharpur Wari sample data (Pilgrims, Dindis, Medical Profiles)

Phase 2: Next.js Web Client Scaffold (/web)
  ├── Setup Next.js 14/15 App Router with Tailwind CSS & Lucide Icons
  ├── Implement Public QR Emergency Card: /p/[id]
  ├── Implement Realtime Responder / Dindi Leader Dashboard: /dashboard
  └── Wire Supabase Realtime listener for instant SOS alert notifications

Phase 3: Mobile App Backend Integration
  ├── Update app/lib/supabaseClient.ts with environment variables
  ├── Bind Onboarding & OTP verification to Supabase Auth & Profile Store
  ├── Connect HomeSOSScreen 2-second hold trigger to `sos_events` table insert
  ├── Subscribe Mobile app to Realtime alerts & Dindi broadcasts
  └── Implement offline SQLite caching in app/lib/sqlite.ts

Phase 4: Deep Linking & End-to-End Demo Polish
  ├── Configure app.json scheme & linking in RootNavigator
  ├── Test QR scan flow on desktop, mobile web, and mobile app
  └── Validate end-to-end realtime loop (Mobile SOS -> Web Dashboard -> Web Resolution -> Mobile Status Update)
```

---

## 8. Summary of Architectural Decisions

1. **Web:** Next.js application inside `/web` directory for optimal dashboard performance, responsive layouts, and universal QR scan landings.
2. **Mobile:** Preserves existing React Native + Expo codebase, elevating mock states to live Supabase backend operations.
3. **Backend:** Shared PostgreSQL database on Supabase with single-source-of-truth tables and Realtime WebSocket triggers.
4. **QR System:** Universal HTTPS URLs with deep link fallbacks.
