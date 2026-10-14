// Shown once every story line has been found: turns the question on the viewer.
export default function MaddEnding({ onClose }: { onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="madd-ending-title"
      className="madd-ending fixed inset-0 z-40 flex items-center justify-center bg-black/85 px-6"
    >
      <div className="max-w-lg font-mono text-sm leading-relaxed text-neutral-300">
        <p>You just put together a stranger's life from 355 searches.</p>
        <p className="mt-4">
          He never meant for anyone to read them. In August 2006, AOL published three months of search history from
          about 650,000 of its users. Names were swapped for numbers. His was 11139391.
        </p>
        <p className="mt-4">
          It didn't take a name to find the house he wanted, the bills he was fighting over, the test he was waiting on,
          or what he searched for late at night once everyone was asleep.
        </p>
        <h2 id="madd-ending-title" className="mt-10 font-mono text-2xl font-normal text-white sm:text-3xl">
          how much of you is online?
        </h2>
        <p className="mt-4 text-neutral-500">What would someone learn from yours?</p>
        <button
          onClick={onClose}
          autoFocus
          className="mt-10 border border-neutral-600 px-4 py-2 text-xs uppercase tracking-widest text-neutral-300 hover:border-white hover:bg-white hover:text-black"
        >
          close
        </button>
      </div>
      <style>{`
        .madd-ending { animation: madd-ending-in 2.4s ease-out both; }
        @keyframes madd-ending-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
