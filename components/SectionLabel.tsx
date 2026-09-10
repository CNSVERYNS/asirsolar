export function SectionLabel({ index, text }: { index: string; text: string }) {
  return (
    <p className="label">
      {index} / {text}
    </p>
  );
}
