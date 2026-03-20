import React from 'react';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="font-sans text-charcoal bg-off-white min-h-screen">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-24">
        <div className="bg-white rounded-2xl shadow-soft-xl p-8 md:p-12 border border-gray-100">
          <h1 className="text-3xl md:text-4xl font-bold text-charcoal mb-4">Privacy Policy</h1>
          <p className="text-warm-gray text-sm mb-8">Last updated: March 2026</p>

          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-bold text-charcoal mb-2">1. Information We Collect</h2>
              <p className="text-gray-600">
                When you use NestFinder, we collect:
              </p>
              <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                <li>Email address and display name (for account creation)</li>
                <li>Phone number (optional, used for contact between users)</li>
                <li>Listing details you post (title, description, photos, videos, location, price)</li>
                <li>Saved homes and notifications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-charcoal mb-2">2. How We Use Your Information</h2>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>To provide and maintain our service</li>
                <li>To connect you with other users (e.g., contact owner, saved homes)</li>
                <li>To improve and personalise your experience</li>
                <li>To communicate with you about your account or listings</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-charcoal mb-2">3. Sharing Your Information</h2>
              <p className="text-gray-600">
                We do not sell your personal data. We may share your information only:
              </p>
              <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                <li>With other users when you contact them or express interest in a listing</li>
                <li>If required by law or to protect our rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-charcoal mb-2">4. Data Security</h2>
              <p className="text-gray-600">
                We implement reasonable security measures to protect your data. However, no method of transmission over the internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-charcoal mb-2">5. Your Rights</h2>
              <p className="text-gray-600">
                You can access, update, or delete your personal information at any time from your profile page. If you need assistance, contact us.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-charcoal mb-2">6. Contact Us</h2>
              <p className="text-gray-600">
                If you have any questions, please email us at <a href="mailto:support@nestfinder.com" className="text-brick-primary hover:underline">support@nestfinder.com</a>.
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

export default PrivacyPolicy;