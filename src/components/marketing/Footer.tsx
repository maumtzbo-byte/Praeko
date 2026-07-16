export default function Footer() {
  return (
    <footer className="border-t border-[var(--hairline)] py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-zinc-500 sm:flex-row">
        <span className="font-semibold tracking-[0.2em] text-zinc-700">
          PRAEKO
        </span>
        <p>Marketing con inteligencia, para negocios pequeños en México.</p>
        <span>&copy; {new Date().getFullYear()} Praeko</span>
      </div>
    </footer>
  );
}
