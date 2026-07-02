import { Card, CardContent } from '@/components/ui/card';
import { useAppSelector } from '@/redux';

export default function BenchmarksPage() {
  const { role } = useAppSelector((s) => s.session);

  if (role !== 'admin') {
    return (
      <div className="p-6 max-w-md">
        <Card className="border border-grey-100 bg-white shadow-sm">
          <CardContent className="px-6 py-10 text-left">
            <p className="text-small leading-relaxed text-grey-700">
              Benchmark data is restricted to Altek admins. Ask your contact if you need access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="space-y-1">
        <h2 className="text-h6 font-semibold tracking-tight text-grey-900">Benchmarks</h2>
        <p className="text-small leading-relaxed text-grey-700">
          Industry benchmark comparisons across the report assessment cohort.
        </p>
      </div>

      <Card className="border border-grey-100 bg-white shadow-sm">
        <CardContent className="">
          <p className="text-small font-medium text-grey-900 mb-1">Coming soon</p>
          <p className="text-xs text-grey-600">
            Benchmark data visualizations are being migrated to this view.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
