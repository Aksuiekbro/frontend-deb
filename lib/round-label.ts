// Backend round names sometimes carry a trailing ".0" (e.g. "1/16.0") because the
// value round-trips through a numeric field upstream. This strips that suffix for
// display only — callers must keep using the raw round name/value for selection
// state and API calls.
export const displayRoundLabel = (round: string) => round.replace(/\.0$/, "")
