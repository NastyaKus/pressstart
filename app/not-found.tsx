import Link from "next/link";
import { Gamepad2 } from "lucide-react";

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-center">
      <div>
        <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-accent text-accent-fg">
          <Gamepad2 className="h-7 w-7" />
        </span>
        <h1 className="font-display text-5xl font-bold">404</h1>
        <p className="mt-2 text-muted">Такой страницы нет. Game over.</p>
        <Link href="/" className="btn-primary mt-6">
          На главную
        </Link>
      </div>
    </div>
  );
}
