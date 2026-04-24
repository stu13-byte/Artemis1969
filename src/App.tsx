// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Rocket, ShieldCheck, AlertTriangle, Monitor, Users, CheckCircle, Lock, RefreshCw, ChevronRight, Info, Zap, Radio, Settings, HeartPulse, Map, Database } from 'lucide-react';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, writeBatch } from 'firebase/firestore';

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAFS8Scft8YlFqKjrgkGCyJyzIYsRua1_c",
  authDomain: "operation-1969.firebaseapp.com",
  projectId: "operation-1969",
  storageBucket: "operation-1969.firebasestorage.app",
  messagingSenderId: "104964948837",
  appId: "1:104964948837:web:f385261360a1a9ade8978c"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// [FIX 1] __app_id 제거 → 고정 네임스페이스 사용
const APP_NS = 'operation-1969';

// --- DATA: Department Puzzles ---
const DEPARTMENTS = {
  1: {
    name: "항법 부서", icon: Map,
    stage1: {
      title: "궤도 암호 해독",
      imageUrl: "https://i.imgur.com/Q80s9t9.png",
      story: "다음 암호를 해독하세요.\n\nECT = CAR\nOQQP = ?",
      clues: ["영어 대문자 4글자로 입력하세요."],
      answer: "MOON"
    },
    stage3: {
      title: "위치 추적",
      imageUrl: "https://i.imgur.com/OtRdyes.png",
      story: "다음 알파벳들을 보고 숨겨진 의미를 찾으세요.\n\nL Z O\n사이가 좋아!\nN B Q",
      clues: ["영어 대문자 3글자로 입력하세요."],
      answer: "MAP",
      locationHint: "MAP"
    }
  },
  2: {
    name: "통신 부서", icon: Radio,
    stage1: {
      title: "기호 회전 암호",
      imageUrl: "https://i.imgur.com/VZc5ZsR.png",
      story: "다음은 회전 암호입니다.\n100 = 시계방향 1바퀴 회전\n25 = 시계방향 1/4바퀴 회전\n\n다음 글자와 기호를 각각의 숫자만큼 시계방향으로 회전시켜 의미하는 비밀 영어 암호를 해독하세요.\n[ D (100) ]  [ C (25) ]  [ C (25) ]  [ + (50) ]  [ C (75) ]  [ ㄱ (75) ]",
      clues: ["영어 대문자 6글자로 입력하세요."],
      answer: "DOCTOR"
    },
    stage3: {
      title: "이미지 연상",
      imageUrl: "https://i.imgur.com/Rhy7lfs.png",
      story: "다음 그림이 의미하는 것은 무엇인가요?",
      clues: ["한글 두 글자로 입력하세요"],
      answer: "자석",
      locationHint: "자석바구니"
    }
  },
  3: {
    name: "엔지니어 부서", icon: Settings,
    stage1: {
      title: "코드 변환",
      imageUrl: "https://i.imgur.com/CgZU18K.png",
      story: "다음 코드가 의미하는 4자리 숫자 암호는?\n\n<CODE> XSIRHGNZH\n[HINT -> SRMG]\n[CLUE -> XOFV]",
      clues: ["해독된 단어와 관련된 숫자를 생각해보세요."],
      answer: "1225"
    },
    stage3: {
      title: "이진수 변환",
      imageUrl: "https://i.imgur.com/xsghnzZ.png",
      story: "수의 의미는?\n\n111110(2)",
      clues: ["숫자만 입력하세요."],
      answer: "62",
      locationHint: "62(어딨을까?)"
    }
  },
  4: {
    name: "생명유지 부서", icon: HeartPulse,
    stage1: {
      title: "이상한 등식",
      imageUrl: "https://i.imgur.com/X5YPT7n.png",
      story: "이상한 등식을 성립시키세요.\n\ngo + Lg = 73\nSO - EI = 8\n\nElOE + lhS = ?",
      clues: ["숫자만 입력하세요."],
      answer: "3554"
    },
    stage3: {
      title: "문자 그리드",
      imageUrl: "https://i.imgur.com/CLjtSmu.png",
      story: "\n\n[햄][버][거]\n[세][트][시]\n[포][장][요]\n\n\n '티', 'ㄱ', 'ㅁ' 모양이 가리키는 세 글자 단어는?",
      clues: ["각 모양이 표에서 어떤 칸들을 덮고 있는지 따라가보세요.", "한글 3글자로 입력하세요."],
      answer: "티포트",
      locationHint: "티포트(전기포트)"
    }
  },
  5: {
    name: "탐사기획 부서", icon: Zap,
    stage1: {
      title: "숨겨진 메시지",
      imageUrl: "https://i.imgur.com/olsgBSl.png",
      story: "아폴로 계획에 오신걸 환영합니다.\n일과 중 지구를 벗어나 달을 향하는\n일에 개선\n점을 찾아주길 바랍니다.\n이 우주 경쟁 시대가 우리의 승리이길!",
      clues: ["수를 정확히 입력하세요."],
      answer: "11.2"
    },
    stage3: {
      title: "단어 결합",
      imageUrl: "https://i.imgur.com/igsE9po.png",
      story: "식사용 포크와 로켓 그림이 나란히 있습니다.\n포크 + 로켓 = ?",
      clues: ["영어 대문자 6글자로 입력하세요."],
      answer: "POCKET",
      locationHint: "POCKET"
    }
  },
  6: {
    name: "데이터 부서", icon: Database,
    stage1: {
      title: "데이터 매트릭스",
      imageUrl: "https://i.imgur.com/6HGECnS.png",
      story: "\n\n00000000000000000\n00000000000000100\n00110010001000100\n00000000000000000\n01100110001001100\n00000000000001100\n00000000000000000",
      clues: ["숫자 4자리를 입력하세요."],
      answer: "5984"
    },
    stage3: {
      title: "대칭 번역",
      imageUrl: "https://i.imgur.com/tjzVqgk.png",
      story: "BALL(공) ↔ LUCK(운)\n지금(NOW) ↔ 월요일(MON'DAY)\n\nBEAR(곰) ↔ ?\n물음표에 들어갈 네 글자 영어 단어는?",
      clues: ["영어 대문자 4글자로 입력하세요."],
      answer: "DOOR",
      locationHint: "DOOR"
    }
  }
};

const SPACE_FACTS = [
  { title: "제2우주속도 (Escape Velocity)", content: "우주선이 지구의 중력을 이겨내고 우주로 나가려면 초속 11.2km라는 엄청난 속도가 필요합니다. 이는 총알보다 무려 10배 이상 빠른 속도입니다!" },
  { title: "위대한 천재, 마거릿 해밀턴", content: "아폴로 11호의 비행 소프트웨어를 개발한 천재 엔지니어입니다. 그녀가 짠 컴퓨터 코드 뭉치를 쌓으면 그녀의 키(160cm)만큼 높았다고 합니다." },
  { title: "최초의 인공위성과 유리 가가린", content: "1957년 소련은 인류 최초의 인공위성 '스푸트니크 1호'를 발사했고, 1961년 유리 가가린은 인류 최초로 우주 비행에 성공했습니다. 미국은 이에 큰 충격을 받고 아폴로 계획을 시작했습니다." },
  { title: "우주에서는 어떻게 먹고 화장실을 갈까?", content: "초기 우주식량은 튜브에 짜 먹는 형태였지만, 지금은 물을 부어 꽤 맛있는 식사를 합니다. 우주 화장실은 진공청소기처럼 공기를 강하게 빨아들여 배설물이 둥둥 떠다니지 않게 처리한답니다!" },
  { title: "아폴로와 아르테미스", content: "그리스 로마 신화에서 아폴론(태양의 신)과 아르테미스(달의 여신)는 쌍둥이 남매입니다. 미국의 첫 유인 달 탐사 계획이 '아폴로'였고, 반세기가 지나 현재 진행 중인 새로운 달 탐사 계획이 바로 '아르테미스'랍니다." },
  { title: "아르테미스 계획", content: "인류를 다시 달에 보내고, 나아가 화성 탐사의 전초기지를 달에 건설하려는 거대한 프로젝트입니다. 이번 계획을 통해 최초의 여성 우주인과 유색인종 우주인도 달에 발을 디딜 예정입니다." },
  { title: "달에서 우주인들은 무엇을 했을까?", content: "아폴로 우주인들은 달에 성조기를 꽂고, 캥거루처럼 깡충깡충 뛰며 이동했습니다. 또한 월석(달의 돌)을 382kg이나 채집하고, 달의 내부 구조를 알아내기 위해 지진계를 설치하고 돌아왔습니다." },
  { title: "자랑스러운 대한민국의 '다누리' 호", content: "2022년 발사된 '다누리(Danuri)'는 대한민국의 첫 번째 달 궤도선입니다. 다누리호 덕분에 우리나라는 세계 7번째 달 탐사국이 되었으며, 지금도 멋진 달 표면 사진과 데이터를 보내오고 있습니다." },
  { title: "우주로 간 최초의 개, 라이카", content: "인간보다 먼저 우주로 올라간 것은 러시아의 떠돌이 개 '라이카'였습니다. 비록 지구로 살아서 돌아오지는 못했지만, 라이카 덕분에 인류는 우주 환경에 대한 귀중한 데이터를 얻었습니다." },
  { title: "닐 암스트롱의 명언", content: "달에 첫발을 내디딘 닐 암스트롱은 이렇게 말했습니다. '이것은 한 인간에게는 작은 한 걸음이지만, 인류에게는 위대한 도약이다.'" }
];

export default function MoonLandingApp() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [teamNumber, setTeamNumber] = useState(null);

  const [globalPhase, setGlobalPhase] = useState(1);
  const [teamsData, setTeamsData] = useState({});

  const [inputValue, setInputValue] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [factIndex, setFactIndex] = useState(0);
  const [finalCodeInput, setFinalCodeInput] = useState('');

  // [FIX 2] 인증 타이밍 수정: onAuthStateChanged 안에서 signInAnonymously 호출
  // user가 없을 때만 익명 로그인 시도 → 타이밍 경쟁 조건 제거
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Auth error:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Fact Rotator
  useEffect(() => {
    const interval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % SPACE_FACTS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // 3. Listen to Global State & Teams State
  useEffect(() => {
    if (!user) return;

    // [FIX 1 적용] __app_id 대신 고정 APP_NS 사용
    const globalRef = doc(db, 'artifacts', APP_NS, 'public', 'data', 'moon_landing', 'global_status');
    const unsubGlobal = onSnapshot(globalRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().phase) {
        setGlobalPhase(docSnap.data().phase);
      }
    }, (error) => console.error(error));

    const teamsRef = collection(db, 'artifacts', APP_NS, 'public', 'data', 'moon_landing');
    const unsubTeams = onSnapshot(teamsRef, (snapshot) => {
      const tData = {};
      snapshot.forEach((d) => {
        if (d.id.startsWith('team_')) {
          tData[d.id] = d.data();
        }
      });
      setTeamsData(tData);
    }, (error) => console.error(error));

    return () => { unsubGlobal(); unsubTeams(); };
  }, [user]);

  // Handle Team Selection
  const handleTeamSelect = async (num) => {
    setTeamNumber(num);
    setRole('student');
    setInputValue('');
    setErrorMsg('');

    if (user) {
      const teamDocRef = doc(db, 'artifacts', APP_NS, 'public', 'data', 'moon_landing', `team_${num}`);
      await setDoc(teamDocRef, { initialized: true }, { merge: true });
    }
  };

  // Submit Puzzle Answer
  const handlePuzzleSubmit = async (puzzleData, stageKey) => {
    // [FIX 3] e.preventDefault() 불필요 → form 제거했으므로 삭제
    const normalizedInput = inputValue.trim().replace(/\s/g, '').toUpperCase();
    const normalizedAnswer = puzzleData.answer.trim().replace(/\s/g, '').toUpperCase();

    if (normalizedInput === normalizedAnswer) {
      setErrorMsg('');
      setInputValue('');
      if (user && teamNumber) {
        const teamDocRef = doc(db, 'artifacts', APP_NS, 'public', 'data', 'moon_landing', `team_${teamNumber}`);
        await setDoc(teamDocRef, { [stageKey]: true }, { merge: true });
      }
    } else {
      setErrorMsg('접근 거부: 계산이 틀렸거나 암호가 일치하지 않습니다.');
      setInputValue('');
    }
  };

  // Teacher: Change Global Phase
  const setTeacherGlobalPhase = async (phaseNum) => {
    if (!user) return;
    const globalRef = doc(db, 'artifacts', APP_NS, 'public', 'data', 'moon_landing', 'global_status');
    await setDoc(globalRef, { phase: phaseNum }, { merge: true });
  };

  // Teacher: Reset Everything
  const handleResetProgress = async () => {
    if (!user) return;
    if (window.confirm("초기화하시겠습니까? (학생들 화면도 처음으로 돌아갑니다)")) {
      const batch = writeBatch(db);
      const globalRef = doc(db, 'artifacts', APP_NS, 'public', 'data', 'moon_landing', 'global_status');
      batch.set(globalRef, { phase: 1 });
      for (let i = 1; i <= 6; i++) {
        const teamDocRef = doc(db, 'artifacts', APP_NS, 'public', 'data', 'moon_landing', `team_${i}`);
        batch.set(teamDocRef, { stage1_solved: false, stage3_solved: false });
      }
      await batch.commit();
      setFinalCodeInput('');
    }
  };

  // Final Code Submit
  const handleFinalCodeSubmit = () => {
    // [FIX 3] form onSubmit → 버튼 onClick으로 변경
    const code = finalCodeInput.trim().toUpperCase().replace(/\s/g, '');
    if (code === 'ILOVEYOU') {
      setTeacherGlobalPhase(4);
    } else {
      alert("최종 탈출 코드가 일치하지 않습니다. 오프라인 단서들을 다시 확인하세요.");
    }
  };

  // --- UI RENDERERS ---

  // 1. SELECT ROLE
  if (!role) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full text-center space-y-8">
          <Rocket className="w-24 h-24 mx-auto text-blue-500 animate-pulse" />
          <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            오퍼레이션 1969
          </h1>
          <p className="text-slate-400 text-lg font-medium">NASA 협동 달 탐사 프로젝트 시스템</p>
          <div className="grid grid-cols-1 gap-4 pt-8">
            <button onClick={() => setRole('select_team')} className="group flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white p-5 rounded-2xl font-bold text-xl transition-all shadow-lg shadow-blue-900/50">
              <Users className="w-6 h-6" /> 학생 부서 접속
            </button>
            <button onClick={() => setRole('teacher')} className="group flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 text-white p-5 rounded-2xl font-bold text-xl transition-all border border-slate-700">
              <Monitor className="w-6 h-6" /> 교사 중앙 관제소 (TV)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. SELECT TEAM (STUDENT)
  if (role === 'select_team') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="max-w-xl w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold">부서 로그인</h2>
            <p className="text-slate-400 mt-2">사전 미션에서 배정받은 부서를 선택하세요.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((num) => {
              const DeptIcon = DEPARTMENTS[num].icon;
              return (
                <button key={num} onClick={() => handleTeamSelect(num)} className="bg-slate-900 hover:bg-blue-600 border border-slate-800 hover:border-blue-500 p-6 rounded-2xl transition-all flex flex-col items-center gap-3 text-center group">
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
          <button onClick={() => setRole(null)} className="w-full text-slate-500 hover:text-white mt-8">← 뒤로 가기</button>
        </div>
      </div>
    );
  }

  // 3. TEACHER DASHBOARD
  if (role === 'teacher') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
        <div className="max-w-6xl mx-auto space-y-8">

          <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-800 pb-6 gap-4">
            <div>
              <h1 className="text-3xl font-black flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                <Monitor className="text-blue-500" /> NASA 중앙 관제 대시보드
              </h1>
              <p className="text-slate-400 mt-2">버튼을 클릭하여 반 전체 학생의 기기 화면을 강제로 동기화시킵니다.</p>
            </div>
            <div className="flex gap-4">
              <button onClick={handleResetProgress} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-slate-300 border border-slate-700 hover:bg-red-900 hover:text-white rounded-lg transition-colors">
                <RefreshCw className="w-4 h-4" /> 초기화
              </button>
              <button onClick={() => setRole(null)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                나가기
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-6 text-slate-300">위상 제어 시스템 (Phase Control)</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { phase: 1, label: '[개별 퍼즐] 1단계 지구 궤도 돌파', activeColor: 'bg-blue-900/40 border-blue-500 text-blue-300' },
                { phase: 2, label: '[위기 발동] 산소 탱크 폭발', activeColor: 'bg-red-900/40 border-red-500 text-red-300' },
                { phase: 3, label: '[오프라인] 달 탐사 보물찾기', activeColor: 'bg-purple-900/40 border-purple-500 text-purple-300' },
                { phase: 4, label: '[귀환 성공] 글로벌 엔딩 송출', activeColor: 'bg-emerald-900/40 border-emerald-500 text-emerald-300' },
              ].map(({ phase, label, activeColor }) => (
                <button key={phase} onClick={() => setTeacherGlobalPhase(phase)}
                  className={`p-4 rounded-xl border-2 text-left font-bold transition-all ${globalPhase === phase ? activeColor : 'bg-slate-800 border-transparent text-slate-400 hover:bg-slate-700'}`}>
                  <div className="text-sm font-normal mb-1">Phase {phase}</div>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* [FIX 3] form → div + onClick */}
          {globalPhase === 3 && (
            <div className="bg-emerald-950/40 border-2 border-emerald-500/50 rounded-3xl p-8 mb-8 text-center shadow-2xl shadow-emerald-900/20">
              <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-3xl font-black text-emerald-400 mb-2">최종 귀환 승인 시스템</h2>
              <p className="text-emerald-200/80 mb-6 text-lg">모든 부서가 학급에서 찾은 단서들을 하나로 모아 만든 <strong className="text-white">최종 코드</strong>를 입력하세요.</p>
              <div className="max-w-xl mx-auto flex gap-4">
                <input
                  type="text"
                  value={finalCodeInput}
                  onChange={(e) => setFinalCodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFinalCodeSubmit()}
                  placeholder="단서 조합 최종 코드 입력"
                  className="flex-1 bg-slate-900 border border-emerald-800 rounded-xl px-6 py-4 text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase tracking-widest text-center"
                />
                <button onClick={handleFinalCodeSubmit} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-4 rounded-xl transition-all text-xl whitespace-nowrap">
                  승인 및 귀환
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {[1, 2, 3, 4, 5, 6].map((teamId) => {
              const teamData = teamsData[`team_${teamId}`] || {};
              const s1Solved = teamData.stage1_solved;
              const s3Solved = teamData.stage3_solved;
              const DeptIcon = DEPARTMENTS[teamId].icon;
              return (
                <div key={teamId} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
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
    );
  }

  // 4. STUDENT UI
  if (role === 'student') {
    const teamRecord = teamsData[`team_${teamNumber}`] || {};
    const deptInfo = DEPARTMENTS[teamNumber];
    const DeptIcon = deptInfo.icon;

    // PHASE 4: GLOBAL SUCCESS
    // [FIX 4] animate-in/fade-in/zoom-in → Tailwind 기본 클래스(opacity, scale transition)로 교체
    if (globalPhase === 4) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-xl w-full space-y-8">
            <div className="relative">
              <ShieldCheck className="w-40 h-40 text-emerald-400 mx-auto animate-bounce relative z-10" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl"></div>
            </div>
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400 leading-tight">
              MISSION SUCCESS<br/>WE ARE GOING HOME
            </h1>
            <p className="text-xl text-slate-300 font-medium">
              모든 부서의 완벽한 협동으로 달 탐사를 무사히 마치고<br/>지구로 무사 귀환했습니다!
            </p>
          </div>
        </div>
      );
    }

    // PHASE 2: PENALTY CRISIS
    if (globalPhase === 2) {
      return (
        <div className="min-h-screen bg-red-950 text-red-100 flex flex-col items-center justify-center p-6 text-center border-[12px] border-red-600 animate-pulse">
          <div className="max-w-lg w-full space-y-6">
            <AlertTriangle className="w-32 h-32 text-red-500 mx-auto" />
            <h1 className="text-4xl font-black tracking-widest text-white">CRITICAL ERROR</h1>
            <h2 className="text-2xl font-bold text-red-400">산소 탱크 폭발! 통신 두절</h2>
            <div className="bg-black/40 p-6 rounded-2xl border border-red-800 mt-8">
              <p className="text-lg leading-relaxed text-red-200">
                우주선 궤도에 치명적인 문제가 발생했습니다.<br/><br/>
                <strong>지시사항:</strong> 즉시 패드에서 손을 떼고 선생님(휴스턴 관제센터)의 오프라인 단체 미션 지시에 따르십시오.<br/>
                모든 부서가 힘을 합쳐 미션을 통과해야만 통신이 복구됩니다.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Common Puzzle Renderer for Phase 1 & 3
    const renderPuzzle = (puzzleData, isSolved, stageKey) => {
      if (isSolved) {
        if (stageKey === 'stage1_solved') {
          const fact = SPACE_FACTS[factIndex];
          return (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
              <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-slate-200 mb-2">1단계 암호 해독 완료</h2>
              <p className="text-slate-400 mb-8">다른 부서가 궤도를 돌파할 때까지 대기해 주십시오.</p>
              <div className="bg-slate-950 border border-blue-900/30 rounded-2xl p-6 text-left relative overflow-hidden transition-all duration-500">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm uppercase mb-3">
                  <Info className="w-4 h-4" /> NASA 우주 상식 DB
                </div>
                <h3 className="text-xl font-bold text-slate-200 mb-2">{fact.title}</h3>
                <p className="text-slate-400 leading-relaxed">{fact.content}</p>
              </div>
            </div>
          );
        } else {
          // Phase 3 solved → locationHint + final code input
          return (
            <div className="bg-purple-950/30 border border-purple-900 rounded-3xl p-6 md:p-8 shadow-2xl text-center">
              <Map className="w-20 h-20 text-purple-400 mx-auto mb-6 animate-bounce" />
              <h2 className="text-3xl font-black text-purple-300 mb-4">단서 추적 성공!</h2>
              <div className="bg-black/40 border border-purple-500/30 rounded-2xl p-6 mb-8">
                <span className="block text-sm text-purple-400 font-bold mb-2">목표 위치</span>
                <strong className="text-2xl text-white break-keep leading-snug">{puzzleData.locationHint}</strong>
              </div>

              {/* [FIX 3] form → div + onClick + onKeyDown */}
              <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
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
                    className="flex-1 bg-slate-900 border border-emerald-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase tracking-widest text-center sm:text-left"
                  />
                  <button onClick={handleFinalCodeSubmit} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl transition-all whitespace-nowrap">
                    귀환 승인
                  </button>
                </div>
              </div>
            </div>
          );
        }
      }

      // Active Puzzle
      return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
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
              {puzzleData.clues.map((clue, idx) => {
                if (!clue) return null;
                return (
                  <li key={idx} className="flex gap-3 text-slate-300 font-medium break-keep leading-snug">
                    <span className="text-blue-500 mt-0.5">›</span> {clue}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* [FIX 3] form → div + onClick + onKeyDown */}
          <div className="space-y-4">
            <div>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePuzzleSubmit(puzzleData, stageKey)}
                placeholder="해독된 코드를 입력하세요"
                className={`w-full bg-slate-950 border ${errorMsg ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-blue-500'} rounded-xl px-5 py-4 text-lg text-white focus:outline-none focus:ring-2 transition-all text-center uppercase tracking-widest`}
              />
            </div>

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

    // PHASE 1 & 3: RENDER STUDENT SCREEN
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 flex flex-col items-center justify-center">
        <div className="max-w-xl w-full">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-slate-800 p-2 rounded-lg text-blue-400">
                <DeptIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-500">[{globalPhase === 1 ? '1단계 궤도 돌파' : '3단계 달 탐사'}]</div>
                <div className="font-bold text-lg">{teamNumber}조 {deptInfo.name}</div>
              </div>
            </div>
            <div className="flex gap-1">
              <div className={`h-2 w-8 rounded-full ${globalPhase >= 1 ? 'bg-blue-500' : 'bg-slate-800'}`}></div>
              <div className={`h-2 w-8 rounded-full ${globalPhase >= 2 ? 'bg-red-500' : 'bg-slate-800'}`}></div>
              <div className={`h-2 w-8 rounded-full ${globalPhase >= 3 ? 'bg-purple-500' : 'bg-slate-800'}`}></div>
            </div>
          </div>

          {globalPhase === 1 && renderPuzzle(deptInfo.stage1, teamRecord.stage1_solved, 'stage1_solved')}
          {globalPhase === 3 && renderPuzzle(deptInfo.stage3, teamRecord.stage3_solved, 'stage3_solved')}
        </div>
      </div>
    );
  }

  return null;
}
