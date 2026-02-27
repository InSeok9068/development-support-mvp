import { useMutation, useQueryClient } from '@tanstack/vue-query';

import pb from '@/api/pocketbase';
import {
  Collections,
  RecruitingDailyResultsSourceTypeOptions,
  RecruitingDailyResultsWeekdayOptions,
  type StaffDiaryAnalysisCacheResponse,
  RecruitingWeekPlanItemsWeekdayOptions,
  RecruitingWeekPlansStatusOptions,
  type Create,
  type RecruitingDailyResultsResponse,
  type RecruitingWeekPlanItemsResponse,
  type RecruitingWeekPlansResponse,
  type Update,
} from '@/api/pocketbase-types';

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
    printUrl: string;
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
    recruiting: {
      monthTarget: number | null;
      monthAssignedCurrent: number | null;
      weekTarget: number | null;
      dailyPlan: Array<{
        weekday: 'mon' | 'tue' | 'wed' | 'thu' | 'fri';
        channelName: string;
        promotionContent: string;
        targetCount: number | null;
        ownerName: string;
        note: string;
      }>;
      dailyActualCount: number | null;
    };
    printUrl: string;
  }>;
};

type StaffDiaryCollectWeeklyPayload = {
  reportDate?: string;
  testOneOnly?: boolean;
};

type StaffDiaryAnalyzeCacheClearPayload = {
  reportDate?: string;
  dept: string;
};

type StaffDiaryAnalyzeCacheClearResponse = {
  ok: boolean;
  reportDate: string;
  dept: string;
  deletedCount: number;
};

type StaffDiaryCollectWeeklyResponse = {
  ok: boolean;
  isDiaryAccessible: boolean;
  teamLeadRows: Array<{
    dept: string;
    position: string;
    staffName: string;
    printUrl: string;
  }>;
  analysisResults: Array<{
    dept: string;
    position: string;
    staffName: string;
    ok: boolean;
    error?: string;
    promotion: string[];
    vacation: string[];
    special: string[];
    recruiting: {
      monthTarget: number | null;
      monthAssignedCurrent: number | null;
      weekTarget: number | null;
      dailyPlan: Array<{
        weekday: 'mon' | 'tue' | 'wed' | 'thu' | 'fri';
        channelName: string;
        promotionContent: string;
        targetCount: number | null;
        ownerName: string;
        note: string;
      }>;
      dailyActualCount: number | null;
    };
    printUrl: string;
  }>;
  deptSnapshots: Array<{
    dept: string;
    monthTarget: number | null;
    weekTarget: number | null;
    rows: Array<{
      weekday: 'mon' | 'tue' | 'wed' | 'thu' | 'fri';
      target: number;
      actual: number;
      gap: number;
    }>;
    today: {
      weekday: 'mon' | 'tue' | 'wed' | 'thu' | 'fri';
      target: number;
      actual: number;
      gap: number;
    };
    cumulative: {
      target: number;
      actual: number;
      gap: number;
    };
  }>;
  deptWeekTables?: Array<{
    dept: string;
    todayWeekday: 'mon' | 'tue' | 'wed' | 'thu' | 'fri';
    rows: Array<{
      weekday: 'mon' | 'tue' | 'wed' | 'thu' | 'fri';
      channelName: string;
      weeklyPlan: string;
      promotionContent: string;
      targetText: string;
      resultText: string;
      recruitCountText: string;
      ownerName: string;
      note: string;
      sortOrder: number;
    }>;
  }>;
  alertMessage?: string;
  stoppedReason?: string;
  warnings?: string[];
};

type FetchRecruitingWeekPlanPayload = {
  weekStartDate: string;
  dept: string;
};

type FetchRecruitingDailyResultPayload = {
  reportDate: string;
  dept: string;
};

type FetchRecruitingWeekResultsPayload = {
  weekStartDate: string;
  dept: string;
};

type RecruitingWeekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri';

type UpsertRecruitingWeekPlanPayload = {
  weekStartDate: string;
  dept: string;
  monthTarget?: number;
  weekTarget?: number;
  status: RecruitingWeekPlansStatusOptions;
  items: Array<{
    weekday: RecruitingWeekday;
    channelName?: string;
    promotionContent?: string;
    targetCount?: number;
    ownerName?: string;
    note?: string;
    sortOrder?: number;
  }>;
};

type UpsertRecruitingDailyResultPayload = {
  reportDate: string;
  weekStartDate: string;
  dept: string;
  weekday: RecruitingWeekday;
  actualCount: number;
  sourceType: RecruitingDailyResultsSourceTypeOptions;
  memo?: string;
};

export type RecruitingWeekPlanData = {
  plan: RecruitingWeekPlansResponse | null;
  items: RecruitingWeekPlanItemsResponse[];
};

const sendPostJson = <TResponse, TPayload>(path: string, payload: TPayload) => {
  return pb.send<TResponse>(path, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'content-type': 'application/json',
    },
  });
};

const escapeFilterValue = (value: string) =>
  String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'");

const isNotFoundError = (error: unknown) => {
  const maybeError = error as { status?: number } | undefined;
  return maybeError?.status === 404;
};

const buildWeekPlanFilter = (payload: FetchRecruitingWeekPlanPayload) =>
  `weekStartDate = '${escapeFilterValue(payload.weekStartDate)}' && dept = '${escapeFilterValue(payload.dept)}'`;

const fetchRecruitingWeekPlanQuery = async (
  payload: FetchRecruitingWeekPlanPayload,
): Promise<RecruitingWeekPlanData> => {
  let plan: RecruitingWeekPlansResponse | null = null;

  try {
    plan = await pb
      .collection(Collections.RecruitingWeekPlans)
      .getFirstListItem<RecruitingWeekPlansResponse>(buildWeekPlanFilter(payload));
  } catch (error) {
    if (!isNotFoundError(error)) throw error;
  }

  if (!plan) {
    return {
      plan: null,
      items: [],
    };
  }

  const items = await pb.collection(Collections.RecruitingWeekPlanItems).getFullList<RecruitingWeekPlanItemsResponse>({
    filter: `planId = '${escapeFilterValue(plan.id)}'`,
    sort: 'weekday,sortOrder,created',
  });

  return {
    plan,
    items,
  };
};

const fetchRecruitingDailyResultQuery = async (
  payload: FetchRecruitingDailyResultPayload,
): Promise<RecruitingDailyResultsResponse | null> => {
  try {
    return await pb
      .collection(Collections.RecruitingDailyResults)
      .getFirstListItem<RecruitingDailyResultsResponse>(
        `reportDate = '${escapeFilterValue(payload.reportDate)}' && dept = '${escapeFilterValue(payload.dept)}'`,
      );
  } catch (error) {
    if (!isNotFoundError(error)) throw error;
    return null;
  }
};

const fetchRecruitingWeekResultsQuery = async (
  payload: FetchRecruitingWeekResultsPayload,
): Promise<RecruitingDailyResultsResponse[]> => {
  return pb.collection(Collections.RecruitingDailyResults).getFullList<RecruitingDailyResultsResponse>({
    filter: `weekStartDate = '${escapeFilterValue(payload.weekStartDate)}' && dept = '${escapeFilterValue(payload.dept)}'`,
    sort: 'reportDate',
  });
};

export const useKjca = () => {
  /* ======================= 변수 ======================= */
  const queryClient = useQueryClient();

  const createRecruitingWeekPlanMutation = useMutation({
    mutationFn: async (payload: UpsertRecruitingWeekPlanPayload) => {
      let plan: RecruitingWeekPlansResponse | null = null;

      try {
        plan = await pb
          .collection(Collections.RecruitingWeekPlans)
          .getFirstListItem<RecruitingWeekPlansResponse>(
            buildWeekPlanFilter({ weekStartDate: payload.weekStartDate, dept: payload.dept }),
          );
      } catch (error) {
        if (!isNotFoundError(error)) throw error;
      }

      const planData: Create<Collections.RecruitingWeekPlans> | Update<Collections.RecruitingWeekPlans> = {
        weekStartDate: payload.weekStartDate,
        dept: payload.dept,
        monthTarget: payload.monthTarget,
        weekTarget: payload.weekTarget,
        status: payload.status,
      };

      const savedPlan = plan
        ? await pb.collection(Collections.RecruitingWeekPlans).update(plan.id, planData)
        : await pb.collection(Collections.RecruitingWeekPlans).create(planData);

      const oldItems = await pb.collection(Collections.RecruitingWeekPlanItems).getFullList({
        filter: `planId = '${escapeFilterValue(savedPlan.id)}'`,
      });

      await Promise.all(oldItems.map((item) => pb.collection(Collections.RecruitingWeekPlanItems).delete(item.id)));

      const nextItems = payload.items
        .map((item, index) => ({
          weekday: item.weekday,
          channelName: String(item.channelName ?? '').trim(),
          promotionContent: String(item.promotionContent ?? '').trim(),
          targetCount: item.targetCount,
          ownerName: String(item.ownerName ?? '').trim(),
          note: String(item.note ?? '').trim(),
          sortOrder: item.sortOrder ?? index,
        }))
        .filter(
          (item) =>
            !!item.channelName ||
            !!item.promotionContent ||
            !!item.ownerName ||
            !!item.note ||
            Number(item.targetCount ?? 0) > 0,
        );

      await Promise.all(
        nextItems.map((item) =>
          pb.collection(Collections.RecruitingWeekPlanItems).create({
            planId: savedPlan.id,
            weekday: item.weekday as RecruitingWeekPlanItemsWeekdayOptions,
            channelName: item.channelName,
            promotionContent: item.promotionContent,
            targetCount: item.targetCount,
            ownerName: item.ownerName,
            note: item.note,
            sortOrder: item.sortOrder,
          } satisfies Create<Collections.RecruitingWeekPlanItems>),
        ),
      );

      await queryClient.invalidateQueries({ queryKey: ['recruitings', 'week-plan'] });
      return savedPlan;
    },
  });

  const createRecruitingDailyResultMutation = useMutation({
    mutationFn: async (payload: UpsertRecruitingDailyResultPayload) => {
      const filter = `reportDate = '${escapeFilterValue(payload.reportDate)}' && dept = '${escapeFilterValue(payload.dept)}'`;
      let record: RecruitingDailyResultsResponse | null = null;

      try {
        record = await pb
          .collection(Collections.RecruitingDailyResults)
          .getFirstListItem<RecruitingDailyResultsResponse>(filter);
      } catch (error) {
        if (!isNotFoundError(error)) throw error;
      }

      const nextData: Create<Collections.RecruitingDailyResults> | Update<Collections.RecruitingDailyResults> = {
        reportDate: payload.reportDate,
        weekStartDate: payload.weekStartDate,
        dept: payload.dept,
        weekday: payload.weekday as RecruitingDailyResultsWeekdayOptions,
        actualCount: payload.actualCount,
        sourceType: payload.sourceType,
        memo: String(payload.memo ?? '').trim(),
      };

      const saved = record
        ? await pb.collection(Collections.RecruitingDailyResults).update(record.id, nextData)
        : await pb.collection(Collections.RecruitingDailyResults).create(nextData);

      await queryClient.invalidateQueries({ queryKey: ['recruitings', 'daily-result'] });
      await queryClient.invalidateQueries({ queryKey: ['recruitings', 'week-results'] });
      return saved;
    },
  });
  /* ======================= 변수 ======================= */

  /* ======================= 감시자 ======================= */
  /* ======================= 감시자 ======================= */

  /* ======================= 생명주기 훅 ======================= */
  /* ======================= 생명주기 훅 ======================= */

  /* ======================= 메서드 ======================= */
  const fetchStaffAuthProbe = (payload: StaffAuthProbePayload) => {
    return sendPostJson<StaffAuthProbeResponse, StaffAuthProbePayload>('/api/staff-auth-probe', payload);
  };

  const fetchStaffDiaryAnalyze = (payload: StaffDiaryAnalyzePayload) => {
    return sendPostJson<StaffDiaryAnalyzeResponse, StaffDiaryAnalyzePayload>('/api/staff-diary/analyze', payload);
  };

  const fetchStaffDiaryCollectWeekly = (payload: StaffDiaryCollectWeeklyPayload) => {
    return sendPostJson<StaffDiaryCollectWeeklyResponse, StaffDiaryCollectWeeklyPayload>(
      '/api/staff-diary/collect-weekly',
      payload,
    );
  };

  const fetchStaffDiaryAnalyzeCacheClear = async (payload: StaffDiaryAnalyzeCacheClearPayload) => {
    const reportDate = String(payload.reportDate ?? '').trim();
    const dept = String(payload.dept ?? '').trim();

    if (!reportDate) {
      throw new Error('조회일(reportDate)이 필요합니다.');
    }
    if (!dept) {
      throw new Error('부서(dept)가 필요합니다.');
    }

    const rows = await pb.collection(Collections.StaffDiaryAnalysisCache).getFullList<StaffDiaryAnalysisCacheResponse>({
      filter:
        `(reportDate = '${escapeFilterValue(reportDate)}' || reportDate ~ '${escapeFilterValue(`${reportDate}%`)}')` +
        ` && dept = '${escapeFilterValue(dept)}'`,
      sort: 'created',
    });

    await Promise.all(rows.map((row) => pb.collection(Collections.StaffDiaryAnalysisCache).delete(row.id)));

    return {
      ok: true,
      reportDate,
      dept,
      deletedCount: rows.length,
    } satisfies StaffDiaryAnalyzeCacheClearResponse;
  };

  const fetchRecruitingWeekPlan = (payload: FetchRecruitingWeekPlanPayload) => {
    return queryClient.fetchQuery({
      queryKey: ['recruitings', 'week-plan', payload],
      queryFn: ({ queryKey }) => {
        const [, , params] = queryKey as [string, string, FetchRecruitingWeekPlanPayload];
        return fetchRecruitingWeekPlanQuery(params);
      },
    });
  };

  const fetchRecruitingDailyResult = (payload: FetchRecruitingDailyResultPayload) => {
    return queryClient.fetchQuery({
      queryKey: ['recruitings', 'daily-result', payload],
      queryFn: ({ queryKey }) => {
        const [, , params] = queryKey as [string, string, FetchRecruitingDailyResultPayload];
        return fetchRecruitingDailyResultQuery(params);
      },
    });
  };

  const fetchRecruitingWeekResults = (payload: FetchRecruitingWeekResultsPayload) => {
    return queryClient.fetchQuery({
      queryKey: ['recruitings', 'week-results', payload],
      queryFn: ({ queryKey }) => {
        const [, , params] = queryKey as [string, string, FetchRecruitingWeekResultsPayload];
        return fetchRecruitingWeekResultsQuery(params);
      },
    });
  };

  const createRecruitingWeekPlan = (payload: UpsertRecruitingWeekPlanPayload) => {
    return createRecruitingWeekPlanMutation.mutateAsync(payload);
  };

  const createRecruitingDailyResult = (payload: UpsertRecruitingDailyResultPayload) => {
    return createRecruitingDailyResultMutation.mutateAsync(payload);
  };
  /* ======================= 메서드 ======================= */

  return {
    fetchStaffAuthProbe,
    fetchStaffDiaryAnalyze,
    fetchStaffDiaryCollectWeekly,
    fetchStaffDiaryAnalyzeCacheClear,
    fetchRecruitingWeekPlan,
    fetchRecruitingDailyResult,
    fetchRecruitingWeekResults,
    createRecruitingWeekPlan,
    createRecruitingDailyResult,
  };
};
