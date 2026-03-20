import React from 'react';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="font-sans text-charcoal bg-off-white min-h-screen">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-24">
        <div className="bg-white rounded-2xl shadow-soft-xl p-8 md:p-12 border border-gray-100">
          <h1 className="text-3xl md:text-4xl font-bold text-charcoal mb-4">Terms of Service</h1>
          <p className="text-warm-gray text-sm mb-8">Last updated: March 2026</p>

          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-bold text-charcoal mb-2">1. Acceptance of Terms</h2>
              <p className="text-gray-600">
                By accessing or using NestFinder, you agree to be bound by these Terms. If you do not agree, please do not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-charcoal mb-2">2. User Accounts</h2>
              <p className="text-gray-600">
                You are responsible for maintaining the confidentiality of your account and for all activities under your account. You must provide accurate and complete information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-charcoal mb-2">3. Listings and Content</h2>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>You retain ownership of any content you post (listings, photos, etc.)</li>
                <li>You are solely responsible for the accuracy and legality of your listings</li>
                <li>Prohibited items: fraudulent, misleading, illegal, or infringing content</li>
                <li>We reserve the right to remove any content that violates these terms</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-charcoal mb-2">4. User Interactions</h2>
              <p className="text-gray-600">
                NestFinder facilitates contact between users but is not involved in any actual transactions. You agree to exercise caution and verify information before any exchange.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-charcoal mb-2">5. Intellectual Property</h2>
              <p className="text-gray-600">
                The NestFinder name, logo, and design are our property. You may not use them without permission.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-charcoal mb-2">6. Termination</h2>
              <p className="text-gray-600">
                We may suspend or terminate your account if you violate these terms. You may delete your account at any time from your profile page.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-charcoal mb-2">7. Limitation of Liability</h2>
              <p className="text-gray-600">
                NestFinder is provided "as is" without warranties. We are not liable for any damages arising from your use of the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-charcoal mb-2">8. Changes to Terms</h2>
              <p className="text-gray-600">
                We may update these terms from time to time. Continued use of the service after changes constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-charcoal mb-2">9. Contact</h2>
              <p className="text-gray-600">
                For questions, email us at <a href="mailto:support@nestfinder.com" className="text-brick-primary hover:underline">support@nestfinder.com</a>.
              </p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-200">
            <button
              onClick={() => navigate(-1)}
              className="text-brick-primary hover:text-brick-secondary font-semibold flex items-center gap-2"
            >
              <i className="fas fa-arrow-left"></i> Go Back
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsOfService;