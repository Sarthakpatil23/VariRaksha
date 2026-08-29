# Variraksha — Web + Mobile Architecture Execution Plan

## 1. Objective

Build a web application alongside the existing React Native mobile application without creating two independent systems.

The mobile app and website should act as two clients of the same backend and data layer. The goal is to keep user data, emergency events, profiles, statuses, and other shared functionality synchronized across both platforms.

The architecture should remain simple enough to implement quickly for the hackathon while being extensible after the event.

---

## 2. Recommended High-Level Architecture

The system should have four major layers:

**Mobile Client**
- Existing React Native + Expo application.
- Handles mobile-specific capabilities such as offline storage, Bluetooth/BLE, GPS, camera/QR scanning, and notifications.
- Continues to be the primary client for functionality that depends on native device capabilities.

**Web Client**
- New Next.js application.
- Provides browser-based access to shared functionality.
- Acts as the fallback when a user scans a QR code without having the mobile application installed.
- Provides dashboards and interfaces that are more convenient on larger screens.

**Backend / Data Layer**
- Supabase as the shared backend platform.
- PostgreSQL as the main database.
- Supabase Auth for authentication.
- Supabase Realtime for live synchronization.
- Supabase Storage / Edge Functions only where required.

**Integration Layer**
- HTTPS-based QR links.
- Deep linking / Universal Links / Android App Links for opening the mobile application when installed.
- Shared identifiers and data contracts between the web and mobile clients.

---

## 3. Core Architectural Principle

There should be **one source of truth** for shared online data.

Avoid maintaining separate databases for the website and mobile app.

The desired flow is:

    React Native App ──┐
                       │
                       ▼
                    Supabase
                       ▲
                       │
    Next.js Website ──┘

Both clients should read and update the same backend data.

This means a change made from one client can be reflected in the other through the backend and realtime synchronization.

---

## 4. Execution Plan

### Phase 1 — Audit the Existing Mobile Application

Before building the website, inspect the existing React Native implementation.

Identify:

- Existing Supabase configuration.
- Existing database tables and relationships.
- Authentication flow.
- User and pilgrim identifiers.
- Medical/profile data.
- SOS/emergency data and operations.
- Volunteer-related functionality.
- Existing realtime subscriptions.
- Existing QR/NFC payload structure.
- Existing APIs or Edge Functions.
- Any offline synchronization logic.

Do not redesign existing working functionality unnecessarily.

The purpose of this phase is to understand what is already implemented and make the website consume the same system.

---

### Phase 2 — Establish the Shared Backend Contract

Define the backend as the common contract for both clients.

For every shared feature, determine:

- What data is stored.
- Which table/entity owns the data.
- Who can read it.
- Who can modify it.
- Which fields represent state/status.
- Which actions require realtime updates.
- Which operations must be protected by authentication or authorization.

Use PostgreSQL relationships, constraints, indexes, and Row Level Security where appropriate.

The mobile and web applications should not independently invent different representations of the same data.

---

### Phase 3 — Build the Next.js Web Client

Create a separate Next.js application that connects to the existing Supabase project.

The first goal is not feature parity with the mobile app.

Prioritize web experiences that provide the most value:

- QR-based profile access.
- Emergency/SOS viewing.
- Volunteer or responder dashboard.
- Administrative/monitoring views.
- Other browser-friendly workflows required by the project.

Keep the web application responsive so the same application can work on phones, tablets, and desktop browsers.

---

### Phase 4 — Reuse the Same Backend Operations

For shared functionality, the website should use the same backend data and business rules as the mobile application.

Examples:

- Reading a pilgrim profile.
- Creating an SOS event.
- Updating SOS status.
- Assigning or dispatching help.
- Updating a user's status.
- Reading emergency information.

Avoid creating duplicate business logic simply because there are two frontends.

Where practical, share types, validation rules, constants, and API/business contracts between the clients.

---

### Phase 5 — Implement Realtime Synchronization

Use Supabase Realtime for data that should appear immediately on another client.

Example:

    Mobile App
        ↓
    Creates SOS
        ↓
    Supabase
        ↓
    Realtime Event
        ↓
    Web Dashboard updates

And the reverse:

    Web Dashboard
        ↓
    Updates SOS status
        ↓
    Supabase
        ↓
    Realtime Event
        ↓
    Mobile App updates

Prioritize realtime for emergency and operational information rather than trying to make every piece of UI realtime.

---

### Phase 6 — Design the QR Flow

QR codes should use HTTPS URLs rather than being tied directly to one client.

Example concept:

    https://<domain>/p/<identifier>

The URL becomes the universal entry point.

Desired behavior:

    Scan QR
       ↓
    HTTPS Link
       ↓
    Is the application installed?
       ├── Yes → Open mobile application
       └── No  → Open Next.js web page

This means the same QR code can support both platforms.

The web route should always remain a valid fallback.

---

### Phase 7 — Add Deep Linking

After the web fallback works, configure native deep linking using the same HTTPS URLs.

Use:

- Android App Links.
- iOS Universal Links.

The mobile application should understand the relevant route and identifier contained in the URL.

For example, a QR link that represents a pilgrim/profile should open the equivalent profile inside the mobile application when the app is installed.

Do not depend on custom-only schemes as the primary QR destination if the same flow needs to work on devices without the app.

---

### Phase 8 — Keep Native-Only Capabilities in the Mobile App

Do not force every mobile feature into the browser.

Capabilities such as:

- Offline SQLite storage.
- Bluetooth/BLE mesh communication.
- Background native processing.
- Native push notifications.
- Other device-specific integrations.

should remain in the React Native application.

The website should provide the online/shared version of the workflow where appropriate.

This creates a deliberate difference between the clients instead of trying to make both platforms technically identical.

---

### Phase 9 — Security and Access Control

Before deployment, verify:

- Authentication is enforced where necessary.
- Supabase Row Level Security policies are enabled and tested.
- Sensitive medical/emergency data is not exposed unnecessarily.
- Public QR pages only reveal information intended to be public or emergency-accessible.
- Privileged operations are performed through secure server-side mechanisms where required.
- Secret keys are never exposed in client-side code.
- The web and mobile clients use appropriate environment variables and permissions.

Security should be based on backend authorization, not only frontend restrictions.

---

### Phase 10 — Testing

Test the complete cross-platform flow rather than testing each client in isolation.

Minimum integration scenarios:

**QR**
- Scan with app installed.
- Scan without app installed.
- Open QR directly in a browser.
- Verify the correct profile/record is shown.

**Realtime**
- Trigger an SOS from mobile and verify web updates.
- Update an event from web and verify mobile updates.
- Verify reconnect behavior after temporary network loss.

**Authentication**
- Login on mobile.
- Login on web.
- Verify unauthorized users cannot access protected data.

**Offline**
- Confirm native offline behavior remains functional.
- Confirm data synchronizes correctly after reconnecting.

**Responsive Web**
- Test mobile browser.
- Test tablet-sized viewport.
- Test desktop dashboard.

---

## 5. Development Priority for the Hackathon

Build in this order:

1. Understand and preserve the existing mobile implementation.
2. Verify the existing Supabase backend.
3. Create the Next.js web client.
4. Connect the web client to the same Supabase project.
5. Implement the QR web fallback.
6. Implement the main responder/volunteer dashboard.
7. Connect the most important shared actions.
8. Add realtime synchronization.
9. Add deep linking.
10. Deploy and polish the complete demo flow.

Do not spend significant time on advanced architecture before the end-to-end flow works.

A working cross-platform flow is more valuable than a highly abstract codebase.

---

## 6. Deployment Approach

Use a simple deployment model:

- **React Native:** Expo / EAS or the existing mobile distribution workflow.
- **Next.js:** Vercel or another suitable Next.js host.
- **Backend:** Existing Supabase project.
- **QR domain:** Use the production web domain as the universal HTTPS destination.

The production QR links should point to the permanent domain rather than a temporary development or preview URL.

---

## 7. Target End-to-End Flow

The finished system should behave conceptually like this:

    User
      ↓
    QR Scan
      ↓
    HTTPS Universal Link
      ↓
    ┌─────────────────────────────┐
    │ App installed?              │
    └─────────────────────────────┘
          ↓                 ↓
        Yes                 No
          ↓                 ↓
    React Native          Next.js
          ↓                 ↓
          └───────┬─────────┘
                  ↓
               Supabase
                  ↓
            PostgreSQL
                  ↓
            Realtime Events
                  ↓
       Other connected clients

The important property is that both clients remain synchronized through the same backend instead of attempting to synchronize directly with each other.

---

## 8. Architectural Rules to Follow

### Rule 1 — One shared backend
Do not create separate web and mobile databases.

### Rule 2 — One source of truth
Shared online state should live in PostgreSQL/Supabase.

### Rule 3 — Reuse existing mobile logic
Do not rewrite working React Native functionality just to match the website.

### Rule 4 — Web and mobile do not need feature parity
The website should provide the workflows that make sense in a browser.

### Rule 5 — Native capabilities stay native
Offline storage and BLE-related functionality should remain in the mobile application.

### Rule 6 — QR links should be platform-independent
Use HTTPS URLs that can resolve to either the app or website.

### Rule 7 — Backend security is mandatory
Frontend hiding is not access control.

### Rule 8 — Build the integration first
Get one complete flow working end-to-end before expanding the feature set.

---

## 9. Recommended Technology Choice

**Mobile**
- React Native
- Expo

**Web**
- Next.js
- TypeScript
- Tailwind CSS or the project's preferred UI system

**Backend**
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Realtime
- Supabase Storage / Edge Functions as required

**Native / Offline**
- SQLite
- BLE / native device APIs
- GPS
- Camera / QR
- Notifications

**Integration**
- HTTPS QR links
- Android App Links
- iOS Universal Links

---

## 10. Final Goal

The end result should feel like **one application available through two interfaces**, not two separate applications.

A user should be able to enter through a QR code, use either the native application or website depending on device availability, and still interact with the same underlying data and emergency workflows.

The architecture should remain simple, reliable, and easy for the team to extend after the hackathon.
