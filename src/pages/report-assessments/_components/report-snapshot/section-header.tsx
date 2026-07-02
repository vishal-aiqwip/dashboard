export function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-base font-semibold tracking-tight text-grey-900">{title}</h3>
      {description ? <p className="text-xs leading-relaxed text-grey-600">{description}</p> : null}
    </div>
  );
}
