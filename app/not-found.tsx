import Link from "next/link";
import { LogoMark } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-center">
      <div className="animate-fade-up">
        <div className="mb-5 flex justify-center">
          <LogoMark size={56} />
        </div>
        <h1 className="font-display text-6xl font-extrabold text-glow">404</h1>
        <p className="mt-2 font-mono text-sm text-muted">
          game over · такой страницы нет
        </p>
        <Link href="/" className="btn-primary mt-7">
          Continue → на главную
        </Link>
      </div>
    </div>
  );
}
