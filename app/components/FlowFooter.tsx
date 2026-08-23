// Shared footer for the hub, index, and detail pages. No hooks, so it
// renders in Server Components and is part of the crawlable HTML. The
// escalation path is the Mazatrol assistant — there is no phone line.
export function FlowFooter() {
  return (
    <footer className="flow-footer">
      <a href="https://mazatrol.cowie.ai" className="flow-footer__call">
        Still stuck? Ask the Mazatrol assistant →
      </a>
      <span className="mono-label muted">
        cowie.ai · independent third-party · not affiliated with Yamazaki Mazak
      </span>
    </footer>
  );
}
