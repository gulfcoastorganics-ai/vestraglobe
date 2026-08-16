"use client";

import { useEffect, useState, type CSSProperties } from "react";
import dynamic from "next/dynamic";

const ProjectSphere3D = dynamic(() => import("./ProjectSphere3D"), {
  ssr: false,
  loading: () => <div className="sphere-loading" aria-label="Assembling three-dimensional project sphere"><span /><span /><span /></div>,
});

type Project = {
  name: string;
  slug: string;
  type: string;
  state: string;
  color: string;
  oneLine: string;
  discussion: string;
  focus: [string, string, string];
};

const projects: Project[] = [
  {
    name: "Vestra Intel", slug: "vestra-intel", type: "Public-data intelligence", state: "ACTIVE", color: "#d7ff4f",
    oneLine: "Turns scattered public signals into qualified, commercially useful intelligence.",
    discussion: "Vestra Intel is an intelligence pipeline built to discover, normalize, and rank public-data opportunities. It connects source discovery, entity resolution, anomaly detection, economic screening, and clear monetization routes so research ends with an actionable decision—not another pile of records.",
    focus: ["Source discovery", "Opportunity scoring", "Decision-ready dossiers"],
  },
  {
    name: "Chain Trace", slug: "chain-trace", type: "Crypto forensics", state: "BUILDING", color: "#5ee9ff",
    oneLine: "Follows value through complex networks while preserving an evidence-first trail.",
    discussion: "Chain Trace explores how dense transaction histories can become legible forensic narratives. The system emphasizes provenance, explainable links, coverage boundaries, and responsible analysis for authorized investigations and wallet research.",
    focus: ["Transaction tracing", "Evidence provenance", "Explainable findings"],
  },
  {
    name: "Leaked Wallet Defender", slug: "leaked-wallet-defender", type: "Defensive security", state: "DEFENSIVE", color: "#ff7f5c",
    oneLine: "Detects exposed wallet secrets before accidental disclosure becomes irreversible loss.",
    discussion: "Leaked Wallet Defender is a local-first defensive scanner for authorized repositories and files. It identifies contextual wallet-secret exposure, redacts sensitive material, and adds read-only activity signals without storing the raw secret—keeping the workflow centered on containment and remediation.",
    focus: ["Secret detection", "Safe redaction", "Read-only enrichment"],
  },
  {
    name: "Subterra Atlas", slug: "subterra-atlas", type: "Interactive world", state: "EXPERIMENT", color: "#aa87ff",
    oneLine: "Maps a hidden world where terrain, narrative, and discovery share one surface.",
    discussion: "Subterra Atlas is an interactive worldbuilding experiment organized around the underground: layers, passages, concealed spaces, and the stories attached to them. It treats the map as both an interface and a living narrative system.",
    focus: ["World systems", "Spatial storytelling", "Interactive cartography"],
  },
  {
    name: "Jarvix", slug: "jarvix", type: "AI automation", state: "CONCEPT", color: "#ffd65a",
    oneLine: "An operator layer that helps translate intent into coordinated action.",
    discussion: "Jarvix is a concept for an AI-assisted operating layer that can understand a goal, break it into practical moves, and keep the work visible. The emphasis is on useful orchestration: fewer disconnected tools, clearer state, and stronger handoffs between human judgment and automation.",
    focus: ["Intent routing", "Workflow orchestration", "Human oversight"],
  },
  {
    name: "FULCRUMHAUS", slug: "fulcrumhaus", type: "Strategy · Design · Engineering", state: "STRATEGY", color: "#f57dff",
    oneLine: "A strategic design and engineering house built around leverage and decisive delivery.",
    discussion: "FULCRUMHAUS brings strategy, product design, and full-stack engineering into one focused engagement. It is designed for organizations facing customer friction, disconnected systems, or an opportunity that needs to move from ambiguous to operational.",
    focus: ["Strategic clarity", "Product systems", "Technical delivery"],
  },
  {
    name: "Small Patch", slug: "small-patch", type: "Digital utility", state: "PROTOTYPE", color: "#70f5bd",
    oneLine: "Small, targeted interventions that unlock disproportionate momentum.",
    discussion: "Small Patch is the compact delivery model: identify the sharpest point of friction, repair it quickly, and leave the surrounding system healthier. It is a home for focused web fixes, integrations, automation, interface improvements, and practical digital rescue work.",
    focus: ["Rapid diagnosis", "Focused implementation", "Measurable relief"],
  },
  {
    name: "Digital NDA", slug: "digital-nda", type: "Trust infrastructure", state: "CONCEPT", color: "#ffad63",
    oneLine: "A lightweight trust layer for collaboration before sensitive work begins.",
    discussion: "Digital NDA explores how early-stage agreements can feel clear, immediate, and human without losing the gravity of the commitment. The concept centers on guided terms, explicit acknowledgement, traceable consent, and a cleaner path into confidential collaboration.",
    focus: ["Clear agreements", "Traceable consent", "Frictionless onboarding"],
  },
  {
    name: "Wublabz", slug: "wublabz", type: "Creative audio technology", state: "EXPERIMENT", color: "#c39bff",
    oneLine: "A browser-based laboratory for sound, play, and unusual musical interfaces.",
    discussion: "Wublabz is an experimental audio engine and creative playground. It treats synthesis, effects, and interaction as material for discovery—making it possible to shape sound visually, prototype strange instruments, and turn technical audio systems into an expressive experience.",
    focus: ["Audio engine", "Visual sound design", "Creative interaction"],
  },
  {
    name: "GitReal", slug: "gitreal", type: "Developer tooling", state: "BUILDING", color: "#62d5ff",
    oneLine: "Makes the real state of software work visible beyond the appearance of progress.",
    discussion: "GitReal is a developer-tool concept focused on the gap between repository activity and actual delivery. It surfaces meaningful state—what changed, what is blocked, what is verified, and what is ready—so teams can reason about shipping with less ceremony and more truth.",
    focus: ["Repository intelligence", "Delivery state", "Verification signals"],
  },
  {
    name: "TraceLens", slug: "tracelens", type: "Evidence interface", state: "BUILDING", color: "#e7f45b",
    oneLine: "Turns dense traces into a structured visual field for confident investigation.",
    discussion: "TraceLens is an evidence-centered interface for examining complex technical traces. It organizes entities, events, relationships, confidence, and coverage into a navigable visual system so an investigator can move from raw evidence to a defensible interpretation.",
    focus: ["Evidence mapping", "Relationship views", "Confidence and coverage"],
  },
];

export default function Home() {
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [reduced, setReduced] = useState(false);
  const [paused, setPaused] = useState(false);
  const [clock, setClock] = useState("00:00:00");
  const project = projects[active];

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { setReduced(media.matches); setPaused(media.matches); };
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString([], { hour12: false }));
    tick(); const id = window.setInterval(tick, 1000); return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close);
  }, []);

  const openProject = (index: number) => {
    setActive(index);
    setSelected(null);
    window.requestAnimationFrame(() => setSelected(index));
  };

  return (
    <main className={reduced ? "reduced" : ""}>
      <nav className="nav">
        <a className="brand" href="#top"><span className="brand-mark">✳</span> DESTIN VILLANUEVA</a>
        <div className="nav-meta"><span>PROJECT INTELLIGENCE</span><span className="live-dot">● LIVE</span><span>{clock} CST</span></div>
      </nav>

      <section className="premiere" id="top">
        <div className="premiere-copy">
          <p className="eyebrow">A BODY OF WORK / IN ORBIT</p>
          <h1>Enter the<br /><em>project sphere.</em></h1>
          <p className="lede">Thirty-two physical panels assemble in three-dimensional space. Eleven carry active worlds. Select one and pull it toward you.</p>
          <div className="hero-actions">
            <a href="#sphere" className="primary-action">EXPLORE THE ORBIT <span>↘</span></a>
            <button className="motion-control" onClick={() => setPaused(!paused)} aria-pressed={paused}>{paused ? "RESUME ROTATION" : "PAUSE ROTATION"}</button>
          </div>
        </div>

        <div className="sphere-zone" id="sphere">
          <div className="sphere-hud"><span>WEBGL PROJECT SPHERE / 32 MESHES</span><span>{paused ? "ORBIT HELD" : "ORBIT LIVE"}</span></div>
          <ProjectSphere3D projects={projects} active={active} selected={selected} paused={paused} reduced={reduced} onFocus={setActive} onLaunch={openProject} />
          <div className="depth-scale" aria-hidden="true"><span>NEAR</span><i /><span>FAR</span></div>
          <div className="focus-readout" aria-live="polite"><span>{String(active + 1).padStart(2, "0")} / 11</span><strong>{project.name}</strong><small>{project.type}</small></div>
          <div className="sphere-project-nav" aria-label="Keyboard project controls">
            {projects.map((item, index) => <button key={item.slug} onFocus={() => setActive(index)} onMouseEnter={() => setActive(index)} onClick={() => openProject(index)} aria-label={`Pull ${item.name} from the sphere`} className={active === index ? "active" : ""}><span>{String(index + 1).padStart(2, "0")}</span>{item.name}</button>)}
          </div>
        </div>

        {selected !== null && (
          <div className="project-flight" role="dialog" aria-modal="true" aria-labelledby="project-title" style={{ "--project-color": projects[selected].color } as CSSProperties}>
            <button autoFocus className="flight-close" onClick={() => setSelected(null)} aria-label="Return project to globe">× <span>RETURN TO ORBIT</span></button>
            <div className="flight-streaks" aria-hidden="true"><i /><i /><i /></div>
            <figure className="project-art"><img src={`/art/${projects[selected].slug}.webp`} alt={`Concept artwork representing ${projects[selected].name}`} decoding="async" /><figcaption>{projects[selected].type} / {projects[selected].state}</figcaption></figure>
            <article className="project-discussion">
              <div className="project-count">PROJECT {String(selected + 1).padStart(2, "0")} — {projects.length}</div>
              <h2 id="project-title">{projects[selected].name}</h2>
              <p className="project-one-line">{projects[selected].oneLine}</p>
              <p className="project-body">{projects[selected].discussion}</p>
              <div className="focus-list">{projects[selected].focus.map((item, i) => <span key={item}><b>0{i + 1}</b>{item}</span>)}</div>
              <div className="project-status"><span>STATUS</span><strong>{projects[selected].state}</strong><i /></div>
            </article>
          </div>
        )}
      </section>

      <div className="marquee" aria-hidden="true"><div>SELECT A PANEL&nbsp;&nbsp;—&nbsp;&nbsp;PULL IT FROM ORBIT&nbsp;&nbsp;—&nbsp;&nbsp;EXPLORE THE SYSTEM&nbsp;&nbsp;—&nbsp;&nbsp;SELECT A PANEL&nbsp;&nbsp;—&nbsp;&nbsp;PULL IT FROM ORBIT&nbsp;&nbsp;—&nbsp;&nbsp;EXPLORE THE SYSTEM</div></div>

      <section className="project-deck" id="projects">
        <div className="section-head"><div><span>02 / PROJECT DECK</span><h2>Eleven signals.<br /><em>One body of work.</em></h2></div><p>The sphere is the premiere. The deck is the accessible archive. Every project remains directly selectable here.</p></div>
        <div className="deck-grid">
          {projects.map((item, index) => <button key={item.slug} className="deck-card" style={{ "--card-color": item.color } as CSSProperties} onClick={() => { openProject(index); document.getElementById("top")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" }); }}><img src={`/art/${item.slug}.webp`} alt="" loading="lazy" decoding="async" /><span className="deck-gradient" /><span className="deck-index">{String(index + 1).padStart(2, "0")}</span><div><small>{item.type}</small><strong>{item.name}</strong><p>{item.oneLine}</p></div><i>↗</i></button>)}
        </div>
      </section>

      <footer><div className="footer-brand">DESTIN<br /><em>VILLANUEVA</em></div><p>Systems for the curious.<br />Interfaces for what comes next.</p><div className="footer-meta"><span>PROJECT INTELLIGENCE PREMIERE</span><span>© {new Date().getFullYear()}</span></div></footer>
    </main>
  );
}
