import { useSearchParams } from 'react-router';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { CONFIG } from '@/config';

import { ForgotPasswordTab } from './components/forgot-password-tab';
import { SignInTab } from './components/sign-in-tab';
import { ResetPasswordTab } from './components/reset-password-tab';
import { SignUpTab } from './components/sign-up-tab';

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const rawTab = searchParams.get('tab') || 'signin';
  const normalizedTab = rawTab.split('?')[0];
  const tab = ['signin', 'signup', 'forgot-password', 'reset-password'].includes(normalizedTab)
    ? normalizedTab
    : 'signin';

  const titles: Record<string, { heading: string; sub: string }> = {
    signin: { heading: 'Welcome back', sub: 'Sign in to your account to continue' },
    signup: { heading: 'Create account', sub: 'Get started with your free account' },
    'forgot-password': { heading: 'Forgot password', sub: 'We\'ll send you a reset link' },
    'reset-password': { heading: 'New password', sub: 'Choose a strong password for your account' },
  };

  const { heading, sub } = titles[tab] || titles.signin;

  return (
    <div className="flex h-dvh w-full items-center justify-center px-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-3">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="bg-primary flex size-9 items-center justify-center rounded-lg">
              <svg
                viewBox="0 0 128 128"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-primary-foreground size-8"
              >
                <path d="M63.6734 24.8486V49.3899C63.6734 57.4589 57.1322 64.0001 49.0632 64.0001H25.2041" stroke="currentColor" strokeWidth="8.11681" />
                <path d="M64.3266 103.152L64.3266 78.6106C64.3266 70.5416 70.8678 64.0003 78.9368 64.0003L102.796 64.0004" stroke="currentColor" strokeWidth="8.11681" />
                <line x1="93.3468" y1="35.6108" x2="76.555" y2="52.205" stroke="currentColor" strokeWidth="8.11681" />
                <line x1="51.7697" y1="77.0624" x2="34.9778" y2="93.6567" stroke="currentColor" strokeWidth="8.11681" />
                <line x1="50.9584" y1="51.3189" x2="34.2651" y2="34.6256" stroke="currentColor" strokeWidth="8.11681" />
                <line x1="93.1625" y1="93.6397" x2="76.4692" y2="76.9464" stroke="currentColor" strokeWidth="8.11681" />
              </svg>
            </div>
            <span className="text-lg font-semibold">{CONFIG.APP_NAME}</span>
          </div>

          <div>
            <CardTitle className="text-2xl font-semibold tracking-tight">{heading}</CardTitle>
            <CardDescription className="mt-1.5">{sub}</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs key={tab} defaultValue={tab}>
            <TabsContent value="signin" className="mt-0">
              <SignInTab />
            </TabsContent>
            <TabsContent value="signup" className="mt-0">
              <SignUpTab />
            </TabsContent>
            <TabsContent value="forgot-password" className="mt-0">
              <ForgotPasswordTab />
            </TabsContent>
            <TabsContent value="reset-password" className="mt-0">
              <ResetPasswordTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;