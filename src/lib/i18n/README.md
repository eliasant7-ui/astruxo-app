# i18n System - Internationalization

## Overview

astruXo includes a complete internationalization (i18n) system with automatic language detection and support for multiple languages.

## Features

- ✅ **Automatic Language Detection** - Detects user's browser language on first visit
- ✅ **Persistent Preferences** - Saves language choice in localStorage
- ✅ **PWA Support** - Works seamlessly in installed PWA mode
- ✅ **Type-Safe** - Full TypeScript support with autocomplete
- ✅ **Easy to Use** - Simple hooks for accessing translations
- ✅ **Relative Time** - Built-in relative time formatting ("2 hours ago")

## Supported Languages

- 🇺🇸 **English** (en) - Default
- 🇪🇸 **Spanish** (es) - Español

## Usage

### Basic Translation

```tsx
import { useTranslation } from '@/lib/i18n/i18n-context';

function MyComponent() {
  const t = useTranslation();

  return (
    <div>
      <h1>{t.common.loading}</h1>
      <button>{t.common.save}</button>
    </div>
  );
}
```

### Full i18n Context

```tsx
import { useI18n } from '@/lib/i18n/i18n-context';

function LanguageSettings() {
  const { language, setLanguage, availableLanguages } = useI18n();

  return (
    <select value={language} onChange={(e) => setLanguage(e.target.value)}>
      {availableLanguages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.nativeName}
        </option>
      ))}
    </select>
  );
}
```

### Relative Time Formatting

```tsx
import { useRelativeTime } from '@/lib/i18n/i18n-context';

function PostCard({ post }) {
  const formatRelativeTime = useRelativeTime();

  return (
    <div>
      <p>{formatRelativeTime(post.createdAt)}</p>
      {/* Output: "2 hours ago" or "hace 2 horas" */}
    </div>
  );
}
```

## Translation Keys

All translations are organized by category:

- `common` - Common UI elements (loading, save, cancel, etc.)
- `nav` - Navigation items
- `auth` - Authentication (sign in, sign up, etc.)
- `feed` - Social feed
- `post` - Post actions (like, comment, share)
- `comments` - Comment system
- `stream` - Livestream features
- `profile` - User profiles
- `settings` - Settings page
- `admin` - Admin dashboard
- `gifts` - Virtual gifts
- `earnings` - Earnings/monetization
- `errors` - Error messages
- `success` - Success messages
- `pwa` - PWA prompts
- `footer` - Footer links
- `time` - Time units

## Adding a New Language

1. Create a new translation file in `src/lib/i18n/translations/`:

```typescript
// fr.ts (French)
import type { TranslationKeys } from './en';

export const fr: TranslationKeys = {
  common: {
    loading: 'Chargement...',
    save: 'Enregistrer',
    // ... all other keys
  },
  // ... all other categories
};
```

2. Add the language to `translations/index.ts`:

```typescript
import { fr } from './fr';

export const translations = {
  en,
  es,
  fr, // Add new language
} as const;

export const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' }, // Add new language
] as const;
```

3. That's it! The language will automatically be available in the language selector.

## Adding New Translation Keys

1. Add the key to `translations/en.ts`:

```typescript
export const en = {
  // ...
  myNewCategory: {
    myNewKey: 'My new text',
  },
};
```

2. Add the same key to all other language files (`es.ts`, etc.):

```typescript
export const es: TranslationKeys = {
  // ...
  myNewCategory: {
    myNewKey: 'Mi nuevo texto',
  },
};
```

3. Use it in your component:

```tsx
const t = useTranslation();
<p>{t.myNewCategory.myNewKey}</p>
```

## Best Practices

### ✅ DO:

- Use translation keys for ALL user-facing text
- Keep keys organized by feature/category
- Use descriptive key names
- Test with multiple languages
- Use relative time formatting for timestamps

### ❌ DON'T:

- Hardcode text strings in components
- Auto-translate user-generated content (posts, comments)
- Use translation keys for technical/debug messages
- Forget to add keys to all language files

## Language Detection

The system detects language in this order:

1. **localStorage** - User's saved preference (highest priority)
2. **Browser Language** - `navigator.language` (e.g., "es-MX" → "es")
3. **Default** - English (fallback)

## PWA Support

The i18n system works seamlessly in PWA mode:

- Language preference persists across sessions
- Works offline (translations are bundled)
- Updates HTML `lang` attribute for accessibility
- No network requests needed

## Accessibility

The system automatically:

- Sets `<html lang="xx">` attribute
- Provides proper language metadata
- Supports screen readers
- Maintains semantic HTML

## Performance

- **Zero Runtime Cost** - Translations are compile-time constants
- **Tree Shaking** - Unused translations are removed in production
- **Type Safety** - Full TypeScript support with autocomplete
- **Small Bundle** - ~10KB per language (gzipped)

## Examples

### Complete Component Example

```tsx
import { useTranslation, useRelativeTime } from '@/lib/i18n/i18n-context';
import { Button } from '@/components/ui/button';

function PostCard({ post }) {
  const t = useTranslation();
  const formatRelativeTime = useRelativeTime();

  return (
    <div>
      <h2>{post.title}</h2>
      <p>{formatRelativeTime(post.createdAt)}</p>
      <div>
        <Button>{t.post.like}</Button>
        <Button>{t.post.comment}</Button>
        <Button>{t.post.share}</Button>
      </div>
    </div>
  );
}
```

### Settings Page Example

```tsx
import { useI18n } from '@/lib/i18n/i18n-context';
import { toast } from 'sonner';

function SettingsPage() {
  const { language, setLanguage, availableLanguages, t } = useI18n();

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    toast.success(t.settings.languageChanged);
  };

  return (
    <div>
      <h1>{t.settings.settings}</h1>
      <label>{t.settings.language}</label>
      <select value={language} onChange={(e) => handleLanguageChange(e.target.value)}>
        {availableLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
}
```

## Testing

To test different languages:

1. Change language in the UI (language selector in header)
2. Or manually set in browser console:

```javascript
localStorage.setItem('astruxo_language', 'es');
location.reload();
```

3. Or change browser language settings

## Support

For questions or issues with i18n, check:

- This README
- Translation files in `src/lib/i18n/translations/`
- i18n context in `src/lib/i18n/i18n-context.tsx`
- Example usage in components
