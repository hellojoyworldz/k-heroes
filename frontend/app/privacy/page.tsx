import { LegalDocumentLayout, LegalSection } from "@/components/legal/legal-document-layout";
import { site } from "@/lib/site";

export default function PrivacyPage() {
  return (
    <LegalDocumentLayout effectiveDate={site.legal.effectiveDate} title="개인정보처리방침">
      <LegalSection title="1. 개인정보의 처리 목적">
        <p>
          {site.name}(이하 &quot;회사&quot;)는 다음 목적을 위해 개인정보를 처리합니다. 처리한 개인정보는 아래 목적 이외의
          용도로 이용되지 않으며, 이용 목적이 변경되는 경우 관련 법령에 따라 별도 동의를 받습니다.
        </p>
        <p>1. 회원 가입 및 관리: 회원 식별, 가입 의사 확인, 계정 관리, 부정 이용 방지</p>
        <p>2. 서비스 제공: 역사 시뮬레이션 진행, 기록 저장·조회, 맞춤형 콘텐츠 제공</p>
        <p>3. 고객 지원: 문의 응대, 공지사항 전달, 분쟁 처리</p>
        <p>4. 서비스 개선: 이용 통계 분석, 서비스 품질 향상</p>
      </LegalSection>

      <LegalSection title="2. 처리하는 개인정보 항목">
        <p>회사는 다음의 개인정보 항목을 처리할 수 있습니다.</p>
        <p>
          <strong>필수 항목:</strong> 아이디, 비밀번호(암호화 저장)
        </p>
        <p>
          <strong>선택 항목:</strong> 이름, 닉네임, 이메일
        </p>
        <p>
          <strong>자동 수집 항목:</strong> 접속 IP, 쿠키, 서비스 이용 기록, 기기 정보, 시뮬레이션 진행 기록
        </p>
        <p>
          <strong>소셜 로그인 시:</strong> 제공 동의 범위 내 식별자, 이메일 등 (Google 등 연동 시)
        </p>
      </LegalSection>

      <LegalSection title="3. 개인정보의 보유 및 이용 기간">
        <p>회사는 법령에 따른 보유 기간 또는 정보주체로부터 동의받은 기간 내에서 개인정보를 보유·이용합니다.</p>
        <p>1. 회원 정보: 회원 탈퇴 시까지 (단, 관련 법령에 따라 일정 기간 보관할 수 있음)</p>
        <p>2. 시뮬레이션 기록: 회원 탈퇴 또는 이용자 삭제 요청 시까지</p>
        <p>3. 접속 로그: 통신비밀보호법 등에 따라 최대 3개월</p>
      </LegalSection>

      <LegalSection title="4. 개인정보의 제3자 제공">
        <p>
          회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 이용자의 사전 동의가 있거나 법령에
          근거한 경우에 한해 제공할 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection title="5. 개인정보 처리의 위탁">
        <p>
          회사는 원활한 서비스 제공을 위해 인프라 운영, 데이터 저장 등 필요한 범위에서 개인정보 처리 업무를 위탁할 수
          있으며, 위탁 시 관련 법령에 따라 수탁자 관리·감독을 실시합니다.
        </p>
      </LegalSection>

      <LegalSection title="6. 정보주체의 권리·의무">
        <p>이용자는 언제든지 다음 권리를 행사할 수 있습니다.</p>
        <p>1. 개인정보 열람, 정정, 삭제, 처리 정지 요구</p>
        <p>2. 회원 탈퇴를 통한 개인정보 삭제 요청</p>
        <p>권리 행사는 서비스 내 계정 설정 또는 고객지원을 통해 요청할 수 있으며, 회사는 지체 없이 조치합니다.</p>
      </LegalSection>

      <LegalSection title="7. 개인정보의 파기">
        <p>
          회사는 개인정보 보유 기간 경과, 처리 목적 달성 등 개인정보가 불필요하게 되었을 때 지체 없이 해당 정보를
          파기합니다. 전자적 파일은 복구 불가능한 방법으로 삭제하며, 출력물은 분쇄 또는 소각합니다.
        </p>
      </LegalSection>

      <LegalSection title="8. 개인정보의 안전성 확보 조치">
        <p>회사는 개인정보 보호를 위해 다음과 같은 조치를 취합니다.</p>
        <p>1. 비밀번호 등 중요 정보의 암호화 저장</p>
        <p>2. 접근 권한 관리 및 내부 관리 계획 수립</p>
        <p>3. 해킹·악성코드 등에 대비한 보안 시스템 운영</p>
        <p>4. 개인정보 취급자에 대한 교육 및 관리 감독</p>
      </LegalSection>

      <LegalSection title="9. 쿠키의 사용">
        <p>
          회사는 이용자에게 맞춤형 서비스를 제공하기 위해 쿠키를 사용할 수 있습니다. 이용자는 브라우저 설정을 통해
          쿠키 저장을 거부할 수 있으나, 일부 서비스 이용에 제한이 있을 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection title="10. 개인정보 보호책임자">
        <p>개인정보 처리와 관련한 문의, 불만, 피해 구제는 아래로 연락해 주시기 바랍니다.</p>
        <p>
          {site.name} {site.legal.privacyOfficerTitle} ({site.email.privacy})
        </p>
      </LegalSection>

      <LegalSection title="11. 방침의 변경">
        <p>
          본 개인정보처리방침이 변경되는 경우 변경 사유 및 적용 일자를 서비스 내 공지사항 등을 통해 안내합니다.
        </p>
      </LegalSection>
    </LegalDocumentLayout>
  );
}
