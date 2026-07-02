import { useAppSelector } from '@/redux';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChainsSection } from './_components/chains';
import { HotelsSection } from './_components/hotels';

export default function ChainsAndHotelsPage() {
  const { role } = useAppSelector((s) => s.session);
  const isAdmin = role === 'admin';

  return (
    <div className="space-y-6 p-6 w-full">
      <div className="space-y-1">
        <h2 className="text-h6 font-semibold tracking-tight text-grey-900">Chains & Hotels</h2>
        <p className="text-small leading-relaxed text-grey-700">
          Your chains, hotels, and inbox assessments in one place.
        </p>
      </div>
      <Tabs defaultValue="chains">
        <TabsList variant="accent-tab" >
          <TabsTrigger value="chains">Chains</TabsTrigger>
          <TabsTrigger value="hotels">Hotels</TabsTrigger>
        </TabsList>
        <TabsContent value="chains" className="mt-4">
          <ChainsSection isAdmin={isAdmin} />
        </TabsContent>
        <TabsContent value="hotels" className="mt-4">
          <HotelsSection isAdmin={isAdmin} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
