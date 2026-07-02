import { Outlet } from 'react-router';

export default function ReportAssessmentsLayout() {
  return (
    <div className="  min-h-0">
      <div className="flex flex-1 min-h-0 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
