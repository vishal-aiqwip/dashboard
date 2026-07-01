import { Users, Briefcase, Building2 } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { AllUsersTab } from './_components/AllUsersTab';
import { ConsultantsTab } from './_components/ConsultantsTab';
import { OrgMembershipsTab } from './_components/OrgMembershipsTab';

export default function ManageUsersPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h2 className="text-2xl font-semibold">Manage Users</h2>
        <p className="text-sm text-muted-foreground">
          Manage user roles, consultant status, and organization memberships.
        </p>
      </div>
      <Tabs defaultValue="all-users">
        <TabsList variant="accent-tab">
          <TabsTrigger value="all-users"><Users className="h-4 w-4" />All Users</TabsTrigger>
          <TabsTrigger value="consultants"><Briefcase className="h-4 w-4" />Consultants</TabsTrigger>
          <TabsTrigger value="org-memberships"><Building2 className="h-4 w-4" />Org Memberships</TabsTrigger>
        </TabsList>
        <TabsContent value="all-users" className="mt-4">
          <AllUsersTab />
        </TabsContent>
        <TabsContent value="consultants" className="mt-4">
          <ConsultantsTab />
        </TabsContent>
        <TabsContent value="org-memberships" className="mt-4">
          <OrgMembershipsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
