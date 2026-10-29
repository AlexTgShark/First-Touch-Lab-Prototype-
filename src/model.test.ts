import test from "node:test";
import assert from "node:assert/strict";
import {
  challengeProgress,
  challenges,
  dateKey,
  emptyStore,
  id,
  offsetDate,
  removeDemo,
  seed,
  stats,
  validStore,
  weekStart,
} from "./model.ts";
import type { Session } from "./model.ts";
const log = (
  focus: Session["focus"] = "First Touch",
  date = dateKey(),
  demo = false,
): Session => ({
  id: id(),
  date,
  time: "17:30",
  focus,
  duration: 30,
  actual: 25,
  notes: "",
  completed: true,
  demo,
});
test("seeded data and JSON roundtrip pass backup validation", () => {
  const s = seed();
  assert.equal(validStore(s), true);
  assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  assert.equal(validStore(JSON.parse(JSON.stringify(s))), true);
});
test("completion updates weekly totals; plans do not count", () => {
  const s = emptyStore();
  const l = log();
  s.sessions = [{ ...l, completed: false, actual: 0 }];
  assert.equal(stats(s).totalMinutes, 0);
  s.sessions[0] = { ...l };
  assert.equal(stats(s).totalMinutes, 25);
  assert.equal(stats(s).week.length, 1);
  s.sessions[0].actual = 40;
  assert.equal(stats(s).totalMinutes, 40);
  s.sessions = [];
  assert.equal(stats(s).week.length, 0);
});
test("weekly boundary includes Monday and excludes following Monday", () => {
  const s = emptyStore();
  const monday = weekStart();
  s.sessions = [
    log("Passing", dateKey(monday)),
    log("Passing", offsetDate(7, monday)),
    log("Passing", offsetDate(-1, monday)),
  ];
  assert.equal(stats(s).week.length, 1);
});
test("daily challenges count distinct days and respect focus/start", () => {
  const s = emptyStore();
  s.challenges = [{ id: 0, started: offsetDate(-1) }];
  s.sessions = [
    log("Ball Control"),
    log("Ball Control"),
    log("Passing"),
    log("Ball Control", offsetDate(-2)),
  ];
  assert.equal(challengeProgress(s, 0), 1);
  s.sessions.push(log("Ball Control", offsetDate(-1)));
  assert.equal(challengeProgress(s, 0), 2);
  s.sessions = s.sessions.filter((x) => x.date !== dateKey());
  assert.equal(challengeProgress(s, 0), 1);
});
test("session challenge counts qualifying completed sessions and caps target", () => {
  const s = emptyStore();
  s.challenges = [{ id: 5, started: dateKey() }];
  s.sessions = [
    ...Array.from({ length: 8 }, () => log("Dribbling")),
    log("Passing"),
    { ...log("Dribbling"), completed: false },
  ];
  assert.equal(challengeProgress(s, 5), challenges[5].target);
  s.challenges = [];
  assert.equal(challengeProgress(s, 5), 0);
});
test("first touch challenge uses distinct test dates only", () => {
  const s = emptyStore();
  s.challenges = [{ id: 3, started: offsetDate(-2) }];
  s.results = [
    { id: id(), test: 4, date: dateKey(), score: 10 },
    { id: id(), test: 4, date: dateKey(), score: 12 },
    { id: id(), test: 0, date: offsetDate(-1), score: 30 },
    { id: id(), test: 4, date: offsetDate(-1), score: 13 },
  ];
  assert.equal(challengeProgress(s, 3), 2);
});
test("sample removal preserves user entries and preferences", () => {
  const s = seed();
  const own = log();
  s.sessions.push(own);
  s.preferences.nickname = "Alex";
  const clean = removeDemo(s);
  assert.deepEqual(clean.sessions, [own]);
  assert.equal(clean.results.length, 0);
  assert.equal(clean.challenges.length, 0);
  assert.equal(clean.preferences.nickname, "Alex");
});
test("corrupt and hostile backups are rejected", () => {
  for (const bad of [
    null,
    [],
    {},
    "hello",
    { ...emptyStore(), version: 3 },
    { ...emptyStore(), sessions: [{}] },
    {
      ...emptyStore(),
      results: [{ id: "a", test: 99, score: 1, date: dateKey() }],
    },
    { ...emptyStore(), preferences: { ...emptyStore().preferences, goal: 0 } },
    { ...emptyStore(), favorites: [99] },
    { ...emptyStore(), challenges: [{ id: 55, started: dateKey() }] },
  ])
    assert.equal(validStore(bad), false);
  const s = emptyStore();
  s.sessions = [log()];
  s.sessions[0].date = "2026-02-31";
  assert.equal(validStore(s), false);
  s.sessions = [log()];
  s.sessions.push({ ...s.sessions[0] });
  assert.equal(validStore(s), false);
});
test("skill test bounds, decimal times and future dates are validated", () => {
  const s = emptyStore();
  s.results = [{ id: id(), test: 4, score: 21, date: dateKey() }];
  assert.equal(validStore(s), false);
  s.results[0].score = 16;
  assert.equal(validStore(s), true);
  s.results[0].score = 1.5;
  assert.equal(validStore(s), false);
  s.results[0].test = 3;
  assert.equal(validStore(s), true);
  s.results[0].date = offsetDate(1);
  assert.equal(validStore(s), false);
});
test("streak includes yesterday when today is a rest day", () => {
  const s = emptyStore();
  s.sessions = [
    log("Passing", offsetDate(-1)),
    log("Passing", offsetDate(-2)),
    log("Passing", offsetDate(-4)),
  ];
  assert.equal(stats(s).streak, 2);
  s.sessions.push(log());
  assert.equal(stats(s).streak, 3);
});

test("catalog has stable IDs, full instructions and correct participant totals", async () => {
  const { drills } = await import("./drills.ts");
  assert.equal(drills.length, 60);
  assert.equal(new Set(drills.map((d) => d.id)).size, 60);
  for (const n of [1, 2, 3, 4]) {
    assert.ok(
      drills.filter((d) => !d.goalkeeper && d.players === n).length >= 8,
    );
    assert.equal(
      drills.filter((d) => d.goalkeeper && d.players === n).length,
      4,
    );
  }
  for (const d of drills) {
    assert.ok(d.steps.length >= 3);
    for (const field of [
      "description",
      "objective",
      "space",
      "target",
      "mistakes",
      "progression",
      "safety",
    ])
      assert.ok(d[field as keyof typeof d]);
    assert.equal(d.goalkeepers, d.goalkeeper ? 1 : 0);
  }
  const special = drills.find((d) => d.id === "gk-4-01")!;
  assert.equal(special.players, 4);
  assert.equal(special.goalkeepers, 1);
  assert.equal(special.name, "2v1 Attack Against Goalkeeper");
});
test("every drill saves and selects exactly once without changing training totals", async () => {
  const { drills } = await import("./drills.ts");
  const { addSavedDrill, removeSavedDrill } = await import("./model.ts");
  let s = emptyStore();
  s.sessions = [log()];
  for (const drill of drills) {
    s = addSavedDrill(s, drill.id);
    s = addSavedDrill(s, drill.id);
    assert.equal(s.selectedDrillId, drill.id);
    assert.equal(s.savedDrills.filter((id) => id === drill.id).length, 1);
    assert.equal(stats(s).totalMinutes, 25);
    assert.equal(validStore(s), true);
  }
  const last = s.selectedDrillId!;
  s = removeSavedDrill(s, last);
  assert.equal(s.savedDrills.length, 59);
  assert.notEqual(s.selectedDrillId, last);
  assert.equal(s.sessions.length, 1);
});
test("version-one browser data and backups migrate without losing history", async () => {
  const { readStore } = await import("./model.ts");
  const old = { ...seed(), version: 1, favorites: [0, 11] };
  delete (old as any).savedDrills;
  delete (old as any).selectedDrillId;
  delete (old as any).schedulingDraft;
  const migrated = readStore(old)!;
  assert.equal(migrated.version, 2);
  assert.deepEqual(migrated.favorites, ["legacy-0", "legacy-11"]);
  assert.deepEqual(migrated.sessions, old.sessions);
  assert.deepEqual(migrated.results, old.results);
  assert.equal(validStore(migrated), true);
  assert.equal(readStore({ ...old, favorites: [100] }), null);
});
test("orphan references and inconsistent selections are rejected", () => {
  const s = emptyStore();
  assert.equal(validStore({ ...s, savedDrills: ["missing"] }), false);
  assert.equal(validStore({ ...s, selectedDrillId: "outfield-3-01" }), false);
  assert.equal(
    validStore({ ...s, sessions: [{ ...log(), drillId: "missing" }] }),
    false,
  );
  assert.equal(
    validStore({ ...s, schedulingDraft: { ...log(), drillId: "gk-4-01" } }),
    true,
  );
});
