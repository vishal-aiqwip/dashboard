import { Link, useSearchParams } from 'react-router';

import { LogoSvg } from '@/assets';
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
    signin: { heading: 'Welcome back', sub: 'Enter your credentials to access your account' },
    signup: { heading: 'Create account', sub: 'Get started with your free account' },
    'forgot-password': { heading: 'Forgot password', sub: "We'll send you a reset link" },
    'reset-password': { heading: 'New password', sub: 'Choose a strong password for your account' },
  };

  const { heading, sub } = titles[tab] || titles.signin;

  return (
    <div className="flex min-h-dvh w-full">
      {/* Left: form panel */}
      <div className="flex w-full items-center justify-center bg-background px-6 py-12 lg:w-3/5">
        <div className="w-full max-w-md  [&_[data-slot=form-control]]:h-11! [&_[data-slot=input-group]]:h-11! [&_form>button]:h-11 [&_form>div>button]:h-11">
          <Link to="/" className="inline-flex items-center" aria-label={CONFIG.APP_NAME}>
            <img src={LogoSvg} alt={CONFIG.APP_NAME} className="h-8 w-auto" />
          </Link>

          <div className="mt-10">
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">{heading}</h1>
            <p className="mt-2 text-sm text-neutral-500">{sub}</p>
          </div>

          <div className="mt-8">
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
          </div>
        </div>
      </div>

      {/* Right: gradient panel */}
      <div
        aria-hidden
        className="hidden lg:block lg:w-2/5 bg-[linear-gradient(135deg,#DCE7FB_0%,#C8D2F7_45%,#D7CBF4_100%)]"
      />
    </div>
  );
};

export default AuthPage;
