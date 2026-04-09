import { useState, useEffect } from "react";
import Papa from "papaparse";

const BRIGADE_BLUE = "#1B75BC";
const BRIGADE_DARK = "#0D4F85";

const medals = [
  { emoji:"🥇", label:"1st Place", accent:"#C9920A", light:"#FBF3DC", border:"#E8C84A", text:"#8B6914", shimmerBase:"#c8920a", shimmerHigh:"white", glintColor:"rgba(255,245,160,1)" },
  { emoji:"🥈", label:"2nd Place", accent:"#7A909F", light:"#F0F3F7", border:"#B0BEC5", text:"#546E7A", shimmerBase:"#7a99aa", shimmerHigh:"white", glintColor:"rgba(225,240,255,1)" },
  { emoji:"🥉", label:"3rd Place", accent:"#A0622A", light:"#FAF0E6", border:"#D4956A", text:"#7D4A1E", shimmerBase:"#b86828", shimmerHigh:"white", glintColor:"rgba(255,210,150,1)" },
];

const metricKeys   = ["timelines","template","governance","accOnboard","accUtil"];
const metricLabels = ["Timelines","Templates","Governance","ACC Onboarding","ACC Utilization"];
const podiumBaseHeights = [48, 84, 28];

// Desktop: flexible rationale column with 1fr
const GRID_DESKTOP = `44px 130px 90px 90px 90px 90px 90px 90px minmax(180px, 1fr)`;
// Mobile: compact fixed columns + 160px rationale — table scrolls horizontally if needed
const GRID_MOBILE  = `28px 75px 54px 36px 36px 36px 36px 36px 160px`;

const headersDesktop = ["Rank","Project","Overall Score","Timelines","Template Utilization","Governance","ACC Onboarding","ACC Utilization","Rationale"];
const headersMobile  = ["#","Project","Score","Timelines","Templates","Governance","ACC Onboarding","ACC Use","Rationale"];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 720);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
}

function ScoreDots({ value, justify = "center" }) {
  const [hovered, setHovered] = useState(false);

  if (value === null || value === undefined || Number.isNaN(value)) {
    return <span style={{ color:"#CBD5E0", fontSize:11 }}>—</span>;
  }

  const color = value === 3 ? "#22C55E" : value === 2 ? "#F59E0B" : "#EF4444";
  const glow  = value === 3 ? "0 0 8px #22C55Eaa" : value === 2 ? "0 0 8px #F59E0Baa" : "0 0 8px #EF4444aa";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:"flex",
        gap: hovered ? 4 : 3,
        justifyContent: justify,
        transform: hovered ? "scale(1.3)" : "scale(1)",
        transition:"transform 0.25s ease, gap 0.25s ease",
        cursor:"default"
      }}
    >
      {[1,2,3].map(i => (
        <div
          key={i}
          style={{
            width:8,
            height:8,
            borderRadius:"50%",
            background: i <= value ? color : "#E2E8F0",
            boxShadow: hovered && i <= value ? glow : "none",
            transition:"box-shadow 0.25s ease"
          }}
        />
      ))}
    </div>
  );
}

function AnimatedNumber({ target }) {
  const safeTarget = Number.isFinite(target) ? target : 0;
  const [n, setN] = useState(0);

  useEffect(() => {
    let cur = 0;
    const step = safeTarget / 40;

    const t = setInterval(() => {
      cur += step;
      if (cur >= safeTarget) {
        setN(safeTarget);
        clearInterval(t);
      } else {
        setN(Math.floor(cur));
      }
    }, 18);

    return () => clearInterval(t);
  }, [safeTarget]);

  return <>{n}%</>;
}

function ScoreCell({ value, small = false }) {
  const [hovered, setHovered] = useState(false);
  const safeValue = Number.isFinite(value) ? value : 0;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:"flex",
        flexDirection:"column",
        alignItems:"center",
        transform: hovered ? "scale(1.12)" : "scale(1)",
        transition:"transform 0.25s ease",
        cursor:"default"
      }}
    >
      <span
        style={{
          fontSize: small ? 13 : 18,
          fontWeight:800,
          color: hovered ? BRIGADE_DARK : BRIGADE_BLUE,
          fontVariantNumeric:"tabular-nums",
          transition:"color 0.25s ease"
        }}
      >
        {safeValue}%
      </span>

      {!small && (
        <div
          style={{
            width:"2.4rem",
            height:3,
            background:"#EDF2F7",
            borderRadius:2,
            marginTop:3,
            overflow:"hidden",
            position:"relative"
          }}
        >
          <div
            style={{
              height:"100%",
              borderRadius:2,
              width:`${safeValue}%`,
              background:`linear-gradient(90deg,${BRIGADE_DARK},${BRIGADE_BLUE})`
            }}
          />
          {hovered && (
            <div
              style={{
                position:"absolute",
                inset:0,
                background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.75),transparent)",
                animation:"barShimmer 0.7s ease forwards"
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function MedalWithGlint({ emoji, accent, glintColor, emojiSize, animDelay }) {
  return (
    <div style={{ position:"relative", display:"inline-block", width: emojiSize * 2.2, height: emojiSize * 2.2 }}>
      <div
        style={{
          position:"absolute",
          top:"50%",
          left:"50%",
          transform:"translate(-50%,-50%)",
          width: emojiSize * 2,
          height: emojiSize * 2,
          borderRadius:"50%",
          background:`radial-gradient(circle, ${accent}45 0%, ${accent}12 45%, transparent 70%)`,
          animation:`medalShine 2.8s ease-in-out infinite`,
          animationDelay:`${animDelay}s`,
          zIndex:0,
          pointerEvents:"none"
        }}
      />

      {[
        { w: emojiSize * 0.18, h: emojiSize * 2.1, rotate:"0deg" },
        { w: emojiSize * 2.1,  h: emojiSize * 0.18, rotate:"0deg" },
        { w: emojiSize * 0.12, h: emojiSize * 1.5,  rotate:"45deg" },
        { w: emojiSize * 0.12, h: emojiSize * 1.5,  rotate:"-45deg" },
      ].map((b, i) => (
        <div
          key={i}
          style={{
            position:"absolute",
            top:"50%",
            left:"50%",
            transform:`translate(-50%,-50%) rotate(${b.rotate})`,
            width: b.w,
            height: b.h,
            borderRadius: emojiSize,
            background: b.h > b.w
              ? `linear-gradient(180deg, transparent 0%, ${glintColor} 35%, white 50%, ${glintColor} 65%, transparent 100%)`
              : `linear-gradient(90deg,  transparent 0%, ${glintColor} 35%, white 50%, ${glintColor} 65%, transparent 100%)`,
            animation:`starGlint 3.2s ease-in-out infinite`,
            animationDelay:`${animDelay + (i > 1 ? 0.04 : 0)}s`,
            zIndex:2,
            pointerEvents:"none",
            opacity:0
          }}
        />
      ))}

      <span
        style={{
          position:"absolute",
          top:"50%",
          left:"50%",
          transform:"translate(-50%,-50%)",
          fontSize: emojiSize,
          display:"block",
          zIndex:3,
          animation:`medalFloat 3s ease-in-out infinite`,
          animationDelay:`${animDelay}s`
        }}
      >
        {emoji}
      </span>
    </div>
  );
}

function BorderGlimmer({ medalIndex, height }) {
  const m = medals[medalIndex];
  const podiumPos = medalIndex === 0 ? 1 : medalIndex === 1 ? 0 : 2;

  return (
    <div
      style={{
        position:"absolute",
        top:0,
        left:0,
        right:0,
        height,
        borderRadius:"14px 14px 0 0",
        overflow:"hidden",
        background: m.shimmerBase
      }}
    >
      <div
        style={{
          position:"absolute",
          inset:0,
          background:`linear-gradient(90deg, transparent 0%, ${m.shimmerHigh} 45%, white 50%, ${m.shimmerHigh} 55%, transparent 100%)`,
          backgroundSize:"200% 100%",
          animation:`borderGlimmer 6s ease-in-out infinite`,
          animationDelay:`${podiumPos * 2.0}s`
        }}
      />
    </div>
  );
}

function PodiumCardDesktop({ p, podiumPos, delay }) {
  const m = medals[p.rank - 1];
  const isGold = p.rank === 1;
  const [vis, setVis]         = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVis(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const emojiSizes = [38, 48, 34];
  const nameSizes  = [26, 32, 23];
  const scoreSizes = [42, 56, 37];
  const cardPad    = ["22px 20px 20px","30px 24px 24px","20px 18px 18px"];

  return (
    <div style={{ display:"flex", flexDirection:"column", justifyContent:"flex-end", flex: isGold ? 1.15 : 1 }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background:"#FFFFFF",
          border:`1.5px solid ${m.border}`,
          borderRadius:14,
          padding: cardPad[podiumPos],
          position:"relative",
          overflow:"hidden",
          opacity: vis ? 1 : 0,
          transform: vis ? (hovered ? "translateY(-7px) scale(1.03)" : "translateY(0) scale(1)") : "translateY(24px) scale(0.97)",
          transition: vis ? "opacity 0.55s ease, transform 0.28s ease, box-shadow 0.28s ease" : "opacity 0.55s ease, transform 0.55s ease",
          boxShadow: hovered ? `0 20px 52px ${m.accent}50` : isGold ? `0 8px 32px ${m.accent}28` : `0 4px 16px ${m.accent}18`,
          cursor:"default"
        }}
      >
        <BorderGlimmer medalIndex={p.rank - 1} height={isGold ? 5 : 4} />

        {hovered && (
          <div
            style={{
              position:"absolute",
              inset:0,
              pointerEvents:"none",
              zIndex:3,
              background:"linear-gradient(115deg, transparent 0%, rgba(255,255,255,0.22) 40%, rgba(255,255,255,0.38) 50%, rgba(255,255,255,0.22) 60%, transparent 100%)",
              animation:"glassSweep 0.6s ease forwards"
            }}
          />
        )}

        <div style={{ position:"relative", zIndex:2 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: isGold ? 14 : 10 }}>
            <MedalWithGlint
              emoji={m.emoji}
              accent={m.accent}
              glintColor={m.glintColor}
              emojiSize={emojiSizes[podiumPos]}
              animDelay={podiumPos * 0.9}
            />
            <span
              style={{
                background:m.light,
                color:m.text,
                border:`1px solid ${m.border}`,
                borderRadius:20,
                padding:"3px 10px",
                fontSize:9,
                fontWeight:700,
                letterSpacing:2,
                textTransform:"uppercase"
              }}
            >
              {m.label}
            </span>
          </div>

          <div style={{ fontSize:nameSizes[podiumPos], fontWeight:800, color:"#0D1F35", marginBottom:6, letterSpacing:-0.3, lineHeight:1.1 }}>
            {p.name}
          </div>

          <div style={{ fontSize:scoreSizes[podiumPos], fontWeight:900, lineHeight:1, marginBottom: isGold ? 16 : 12, color:m.accent, fontVariantNumeric:"tabular-nums" }}>
            {vis ? <AnimatedNumber target={p.scaled} /> : "0%"}
          </div>

          <div style={{ height:1, background:"#EDF2F7", marginBottom: isGold ? 14 : 10 }} />

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 10px", marginBottom:12 }}>
            {metricKeys.map((key, i) => (
              <div key={key}>
                <div style={{ fontSize:8.5, color:"#A0AEC0", fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:4, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  {metricLabels[i]}
                </div>
                <ScoreDots value={p[key]} justify="flex-start" />
              </div>
            ))}
          </div>

          <div style={{ height:1, background:"#EDF2F7", marginBottom:10 }} />

          <div style={{ fontSize:10, color:"#718096", lineHeight:1.6, fontStyle:"italic" }}>
            <span style={{ fontWeight:700, color:"#A0AEC0", fontStyle:"normal", letterSpacing:1, textTransform:"uppercase", fontSize:8.5 }}>
              Rationale{" "}
            </span>
            {p.rationale}
          </div>
        </div>
      </div>

      <div
        style={{
          height: podiumBaseHeights[podiumPos],
          background:`linear-gradient(180deg, ${m.light} 0%, ${m.border}55 100%)`,
          border:`1px solid ${m.border}`,
          borderTop:"none",
          borderRadius:"0 0 6px 6px"
        }}
      />
    </div>
  );
}

function PodiumCardMobile({ p, delay }) {
  const m = medals[p.rank - 1];
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVis(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const mobileAnimDelay = (p.rank - 1) * 2.0;

  return (
    <div
      style={{
        background:"#FFFFFF",
        border:`1.5px solid ${m.border}`,
        borderRadius:14,
        padding:"16px 18px",
        position:"relative",
        overflow:"hidden",
        opacity: vis ? 1 : 0,
        transform: vis ? "translateY(0)" : "translateY(20px)",
        transition:"opacity 0.5s ease, transform 0.5s ease",
        boxShadow:`0 4px 20px ${m.accent}22`
      }}
    >
      <div
        style={{
          position:"absolute",
          top:0,
          left:0,
          right:0,
          height:3,
          borderRadius:"14px 14px 0 0",
          overflow:"hidden",
          background:m.shimmerBase
        }}
      >
        <div
          style={{
            position:"absolute",
            inset:0,
            background:`linear-gradient(90deg, transparent 0%, white 45%, white 55%, transparent 100%)`,
            backgroundSize:"200% 100%",
            animation:`borderGlimmer 6s ease-in-out infinite`,
            animationDelay:`${mobileAnimDelay}s`
          }}
        />
      </div>

      <div style={{ display:"flex", alignItems:"flex-start", gap:16 }}>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", minWidth:110 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, marginTop:4 }}>
            <MedalWithGlint
              emoji={m.emoji}
              accent={m.accent}
              glintColor={m.glintColor}
              emojiSize={32}
              animDelay={(p.rank-1) * 0.9}
            />
            <span
              style={{
                background:m.light,
                color:m.text,
                border:`1px solid ${m.border}`,
                borderRadius:20,
                padding:"2px 9px",
                fontSize:9,
                fontWeight:700,
                letterSpacing:2,
                textTransform:"uppercase"
              }}
            >
              {m.label}
            </span>
          </div>

          <div style={{ fontSize:20, fontWeight:800, color:"#0D1F35", letterSpacing:-0.3, lineHeight:1.1, marginBottom:4 }}>
            {p.name}
          </div>

          <div style={{ fontSize:38, fontWeight:900, lineHeight:1, color:m.accent, fontVariantNumeric:"tabular-nums" }}>
            {vis ? <AnimatedNumber target={p.scaled} /> : "0%"}
          </div>
        </div>

        <div style={{ width:1, background:"#EDF2F7", alignSelf:"stretch", flexShrink:0 }} />

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 12px", marginBottom:10 }}>
            {metricKeys.map((key, i) => (
              <div key={key}>
                <div style={{ fontSize:8, color:"#A0AEC0", fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:4, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  {metricLabels[i]}
                </div>
                <ScoreDots value={p[key]} justify="flex-start" />
              </div>
            ))}
          </div>

          <div style={{ height:1, background:"#EDF2F7", marginBottom:8 }} />

          <div style={{ fontSize:10, color:"#718096", lineHeight:1.6, fontStyle:"italic" }}>
            <span style={{ fontWeight:700, color:"#A0AEC0", fontStyle:"normal", letterSpacing:1, textTransform:"uppercase", fontSize:8 }}>
              Rationale{" "}
            </span>
            {p.rationale}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState([]);
  const [rowVis, setRowVis] = useState([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    Papa.parse("./data.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data
          .map((row) => ({
            rank: row.rank === "" ? null : Number(row.rank),
            name: row.name || "",
            scaled: row.scaled === "" ? null : Number(row.scaled),
            timelines: row.timelines === "" ? null : Number(row.timelines),
            template: row.template === "" ? null : Number(row.template),
            governance: row.governance === "" ? null : Number(row.governance),
            accOnboard: row.accOnboard === "" ? null : Number(row.accOnboard),
            accUtil: row.accUtil === "" ? null : Number(row.accUtil),
            rationale: row.rationale || "",
          }))
          .filter((row) => row.rank !== null && row.name);

        setData(parsed);
      },
      error: (error) => {
        console.error("Failed to load data.csv:", error);
      },
    });
  }, []);

  const top3 = data.slice(0, 3);
  const rest = data.slice(3);

  useEffect(() => {
    setRowVis([]);

    rest.forEach((_, i) => {
      setTimeout(() => {
        setRowVis((v) => [...v, i]);
      }, 1000 + i * 120);
    });
  }, [data]);

  const desktopOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : [];
  const mobileOrder  = top3.length >= 3 ? [top3[0], top3[1], top3[2]] : [];

  const grid    = isMobile ? GRID_MOBILE    : GRID_DESKTOP;
  const headers = isMobile ? headersMobile  : headersDesktop;

  if (data.length === 0) {
    return (
      <div
        style={{
          minHeight:"100vh",
          display:"flex",
          alignItems:"center",
          justifyContent:"center",
          fontFamily:"'DM Sans','Segoe UI',sans-serif",
          color:"#1B75BC",
          background:"#F4F7FB"
        }}
      >
        Loading leaderboard...
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", fontFamily:"'DM Sans','Segoe UI',sans-serif", color:"#1A202C", position:"relative", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing:border-box; }
        .bg-layer { position:absolute; inset:0; z-index:0; pointer-events:none; background:#F4F7FB; overflow:hidden; }
        .bg-blob  { position:absolute; border-radius:50%; filter:blur(80px); }
        .blob1 { width:650px; height:650px; background:radial-gradient(circle, #a8ccee 0%, #c5ddf5 40%, transparent 70%); opacity:0.6; top:-150px; left:-150px; animation:blobDrift1 20s ease-in-out infinite; }
        .blob2 { width:500px; height:500px; background:radial-gradient(circle, #aecde8 0%, #c8e0f4 40%, transparent 70%); opacity:0.55; bottom:-120px; right:-120px; animation:blobDrift2 25s ease-in-out infinite; }
        .blob3 { width:380px; height:380px; background:radial-gradient(circle, #bdd7f0 0%, #d4e8f7 40%, transparent 70%); opacity:0.5; top:35%; left:50%; animation:blobDrift3 18s ease-in-out infinite; }
        .blob4 { width:260px; height:260px; background:radial-gradient(circle, #96bcdf 0%, #bdd5ee 40%, transparent 70%); opacity:0.4; top:-60px; right:15%; animation:blobDrift4 15s ease-in-out infinite; }
        @keyframes blobDrift1 { 0%,100%{transform:translate(0,0) scale(1)} 25%{transform:translate(90px,70px) scale(1.1)} 50%{transform:translate(50px,130px) scale(0.93)} 75%{transform:translate(110px,40px) scale(1.05)} }
        @keyframes blobDrift2 { 0%,100%{transform:translate(0,0) scale(1)} 30%{transform:translate(-80px,-90px) scale(1.12)} 60%{transform:translate(-130px,-40px) scale(0.9)} 80%{transform:translate(-50px,-110px) scale(1.06)} }
        @keyframes blobDrift3 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-70px,80px) scale(1.14)} 70%{transform:translate(60px,50px) scale(0.88)} }
        @keyframes blobDrift4 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-50px,80px) scale(1.18)} }
        @keyframes borderGlimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes glassSweep { 0%{transform:translateX(-120%) skewX(-14deg);opacity:0} 35%{opacity:1} 100%{transform:translateX(220%) skewX(-14deg);opacity:0} }
        @keyframes barShimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(220%)} }
        @keyframes medalFloat { 0%,100%{transform:translate(-50%,-50%) translateY(0px)} 50%{transform:translate(-50%,-50%) translateY(-4px)} }
        @keyframes medalShine { 0%,100%{transform:translate(-50%,-50%) scale(0.85);opacity:0.4} 50%{transform:translate(-50%,-50%) scale(1.2);opacity:1} }
        @keyframes starGlint {
          0%  {opacity:0;   transform:translate(-50%,-50%) scale(0.5)}
          18% {opacity:0;   transform:translate(-50%,-50%) scale(0.5)}
          28% {opacity:1;   transform:translate(-50%,-50%) scale(1)}
          44% {opacity:0.9; transform:translate(-50%,-50%) scale(1)}
          56% {opacity:0;   transform:translate(-50%,-50%) scale(1.1)}
          100%{opacity:0;   transform:translate(-50%,-50%) scale(1.1)}
        }
        .table-scroll { overflow-x:auto; }
        .table-scroll::-webkit-scrollbar { height:5px; }
        .table-scroll::-webkit-scrollbar-track { background:transparent; }
        .table-scroll::-webkit-scrollbar-thumb { background:#B0BEC5; border-radius:3px; }
        .table-scroll::-webkit-scrollbar-thumb:hover { background:#90A4AE; }
        .table-scroll { scrollbar-width:thin; scrollbar-color:#B0BEC5 transparent; }
        .table-row { transition:background 0.2s ease; }
        .table-row:hover { background:#EBF4FF !important; }
      `}</style>

      <div className="bg-layer">
        <div className="bg-blob blob1" />
        <div className="bg-blob blob2" />
        <div className="bg-blob blob3" />
        <div className="bg-blob blob4" />
      </div>

      <div style={{ position:"relative", zIndex:1 }}>
        <div style={{ padding: isMobile ? "24px 16px 0" : "36px 28px 0" }}>
          <div style={{ maxWidth:980, margin:"0 auto 40px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap: isMobile ? 12 : 18 }}>
              <img
                src="https://upload.wikimedia.org/wikipedia/en/8/8e/Brigade_Group.svg"
                alt="Brigade Group"
                style={{ height: isMobile ? 44 : 60, width:"auto" }}
              />
              <div style={{ borderLeft:`3px solid ${BRIGADE_BLUE}`, paddingLeft: isMobile ? 12 : 18 }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:3, color:BRIGADE_BLUE, textTransform:"uppercase", marginBottom:3 }}>
                  Q1CY26 · Project Performance
                </div>
                <div style={{ fontSize: isMobile ? 22 : 32, fontWeight:800, color:"#0D1F35", letterSpacing:-0.5, lineHeight:1 }}>
                  PropeLL Leaderboard
                </div>
              </div>
            </div>

            <div style={{ background:"#EBF4FF", color:BRIGADE_BLUE, border:`1px solid #BEE3F8`, borderRadius:8, padding:"8px 18px", fontSize:11, fontWeight:700 }}>
              As of 1-Apr-26
            </div>
          </div>

          {isMobile ? (
            <div style={{ maxWidth:980, margin:"0 auto 32px", display:"flex", flexDirection:"column", gap:12 }}>
              {mobileOrder.map((p, i) => <PodiumCardMobile key={p.name} p={p} delay={i * 150} />)}
            </div>
          ) : (
            <div style={{ maxWidth:980, margin:"0 auto 40px", display:"flex", gap:14, alignItems:"flex-end" }}>
              {desktopOrder.map((p, i) => <PodiumCardDesktop key={p.name} p={p} podiumPos={i} delay={i * 160} />)}
            </div>
          )}

          <div style={{ maxWidth:980, margin:"0 auto" }}>
            <div className="table-scroll" style={{ borderRadius:14, border:"1px solid #E2E8F0", boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }}>
              <div style={{ background:"#FFFFFF", borderRadius:14, minWidth: isMobile ? "max-content" : "100%" }}>
                <div
                  style={{
                    display:"grid",
                    gridTemplateColumns: grid,
                    padding: isMobile ? "9px 12px" : "12px 20px",
                    gap: isMobile ? 5 : 8,
                    background:"#F0F4FA",
                    borderBottom:"1px solid #E2E8F0",
                    fontSize: isMobile ? 8 : 9,
                    letterSpacing:1.5,
                    color:"#718096",
                    fontWeight:700,
                    textTransform:"uppercase",
                    alignItems:"end"
                  }}
                >
                  {headers.map((h, i) => {
                    const isScore = i >= 2 && i <= 7;
                    return (
                      <div
                        key={h}
                        style={{
                          textAlign: isScore ? "center" : "left",
                          lineHeight:1.4,
                          wordBreak:"break-word",
                          whiteSpace:"normal"
                        }}
                      >
                        {h}
                      </div>
                    );
                  })}
                </div>

                {rest.map((p, i) => (
                  <div
                    key={p.name}
                    className="table-row"
                    style={{
                      display:"grid",
                      gridTemplateColumns: grid,
                      padding: isMobile ? "9px 12px" : "13px 20px",
                      gap: isMobile ? 5 : 8,
                      borderBottom: i < rest.length - 1 ? "1px solid #EDF2F7" : "none",
                      alignItems:"center",
                      background: i % 2 === 0 ? "#FFFFFF" : "#FAFBFD",
                      opacity: rowVis.includes(i) ? 1 : 0,
                      transform: rowVis.includes(i) ? "translateX(0)" : "translateX(-12px)",
                      transition:"opacity 0.4s ease, transform 0.4s ease",
                    }}
                  >
                    <span style={{ fontSize: isMobile ? 11 : 15, fontWeight:800, color:"#CBD5E0", textAlign:"center" }}>
                      {p.rank}
                    </span>

                    <span style={{ fontWeight:700, fontSize: isMobile ? 11 : 14, color:"#2D3748", wordBreak:"break-word" }}>
                      {p.name}
                    </span>

                    <ScoreCell value={p.scaled} small={isMobile} />

                    {[p.timelines, p.template, p.governance, p.accOnboard, p.accUtil].map((val, j) => (
                      <div key={j} style={{ display:"flex", justifyContent:"center" }}>
                        <ScoreDots value={val} justify="center" />
                      </div>
                    ))}

                    <span
                      style={{
                        fontSize: isMobile ? 10 : 12,
                        color:"#718096",
                        lineHeight:1.5,
                        display:"block",
                        wordBreak:"break-word",
                        overflowWrap:"break-word",
                        ...(isMobile ? {
                          display:"-webkit-box",
                          WebkitLineClamp:3,
                          WebkitBoxOrient:"vertical",
                          overflow:"hidden",
                        } : {})
                      }}
                    >
                      {p.rationale}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ maxWidth:980, margin:"24px auto 0", padding:"18px 22px", background:"#FFFFFF", borderRadius:10, border:"1px solid #E2E8F0", fontSize:12, color:"#718096", lineHeight:1.8 }}>
            <p style={{ margin:0 }}>
              This dashboard is intended to provide visibility into current standings. The final scores will be consolidated and frozen at the end of each quarter.
            </p>
            <br />
            <p style={{ margin:0 }}>
              For detailed scoring criteria, please refer to{" "}
              <a
                href="https://tiny.cc/propellkm"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color:BRIGADE_BLUE, fontWeight:600, textDecoration:"underline", textUnderlineOffset:2 }}
              >
                this document
              </a>.
            </p>
            <br />
            <p style={{ margin:0 }}>
              In case of any questions, please reach out to your department&apos;s PropeLL champion.
            </p>
          </div>

          <div style={{ height:32 }} />
        </div>

        <div style={{ width:"100%", padding:"16px 28px", borderTop:"1px solid #E2E8F0", textAlign:"center", background:"#F4F7FB" }}>
          <div style={{ fontSize:12, color:"#A0AEC0", fontWeight:500 }}>
            Made with ♥ by the PropeLL team
          </div>
        </div>
      </div>
    </div>
  );
}
