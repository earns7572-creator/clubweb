import assert from "node:assert/strict";
import { createDefaultEq } from "../client/src/lib/speakerEq";
import { RESPONSE_FREQUENCIES, findIntersections, getSpeakerResponse } from "../client/src/lib/responseCurve";

const speaker = (kind: "sub" | "woofer" | "full" | "mid" | "high") => ({ id: `${kind}-test`, kind, label: kind, position: { x: .5, y: .5, z: .5 }, level: 1, muted: false, responseProfileId: kind, activity: 0, eq: createDefaultEq() });

assert.equal(RESPONSE_FREQUENCIES.length, 240);
assert.equal(RESPONSE_FREQUENCIES[0], 20);
assert.equal(RESPONSE_FREQUENCIES.at(-1), 20_000);
assert.ok(RESPONSE_FREQUENCIES.every((frequency, index) => index === 0 || frequency > RESPONSE_FREQUENCIES[index - 1]));

const full = speaker("full");
const flatResponse = getSpeakerResponse(full);
assert.ok(flatResponse.every((point) => Math.abs(point.db) < .001), "FULL allpass and flat Custom EQ should render a flat Filter Response");

const boosted = { ...full, eq: { ...full.eq, lowMid: { ...full.eq.lowMid, gainDb: 9 } } };
const boostedResponse = getSpeakerResponse(boosted);
const maximumBoost = Math.max(...boostedResponse.map((point, index) => point.db - flatResponse[index].db));
assert.ok(maximumBoost > 8, "Custom EQ gain must visibly alter only this Speaker response");

const crossings = findIntersections([{ frequency: 100, db: -9 }, { frequency: 200, db: 3 }], [{ frequency: 100, db: 3 }, { frequency: 200, db: -9 }]);
assert.equal(crossings.length, 1);
assert.ok(crossings[0].frequency > 100 && crossings[0].frequency < 200);

console.log("response curve tests passed");
