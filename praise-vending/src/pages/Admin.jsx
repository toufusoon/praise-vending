import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase';

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved' | 'students'
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');

  const fetchPraises = async () => {
    try {
      const qPending = query(collection(db, 'praises'), where('status', '==', 'pending'));
      const qApproved = query(collection(db, 'praises'), where('status', '==', 'approved'));
      
      const [snapPending, snapApproved] = await Promise.all([getDocs(qPending), getDocs(qApproved)]);
      
      setPending(snapPending.docs.map(doc => ({ id: doc.id, ...doc.data(), date: doc.data().createdAt?.toDate().toLocaleDateString() || '방금 전' })));
      setApproved(snapApproved.docs.map(doc => ({ id: doc.id, ...doc.data(), date: doc.data().createdAt?.toDate().toLocaleDateString() || '방금 전' })));
    } catch (error) {
      console.error("미담 불러오기 실패:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      const q = query(collection(db, 'students'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => a.name.localeCompare(b.name));
      setStudents(data);
    } catch (error) {
      console.error("학생 목록 불러오기 실패:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === 'teacher@school.com') {
        setIsAuthorized(true);
        Promise.all([fetchPraises(), fetchStudents()]).finally(() => setLoading(false));
      } else {
        alert('선생님만 접근할 수 있는 페이지입니다.');
        navigate('/home');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleAction = async (id, actionType) => {
    try {
      const docRef = doc(db, 'praises', id);
      if (actionType === 'approve') {
        await updateDoc(docRef, { status: 'approved' });
        fetchPraises(); // 새로고침
      } else if (actionType === 'reject' || actionType === 'delete') {
        if (window.confirm('정말 이 미담을 삭제하시겠습니까?')) {
          await deleteDoc(docRef);
          fetchPraises(); // 새로고침
        }
      }
    } catch (error) {
      console.error("처리 실패:", error);
      alert('처리 중 오류가 발생했습니다.');
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newStudentName || !newStudentPassword) return alert('이름과 비밀번호를 모두 입력해주세요.');
    if (!/^\d+$/.test(newStudentPassword)) return alert('비밀번호는 숫자로만 입력해주세요.');
    if (students.find(s => s.name === newStudentName)) return alert('이미 존재하는 학생 이름입니다.');

    try {
      const docRef = await addDoc(collection(db, 'students'), { name: newStudentName, password: newStudentPassword });
      setStudents([...students, { id: docRef.id, name: newStudentName, password: newStudentPassword }].sort((a,b) => a.name.localeCompare(b.name)));
      setNewStudentName(''); setNewStudentPassword('');
      alert('학생이 추가되었습니다.');
    } catch (error) {
      console.error(error);
      alert('추가 실패');
    }
  };

  const handleDeleteStudent = async (id, name) => {
    if (!window.confirm(`정말 ${name} 학생을 삭제하시겠습니까?`)) return;
    try {
      await deleteDoc(doc(db, 'students', id));
      setStudents(students.filter(s => s.id !== id));
    } catch (error) {
      console.error(error);
      alert('삭제 실패');
    }
  };

  if (!isAuthorized) return null;

  return (
    <div className="container animate-slide-up" style={{ marginTop: '40px', paddingBottom: '100px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: 'var(--color-primary-dark)', margin: 0 }}>👩‍🏫 교사 관리자</h2>
        <button onClick={() => navigate('/')} style={{ background: '#eee', padding: '8px 16px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer' }}>
          자판기로 돌아가기
        </button>
      </header>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <button 
          onClick={() => setActiveTab('pending')}
          style={{ flex: 1, padding: '15px', borderRadius: 'var(--radius-md)', fontWeight: 'bold', border: 'none', cursor: 'pointer', background: activeTab === 'pending' ? 'var(--color-primary-dark)' : '#e9ecef', color: activeTab === 'pending' ? 'white' : '#495057' }}
        >
          대기 중 ({pending.length})
        </button>
        <button 
          onClick={() => setActiveTab('approved')}
          style={{ flex: 1, padding: '15px', borderRadius: 'var(--radius-md)', fontWeight: 'bold', border: 'none', cursor: 'pointer', background: activeTab === 'approved' ? 'var(--color-primary-dark)' : '#e9ecef', color: activeTab === 'approved' ? 'white' : '#495057' }}
        >
          승인 완료 ({approved.length})
        </button>
        <button 
          onClick={() => setActiveTab('students')}
          style={{ flex: 1, padding: '15px', borderRadius: 'var(--radius-md)', fontWeight: 'bold', border: 'none', cursor: 'pointer', background: activeTab === 'students' ? 'var(--color-primary-dark)' : '#e9ecef', color: activeTab === 'students' ? 'white' : '#495057' }}
        >
          학생 관리 ({students.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>로딩 중...</div>
      ) : activeTab === 'pending' ? (
        <div style={{ display: 'grid', gap: '20px' }}>
          {pending.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px', color: 'var(--color-text-muted)', background: 'white', borderRadius: 'var(--radius-lg)' }}>대기 중인 미담이 없습니다.</div>
          ) : (
            pending.map(praise => (
              <div key={praise.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}><span>From. {praise.from} → To. {praise.to}</span><span>{praise.date}</span></div>
                <div><strong>제목:</strong> {praise.title || praise.behavior}</div>
                <div><strong>행동:</strong> {praise.behavior}</div>
                <div><strong>한마디:</strong> {praise.message}</div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button onClick={() => handleAction(praise.id, 'approve')} style={{ flex: 1, background: 'var(--color-secondary)', color: 'white', padding: '10px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>✅ 승인 (자판기 표시)</button>
                  <button onClick={() => handleAction(praise.id, 'reject')} style={{ flex: 1, background: '#FF6B6B', color: 'white', padding: '10px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>🚫 거절 및 삭제</button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : activeTab === 'approved' ? (
        <div style={{ display: 'grid', gap: '20px' }}>
          {approved.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px', color: 'var(--color-text-muted)', background: 'white', borderRadius: 'var(--radius-lg)' }}>승인된 미담이 없습니다.</div>
          ) : (
            approved.map(praise => (
              <div key={praise.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}><span>From. {praise.from} → To. {praise.to}</span><span>{praise.date}</span></div>
                <div><strong>제목:</strong> {praise.title || praise.behavior}</div>
                <div><strong>행동:</strong> {praise.behavior}</div>
                <div><strong>한마디:</strong> {praise.message}</div>
                {praise.likedBy && praise.likedBy.length > 0 && (
                  <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '5px', fontSize: '0.85rem' }}>
                    <strong>❤️ 공감한 사람:</strong> {praise.likedBy.map(uid => students.find(s => s.id === uid)?.name || '학생').join(', ')}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button onClick={() => handleAction(praise.id, 'delete')} style={{ flex: 1, background: '#FF6B6B', color: 'white', padding: '10px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>🗑️ 자판기에서 삭제</button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <form onSubmit={handleAddStudent} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
            <input type="text" placeholder="이름 (예: 홍길동)" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid #ddd' }} />
            <input type="text" placeholder="비밀번호 (숫자)" value={newStudentPassword} onChange={(e) => setNewStudentPassword(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid #ddd' }} />
            <button type="submit" style={{ background: 'var(--color-secondary)', color: 'white', padding: '0 20px', borderRadius: 'var(--radius-sm)', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>추가</button>
          </form>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '10px' }}>
            {students.map(student => (
              <li key={student.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa', padding: '10px 15px', borderRadius: 'var(--radius-sm)' }}>
                <div><span style={{ fontWeight: 'bold', marginRight: '15px' }}>{student.name}</span><span style={{ color: '#666', fontSize: '0.9rem' }}>비밀번호: {student.password}</span></div>
                <button onClick={() => handleDeleteStudent(student.id, student.name)} style={{ background: '#FF6B6B', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', padding: '5px 10px', cursor: 'pointer', fontSize: '0.8rem' }}>삭제</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
