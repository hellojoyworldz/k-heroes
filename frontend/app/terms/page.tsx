import { LegalDocumentLayout, LegalSection } from "@/components/legal/legal-document-layout";
import { site } from "@/lib/site";

export default function TermsPage() {
  return (
    <LegalDocumentLayout effectiveDate={site.legal.effectiveDate} title="서비스 이용약관">
      <LegalSection title="제1조 (목적)">
        <p>
          본 약관은 {site.name}(이하 &quot;회사&quot;)가 제공하는 역사·지역 문화 인터랙티브 시뮬레이션 서비스(이하
          &quot;서비스&quot;)의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.
        </p>
      </LegalSection>

      <LegalSection title="제2조 (정의)">
        <p>
          1. &quot;이용자&quot;란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.
        </p>
        <p>
          2. &quot;회원&quot;이란 서비스에 가입하여 아이디를 부여받고 지속적으로 서비스를 이용할 수 있는 자를
          말합니다.
        </p>
        <p>
          3. &quot;시뮬레이션 기록&quot;이란 이용자가 서비스 내 역사 시뮬레이션을 진행하며 생성한 선택 경로, 결과
          등의 데이터를 말합니다.
        </p>
      </LegalSection>

      <LegalSection title="제3조 (약관의 효력 및 변경)">
        <p>1. 본 약관은 서비스 화면에 게시하거나 기타 방법으로 공지함으로써 효력이 발생합니다.</p>
        <p>
          2. 회사는 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수 있으며, 변경 시 적용일자 및 변경 사유를
          사전에 공지합니다.
        </p>
        <p>3. 이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.</p>
      </LegalSection>

      <LegalSection title="제4조 (회원가입 및 계정 관리)">
        <p>1. 회원가입은 이용자가 약관에 동의하고 회사가 정한 절차에 따라 가입 신청을 하면 회사가 승낙함으로써 성립합니다.</p>
        <p>2. 이용자는 정확한 정보를 제공해야 하며, 계정 정보의 관리 책임은 이용자에게 있습니다.</p>
        <p>3. 타인의 정보를 도용하거나 허위 정보로 가입한 경우 회사는 사전 통지 없이 이용을 제한할 수 있습니다.</p>
      </LegalSection>

      <LegalSection title="제5조 (서비스의 제공)">
        <p>1. 회사는 역사 인물·지역 문화 기반의 인터랙티브 시뮬레이션, 기록 조회, 교육용 콘텐츠 등을 제공합니다.</p>
        <p>2. 서비스는 연중무휴 제공을 원칙으로 하나, 시스템 점검·장애 등 불가피한 사유로 일시 중단될 수 있습니다.</p>
        <p>3. 회사는 서비스의 내용, 기능을 운영상·기술상 필요에 따라 변경할 수 있습니다.</p>
      </LegalSection>

      <LegalSection title="제6조 (이용자의 의무)">
        <p>이용자는 다음 행위를 하여서는 안 됩니다.</p>
        <p>1. 타인의 개인정보, 계정 정보를 무단으로 수집·이용·유출하는 행위</p>
        <p>2. 서비스의 정상적인 운영을 방해하거나 시스템에 부하를 주는 행위</p>
        <p>3. 회사 또는 제3자의 저작권, 지식재산권을 침해하는 행위</p>
        <p>4. 공공질서 및 미풍양속에 반하는 정보를 게시·전송하는 행위</p>
        <p>5. 기타 관련 법령 및 본 약관을 위반하는 행위</p>
      </LegalSection>

      <LegalSection title="제7조 (지적재산권)">
        <p>
          서비스에 포함된 텍스트, 이미지, 시나리오, UI 등 모든 콘텐츠에 대한 저작권 및 지식재산권은 회사 또는 정당한
          권리자에게 귀속됩니다. 이용자는 회사의 사전 서면 동의 없이 이를 복제, 배포, 상업적으로 이용할 수 없습니다.
        </p>
      </LegalSection>

      <LegalSection title="제8조 (면책)">
        <p>
          1. 서비스의 역사·문화 콘텐츠는 교육 및 체험 목적이며, 학술적 해석이나 사실 관계와 차이가 있을 수 있습니다.
        </p>
        <p>2. 천재지변, 불가항력, 이용자의 귀책 사유로 인한 서비스 이용 장애에 대해 회사는 책임을 지지 않습니다.</p>
      </LegalSection>

      <LegalSection title="제9조 (문의)">
        <p>
          본 약관과 관련한 문의는 운영 담당자 이메일({site.email.contact})로 접수해 주시기 바랍니다.
        </p>
      </LegalSection>
    </LegalDocumentLayout>
  );
}
