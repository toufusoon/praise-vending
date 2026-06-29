import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Footer() {
  const [modalContent, setModalContent] = useState(null); // 'terms' | 'privacy' | null

  const termsText = `
## 제1조 (목적)
본 약관은 학급 내 긍정적이고 따뜻한 문화를 만들기 위해 운영되는 뿅뿅 미담 자판기(이하 '서비스')의 이용 조건 및 절차, 이용자와 교사(관리자)의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.

## 제2조 (이용 대상 및 가입)
1. 본 서비스는 해당 학급의 소속 학생 및 교사만 이용할 수 있습니다.
2. 학생은 자신의 실제 이름(닉네임)과 비밀번호를 설정하여 서비스에 가입(로그인)해야 하며, 타인의 이름을 사칭해서는 안 됩니다.

## 제3조 (서비스의 내용)
서비스는 다음과 같은 기능을 제공합니다.
1. 친구의 선행과 따뜻한 행동을 칭찬하는 '미담 캔' 작성 기능
2. 작성된 미담을 메인 화면에 캔 음료 모양으로 전시하는 기능
3. 다른 친구의 미담을 읽고 공감(❤️)을 표현하는 기능
4. 교사가 작성된 미담을 확인하고 승인 및 관리하는 검수 기능

## 제4조 (이용자의 의무)
이용자는 즐겁고 안전한 서비스 이용을 위해 다음 사항을 준수해야 합니다.
1. 미담 작성 시 거짓 없이 진실된 내용만 작성합니다.
2. 욕설, 비방, 장난, 또는 타인에게 상처를 줄 수 있는 내용은 절대 작성하지 않습니다.
3. 서비스 이용 시 최초 화면에서 안내되는 '윤리 핵심가이드'를 준수하고 실천합니다.
4. 타인의 비밀번호를 도용하거나 다른 사람인 척 행동하지 않습니다.
5. 본 약관을 위반할 경우, 담임 교사의 판단에 따라 작성된 글이 삭제되거나 서비스 이용이 제한될 수 있습니다.

## 제5조 (게시물의 관리 및 권리)
1. 이용자가 작성한 미담은 담임 교사(관리자)의 확인을 거친 후 승인(게시) 또는 거절(삭제)될 수 있습니다.
2. 부적절한 게시물(비방, 장난 등)은 교사에 의해 통보 없이 삭제될 수 있습니다.
3. 게시된 미담 데이터는 학급 운영 및 긍정적인 학급 분위기 조성을 위한 목적으로만 사용되며, 외부로 무단 유출되지 않습니다.

## 제6조 (서비스의 종료)
본 서비스는 해당 학년도의 학급 운영이 종료되거나, 교사의 교육적 판단에 따라 언제든지 종료될 수 있습니다. 서비스 종료 시 수집된 데이터는 모두 안전하게 파기됩니다.
  `;

  const privacyText = `
뿅뿅 미담 자판기(이하 '서비스')는 학급 내 긍정적인 문화를 조성하기 위해 운영되며, 이용자의 개인정보 보호를 가장 중요하게 생각합니다. 본 방침은 서비스 이용 시 수집되는 개인정보의 항목, 이용 목적, 보관 기간 등을 안내합니다.

## 1. 수집하는 개인정보 항목
- 필수 항목: 이름(닉네임), 비밀번호(숫자)
- 자동 수집 항목: 서비스 이용 기록, 접속 시간 (Firebase 시스템 기본 수집)
※ 본 서비스는 학생의 전화번호, 주소 등 민감한 개인정보를 절대 요구하지 않습니다.

## 2. 개인정보의 수집 및 이용 목적
- 회원 관리: 본인 확인, 중복 가입 방지, 학급 내 학생 식별
- 서비스 제공: 미담 캔 작성자 표시, 공감(좋아요) 중복 방지
- 부정 이용 방지: 타인 비방 및 장난성 글 작성 방지 및 교사 검수를 위한 식별

## 3. 개인정보의 보유 및 이용 기간
- 보유 기간: 해당 학년도 종료 시점 (또는 교사의 서비스 운영 종료 시점)
- 학년도가 종료되거나 이용자가 삭제를 요청할 경우, 수집된 모든 개인정보 및 미담 데이터는 지체 없이 완전히 파기(삭제)됩니다.

## 4. 개인정보의 제3자 제공 및 위탁
본 서비스는 이용자의 동의 없이 개인정보를 외부(제3자)에 제공하지 않습니다. 단, 서비스의 데이터 저장을 위해 Google Firebase 클라우드 서버를 이용하고 있으며, 해당 서버는 철저한 보안 규정을 준수합니다.

## 5. 이용자(학생 및 학부모)의 권리
이용자 및 법정대리인은 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며, 서비스 탈퇴(계정 삭제)를 교사에게 요청할 수 있습니다. 교사는 요청 즉시 해당 데이터를 삭제합니다.

## 6. 개인정보 보호 담당자
본 서비스의 데이터 관리 및 개인정보 보호 책임은 학급 담임 교사에게 있습니다. 개인정보와 관련된 문의나 삭제 요청은 담임 교사에게 직접 문의해 주시기 바랍니다.
  `;

  return (
    <>
      {/* 푸터 영역 */}
      <footer style={{
        marginTop: 'auto',
        padding: '20px',
        background: '#f8f9fa',
        borderTop: '1px solid #e9ecef',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: '#6c757d'
      }}>
        <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center', gap: '15px' }}>
          <button 
            onClick={() => setModalContent('terms')}
            style={{ color: '#495057', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            이용약관
          </button>
          <span>|</span>
          <button 
            onClick={() => setModalContent('privacy')}
            style={{ color: '#495057', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            개인정보처리방침
          </button>
        </div>
        <div>
          정보관리책임자: 서울강서초등학교 이지민<br/>
          © 2026 뿅뿅 미담 자판기 All rights reserved.
        </div>
      </footer>

      {/* 팝업 모달 */}
      <AnimatePresence>
        {modalContent && (
          <div 
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.6)', zIndex: 9999,
              display: 'flex', justifyContent: 'center', alignItems: 'center'
            }}
            onClick={() => setModalContent(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white',
                padding: '30px',
                borderRadius: 'var(--radius-md)',
                maxWidth: '600px',
                width: '90%',
                maxHeight: '80vh',
                boxShadow: 'var(--shadow-lg)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                <h2 style={{ margin: 0, color: 'var(--color-primary-dark)' }}>
                  {modalContent === 'terms' ? '이용약관' : '개인정보처리방침'}
                </h2>
                <button 
                  onClick={() => setModalContent(null)}
                  style={{ fontSize: '1.5rem', color: '#999', cursor: 'pointer', background: 'none', border: 'none' }}
                >
                  ✕
                </button>
              </div>
              
              <div style={{ 
                overflowY: 'auto', 
                flex: 1, 
                paddingRight: '10px',
                lineHeight: '1.8',
                whiteSpace: 'pre-wrap',
                fontSize: '0.95rem'
              }}>
                {modalContent === 'terms' ? termsText : privacyText}
              </div>

              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button 
                  onClick={() => setModalContent(null)}
                  style={{ 
                    background: 'var(--color-secondary)', color: 'white', 
                    padding: '10px 30px', borderRadius: 'var(--radius-pill)', 
                    fontWeight: 'bold', cursor: 'pointer', border: 'none'
                  }}
                >
                  확인
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
