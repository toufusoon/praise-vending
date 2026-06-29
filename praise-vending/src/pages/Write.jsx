import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase';

export default function Write() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: '', to: '', behavior: '', message: '', from: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      const studentSession = JSON.parse(localStorage.getItem('studentSession'));
      if (currentUser) {
        setUser(currentUser);
        const nickname = currentUser.email ? currentUser.email.split('@')[0] : '익명';
        setFormData(prev => ({ ...prev, from: nickname }));
      } else if (studentSession) {
        setUser(studentSession);
        setFormData(prev => ({ ...prev, from: studentSession.name }));
      } else {
        alert('로그인이 필요합니다!');
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const themes = ['coke', 'pepsi', 'sprite', 'fanta', 'coffee', 'grape', 'lemon', 'melon', 'water', 'choco', 'milk', 'strawberry', 'banana'];
      const randomTheme = themes[Math.floor(Math.random() * themes.length)];
      
      await addDoc(collection(db, 'praises'), {
        title: formData.title,
        to: formData.to,
        from: formData.from || '익명',
        behavior: formData.behavior,
        message: formData.message,
        status: 'pending',
        likes: 0,
        createdAt: serverTimestamp(),
        theme: randomTheme,
        uid: user?.uid
      });
      alert('미담이 성공적으로 제출되었습니다! 선생님의 승인을 기다려주세요.');
      navigate('/home');
    } catch (error) {
      console.error("미담 작성 에러:", error);
      alert('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return <div style={{textAlign: 'center', marginTop: '50px'}}>로딩 중...</div>;

  return (
    <div className="container animate-slide-up" style={{ maxWidth: '600px', marginTop: '40px' }}>
      <button 
        onClick={() => navigate('/home')}
        style={{ marginBottom: '20px', color: '#fff', fontSize: '1.2rem', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
      >
        ← 뒤로가기
      </button>
      
      <div className="glass-panel" style={{ padding: '40px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: 'var(--color-primary-dark)' }}>
          💌 칭찬 배달부
        </h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>내 닉네임</label>
            <input 
              type="text" 
              value={formData.from}
              disabled
              style={{
                width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)',
                border: '1px solid #ddd', background: '#f5f5f5', outline: 'none', fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>글 제목</label>
            <input 
              type="text" 
              placeholder="예: 친절한 배려에 감사해요!"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              style={{
                width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)',
                border: '1px solid #ddd', outline: 'none', fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>누구에게 칭찬할까요?</label>
            <input 
              type="text" 
              placeholder="예: 우리 반 친구 이름"
              required
              value={formData.to}
              onChange={(e) => setFormData({...formData, to: e.target.value})}
              style={{
                width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)',
                border: '1px solid #ddd', outline: 'none', fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>어떤 착한 행동을 했나요? (한 줄 요약)</label>
            <input 
              type="text" 
              placeholder="예: 무거운 짐을 들어줌"
              required
              value={formData.behavior}
              onChange={(e) => setFormData({...formData, behavior: e.target.value})}
              style={{
                width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)',
                border: '1px solid #ddd', outline: 'none', fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>따뜻한 한마디 남기기</label>
            <textarea 
              placeholder="친구에게 전하고 싶은 말을 적어주세요."
              required
              rows="4"
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              style={{
                width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)',
                border: '1px solid #ddd', outline: 'none', fontSize: '1rem', resize: 'vertical'
              }}
            />
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            style={{ 
              background: 'var(--gradient-primary)', 
              color: 'white', 
              padding: '15px', 
              borderRadius: 'var(--radius-pill)',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              marginTop: '10px',
              boxShadow: 'var(--shadow-md)',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? '전송 중...' : '자판기에 넣기 🚀'}
          </motion.button>
        </form>
      </div>
    </div>
  );
}
