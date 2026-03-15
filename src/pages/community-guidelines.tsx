/**
 * Community Guidelines Page
 * Public page with community rules and guidelines
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Shield, Heart, MessageCircle, AlertTriangle } from 'lucide-react';

export default function CommunityGuidelinesPage() {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <title>Community Guidelines - astruXo</title>
      <meta
        name="description"
        content="Community guidelines and rules for astruXo. Learn how to be a positive member of our community."
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
        <h1 className="text-4xl font-bold mb-4">Community Guidelines</h1>
        <p className="text-xl text-muted-foreground">
          Building a safe, respectful, and positive community together
        </p>
      </div>

      {/* Introduction */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <p className="text-muted-foreground leading-relaxed">
            Welcome to astruXo! Our community is built on respect, creativity, and
            positive interactions. These guidelines help ensure everyone has a safe and enjoyable
            experience. By using our platform, you agree to follow these rules.
          </p>
        </CardContent>
      </Card>

      {/* Guidelines Sections */}
      <div className="space-y-6">
        {/* Be Respectful */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Be Respectful and Kind
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">
              Treat others the way you want to be treated. We're all here to have fun and connect.
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Be polite and considerate in all interactions</li>
              <li>Respect different opinions, backgrounds, and perspectives</li>
              <li>Use appropriate language and tone</li>
              <li>Think before you post or comment</li>
            </ul>
          </CardContent>
        </Card>

        {/* No Harassment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Zero Tolerance for Harassment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">
              We have zero tolerance for harassment, bullying, or hate speech of any kind.
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>No harassment, bullying, or intimidation</li>
              <li>No hate speech based on race, ethnicity, religion, gender, sexual orientation, or disability</li>
              <li>No threats or incitement to violence</li>
              <li>No doxxing or sharing personal information without consent</li>
            </ul>
          </CardContent>
        </Card>

        {/* Appropriate Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Keep Content Appropriate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">
              Share content that's suitable for a diverse audience.
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>No explicit sexual content or nudity</li>
              <li>No graphic violence or gore</li>
              <li>No illegal activities or promotion of illegal substances</li>
              <li>No spam, scams, or misleading content</li>
              <li>Respect intellectual property and copyright laws</li>
            </ul>
          </CardContent>
        </Card>

        {/* Positive Interactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Foster Positive Interactions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">
              Help create a welcoming environment for everyone.
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Support and encourage other creators</li>
              <li>Provide constructive feedback when appropriate</li>
              <li>Report violations instead of engaging with trolls</li>
              <li>Welcome new members to the community</li>
            </ul>
          </CardContent>
        </Card>

        {/* Streaming Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>Streaming Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">
              Additional rules for live streaming:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Clearly label mature content in stream titles</li>
              <li>Moderate your chat actively</li>
              <li>Don't stream copyrighted content without permission</li>
              <li>Respect your viewers' time and attention</li>
              <li>Follow all applicable laws and regulations</li>
            </ul>
          </CardContent>
        </Card>

        {/* Consequences */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Consequences of Violations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">
              Violations of these guidelines may result in:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Content removal</li>
              <li>Temporary suspension</li>
              <li>Permanent account termination</li>
              <li>Legal action in severe cases</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              The severity of the consequence depends on the nature and frequency of the violation.
            </p>
          </CardContent>
        </Card>

        {/* Reporting */}
        <Card className="bg-primary/5">
          <CardHeader>
            <CardTitle>Report Violations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">
              If you see content or behavior that violates these guidelines:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Use the report button on posts, comments, or streams</li>
              <li>Contact our support team for urgent issues</li>
              <li>Provide as much detail as possible</li>
              <li>Don't engage with the violator</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              All reports are reviewed by our moderation team and kept confidential.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>Last updated: March 2026</p>
        <p className="mt-2">
          Questions? Contact us at{' '}
          <a href="mailto:info@astruXo.net" className="text-primary hover:underline">
            info@astruXo.net
          </a>
        </p>
      </div>
    </div>
  );
}
