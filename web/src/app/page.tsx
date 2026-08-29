import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { TrustStrip } from '@/components/landing/TrustStrip';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { EmergencyFlowSection } from '@/components/landing/EmergencyFlowSection';
import { RoleEcosystemSection } from '@/components/landing/RoleEcosystemSection';
import { QRMedicalSection } from '@/components/landing/QRMedicalSection';
import { OfflineFirstSection } from '@/components/landing/OfflineFirstSection';
import { DifferentiatorsSection } from '@/components/landing/DifferentiatorsSection';
import { MissionSection } from '@/components/landing/MissionSection';
import { FinalCTASection } from '@/components/landing/FinalCTASection';
import { Footer } from '@/components/layout/Footer';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-parchment flex flex-col selection:bg-saffron selection:text-surface-white">
      {/* 01. Navigation Header */}
      <Navbar />

      {/* 02. Cinematic Hero Section */}
      <HeroSection />

      {/* 03. Capability / Trust Strip */}
      <TrustStrip />

      {/* 04. Problem Narrative */}
      <ProblemSection />

      {/* 05. System Sequence (How VariRaksha Works) */}
      <HowItWorksSection />

      {/* 06. 6-Stage Emergency Response Lifecycle */}
      <EmergencyFlowSection />

      {/* 07. 6-Stakeholder Role Ecosystem */}
      <RoleEcosystemSection />

      {/* 08. Universal QR & Medical ID Showcase */}
      <QRMedicalSection />

      {/* 09. Offline-First Resilience & Sync */}
      <OfflineFirstSection />

      {/* 10. Core Product Differentiators */}
      <DifferentiatorsSection />

      {/* 11. Emotional & Cultural Mission Statement */}
      <MissionSection />

      {/* 12. Final Call to Action */}
      <FinalCTASection />

      {/* 13. Deep Ink Footer */}
      <Footer />
    </main>
  );
}
