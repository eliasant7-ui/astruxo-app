/**
 * PreLiveConfirmation Component
 * Minimal modal shown before starting a livestream
 * Only shown once (or when guidelines update)
 */

import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Target, DollarSign, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';

interface PreLiveConfirmationProps {
  open: boolean;
  onConfirm: (settings: { goalAmount?: number; entryPrice?: number; thumbnailFile?: File }) => void;
  onCancel: () => void;
}

export default function PreLiveConfirmation({
  open,
  onConfirm,
  onCancel,
}: PreLiveConfirmationProps) {
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [guidelinesConfirmed, setGuidelinesConfirmed] = useState(false);
  const [goalAmount, setGoalAmount] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canProceed = ageConfirmed && guidelinesConfirmed;

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setThumbnailFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setThumbnailPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirm = () => {
    if (canProceed) {
      const settings = {
        goalAmount: goalAmount ? parseInt(goalAmount) : undefined,
        entryPrice: entryPrice ? parseInt(entryPrice) : undefined,
        thumbnailFile: thumbnailFile || undefined,
      };
      onConfirm(settings);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <DialogTitle className="text-2xl font-semibold text-center">
            Before you go live
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Please confirm the following to continue
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Age Confirmation */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="age-confirm"
              checked={ageConfirmed}
              onCheckedChange={(checked) => setAgeConfirmed(checked === true)}
              className="mt-1"
            />
            <Label
              htmlFor="age-confirm"
              className="text-base font-normal leading-relaxed cursor-pointer"
            >
              I am 18 or older
            </Label>
          </div>

          {/* Guidelines Confirmation */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="guidelines-confirm"
              checked={guidelinesConfirmed}
              onCheckedChange={(checked) => setGuidelinesConfirmed(checked === true)}
              className="mt-1"
            />
            <Label
              htmlFor="guidelines-confirm"
              className="text-base font-normal leading-relaxed cursor-pointer"
            >
              I agree to the{' '}
              <Link
                to="/community-guidelines"
                target="_blank"
                className="text-primary hover:underline font-medium"
              >
                Community Guidelines
              </Link>
            </Label>
          </div>

          {/* Divider */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold mb-4 text-muted-foreground">
              Stream Settings (Optional)
            </h3>

            {/* Thumbnail Upload */}
            <div className="space-y-2 mb-4">
              <Label className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                Stream Thumbnail
              </Label>
              
              {thumbnailPreview ? (
                <div className="relative">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-full h-40 object-cover rounded-lg border-2 border-primary/20"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={handleRemoveThumbnail}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                >
                  <ImageIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-1">
                    Click to upload thumbnail
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, or WebP (max 5MB)
                  </p>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailSelect}
                className="hidden"
              />
              
              <p className="text-xs text-muted-foreground">
                Custom thumbnail for your stream preview (uses your profile picture if not set)
              </p>
            </div>

            {/* Goal Amount */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="goal-amount" className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Coin Goal
              </Label>
              <Input
                id="goal-amount"
                type="number"
                min="0"
                placeholder="e.g., 500"
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Set a coin goal for viewers to help you reach
              </p>
            </div>

            {/* Entry Price */}
            <div className="space-y-2">
              <Label htmlFor="entry-price" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Entry Price
              </Label>
              <Input
                id="entry-price"
                type="number"
                min="0"
                placeholder="e.g., 1200"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Require viewers to pay coins to watch your stream
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canProceed}
            className="flex-1"
          >
            Start Live
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
