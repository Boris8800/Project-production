'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/premium-travel/Header';
import Footer from '../../components/premium-travel/Footer';

export default function PrivacyPage() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const toggleDarkMode = () => setIsDarkMode((v) => !v);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">
      <Header
        toggleDarkMode={toggleDarkMode}
        isDarkMode={isDarkMode}
        onHomeClick={() => router.push('/')}
        showNav={false}
        onBookNowClick={() => router.push('/')}
      />

      <main className="flex-grow">
        <div className="py-20 px-6 border-b border-gray-100 dark:border-white/5 text-center">
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 font-display tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-text-muted dark:text-slate-200 max-w-2xl mx-auto font-medium">Last updated: December 31, 2025</p>
        </div>

        <div className="max-w-4xl mx-auto py-24 px-6 md:px-12 space-y-16">
          <section>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 font-display">1. Introduction</h2>
            <div className="text-slate-600 dark:text-slate-200 leading-relaxed space-y-4 text-sm font-medium">
              <p>
                At TransferLane, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you use our premium chauffeur and intercity travel services.
              </p>
              <p>
                By using our services, you consent to the data practices described in this policy. We encourage you to read this policy carefully to understand our views and practices regarding your personal data.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 font-display">2. Information We Collect</h2>
            <div className="text-slate-600 dark:text-slate-200 leading-relaxed space-y-4 text-sm font-medium">
              <p className="font-bold text-slate-900 dark:text-white">2.1 Personal Information</p>
              <p>
                When you book our services, we collect personal information that may include:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Full name and title</li>
                <li>Email address and phone number</li>
                <li>Billing and payment information</li>
                <li>Pick-up and drop-off locations</li>
                <li>Travel preferences and special requirements</li>
                <li>Account credentials (username and encrypted password)</li>
              </ul>

              <p className="font-bold text-slate-900 dark:text-white mt-6">2.2 Automatically Collected Information</p>
              <p>
                When you access our website or mobile application, we automatically collect:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>IP address and device information</li>
                <li>Browser type and operating system</li>
                <li>Pages visited and time spent on our platform</li>
                <li>Referring URLs and search terms</li>
                <li>Location data (with your permission)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>

              <p className="font-bold text-slate-900 dark:text-white mt-6">2.3 Service Usage Data</p>
              <p>
                During and after your journey, we collect:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Trip details (routes, duration, distance)</li>
                <li>Payment transaction information</li>
                <li>Communication records between you and our team</li>
                <li>Feedback and ratings</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 font-display">3. How We Use Your Information</h2>
            <div className="text-slate-600 dark:text-slate-200 leading-relaxed space-y-4 text-sm font-medium">
              <p>
                We use the collected information for the following purposes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Service Delivery:</strong> To process bookings, coordinate transportation, and ensure timely service</li>
                <li><strong>Communication:</strong> To send booking confirmations, updates, and respond to your inquiries</li>
                <li><strong>Payment Processing:</strong> To handle transactions securely and issue invoices</li>
                <li><strong>Personalization:</strong> To remember your preferences and enhance your experience</li>
                <li><strong>Security:</strong> To protect against fraud, unauthorized access, and other security threats</li>
                <li><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes</li>
                <li><strong>Service Improvement:</strong> To analyze usage patterns and improve our platform and services</li>
                <li><strong>Marketing:</strong> To send promotional offers (with your consent, where required)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 font-display">4. Information Sharing and Disclosure</h2>
            <div className="text-slate-600 dark:text-slate-200 leading-relaxed space-y-4 text-sm font-medium">
              <p>
                We respect your privacy and only share your information in the following circumstances:
              </p>
              
              <p className="font-bold text-slate-900 dark:text-white">4.1 Service Providers</p>
              <p>
                We may share your information with trusted third-party service providers who assist us in operating our business, including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Payment processors (Stripe, PayPal)</li>
                <li>Cloud hosting services (AWS, Google Cloud)</li>
                <li>Customer support platforms</li>
                <li>Analytics and marketing tools</li>
                <li>Background check services for chauffeur verification</li>
              </ul>
              <p>
                These providers are contractually obligated to protect your data and use it only for specified purposes.
              </p>

              <p className="font-bold text-slate-900 dark:text-white mt-6">4.2 Chauffeurs</p>
              <p>
                We share necessary information with assigned chauffeurs to facilitate your journey, including your name, contact number, and pick-up/drop-off locations. Our chauffeurs are bound by strict confidentiality agreements.
              </p>

              <p className="font-bold text-slate-900 dark:text-white mt-6">4.3 Legal Requirements</p>
              <p>
                We may disclose your information when required by law, court order, or government regulation, or when we believe disclosure is necessary to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Comply with legal obligations</li>
                <li>Protect our rights and property</li>
                <li>Prevent fraud or security threats</li>
                <li>Protect the safety of our users and the public</li>
              </ul>

              <p className="font-bold text-slate-900 dark:text-white mt-6">4.4 Business Transfers</p>
              <p>
                In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity, subject to the same privacy protections.
              </p>

              <p className="font-bold text-slate-900 dark:text-white mt-6">4.5 With Your Consent</p>
              <p>
                We may share your information for other purposes with your explicit consent.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 font-display">5. Data Security</h2>
            <div className="text-slate-600 dark:text-slate-200 leading-relaxed space-y-4 text-sm font-medium">
              <p>
                We implement industry-standard security measures to protect your personal information:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Encryption:</strong> All data transmission uses SSL/TLS encryption</li>
                <li><strong>Secure Storage:</strong> Personal data is stored in encrypted databases with restricted access</li>
                <li><strong>Access Controls:</strong> Only authorized personnel can access sensitive information</li>
                <li><strong>Regular Audits:</strong> We conduct security assessments and penetration testing</li>
                <li><strong>Incident Response:</strong> We have protocols in place to respond to security breaches</li>
                <li><strong>Payment Security:</strong> We are PCI DSS compliant for handling payment card data</li>
              </ul>
              <p className="mt-4">
                While we strive to protect your information, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security but continuously work to enhance our protective measures.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 font-display">6. Your Privacy Rights</h2>
            <div className="text-slate-600 dark:text-slate-200 leading-relaxed space-y-4 text-sm font-medium">
              <p>
                Depending on your location, you may have the following rights regarding your personal data:
              </p>
              
              <p className="font-bold text-slate-900 dark:text-white">6.1 Access and Portability</p>
              <p>
                You have the right to request a copy of the personal information we hold about you in a structured, commonly used format.
              </p>

              <p className="font-bold text-slate-900 dark:text-white mt-6">6.2 Correction</p>
              <p>
                You can request that we correct any inaccurate or incomplete personal information.
              </p>

              <p className="font-bold text-slate-900 dark:text-white mt-6">6.3 Deletion</p>
              <p>
                You may request deletion of your personal data, subject to certain legal exceptions (e.g., financial records retention requirements).
              </p>

              <p className="font-bold text-slate-900 dark:text-white mt-6">6.4 Restriction and Objection</p>
              <p>
                You can request to restrict processing of your data or object to certain types of processing, such as direct marketing.
              </p>

              <p className="font-bold text-slate-900 dark:text-white mt-6">6.5 Withdraw Consent</p>
              <p>
                Where we rely on consent to process your data, you can withdraw that consent at any time.
              </p>

              <p className="font-bold text-slate-900 dark:text-white mt-6">6.6 Exercising Your Rights</p>
              <p>
                To exercise any of these rights, please contact us at privacy@transferlane.com. We will respond to your request within 30 days.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 font-display">7. Cookies and Tracking Technologies</h2>
            <div className="text-slate-600 dark:text-slate-200 leading-relaxed space-y-4 text-sm font-medium">
              <p>
                We use cookies and similar technologies to enhance your experience:
              </p>
              
              <p className="font-bold text-slate-900 dark:text-white">7.1 Types of Cookies</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Essential Cookies:</strong> Required for basic site functionality</li>
                <li><strong>Performance Cookies:</strong> Help us understand how visitors use our site</li>
                <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
                <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements</li>
              </ul>

              <p className="font-bold text-slate-900 dark:text-white mt-6">7.2 Managing Cookies</p>
              <p>
                You can control cookies through your browser settings. Note that disabling certain cookies may affect site functionality.
              </p>

              <p className="font-bold text-slate-900 dark:text-white mt-6">7.3 Third-Party Analytics</p>
              <p>
                We use services like Google Analytics to analyze site usage. These services may use cookies to collect information about your browsing activities.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 font-display">8. Data Retention</h2>
            <div className="text-slate-600 dark:text-slate-200 leading-relaxed space-y-4 text-sm font-medium">
              <p>
                We retain your personal information for as long as necessary to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide our services and maintain your account</li>
                <li>Comply with legal obligations (e.g., tax and accounting requirements)</li>
                <li>Resolve disputes and enforce our agreements</li>
                <li>Maintain business records for legitimate interests</li>
              </ul>
              <p className="mt-4">
                Generally, we retain booking and payment data for 7 years to comply with UK financial regulations. Marketing data is retained until you opt out or request deletion.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 font-display">9. International Data Transfers</h2>
            <div className="text-slate-600 dark:text-slate-200 leading-relaxed space-y-4 text-sm font-medium">
              <p>
                Your information may be transferred to and processed in countries other than your country of residence. When we transfer data internationally, we ensure appropriate safeguards are in place:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Standard Contractual Clauses approved by the EU Commission</li>
                <li>Adequacy decisions recognizing equivalent data protection standards</li>
                <li>Certification frameworks like Privacy Shield (where applicable)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 font-display">10. Children&apos;s Privacy</h2>
            <div className="text-slate-600 dark:text-slate-200 leading-relaxed space-y-4 text-sm font-medium">
              <p>
                Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately, and we will delete such information.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 font-display">11. Third-Party Links</h2>
            <div className="text-slate-600 dark:text-slate-200 leading-relaxed space-y-4 text-sm font-medium">
              <p>
                Our website may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies before providing any personal information.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 font-display">12. Updates to This Policy</h2>
            <div className="text-slate-600 dark:text-slate-200 leading-relaxed space-y-4 text-sm font-medium">
              <p>
                We may update this Privacy Policy periodically to reflect changes in our practices, technology, or legal requirements. We will notify you of significant changes by:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Posting the updated policy on our website</li>
                <li>Updating the &quot;Last updated&quot; date at the top of this page</li>
                <li>Sending email notifications for material changes (where appropriate)</li>
              </ul>
              <p className="mt-4">
                Your continued use of our services after changes become effective constitutes acceptance of the updated policy.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 font-display">13. Contact Information</h2>
            <div className="text-slate-600 dark:text-slate-200 leading-relaxed space-y-4 text-sm font-medium">
              <p>
                If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-6 mt-4 space-y-2">
                <p><strong className="text-slate-900 dark:text-white">TransferLane Privacy Team</strong></p>
                <p>Email: privacy@transferlane.com</p>
                <p>Phone: +44 (0) 20 XXXX XXXX</p>
                <p>Address: [Your Company Address]</p>
                <p>Data Protection Officer: dpo@transferlane.com</p>
              </div>
              <p className="mt-4">
                If you are located in the UK or EU and are not satisfied with our response, you have the right to lodge a complaint with your local data protection authority.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 font-display">14. Specific Jurisdictions</h2>
            <div className="text-slate-600 dark:text-slate-200 leading-relaxed space-y-4 text-sm font-medium">
              <p className="font-bold text-slate-900 dark:text-white">14.1 UK GDPR Compliance</p>
              <p>
                For users in the United Kingdom, we comply with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018. Our lawful basis for processing includes contract performance, legal obligations, and legitimate interests.
              </p>

              <p className="font-bold text-slate-900 dark:text-white mt-6">14.2 EU GDPR Compliance</p>
              <p>
                For users in the European Union, we comply with the General Data Protection Regulation (GDPR). You have additional rights including the right to lodge a complaint with your supervisory authority.
              </p>

              <p className="font-bold text-slate-900 dark:text-white mt-6">14.3 California Privacy Rights</p>
              <p>
                California residents have specific rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information is collected, the right to delete, and the right to opt-out of the sale of personal information. We do not sell personal information.
              </p>
            </div>
          </section>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-8 mt-12">
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              This Privacy Policy is effective as of December 31, 2025. By using TransferLane services, you acknowledge that you have read and understood this policy.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
