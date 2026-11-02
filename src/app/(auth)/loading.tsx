export default function AuthLoading() {
  return (
    <div className="flex min-h-[480px] w-full items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-10 w-10 rounded-full bg-sunken animate-pulse" />
          <div className="h-6 w-40 rounded bg-sunken animate-pulse" />
          <div className="h-4 w-60 rounded bg-sunken animate-pulse" />
        </div>

        <div className="mt-8 flex flex-col gap-4">
          <div className="h-10 w-full rounded bg-sunken animate-pulse" />
          <div className="h-10 w-full rounded bg-sunken animate-pulse" />
          <div className="h-10 w-full rounded bg-primary/20 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

