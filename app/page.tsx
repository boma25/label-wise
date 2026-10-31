import { LabelWiseApp } from "@/components/LabelWiseApp";

export default function Home() {
  return (
    <main className="relative min-h-full flex-1 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(15,118,110,0.12),_transparent_55%),linear-gradient(180deg,#f7f4ef_0%,#ebe6dc_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:repeating-linear-gradient(0deg,transparent,transparent_23px,rgba(28,25,23,0.04)_24px)]"
      />
      <div className="relative">
        <LabelWiseApp />
      </div>
    </main>
  );
}
