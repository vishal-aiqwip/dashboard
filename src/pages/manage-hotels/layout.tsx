import { Outlet } from 'react-router';

export default function ManageHotelsLayout() {
  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="shrink-0 border-b px-6 pt-6 pb-4">
        <h1 className="text-2xl font-semibold">Manage Organizations</h1>
      </div>
      <div className="flex flex-1 min-h-0 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
