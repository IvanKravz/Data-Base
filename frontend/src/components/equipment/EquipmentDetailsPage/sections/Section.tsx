// Section.tsx
interface SectionProps {
  title: string;
  hideTitle?: boolean;
  children: React.ReactNode;
}

export function Section({ title, hideTitle = false, children }: SectionProps) {
  return (
    <div className="equipment-section">
      <div className="equipment-section-content">{children}</div>
    </div>
  );
}