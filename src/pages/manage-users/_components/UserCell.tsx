export function UserCell({ displayName, email }: { displayName: string; email: string }) {
  return (
    <div>
      <p className="font-medium text-sm">{displayName}</p>
      <p className="text-xs text-muted-foreground">{email}</p>
    </div>
  );
}
