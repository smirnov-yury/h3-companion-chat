import { useLocation, Link } from "react-router-dom";

export default function GameSessionPreview() {
  const location = useLocation();
  const form = (location.state as { form?: unknown })?.form;
  return (
    <div className="min-h-dvh p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Game session preview (placeholder)</h1>
      <p className="text-sm text-muted-foreground">
        This is a placeholder. The full session sheet will be implemented in the next prompt.
      </p>
      <pre className="text-xs bg-muted p-4 rounded overflow-auto">
        {JSON.stringify(form, null, 2)}
      </pre>
      <Link to="/game-setup" className="text-primary underline text-sm">
        Назад к настройке
      </Link>
    </div>
  );
}
