// Shared footer for the hub, index, and alarm detail pages. No hooks, so it
// renders in Server Components and is part of the crawlable HTML.
export function FlowFooter() {
  return (
    <footer className="flow-footer">
      <a href="tel:+13184089163" className="flow-footer__call">
        Faulted right now? Call support — 24/7
      </a>
      <span className="mono-label muted">
        cowie.ai · independent third-party · not affiliated with Yamazaki Mazak
      </span>
    </footer>
  );
}
