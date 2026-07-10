import posthog from "posthog-js";

const POSTHOG_KEY = "phc_v8iKULC3QagSPD46NriJGwzGiigqLoauRNF7DtJrJwmB";
const POSTHOG_HOST = "https://us.i.posthog.com";

const hashParams = new URLSearchParams(window.location.hash.slice(1));
const distinctID = hashParams.get("distinct_id") ?? undefined;
const sessionID = hashParams.get("session_id") ?? undefined;

posthog.init(POSTHOG_KEY, {
  api_host: POSTHOG_HOST,
  defaults: "2026-06-25",
  capture_pageview: false,
  ...(distinctID && sessionID ? { bootstrap: { distinctID, sessionID } } : {}),
});

if (distinctID || sessionID) {
  const url = new URL(window.location.href);
  url.hash = "";
  window.history.replaceState(null, "", url.toString());
}

posthog.capture("$pageview");

export function onRouterTransitionStart(url: string) {
  posthog.capture("$pageview", { $current_url: url });
}
