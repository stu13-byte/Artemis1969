// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import {
  Rocket, ShieldCheck, AlertTriangle, Monitor, Users, CheckCircle,
  Lock, RefreshCw, ChevronRight, Info, Zap, Radio, Settings,
  HeartPulse, Map, Database, Eye, EyeOff,
} from 'lucide-react';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore, collection, doc, setDoc, onSnapshot, writeBatch,
} from 'firebase/firestore';

// ── Firebase Init ─────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: 'AIzaSyAFS8Scft8YlFqKjrgkGCyJyzIYsRua1_c',
  authDomain: 'operation-1969.firebaseapp.com',
  projectId: 'operation-1969',
  storageBucket: 'operation-1969.firebasestorage.app',
  messagingSenderId: '104964948837',
  appId: '1:104964948837:web:f385261360a1a9ade8978c',
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const APP_NS = 'operation-1969';

// ── Types ─────────────────────────────────────────────────────────────────────
interface PuzzleData {
  title: string;
  imageUrl?: string;
  story?: string;
  clues: string[];
  answer: string;
  locationHint?: string;
}

interface DeptInfo {
  name: string;
  icon: React.ElementType;
  stage1: PuzzleData;
  stage3: PuzzleData;
}

interface TeamRecord {
  stage1_solved?: boolean;
  stage3_solved?: boolean;
  initialized?: boolean;
}

// ── Department Data ───────────────────────────────────────────────────────────
const DEPARTMENTS: Record<number, DeptInfo> = {
  1: {
    name: '항법 부서', icon: Map,
    stage1: {
      title: '궤도 암호 해독',
      imageUrl: 'https://i.imgur.com/Q80s9t9.png',
      story: '다음 암호를 해독하세요.\n\nECT = CAR\nOQQP = ?',
      clues: ['영어 대문자 4글자로 입력하세요.'],
      answer: 'MOON',
    },
    stage3: {
      title: '위치 추적',
      imageUrl: 'https://i.imgur.com/OtRdyes.png',
      story: '다음 알파벳들을 보고 숨겨진 의미를 찾으세요.\n\nL Z O\n사이가 좋아!\nN B Q',
      clues: ['영어 대문자 3글자로 입력하세요.'],
      answer: 'MAP',
      locationHint: '지도를 찾으세요',
    },
  },
  2: {
    name: '통신 부서', icon: Radio,
    stage1: {
      title: '기호 회전 암호',
      imageUrl: 'https://i.imgur.com/VZc5ZsR.png',
      story: '다음은 회전 암호입니다.\n100 = 시계방향 1바퀴 회전\n25 = 시계방향 1/4바퀴 회전\n\n다음 글자와 기호를 각각의 숫자만큼 시계방향으로 회전시켜 의미하는 비밀 영어 암호를 해독하세요.\n[ D (100) ]  [ C (25) ]  [ C (25) ]  [ + (50) ]  [ C (75) ]  [ ㄱ (75) ]',
      clues: ['영어 대문자 6글자로 입력하세요.'],
      answer: 'DOCTOR',
    },
    stage3: {
      title: '이미지 연상',
      imageUrl: 'https://i.imgur.com/Rhy7lfs.png',
      story: '다음 그림이 의미하는 것은 무엇인가요?',
      clues: ['한글 두 글자로 입력하세요'],
      answer: '자석',
      locationHint: '자석바구니',
    },
  },
  3: {
    name: '엔지니어 부서', icon: Settings,
    stage1: {
      title: '코드 변환',
      imageUrl: 'https://i.imgur.com/CgZU18K.png',
      story: '다음 코드가 의미하는 4자리 숫자 암호는?\n\n<CODE> XSIRHGNZH\n[HINT -> SRMG]\n[CLUE -> XOFV]',
      clues: ['해독된 단어와 관련된 숫자를 생각해보세요.'],
      answer: '1225',
    },
    stage3: {
      title: '이진수 변환',
      imageUrl: 'https://i.imgur.com/xsghnzZ.png',
      story: '수의 의미는?\n\n111110(2)',
      clues: ['숫자만 입력하세요.'],
      answer: '62',
      locationHint: '청소함을 확인하세요',
    },
  },
  4: {
    name: '생명유지 부서', icon: HeartPulse,
    stage1: {
      title: '이상한 등식',
      imageUrl: 'https://i.imgur.com/X5YPT7n.png',
      story: '이상한 등식을 성립시키세요.\n\ngo + Lg = 73\nSO - EI = 8\n\nElOE + lhS = ?',
      clues: ['숫자만 입력하세요.'],
      answer: '3554',
    },
    stage3: {
      title: '문자 그리드',
      imageUrl: 'https://i.imgur.com/CLjtSmu.png',
      story: "\n\n[햄][버][거]\n[세][트][시]\n[포][장][요]\n\n\n '티', 'ㄱ', 'ㅁ' 모양이 가리키는 세 글자 단어는?",
      clues: ['각 모양이 표에서 어떤 칸들을 덮고 있는지 따라가보세요.', '한글 3글자로 입력하세요.'],
      answer: '티포트',
      locationHint: '티포트(전기포트)',
    },
  },
  5: {
    name: '탐사기획 부서', icon: Zap,
    stage1: {
      title: '숨겨진 메시지',
      imageUrl: 'https://i.imgur.com/olsgBSl.png',
      story: '아폴로 계획에 오신걸 환영합니다.\n일과 중 지구를 벗어나 달을 향하는\n일에 개선\n점을 찾아주길 바랍니다.\n이 우주 경쟁 시대가 우리의 승리이길!',
      clues: ['수를 정확히 입력하세요.'],
      answer: '11.2',
    },
    stage3: {
      title: '단어 결합',
      imageUrl: 'https://i.imgur.com/igsE9po.png',
      story: '식사용 포크와 로켓 그림이 나란히 있습니다.\n포크 + 로켓 = ?',
      clues: ['영어 대문자 6글자로 입력하세요.'],
      answer: 'POCKET',
      locationHint: 'POCKET을 찾으세요',
    },
  },
  6: {
    name: '데이터 부서', icon: Database,
    stage1: {
      title: '데이터 매트릭스',
      imageUrl: 'https://i.imgur.com/6HGECnS.png',
      story: '\n\n00000000000000000\n00000000000000100\n00110010001000100\n00000000000000000\n01100110001001100\n00000000000001100\n00000000000000000',
      clues: ['숫자 4자리를 입력하세요.'],
      answer: '5984',
    },
    stage3: {
      title: '대칭 번역',
      imageUrl: 'https://i.imgur.com/tjzVqgk.png',
      story: 'BALL(공) ↔ LUCK(운)\n지금(NOW) ↔ 월요일(MON\'DAY)\n\nBEAR(곰) ↔ ?\n물음표에 들어갈 네 글자 영어 단어는?',
      clues: ['영어 대문자 4글자로 입력하세요.'],
      answer: 'DOOR',
      locationHint: 'DOOR에 있어요',
    },
  },
};

const SPACE_FACTS = [
  { title: '제2우주속도 (Escape Velocity)', content: '우주선이 지구의 중력을 이겨내고 우주로 나가려면 초속 11.2km라는 엄청난 속도가 필요합니다. 이는 총알보다 무려 10배 이상 빠른 속도입니다!' },
  { title: '위대한 천재, 마거릿 해밀턴', content: '아폴로 11호의 비행 소프트웨어를 개발한 천재 엔지니어입니다. 그녀가 짠 컴퓨터 코드 뭉치를 쌓으면 그녀의 키(160cm)만큼 높았다고 합니다.' },
  { title: '최초의 인공위성과 유리 가가린', content: '1957년 소련은 인류 최초의 인공위성 \'스푸트니크 1호\'를 발사했고, 1961년 유리 가가린은 인류 최초로 우주 비행에 성공했습니다. 미국은 이에 큰 충격을 받고 아폴로 계획을 시작했습니다.' },
  { title: '우주에서는 어떻게 먹고 화장실을 갈까?', content: '초기 우주식량은 튜브에 짜 먹는 형태였지만, 지금은 물을 부어 꽤 맛있는 식사를 합니다. 우주 화장실은 진공청소기처럼 공기를 강하게 빨아들여 배설물이 둥둥 떠다니지 않게 처리한답니다!' },
  { title: '아폴로와 아르테미스', content: '그리스 로마 신화에서 아폴론(태양의 신)과 아르테미스(달의 여신)는 쌍둥이 남매입니다. 미국의 첫 유인 달 탐사 계획이 \'아폴로\'였고, 반세기가 지나 현재 진행 중인 새로운 달 탐사 계획이 바로 \'아르테미스\'랍니다.' },
  { title: '아르테미스 계획', content: '인류를 다시 달에 보내고, 나아가 화성 탐사의 전초기지를 달에 건설하려는 거대한 프로젝트입니다. 이번 계획을 통해 최초의 여성 우주인과 유색인종 우주인도 달에 발을 디딜 예정입니다.' },
  { title: '달에서 우주인들은 무엇을 했을까?', content: '아폴로 우주인들은 달에 성조기를 꽂고, 캥거루처럼 깡충깡충 뛰며 이동했습니다. 또한 월석(달의 돌)을 382kg이나 채집하고, 달의 내부 구조를 알아내기 위해 지진계를 설치하고 돌아왔습니다.' },
  { title: '자랑스러운 대한민국의 \'다누리\' 호', content: '2022년 발사된 \'다누리(Danuri)\'는 대한민국의 첫 번째 달 궤도선입니다. 다누리호 덕분에 우리나라는 세계 7번째 달 탐사국이 되었으며, 지금도 멋진 달 표면 사진과 데이터를 보내오고 있습니다.' },
  { title: '우주로 간 최초의 개, 라이카', content: '인간보다 먼저 우주로 올라간 것은 러시아의 떠돌이 개 \'라이카\'였습니다. 비록 지구로 살아서 돌아오지는 못했지만, 라이카 덕분에 인류는 우주 환경에 대한 귀중한 데이터를 얻었습니다.' },
  { title: '닐 암스트롱의 명언', content: '달에 첫발을 내디딘 닐 암스트롱은 이렇게 말했습니다. "이것은 한 인간에게는 작은 한 걸음이지만, 인류에게는 위대한 도약이다."' },
];

// ── Canvas Starfield Component ────────────────────────────────────────────────
const StarfieldCanvas: React.FC<{ isRedAlert: boolean }> = ({ isRedAlert }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const starsRef = useRef<{ x: number; y: number; z: number; pz: number }[]>([]);
  const redPulseRef = useRef(0);
  const redDirRef = useRef(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const NUM_STARS = 300;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    starsRef.current = Array.from({ length: NUM_STARS }, () => ({
      x: (Math.random() - 0.5) * canvas.width * 2,
      y: (Math.random() - 0.5) * canvas.height * 2,
      z: Math.random() * canvas.width,
      pz: 0,
    }));

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      if (isRedAlert) {
        redPulseRef.current += 0.018 * redDirRef.current;
        if (redPulseRef.current >= 1) redDirRef.current = -1;
        if (redPulseRef.current <= 0) redDirRef.current = 1;
        const intensity = Math.floor(redPulseRef.current * 60);
        ctx.fillStyle = `rgb(${30 + intensity}, 0, 0)`;
      } else {
        ctx.fillStyle = 'rgb(2, 4, 18)';
      }
      ctx.fillRect(0, 0, w, h);

      starsRef.current.forEach((star) => {
        star.pz = star.z;
        star.z -= isRedAlert ? 6 : 2.5;
        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * w * 2;
          star.y = (Math.random() - 0.5) * h * 2;
          star.z = w;
          star.pz = star.z;
        }
        const sx = (star.x / star.z) * w + cx;
        const sy = (star.y / star.z) * h + cy;
        const px = (star.x / star.pz) * w + cx;
        const py = (star.y / star.pz) * h + cy;
        const size = Math.max(0.5, (1 - star.z / w) * 3);
        const brightness = Math.floor((1 - star.z / w) * 255);

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = isRedAlert
          ? `rgba(255, ${Math.floor(brightness * 0.3)}, ${Math.floor(brightness * 0.3)}, ${0.5 + (1 - star.z / w) * 0.5})`
          : `rgba(${brightness}, ${brightness}, 255, ${0.4 + (1 - star.z / w) * 0.6})`;
        ctx.lineWidth = size;
        ctx.stroke();
      });

      if (isRedAlert) {
        const pulse = 0.15 + redPulseRef.current * 0.25;
        const grad = ctx.createRadialGradient(cx, cy, h * 0.2, cx, cy, h * 0.9);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, `rgba(180, 0, 0, ${pulse})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [isRedAlert]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100vw', height: '100vh',
        zIndex: 0, pointerEvents: 'none',
      }}
    />
  );
};

// ── Main App ──────────────────────────────────────────────────────────────────
type Screen = 'intro' | 'select_role' | 'select_team' | 'teacher_pw' | 'teacher' | 'student';

export default function MoonLandingApp() {
  const [user, setUser] = useState<any>(null);
  const [screen, setScreen] = useState<Screen>('intro');
  const [teamNumber, setTeamNumber] = useState<number | null>(null);
  const [globalPhase, setGlobalPhase] = useState<number>(1);
  const [teamsData, setTeamsData] = useState<Record<string, TeamRecord>>({});
  const [inputValue, setInputValue] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [factIndex, setFactIndex] = useState<number>(0);
  const [finalCodeInput, setFinalCodeInput] = useState<string>('');
  const [teacherPwInput, setTeacherPwInput] = useState<string>('');
  const [teacherPwError, setTeacherPwError] = useState<string>('');
  const [showPw, setShowPw] = useState<boolean>(false);

  // ── Auth ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        try { await signInAnonymously(auth); } catch (e) { console.error(e); }
      }
    });
    return () => unsub();
  }, []);

  // ── Fact Rotator ────────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setFactIndex((p) => (p + 1) % SPACE_FACTS.length), 8000);
    return () => clearInterval(id);
  }, []);

  // ── Firestore Listeners ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const globalRef = doc(db, 'artifacts', APP_NS, 'public', 'data', 'moon_landing', 'global_status');
    const unsubGlobal = onSnapshot(globalRef, (snap) => {
      if (snap.exists() && snap.data().phase) setGlobalPhase(snap.data().phase);
    }, console.error);

    const teamsRef = collection(db, 'artifacts', APP_NS, 'public', 'data', 'moon_landing');
    const unsubTeams = onSnapshot(teamsRef, (snapshot) => {
      const tData: Record<string, TeamRecord> = {};
      snapshot.forEach((d) => { if (d.id.startsWith('team_')) tData[d.id] = d.data() as TeamRecord; });
      setTeamsData(tData);
    }, console.error);

    return () => { unsubGlobal(); unsubTeams(); };
  }, [user]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleTeamSelect = async (num: number) => {
    setTeamNumber(num);
    setScreen('student');
    setInputValue('');
    setErrorMsg('');
    if (user) {
      const ref = doc(db, 'artifacts', APP_NS, 'public', 'data', 'moon_landing', `team_${num}`);
      await setDoc(ref, { initialized: true }, { merge: true });
    }
  };

  const handleTeacherPwSubmit = () => {
    if (teacherPwInput === 'seoi6') {
      setTeacherPwError('');
      setTeacherPwInput('');
      setScreen('teacher');
    } else {
      setTeacherPwError('비밀번호가 틀렸습니다. 다시 시도하세요.');
    }
  };

  const handlePuzzleSubmit = async (puzzleData: PuzzleData, stageKey: string) => {
    const norm = (s: string) => s.trim().replace(/\s/g, '').toUpperCase();
    if (norm(inputValue) === norm(puzzleData.answer)) {
      setErrorMsg('');
      setInputValue('');
      if (user && teamNumber) {
        const ref = doc(db, 'artifacts', APP_NS, 'public', 'data', 'moon_landing', `team_${teamNumber}`);
        await setDoc(ref, { [stageKey]: true }, { merge: true });
      }
    } else {
      setErrorMsg('접근 거부: 계산이 틀렸거나 암호가 일치하지 않습니다.');
      setInputValue('');
    }
  };

  const setTeacherGlobalPhase = async (phaseNum: number) => {
    if (!user) return;
    const ref = doc(db, 'artifacts', APP_NS, 'public', 'data', 'moon_landing', 'global_status');
    await setDoc(ref, { phase: phaseNum }, { merge: true });
  };

  const handleResetProgress = async () => {
    if (!user) return;
    if (!window.confirm('초기화하시겠습니까? (학생들 화면도 처음으로 돌아갑니다)')) return;
    const batch = writeBatch(db);
    const globalRef = doc(db, 'artifacts', APP_NS, 'public', 'data', 'moon_landing', 'global_status');
    batch.set(globalRef, { phase: 1 });
    for (let i = 1; i <= 6; i++) {
      const teamDocRef = doc(db, 'artifacts', APP_NS, 'public', 'data', 'moon_landing', `team_${i}`);
      batch.set(teamDocRef, { stage1_solved: false, stage3_solved: false });
    }
    await batch.commit();
    setFinalCodeInput('');
  };

  const handleFinalCodeSubmit = () => {
    const code = finalCodeInput.trim().toUpperCase().replace(/\s/g, '');
    if (code === 'ILOVEYOU') {
      setTeacherGlobalPhase(4);
    } else {
      alert('최종 탈출 코드가 일치하지 않습니다. 오프라인 단서들을 다시 확인하세요.');
    }
  };

  const isRedAlert = screen === 'student' && globalPhase === 2;

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN: INTRO
  // ═══════════════════════════════════════════════════════════════════════════
  if (screen === 'intro') {
    return (
      <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center p-6 font-sans">
        <StarfieldCanvas isRedAlert={false} />
        <div className="relative z-10 max-w-2xl w-full text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-blue-900/40 border border-blue-500/40 text-blue-300 text-sm font-bold tracking-widest px-4 py-2 rounded-full mb-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse inline-block" />
            NASA MISSION CONTROL · 1969
          </div>
          <Rocket
            className="w-20 h-20 mx-auto text-blue-400"
            style={{ filter: 'drop-shadow(0 0 16px rgba(96,165,250,0.9))' }}
          />
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-blue-200 to-emerald-300 leading-tight">
            오퍼레이션<br />1969
          </h1>
          <div className="bg-slate-900/70 border border-slate-700/60 rounded-3xl p-8 text-left space-y-4 backdrop-blur-sm shadow-2xl">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm tracking-widest uppercase mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
              긴급 임무 브리핑 — 최고 기밀
            </div>
            <p className="text-slate-200 text-lg leading-relaxed">
              <span className="text-white font-bold">대원 여러분, 환영합니다.</span>
            </p>
            <p className="text-slate-300 leading-relaxed">
              오늘 여러분의 임무는 인류 역사상 가장 위대한 도전인{' '}
              <span className="text-blue-300 font-bold">달 탐사를 성공</span>시키는 것입니다.
              지구 궤도 돌파부터 달 표면 착륙까지, 각 부서는 고유한 암호와 단서를 해독하여
              아폴로 우주선을 이끌어야 합니다.
            </p>
            <p className="text-slate-300 leading-relaxed">
              예상치 못한 위기가 닥칠 수도 있습니다. 그럴 때일수록{' '}
              <span className="text-yellow-300 font-bold">팀원들과 힘을 합쳐</span> 극복해야 합니다.
              인류의 미래가 여러분의 손에 달려 있습니다.
            </p>
            <p className="text-slate-400 text-sm italic mt-2">
              "Houston, we have a mission." — 1969년 7월 16일
            </p>
          </div>
          <button
            onClick={() => setScreen('select_role')}
            className="group inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xl px-10 py-5 rounded-2xl transition-all shadow-lg shadow-blue-900/60 active:scale-95"
          >
            <Rocket className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            임무 시작
            <ChevronRight className="w-5 h-5" />
          </button>
          <p className="text-slate-600 text-xs tracking-wider">
            NASA COLLABORATIVE MOON LANDING PROJECT · ALL SYSTEMS GO
          </p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN: SELECT ROLE
  // ═══════════════════════════════════════════════════════════════════════════
  if (screen === 'select_role') {
    return (
      <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center p-6 font-sans">
        <StarfieldCanvas isRedAlert={false} />
        <div className="relative z-10 max-w-md w-full text-center space-y-8">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              오퍼레이션 1969
            </h1>
            <p className="text-slate-400 mt-2 font-medium">NASA 협동 달 탐사 프로젝트 시스템</p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => setScreen('select_team')}
              className="group flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white p-5 rounded-2xl font-bold text-xl transition-all shadow-lg shadow-blue-900/50 active:scale-95"
            >
              <Users className="w-6 h-6" /> 학생 부서 접속
            </button>
            <button
              onClick={() => { setTeacherPwInput(''); setTeacherPwError(''); setScreen('teacher_pw'); }}
              className="group flex items-center justify-center gap-3 bg-slate-800/80 hover:bg-slate-700 text-white p-5 rounded-2xl font-bold text-xl transition-all border border-slate-700 backdrop-blur-sm"
            >
              <Monitor className="w-6 h-6" /> 교사 중앙 관제소 (TV)
            </button>
          </div>
          <button onClick={() => setScreen('intro')} className="text-slate-500 hover:text-white transition-colors text-sm">
            ← 인트로로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN: TEACHER PASSWORD
  // ═══════════════════════════════════════════════════════════════════════════
  if (screen === 'teacher_pw') {
    return (
      <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center p-6 font-sans">
        <StarfieldCanvas isRedAlert={false} />
        <div className="relative z-10 max-w-sm w-full">
          <div className="bg-slate-900/90 border border-slate-700 rounded-3xl p-8 shadow-2xl backdrop-blur-md space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-800 border border-slate-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-black text-white">관제소 보안 인증</h2>
              <p className="text-slate-400 text-sm mt-1">교사 전용 시스템입니다. 비밀번호를 입력하세요.</p>
            </div>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={teacherPwInput}
                onChange={(e) => setTeacherPwInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTeacherPwSubmit()}
                placeholder="비밀번호 입력"
                className={`w-full bg-slate-950 border ${teacherPwError ? 'border-red-500' : 'border-slate-700 focus:border-blue-500'} rounded-xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-center tracking-widest pr-12`}
              />
              <button
                onClick={() => setShowPw((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {teacherPwError && (
              <div className="flex items-center gap-2 text-red-400 bg-red-950/50 p-3 rounded-lg text-sm font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {teacherPwError}
              </div>
            )}
            <button
              onClick={handleTeacherPwSubmit}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg"
            >
              인증하기
            </button>
            <button
              onClick={() => setScreen('select_role')}
              className="w-full text-slate-500 hover:text-white transition-colors text-sm"
            >
              ← 뒤로 가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN: SELECT TEAM
  // ═══════════════════════════════════════════════════════════════════════════
  if (screen === 'select_team') {
    return (
      <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center p-6 font-sans">
        <StarfieldCanvas isRedAlert={false} />
        <div className="relative z-10 max-w-xl w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">부서 로그인</h2>
            <p className="text-slate-400 mt-2">사전 미션에서 배정받은 부서를 선택하세요.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((num) => {
              const DeptIcon = DEPARTMENTS[num].icon;
              return (
                <button
                  key={num}
                  onClick={() => handleTeamSelect(num)}
                  className="bg-slate-900/80 hover:bg-blue-600 border border-slate-800 hover:border-blue-500 p-6 rounded-2xl transition-all flex flex-col items-center gap-3 text-center group backdrop-blur-sm"
                >
                  <div className="text-blue-500 group-hover:text-white transition-colors">
                    <DeptIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-lg text-slate-200 group-hover:text-white">{num}조</div>
                    <div className="text-sm text-slate-500 group-hover:text-blue-200">{DEPARTMENTS[num].name}</div>
                  </div>
                </button>
              );
            })}
          </div>
          <button onClick={() => setScreen('select_role')} className="w-full text-slate-500 hover:text-white transition-colors mt-8">
            ← 뒤로 가기
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN: TEACHER DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════
  if (screen === 'teacher') {
    return (
      <div className="relative min-h-screen overflow-hidden font-sans">
        <StarfieldCanvas isRedAlert={false} />
        <div className="relative z-10 min-h-screen text-slate-100 p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">

            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-800 pb-6 gap-4">
              <div>
                <h1 className="text-3xl font-black flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                  <Monitor className="text-blue-500 w-8 h-8" style={{ color: '#60a5fa' }} />
                  NASA 중앙 관제 대시보드
                </h1>
                <p className="text-slate-400 mt-2">버튼을 클릭하여 반 전체 학생의 기기 화면을 강제로 동기화시킵니다.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleResetProgress}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 text-slate-300 border border-slate-700 hover:bg-red-900 hover:text-white rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" /> 초기화
                </button>
                <button
                  onClick={() => setScreen('select_role')}
                  className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  나가기
                </button>
              </div>
            </div>

            {/* Phase Control */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-sm">
              <h2 className="text-xl font-bold mb-6 text-slate-300">위상 제어 시스템 (Phase Control)</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { phase: 1, label: '[개별 퍼즐] 1단계 지구 궤도 돌파', activeColor: 'bg-blue-900/40 border-blue-500 text-blue-300' },
                  { phase: 2, label: '[위기 발동] 산소 탱크 폭발', activeColor: 'bg-red-900/40 border-red-500 text-red-300' },
                  { phase: 3, label: '[오프라인] 달 탐사 보물찾기', activeColor: 'bg-purple-900/40 border-purple-500 text-purple-300' },
                  { phase: 4, label: '[귀환 성공] 글로벌 엔딩 송출', activeColor: 'bg-emerald-900/40 border-emerald-500 text-emerald-300' },
                ].map(({ phase, label, activeColor }) => (
                  <button
                    key={phase}
                    onClick={() => setTeacherGlobalPhase(phase)}
                    className={`p-4 rounded-xl border-2 text-left font-bold transition-all ${globalPhase === phase ? activeColor : 'bg-slate-800/60 border-transparent text-slate-400 hover:bg-slate-700'}`}
                  >
                    <div className="text-sm font-normal mb-1">Phase {phase}</div>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Final Code Input (Phase 3) */}
            {globalPhase === 3 && (
              <div className="bg-emerald-950/40 border-2 border-emerald-500/50 rounded-3xl p-8 text-center shadow-2xl shadow-emerald-900/20 backdrop-blur-sm">
                <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <h2 className="text-3xl font-black text-emerald-400 mb-2">최종 귀환 승인 시스템</h2>
                <p className="text-emerald-200/80 mb-6 text-lg">
                  모든 부서가 학급에서 찾은 단서들을 하나로 모아 만든{' '}
                  <strong className="text-white">최종 코드</strong>를 입력하세요.
                </p>
                <div className="max-w-xl mx-auto flex gap-4">
                  <input
                    type="text"
                    value={finalCodeInput}
                    onChange={(e) => setFinalCodeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFinalCodeSubmit()}
                    placeholder="단서 조합 최종 코드 입력"
                    className="flex-1 bg-slate-900 border border-emerald-800 rounded-xl px-6 py-4 text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase tracking-widest text-center"
                  />
                  <button
                    onClick={handleFinalCodeSubmit}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-4 rounded-xl transition-all text-xl whitespace-nowrap"
                  >
                    승인 및 귀환
                  </button>
                </div>
              </div>
            )}

            {/* Team Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {[1, 2, 3, 4, 5, 6].map((teamId) => {
                const teamData = teamsData[`team_${teamId}`] || {};
                const s1Solved = teamData.stage1_solved;
                const s3Solved = teamData.stage3_solved;
                const DeptIcon = DEPARTMENTS[teamId].icon;
                return (
                  <div key={teamId} className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                        <span className="text-blue-500"><DeptIcon className="w-6 h-6" /></span>
                        {teamId}조: {DEPARTMENTS[teamId].name}
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <div className={`flex items-center gap-3 p-3 rounded-lg ${s1Solved ? 'bg-emerald-900/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                        {s1Solved ? <CheckCircle className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                        <span className="font-medium">1단계 퍼즐 해독</span>
                      </div>
                      <div className={`flex items-center gap-3 p-3 rounded-lg ${s3Solved ? 'bg-emerald-900/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                        {s3Solved ? <CheckCircle className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                        <span className="font-medium">3단계 오프라인 단서 발견</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN: STUDENT
  // ═══════════════════════════════════════════════════════════════════════════
  if (screen === 'student' && teamNumber) {
    const teamRecord = teamsData[`team_${teamNumber}`] || {};
    const deptInfo = DEPARTMENTS[teamNumber];
    const DeptIcon = deptInfo.icon;

    // ── PHASE 4: GLOBAL SUCCESS ─────────────────────────────────────────────
    if (globalPhase === 4) {
      return (
        <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center p-6 text-center font-sans">
          <StarfieldCanvas isRedAlert={false} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none z-0" />
          <div className="relative z-10 max-w-2xl w-full space-y-8">
            <ShieldCheck
              className="w-32 h-32 text-emerald-400 mx-auto animate-bounce"
              style={{ filter: 'drop-shadow(0 0 32px rgba(52,211,153,0.8))' }}
            />
            <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-blue-300 to-white leading-tight">
              MISSION<br />SUCCESS
            </h1>
            <p className="text-2xl text-emerald-300 font-bold tracking-wide">
              달 탐사 완수 — 지구 귀환 승인
            </p>
            <div className="bg-slate-900/70 border border-emerald-800/50 rounded-3xl p-8 text-left space-y-5 backdrop-blur-sm shadow-2xl">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm tracking-widest uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                최종 임무 보고서
              </div>
              <p className="text-slate-200 text-lg leading-relaxed">여러분 모두가 함께 만들어낸 기적입니다.</p>
              <p className="text-slate-300 leading-relaxed">
                여러분들의 노력 덕분에 달 탐사에 무사히 성공했고, 닐 암스트롱이 달 표면에
                첫발을 내딛는 그 역사적인 순간이 완성되었습니다.
              </p>
              <p className="text-slate-300 leading-relaxed">
                그 위대한 업적은 지금으로도 이어져,{' '}
                <span className="text-blue-300 font-bold">아르테미스 계획</span>으로 인류는
                다시 달 탐사에 성공하였습니다. 최초의 여성 우주인과 유색인종 우주인이 달에
                발을 디디며, 아폴로의 정신이 반세기를 넘어 빛나고 있습니다.
              </p>
              <p className="text-emerald-300 text-lg font-bold leading-relaxed border-t border-emerald-900/50 pt-4">
                "이것은 한 인간에게는 작은 한 걸음이지만,<br />
                인류에게는 위대한 도약이다."
              </p>
              <p className="text-slate-500 text-sm text-right">— 닐 암스트롱, 1969년 7월 20일</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              {[1, 2, 3, 4, 5, 6].map((n) => {
                const I = DEPARTMENTS[n].icon;
                return (
                  <div key={n} className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-700/50 text-emerald-300 px-4 py-2 rounded-full text-sm font-bold">
                    <I className="w-4 h-4" />
                    {n}조 {DEPARTMENTS[n].name}
                  </div>
                );
              })}
            </div>
            <p className="text-slate-600 text-xs tracking-widest">
              OPERATION 1969 · ALL SYSTEMS NOMINAL · MISSION COMPLETE
            </p>
          </div>
        </div>
      );
    }

    // ── PHASE 2: CRISIS ─────────────────────────────────────────────────────
    if (globalPhase === 2) {
      return (
        <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center p-6 text-center font-sans">
          <StarfieldCanvas isRedAlert={true} />
          <div className="fixed inset-0 z-10 pointer-events-none border-[12px] border-red-600 animate-pulse rounded-none" />
          <div className="relative z-20 max-w-lg w-full space-y-6">
            <AlertTriangle
              className="w-32 h-32 text-red-500 mx-auto animate-bounce"
              style={{ filter: 'drop-shadow(0 0 24px rgba(239,68,68,1))' }}
            />
            <h1 className="text-4xl font-black tracking-widest text-white drop-shadow-lg">CRITICAL ERROR</h1>
            <h2 className="text-2xl font-bold text-red-400">산소 탱크 폭발! 통신 두절</h2>
            <div className="bg-black/60 p-6 rounded-2xl border border-red-800 mt-8 backdrop-blur-sm">
              <p className="text-lg leading-relaxed text-red-200">
                우주선 궤도에 치명적인 문제가 발생했습니다.<br /><br />
                <strong>지시사항:</strong> 즉시 패드에서 손을 떼고 선생님(휴스턴 관제센터)의
                오프라인 단체 미션 지시에 따르십시오.<br />
                모든 부서가 힘을 합쳐 미션을 통과해야만 통신이 복구됩니다.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // ── PUZZLE RENDERER ──────────────────────────────────────────────────────
    const renderPuzzle = (puzzleData: PuzzleData, isSolved: boolean, stageKey: string) => {
      if (isSolved) {
        if (stageKey === 'stage1_solved') {
          const fact = SPACE_FACTS[factIndex];
          return (
            <div className="space-y-6">
              <div
                className="relative overflow-hidden rounded-2xl p-6 text-center"
                style={{
                  background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
                  border: '3px solid #34d399',
                  boxShadow: '0 0 32px rgba(52,211,153,0.4)',
                }}
              >
                <div
                  className="absolute inset-0 opacity-20"
                  style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.1) 8px, rgba(255,255,255,0.1) 16px)' }}
                />
                <Users
                  className="w-12 h-12 text-emerald-300 mx-auto mb-3 relative z-10"
                  style={{ filter: 'drop-shadow(0 0 10px rgba(52,211,153,0.8))' }}
                />
                <p
                  className="relative z-10 font-black text-emerald-100 leading-tight"
                  style={{ fontSize: '1.9rem', textShadow: '0 0 20px rgba(52,211,153,0.7)' }}
                >
                  다른 팀을 도와주세요!
                </p>
                <p className="relative z-10 text-emerald-300 text-base mt-2 font-semibold">
                  내 팀의 퍼즐은 해결됐습니다.<br />
                  아직 풀지 못한 팀원들을 찾아 함께 해결하세요.
                </p>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-sm text-center">
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-200 mb-2">1단계 암호 해독 완료</h2>
                <p className="text-slate-400 mb-6 text-sm">다른 부서가 궤도를 돌파할 때까지 대기해 주십시오.</p>
                <div className="bg-slate-950 border border-blue-900/30 rounded-2xl p-6 text-left relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-full" />
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-sm uppercase mb-3">
                    <Info className="w-4 h-4" /> NASA 우주 상식 DB
                  </div>
                  <h3 className="text-xl font-bold text-slate-200 mb-2">{fact.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{fact.content}</p>
                </div>
              </div>
            </div>
          );
        } else {
          return (
            <div className="bg-purple-950/40 border border-purple-900 rounded-3xl p-6 md:p-8 shadow-2xl text-center backdrop-blur-sm">
              <Map className="w-20 h-20 text-purple-400 mx-auto mb-6 animate-bounce" />
              <h2 className="text-3xl font-black text-purple-300 mb-4">단서 추적 성공!</h2>
              <div className="bg-black/40 border border-purple-500/30 rounded-2xl p-6 mb-8">
                <span className="block text-sm text-purple-400 font-bold mb-2">목표 위치</span>
                <strong className="text-2xl text-white break-keep leading-snug">{puzzleData.locationHint}</strong>
              </div>
              <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
                <h3 className="text-xl font-bold text-emerald-400 mb-2">최종 귀환 시스템</h3>
                <p className="text-sm text-emerald-200/80 mb-6 break-keep leading-relaxed">
                  모든 단서를 모았나요? 조합한 최종 코드를 입력하면 반 전체가 지구로 동시 귀환합니다! (누구든 한 번만 맞히면 성공)
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={finalCodeInput}
                    onChange={(e) => setFinalCodeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFinalCodeSubmit()}
                    placeholder="최종 코드 입력"
                    className="flex-1 bg-slate-900 border border-emerald-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase tracking-widest text-center"
                  />
                  <button
                    onClick={handleFinalCodeSubmit}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl transition-all whitespace-nowrap"
                  >
                    귀환 승인
                  </button>
                </div>
              </div>
            </div>
          );
        }
      }

      // Active puzzle
      return (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-blue-400 mb-4">{puzzleData.title}</h2>
          {puzzleData.imageUrl && (
            <div className="mb-6 bg-white rounded-xl overflow-hidden border border-slate-700">
              <img src={puzzleData.imageUrl} alt={puzzleData.title} className="w-full h-auto object-contain" />
            </div>
          )}
          {!puzzleData.imageUrl && puzzleData.story && (
            <div className="text-slate-300 mb-6 leading-relaxed text-lg break-keep whitespace-pre-wrap font-mono bg-slate-950 p-4 rounded-xl border border-slate-800">
              {puzzleData.story}
            </div>
          )}
          <div className="bg-slate-950 rounded-xl p-5 mb-8 border border-slate-800">
            <h3 className="text-sm font-bold text-slate-500 mb-3 tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> 수신된 단서
            </h3>
            <ul className="space-y-3">
              {puzzleData.clues.map((clue, idx) => (
                <li key={idx} className="flex gap-3 text-slate-300 font-medium break-keep leading-snug">
                  <span className="text-blue-500 mt-0.5">›</span> {clue}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePuzzleSubmit(puzzleData, stageKey)}
              placeholder="해독된 코드를 입력하세요"
              className={`w-full bg-slate-950 border ${errorMsg ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-blue-500'} rounded-xl px-5 py-4 text-lg text-white focus:outline-none focus:ring-2 transition-all text-center uppercase tracking-widest`}
            />
            {errorMsg && (
              <div className="flex items-center justify-center gap-2 text-red-400 bg-red-950/50 p-3 rounded-lg text-sm font-bold">
                <AlertTriangle className="w-5 h-5 shrink-0" /> {errorMsg}
              </div>
            )}
            <button
              onClick={() => handlePuzzleSubmit(puzzleData, stageKey)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg py-4 rounded-xl transition-all shadow-lg shadow-blue-900/50 active:scale-95 flex justify-center items-center gap-2"
            >
              시스템 승인 요청 <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      );
    };

    // ── STUDENT MAIN RENDER (Phase 1 & 3) ────────────────────────────────────
    return (
      <div className="relative min-h-screen overflow-hidden font-sans">
        <StarfieldCanvas isRedAlert={isRedAlert} />
        <div className="relative z-10 min-h-screen text-slate-100 p-4 md:p-8 flex flex-col items-center justify-center">
          <div className="max-w-xl w-full">
            {/* Header bar */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-slate-800/80 p-2 rounded-lg text-blue-400 backdrop-blur-sm">
                  <DeptIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-500">
                    [{globalPhase === 1 ? '1단계 궤도 돌파' : '3단계 달 탐사'}]
                  </div>
                  <div className="font-bold text-lg">{teamNumber}조 {deptInfo.name}</div>
                </div>
              </div>
              <div className="flex gap-1">
                <div className={`h-2 w-8 rounded-full ${globalPhase >= 1 ? 'bg-blue-500' : 'bg-slate-800'}`} />
                <div className={`h-2 w-8 rounded-full ${globalPhase >= 2 ? 'bg-red-500' : 'bg-slate-800'}`} />
                <div className={`h-2 w-8 rounded-full ${globalPhase >= 3 ? 'bg-purple-500' : 'bg-slate-800'}`} />
              </div>
            </div>
            {globalPhase === 1 && renderPuzzle(deptInfo.stage1, !!teamRecord.stage1_solved, 'stage1_solved')}
            {globalPhase === 3 && renderPuzzle(deptInfo.stage3, !!teamRecord.stage3_solved, 'stage3_solved')}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
