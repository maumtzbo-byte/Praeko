// Gates IntroReveal's cinematic entrance to once per session — sessionStorage
// (not localStorage) so it replays on a genuinely new visit, not just once
// ever per browser.
const SEEN_KEY = "frames_intro_seen";

export function hasSeenIntro(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    // Storage can throw in private-browsing/locked-down contexts — treat
    // as "not seen" so the page still works, just always plays the intro.
    return false;
  }
}

export function markIntroSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    // Nothing to do if storage is unavailable — worst case the intro
    // replays on the next page, which is harmless.
  }
}
