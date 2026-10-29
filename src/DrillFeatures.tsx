import { useId, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock,
  Plus,
  Search,
  ShieldCheck,
  Star,
  Target,
  Trash2,
  Users,
} from "lucide-react";
import { drills, drillById } from "./drills";
import type { Drill } from "./drills";
import type { Store } from "./model";
export const roster = (d: Drill) =>
  `${d.players} ${d.players === 1 ? "player" : "players"}${d.goalkeeper ? ` · 1 goalkeeper + ${d.players - 1} outfield` : " · Outfield"}`;
type Actions = {
  show: (id: string) => void;
  add: (id: string) => void;
  schedule: (id: string) => void;
};
export function DrillLibrary({
  data,
  update,
  show,
  add,
  schedule,
}: { data: Store; update: (fn: (s: Store) => Store) => void } & Actions) {
  const [tab, setTab] = useState("1 Player");
  const [players, setPlayers] = useState("All players");
  const [search, setSearch] = useState("");
  const [focus, setFocus] = useState("All skills");
  const [difficulty, setDifficulty] = useState("All difficulties");
  const [equipment, setEquipment] = useState("All equipment");
  const [favorite, setFavorite] = useState(false);
  const categories = [
    "1 Player",
    "2 Players",
    "3 Players",
    "4 Players",
    "Goalkeeper Drills",
  ];
  const filtered = drills.filter(
    (d) =>
      (tab === "Goalkeeper Drills"
        ? d.goalkeeper &&
          (players === "All players" || d.players === Number(players))
        : !d.goalkeeper && d.players === parseInt(tab)) &&
      `${d.name} ${d.description} ${d.focus}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (focus === "All skills" || d.focus === focus) &&
      (difficulty === "All difficulties" || d.difficulty === difficulty) &&
      (equipment === "All equipment" ||
        d.equipment.toLowerCase().includes(equipment.toLowerCase())) &&
      (!favorite || data.favorites.includes(d.id)),
  );
  return (
    <>
      <div className="drill-tabs" role="tablist" aria-label="Drill categories">
        {categories.map((c) => (
          <button
            role="tab"
            aria-selected={tab === c}
            key={c}
            tabIndex={tab === c ? 0 : -1}
            onClick={() => {
              setTab(c);
              setFocus("All skills");
            }}
            onKeyDown={(e) => {
              if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) {
                e.preventDefault();
                const index =
                  e.key === "Home"
                    ? 0
                    : e.key === "End"
                      ? 4
                      : (categories.indexOf(c) +
                          (e.key === "ArrowRight" ? 1 : 4)) %
                        5;
                setTab(categories[index]);
                setFocus("All skills");
                (
                  e.currentTarget.parentElement?.children[index] as HTMLElement
                )?.focus();
              }
            }}
          >
            {c}
          </button>
        ))}
      </div>
      {tab === "Goalkeeper Drills" && (
        <div className="goalkeeper-intro">
          <ShieldCheck size={28} />
          <div>
            <h2>Between the posts. Part of the team.</h2>
            <p>
              Handling, footwork, distribution, and controlled shot stopping. A
              goalkeeper counts as one participant.
            </p>
          </div>
          <label>
            Total participants
            <select
              aria-label="Goalkeeper player count"
              value={players}
              onChange={(e) => setPlayers(e.target.value)}
            >
              {["All players", "1", "2", "3", "4"].map((n) => (
                <option key={n} value={n}>
                  {n === "All players"
                    ? n
                    : `${n} ${n === "1" ? "Player" : "Players"}`}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      <div className="library-filters">
        <label className="search">
          <Search size={18} />
          <input
            aria-label="Search drills"
            placeholder="Search names, descriptions, or skills…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          aria-label="Filter drills by skill"
          value={focus}
          onChange={(e) => setFocus(e.target.value)}
        >
          {[
            "All skills",
            ...new Set(
              drills
                .filter((d) => d.goalkeeper === (tab === "Goalkeeper Drills"))
                .map((d) => d.focus),
            ),
          ].map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
        <select
          aria-label="Filter drills by difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          {["All difficulties", "Beginner", "Intermediate"].map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
        <select
          aria-label="Filter drills by equipment"
          value={equipment}
          onChange={(e) => setEquipment(e.target.value)}
        >
          {[
            "All equipment",
            "Ball",
            "Wall",
            "Cones",
            "Goal",
            "Soft surface",
          ].map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
        <button
          className={"button " + (favorite ? "dark" : "secondary")}
          aria-pressed={favorite}
          onClick={() => setFavorite(!favorite)}
        >
          <Star size={16} />
          Saved ({data.favorites.length})
        </button>
      </div>
      <div role="tabpanel" aria-label={tab}>
        <p className="muted">
          {filtered.length} drills · {drills.length} in the full library. Player
          counts include everyone taking part.
        </p>
        <div className="drill-grid">
          {filtered.map((d) => (
            <section
              className="card drill-card"
              data-drill-id={d.id}
              key={d.id}
            >
              <div
                className={
                  "roster-graphic " + (d.goalkeeper ? "gk-graphic" : "")
                }
              >
                <span className="eyebrow">
                  {d.goalkeeper
                    ? "GOALKEEPER TRAINING"
                    : "TRAIN TOGETHER, AT YOUR PACE"}
                </span>
                <div className="roster-dots" aria-hidden="true">
                  {Array.from({ length: d.players }, (_, i) => (
                    <span
                      className={d.goalkeeper && i === 0 ? "keeper-dot" : ""}
                      key={i}
                    >
                      {d.goalkeeper && i === 0
                        ? "GK"
                        : i + (d.goalkeeper ? 0 : 1)}
                    </span>
                  ))}
                </div>
                <button
                  className="favorite-button"
                  aria-label={
                    (data.favorites.includes(d.id) ? "Unsave " : "Save ") +
                    d.name
                  }
                  aria-pressed={data.favorites.includes(d.id)}
                  onClick={() =>
                    update((s) => ({
                      ...s,
                      favorites: s.favorites.includes(d.id)
                        ? s.favorites.filter((id) => id !== d.id)
                        : [...s.favorites, d.id],
                    }))
                  }
                >
                  <Star
                    size={19}
                    fill={
                      data.favorites.includes(d.id) ? "currentColor" : "none"
                    }
                  />
                </button>
              </div>
              <div className="drill-copy">
                <div className="drill-meta">
                  <span className="eyebrow">{d.focus}</span>
                  <span className="chip">{d.difficulty}</span>
                </div>
                <h2>{d.name}</h2>
                <p className="drill-roster">
                  <Users size={14} />
                  {roster(d)}
                </p>
                <p>
                  <Clock size={14} />
                  {d.duration} min · {d.equipment}
                </p>
                <p className="drill-description">{d.description}</p>
                <button className="text-button" onClick={() => show(d.id)}>
                  View Drill <ArrowUpRight size={16} />
                </button>
                <div className="drill-card-actions">
                  <button
                    className="button dark full"
                    onClick={() => add(d.id)}
                  >
                    {data.savedDrills.includes(d.id) ? (
                      <Check size={15} />
                    ) : (
                      <Plus size={15} />
                    )}
                    Add to Dashboard
                  </button>
                  <button
                    className="button secondary full"
                    onClick={() => schedule(d.id)}
                  >
                    <CalendarDays size={15} />
                    Schedule Drill
                  </button>
                </div>
              </div>
            </section>
          ))}
        </div>
        {!filtered.length && (
          <div className="empty">
            <Search size={26} />
            <p>No matching drills. Try another search or clear a filter.</p>
            <button
              className="text-button"
              onClick={() => {
                setSearch("");
                setFocus("All skills");
                setEquipment("All equipment");
                setDifficulty("All difficulties");
                setFavorite(false);
                setPlayers("All players");
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
      <div className="info-strip">
        <ShieldCheck size={20} />
        General practice ideas, not professional coaching. Warm up and progress
        gradually. For goalkeeper work, use safe grass, turf, or mats; no full
        dives on hard surfaces or powerful close-range shots. Seek qualified
        coaching for advanced diving.
      </div>
    </>
  );
}
export function DrillDetails({
  drill: d,
  add,
  schedule,
}: {
  drill: Drill;
  add: (id: string) => void;
  schedule: (id: string) => void;
}) {
  return (
    <div className="drill-detail">
      <div className="drill-meta">
        <span className="chip">
          {d.focus} · {d.difficulty}
        </span>
        <span className="muted">{d.duration} minutes</span>
      </div>
      <p className="detail-roster">
        <Users size={18} />
        {roster(d)}
      </p>
      <h3>Main objective</h3>
      <p>{d.objective}</p>
      <div className="detail-facts">
        <div>
          <strong>Equipment</strong>
          <p>{d.equipment}</p>
        </div>
        <div>
          <strong>Space</strong>
          <p>{d.space}</p>
        </div>
      </div>
      <h3>How to practise</h3>
      <ol>
        {d.steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      <h3>Measure your progress</h3>
      <p>
        {d.target} Suggested practice: {d.duration} minutes, including rests.
      </p>
      <h3>Common mistakes</h3>
      <p>{d.mistakes}</p>
      <h3>Make it work for you</h3>
      <p>{d.progression}</p>
      {["gk-4-01", "outfield-3-01", "outfield-1-01"].includes(d.id) && (
        <DrillDiagram drill={d} />
      )}
      <div className="info-strip">
        <ShieldCheck size={20} />
        {d.safety}
      </div>
      <button className="button dark full" onClick={() => add(d.id)}>
        <Plus size={17} />
        Add to Dashboard
      </button>
      <button className="button secondary full" onClick={() => schedule(d.id)}>
        <CalendarDays size={17} />
        Schedule Drill
      </button>
      <small className="muted">
        First Touch Lab · General beginner-friendly practice, not a substitute
        for professional coaching.
      </small>
    </div>
  );
}
export function DrillDiagram({ drill: d }: { drill: Drill }) {
  const uid = useId().replace(/:/g, "");
  const gk = d.id === "gk-4-01";
  const solo = d.id === "outfield-1-01";
  const positions = gk
    ? [
        ["Attacker A", 85, 220],
        ["Attacker B", 265, 220],
        ["Defender", 175, 135],
        ["Goalkeeper", 175, 55],
      ]
    : solo
      ? [["Player", 65, 235]]
      : [
          ["Player A", 80, 220],
          ["Player B", 270, 220],
          ["Player C", 175, 65],
        ];
  return (
    <figure className="drill-diagram">
      <figcaption>
        {gk
          ? "2 attackers + 1 defender + 1 goalkeeper = 4 people"
          : solo
            ? "Solo five-cone route"
            : "Three-player passing triangle"}
      </figcaption>
      <svg
        viewBox="0 0 350 290"
        role="img"
        aria-label={
          gk
            ? "Two attackers, one defender, one goalkeeper and goal"
            : solo
              ? "Player weaving through five cones"
              : "Three players passing around a triangle"
        }
      >
        <defs>
          <marker
            id={uid}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="m0 0 10 5-10 5Z" fill="#8cfa9c" />
          </marker>
        </defs>
        <rect
          x="10"
          y="12"
          width="330"
          height="265"
          rx="8"
          fill="#173422"
          stroke="#74977a"
        />
        {gk && (
          <>
            <path
              d="M140 12V4h70v8"
              fill="none"
              stroke="white"
              strokeWidth="3"
            />
            <text x="175" y="26" textAnchor="middle" fill="white" fontSize="10">
              Goal
            </text>
            <path
              d="M106 215 247 215M263 199 190 75"
              fill="none"
              stroke="#8cfa9c"
              strokeWidth="2"
              markerEnd={`url(#${uid})`}
            />
            <path
              d="M172 130 230 150"
              fill="none"
              stroke="#8cfa9c"
              strokeDasharray="5 5"
              markerEnd={`url(#${uid})`}
            />
          </>
        )}
        {!gk && !solo && (
          <path
            d="M103 220H245M260 196 188 88M162 88 92 195"
            fill="none"
            stroke="#8cfa9c"
            strokeWidth="2"
            markerEnd={`url(#${uid})`}
          />
        )}
        {solo && (
          <>
            <path
              d="M66 220Q180 205 130 175T130 125T130 75T170 35"
              fill="none"
              stroke="#8cfa9c"
              strokeDasharray="5 5"
              strokeWidth="2"
              markerEnd={`url(#${uid})`}
            />
            {[65, 100, 135, 170, 205].map((y) => (
              <path d={`m158 ${y + 7} 8-15 8 15Z`} fill="#e7bb6d" key={y} />
            ))}
          </>
        )}
        {positions.map(([label, x, y]) => (
          <g key={label as string}>
            <circle
              cx={x}
              cy={y}
              r="17"
              fill={
                label === "Goalkeeper"
                  ? "#eacb7f"
                  : label === "Defender"
                    ? "#b4bfb3"
                    : "#39e75f"
              }
            />
            <text
              x={x}
              y={Number(y) + 4}
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fill="#111"
            >
              {label === "Goalkeeper"
                ? "GK"
                : label === "Defender"
                  ? "D"
                  : (label as string).split(" ").pop()}
            </text>
            <text
              x={x}
              y={Number(y) + 32}
              textAnchor="middle"
              fontSize="10"
              fill="white"
            >
              {label}
            </text>
          </g>
        ))}
        <circle
          cx={gk ? 108 : solo ? 88 : 106}
          cy={gk ? 228 : solo ? 230 : 228}
          r="5"
          fill="white"
          stroke="#111"
        />
      </svg>
      <p>
        White dot: ball · Solid arrows: passes / shots · Dashed arrows:
        movement. Diagram is schematic; use the space and safety guidance above.
      </p>
    </figure>
  );
}
export function SavedDrills({
  data,
  show,
  schedule,
  remove,
  select,
}: {
  data: Store;
  show: (id: string) => void;
  schedule: (id: string) => void;
  remove: (id: string) => void;
  select: (id: string) => void;
}) {
  const selected = drillById(data.selectedDrillId);
  return (
    <section className="card saved-drills">
      <div className="section-head">
        <div>
          <h2>My Saved Drills</h2>
          <p>Your choices. Ready for your next session.</p>
        </div>
        <span className="chip">{data.savedDrills.length} saved</span>
      </div>
      {selected && (
        <div className="selected-drill">
          <span className="eyebrow">
            <Target size={13} />
            Currently Selected Drill
          </span>
          <h3>{selected.name}</h3>
          <p>
            {roster(selected)} · {selected.focus} · {selected.duration} minutes
          </p>
          <p>{selected.steps[0]}</p>
          <button className="text-button" onClick={() => show(selected.id)}>
            View full instructions <ArrowUpRight size={15} />
          </button>
        </div>
      )}
      {data.savedDrills.length ? (
        data.savedDrills.map((id) => {
          const d = drillById(id)!;
          return (
            <article className="saved-drill-row" key={id}>
              <div>
                <h3>{d.name}</h3>
                <p>
                  {roster(d)} · {d.duration} min · {d.focus}
                </p>
              </div>
              <div className="saved-actions">
                <button className="text-button" onClick={() => show(id)}>
                  View Details
                </button>
                <button
                  className="button secondary"
                  onClick={() => schedule(id)}
                >
                  Schedule
                </button>
                <button
                  className="icon-button"
                  aria-label={"Remove " + d.name}
                  onClick={() => remove(id)}
                >
                  <Trash2 size={16} />
                </button>
                <button
                  className="text-button"
                  aria-pressed={data.selectedDrillId === id}
                  onClick={() => select(id)}
                >
                  {data.selectedDrillId === id ? "Selected" : "Select"}
                </button>
              </div>
            </article>
          );
        })
      ) : (
        <div className="empty">
          <Target size={26} />
          <p>
            No saved drills yet. Choose a drill in the library and tap Add to
            Dashboard.
          </p>
        </div>
      )}
    </section>
  );
}
