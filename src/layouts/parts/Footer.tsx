import { Link } from 'react-router-dom';
import SimpleVisitorCounter from '@/components/SimpleVisitorCounter';

/**
 * Footer component for website
 *
 * A simple, customizable footer with copyright and links.
 * This component is designed to be directly edited by the AI agent
 * to match the specific needs of each website.
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © {currentYear} astruXo. All rights reserved. <br className="md:hidden" />
            <span className="text-xs">Owned by Santana Enterprises LLC</span>
            <br />
            <a 
              href="mailto:info@astruXo.net" 
              className="text-xs text-primary hover:underline"
            >
              info@astruXo.net
            </a>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
            <SimpleVisitorCounter />
            
            <nav className="flex gap-6">
              <Link
                to="/about"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                About
              </Link>
              <Link
                to="/privacy-policy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
              <Link
                to="/terms-of-service"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
