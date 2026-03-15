/**
 * Privacy Policy Page
 * Public page with privacy policy and data handling information
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Lock } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <title>Privacy Policy - astruXo</title>
      <meta
        name="description"
        content="Privacy Policy for astruXo. Learn how we collect, use, and protect your personal information."
      />

      {/* Back Button */}
      <Link to="/">
        <Button variant="ghost" size="sm" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </Link>

      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-xl text-muted-foreground">
          Your privacy is important to us
        </p>
      </div>

      {/* Introduction */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <p className="text-muted-foreground leading-relaxed mb-4">
            This Privacy Policy explains how astruXo collects, uses, shares, and
            protects your personal information. By using our platform, you consent to the practices
            described in this policy.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            <strong>astruXo app and astruxo.net are owned and operated by Santana Enterprises LLC.</strong>
          </p>
        </CardContent>
      </Card>

      {/* Privacy Sections */}
      <div className="space-y-6">
        {/* Information We Collect */}
        <Card>
          <CardHeader>
            <CardTitle>1. Information We Collect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Information You Provide:</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Account information (email, username, password)</li>
                <li>Profile information (display name, bio, avatar)</li>
                <li>Content you post (posts, comments, streams)</li>
                <li>Payment information (processed securely by Stripe)</li>
                <li>Communications with us (support messages, feedback)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Information Collected Automatically:
              </h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Usage data (pages visited, features used, time spent)</li>
                <li>Cookies and similar tracking technologies</li>
                <li>Location data (approximate, based on IP address)</li>
                <li>Stream analytics (viewer count, watch time)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Information from Third Parties:
              </h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Authentication providers (Firebase)</li>
                <li>Payment processors (Stripe)</li>
                <li>Analytics services</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* How We Use Your Information */}
        <Card>
          <CardHeader>
            <CardTitle>2. How We Use Your Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>We use your information to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide and maintain the platform</li>
              <li>Process your transactions and payments</li>
              <li>Personalize your experience</li>
              <li>Send you notifications and updates</li>
              <li>Improve our services and develop new features</li>
              <li>Ensure security and prevent fraud</li>
              <li>Comply with legal obligations</li>
              <li>Communicate with you about your account</li>
              <li>Analyze usage patterns and trends</li>
            </ul>
          </CardContent>
        </Card>

        {/* Information Sharing */}
        <Card>
          <CardHeader>
            <CardTitle>3. How We Share Your Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>We may share your information with:</p>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Service Providers:</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Hosting and infrastructure providers</li>
                <li>Payment processors (Stripe)</li>
                <li>Analytics services</li>
                <li>Email service providers</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Public Information:</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Your profile information (username, display name, bio, avatar)</li>
                <li>Your posts, comments, and streams</li>
                <li>Your follower/following lists</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Legal Requirements:</h3>
              <p>
                We may disclose your information if required by law, court order, or government
                request, or to protect our rights and safety.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Business Transfers:</h3>
              <p>
                In the event of a merger, acquisition, or sale of assets, your information may be
                transferred to the new owner.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data Security */}
        <Card>
          <CardHeader>
            <CardTitle>4. Data Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>We take security seriously and implement measures to protect your information:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Encryption of data in transit (HTTPS/SSL)</li>
              <li>Secure password hashing</li>
              <li>Regular security audits</li>
              <li>Access controls and authentication</li>
              <li>Secure payment processing (PCI-DSS compliant)</li>
            </ul>
            <p className="mt-4">
              However, no method of transmission over the internet is 100% secure. We cannot
              guarantee absolute security of your information.
            </p>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card>
          <CardHeader>
            <CardTitle>5. Your Rights and Choices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and data</li>
              <li>Export your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Disable cookies (may affect functionality)</li>
              <li>Object to certain data processing</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, contact us at{' '}
              <a href="mailto:info@astruXo.net" className="text-primary hover:underline">
                info@astruXo.net
              </a>
            </p>
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card>
          <CardHeader>
            <CardTitle>6. Data Retention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>We retain your information for as long as:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Your account is active</li>
              <li>Needed to provide services</li>
              <li>Required by law or for legal purposes</li>
              <li>Necessary for legitimate business purposes</li>
            </ul>
            <p className="mt-4">
              When you delete your account, we will delete or anonymize your personal information
              within 30 days, except where retention is required by law.
            </p>
          </CardContent>
        </Card>

        {/* Cookies */}
        <Card>
          <CardHeader>
            <CardTitle>7. Cookies and Tracking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>We use cookies and similar technologies to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Keep you logged in</li>
              <li>Remember your preferences</li>
              <li>Analyze usage and performance</li>
              <li>Provide personalized content</li>
            </ul>
            <p className="mt-4">
              You can control cookies through your browser settings. Disabling cookies may affect
              platform functionality.
            </p>
          </CardContent>
        </Card>

        {/* Children's Privacy */}
        <Card>
          <CardHeader>
            <CardTitle>8. Children's Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Our platform is not intended for children under 13. We do not knowingly collect
              personal information from children under 13.
            </p>
            <p>
              If you believe we have collected information from a child under 13, please contact us
              immediately at{' '}
              <a href="mailto:info@astruXo.net" className="text-primary hover:underline">
                info@astruXo.net
              </a>
            </p>
          </CardContent>
        </Card>

        {/* International Users */}
        <Card>
          <CardHeader>
            <CardTitle>9. International Data Transfers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Your information may be transferred to and processed in countries other than your own.
              These countries may have different data protection laws.
            </p>
            <p>
              By using our platform, you consent to the transfer of your information to these
              countries. We take steps to ensure your information receives adequate protection.
            </p>
          </CardContent>
        </Card>

        {/* Changes to Policy */}
        <Card>
          <CardHeader>
            <CardTitle>10. Changes to This Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant
              changes by:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Posting the new policy on this page</li>
              <li>Updating the "Last Updated" date</li>
              <li>Sending you an email notification (for material changes)</li>
            </ul>
            <p className="mt-4">
              Your continued use of the platform after changes constitutes acceptance of the updated
              policy.
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>11. Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>If you have questions about this Privacy Policy or our data practices:</p>
            <ul className="list-none space-y-2 ml-4">
              <li>
                Email:{' '}
                <a href="mailto:info@astruXo.net" className="text-primary hover:underline">
                  info@astruXo.net
                </a>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>Last updated: March 2026</p>
        <p className="mt-2">
          This policy is effective as of the date above and applies to all users of astruXo.
        </p>
        <p className="mt-4 font-semibold">
          astruXo app and astruxo.net are owned and operated by Santana Enterprises LLC.
        </p>
      </div>
    </div>
  );
}
