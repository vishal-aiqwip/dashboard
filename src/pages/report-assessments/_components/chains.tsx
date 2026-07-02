import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { reportAssessmentsService } from '@/services/reportAssessments/reportAssessments';

const dtHead =
  'h-11 bg-surface/90 px-4 text-left text-[0.7rem] font-semibold uppercase tracking-wider text-grey-500 first:pl-5 last:pr-5';
const dtRow =
  'border-b border-grey-100/70 transition-colors hover:bg-surface/80 last:border-b-0';
const dtCell = 'px-4 py-3.5 align-middle text-small first:pl-5 last:pr-5';
const dtWrap = 'overflow-hidden rounded-xl border border-grey-100';

export function ChainsSection({ isAdmin }: { isAdmin: boolean }) {
  const queryClient = useQueryClient();

  const { data: chains = [], isLoading } = useQuery({
    queryKey: ['reportSubjects', 'chains'],
    queryFn: () => reportAssessmentsService.listChains(),
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [editChain, setEditChain] = useState<{ id: string; name: string } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const createChain = useMutation({
    mutationFn: (name: string) => reportAssessmentsService.createChain({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportSubjects'] });
      toast.success('Chain created.');
      setNewName('');
      setCreateOpen(false);
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to create chain.'),
  });

  const updateChain = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      reportAssessmentsService.updateChain(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportSubjects'] });
      toast.success('Saved.');
      setEditChain(null);
    },
    onError: (e: Error) => toast.error(e.message || 'Update failed.'),
  });

  const deleteChain = useMutation({
    mutationFn: (id: string) => reportAssessmentsService.deleteChain(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportSubjects'] });
      toast.success('Chain deleted.');
      setDeleteId(null);
    },
    onError: (e: Error) =>
      toast.error(e.message || 'Delete failed. Remove linked hotels first.'),
  });

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <CardTitle>Chains</CardTitle>
          {isAdmin && (
            <Button size="sm" className="rounded-lg" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New chain
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-28 w-full rounded-lg" />
          ) : chains.length === 0 ? (
            <div className="py-12">
              <p className="text-small font-medium">No chains yet</p>
              <p className="mt-1 text-xs text-grey-600">Add a chain, then link hotels under it.</p>
            </div>
          ) : (
            <div className={dtWrap}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className={dtHead}>Name</TableHead>
                    {isAdmin && (
                      <TableHead className={`${dtHead} text-right w-[108px]`}>Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chains.map((c) => (
                    <TableRow key={c.id} className={dtRow}>
                      <TableCell className={`${dtCell} font-medium`}>{c.name}</TableCell>
                      {isAdmin && (
                        <TableCell className={`${dtCell} text-right`}>
                          <div className="flex justify-end gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-lg text-grey-600 hover:bg-grey-100 hover:text-grey-900"
                              onClick={() => setEditChain({ id: c.id, name: c.name })}
                              aria-label="Edit chain"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-lg text-grey-600 hover:bg-red-50 hover:text-destructive"
                              onClick={() => setDeleteId(c.id)}
                              aria-label="Delete chain"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create chain</DialogTitle>
            <DialogDescription>Add a chain you can link hotels to.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="new-chain-name">Name</Label>
            <Input
              id="new-chain-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Nordic Select Hotels"
              className="h-11 rounded-lg"
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => createChain.mutate(newName.trim())}
              disabled={createChain.isPending}
            >
              {createChain.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editChain)} onOpenChange={(o) => !o && setEditChain(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename chain</DialogTitle>
          </DialogHeader>
          {editChain && (
            <>
              <Input
                value={editChain.name}
                onChange={(e) => setEditChain({ ...editChain, name: e.target.value })}
              />
              <DialogFooter>
                <Button
                  onClick={() =>
                    updateChain.mutate({ id: editChain.id, name: editChain.name.trim() })
                  }
                  disabled={updateChain.isPending}
                >
                  Save
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteId)} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this chain?</AlertDialogTitle>
            <AlertDialogDescription>
              Fails if any hotel still references this chain. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteChain.mutate(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
