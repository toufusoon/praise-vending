import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, onSnapshot, doc, updateDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase';
import { FaCog, FaSearch, FaRandom, FaQuestionCircle, FaMusic, FaPause } from 'react-icons/fa';

// Removed MonetBackground component

export default function Home() {
  const navigate = useNavigate();
  const [praises, setPraises] = useState([]);
  const [selectedCan, setSelectedCan] = useState(null);
  const [user, setUser] = useState(null);
  
  // New States
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCategory, setSearchCategory] = useState('all'); // 'all' | 'title' | 'from' | 'to'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'likes'
  const [showGuide, setShowGuide] = useState(false);
  const [poppingCan, setPoppingCan] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Web Audio API for sound effects
  const playSound = (type) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      if (type === 'clunk') {
        // Slot machine tick sound (rapid metallic clicks)
        for(let i=0; i<15; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = 800 + (Math.random() * 200);
          gain.gain.setValueAtTime(0, ctx.currentTime + i*0.06);
          gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i*0.06 + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i*0.06 + 0.05);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i*0.06);
          osc.stop(ctx.currentTime + i*0.06 + 0.05);
        }
      } else if (type === 'pop') {
        // Slot machine WIN sound (Ding ding ding!)
        [0, 0.15, 0.3].forEach((delay, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = 880 + (i * 110); // A5, B5, C#6
          gain.gain.setValueAtTime(0, ctx.currentTime + delay);
          gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + delay + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.3);
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCanClick = (praise) => {
    playSound('clunk');
    setPoppingCan(praise);
    setTimeout(() => {
      playSound('pop');
      setTimeout(() => {
        setPoppingCan(null);
        setSelectedCan(praise);
      }, 500); // Wait for pop explosion animation to finish
    }, 1000); // 1s shaking animation
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      const studentSession = JSON.parse(localStorage.getItem('studentSession'));
      if (currentUser) {
        setUser({ uid: currentUser.uid, email: currentUser.email, role: 'teacher' });
      } else if (studentSession) {
        setUser(studentSession);
      } else {
        setUser(null);
      }
    });

    const q = query(collection(db, 'praises'), where('status', '==', 'approved'));
    const unsubscribeDb = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPraises(data);
    });
    
    return () => {
      unsubscribeAuth();
      unsubscribeDb();
    };
  }, []);

  const handleLike = async (id) => {
    if (!user) {
      alert('공감하시려면 로그인이 필요합니다!');
      return;
    }

    try {
      const docRef = doc(db, 'praises', id);
      const isLiked = selectedCan.likedBy && selectedCan.likedBy.includes(user.uid);

      if (isLiked) {
        // 취소
        await updateDoc(docRef, { 
          likes: increment(-1),
          likedBy: arrayRemove(user.uid)
        });
        setSelectedCan(prev => prev ? {
          ...prev, 
          likes: Math.max(0, (prev.likes || 0) - 1),
          likedBy: prev.likedBy.filter(uid => uid !== user.uid)
        } : null);
      } else {
        // 공감
        await updateDoc(docRef, { 
          likes: increment(1),
          likedBy: arrayUnion(user.uid)
        });
        setSelectedCan(prev => prev ? {
          ...prev, 
          likes: (prev.likes || 0) + 1,
          likedBy: [...(prev.likedBy || []), user.uid]
        } : null);
      }
    } catch (error) {
      console.error("공감 토글 실패:", error);
    }
  };

  const handleRandomPick = () => {
    if (praises.length === 0) return alert('아직 칭찬 캔이 없습니다!');
    const randomIndex = Math.floor(Math.random() * praises.length);
    handleCanClick(praises[randomIndex]);
  };

  // 1. Filter by search
  let filteredPraises = praises.filter(p => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    
    if (searchCategory === 'title') {
      return (p.title && p.title.toLowerCase().includes(term));
    } else if (searchCategory === 'from') {
      return (p.from && p.from.toLowerCase().includes(term));
    } else if (searchCategory === 'to') {
      return (p.to && p.to.toLowerCase().includes(term));
    } else {
      // 'all'
      return (
        (p.title && p.title.toLowerCase().includes(term)) ||
        (p.to && p.to.toLowerCase().includes(term)) ||
        (p.from && p.from.toLowerCase().includes(term)) ||
        (p.behavior && p.behavior.toLowerCase().includes(term))
      );
    }
  });

  // 2. Sort
  filteredPraises.sort((a, b) => {
    if (sortBy === 'newest') return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    if (sortBy === 'oldest') return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
    if (sortBy === 'likes') return (b.likes || 0) - (a.likes || 0);
    return 0;
  });

  // 3. Split into 3 shelves and prevent adjacent duplicate themes
  const shelves = [[], [], []];
  const prevThemes = [null, null, null];
  const allThemes = ['coke', 'pepsi', 'sprite', 'fanta', 'coffee'];

  filteredPraises.forEach((praise, i) => {
    const shelfIndex = i % 3;
    let displayTheme = praise.theme;
    
    if (!displayTheme || displayTheme === prevThemes[shelfIndex]) {
      const available = allThemes.filter(t => t !== prevThemes[shelfIndex]);
      displayTheme = available[i % available.length];
    }
    prevThemes[shelfIndex] = displayTheme;
    
    shelves[shelfIndex].push({ ...praise, displayTheme });
  });

  const topPraise = [...praises].sort((a, b) => (b.likes || 0) - (a.likes || 0))[0];

  return (
    <div className="container animate-slide-up" style={{ position: 'relative' }}>
      
      {/* Top Buttons: Teacher Menu & Usage Guide & BGM */}
      <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => {
            const audio = document.getElementById('bgm-audio');
            if (isPlaying) {
              audio.pause();
            } else {
              audio.play();
            }
            setIsPlaying(!isPlaying);
          }}
          style={{ 
            background: isPlaying ? '#FF6B6B' : '#4CAF50', color: 'white', 
            padding: '10px 15px', borderRadius: 'var(--radius-pill)',
            fontWeight: 'bold', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          {isPlaying ? <FaPause /> : <FaMusic />} {isPlaying ? 'BGM 끄기' : 'BGM 켜기'}
        </button>
        <button 
          onClick={() => setShowGuide(true)}
          style={{ 
            background: '#FFD700', color: '#000', 
            padding: '10px 15px', borderRadius: 'var(--radius-pill)',
            fontWeight: 'bold', border: '2px solid #B8860B', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <FaQuestionCircle /> 사용방법
        </button>
        <button 
          onClick={() => navigate('/login')}
          style={{ 
            background: 'rgba(255,255,255,0.7)', 
            padding: '10px 15px', borderRadius: 'var(--radius-pill)',
            display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <FaCog /> 교사/학생 메뉴
        </button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#2b5e4b', textShadow: '2px 2px 4px rgba(255,255,255,0.8)', margin: '0 0 10px 0' }}>
          🌸 뿅뿅 미담 자판기 🌸
        </h1>
        <p style={{ color: '#4a7c59', fontWeight: 'bold' }}>따뜻한 마음을 뽑아보세요!</p>
      </div>

      {/* Toolbar: Search, Sort, Random */}
      <div style={{ 
        display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px', 
        justifyContent: 'center', background: 'rgba(255,255,255,0.8)', 
        padding: '15px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '20px', padding: '5px 15px', border: '1px solid #ddd' }}>
          <select 
            value={searchCategory}
            onChange={(e) => setSearchCategory(e.target.value)}
            style={{ border: 'none', outline: 'none', background: 'transparent', fontWeight: 'bold', color: '#555', marginRight: '5px' }}
          >
            <option value="all">통합검색</option>
            <option value="title">제목</option>
            <option value="from">글쓴이</option>
            <option value="to">받는사람</option>
          </select>
          <div style={{ width: '1px', height: '15px', background: '#ddd', margin: '0 5px' }}></div>
          <FaSearch color="#999" style={{ marginLeft: '5px' }} />
          <input 
            type="text" 
            placeholder="검색어 입력..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', outline: 'none', marginLeft: '10px', width: '120px' }}
          />
        </div>
        
        <select 
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ padding: '8px 15px', borderRadius: '20px', border: '1px solid #ddd', outline: 'none' }}
        >
          <option value="newest">✨ 최신순</option>
          <option value="likes">❤️ 공감순</option>
          <option value="oldest">🕰️ 오래된순</option>
        </select>

        <button 
          onClick={handleRandomPick}
          style={{ 
            background: 'var(--gradient-secondary)', color: 'white', 
            padding: '8px 20px', borderRadius: '20px', fontWeight: 'bold',
            display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer'
          }}
        >
          <FaRandom /> 랜덤 뽑기
        </button>
      </div>

      <div className="vending-machine">
        
        {/* Top Voted inside Vending Machine */}
        {topPraise && topPraise.likes > 0 && (
          <div style={{ 
            background: 'white', 
            padding: '10px', 
            borderRadius: '10px',
            marginBottom: '15px',
            textAlign: 'center',
            boxShadow: 'inset 0 0 5px rgba(0,0,0,0.2)',
            marginTop: '10px',
            zIndex: 10
          }}>
            <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: 'bold' }}>⭐ 베스트 미담</span>
            <div style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>To. {topPraise.to}</div>
          </div>
        )}

        {/* Display Area (Shelves) */}
        <div className="vending-display" style={{ overflow: 'hidden' }}>
          {filteredPraises.length === 0 ? (
             <div style={{ textAlign: 'center', color: '#555', paddingTop: '100px', zIndex: 5 }}>
               미담 캔이 없습니다.
             </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {shelves.map((shelf, index) => {
                if (shelf.length === 0) return <div key={index} style={{height:'110px'}}></div>;
                
                // Duplicate items to ensure enough width for seamless marquee
                const repeatCount = Math.max(1, Math.ceil(10 / shelf.length));
                const repeatedShelf = Array(repeatCount).fill(shelf).flat();

                return (
                  <div key={index} className="vending-shelf-container">
                    <div className={`marquee-container ${index === 1 ? 'reverse' : ''}`}>
                      <div className="marquee-content">
                        {repeatedShelf.map((praise, idx) => (
                          <motion.div
                            key={`${praise.id}-${idx}`}
                            whileHover={{ scale: 1.1, y: -5 }}
                            onClick={() => handleCanClick(praise)}
                            className={`fat-can theme-${praise.displayTheme}`}
                          >
                            <div className="can-deco"></div>
                            <div className="can-label">{praise.title || praise.to}</div>
                          </motion.div>
                        ))}
                      </div>
                      <div className="marquee-content">
                        {repeatedShelf.map((praise, idx) => (
                          <motion.div
                            key={`copy-${praise.id}-${idx}`}
                            whileHover={{ scale: 1.1, y: -5 }}
                            onClick={() => handleCanClick(praise)}
                            className={`fat-can theme-${praise.displayTheme}`}
                          >
                            <div className="can-deco"></div>
                            <div className="can-label">{praise.title || praise.to}</div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Lower Controls & Output */}
        <div className="vending-lower">
          <div className="vending-ad">
            PRAISE
          </div>
          
          <div className="vending-panel">
            <div className="digital-display">
              {String(praises.length).padStart(4, '0')}
            </div>
            
            <button 
              onClick={() => navigate('/write')}
              style={{ 
                background: '#FFD700', color: '#000', 
                padding: '8px', borderRadius: '5px', 
                fontWeight: 'bold', width: '100%',
                marginTop: '15px', border: '2px solid #B8860B',
                cursor: 'pointer'
              }}
            >
              미담 작성
            </button>
          </div>
        </div>

        <div className="output-container">
          <div className="output-slot">
            <div className="output-flap"></div>
          </div>
        </div>
      </div>

        {/* Popping Animation Overlay */}
        <AnimatePresence>
          {poppingCan && (
            <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.8)', zIndex: 10000 }}>
              <motion.div
                initial={{ scale: 0.5, y: 100, rotate: -10 }}
                animate={{ 
                  scale: [0.8, 1, 1.2, 1.5, 3], 
                  y: [0, -20, 20, -10, 0], 
                  rotate: [0, -15, 15, -20, 20, 0],
                  opacity: [1, 1, 1, 1, 0]
                }}
                transition={{ duration: 1.5, times: [0, 0.3, 0.6, 0.8, 1] }}
                className={`fat-can ${poppingCan.theme ? 'theme-' + poppingCan.theme : 'theme-default'}`}
                style={{ width: '100px', height: '170px' }} // Bigger can for animation
              >
                <div className="can-deco"></div>
                <div className="can-label" style={{ fontSize: '1.2rem' }}>{poppingCan.title || poppingCan.to}</div>
              </motion.div>
              
              {/* Explosion Particles */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 2, 4] }}
                transition={{ duration: 0.5, delay: 1 }}
                style={{
                  position: 'absolute',
                  width: '100px', height: '100px',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)',
                  borderRadius: '50%',
                  pointerEvents: 'none'
                }}
              />
            </div>
          )}
        </AnimatePresence>

        {/* Selected Can Modal */}
      <AnimatePresence>
        {selectedCan && (
          <div 
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', zIndex: 1000,
              display: 'flex', justifyContent: 'center', alignItems: 'center'
            }}
            onClick={() => setSelectedCan(null)}
          >
            <motion.div
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white',
                padding: '40px',
                borderRadius: 'var(--radius-lg)',
                maxWidth: '500px',
                width: '90%',
                boxShadow: 'var(--shadow-lg)',
                position: 'relative'
              }}
            >
              <button 
                onClick={() => setSelectedCan(null)}
                style={{ position: 'absolute', top: '15px', right: '20px', fontSize: '1.5rem', color: '#999', background:'none', border:'none', cursor:'pointer' }}
              >
                ✕
              </button>
              <div className={`fat-can ${selectedCan.theme ? 'theme-' + selectedCan.theme : 'theme-default'}`} style={{ 
                margin: '0 auto 20px', transform: 'scale(1.2)' 
              }}>
                <div className="can-deco"></div>
                <div className="can-label">{selectedCan.title || selectedCan.to}</div>
              </div>
              
              <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>{selectedCan.title || `To. ${selectedCan.to}`}</h2>
              <h3 style={{ textAlign: 'center', color: 'var(--color-primary)', marginBottom: '20px' }}>
                To. {selectedCan.to} <br />
                <span style={{ fontSize: '0.9rem', color: '#666' }}>"{selectedCan.behavior}"</span>
              </h3>
              <p style={{ textAlign: 'center', fontSize: '1.1rem', marginBottom: '20px', lineHeight: '1.6' }}>
                {selectedCan.message}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>From. {selectedCan.from}</span>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleLike(selectedCan.id)}
                  style={{ 
                    background: 'var(--color-background)', 
                    padding: '8px 16px', 
                    borderRadius: '20px',
                    fontWeight: 'bold', border:'none', cursor:'pointer',
                    display: 'flex', alignItems: 'center', gap: '5px'
                  }}
                >
                  ❤️ {selectedCan.likes || 0} 공감하기
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Usage Guide Modal */}
        {showGuide && (
          <div 
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', zIndex: 1000,
              display: 'flex', justifyContent: 'center', alignItems: 'center'
            }}
            onClick={() => setShowGuide(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white', padding: '30px', borderRadius: 'var(--radius-lg)',
                maxWidth: '500px', width: '90%', position: 'relative'
              }}
            >
              <h2 style={{ color: 'var(--color-primary-dark)', marginBottom: '20px', textAlign: 'center' }}>
                💡 사용 방법 안내
              </h2>
              <ul style={{ lineHeight: '2', color: '#444' }}>
                <li><strong>칭찬 캔 보기:</strong> 자판기 안을 굴러다니는 캔을 클릭하면 친구가 받은 칭찬을 볼 수 있어요!</li>
                <li><strong>공감하기:</strong> 칭찬을 읽고 동의한다면 하트(❤️) 버튼을 꾹 눌러주세요.</li>
                <li><strong>미담 작성:</strong> '미담 작성' 버튼을 눌러 친구의 착한 행동을 칭찬해주세요. (선생님 승인 후 자판기에 들어갑니다.)</li>
                <li><strong>랜덤 뽑기:</strong> 상단의 '랜덤 뽑기' 버튼을 누르면 어떤 칭찬이 나올지 기대해보세요!</li>
              </ul>
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button 
                  onClick={() => setShowGuide(false)}
                  style={{ background: 'var(--color-secondary)', color: 'white', padding: '10px 30px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  이해했어요!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <audio id="bgm-audio" loop>
        <source src="/bgm.mp3" type="audio/mpeg" />
      </audio>
    </div>
  );
}
