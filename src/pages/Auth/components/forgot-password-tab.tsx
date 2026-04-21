import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Loader, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { authService } from '@/services/auth/auth';

const forgotPasswordSchema = z.object({
  username: z.string().email('Please enter a valid email').min(1, 'Email is required')
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordTab = () => {
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      username: ''
    }
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (values: ForgotPasswordFormValues) =>
      authService.forgotPassword(values.username),

    onSuccess: () => {
      toast.success('Password reset email sent! Please check your inbox.');
      form.reset();
    },

    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to send reset email';
      form.setError('root', { message });
    }
  });

  const isSubmitting = forgotPasswordMutation.isPending;

  const onSubmit = (values: ForgotPasswordFormValues) => {
    forgotPasswordMutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <Mail />
                  </InputGroupAddon>
                  <InputGroupInput
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    {...field}
                  />
                </InputGroup>
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
          {isSubmitting ? 'Sending...' : 'Send reset link'}
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