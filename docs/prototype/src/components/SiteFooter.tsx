import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl font-semibold">Forum500</p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            A private membership for people who make ideas happen. Founded in London, 2010.
          </p>
        </div>
        <div>
          <p className="eyebrow">Explore</p>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            <Link to="/about" className="text-foreground/80 hover:text-foreground">The Club</Link>
            <Link to="/inforum" className="text-foreground/80 hover:text-foreground">In:Forum</Link>
            <Link to="/auth" className="text-foreground/80 hover:text-foreground">Member sign in</Link>
          </div>
        </div>
        <div>
          <p className="eyebrow">Membership</p>
          <p className="mt-4 text-sm text-muted-foreground">
            Membership is by invitation and member recommendation. To express an interest, ask a member to
            introduce you.
          </p>
        </div>
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Forum500. All rights reserved.
      </div>
    </footer>
  );
}
