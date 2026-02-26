// eslint-disable-next-line @typescript-eslint/triple-slash-reference
// @ts-nocheck
/// <reference path="types.d.ts" />

routerAdd(
  'POST',
  '/api/staff-diary/collect-weekly',
  (e) => {
    const logger = $app.logger().with('hook', 'staff-diary-collect-weekly');

    const payload = new DynamicModel({
      reportDate: '',
      testOneOnly: false,
    });
    e.bindBody(payload);

    const {
      parseJsonSafely,
      normalizeReportDate,
    } = require(`${__hooks}/utils.ts`);

    const WEEKDAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri'];

    const parseDateText = (value) => {
      const text = String(value ?? '').trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return new Date();
      const [year, month, day] = text.split('-').map((unit) => Number(unit));
      return new Date(year, month - 1, day);
    };

    const formatDateText = (date) => {
      const year = date.getFullYear();
      const month = `${date.getMonth() + 1}`.padStart(2, '0');
      const day = `${date.getDate()}`.padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const buildWeekStartDate = (dateText) => {
      const date = parseDateText(dateText);
      const day = date.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const monday = new Date(date);
      monday.setDate(date.getDate() + diff);
      return formatDateText(monday);
    };

    const toWeekdayKey = (dateText) => {
      const day = parseDateText(dateText).getDay();
      if (day === 1) return 'mon';
      if (day === 2) return 'tue';
      if (day === 3) return 'wed';
      if (day === 4) return 'thu';
      return 'fri';
    };

    const normalizeWeekday = (value) => {
      const text = String(value ?? '').trim().toLowerCase();
      if (text === 'mon' || text === 'monday' || text === '월') return 'mon';
      if (text === 'tue' || text === 'tuesday' || text === '화') return 'tue';
      if (text === 'wed' || text === 'wednesday' || text === '수') return 'wed';
      if (text === 'thu' || text === 'thursday' || text === '목') return 'thu';
      if (text === 'fri' || text === 'friday' || text === '금') return 'fri';
      return '';
    };

    const buildDateMatchParams = (dateText) => {
      const normalized = formatDateText(parseDateText(dateText));
      return {
        exact: normalized,
        like: `${normalized}%`,
      };
    };

    const normalizeNullableInt = (value) => {
      if (value === null || value === undefined || value === '') return null;
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return null;
      return Math.max(0, Math.trunc(parsed));
    };

    const normalizeRequiredInt = (value, fallback = 0) => {
      const parsed = normalizeNullableInt(value);
      if (parsed === null) return fallback;
      return parsed;
    };

    const normalizeBool = (value) => {
      if (value === true || value === false) return value;
      const text = String(value ?? '').trim().toLowerCase();
      if (text === 'true' || text === '1' || text === 'y' || text === 'yes') return true;
      return false;
    };

    const normalizeRecruitingExtract = (value) => {
      const source = value && typeof value === 'object' ? value : {};
      const rawDailyPlan = Array.isArray(source.dailyPlan) ? source.dailyPlan : [];

      const dailyPlan = rawDailyPlan
        .map((row) => {
          const item = row && typeof row === 'object' ? row : {};
          const weekday = normalizeWeekday(item.weekday);
          if (!weekday) return null;

          return {
            weekday,
            channelName: String(item.channelName ?? '').trim(),
            promotionContent: String(item.promotionContent ?? '').trim(),
            targetCount: normalizeNullableInt(item.targetCount),
            ownerName: String(item.ownerName ?? '').trim(),
            note: String(item.note ?? '').trim(),
          };
        })
        .filter((row) => !!row);

      const weekTableRowsRaw = Array.isArray(source.weekTableRows) ? source.weekTableRows : [];
      const weekTableRows = weekTableRowsRaw
        .map((item) => {
          const row = item && typeof item === 'object' ? item : {};
          const weekday = normalizeWeekday(row.weekday);
          if (!weekday) return null;

          return {
            weekday,
            channelName: String(row.channelName ?? row.promotionChannel ?? '').trim(),
            weeklyPlan: String(row.weeklyPlan ?? row.plan ?? '').trim(),
            promotionContent: String(row.promotionContent ?? '').trim(),
            targetText: String(row.targetText ?? row.target ?? '').trim(),
            resultText: String(row.resultText ?? row.result ?? '').trim(),
            recruitCountText: String(row.recruitCountText ?? row.countText ?? '').trim(),
            ownerName: String(row.ownerName ?? '').trim(),
            note: String(row.note ?? '').trim(),
          };
        })
        .filter((row) => !!row);

      const weekTableRowsFallback = dailyPlan
        .map((row) => ({
          weekday: row.weekday,
          channelName: row.channelName,
          weeklyPlan: '',
          promotionContent: row.promotionContent,
          targetText: row.targetCount === null ? '' : String(row.targetCount),
          resultText: '',
          recruitCountText: '',
          ownerName: row.ownerName,
          note: row.note,
        }))
        .filter(
          (row) =>
            !!row.channelName ||
            !!row.weeklyPlan ||
            !!row.promotionContent ||
            !!row.targetText ||
            !!row.resultText ||
            !!row.recruitCountText ||
            !!row.ownerName ||
            !!row.note,
        );

      return {
        monthTarget: normalizeNullableInt(source.monthTarget),
        monthAssignedCurrent: normalizeNullableInt(source.monthAssignedCurrent),
        weekTarget: normalizeNullableInt(source.weekTarget),
        dailyPlan,
        dailyActualCount: normalizeNullableInt(source.dailyActualCount),
        weekTableRows: weekTableRows.length > 0 ? weekTableRows : weekTableRowsFallback,
      };
    };

    const normalizeTeamLeadRows = (value) => {
      if (!Array.isArray(value)) return [];

      return value
        .map((row) => {
          const item = row && typeof row === 'object' ? row : {};
          return {
            dept: String(item.dept ?? '').trim(),
            position: String(item.position ?? '').trim(),
            staffName: String(item.staffName ?? '').trim(),
            printUrl: String(item.printUrl ?? '').trim(),
          };
        })
        .filter((row) => !!row.dept && !!row.printUrl);
    };

    const normalizeAnalyzeResults = (value) => {
      const rows = Array.isArray(value) ? value : [];
      return rows.map((item) => ({
        dept: String(item?.dept ?? '').trim(),
        position: String(item?.position ?? '').trim(),
        staffName: String(item?.staffName ?? '').trim(),
        ok: item?.ok !== false,
        error: String(item?.error ?? '').trim(),
        promotion: Array.isArray(item?.promotion) ? item.promotion : [],
        vacation: Array.isArray(item?.vacation) ? item.vacation : [],
        special: Array.isArray(item?.special) ? item.special : [],
        recruiting: normalizeRecruitingExtract(item?.recruiting),
        printUrl: String(item?.printUrl ?? '').trim(),
      }));
    };

    const shouldRetryAnalyzeError = (errorText) => {
      const text = String(errorText ?? '').toLowerCase();
      if (!text) return false;
      return (
        text.includes('http 503') ||
        text.includes('http 429') ||
        text.includes('timeout') ||
        text.includes('temporarily unavailable') ||
        text.includes('connection reset')
      );
    };

    const buildUniqueTargets = (rows) => {
      const map = new Map();
      rows.forEach((row) => {
        if (map.has(row.dept)) return;
        map.set(row.dept, {
          dept: row.dept,
          position: row.position,
          staffName: row.staffName,
          printUrl: row.printUrl,
        });
      });
      return Array.from(map.values());
    };

    const hasWeekPlanData = (recruiting) => {
      return (
        recruiting.monthTarget !== null ||
        recruiting.weekTarget !== null ||
        (Array.isArray(recruiting.weekTableRows) &&
          recruiting.weekTableRows.some(
            (row) =>
              !!String(row.channelName ?? '').trim() ||
              !!String(row.weeklyPlan ?? '').trim() ||
              !!String(row.promotionContent ?? '').trim() ||
              !!String(row.targetText ?? '').trim() ||
              !!String(row.resultText ?? '').trim() ||
              !!String(row.recruitCountText ?? '').trim() ||
              !!String(row.ownerName ?? '').trim() ||
              !!String(row.note ?? '').trim(),
          )) ||
        recruiting.dailyPlan.some(
          (item) =>
            item.targetCount !== null ||
            !!item.channelName ||
            !!item.promotionContent ||
            !!item.ownerName ||
            !!item.note,
        )
      );
    };

    const buildSnapshotRows = (planItems, weekResults) => {
      const targetMap = {
        mon: 0,
        tue: 0,
        wed: 0,
        thu: 0,
        fri: 0,
      };

      const actualMap = {
        mon: 0,
        tue: 0,
        wed: 0,
        thu: 0,
        fri: 0,
      };

      planItems.forEach((item) => {
        const weekday = normalizeWeekday(item.weekday);
        if (!weekday) return;
        targetMap[weekday] += Math.max(0, Math.trunc(Number(item.targetCount || 0)));
      });

      weekResults.forEach((item) => {
        const weekday = normalizeWeekday(item.weekday);
        if (!weekday) return;
        actualMap[weekday] += Math.max(0, Math.trunc(Number(item.actualCount || 0)));
      });

      return WEEKDAY_ORDER.map((weekday) => ({
        weekday,
        target: targetMap[weekday],
        actual: actualMap[weekday],
        gap: actualMap[weekday] - targetMap[weekday],
      }));
    };

    const normalizeWeekTextRows = (rows) => {
      if (!Array.isArray(rows)) return [];

      return rows
        .map((item, index) => {
          const row = item && typeof item === 'object' ? item : {};
          const weekday = normalizeWeekday(row.weekday);
          if (!weekday) return null;
          return {
            weekday,
            channelName: String(row.channelName ?? '').trim(),
            weeklyPlan: String(row.weeklyPlan ?? '').trim(),
            promotionContent: String(row.promotionContent ?? '').trim(),
            targetText: String(row.targetText ?? '').trim(),
            resultText: String(row.resultText ?? '').trim(),
            recruitCountText: String(row.recruitCountText ?? '').trim(),
            ownerName: String(row.ownerName ?? '').trim(),
            note: String(row.note ?? '').trim(),
            sortOrder: Number.isFinite(Number(row.sortOrder)) ? Math.trunc(Number(row.sortOrder)) : index,
          };
        })
        .filter((row) => !!row);
    };

    const ensureWeekdayRows = (rows) => {
      const normalized = normalizeWeekTextRows(rows);
      const byWeekday = new Map();
      normalized.forEach((row) => {
        const key = row.weekday;
        if (!byWeekday.has(key)) byWeekday.set(key, []);
        byWeekday.get(key).push(row);
      });

      const result = [];
      WEEKDAY_ORDER.forEach((weekday) => {
        const items = byWeekday.get(weekday) ?? [];
        if (items.length === 0) {
          result.push({
            weekday,
            channelName: '',
            weeklyPlan: '',
            promotionContent: '',
            targetText: '',
            resultText: '',
            recruitCountText: '',
            ownerName: '',
            note: '',
            sortOrder: 0,
          });
          return;
        }
        items
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .forEach((item, index) => result.push({ ...item, sortOrder: index }));
      });
      return result;
    };

    const hasWeekTextContent = (rows) => {
      return rows.some(
        (row) =>
          !!String(row.channelName ?? '').trim() ||
          !!String(row.weeklyPlan ?? '').trim() ||
          !!String(row.promotionContent ?? '').trim() ||
          !!String(row.targetText ?? '').trim() ||
          !!String(row.resultText ?? '').trim() ||
          !!String(row.recruitCountText ?? '').trim() ||
          !!String(row.ownerName ?? '').trim() ||
          !!String(row.note ?? '').trim(),
      );
    };

    const getDistinctWeekdayCount = (rows) => {
      const weekdaySet = new Set();
      rows.forEach((row) => {
        const weekday = normalizeWeekday(row.weekday);
        if (weekday) weekdaySet.add(weekday);
      });
      return weekdaySet.size;
    };

    const findWeekTextPlan = (weekStartDate, dept) => {
      const weekDate = buildDateMatchParams(weekStartDate);
      try {
        return $app.findFirstRecordByFilter(
          'recruiting_week_text_plans',
          '(weekStartDate = {:exact} || weekStartDate ~ {:like}) && dept = {:dept}',
          { exact: weekDate.exact, like: weekDate.like, dept },
        );
      } catch {
        return null;
      }
    };

    const findWeekTextRows = (planId) => {
      try {
        return $app.findRecordsByFilter(
          'recruiting_week_text_rows',
          'planId = {:planId}',
          'weekday,sortOrder,created',
          1000,
          0,
          { planId },
        );
      } catch {
        return [];
      }
    };

    const upsertWeekTextPlan = (params) => {
      const safeWeekStartDate = formatDateText(parseDateText(params.weekStartDate));
      const dept = String(params.dept ?? '').trim();
      if (!dept) return { ok: false, reason: 'dept-empty' };

      const planCollection = $app.findCollectionByNameOrId('recruiting_week_text_plans');
      const rowCollection = $app.findCollectionByNameOrId('recruiting_week_text_rows');

      let plan = findWeekTextPlan(safeWeekStartDate, dept);
      const wasNew = !plan;
      if (!plan) plan = new Record(planCollection);

      plan.set('weekStartDate', safeWeekStartDate);
      plan.set('dept', dept);
      plan.set('status', 'confirmed');
      try {
        $app.save(plan);
      } catch (error) {
        if (!wasNew || !isUniqueValueError(error)) throw error;
        const existing = findWeekTextPlan(safeWeekStartDate, dept);
        if (!existing) throw error;
        existing.set('weekStartDate', safeWeekStartDate);
        existing.set('dept', dept);
        existing.set('status', 'confirmed');
        $app.save(existing);
        plan = existing;
      }

      const nextRows = ensureWeekdayRows(params.rows);
      const oldRows = findWeekTextRows(plan.id);
      oldRows.forEach((row) => {
        if (!row) return;
        $app.delete(row);
      });

      nextRows.forEach((row) => {
        const record = new Record(rowCollection);
        record.set('planId', plan.id);
        record.set('weekday', row.weekday);
        record.set('channelName', row.channelName);
        record.set('weeklyPlan', row.weeklyPlan);
        record.set('promotionContent', row.promotionContent);
        record.set('targetText', row.targetText);
        record.set('resultText', row.resultText);
        record.set('recruitCountText', row.recruitCountText);
        record.set('ownerName', row.ownerName);
        record.set('note', row.note);
        record.set('sortOrder', row.sortOrder);
        $app.save(record);
      });

      return { ok: true, planId: plan.id };
    };

    const upsertWeekTextRowsForWeekday = (params) => {
      const safeWeekStartDate = formatDateText(parseDateText(params.weekStartDate));
      const dept = String(params.dept ?? '').trim();
      const weekday = normalizeWeekday(params.weekday);
      if (!dept) return { ok: false, reason: 'dept-empty' };
      if (!weekday) return { ok: false, reason: 'weekday-empty' };

      let plan = findWeekTextPlan(safeWeekStartDate, dept);
      if (!plan) {
        const created = upsertWeekTextPlan({
          weekStartDate: safeWeekStartDate,
          dept,
          rows: [],
        });
        if (!created?.ok) return created;
        plan = findWeekTextPlan(safeWeekStartDate, dept);
      }
      if (!plan) return { ok: false, reason: 'plan-create-failed' };

      const rowCollection = $app.findCollectionByNameOrId('recruiting_week_text_rows');
      const rows = findWeekTextRows(plan.id);
      rows
        .filter((row) => normalizeWeekday(row.get('weekday')) === weekday)
        .forEach((row) => $app.delete(row));

      const weekdayRows = normalizeWeekTextRows(params.rows).filter((row) => row.weekday === weekday);
      if (weekdayRows.length === 0) return { ok: true, reason: 'weekday-empty-rows' };

      weekdayRows.forEach((row, index) => {
        const record = new Record(rowCollection);
        record.set('planId', plan.id);
        record.set('weekday', row.weekday);
        record.set('channelName', row.channelName);
        record.set('weeklyPlan', row.weeklyPlan);
        record.set('promotionContent', row.promotionContent);
        record.set('targetText', row.targetText);
        record.set('resultText', row.resultText);
        record.set('recruitCountText', row.recruitCountText);
        record.set('ownerName', row.ownerName);
        record.set('note', row.note);
        record.set('sortOrder', index);
        $app.save(record);
      });

      return { ok: true };
    };

    const findWeekPlan = (weekStartDate, dept) => {
      const weekDate = buildDateMatchParams(weekStartDate);
      try {
        return $app.findFirstRecordByFilter(
          'recruiting_week_plans',
          '(weekStartDate = {:exact} || weekStartDate ~ {:like}) && dept = {:dept}',
          { exact: weekDate.exact, like: weekDate.like, dept },
        );
      } catch {
        return null;
      }
    };

    const findWeekPlanItems = (planId) => {
      return $app.findRecordsByFilter(
        'recruiting_week_plan_items',
        'planId = {:planId}',
        'weekday,sortOrder,created',
        500,
        0,
        { planId },
      );
    };

    const findWeekResults = (weekStartDate, dept) => {
      const weekDate = buildDateMatchParams(weekStartDate);
      return $app.findRecordsByFilter(
        'recruiting_daily_results',
        '(weekStartDate = {:exact} || weekStartDate ~ {:like}) && dept = {:dept}',
        'reportDate',
        500,
        0,
        { exact: weekDate.exact, like: weekDate.like, dept },
      );
    };

    const isUniqueValueError = (error) => String(error ?? '').includes('Value must be unique');

    const upsertRecruitingWeekPlan = (params) => {
      const dept = String(params?.dept ?? '').trim();
      if (!dept) {
        return { ok: false, reason: 'dept-empty' };
      }

      const safeWeekStartDate = formatDateText(parseDateText(params.weekStartDate));
      const planCollection = $app.findCollectionByNameOrId('recruiting_week_plans');
      const itemCollection = $app.findCollectionByNameOrId('recruiting_week_plan_items');

      let plan = findWeekPlan(safeWeekStartDate, dept);
      const wasNew = !plan;
      if (!plan) plan = new Record(planCollection);

      plan.set('weekStartDate', safeWeekStartDate);
      plan.set('dept', dept);
      plan.set('monthTarget', params.monthTarget);
      plan.set('weekTarget', params.weekTarget);
      plan.set('status', 'confirmed');
      try {
        $app.save(plan);
      } catch (error) {
        if (!wasNew || !isUniqueValueError(error)) throw error;

        const existing = findWeekPlan(safeWeekStartDate, dept);
        if (!existing) throw error;

        existing.set('weekStartDate', safeWeekStartDate);
        existing.set('dept', dept);
        existing.set('monthTarget', params.monthTarget);
        existing.set('weekTarget', params.weekTarget);
        existing.set('status', 'confirmed');
        $app.save(existing);
        plan = existing;
      }

      const oldItems = findWeekPlanItems(plan.id);
      oldItems.forEach((item) => {
        if (!item) return;
        $app.delete(item);
      });

      const normalizedItems = params.items
        .map((item, index) => ({
          weekday: normalizeWeekday(item.weekday),
          channelName: String(item.channelName ?? '').trim(),
          promotionContent: String(item.promotionContent ?? '').trim(),
          targetCount: normalizeNullableInt(item.targetCount),
          ownerName: String(item.ownerName ?? '').trim(),
          note: String(item.note ?? '').trim(),
          sortOrder: Number.isFinite(Number(item.sortOrder)) ? Math.trunc(Number(item.sortOrder)) : index,
        }))
        .filter(
          (item) =>
            !!item.weekday &&
            (!!item.channelName ||
              !!item.promotionContent ||
              !!item.ownerName ||
            !!item.note ||
              Number(item.targetCount ?? 0) > 0),
        );

      const fallbackWeekTarget = normalizeNullableInt(params.weekTarget);
      let nextItems = normalizedItems;

      if (nextItems.length === 0 && (fallbackWeekTarget ?? 0) > 0) {
        const base = Math.floor(fallbackWeekTarget / WEEKDAY_ORDER.length);
        let remain = fallbackWeekTarget % WEEKDAY_ORDER.length;
        nextItems = WEEKDAY_ORDER.map((weekday, index) => {
          const add = remain > 0 ? 1 : 0;
          if (remain > 0) remain -= 1;
          return {
            weekday,
            channelName: '',
            promotionContent: '',
            targetCount: base + add,
            ownerName: '',
            note: '주목표 자동분배',
            sortOrder: index,
          };
        });
      }

      nextItems.forEach((item) => {
          const next = new Record(itemCollection);
          next.set('planId', plan.id);
          next.set('weekday', item.weekday);
          next.set('channelName', item.channelName);
          next.set('promotionContent', item.promotionContent);
          next.set('targetCount', item.targetCount);
          next.set('ownerName', item.ownerName);
          next.set('note', item.note);
          next.set('sortOrder', item.sortOrder);
          $app.save(next);
        });

      return { ok: true };
    };

    const upsertRecruitingDailyResult = (params) => {
      const dept = String(params?.dept ?? '').trim();
      if (!dept) return { ok: false, reason: 'dept-empty' };

      const safeReportDate = formatDateText(parseDateText(params.reportDate));
      const safeWeekStartDate = formatDateText(parseDateText(params.weekStartDate));
      const safeWeekday = normalizeWeekday(params.weekday) || toWeekdayKey(safeReportDate);
      const safeActualCount = normalizeNullableInt(params.actualCount);
      if (safeActualCount === null) return { ok: false, reason: 'actualCount-invalid' };

      const collection = $app.findCollectionByNameOrId('recruiting_daily_results');
      const reportDate = buildDateMatchParams(safeReportDate);

      let record = null;
      try {
        record = $app.findFirstRecordByFilter(
          'recruiting_daily_results',
          '(reportDate = {:exact} || reportDate ~ {:like}) && dept = {:dept}',
          { exact: reportDate.exact, like: reportDate.like, dept },
        );
      } catch {
        record = null;
      }

      const target = record || new Record(collection);
      target.set('reportDate', safeReportDate);
      target.set('weekStartDate', safeWeekStartDate);
      target.set('dept', dept);
      target.set('weekday', safeWeekday);
      target.set('actualCount', safeActualCount);
      target.set('sourceType', 'ai');
      target.set('memo', 'AI 자동 추출');
      try {
        $app.save(target);
      } catch (error) {
        if (!!record || !isUniqueValueError(error)) throw error;

        const existing = $app.findFirstRecordByFilter(
          'recruiting_daily_results',
          '(reportDate = {:exact} || reportDate ~ {:like}) && dept = {:dept}',
          { exact: reportDate.exact, like: reportDate.like, dept },
        );

        existing.set('reportDate', safeReportDate);
        existing.set('weekStartDate', safeWeekStartDate);
        existing.set('dept', dept);
        existing.set('weekday', safeWeekday);
        existing.set('actualCount', safeActualCount);
        existing.set('sourceType', 'ai');
        existing.set('memo', 'AI 자동 추출');
        $app.save(existing);
      }

      return { ok: true };
    };

    const requestInfo = e.requestInfo();
    const authHeader = String(requestInfo.headers.authorization ?? '').trim();
    const forwardedProto = String(requestInfo.headers['x-forwarded-proto'] ?? '')
      .split(',')[0]
      .trim();
    const host = String(requestInfo.headers.host ?? e.request?.host ?? '').trim();
    const fallbackBaseUrl = String(process.env.POCKETBASE_INTERNAL_URL ?? process.env.POCKETBASE_URL ?? 'http://127.0.0.1:8090').trim();
    const baseUrl = host ? `${forwardedProto || (e.isTLS() ? 'https' : 'http')}://${host}` : fallbackBaseUrl;

    const callInternalApi = (path, body, timeout = 120) => {
      const response = $http.send({
        url: `${baseUrl}${path}`,
        method: 'POST',
        timeout,
        body: JSON.stringify(body ?? {}),
        headers: {
          'content-type': 'application/json',
          Authorization: authHeader,
        },
      });

      const responseText = toString(response.body);
      const parsed = parseJsonSafely(responseText, {});
      if (response.statusCode < 200 || response.statusCode >= 300) {
        const message = String(parsed?.message ?? responseText ?? '내부 API 호출 실패').trim();
        throw new Error(`${path} 호출 실패 (HTTP ${response.statusCode}) ${message}`);
      }
      return parsed;
    };

    try {
      if (!authHeader) {
        return e.error(400, '인증 헤더를 확인할 수 없습니다.', {});
      }

      const reportDate = normalizeReportDate(payload.reportDate);
      const weekStartDate = buildWeekStartDate(reportDate);
      const reportWeekday = toWeekdayKey(reportDate);
      const testOneOnly = normalizeBool(payload.testOneOnly);
      const warnings = [];

      logger.info('collect started', 'reportDate', reportDate, 'weekStartDate', weekStartDate);

      const todayProbe = callInternalApi('/api/staff-auth-probe', {
        scDay: reportDate,
      }, 60);

      const teamLeadRows = normalizeTeamLeadRows(todayProbe.teamLeadRows);
      const todayTargets = buildUniqueTargets(teamLeadRows);
      const collectTargets = testOneOnly ? todayTargets.slice(0, 1) : todayTargets;

      if (!collectTargets.length) {
        return e.error(400, '해당 일자 팀장 일지를 찾지 못했습니다.', {});
      }

      const missingPlanDepts = collectTargets
        .map((target) => target.dept)
        .filter((dept) => !findWeekPlan(weekStartDate, dept));

      if (missingPlanDepts.length > 0) {
        let mondayTargetsSource = todayTargets;

        if (reportDate !== weekStartDate) {
          const mondayProbe = callInternalApi('/api/staff-auth-probe', {
            scDay: weekStartDate,
          }, 60);
          mondayTargetsSource = buildUniqueTargets(normalizeTeamLeadRows(mondayProbe.teamLeadRows));
        }

        const mondayTargetMap = new Map(mondayTargetsSource.map((target) => [target.dept, target]));
        const bootstrapTargets = missingPlanDepts
          .map((dept) => mondayTargetMap.get(dept))
          .filter((target) => !!target);

        if (bootstrapTargets.length > 0) {
          const mondayAnalyze = callInternalApi('/api/staff-diary/analyze', {
            reportDate: weekStartDate,
            targets: bootstrapTargets,
          });

          const mondayResults = Array.isArray(mondayAnalyze.results) ? mondayAnalyze.results : [];
          mondayResults
            .filter((item) => item && item.ok !== false)
            .forEach((item) => {
              const recruiting = normalizeRecruitingExtract(item.recruiting);
              if (!hasWeekPlanData(recruiting)) return;
              const textRows = ensureWeekdayRows(recruiting.weekTableRows);
              try {
                const result = upsertRecruitingWeekPlan({
                  weekStartDate,
                  dept: String(item.dept ?? '').trim(),
                  monthTarget: recruiting.monthTarget,
                  weekTarget: recruiting.weekTarget,
                  items: recruiting.dailyPlan,
                });
                if (!result?.ok) {
                  warnings.push(`weekPlan skip: ${String(item.dept ?? '-')} (${result?.reason ?? 'unknown'})`);
                }
              } catch (error) {
                warnings.push(`weekPlan error: ${String(item.dept ?? '-')} (${String(error)})`);
              }

              try {
                const textPlanResult = upsertWeekTextPlan({
                  weekStartDate,
                  dept: String(item.dept ?? '').trim(),
                  rows: textRows,
                });
                if (!textPlanResult?.ok) {
                  warnings.push(`weekTextPlan skip: ${String(item.dept ?? '-')} (${textPlanResult?.reason ?? 'unknown'})`);
                }
              } catch (error) {
                warnings.push(`weekTextPlan error: ${String(item.dept ?? '-')} (${String(error)})`);
              }
            });
        }
      }

      const todayAnalyze = callInternalApi('/api/staff-diary/analyze', {
        reportDate,
        targets: collectTargets,
      });
      let finalAlertMessage = String(todayAnalyze.alertMessage ?? '').trim();
      let finalStoppedReason = String(todayAnalyze.stoppedReason ?? '').trim();
      let analysisResults = normalizeAnalyzeResults(todayAnalyze.results);

      const targetKeyMap = new Map();
      collectTargets.forEach((target) => {
        const dept = String(target?.dept ?? '').trim();
        const printUrl = String(target?.printUrl ?? '').trim();
        if (!dept || !printUrl) return;
        targetKeyMap.set(`${dept}||${printUrl}`, {
          dept,
          position: String(target?.position ?? '').trim(),
          staffName: String(target?.staffName ?? '').trim(),
          printUrl,
        });
      });

      const retryTargets = analysisResults
        .filter((item) => !item.ok && shouldRetryAnalyzeError(item.error))
        .map((item) => targetKeyMap.get(`${item.dept}||${item.printUrl}`))
        .filter((item, index, array) => {
          if (!item) return false;
          return array.findIndex((candidate) => `${candidate.dept}||${candidate.printUrl}` === `${item.dept}||${item.printUrl}`) === index;
        });

      if (retryTargets.length > 0) {
        warnings.push(`AI 재시도 시작: ${retryTargets.length}건`);
        sleep(1200);
        try {
          const retryAnalyze = callInternalApi('/api/staff-diary/analyze', {
            reportDate,
            targets: retryTargets,
          });
          const retriedResults = normalizeAnalyzeResults(retryAnalyze.results);
          const retriedMap = new Map(retriedResults.map((item) => [`${item.dept}||${item.printUrl}`, item]));
          let recoveredCount = 0;

          analysisResults = analysisResults.map((item) => {
            const key = `${item.dept}||${item.printUrl}`;
            const retried = retriedMap.get(key);
            if (!retried) return item;
            if (retried.ok) recoveredCount += 1;
            return retried;
          });

          warnings.push(`AI 재시도 완료: 성공 ${recoveredCount}건 / 대상 ${retryTargets.length}건`);
          if (!finalAlertMessage) {
            finalAlertMessage = String(retryAnalyze.alertMessage ?? '').trim();
          }
          if (!finalStoppedReason) {
            finalStoppedReason = String(retryAnalyze.stoppedReason ?? '').trim();
          }
        } catch (error) {
          warnings.push(`AI 재시도 호출 실패: ${String(error)}`);
        }
      }

      analysisResults
        .filter((item) => item.ok)
        .forEach((item) => {
          const safeDept = String(item.dept ?? '').trim();
          if (!safeDept) {
            warnings.push('dailyResult skip: dept-empty');
            return;
          }

          const allWeekTextRows = normalizeWeekTextRows(item.recruiting.weekTableRows);
          const canReplaceWeekTable =
            hasWeekTextContent(allWeekTextRows) && getDistinctWeekdayCount(allWeekTextRows) >= WEEKDAY_ORDER.length;

          if (canReplaceWeekTable) {
            try {
              const textPlanResult = upsertWeekTextPlan({
                weekStartDate,
                dept: safeDept,
                rows: allWeekTextRows,
              });
              if (!textPlanResult?.ok) {
                warnings.push(`weekTextPlan skip: ${safeDept} (${textPlanResult?.reason ?? 'unknown'})`);
              }
            } catch (error) {
              warnings.push(`weekTextPlan error: ${safeDept} (${String(error)})`);
            }
          } else {
            const todayTextRows = allWeekTextRows.filter((row) => row.weekday === reportWeekday);
            if (todayTextRows.length > 0) {
              try {
                const textUpdateResult = upsertWeekTextRowsForWeekday({
                  weekStartDate,
                  dept: safeDept,
                  weekday: reportWeekday,
                  rows: todayTextRows,
                });
                if (!textUpdateResult?.ok) {
                  warnings.push(`weekTextDaily skip: ${safeDept} (${textUpdateResult?.reason ?? 'unknown'})`);
                }
              } catch (error) {
                warnings.push(`weekTextDaily error: ${safeDept} (${String(error)})`);
              }
            }
          }

          const safeActual = normalizeNullableInt(item.recruiting.dailyActualCount);
          if (safeActual === null) {
            warnings.push(`dailyResult skip: ${item.dept || '-'} (actualCount-empty)`);
            return;
          }

          try {
            const result = upsertRecruitingDailyResult({
              reportDate,
              weekStartDate,
              dept: safeDept,
              weekday: reportWeekday,
              actualCount: normalizeRequiredInt(safeActual, 0),
            });
            if (!result?.ok) {
              warnings.push(`dailyResult skip: ${safeDept} (${result?.reason ?? 'unknown'})`);
            }
          } catch (error) {
            warnings.push(`dailyResult error: ${safeDept} (${String(error)})`);
          }
        });

      const deptWeekTables = collectTargets
        .map((target) => {
          const plan = findWeekTextPlan(weekStartDate, target.dept);
          const planRows = plan
            ? findWeekTextRows(plan.id).map((row) => ({
                weekday: normalizeWeekday(row.get('weekday')) || 'mon',
                channelName: String(row.get('channelName') ?? '').trim(),
                weeklyPlan: String(row.get('weeklyPlan') ?? '').trim(),
                promotionContent: String(row.get('promotionContent') ?? '').trim(),
                targetText: String(row.get('targetText') ?? '').trim(),
                resultText: String(row.get('resultText') ?? '').trim(),
                recruitCountText: String(row.get('recruitCountText') ?? '').trim(),
                ownerName: String(row.get('ownerName') ?? '').trim(),
                note: String(row.get('note') ?? '').trim(),
                sortOrder: Math.trunc(Number(row.get('sortOrder') || 0)),
              }))
            : [];
          const rows = ensureWeekdayRows(planRows);
          return {
            dept: target.dept,
            todayWeekday: reportWeekday,
            rows,
          };
        })
        .sort((a, b) => a.dept.localeCompare(b.dept, 'ko'));

      const deptSnapshots = collectTargets
        .map((target) => {
          const plan = findWeekPlan(weekStartDate, target.dept);
          const planItems = plan ? findWeekPlanItems(plan.id) : [];
          const weekResults = findWeekResults(weekStartDate, target.dept);

          const rows = buildSnapshotRows(planItems, weekResults);
          const today = rows.find((row) => row.weekday === reportWeekday) ?? {
            weekday: reportWeekday,
            target: 0,
            actual: 0,
            gap: 0,
          };

          const endIndex = WEEKDAY_ORDER.findIndex((weekday) => weekday === reportWeekday);
          const cumulative = rows.slice(0, endIndex + 1).reduce(
            (acc, row) => {
              acc.target += row.target;
              acc.actual += row.actual;
              acc.gap += row.gap;
              return acc;
            },
            { target: 0, actual: 0, gap: 0 },
          );

          return {
            dept: target.dept,
            monthTarget: plan ? normalizeNullableInt(plan.get('monthTarget')) : null,
            weekTarget: plan ? normalizeNullableInt(plan.get('weekTarget')) : null,
            rows,
            today,
            cumulative,
          };
        })
        .sort((a, b) => a.dept.localeCompare(b.dept, 'ko'));

      logger.info(
        'collect completed',
        'reportDate',
        reportDate,
        'teamLeadCount',
        teamLeadRows.length,
        'collectTargetCount',
        collectTargets.length,
        'testOneOnly',
        testOneOnly,
        'resultCount',
        analysisResults.length,
        'snapshotCount',
        deptSnapshots.length,
        'weekTableCount',
        deptWeekTables.length,
        'warningsCount',
        warnings.length,
      );

      return e.json(200, {
        ok: true,
        isDiaryAccessible: Boolean(todayProbe.isDiaryAccessible),
        teamLeadRows,
        analysisResults,
        deptSnapshots,
        deptWeekTables,
        alertMessage: finalAlertMessage,
        stoppedReason: finalStoppedReason,
        warnings,
      });
    } catch (error) {
      logger.error('collect failed', 'error', `${error}`);
      return e.error(500, '주간 자동 취합 처리에 실패했습니다.', { cause: `${error}` });
    }
  },
  $apis.requireSuperuserAuth(),
);
