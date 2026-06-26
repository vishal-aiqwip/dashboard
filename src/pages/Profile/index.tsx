import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import type { Value as PhoneValue } from 'react-phone-number-input';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { useAppDispatch, useAppSelector } from '@/redux';
import { logout } from '@/redux/reducer/sessionReducer';
import { userService } from '@/services/users/users';
import { useErrorLog } from '@/hooks/use-error-log';
import { auth } from '@/lib/firebase';
import { PasswordInput } from '@/components/password-input';
import { PhoneInput } from '@/components/phone-input';

/* ---------- helpers ---------- */
const getInitials = (firstName: string, lastName: string, email: string) => {
  if (firstName || lastName) {
    return `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase();
  }
  return email?.charAt(0)?.toUpperCase() || 'U';
};

/* ---------- schemas ---------- */
const infoSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone_number: z.string().optional(),
});

const emailSchema = z.object({
  newEmail: z.email('Enter a valid email'),
  password: z.string().min(6, 'Enter your current password'),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type InfoFormValues = z.infer<typeof infoSchema>;
type EmailFormValues = z.infer<typeof emailSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

/* ========================================================================== */
const Profile = () => {
  const handleError = useErrorLog('/profile');
  const dispatch = useAppDispatch();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const { userSession } = useAppSelector(
    (state: { session: { userSession: Record<string, unknown> | null } }) => state.session,
  );
  const user = userSession?.user as Record<string, unknown> | null;

  /* -- fetch profile -- */
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => userService.getProfile(),
    enabled: !!user?.uid,
  });

  /* -- info form -- */
  const infoForm = useForm<InfoFormValues>({
    resolver: zodResolver(infoSchema),
    defaultValues: { first_name: '', last_name: '', phone_number: '' },
  });

  useEffect(() => {
    // Parse Firebase displayName into first / last name as fallback
    const firebaseDisplay = (user?.displayName as string) || auth.currentUser?.displayName || '';
    const parts = firebaseDisplay.trim().split(/\s+/).filter(Boolean);
    const fbFirst = parts[0] || '';
    const fbLast = parts.slice(1).join(' ') || '';
    const fbPhone = auth.currentUser?.phoneNumber || '';

    infoForm.reset({
      first_name: profileData?.first_name || fbFirst,
      last_name: profileData?.last_name || fbLast,
      phone_number: profileData?.phone_number || fbPhone,
    });
  }, [profileData, user, infoForm]);

  const updateInfoMutation = useMutation({
    mutationFn: (payload: InfoFormValues) => userService.updateUserProfile(payload),
    onSuccess: () => toast.success('Profile updated successfully'),
    onError: (error) => handleError(error),
  });

  /* -- email form -- */
  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { newEmail: '', password: '' },
  });

  const updateEmailMutation = useMutation({
    mutationFn: async ({ newEmail, password }: EmailFormValues) => {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) throw new Error('Not authenticated');
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);
      await updateEmail(currentUser, newEmail);
    },
    onSuccess: () => {
      toast.success('Email updated. Please log in again with your new email.');
      setEmailDialogOpen(false);
      emailForm.reset();
      dispatch(logout());
    },
    onError: (error: unknown) => {
      const code = (error as { code?: string }).code;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        emailForm.setError('password', { message: 'Incorrect password' });
      } else if (code === 'auth/email-already-in-use') {
        emailForm.setError('newEmail', { message: 'Email already in use' });
      } else {
        toast.error('Failed to update email. Please try again.');
      }
    },
  });

  /* -- password form -- */
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async ({ currentPassword, newPassword }: PasswordFormValues) => {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) throw new Error('Not authenticated');
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
    },
    onSuccess: () => {
      toast.success('Password updated successfully');
      setPasswordDialogOpen(false);
      passwordForm.reset();
    },
    onError: (error: unknown) => {
      const code = (error as { code?: string }).code;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        passwordForm.setError('currentPassword', { message: 'Incorrect password' });
      } else {
        toast.error('Failed to update password. Please try again.');
      }
    },
  });

  const firstName = profileData?.first_name || '';
  const lastName = profileData?.last_name || '';
  const email = (user?.email as string) || profileData?.email || '';

  return (
    <div className="p-6 md:p-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className=''>Profile Settings</CardTitle>
          <CardDescription>
            Manage your profile information and preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          

          {/* Photo row */}
          <div className="mt-8 flex items-center gap-5">
            <Avatar className="h-16 w-16 border">
              <AvatarImage src={profileData?.photoURL ?? undefined} />
              <AvatarFallback className="text-xl font-semibold bg-muted">
                {profileLoading ? '…' : getInitials(firstName, lastName, email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium">Profile photo</p>
              <p className="text-xs text-muted-foreground">JPG, PNG or WEBP. Max 5 MB.</p>
            </div>
            <Button variant="outline" size="icon" className="rounded-full shrink-0">
              <Upload className="h-4 w-4" />
            </Button>
          </div>

          <Separator className="my-6" />

          {/* Info form */}
          {profileLoading ? (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader className="h-4 w-4 animate-spin" />
              Loading profile…
            </div>
          ) : (
            <Form {...infoForm}>
              <form
                onSubmit={infoForm.handleSubmit((d) => updateInfoMutation.mutate(d))}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={infoForm.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First name</FormLabel>
                        <FormControl>
                          <Input placeholder="First name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={infoForm.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last name</FormLabel>
                        <FormControl>
                          <Input placeholder="Last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={infoForm.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (optional)</FormLabel>
                      <FormControl>
                        <PhoneInput
                          placeholder="Enter phone number"
                          value={field.value as PhoneValue}
                          onChange={(val) => field.onChange(val ?? '')}
                          defaultCountry="US"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-1">
                  <Button type="submit" disabled={updateInfoMutation.isPending}>
                    {updateInfoMutation.isPending && (
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Update info
                  </Button>
                </div>
              </form>
            </Form>
          )}

          <Separator className="my-6" />

          {/* Email + Password */}
          <div className="grid grid-cols-2 divide-x">
            <div className="pr-8 space-y-2">
              <p className="text-xs text-muted-foreground">Current email</p>
              <p className="text-sm font-medium break-all">{email}</p>
              <Button variant="outline" size="sm" onClick={() => setEmailDialogOpen(true)}>
                Update email
              </Button>
            </div>
            <div className="pl-8 space-y-2">
              <p className="text-xs text-muted-foreground">Password</p>
              <p className="text-sm tracking-widest text-muted-foreground">••••••••</p>
              <Button variant="outline" size="sm" onClick={() => setPasswordDialogOpen(true)}>
                Update password
              </Button>
            </div>
          </div>

          {/* Password update dialog */}
          <Dialog
            open={passwordDialogOpen}
            onOpenChange={(open) => {
              setPasswordDialogOpen(open);
              if (!open) passwordForm.reset();
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update password</DialogTitle>
                <DialogDescription>
                  Enter your current password, then choose a new one.
                </DialogDescription>
              </DialogHeader>
              <Form {...passwordForm}>
                <form
                  onSubmit={passwordForm.handleSubmit((d) => updatePasswordMutation.mutate(d))}
                  className="space-y-4"
                >
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current password</FormLabel>
                        <FormControl>
                          <PasswordInput placeholder="Current password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New password</FormLabel>
                        <FormControl>
                          <PasswordInput placeholder="New password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm new password</FormLabel>
                        <FormControl>
                          <PasswordInput placeholder="Repeat new password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setPasswordDialogOpen(false);
                        passwordForm.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updatePasswordMutation.isPending}>
                      {updatePasswordMutation.isPending && (
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Update password
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Email update dialog */}
          <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update email</DialogTitle>
                <DialogDescription>
                  Enter your new email and current password to confirm the change.
                </DialogDescription>
              </DialogHeader>
              <Form {...emailForm}>
                <form
                  onSubmit={emailForm.handleSubmit((d) => updateEmailMutation.mutate(d))}
                  className="space-y-4"
                >
                  <FormField
                    control={emailForm.control}
                    name="newEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="you@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={emailForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter your password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEmailDialogOpen(false);
                        emailForm.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updateEmailMutation.isPending}>
                      {updateEmailMutation.isPending && (
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Update email
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
