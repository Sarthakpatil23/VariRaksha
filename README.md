# VariRaksha

> An offline-first emergency safety app for pilgrims.

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- Expo Go app on iOS/Android device or an emulator/simulator

### Running the App
To start the Expo development server:

```bash
npx expo start
```

---

## Project Structure

```text
variraksha/
├── app/
│   ├── navigation/         # Navigation setup (RootNavigator, OnboardingStack, MainTabs)
│   ├── screens/            # App screens organized by feature flow
│   │   ├── onboarding/     # 10 Onboarding flow screens (Language, Role, Mobile, OTP, etc.)
│   │   ├── home/           # Main Home & SOS screen
│   │   ├── medical/        # Medical ID screen
│   │   ├── dindi/          # Dindi group management screen
│   │   └── settings/       # App settings screen
│   ├── components/         # Reusable UI component stubs (PrimaryButton, LanguageCard, ProfileCard)
│   ├── constants/          # Brand design tokens (saffron, maroon, cream palette, typography, spacing)
│   ├── lib/                # Client initializations (Supabase client stub, SQLite connection helper)
│   ├── types/              # TypeScript interfaces (Pilgrim, DindiGroup, MedicalProfile, EmergencyContact)
│   └── locales/            # i18n setup with en, hi, and mr translation files
├── assets/                 # App assets (images and icons)
├── App.tsx                 # Root application component
├── app.json                # Expo project configuration
├── tsconfig.json           # TypeScript configuration
├── .eslintrc.js            # ESLint code quality configuration
├── .prettierrc             # Prettier code formatting configuration
└── package.json            # Project dependencies and npm scripts
```
