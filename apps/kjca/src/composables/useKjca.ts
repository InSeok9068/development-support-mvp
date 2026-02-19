import pb from '@/api/pocketbase';

type StaffAuthProbePayload = {
  scDay?: string;
};

type StaffAuthProbeResponse = {
  ok: boolean;
  isDiaryAccessible: boolean;
  teamLeadRows: Array<{
    dept: string;
    position: string;
    staffName: string;
    printUrl: string; // 화면엔 안보이지만 다음 단계에서 사용할 링크
  }>;
};

type StaffDiaryAnalyzePayload = {
  reportDate?: string;
  targets: Array<{
    dept: string;
    position: string;
    staffName: string;
    printUrl: string;
  }>;
};

type StaffDiaryAnalyzeResponse = {
  ok: boolean;
  stoppedReason?: string;
  alertMessage?: string;
  results: Array<{
    dept: string;
    position: string;
    staffName: string;
    ok: boolean;
    error?: string;
    promotion: string[];
    vacation: string[];
    special: string[];
    printUrl: string; // 화면엔 안보이지만 다음 단계에서 사용할 링크
  }>;
};

export const useKjca = () => {
  /* ======================= 변수 ======================= */
  /* ======================= 변수 ======================= */

  /* ======================= 감시자 ======================= */
  /* ======================= 감시자 ======================= */

  /* ======================= 생명주기 훅 ======================= */
  /* ======================= 생명주기 훅 ======================= */

  /* ======================= 메서드 ======================= */
  const fetchStaffAuthProbe = (payload: StaffAuthProbePayload) => {
    return pb.send<StaffAuthProbeResponse>('/api/staff-auth-probe', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'content-type': 'application/json',
      },
    });
  };

  const fetchStaffDiaryAnalyze = (payload: StaffDiaryAnalyzePayload) => {
    return pb.send<StaffDiaryAnalyzeResponse>('/api/staff-diary/analyze', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'content-type': 'application/json',
      },
    });
  };
  /* ======================= 메서드 ======================= */

  return {
    fetchStaffAuthProbe,
    fetchStaffDiaryAnalyze,
  };
};
