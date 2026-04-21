import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Loader } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { z } from 'zod';
import { toast } from 'sonner';

import { PasswordInput } from '@/components/password-input';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { authService } from '@/services/auth/auth';

const resetPasswordSchema = z
  .object({
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/\d/, 'Must contain at least one digit')
      .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Must contain at least one special character'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const ResetPasswordTab = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      new_password: '',
      confirm_password: ''
    }
  });

  const resetMutation = useMutation({
    mutationFn: (values: ResetPasswordFormValues) => {
      if (!token) throw new Error('Reset token is missing');
      return authService.resetPasswordWithToken({
        token,
        new_password: values.new_password,
        confirm_password: values.confirm_password,
      });
    },

    onSuccess: () => {
      toast.success('Password reset successfully! Please sign in with your new password.');
      navigate('/?tab=signin', { replace: true });
    },

    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to reset password';
      form.setError('root', { message });
    }
  });

  const isSubmitting = resetMutation.isPending;

  const onSubmit = (values: ResetPasswordFormValues) => {
    resetMutation.mutate(values);
  };

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-destructive text-sm">
          Invalid or missing reset token. Please request a new password reset.
        </p>
        <Link
          to="/?tab=forgot-password"
          className="text-primary text-sm font-medium hover:underline"
        >
          Request new reset link
        </Link>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="new_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <PasswordInput placeholder="Enter new password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirm_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <PasswordInput placeholder="Confirm new password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root?.message && (
          <p className="text-destructive text-center text-sm">
            {form.formState.errors.root.message}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader className="mr-2 size-4 animate-spin" />}
          {isSubmitting ? 'Resetting...' : 'Reset password'}
        </Button>

        <p className="text-muted-foreground text-center text-sm">
          Remember your password?{' '}
          <Link to="/?tab=signin" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </Form>
  );
};