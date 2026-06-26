import { useState, useEffect, useRef } from "react";

const FIREBASE_URL = "https://trivia-b01b3-default-rtdb.europe-west1.firebasedatabase.app";

async function fbGet(path) {
  const res = await fetch(`${FIREBASE_URL}/${path}.json`);
  const text = await res.text();
  const data = JSON.parse(text);
  if (data && data.error) throw new Error(data.error);
  return data;
}

async function fbSet(path, data) {
  const res = await fetch(`${FIREBASE_URL}/${path}.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const text = await res.text();
  const result = JSON.parse(text);
  if (result && result.error) throw new Error(result.error);
  return result;
}

async function fbUpdate(path, data) {
  const res = await fetch(`${FIREBASE_URL}/${path}.json`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const text = await res.text();
  const result = JSON.parse(text);
  if (result && result.error) throw new Error(result.error);
  return result;
}

function fbListen(path, cb) {
  let active = true;
  let timer = null;
  async function poll() {
    if (!active) return;
    try {
      const res = await fetch(`${FIREBASE_URL}/${path}.json`);
      const text = await res.text();
      const data = JSON.parse(text);
      if (data && !data.error) cb(data);
    } catch (e) {}
    if (active) timer = setTimeout(poll, 1500);
  }
  poll();
  return () => { active = false; clearTimeout(timer); };
}

const TOPICS = [
  { id: "geo",   emoji: "🌍", labels: { es: "Geografía",   en: "Geography",  fr: "Géographie"   }, color: "#22c55e" },
  { id: "chem",  emoji: "⚗️",  labels: { es: "Química",     en: "Chemistry",  fr: "Chimie"        }, color: "#a855f7" },
  { id: "sci",   emoji: "🔬", labels: { es: "Ciencias",    en: "Science",    fr: "Sciences"      }, color: "#3b82f6" },
  { id: "math",  emoji: "🧮", labels: { es: "Matemáticas", en: "Math",       fr: "Mathématiques" }, color: "#f59e0b" },
  { id: "logic", emoji: "🧠", labels: { es: "Lógica",      en: "Logic",      fr: "Logique"       }, color: "#ec4899" },
  { id: "hist",  emoji: "📜", labels: { es: "Historia",    en: "History",    fr: "Histoire"      }, color: "#ef4444" },
  { id: "art",   emoji: "🎨", labels: { es: "Arte",        en: "Art & Lit",  fr: "Art"           }, color: "#06b6d4" },
  { id: "gen",   emoji: "🎯", labels: { es: "General",     en: "General",    fr: "Général"       }, color: "#f97316" },
];

const LANG_NAMES = { es: "Español", en: "English", fr: "Français" };
const LANG_FLAGS = { es: "🇪🇸", en: "🇬🇧", fr: "🇫🇷" };
const SECONDS = 25;
const MAX_ROUNDS = 8;

const T = {
  es: {
    title: "TriviaAI", sub: "Multijugador · IA · 8 temas",
    yourName: "Tu nombre", placeholder: "Ej: Carlos",
    create: "Crear sala", join: "Unirse", joinPlaceholder: "Código de sala",
    orJoin: "— o únete a una sala —",
    lobbyTitle: "Sala de espera", codeLabel: "Código de sala",
    tapCopy: "Toca para copiar", copied: "¡Copiado!",
    players: "Jugadores", startBtn: "▶ Iniciar partida",
    waitPlayers: "Esperando más jugadores...", waitHost: "⏳ Esperando al anfitrión...",
    scoreTitle: "Puntuación", roundLabel: "Ronda",
    myTurn: "⚡ ¡Es tu turno!", theirTurn: "Turno de",
    generating: "Generando pregunta con IA...", waitingQ: "Esperando pregunta de",
    watching: "👀 Observando la respuesta...",
    explainLabel: "💡 Explicación:", gameOver: "🎉 ¡Partida terminada!",
    newGame: "🔄 Nueva partida", youLabel: "Tú",
    errName: "Escribe tu nombre primero",
    errCode: "Escribe el código de sala",
    errNotFound: "❌ Sala no encontrada. Verifica el código.",
    errStarted: "❌ La partida ya comenzó.",
    qLangLabel: "Idioma de las preguntas", timeUp: "⏰ ¡Tiempo agotado!",
    connecting: "Conectando...",
  },
  en: {
    title: "TriviaAI", sub: "Multiplayer · AI · 8 topics",
    yourName: "Your name", placeholder: "e.g. John",
    create: "Create room", join: "Join", joinPlaceholder: "Room code",
    orJoin: "— or join a room —",
    lobbyTitle: "Waiting room", codeLabel: "Room code",
    tapCopy: "Tap to copy", copied: "Copied!",
    players: "Players", startBtn: "▶ Start game",
    waitPlayers: "Waiting for more players...", waitHost: "⏳ Waiting for host...",
    scoreTitle: "Score", roundLabel: "Round",
    myTurn: "⚡ Your turn!", theirTurn: "Turn of",
    generating: "Generating question with AI...", waitingQ: "Waiting for question from",
    watching: "👀 Watching the answer...",
    explainLabel: "💡 Explanation:", gameOver: "🎉 Game over!",
    newGame: "🔄 New game", youLabel: "You",
    errName: "Enter your name first",
    errCode: "Enter the room code",
    errNotFound: "❌ Room not found. Check the code.",
    errStarted: "❌ Game already started.",
    qLangLabel: "Question language", timeUp: "⏰ Time's up!",
    connecting: "Connecting...",
  },
  fr: {
    title: "TriviaAI", sub: "Multijoueur · IA · 8 thèmes",
    yourName: "Ton prénom", placeholder: "Ex: Marie",
    create: "Créer une salle", join: "Rejoindre", joinPlaceholder: "Code de salle",
    orJoin: "— ou rejoins une salle —",
    lobbyTitle: "Salle d'attente", codeLabel: "Code de salle",
    tapCopy: "Appuie pour copier", copied: "Copié!",
    players: "Joueurs", startBtn: "▶ Démarrer",
    waitPlayers: "En attente de joueurs...", waitHost: "⏳ En attente de l'hôte...",
    scoreTitle: "Score", roundLabel: "Manche",
    myTurn: "⚡ C'est ton tour!", theirTurn: "Tour de",
    generating: "Génération de la question...", waitingQ: "En attente de",
    watching: "👀 Observation de la réponse...",
    explainLabel: "💡 Explication:", gameOver: "🎉 Partie terminée!",
    newGame: "🔄 Nouvelle partie", youLabel: "Toi",
    errName: "Entre ton prénom",
    errCode: "Entre le code de salle",
    errNotFound: "❌ Salle introuvable.",
    errStarted: "❌ La partie a déjà commencé.",
    qLangLabel: "Langue des questions", timeUp: "⏰ Temps écoulé!",
    connecting: "Connexion...",
  },
};

function makeCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}
function pickTopic() {
  return TOPICS[Math.floor(Math.random() * TOPICS.length)].id;
}

const BANK_REFILL_AT = 5;

async function generateQuestionFromAI(topicId, lang) {
  const topic = TOPICS.find((t) => t.id === topicId);
  const topicName = topic ? topic.labels[lang] : topicId;
  const instructions = {
    es: `Genera UNA sola pregunta de trivia en ESPAÑOL sobre el tema: "${topicName}". Devuelve ÚNICAMENTE este JSON sin ningún texto adicional ni markdown:\n{"question":"...","options":["opción A","opción B","opción C","opción D"],"correct":0,"explanation":"..."}`,
    en: `Generate ONE trivia question in ENGLISH about: "${topicName}". Return ONLY this JSON with no extra text or markdown:\n{"question":"...","options":["option A","option B","option C","option D"],"correct":0,"explanation":"..."}`,
    fr: `Génère UNE question de trivia en FRANÇAIS sur: "${topicName}". Retourne UNIQUEMENT ce JSON sans texte supplémentaire ni markdown:\n{"question":"...","options":["option A","option B","option C","option D"],"correct":0,"explanation":"..."}`,
  };
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      messages: [{ role: "user", content: instructions[lang] || instructions.es }],
    }),
  });
  const data = await res.json();
  const raw = (data.content || []).map((b) => b.text || "").join("");
  const clean = raw.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);
  if (!parsed.question || !Array.isArray(parsed.options) || parsed.options.length !== 4) {
    throw new Error("Invalid question format");
  }
  return parsed;
}

async function refillBank(topicId, lang, count) {
  const bankPath = `questionBank/${lang}/${topicId}`;
  for (let i = 0; i < count; i++) {
    try {
      const q = await generateQuestionFromAI(topicId, lang);
      const key = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
      await fbUpdate(bankPath, { [key]: q });
      await new Promise(r => setTimeout(r, 400));
    } catch (e) { break; }
  }
}

async function generateQuestion(topicId, lang) {
  const bankPath = `questionBank/${lang}/${topicId}`;
  try {
    const bank = await fbGet(bankPath);
    const questions = bank ? Object.entries(bank) : [];
    if (questions.length > 0) {
      const [key, q] = questions[Math.floor(Math.random() * questions.length)];
      fetch(`${FIREBASE_URL}/${bankPath}/${key}.json`, { method: "DELETE" });
      if (questions.length <= BANK_REFILL_AT) refillBank(topicId, lang, 10);
      return q;
    }
  } catch (e) {}
  // No bank or error - generate directly and refill in background
  const q = await generateQuestionFromAI(topicId, lang);
  refillBank(topicId, lang, 15);
  return q;
}


// ─── Inject spinner CSS ───────────────────────────────────────────────────
if (typeof document !== "undefined") {
  const existing = document.getElementById("trivia-styles");
  if (!existing) {
    const style = document.createElement("style");
    style.id = "trivia-styles";
    style.textContent = `
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      * { box-sizing: border-box; }
      body { margin: 0; background: #0a0a1a; font-family: 'Segoe UI', system-ui, sans-serif; }
      button { font-family: inherit; }
      input { font-family: inherit; }
    `;
    document.head.appendChild(style);
  }
}

// ─── Root App ─────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("home");
  const [uiLang, setUiLang] = useState("es");
  const [qLang, setQLang] = useState("es");
  const [playerName, setPlayerName] = useState("");
  const [joinInput, setJoinInput] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [playerId] = useState(makeId);
  const [room, setRoom] = useState(null);
  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(SECONDS);
  const [loadingQ, setLoadingQ] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const timerRef = useRef(null);
  const generatingRef = useRef(false);
  const prevQuestionRef = useRef(null);
  const t = T[uiLang];

  // Live Firebase listener
  useEffect(() => {
    if (!roomCode) return;
    const stop = fbListen(`rooms/${roomCode}`, (data) => {
      setRoom(data);
    });
    return stop;
  }, [roomCode]);

  // React to room state changes
  useEffect(() => {
    if (!room) return;

    // Sync question
    const newQ = room.currentQuestion || null;
    const newQStr = JSON.stringify(newQ);
    if (newQStr !== prevQuestionRef.current) {
      prevQuestionRef.current = newQStr;
      setQuestion(newQ);
      setSelected(null);
      setAnswered(false);
      setTimeLeft(SECONDS);
      generatingRef.current = false;
    }

    // Screen transitions
    if (room.status === "playing" && screen === "lobby") setScreen("game");
    if (room.status === "finished" && screen === "game") setScreen("results");
  }, [room]);

  const isMyTurn = room?.currentTurnId === playerId;
  const isHost = room?.hostId === playerId;
  const playerList = room ? Object.values(room.players || {}) : [];
  const sortedPlayers = [...playerList].sort((a, b) => b.score - a.score);
  const currentPlayer = room?.players?.[room?.currentTurnId];

  // Generate question when it's my turn
  useEffect(() => {
    if (
      screen !== "game" ||
      !isMyTurn ||
      room?.currentQuestion ||
      generatingRef.current ||
      loadingQ
    ) return;

    generatingRef.current = true;
    setLoadingQ(true);

    generateQuestion(room.questionTopic, room.questionLang || "es")
      .then((q) => fbUpdate(`rooms/${roomCode}`, { currentQuestion: q }))
      .catch((e) => {
        setError("Error generando pregunta: " + e.message);
        generatingRef.current = false;
      })
      .finally(() => setLoadingQ(false));
  }, [isMyTurn, room?.currentQuestion, screen]);

  // Timer countdown
  useEffect(() => {
    if (screen !== "game" || !question || answered || !isMyTurn) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAnswer(-1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [question, answered, screen, isMyTurn]);

  async function handleCreateRoom() {
    if (!playerName.trim()) { setError(t.errName); return; }
    setError("");
    setCreating(true);
    const code = makeCode();
    try {
      await fbSet(`rooms/${code}`, {
        hostId: playerId,
        status: "lobby",
        questionLang: qLang,
        players: {
          [playerId]: { id: playerId, name: playerName.trim(), score: 0 },
        },
        turnOrder: [playerId],
        turnIndex: 0,
        currentTurnId: null,
        currentQuestion: null,
        questionTopic: null,
        round: 1,
      });
      setRoomCode(code);
      setScreen("lobby");
    } catch (e) {
      setError("Error al crear sala: " + e.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleJoinRoom() {
    if (!playerName.trim()) { setError(t.errName); return; }
    if (!joinInput.trim()) { setError(t.errCode); return; }
    setError("");
    setJoining(true);
    const code = joinInput.trim().toUpperCase();
    try {
      const existing = await fbGet(`rooms/${code}`);
      if (!existing) { setError(t.errNotFound); setJoining(false); return; }
      if (existing.status !== "lobby") { setError(t.errStarted); setJoining(false); return; }
      const updatedRoom = {
        ...existing,
        players: {
          ...existing.players,
          [playerId]: { id: playerId, name: playerName.trim(), score: 0 },
        },
        turnOrder: [...(existing.turnOrder || []), playerId],
      };
      await fbSet(`rooms/${code}`, updatedRoom);
      setRoomCode(code);
      setScreen("lobby");
    } catch (e) {
      setError("Error al unirse: " + e.message);
    } finally {
      setJoining(false);
    }
  }

  async function handleStartGame() {
    try {
      const fresh = await fbGet(`rooms/${roomCode}`);
      await fbSet(`rooms/${roomCode}`, {
        ...fresh,
        status: "playing",
        currentTurnId: fresh.turnOrder[0],
        turnIndex: 0,
        questionTopic: pickTopic(),
        questionLang: qLang,
        currentQuestion: null,
        round: 1,
      });
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleAnswer(idx) {
    if (answered || !isMyTurn) return;
    clearInterval(timerRef.current);
    setSelected(idx);
    setAnswered(true);

    try {
      const fresh = await fbGet(`rooms/${roomCode}`);
      const updatedPlayers = JSON.parse(JSON.stringify(fresh.players));
      if (idx === question?.correct) {
        updatedPlayers[playerId].score = (updatedPlayers[playerId].score || 0) + 10;
      }
      const nextIndex = (fresh.turnIndex + 1) % fresh.turnOrder.length;
      const nextId = fresh.turnOrder[nextIndex];
      const newRound = nextIndex === 0 ? fresh.round + 1 : fresh.round;
      const isOver = newRound > MAX_ROUNDS && nextIndex === 0;

      setTimeout(async () => {
        await fbSet(`rooms/${roomCode}`, {
          ...fresh,
          players: updatedPlayers,
          currentTurnId: isOver ? null : nextId,
          turnIndex: nextIndex,
          currentQuestion: null,
          questionTopic: pickTopic(),
          round: newRound,
          status: isOver ? "finished" : "playing",
        });
      }, 2800);
    } catch (e) {
      setError(e.message);
    }
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(roomCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (screen === "home") return (
    <HomeScreen
      t={t} uiLang={uiLang} setUiLang={setUiLang}
      qLang={qLang} setQLang={setQLang}
      playerName={playerName} setPlayerName={setPlayerName}
      joinInput={joinInput} setJoinInput={setJoinInput}
      error={error} setError={setError}
      onCreateRoom={handleCreateRoom}
      onJoinRoom={handleJoinRoom}
      creating={creating} joining={joining}
    />
  );

  if (screen === "lobby") return (
    <LobbyScreen
      t={t} roomCode={roomCode} players={playerList}
      isHost={isHost} playerId={playerId}
      onStart={handleStartGame} copied={copied}
      onCopy={handleCopyCode} qLang={qLang} setQLang={setQLang}
    />
  );

  if (screen === "game") return (
    <GameScreen
      t={t} room={room} question={question}
      isMyTurn={isMyTurn} loadingQ={loadingQ}
      selected={selected} answered={answered}
      timeLeft={timeLeft} onAnswer={handleAnswer}
      sortedPlayers={sortedPlayers} playerId={playerId}
      currentPlayer={currentPlayer}
    />
  );

  if (screen === "results") return (
    <ResultsScreen
      t={t} sortedPlayers={sortedPlayers} playerId={playerId}
      onRestart={() => { setScreen("home"); setRoomCode(""); setRoom(null); }}
    />
  );

  return null;
}

// ─── Language Picker ──────────────────────────────────────────────────────
function LangPicker({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {["es", "en", "fr"].map((l) => (
        <button
          key={l}
          onClick={() => onChange(l)}
          style={{
            padding: "6px 14px", borderRadius: 20, border: "1px solid",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            borderColor: value === l ? "#7c3aed" : "#334155",
            background: value === l ? "#7c3aed33" : "transparent",
            color: value === l ? "#a78bfa" : "#64748b",
            transition: "all .2s",
          }}
        >
          {LANG_FLAGS[l]} {LANG_NAMES[l]}
        </button>
      ))}
    </div>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────
function HomeScreen({ t, uiLang, setUiLang, qLang, setQLang, playerName, setPlayerName, joinInput, setJoinInput, error, setError, onCreateRoom, onJoinRoom, creating, joining }) {
  return (
    <div style={css.page}>
      <div style={css.card}>
        {/* UI Language */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <LangPicker value={uiLang} onChange={setUiLang} />
        </div>

        {/* Hero */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 56 }}>🧠</div>
          <h1 style={{ color: "#f1f5f9", fontSize: 34, fontWeight: 900, margin: "6px 0 4px", letterSpacing: -1 }}>
            {t.title}
          </h1>
          <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>{t.sub}</p>
        </div>

        {/* Topics */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, justifyContent: "center" }}>
          {TOPICS.map((tp) => (
            <span key={tp.id} style={{
              borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600,
              color: tp.color, background: tp.color + "18", border: `1px solid ${tp.color}33`,
            }}>
              {tp.emoji} {tp.labels[uiLang]}
            </span>
          ))}
        </div>

        {/* Name input */}
        <div>
          <label style={css.label}>{t.yourName}</label>
          <input
            style={css.input}
            placeholder={t.placeholder}
            value={playerName}
            onChange={(e) => { setPlayerName(e.target.value); setError(""); }}
            maxLength={20}
          />
        </div>

        {/* Question language */}
        <div>
          <label style={css.label}>{t.qLangLabel}</label>
          <div style={{ marginTop: 6 }}>
            <LangPicker value={qLang} onChange={setQLang} />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "#7f1d1d33", border: "1px solid #ef444444", borderRadius: 10, padding: "10px 14px", color: "#fca5a5", fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Create */}
        <button
          style={{ ...css.btnPrimary, opacity: creating ? 0.7 : 1 }}
          onClick={onCreateRoom}
          disabled={creating}
        >
          {creating ? "Creando..." : `➕ ${t.create}`}
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: "#1e293b" }} />
          <span style={{ color: "#475569", fontSize: 12, whiteSpace: "nowrap" }}>{t.orJoin}</span>
          <div style={{ flex: 1, height: 1, background: "#1e293b" }} />
        </div>

        {/* Join */}
        <div style={{ display: "flex", gap: 8 }}>
          <input
            style={{ ...css.input, flex: 1, marginBottom: 0, textTransform: "uppercase", letterSpacing: 2, fontWeight: 700 }}
            placeholder={t.joinPlaceholder}
            value={joinInput}
            onChange={(e) => { setJoinInput(e.target.value.toUpperCase()); setError(""); }}
            maxLength={6}
          />
          <button
            style={{ ...css.btnSecondary, opacity: joining ? 0.7 : 1 }}
            onClick={onJoinRoom}
            disabled={joining}
          >
            {joining ? "..." : t.join}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Lobby Screen ─────────────────────────────────────────────────────────
function LobbyScreen({ t, roomCode, players, isHost, playerId, onStart, copied, onCopy, qLang, setQLang }) {
  return (
    <div style={css.page}>
      <div style={css.card}>
        <h2 style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 800, textAlign: "center", margin: 0 }}>
          {t.lobbyTitle}
        </h2>

        {/* Code box */}
        <div
          onClick={onCopy}
          style={{
            background: "#7c3aed11", border: "2px dashed #7c3aed55",
            borderRadius: 16, padding: "18px 16px", textAlign: "center", cursor: "pointer",
          }}
        >
          <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
            {t.codeLabel}
          </div>
          <div style={{ color: "#a78bfa", fontSize: 40, fontWeight: 900, letterSpacing: 10, margin: "6px 0" }}>
            {roomCode}
          </div>
          <div style={{ color: "#475569", fontSize: 12 }}>
            {copied ? `✅ ${t.copied}` : t.tapCopy}
          </div>
        </div>

        {/* Player list */}
        <div>
          <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
            {t.players} ({players.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {players.map((p) => (
              <div key={p.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", background: "#1e293b", borderRadius: 10,
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 800, fontSize: 14, flexShrink: 0,
                }}>
                  {p.name[0]?.toUpperCase()}
                </div>
                <span style={{ flex: 1, color: "#f1f5f9", fontWeight: 600 }}>{p.name}</span>
                {p.id === playerId && (
                  <span style={{
                    background: "#7c3aed33", color: "#a78bfa",
                    borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700,
                  }}>
                    {t.youLabel}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Host controls */}
        {isHost && (
          <>
            <div>
              <label style={css.label}>{t.qLangLabel}</label>
              <div style={{ marginTop: 6 }}>
                <LangPicker value={qLang} onChange={setQLang} />
              </div>
            </div>
            <button
              style={players.length < 2 ? css.btnDisabled : css.btnPrimary}
              onClick={onStart}
              disabled={players.length < 2}
            >
              {players.length < 2 ? t.waitPlayers : t.startBtn}
            </button>
          </>
        )}
        {!isHost && (
          <p style={{ color: "#64748b", textAlign: "center", fontSize: 14, margin: 0 }}>
            {t.waitHost}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Game Screen ──────────────────────────────────────────────────────────
function GameScreen({ t, room, question, isMyTurn, loadingQ, selected, answered, timeLeft, onAnswer, sortedPlayers, playerId, currentPlayer }) {
  const topic = TOPICS.find((tp) => tp.id === room?.questionTopic);
  const pct = (timeLeft / SECONDS) * 100;
  const timerColor = timeLeft > 10 ? "#22c55e" : timeLeft > 5 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "linear-gradient(135deg,#0a0a1a,#1a0a2e,#0a1a2e)", fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width: 175, background: "#0f172a", borderRight: "1px solid #1e293b", padding: "20px 14px", display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
        <div style={{ color: "#475569", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
          {t.scoreTitle}
        </div>
        {sortedPlayers.map((p, i) => (
          <div key={p.id} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 8px",
            borderRadius: 8, background: p.id === playerId ? "#7c3aed22" : "transparent",
          }}>
            <span style={{ color: "#7c3aed", fontWeight: 700, fontSize: 12, width: 20 }}>#{i + 1}</span>
            <span style={{ flex: 1, color: "#f1f5f9", fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
            <span style={{ color: "#a78bfa", fontSize: 12, fontWeight: 700 }}>{p.score}</span>
          </div>
        ))}
        <div style={{ color: "#334155", fontSize: 11, textAlign: "center", marginTop: "auto", paddingTop: 12 }}>
          {t.roundLabel} {room?.round}/{MAX_ROUNDS}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: "24px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, overflowY: "auto" }}>
        {/* Turn banner */}
        <div style={{
          padding: "10px 24px", borderRadius: 30, color: "#fff", fontWeight: 700, fontSize: 15,
          background: isMyTurn ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "#1e293b",
          boxShadow: "0 4px 20px rgba(0,0,0,.3)",
        }}>
          {isMyTurn ? t.myTurn : `🎯 ${t.theirTurn} ${currentPlayer?.name || "..."}`}
        </div>

        {/* Topic pill */}
        {topic && (
          <div style={{ border: "1px solid", borderRadius: 20, padding: "4px 14px", fontSize: 13, fontWeight: 600, color: topic.color, borderColor: topic.color + "55" }}>
            {topic.emoji} {topic.labels[room?.questionLang || "es"]}
          </div>
        )}

        {/* Loading states */}
        {(loadingQ || (!question && isMyTurn)) && <Spinner text={t.generating} />}
        {!question && !isMyTurn && <Spinner text={`${t.waitingQ} ${currentPlayer?.name || ""}...`} />}

        {/* Question */}
        {question && (
          <div style={{
            background: "#0f172a", borderRadius: 18, padding: 24, maxWidth: 600, width: "100%",
            border: "1px solid #1e293b", boxShadow: "0 20px 50px rgba(0,0,0,.4)",
            display: "flex", flexDirection: "column", gap: 14,
            animation: "fadeIn .3s ease",
          }}>
            {/* Timer */}
            {isMyTurn && !answered && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, height: 6, background: "#1e293b", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: timerColor, borderRadius: 3, transition: "width 1s linear, background .5s" }} />
                </div>
                <span style={{ color: timerColor, fontWeight: 700, fontSize: 14, minWidth: 28, textAlign: "right" }}>{timeLeft}s</span>
              </div>
            )}

            {answered && selected === -1 && (
              <div style={{ color: "#f87171", fontWeight: 700, fontSize: 14, textAlign: "center" }}>{t.timeUp}</div>
            )}

            <p style={{ color: "#f1f5f9", fontSize: 18, fontWeight: 700, lineHeight: 1.5, margin: 0 }}>
              {question.question}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {question.options.map((opt, i) => {
                let bg = "#1e293b", bc = "#334155";
                if (answered || !isMyTurn) {
                  if (i === question.correct) { bg = "#14532d"; bc = "#22c55e"; }
                  else if (i === selected) { bg = "#7f1d1d"; bc = "#ef4444"; }
                }
                return (
                  <button
                    key={i}
                    onClick={() => { if (!answered && isMyTurn) onAnswer(i); }}
                    disabled={answered || !isMyTurn}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 8, padding: "12px 14px",
                      border: `1px solid ${bc}`, borderRadius: 12, background: bg,
                      color: "#f1f5f9", fontSize: 13, fontWeight: 600, cursor: (answered || !isMyTurn) ? "default" : "pointer",
                      textAlign: "left", transition: "all .2s",
                    }}
                  >
                    <span style={{
                      width: 24, height: 24, borderRadius: 6, background: "#ffffff11",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 800, flexShrink: 0, marginTop: 1,
                    }}>
                      {["A", "B", "C", "D"][i]}
                    </span>
                    <span style={{ lineHeight: 1.4 }}>{opt}</span>
                  </button>
                );
              })}
            </div>

            {answered && question.explanation && (
              <div style={{ background: "#1e293b", borderRadius: 10, padding: "12px 14px", color: "#94a3b8", fontSize: 13, lineHeight: 1.6 }}>
                <strong style={{ color: "#f1f5f9" }}>{t.explainLabel}</strong> {question.explanation}
              </div>
            )}

            {!isMyTurn && question && (
              <p style={{ color: "#475569", fontSize: 13, textAlign: "center", margin: 0 }}>{t.watching}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Results Screen ───────────────────────────────────────────────────────
function ResultsScreen({ t, sortedPlayers, playerId, onRestart }) {
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div style={css.page}>
      <div style={css.card}>
        <h2 style={{ color: "#f1f5f9", fontSize: 26, fontWeight: 900, textAlign: "center", margin: 0 }}>
          {t.gameOver}
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sortedPlayers.map((p, i) => (
            <div key={p.id} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
              borderRadius: 14, border: "1px solid #1e293b",
              background: p.id === playerId ? "#7c3aed22" : "#1e293b",
            }}>
              <span style={{ fontSize: 28 }}>{medals[i] || `#${i + 1}`}</span>
              <span style={{ flex: 1, color: "#f1f5f9", fontWeight: 700, fontSize: 16 }}>{p.name}</span>
              <span style={{ color: "#a78bfa", fontWeight: 800, fontSize: 18 }}>{p.score} pts</span>
            </div>
          ))}
        </div>
        <button style={css.btnPrimary} onClick={onRestart}>{t.newGame}</button>
      </div>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────
function Spinner({ text }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: 48 }}>
      <div style={{
        width: 38, height: 38, border: "3px solid #1e293b",
        borderTop: "3px solid #7c3aed", borderRadius: "50%",
        animation: "spin 1s linear infinite",
      }} />
      <p style={{ color: "#64748b", fontSize: 14, margin: 0, textAlign: "center" }}>{text}</p>
    </div>
  );
}

// ─── Shared Styles ────────────────────────────────────────────────────────
const css = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "linear-gradient(135deg,#0a0a1a,#1a0a2e,#0a1a2e)", padding: 20,
  },
  card: {
    background: "#0f172a", borderRadius: 22, padding: "30px 26px", maxWidth: 500, width: "100%",
    boxShadow: "0 25px 60px rgba(0,0,0,.6)", border: "1px solid #1e293b",
    display: "flex", flexDirection: "column", gap: 16,
  },
  label: {
    display: "block", color: "#94a3b8", fontSize: 12, fontWeight: 700,
    textTransform: "uppercase", letterSpacing: .5, marginBottom: 6,
  },
  input: {
    width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #334155",
    background: "#1e293b", color: "#f1f5f9", fontSize: 15, outline: "none",
    display: "block",
  },
  btnPrimary: {
    width: "100%", padding: "14px", background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
    color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700,
    cursor: "pointer",
  },
  btnSecondary: {
    padding: "12px 20px", background: "#334155", color: "#f1f5f9",
    border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
    flexShrink: 0,
  },
  btnDisabled: {
    width: "100%", padding: "14px", background: "#1e293b", color: "#475569",
    border: "1px solid #334155", borderRadius: 12, fontSize: 15, fontWeight: 700,
    cursor: "not-allowed",
  },
};
