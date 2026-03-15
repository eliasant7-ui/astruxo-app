/**
 * Terms of Service Page
 * Public page with terms and conditions
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Shield } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <title>Terms of Service - astruXo</title>
      <meta
        name="description"
        content="Terms of Service for astruXo. Read our terms and conditions for using the platform."
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
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
        <p className="text-xl text-muted-foreground">
          Please read these terms carefully before using our platform
        </p>
      </div>

      {/* Introduction */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <p className="text-muted-foreground leading-relaxed mb-4">
            Welcome to astruXo. By accessing or using our service, you agree to be bound
            by these Terms of Service. If you do not agree to these terms, please do not use our
            platform.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            <strong>astruXo app and astruxo.net are owned and operated by Santana Enterprises LLC.</strong>
          </p>
        </CardContent>
      </Card>

      {/* Terms Sections */}
      <div className="space-y-6">
        {/* Acceptance of Terms */}
        <Card>
          <CardHeader>
            <CardTitle>1. Acceptance of Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              By creating an account or using astruXo, you acknowledge that you have
              read, understood, and agree to be bound by these Terms of Service and our Privacy
              Policy.
            </p>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the platform
              after changes constitutes acceptance of the modified terms.
            </p>
          </CardContent>
        </Card>

        {/* Eligibility */}
        <Card>
          <CardHeader>
            <CardTitle>2. Eligibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>To use astruXo, you must:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Be at least 13 years of age (or 18 to stream)</li>
              <li>Have the legal capacity to enter into binding contracts</li>
              <li>Not be prohibited from using the service under applicable laws</li>
              <li>Provide accurate and complete registration information</li>
            </ul>
          </CardContent>
        </Card>

        {/* User Accounts */}
        <Card>
          <CardHeader>
            <CardTitle>3. User Accounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>When you create an account, you agree to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Be responsible for all activities under your account</li>
              <li>Not share your account with others</li>
            </ul>
          </CardContent>
        </Card>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle>4. User Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              You retain ownership of content you post on astruXo. However, by posting
              content, you grant us a worldwide, non-exclusive, royalty-free license to use,
              reproduce, modify, and distribute your content for the purpose of operating and
              improving the platform.
            </p>
            <p>You are solely responsible for your content and agree that:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>You own or have the necessary rights to post the content</li>
              <li>Your content does not violate any laws or third-party rights</li>
              <li>Your content complies with our Community Guidelines</li>
              <li>We may remove content that violates these terms</li>
            </ul>
          </CardContent>
        </Card>

        {/* Prohibited Activities */}
        <Card>
          <CardHeader>
            <CardTitle>5. Prohibited Activities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Violate any laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Post harmful, offensive, or inappropriate content</li>
              <li>Harass, threaten, or harm other users</li>
              <li>Impersonate others or misrepresent your identity</li>
              <li>Attempt to hack, disrupt, or compromise the platform</li>
              <li>Use automated systems (bots) without permission</li>
              <li>Collect user data without consent</li>
              <li>Engage in spam or fraudulent activities</li>
            </ul>
          </CardContent>
        </Card>

        {/* Monetization */}
        <Card>
          <CardHeader>
            <CardTitle>6. Monetization and Payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              astruXo offers monetization features including virtual gifts and coin
              purchases. By participating in monetization:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>You agree to our payment processing terms</li>
              <li>All sales are final unless otherwise stated</li>
              <li>We reserve the right to adjust pricing and features</li>
              <li>Earnings may be subject to platform fees and taxes</li>
              <li>Payout thresholds and schedules apply</li>
            </ul>
          </CardContent>
        </Card>

        {/* Intellectual Property */}
        <Card>
          <CardHeader>
            <CardTitle>7. Intellectual Property</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              astruXo app and astruxo.net, including their design, features, and content (excluding user
              content), are owned by <strong>Santana Enterprises LLC</strong> and protected by copyright, trademark, and other intellectual
              property laws.
            </p>
            <p>You may not:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Copy, modify, or distribute our platform or content</li>
              <li>Reverse engineer or attempt to extract source code</li>
              <li>Use our trademarks without permission</li>
              <li>Create derivative works based on our platform</li>
            </ul>
          </CardContent>
        </Card>

        {/* Termination */}
        <Card>
          <CardHeader>
            <CardTitle>8. Termination</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              We reserve the right to suspend or terminate your account at any time, with or without
              notice, for violations of these terms or for any other reason.
            </p>
            <p>You may terminate your account at any time by contacting support.</p>
            <p>Upon termination:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Your access to the platform will be revoked</li>
              <li>Your content may be removed</li>
              <li>Outstanding payments may be forfeited</li>
              <li>These terms will continue to apply to past activities</li>
            </ul>
          </CardContent>
        </Card>

        {/* Disclaimers */}
        <Card>
          <CardHeader>
            <CardTitle>9. Disclaimers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE
              THAT THE PLATFORM WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
            </p>
            <p>We are not responsible for:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>User-generated content</li>
              <li>Third-party services or links</li>
              <li>Loss of data or content</li>
              <li>Technical issues or downtime</li>
            </ul>
          </CardContent>
        </Card>

        {/* Limitation of Liability */}
        <Card>
          <CardHeader>
            <CardTitle>10. Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE
              PLATFORM.
            </p>
            <p>
              Our total liability shall not exceed the amount you paid to us in the past 12 months,
              or $100, whichever is greater.
            </p>
          </CardContent>
        </Card>

        {/* Governing Law */}
        <Card>
          <CardHeader>
            <CardTitle>11. Governing Law</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              These Terms of Service shall be governed by and construed in accordance with the laws
              of [Your Jurisdiction], without regard to its conflict of law provisions.
            </p>
            <p>
              Any disputes arising from these terms shall be resolved through binding arbitration or
              in the courts of [Your Jurisdiction].
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>12. Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>If you have questions about these Terms of Service, please contact us:</p>
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
          By using astruXo, you acknowledge that you have read and understood these
          Terms of Service.
        </p>
        <p className="mt-4 font-semibold">
          astruXo app and astruxo.net are owned and operated by Santana Enterprises LLC.
        </p>
      </div>
    </div>
  );
}
