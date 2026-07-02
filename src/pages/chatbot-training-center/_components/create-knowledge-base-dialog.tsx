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

interface CreateKnowledgeBaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (language: string) => Promise<void>;
}

export function CreateKnowledgeBaseDialog({
  open,
  onOpenChange,
  onCreate,
}: CreateKnowledgeBaseDialogProps) {
  const [language, setLanguage] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!language.trim()) return;
    setSaving(true);
    try {
      await onCreate(language.trim());
      setLanguage('');
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setLanguage('');
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Knowledge Base</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Set up a knowledge base for this chatbot by specifying the language of
            your content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="kb-language">Knowledge Base Language</Label>
          <Input
            id="kb-language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="e.g. English, Norwegian…"
            className="border-grey-100"
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleCreate();
            }}
          />
          <p className="text-[11px] text-muted-foreground">
            Enter the language of your content sources. This should match the
            language of the documents and URLs the chatbot is trained on.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setLanguage('');
              onOpenChange(false);
            }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={saving || !language.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
