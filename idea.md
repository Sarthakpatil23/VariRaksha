VariRaksha — Product & Project Idea

What We Are Building

VariRaksha is an emergency-safety ecosystem for pilgrims during the Pandharpur Wari. The goal is to make emergency help accessible even when connectivity is unreliable, a pilgrim is separated from their Dindi, or a responder does not have the app installed.

The system combines:

React Native + Expo mobile app for pilgrims, Dindi leaders, volunteers, and medical responders.

Next.js web app for browser-based emergency access, responder operations, and monitoring.

Supabase + PostgreSQL as the shared backend and single source of truth.

QR/NFC emergency identity for fast access to critical pilgrim information.

Offline-first mobile behavior using local storage and a simulated/optimistic BLE mesh concept for the hackathon.

Core idea: protection that reaches you even when the network doesn't.

Problem

The Wari involves very large crowds, long routes, vulnerable/elderly pilgrims, and areas where connectivity may be unreliable. VariRaksha focuses on:

Making emergency help easy to trigger and discover.

Making critical medical information quickly available to responders.

Supporting emergency workflows when internet connectivity is weak or unavailable.

Helping Dindi leaders detect/respond to separated or vulnerable members.

Providing simple multilingual and accessible interactions.

The product should not assume continuous internet access or that every person has the mobile app.

Main Users

Pilgrim / Varkari

Simple SOS access.

Medical ID and emergency contacts.

Dindi/group visibility.

Lost/distress reporting.

Marathi/Hindi/English support.

Offline access to critical personal information.

Dindi Leader

Group/member visibility.

Separation and lost-person alerts.

Group communication.

Ability to respond to urgent events.

Volunteer / Responder

Live SOS alerts.

Location and medical context.

Acknowledge/dispatch actions.

Operational visibility into incidents.

Medical Staff

Fast access to relevant medical and emergency information.

Admin / Coordinator

System-wide operational monitoring.

Product Surfaces

Mobile

The existing React Native + Expo application remains the native-first client. It handles onboarding, authentication, profiles, medical ID, SOS, Dindi functionality, GPS, offline storage, notifications, QR/NFC/device capabilities, and the hackathon's BLE/voice concepts.

Web

A new Next.js application provides the browser-first experience. Priority areas are:

Public emergency card: /p/[id]

Responder/volunteer dashboard: /dashboard

SOS/emergency views

Administrative/monitoring views

The website does not need to be a clone of the mobile app. It should provide browser-appropriate workflows and serve as the fallback when the app is unavailable.

Central QR Journey

QR codes should contain universal HTTPS URLs, for example:

https://<domain>/p/<emergency-card-id>

The same QR should support both platforms:

Scan QR
   ↓
HTTPS URL
   ↓
App installed?
   ├── Yes → React Native app via Android App Links / iOS Universal Links
   └── No  → Next.js emergency card

The browser fallback must always remain functional.

Central SOS Journey

Online:

Mobile SOS
    ↓
Supabase / PostgreSQL
    ↓
Supabase Realtime
    ↓
Responder Web Dashboard
    ↓
Acknowledge / Dispatch
    ↓
Supabase
    ↓
Mobile status update

Offline concept:

SOS
 ↓
Local queue / storage
 ↓
Device-to-device relay concept
 ↓
Connectivity restored
 ↓
Supabase synchronization

For the hackathon, BLE mesh behavior may be simulated/optimistic while preserving the intended architecture.

Shared Backend

Supabase is the common backend for both clients.

PostgreSQL: profiles, medical data, emergency contacts, Dindi groups, SOS events, broadcasts, and other shared state.

Auth: Phone/OTP authentication.

Realtime: live SOS and responder state changes.

RLS: database-level access control.

Storage / Edge Functions: only where actually required.

There should be one shared backend and one source of truth. Do not create separate databases for web and mobile.

Native vs Web Responsibility

Mobile-first

Offline SQLite/local caching.

BLE/device relay concepts.

Native notifications.

GPS and device capabilities.

Native hardware integrations.

Full offline emergency experience.

Web-first

Public QR emergency card.

Responder/volunteer dashboard.

Monitoring/admin views.

Large-screen operational workflows.

Browser fallback.

Shared

Authentication.

Profiles.

Medical information.

SOS events.

Dindi state.

Responder state.

Realtime synchronization.

Current Repository Context

The existing repository is an Expo/React Native project and already contains organized navigation, screens, components, constants, libraries, types, and localization. It also contains a Supabase client entry point, user-store logic, onboarding/OTP screens, and TypeScript models for pilgrims, medical profiles, Dindi groups, emergency contacts, members, and alerts.

The current Supabase client still uses placeholder environment values, so connecting the app to the real Supabase project is an immediate task.

Architecture.md contains the more detailed technical architecture and schema direction; this file is intended to preserve the overall product context and idea.

Hackathon MVP Priorities

Build the smallest end-to-end system that clearly demonstrates the idea.

Supabase: configure the real project, schema, Auth, RLS, Realtime, and demo data.

Next.js: build the web application and public /p/[id] emergency card.

Dashboard: build /dashboard with live SOS events and responder actions.

Mobile integration: connect existing mobile SOS/profile flows to the real backend.

Realtime: demonstrate mobile → web and web → mobile state synchronization.

QR: make the HTTPS browser flow work.

Deep linking: add Android App Links / iOS Universal Links.

Polish: responsive UI, map/location presentation, emergency states, notifications, branding, and reliable demo data.

Do not prioritize feature parity or advanced architecture over a working end-to-end flow.

Ideal Judge Demo

The strongest demo is one continuous story:

A pilgrim triggers SOS in the mobile app.

The event reaches Supabase.

A responder dashboard immediately receives it through Realtime.

The responder sees location and medical context.

The responder acknowledges/dispatches help.

The mobile app receives the updated status.

A separate QR scan opens the native app when available or the web emergency card when it is not.

The team explains that the mobile client also supports offline behavior and the BLE relay concept for network-dead areas.

This demonstrates the main differentiators: offline-first design, realtime cross-platform synchronization, QR interoperability, medical context, and native emergency capabilities.

Things We Should Avoid

Separate backends or databases for web and mobile.

Rewriting working mobile functionality unnecessarily.

Trying to reproduce BLE mesh functionality in the browser.

Overengineering monorepo/tooling before the core flow works.

Exposing Supabase secret/service-role credentials to frontend clients.

Making sensitive medical data publicly readable without deliberate RLS policies.

Building a large admin system before the emergency flow is reliable.

Current Technical Direction

Mobile: React Native + Expo

Web: Next.js + TypeScript + Tailwind CSS

Backend: Supabase

Database: PostgreSQL via Supabase

Realtime: Supabase Realtime

Auth: Supabase Phone/OTP

Offline: SQLite

Connectivity concept: BLE mesh / local relay on mobile

QR integration: HTTPS + Android App Links / iOS Universal Links

The project should remain one repository with separate mobile and web applications sharing the same backend and, where useful, shared contracts/types.

Source of Truth

For future development, use:

IDEA.md — product idea, users, flows, priorities, and overall context.

Architecture.md — technical architecture, data models, QR/deep-linking, Realtime, and implementation roadmap.

Existing React Native code — actual current implementation.

Supabase project — actual backend state once configured.

When implementation changes, keep the documentation aligned with the code.