/**
 * Language Selector Component
 * Allows users to change the app language
 */

import { useI18n } from '@/lib/i18n/i18n-context';
import { Language } from '@/lib/i18n/translations';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { toast } from 'sonner';

export default function LanguageSelector() {
  const { language, setLanguage, availableLanguages, t } = useI18n();

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    toast.success(t.settings.languageChanged);
  };

  const currentLanguage = availableLanguages.find((l) => l.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLanguage?.nativeName}</span>
          <span className="sm:hidden">{currentLanguage?.code.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code as Language)}
            className={language === lang.code ? 'bg-accent' : ''}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">{lang.nativeName}</span>
              {language === lang.code && (
                <span className="text-xs text-muted-foreground">✓</span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
