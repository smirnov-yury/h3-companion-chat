interface Props {
  title: string;
}

export default function PlaceholderTab({ title }: Props) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-muted-foreground text-sm">{title}</p>
    </div>
  );
}
