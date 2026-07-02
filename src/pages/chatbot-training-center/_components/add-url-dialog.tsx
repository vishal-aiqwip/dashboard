import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddUrlDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (url: string) => Promise<void>;
}

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

export function AddUrlDialog({ open, onOpenChange, onAdd }: AddUrlDialogProps) {
  const [url, setUrl] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!isValidUrl(url)) return;
    setAdding(true);
    try {
      await onAdd(url.trim());
      setUrl('');
      onOpenChange(false);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setUrl('');
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add URL to knowledge base</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            The page will be scraped and added to your chatbot's knowledge base.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="kb-url">URL</Label>
          <Input
            id="kb-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/page"
            className="border-grey-100"
            onKeyDown={(e) => { if (e.key === 'Enter') void handleAdd(); }}
          />
          {url && !isValidUrl(url) && (
            <p className="text-xs text-destructive">Enter a valid http/https URL</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setUrl(''); onOpenChange(false); }} disabled={adding}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={adding || !isValidUrl(url)}>
            {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add URL
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
