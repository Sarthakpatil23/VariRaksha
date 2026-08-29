# VariRaksha — Website UI System & Design Specification

> **Purpose:** This document is the single visual and interaction source of truth for the VariRaksha web application.  
> **Primary inspiration:** the supplied Sarvam landing-page reference — warm Indian visual language, editorial typography, generous whitespace, restrained navigation, cinematic imagery, confident hierarchy, and premium simplicity.  
> **Important:** VariRaksha should be inspired by the *design discipline and visual mood* of the reference, not reproduce Sarvam branding, logo, copy, or proprietary assets.

---

# 1. Design North Star

## 1.1 The feeling

The VariRaksha website should feel like:

**A premium Indian public-safety product built with the seriousness of a mission-critical system.**

It should combine:

- Indian warmth without becoming ornamental.
- Modern technology without looking like a generic SaaS dashboard.
- Emergency clarity without looking like a hospital management system.
- Spiritual/cultural context without becoming devotional artwork.
- Editorial elegance without sacrificing usability.
- Calm confidence rather than constant visual urgency.

The visual personality is:

> **Warm. Precise. Human. Quietly powerful.**

---

# 2. Core Design Principles

## Principle 01 — Calm over clutter

VariRaksha deals with emergencies. The interface must reduce cognitive load.

Do not fill every area with cards, gradients, badges, icons, or animations.

Use:

- Large whitespace.
- Clear grouping.
- Strong typography.
- One dominant action per surface.
- Secondary information in muted tones.

Emergency states can become visually stronger, but normal states should feel calm.

---

## Principle 02 — Information hierarchy before decoration

Every screen must answer:

1. What is happening?
2. Who/what does it affect?
3. What matters right now?
4. What should I do next?

A beautiful dashboard that makes a coordinator search for an active SOS is a failed design.

---

## Principle 03 — Editorial composition

Use the Sarvam-inspired editorial approach:

- Oversized headlines.
- Long horizontal whitespace.
- Strong left alignment.
- Large image fields.
- Thin rules.
- Restrained navigation.
- Large typographic moments between dense information sections.

Avoid the "everything is a card" SaaS aesthetic.

---

## Principle 04 — Indian, not stereotypically Indian

Indian identity should come through:

- Warm parchment tones.
- Saffron/terracotta accents.
- Deeper ink/navy typography.
- Wari-inspired photography/illustration.
- Marathi/Devanagari typography where meaningful.
- Subtle architectural or textile-like geometry.

Do **not** use:

- Excessive mandalas.
- Random temple icons.
- Decorative paisley everywhere.
- Loud saffron gradients.
- Generic "India" stock imagery.
- Gold everywhere.

Cultural references should be treated as design language, not decoration.

---

## Principle 05 — Premium restraint

The UI should look expensive because of proportion, spacing, typography, and consistency — not because of excessive effects.

Use:

- Thin borders.
- Subtle shadows.
- Controlled radius.
- Intentional type scale.
- Large negative space.
- Excellent alignment.

Avoid:

- Glassmorphism everywhere.
- Neon glows.
- Heavy drop shadows.
- Excessive blur.
- Excessive rounded pills.
- Huge gradient blobs.

---

# 3. Brand / Visual Identity

## 3.1 Brand personality

VariRaksha is:

- Protective.
- Trustworthy.
- Indian.
- Human.
- Technically capable.
- Calm during chaos.
- Accessible to elderly users.
- Serious about emergency response.

The website should communicate:

> **"When something goes wrong, this system knows what to do."**

---

# 4. Color System

The palette is inspired by the supplied warm Sarvam-style reference, but customized for VariRaksha.

## 4.1 Base colors

```text
PARCHMENT
#F5E8D4
Primary page background.
Warm, soft, human.

PARCHMENT LIGHT
#FBF4E9
Bright section background.

PARCHMENT DEEP
#EBD7BD
Subtle section separation.

INK
#172238
Primary typography / navigation / strong UI.

INK SOFT
#30405A
Secondary headings and emphasized body text.

MUTED
#6E706F
Secondary metadata and descriptions.

BORDER
#DCCCB7
Default hairline borders.

WHITE
#FFFDF8
Cards and high-contrast surfaces.
```

## 4.2 VariRaksha accent colors

```text
SAFFRON
#D97732
Primary brand accent.

SAFFRON DARK
#A84F1F
Hover / pressed / emphasis.

TERRACOTTA
#B65F46
Secondary cultural accent.

MAROON
#7E2630
Heritage/emergency-adjacent accent.

DEEP MAROON
#5F1C24
Severe states only.
```

## 4.3 Semantic colors

Do not use the brand palette for semantic states when a semantic color is clearer.

```text
SUCCESS
#2F7654

WARNING
#B2762A

CRITICAL
#B83A32

INFO
#386A86

NEUTRAL
#737678
```

Semantic colors should be used sparingly and always paired with text/icon meaning.

Never communicate status through color alone.

---

# 5. Color Usage Ratios

A typical page should visually behave approximately like:

```text
70–80%  warm neutrals / whitespace
15–20%  dark ink / typography
5–10%   saffron + semantic accents
```

The saffron should feel valuable because it is relatively rare.

Do not turn the entire site orange.

---

# 6. Dark Surfaces

Dark surfaces may be used for:

- Hero overlays where needed.
- High-priority emergency panels.
- Focused data sections.
- Footer.
- Selected dashboard modules.

Preferred dark surface:

```text
#172238
```

Not pure black.

Dark mode is **not** the default visual language of VariRaksha.

---

# 7. Typography

## 7.1 Primary UI font

Use a geometric/humanist sans-serif with wide, refined forms similar in spirit to the typography of the supplied Sarvam reference.

### Recommended primary font: `Manrope`

Use:

```text
Manrope
400 — Body
500 — Labels / navigation
600 — Buttons / UI headings
700 — Strong headings
800 — Hero/display
```

The font should feel:

- Modern.
- Rounded but not childish.
- Wide enough for strong editorial headings.
- Excellent for English UI.
- Clean at small sizes.

Load it consistently throughout the web application.

---

## 7.2 Display / editorial accent font

For selected hero statements and editorial storytelling, use:

### `Newsreader`

Use it sparingly.

Appropriate for:

- One hero phrase.
- Large mission statement.
- Pull quote.
- Storytelling section.

Do **not** use Newsreader for dashboards, buttons, tables, or forms.

The default product UI remains Manrope.

---

## 7.3 Devanagari

Where Marathi text is shown, use a high-quality Devanagari-compatible family such as:

```text
Noto Sans Devanagari
```

or another carefully tested Indic family.

Do not force English display typography onto Devanagari.

Indic typography must have:

- Correct line-height.
- Sufficient word spacing.
- Comfortable reading size.
- No aggressive letter-spacing.

---

# 8. Type Scale

Use a responsive type scale.

## Desktop

```text
Hero      72–92px
Display   56–72px
H1        44–56px
H2        34–42px
H3        24–30px
H4        18–22px
Body      16–18px
Small     14px
Caption   12–13px
```

## Mobile

```text
Hero      42–52px
Display   36–44px
H1        32–38px
H2        26–32px
H3        21–24px
Body      16px
Small     14px
Caption   12px
```

Never make normal dashboard body text smaller than 14px.

---

# 9. Typography Rules

## Hero headings

Use:

- Large size.
- Tight line-height.
- Slightly negative tracking.
- Maximum width around 700–850px.
- Short line count.

Preferred structure:

```text
Protect every
step of the Wari.
```

not:

```text
VariRaksha is an intelligent emergency
safety ecosystem designed to provide...
```

The hero must make the product understandable immediately.

---

## Body copy

Use:

- 16–18px.
- 1.5–1.65 line-height.
- Maximum reading width around 650–720px.

Do not create long walls of text.

---

# 10. Letter Spacing

Use letter spacing intentionally.

```text
Hero:
-0.035em to -0.055em

Large headings:
-0.025em to -0.04em

Body:
normal

Uppercase labels:
+0.08em to +0.12em
```

Avoid oversized tracking on normal text.

---

# 11. Layout System

## 11.1 Global page width

Maximum content width:

```text
1280px
```

Preferred desktop horizontal padding:

```text
32–64px
```

Large hero sections may use:

```text
64–96px
```

on large displays.

---

## 11.2 Grid

Primary desktop grid:

```text
12 columns
```

Use generous gutters.

Example:

```text
| 1 | 2 | 3 | 4 | 5 | 6 || 7 | 8 | 9 | 10 | 11 | 12 |
```

Typical compositions:

```text
6 / 6
5 / 7
4 / 8
3 / 9
```

Avoid symmetrical two-column layouts everywhere.

Use editorial asymmetry where it improves hierarchy.

---

# 12. Spacing System

Base spacing unit:

```text
4px
```

Preferred scale:

```text
4
8
12
16
20
24
32
40
48
64
80
96
120
160
```

Large whitespace is a major part of the visual identity.

Do not compress sections just because there is unused space.

---

# 13. Border Radius

Keep the interface refined rather than overly playful.

```text
Small controls       8px
Inputs               10px
Standard cards       14px
Large feature cards  18px
Hero image           0–24px depending on composition
```

Do not use 24–32px radius on every component.

The landing page may occasionally use square/near-square editorial image edges.

---

# 14. Borders

Default:

```text
1px solid #DCCCB7
```

Dashboard:

```text
1px solid rgba(23,34,56,0.10)
```

Avoid thick borders.

Use rules/hairlines to create rhythm.

---

# 15. Shadows

Shadows should be nearly invisible.

Default card:

```text
0 8px 30px rgba(23,34,56,0.05)
```

Elevated interactive surface:

```text
0 16px 50px rgba(23,34,56,0.08)
```

Emergency surface may use a slightly stronger shadow, but avoid dramatic glow.

---

# 16. Texture & Background

The supplied Wari/Indian cinematic background image should be treated as a **hero storytelling asset**, not a universal background.

## Background Image Placement

### Primary placement — Landing Page Hero

Use the supplied image as the main hero visual.

Recommended composition:

```text
LEFT
Text + CTA
        →
CENTER
soft image transition
        →
RIGHT
rich Wari/landscape imagery
```

The image should remain strongest on the right side, with a soft fade toward the left.

Do not place text directly over visually busy regions.

---

## Hero image treatment

Use:

```text
background-position: center right
background-size: cover
```

Overlay a warm parchment fade from left to right.

The left side should remain quiet enough to support dark typography.

Do not apply a heavy dark overlay.

---

## Secondary image usage

The image may appear later as:

- Mission section backdrop.
- "How it works" storytelling section.
- A full-width transition between product sections.

Do not reuse the same image in more than 2 major locations.

---

# 17. Avoid Using the Background Image On

Do **not** use the cinematic background behind:

- Coordinator tables.
- Live SOS lists.
- Medical queues.
- Admin forms.
- Dense dashboard data.
- Modals.
- Medical profile information.

Operational screens require maximum legibility.

---

# 18. Navbar

## Landing navigation

Height:

```text
72–88px
```

Structure:

```text
[VariRaksha]      Platform   Safety   How it works   About      [Open App]
```

Keep the nav sparse.

The logo should be the strongest element.

---

## Navbar visual behavior

At top:

- Transparent / parchment.
- No heavy container.
- Dark text.

On scroll:

- Slight background opacity.
- `backdrop-filter: blur(...)`.
- Thin bottom border.
- Subtle transition.

Do not create a large floating pill navbar.

---

# 19. Logo Treatment

The VariRaksha wordmark should be custom to VariRaksha.

Use:

```text
VariRaksha
```

with the same overall typographic spirit:

- Wide.
- Clean.
- Rounded.
- Confident.
- Low visual noise.

Do not reproduce the Sarvam logo or letterforms exactly.

Possible lockup:

```text
[mark] VariRaksha
```

or simply:

```text
VariRaksha
```

For a premium feel, a wordmark-only header is preferred if the mark is not yet mature.

---

# 20. Primary CTA

Primary button:

```text
Background: #D97732
Text: #FFFDF8
```

Example:

```text
Open VariRaksha  →
```

Height:

```text
48–52px
```

Horizontal padding:

```text
20–24px
```

Border radius:

```text
10–12px
```

Hover:

- Slight darkening.
- Translate Y by -1px.
- Tiny shadow increase.

Do not use a permanent glow.

---

# 21. Secondary CTA

Style:

```text
Transparent / parchment
1px solid #B9A992
Ink text
```

Example:

```text
How it works
```

Hover:

- Background becomes `#FFFDF8`.
- Border becomes darker.
- Text remains stable.

---

# 22. Emergency CTA

Emergency actions need their own visual language.

Primary SOS button:

```text
Background: #B83A32
Text: white
```

The button should be highly visible but **not visually dominate every normal screen**.

Use:

```text
SOS
Hold 2 seconds
```

rather than only an icon.

The interface must clearly explain accidental-trigger prevention.

---

# 23. Landing Page Structure

The landing page should feel like a premium editorial product page, not a generic startup template.

Recommended flow:

```text
01 — Hero
02 — Trust / Mission strip
03 — The problem
04 — How VariRaksha works
05 — Emergency response flow
06 — Role ecosystem
07 — Medical ID / QR story
08 — Offline-first story
09 — Product interface preview
10 — Mission statement
11 — Final CTA
12 — Footer
```

---

# 24. Hero Section

## Objective

Within 5 seconds users should understand:

- This is VariRaksha.
- It is for Wari/pilgrim safety.
- It handles emergencies.
- It works across app and web.
- It is designed for real-world conditions.

---

## Hero composition

Recommended:

```text
------------------------------------------------------
NAV
------------------------------------------------------

Eyebrow:
BUILT FOR THE WARI

Large headline:
Protection that
reaches you,
even when the
network doesn't.

Supporting copy:
A connected emergency safety system for
Varkaris, Dindi leaders, coordinators, medical
staff and families.

[Open VariRaksha] [See how it works]

                    CINEMATIC WARI IMAGE
------------------------------------------------------
```

Do not overcrowd.

---

# 25. Hero Typography

Use Manrope for most of the heading.

A selective Newsreader line can be used for one emotionally resonant phrase:

```text
Protection that reaches you
```

but do not make the whole hero serif.

The result should feel contemporary first, culturally rooted second.

---

# 26. Hero Image

The provided Wari image belongs here.

Desktop:

- Image occupies roughly 52–58% visual area.
- Text occupies roughly 42–48%.
- Use a soft parchment transition between them.

Mobile:

- Text comes first.
- Image follows as a tall cinematic crop.
- Do not place tiny text over the image.

---

# 27. Trust / Mission Strip

Immediately below the hero:

Use a quiet strip.

Possible content:

```text
OFFLINE-FIRST
REALTIME RESPONSE
MEDICAL ID
QR ACCESS
DINDI SAFETY
```

Do not invent fake customer logos.

For a student/hackathon project, never pretend organisations "trust" the product unless the claim is true.

Use capability labels instead.

---

# 28. Problem Section

Visual approach:

Large statement on left.

Small explanation + issue list on right.

Example:

```text
The Wari moves faster
than traditional
emergency systems.

The problem isn't only infrastructure.
It's reaching the right person at the right time.
```

Then:

```text
01   Medical information is inaccessible
02   Connectivity disappears
03   Groups become separated
04   Responders lack context
```

Use large numerals and thin divider lines.

---

# 29. How It Works Section

Show the ecosystem as a sequence rather than cards.

```text
VARKARI
   ↓
SOS / QR
   ↓
SUPABASE
   ↓
COORDINATOR
   ↓
MEDICAL STAFF
   ↓
FAMILY / EMERGENCY CONTACT
```

Use a horizontal timeline on desktop.

On mobile, convert to vertical.

---

# 30. Emergency Flow Visualization

This is one of the most important sections.

Display:

```text
SOS triggered
      ↓
Alert received
      ↓
Location identified
      ↓
Coordinator responds
      ↓
Medical staff engaged
      ↓
Hospital / resolution
```

Each stage should have:

- Number.
- Short title.
- One sentence.
- Small icon.

Avoid cartoon icons.

Use simple line icons.

---

# 31. QR Medical ID Section

This should feel like a premium product showcase.

Composition:

```text
LEFT
Oversized QR / Medical ID visual

RIGHT
"One scan.
Critical context."

Blood group
Allergies
Medications
Emergency contacts

[View example card →]
```

The QR should be visually prominent but not overly patterned.

Use a clean medical-card preview.

---

# 32. QR Section CTA

Primary:

```text
Scan an example
```

Secondary:

```text
How QR fallback works
```

The experience should immediately explain:

```text
App installed → opens app
No app → opens web
```

This is a key differentiator and deserves visual clarity.

---

# 33. Offline Section

Visual idea:

```text
          NO SIGNAL
             ↓
       ┌──────────────┐
       │   VARIRAKSHA │
       │    DEVICE    │
       └──────────────┘
          ↓       ↓
       LOCAL     RELAY
       QUEUE      ↓
          └───────┘
             ↓
     CONNECTION RETURNS
             ↓
          SUPABASE
```

Use a dark ink section with parchment typography if a visual contrast moment is needed.

Avoid flashy tech graphics.

---

# 34. Role Ecosystem Section

Introduce the five operational roles:

```text
VARKARI
DINDI LEADER
ADMIN
COORDINATOR
MEDICAL STAFF
```

Emergency contacts should appear as an additional connected stakeholder:

```text
EMERGENCY CONTACT
```

Don't make six identical cards.

Instead use a large central ecosystem diagram or asymmetric panels.

---

# 35. Role Cards

For detailed role information, cards may be used.

Each role card:

```text
Small uppercase role label
Large role title
One-line purpose
3–5 capability lines
```

Example:

```text
COORDINATOR

See the situation.
Move the response.

• Incoming emergency alerts
• Live map and area overview
• Incident history
• Coordinate medical handoff
```

---

# 36. Dashboard Design Philosophy

The dashboard must visually shift from:

```text
Editorial / storytelling
```

to:

```text
Operational / information dense
```

while retaining the same colors and typography.

Do not carry cinematic imagery into dense dashboard screens.

---

# 37. Dashboard Global Layout

Desktop:

```text
┌───────────────┬──────────────────────────────────┐
│               │                                  │
│   SIDEBAR     │         MAIN CONTENT             │
│               │                                  │
│ Logo          │ Page heading                     │
│ Navigation    │ Context / actions                │
│ Role          │                                  │
│ User          │ Data / map / queues              │
│               │                                  │
└───────────────┴──────────────────────────────────┘
```

Sidebar width:

```text
240–280px
```

Main content maximum:

```text
1440px
```

---

# 38. Dashboard Sidebar

Keep it minimal.

Example Coordinator navigation:

```text
OVERVIEW
LIVE ALERTS
MAP
HISTORY
VARKARIS
MEDICAL HANDOFF
```

Bottom:

```text
Profile
Settings
Sign out
```

Use icons + text.

Never icons alone on desktop.

---

# 39. Dashboard Header

Example:

```text
Good morning, Coordinator.

12 incidents are being monitored.
```

Right:

```text
[Search] [Notifications] [Profile]
```

Below it:

```text
LIVE
NETWORK STATUS
LAST SYNC
```

Don't make every status a colored pill.

---

# 40. Coordinator Dashboard

Primary layout:

```text
┌──────────────────────────────────────────────────┐
│ Active SOS: 04      Response: 02      Resolved: 17│
└──────────────────────────────────────────────────┘

┌────────────────────────┬─────────────────────────┐
│                        │                         │
│       LIVE MAP         │    INCOMING ALERTS      │
│                        │                         │
│                        │  Critical SOS           │
│                        │  Moderate               │
│                        │  Info                   │
└────────────────────────┴─────────────────────────┘

┌──────────────────────────────────────────────────┐
│ Recent incidents / history                       │
└──────────────────────────────────────────────────┘
```

The live map is the visual anchor.

---

# 41. Active SOS Card

Emergency alert cards should be compact.

Structure:

```text
CRITICAL
2 min ago

Ramesh Kulkarni
Dindi #12

Chest pain
Near Wakhari Gate

[Open incident]
```

Never show only:

```text
🚨 SOS!!!
```

The responder needs context immediately.

---

# 42. Incident Status

Canonical states:

```text
ACTIVE
ACKNOWLEDGED
IN RESPONSE
MEDICAL HANDOFF
HOSPITAL
RESOLVED
```

Each status has:

- Label.
- Icon.
- Timeline position.

Do not create 20 micro-statuses.

---

# 43. Coordinator Map

The map must emphasize:

- Active SOS locations.
- Medical facilities.
- Dindi/group locations.
- Coordinator position if available.
- Emergency response zones.

Visual priority:

```text
Critical incident > current response > facilities > background geography
```

Use restrained map styling.

The surrounding UI remains parchment/ink.

---

# 44. Medical Staff Dashboard

Medical staff should see a calmer clinical interface.

Primary modules:

```text
TRIGGER QUEUE
PATIENTS IN CARE
PENDING TRANSFERS
RECENT CASES
```

Main queue:

```text
Patient
Trigger
Severity
Vitals/context
Location
Status
Action
```

No giant decorative imagery.

---

# 45. Medical Profile

Medical profile should resemble a premium identity document.

Structure:

```text
PROFILE
Name
Age
Dindi

MEDICAL
Blood group
Allergies
Conditions
Medications
Organ donor
Critical notes

EMERGENCY CONTACTS
Primary contact
Phone

RESPONSE
SOS status
Coordinator
Medical status
```

Important information gets large typography.

Critical information can use maroon/red but should not become a red page.

---

# 46. Varkari User Dashboard

The Varkari experience must be extremely simple.

Primary home:

```text
Good morning, Ramesh.

Today
Pandharpur → [next stage]

[ HOLD TO SEND SOS ]

Medical ID
Your group
Schedule
AI assistant
```

The SOS button is the dominant action.

Everything else should be secondary.

---

# 47. Varkari Home

Suggested layout:

```text
Greeting
↓
Today's Wari schedule / next destination
↓
Large SOS interaction
↓
Medical ID shortcut
↓
Dindi/group status
↓
AI assistant
```

Don't make users navigate through a complex sidebar.

---

# 48. Dindi Leader Dashboard

Primary objective:

**Understand the group quickly.**

Main layout:

```text
DINDI #12
42 members

[Group health]
[Attendance]
[Alerts]

MEMBERS
──────────────────
Name
Status
Last seen
Distance
Action

BROADCAST
[ Send message ]

SCHEDULE
[ Calendar ]
```

---

# 49. Dindi Leader Member States

Use explicit text:

```text
WITH GROUP
SEPARATED
LOST
CHECKED IN
URGENT
OFFLINE
```

Avoid communicating these states purely through dots.

---

# 50. Broadcast Messaging

A Dindi broadcast composer should be very simple:

```text
Send to
Dindi #12

Message
[................................]

[ ] Mark as urgent

[Send broadcast]
```

Urgent broadcast should require deliberate confirmation.

---

# 51. Admin Interface

Admin is a management tool.

It should prioritize:

```text
VARKARIS
DINDIS
EMERGENCY CONTACTS
MEDICAL RECORDS
USERS / ROLES
```

Use table-first layouts rather than cards.

Example:

```text
Varkari
Name
Phone
Emergency no.
Dindi
Status
Updated
```

---

# 52. Emergency Contacts Experience

The emergency contact is a separate user experience.

## Without app

Critical SOS notification via SMS should communicate:

```text
VARIRAKSHA ALERT

Ramesh Kulkarni has triggered an emergency alert.

Status: ACTIVE
Last known location: Wakhari

Open emergency details:
https://...
```

The wording should be calm and factual.

Avoid sensational language.

---

## With app

Emergency contact dashboard can show:

```text
Ramesh is safe / in response / needs attention

Current location
Dindi
Distance from group
SOS status
Coordinator status
Medical handoff status
Last update
```

The UI should never overwhelm the family member with operational coordinator-level detail unless appropriate.

---

# 53. Public Emergency Card

Route:

```text
/p/[id]
```

This is one of the most important web pages.

It should work without login when the QR policy permits access.

Visual hierarchy:

```text
VARIRAKSHA

Emergency Medical ID

[PHOTO]

Ramesh Kulkarni
Age 68

B+

Blood Group

Allergies
Penicillin

Medications
Amlodipine

Emergency contact
+91 XXXXX XXXXX

[Call emergency contact]
[Trigger responder alert]
```

Keep this page extremely legible.

---

# 54. Public Card Safety

Only display data intentionally made public through backend policy.

Do not assume that because a QR is public, every field should be public.

The design must support partial visibility.

Example:

```text
Full phone:
hidden

Emergency contact:
Call contact
```

The actual disclosure policy is determined by backend/RLS, not UI.

---

# 55. AI Assistant UI

AI exists for:

- Varkari assistance.
- Dindi Leader information.
- Relevant Wari/travel guidance.

The AI UI should not look like a generic ChatGPT clone.

Use:

```text
"What do you need help with?"
```

Then a few contextual suggestions:

```text
Where should I go next?
Find nearby medical help
Explain today's schedule
Tell me about my Dindi
```

Keep the interface warm and quiet.

---

# 56. AI Chat Composition

Desktop:

```text
Conversation column
650–760px wide

Context panel
optional
```

Do not stretch messages to the entire screen.

Use generous vertical rhythm.

---

# 57. Schedule / Calendar

The schedule should use an editorial timeline rather than a generic SaaS calendar whenever possible.

Example:

```text
JUNE 28

05:30
Start

08:15
Rest point

11:45
Medical camp

14:00
Dindi check-in

18:30
Night halt
```

The active/upcoming stage should be highlighted with saffron.

---

# 58. Maps

Map pages need a strict visual hierarchy.

Map controls should be:

- Small.
- Floating.
- Clearly grouped.
- High contrast.

Avoid huge map control panels.

Use the map as a working canvas, not a decoration.

---

# 59. History

Incident history should feel archival.

Use:

```text
Date
Incident
Location
Varkari
Severity
Response time
Outcome
```

Allow filtering by:

```text
Date
Severity
Dindi
Status
Coordinator
Medical status
```

---

# 60. Tables

Tables should be quiet and spacious.

Header:

```text
12–14px
uppercase
slightly tracked
muted
```

Rows:

```text
14–16px
64–72px minimum row height
```

Use separators, not boxed cells everywhere.

Avoid vertical borders unless necessary.

---

# 61. Cards

Cards are for grouped concepts.

Good card:

```text
one idea
one hierarchy
one action
```

Bad card:

```text
card inside card inside card
```

Avoid nesting cards more than once.

---

# 62. Empty States

Empty state format:

```text
Small icon
Large statement
One-line explanation
Optional action
```

Example:

```text
No active emergencies

Everything is currently clear.

[View incident history]
```

Don't use giant illustrations for every empty state.

---

# 63. Loading States

Use skeletons only where content layout is known.

Otherwise use subtle loading indicators.

Avoid large spinners in the middle of the page.

Realtime dashboards should visibly communicate connection state.

Example:

```text
● Live
Last synced 8 sec ago
```

---

# 64. Error States

Error design should be calm.

Example:

```text
We couldn't load this incident.

Your last synchronized information is still available.

[Retry]
```

Avoid:

```text
ERROR!!!
```

---

# 65. Offline States

Because offline behavior is core to the product, offline status must be intentionally designed.

Use:

```text
Offline
Last synchronized 4 min ago
```

rather than a browser-style red warning everywhere.

For native-mobile-related demonstrations, indicate:

```text
Offline mode active
Emergency data available locally
```

---

# 66. Realtime Indicator

For coordinator/medical dashboards:

```text
● Live
```

or:

```text
● Connected
```

When disconnected:

```text
○ Reconnecting...
```

When stale:

```text
Last synced 2m ago
```

Do not use pulsing neon indicators.

---

# 67. Motion Principles

Motion should communicate:

- State.
- Direction.
- Hierarchy.
- Continuity.

Never animate because "it looks cool."

---

# 68. Animation Timing

Recommended:

```text
Micro interaction: 120–180ms
Button transition: 160–220ms
Panel transition: 240–320ms
Page transition: 400–600ms
Hero reveal: 700–1000ms
```

Use easing such as:

```text
cubic-bezier(0.22, 1, 0.36, 1)
```

---

# 69. Hero Motion

Use subtle motion:

- Headline reveals upward.
- Background image moves slightly.
- CTA fades in.
- Small capability labels appear sequentially.

Do not animate every element independently.

---

# 70. Dashboard Motion

Keep dashboard motion minimal.

Good:

- New SOS enters with a 200–300ms highlight.
- Map marker appears.
- Status transition animates.
- Toast enters softly.

Bad:

- Entire dashboard moving on every realtime update.
- Constant pulsing.
- Repeated flashing.
- Bouncing emergency cards.

Emergency data must remain readable.

---

# 71. SOS Animation

When an SOS is created:

```text
Button
  ↓
Confirmed
  ↓
Searching for connection
  ↓
Alert sent / queued
```

Use a clear state machine.

Never immediately show "Help is on the way" unless the system actually confirms responder acknowledgement.

---

# 72. Accessibility

Target WCAG AA-level usability.

Rules:

- Body text must have strong contrast.
- Interactive controls must have visible focus states.
- Minimum practical touch target: 44×44px.
- Do not rely on color alone.
- Support keyboard navigation on web.
- Form controls require visible labels.
- Status indicators require text.
- Reduced-motion preference must be respected.
- Screen-reader labels should exist for icon buttons.
- Emergency actions must be keyboard accessible.

---

# 73. Elderly-Friendly UX

This is especially important for Varkaris.

Do:

- Large text.
- High contrast.
- Very clear labels.
- Large touch targets.
- Simple sentence structure.
- Few choices per screen.
- Persistent SOS access.
- Marathi/Hindi support.

Avoid:

- Tiny icon-only controls.
- Hover-only interactions.
- Dense navigation.
- Gesture-only functionality.
- Low-contrast placeholder text.

---

# 74. Responsive Design

## Desktop

Primary target:

```text
1440px
```

Also support:

```text
1280px
1024px
```

## Tablet

Support:

```text
768px+
```

## Mobile

Support:

```text
375px+
```

At mobile width:

- Sidebar becomes drawer/bottom navigation.
- 12-column grid collapses.
- Two-column data sections stack.
- Maps become full-width.
- Tables become list/card representations where necessary.
- Hero image moves below the copy.

---

# 75. Mobile Web Navigation

For authenticated product views, use:

```text
Home
Alerts
Map
People
Profile
```

Role-specific navigation can replace items.

Do not force desktop navigation into a tiny mobile sidebar.

---

# 76. Forms

Forms should look like calm government-grade service interfaces, but more refined.

Use:

```text
Label
Input
Hint
Error
```

Never:

```text
placeholder-only label
```

Input height:

```text
48–52px
```

Focus:

```text
2px visual focus ring
```

---

# 77. Phone / OTP UI

The OTP screen should feel especially trustworthy.

Structure:

```text
Verify your number

+91 98XXXXXX21

Enter the 6-digit code

[ _ ][ _ ][ _ ][ _ ][ _ ][ _ ]

Didn't receive it?
Resend in 00:23
```

Avoid clutter.

---

# 78. Icons

Use a single icon family throughout.

Recommended:

```text
Lucide
```

Rules:

- 1.5–2px stroke.
- Consistent size.
- No mixed icon styles.
- Do not use emojis as production UI icons.

Emergency semantics can use carefully selected Lucide icons.

---

# 79. Photography / Illustration

Photography should feel:

- Real.
- Warm.
- Human.
- Documentary.
- Respectful.

Prefer:

- Varkaris walking.
- Dindi groups.
- Medical responders.
- Indian landscapes.
- Human moments.

Avoid stereotypical stock photos.

---

# 80. Background Image Handling

The supplied image has a large quiet left area and rich visual detail on the right.

This is ideal for:

```text
Hero text on left
Image storytelling on right
```

Do not crop away the important right-side Wari/tree/architecture content.

Preserve the original visual balance.

---

# 81. Decorative Geometry

Use extremely subtle geometry if needed:

```text
Thin arcs
Fine line grids
Architectural gateway motifs
Very low-opacity dot patterns
```

Opacity:

```text
2–6%
```

The decoration should be discovered, not noticed first.

---

# 82. Avoid Decorative Noise

Never combine:

- Large gradient.
- Background illustration.
- Floating blobs.
- Pattern.
- Glow.
- Multiple badges.

on the same area.

One visual idea per section.

---

# 83. Component Consistency

Every component must have a defined:

- Default.
- Hover.
- Focus.
- Active.
- Disabled.
- Loading.
- Error state where relevant.

Do not create one-off button styles.

---

# 84. Button System

Use only three main levels:

### Primary

Main action.

```text
Saffron filled
```

### Secondary

Supporting action.

```text
Outlined / neutral
```

### Tertiary

Low-priority link.

```text
Text + arrow
```

Emergency actions have a separate semantic style.

---

# 85. Badges

Use badges only for:

- Status.
- Severity.
- Role.
- Connection.

Never use decorative badges as marketing ornaments.

Preferred:

```text
ACTIVE
CRITICAL
WITH GROUP
OFFLINE
```

---

# 86. Toasts

Use for lightweight confirmations:

```text
Broadcast sent
Profile updated
SOS acknowledged
```

Do not use to communicate critical emergency information only.

Critical information belongs in the page/state itself.

---

# 87. Modal Design

Keep modals narrow:

```text
420–560px
```

Use for:

- Confirmations.
- Destructive actions.
- Focused workflows.

Avoid putting entire dashboards inside modals.

---

# 88. Emergency Confirmation Modal

Example:

```text
Send emergency alert?

This will notify nearby coordinators
and begin the response workflow.

[Cancel] [Send SOS]
```

No confusing secondary copy.

---

# 89. Medical Data Visual Hierarchy

Highest priority:

```text
Blood group
Severe allergies
Critical conditions
Current medication
```

Secondary:

```text
Age
Gender
Organ donor
Notes
```

Make critical facts visually obvious.

---

# 90. Sensitive Information

Never expose sensitive information just because it looks good on a card.

UI must follow backend access controls.

Potentially sensitive fields:

- Phone numbers.
- Medical notes.
- Emergency contacts.
- Exact location.
- Patient status.

Use masked values where appropriate.

---

# 91. Landing Page Footer

Footer should feel like an editorial close.

Suggested:

```text
VariRaksha

Protection that reaches you
even when the network doesn't.

Product
How it works
Emergency ID
For Coordinators

Resources
Documentation
Architecture
Contact

Legal
Privacy
Terms

© 2026 VariRaksha
```

Use a deep ink background.

---

# 92. Footer Visual

Use:

```text
Background: #172238
Text: #F5E8D4
Muted: #AEB3B8
Accent: #D97732
```

A very subtle watermark/line-art motif may sit behind the footer.

Opacity:

```text
2–4%
```

---

# 93. Dashboard vs Landing Visual Split

### Landing

```text
Warm
Editorial
Cinematic
Large typography
Minimal navigation
Story-driven
```

### Product Dashboard

```text
Calm
Operational
Dense but spacious
Persistent navigation
Real-time
Task-driven
```

They must feel like the same product, but not the same page template.

---

# 94. Data Density Rules

For dashboards:

- Prefer one strong visual anchor per viewport.
- Keep 3–5 major modules visible.
- Avoid 12 tiny KPI cards.
- Give tables room to breathe.
- Prioritize live information.
- Move secondary information into drill-downs.

---

# 95. KPI Cards

Use sparingly.

Good:

```text
04
Active SOS
```

Better than:

```text
04
+17.4%
↑
Active SOS incidents this week
```

Avoid generic SaaS growth metrics.

The numbers should describe operational reality.

---

# 96. Copywriting Style

Copy should be:

- Direct.
- Human.
- Confident.
- Short.
- Calm.

Prefer:

```text
Help is being coordinated.
```

over:

```text
Your emergency request has successfully been processed by our advanced AI-powered emergency response infrastructure.
```

---

# 97. Voice

VariRaksha speaks like a competent human coordinator.

Not:

```text
ALERT!!! 🚨🚨
```

Instead:

```text
Emergency alert received.
Coordinator acknowledgement is pending.
```

---

# 98. Page Naming

Use simple nouns.

Good:

```text
Overview
Alerts
Map
History
People
Medical
Schedule
```

Avoid:

```text
Emergency Operations Intelligence Center
```

unless used as a marketing phrase.

---

# 99. Route-Level UI Intent

```text
/
Marketing / product story

/p/[id]
Public emergency card

/dashboard
Coordinator operational view

/medical
Medical staff queue/profile

/dindi
Dindi leader management

/admin
Administrative management

/schedule
Wari schedule

/ai
AI assistant
```

Actual route architecture may vary during implementation, but visual intent should remain consistent.

---

# 100. Landing Page Responsive Behavior

## Desktop

Use asymmetry and large image fields.

## Mobile

Do not simply scale desktop down.

Recompose:

```text
Heading
Copy
CTA
Image
Stats
Sections
```

The mobile experience should remain editorial rather than becoming a dense stack of cards.

---

# 101. Component Naming by Visual Intent

Components should conceptually map to design roles:

```text
PrimaryButton
SecondaryButton
StatusBadge
Metric
SectionHeading
EmergencyAlert
MedicalCard
Timeline
MapPanel
DataTable
EmptyState
LoadingState
```

The implementation may use different code organization, but each component should have one visual responsibility.

---

# 102. Background and Surface Hierarchy

Use only a few surface levels.

```text
Level 0
Parchment background

Level 1
White card

Level 2
Elevated white card

Level 3
Dark operational surface
```

Do not create 8 shades of background.

---

# 103. Z-Index Hierarchy

Keep layering predictable:

```text
Base content
10  sticky elements
20  dropdowns
30  popovers
40  modal backdrop
50  modal
60  emergency confirmation / critical overlay
```

Emergency UI should not accidentally sit beneath normal navigation.

---

# 104. Focus States

Every keyboard-interactive element should have:

```text
2px focus ring
3–4px visual separation
```

The ring should use saffron/ink with enough contrast.

Do not remove browser focus styles without replacing them.

---

# 105. Scroll Behavior

Landing page:

- Smooth section navigation.
- Subtle reveal animations.

Dashboard:

- Normal fast scrolling.
- Sticky navigation.
- Independent scroll regions only where useful.

Never make a dashboard feel like a cinematic website.

---

# 106. Image Aspect Ratios

Prefer:

```text
Hero: 16:10 / variable wide
Feature: 4:3
Portrait card: 3:4
Medical ID preview: approximately 4:5
```

Avoid inconsistent random ratios.

---

# 107. QR Code Visual Treatment

QR codes should have:

- High contrast.
- Quiet zone.
- White background.
- Enough physical size to scan.
- Clear "Scan for Medical ID" label.

Never place a QR directly on a busy photograph.

---

# 108. Medical ID Print Preview

The web should be able to show a print-friendly emergency card.

Design:

```text
Cream background
Dark text
Saffron accent
Clear QR
Medical fields
Emergency contact
```

It should remain legible when printed in grayscale.

---

# 109. Role Selector

If role selection is required on the web, use large, descriptive options:

```text
Varkari
Stay safe during the Wari

Dindi Leader
Manage your group

Coordinator
Respond to emergencies

Medical Staff
Manage medical response

Admin
Manage VariRaksha
```

Avoid a dense dropdown for role onboarding.

---

# 110. Login Experience

Login should feel like a doorway into the system, not an enterprise portal.

Composition:

```text
Left:
Small mission statement / image

Right:
Login card
```

On mobile:

```text
Logo
Headline
Login
```

Keep it short.

---

# 111. Dashboard Welcome State

After login:

```text
Good morning.

You have 3 active incidents requiring attention.
```

The sentence should change based on role.

---

# 112. Coordinator Priority Logic

The UI priority order should be:

```text
Critical emergency
↓
Unacknowledged alerts
↓
People needing medical handoff
↓
Active response
↓
History / analytics
```

Do not put analytics above active incidents.

---

# 113. Medical Staff Priority Logic

```text
Critical trigger queue
↓
Patients currently waiting
↓
Hospital transfer
↓
Medical profile
↓
History
```

---

# 114. Dindi Leader Priority Logic

```text
Group safety
↓
Separated/lost members
↓
Urgent broadcasts
↓
Schedule
↓
AI assistance
```

---

# 115. Admin Priority Logic

```text
Data management
↓
User records
↓
Emergency information
↓
Role management
↓
System overview
```

---

# 116. Varkari Priority Logic

```text
SOS
↓
Medical ID
↓
Schedule
↓
Dindi status
↓
AI
```

The interface should make this hierarchy obvious.

---

# 117. Emergency Contact Priority Logic

```text
Current condition
↓
Location
↓
SOS status
↓
Dindi/group status
↓
Coordinator/medical updates
```

---

# 118. Notification Design

Notifications should answer:

```text
WHAT happened?
WHO is affected?
WHAT is the current status?
WHAT should I do?
```

Example:

```text
Ramesh needs assistance.

Emergency alert is active near Wakhari.
A coordinator is responding.

[View status]
```

---

# 119. Browser Permissions / Location

When location is needed, explain why before requesting permission.

Example:

```text
Share your location

We use your location to help responders
find you during an emergency.

[Allow location]
```

Do not trigger permission prompts without context.

---

# 120. Visual QA Checklist

Before considering a page finished, check:

### Typography
- Is there a clear hierarchy?
- Are line lengths controlled?
- Are headings too heavy?
- Is Indic text readable?

### Spacing
- Does the page breathe?
- Are sections separated enough?
- Are controls aligned?

### Color
- Is saffron being overused?
- Are semantic colors distinguishable?
- Is contrast sufficient?

### Components
- Are states complete?
- Are buttons consistent?
- Are cards overused?

### Motion
- Does animation communicate something?
- Is it subtle?
- Does reduced motion work?

### Responsive
- Does the layout genuinely recompose?
- Is mobile usable with one hand?
- Are tables transformed appropriately?

---

# 121. "Elite Taste" Rules

These rules should be enforced throughout implementation.

### Rule 1

**One dominant idea per viewport.**

### Rule 2

**Whitespace is a feature, not wasted space.**

### Rule 3

**Use fewer colors than you think you need.**

### Rule 4

**Use fewer components than you think you need.**

### Rule 5

**Never make something a card just because you can.**

### Rule 6

**Saffron is an accent, not a background.**

### Rule 7

**Emergency UI should feel urgent through hierarchy, not visual chaos.**

### Rule 8

**Use typography to create character before adding decoration.**

### Rule 9

**Cultural references must feel intentional and modern.**

### Rule 10

**The UI should still look good with animations disabled.**

### Rule 11

**A screenshot of any page should feel coherent with every other page.**

### Rule 12

**Every pixel should have a reason to exist.**

---

# 122. What the Design Should Never Look Like

Avoid:

```text
Generic AI SaaS landing page
Generic hospital dashboard
Generic Bootstrap admin panel
Neon emergency dashboard
Overly spiritual / devotional website
Orange-everything Indian startup
Glassmorphism template
Card grid overload
Emoji-based UI
Excessive gradients
Tiny typography
Dark mode everywhere
```

---

# 123. Final Visual Direction

The finished website should feel like:

> **Sarvam-inspired editorial Indian modernism + mission-critical emergency software.**

Visual equation:

```text
Indian warmth
        +
Editorial typography
        +
Modern product discipline
        +
Emergency clarity
        +
Real operational data
        =
VariRaksha
```

The landing page should make someone stop scrolling.

The dashboard should make a coordinator immediately know what to do.

The medical interface should make critical information instantly legible.

The Varkari interface should feel effortless.

The emergency contact interface should feel reassuring.

---

# 124. Implementation Priority

Build the visual system in this order:

```text
1. Fonts
2. Color tokens
3. Typography scale
4. Layout/grid
5. Buttons + inputs
6. Status/severity system
7. Navigation
8. Landing page
9. Public Medical ID
10. Coordinator dashboard
11. Medical dashboard
12. Dindi Leader dashboard
13. Admin
14. Emergency Contact experience
15. Responsive behavior
16. Motion
17. Accessibility
18. Final visual polish
```

Do not polish pages independently before the global design tokens are established.

---

# 125. Single Source of Truth

When there is a design question not explicitly answered elsewhere:

1. Prefer simplicity.
2. Prefer hierarchy over decoration.
3. Prefer whitespace over another component.
4. Prefer typography over another visual effect.
5. Prefer warm neutrals over another color.
6. Prefer explicit labels over icons-only UI.
7. Prefer calm emergency communication over alarmist visuals.
8. Prefer consistency with this document over local one-off decisions.

The final result should feel as though **one senior product designer made every screen deliberately**.
