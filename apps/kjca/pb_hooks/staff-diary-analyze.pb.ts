// @ts-nocheck
/// <reference path="types.d.ts" />

routerAdd(
  'POST',
  '/api/staff-diary/analyze',
  (e) => {
    const logger = $app.logger().with('hook', 'staff-diary-analyze');

    const host = 'http://www.kjca.co.kr';
    const loginUrl = `${host}/staff/auth/login_check`;
    const staffAuthUrl = `${host}/staff/auth`;

    const nowMs = () => Date.now();
    const toMsText = (ms) => `${Math.max(0, Number(ms) || 0)}ms`;

    const payload = new DynamicModel({
      targets: [],
      reportDate: '',
    });
    e.bindBody(payload);

    // ---------- JSON/응답 파싱 유틸 ----------
    const {
      parseJsonSafely,
      extractJsonObjectText,
      getHeaderValues,
      mergeSetCookieIntoCookieHeader,
      detectAuthRequiredHtml,
      normalizeReportDate,
      escapeFilterValue,
      hashText,
      toAbsoluteKjcaUrl,
      isAllowedKjcaUrl,
      buildBrowserLikeHeaders,
      extractDivInnerHtmlByClasses,
      htmlToText,
      normalizeStringArray,
      normalizeJsonArrayField,
      inferGemini429Cause,
      stringifyGeminiErrorDetails,
    } = require(`${__hooks}/utils.ts`);

    // ---------- 분석/결과 정규화 유틸 ----------
    const normalizeNullableInt = (value) => {
      if (value === null || value === undefined || value === '') return null;
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return null;
      return Math.max(0, Math.trunc(parsed));
    };

    const normalizeRecruitingWeekday = (value) => {
      const text = String(value ?? '')
        .trim()
        .toLowerCase();
      if (text === 'mon' || text === 'monday' || text === '월') return 'mon';
      if (text === 'tue' || text === 'tuesday' || text === '화') return 'tue';
      if (text === 'wed' || text === 'wednesday' || text === '수') return 'wed';
      if (text === 'thu' || text === 'thursday' || text === '목') return 'thu';
      if (text === 'fri' || text === 'friday' || text === '금') return 'fri';
      return '';
    };

    const normalizeRecruitingExtract = (value) => {
      const source = value && typeof value === 'object' ? value : {};
      const dailyPlanRaw = Array.isArray(source.dailyPlan) ? source.dailyPlan : [];
      const dailyPlan = dailyPlanRaw
        .map((item) => {
          const row = item && typeof item === 'object' ? item : {};
          const weekday = normalizeRecruitingWeekday(row.weekday);
          if (!weekday) return null;
          return {
            weekday,
            channelName: String(row.channelName ?? '').trim(),
            promotionContent: String(row.promotionContent ?? '').trim(),
            targetCount: normalizeNullableInt(row.targetCount),
            ownerName: String(row.ownerName ?? '').trim(),
            note: String(row.note ?? '').trim(),
          };
        })
        .filter((row) => !!row);

      const weekTableRowsRaw = Array.isArray(source.weekTableRows) ? source.weekTableRows : [];
      const weekTableRowsNormalized = weekTableRowsRaw
        .map((item) => {
          const row = item && typeof item === 'object' ? item : {};
          const weekday = normalizeRecruitingWeekday(row.weekday);
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
          channelName: String(row.channelName ?? '').trim(),
          weeklyPlan: '',
          promotionContent: String(row.promotionContent ?? '').trim(),
          targetText: row.targetCount === null ? '' : String(row.targetCount),
          resultText: '',
          recruitCountText: '',
          ownerName: String(row.ownerName ?? '').trim(),
          note: String(row.note ?? '').trim(),
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
        weekTableRows: weekTableRowsNormalized.length > 0 ? weekTableRowsNormalized : weekTableRowsFallback,
      };
    };

    const normalizeCachedRecruitingField = (value) => {
      if (value === null || value === undefined) return normalizeRecruitingExtract({});
      if (typeof value === 'string') {
        const text = value.trim();
        if (!text) return normalizeRecruitingExtract({});
        return normalizeRecruitingExtract(parseJsonSafely(text, {}));
      }
      if (Array.isArray(value)) {
        const isNumericByteArray = value.every((item) => Number.isInteger(item) && item >= 0 && item <= 255);
        if (!isNumericByteArray) return normalizeRecruitingExtract({});
        const text = String(toString(value) ?? '').trim();
        if (!text) return normalizeRecruitingExtract({});
        return normalizeRecruitingExtract(parseJsonSafely(text, {}));
      }
      return normalizeRecruitingExtract(value);
    };

    const buildAnalyzeResult = (params) => {
      return {
        dept: params.dept,
        position: params.position,
        staffName: params.staffName,
        ok: params.ok !== false,
        error: params.error,
        promotion: params.promotion ?? [],
        vacation: params.vacation ?? [],
        special: params.special ?? [],
        recruiting: normalizeRecruitingExtract(params.recruiting),
        printUrl: params.printUrl,
      };
    };

    const buildPrompt = (params) => {
      return (
        '아래는 업무일지 본문 텍스트야. 부서별로 "모집/홍보", "휴가", "특이사항"을 최대한 빠짐없이 추출해.\n' +
        '"모집"과 "홍보"는 같은 범주로 보고 모두 promotion 배열에 넣어.\n' +
        '추가로 모집/현황 비교에 필요한 구조화 정보(recruiting)도 함께 추출해.\n' +
        'recruiting.dailyPlan은 요일별 계획표(월~금)를 읽어 배열로 만들어.\n' +
        'recruiting.dailyActualCount는 당일 모집 실적(예: 모집 1명)을 숫자로 넣어.\n' +
        'recruiting.weekTableRows에는 "요일, 주간 홍보계획, 결과, 담당자, 비고, 모집홍보처, 모집 홍보내용, 모집목표, 모집 건수"를 텍스트로 최대한 보존해.\n' +
        '값이 없거나 판단 불가면 반드시 null을 넣어.\n' +
        '반드시 코드펜스 없이 JSON 객체만 반환해.\n' +
        '추출할 내용이 없으면 해당 배열은 빈 배열([])로 반환.\n' +
        '\n' +
        '응답 스키마:\n' +
        '{\n' +
        '  "promotion": ["string"],\n' +
        '  "vacation": ["string"],\n' +
        '  "special": ["string"],\n' +
        '  "recruiting": {\n' +
        '    "monthTarget": number | null,\n' +
        '    "monthAssignedCurrent": number | null,\n' +
        '    "weekTarget": number | null,\n' +
        '    "dailyPlan": [\n' +
        '      {\n' +
        '        "weekday": "mon" | "tue" | "wed" | "thu" | "fri",\n' +
        '        "channelName": "string",\n' +
        '        "promotionContent": "string",\n' +
        '        "targetCount": number | null,\n' +
        '        "ownerName": "string",\n' +
        '        "note": "string"\n' +
        '      }\n' +
        '    ],\n' +
        '    "dailyActualCount": number | null,\n' +
        '    "weekTableRows": [\n' +
        '      {\n' +
        '        "weekday": "mon" | "tue" | "wed" | "thu" | "fri",\n' +
        '        "channelName": "string",\n' +
        '        "weeklyPlan": "string",\n' +
        '        "promotionContent": "string",\n' +
        '        "targetText": "string",\n' +
        '        "resultText": "string",\n' +
        '        "recruitCountText": "string",\n' +
        '        "ownerName": "string",\n' +
        '        "note": "string"\n' +
        '      }\n' +
        '    ]\n' +
        '  }\n' +
        '}\n' +
        '\n' +
        `부서: ${params.dept}\n` +
        (params.staffName ? `성명: ${params.staffName}\n` : '') +
        '\n' +
        '본문:\n' +
        params.docText
      );
    };

    const cacheCollectionName = 'staff_diary_analysis_cache';
    const geminiModelName = 'gemini-2.5-flash-lite';
    const geminiApiKey = process.env.GEMINI_API_KEY ?? process.env.GEMINI_AI_KEY;
    const promptVersion = 4;
    const geminiMaxAttempts = 3;

    const parseRetryAfterMs = (value) => {
      const text = String(value ?? '').trim();
      if (!text) return 0;
      const parsed = Number(text);
      if (!Number.isFinite(parsed) || parsed <= 0) return 0;
      return Math.trunc(parsed * 1000);
    };

    const computeRetryDelayMs = (attempt, retryAfterHeader = '') => {
      const retryAfterMs = parseRetryAfterMs(retryAfterHeader);
      if (retryAfterMs > 0) return retryAfterMs;
      const step = Math.max(0, Number(attempt) - 1);
      const backoffMs = 1500 * 2 ** step;
      const jitterMs = Math.trunc(Math.random() * 400);
      return backoffMs + jitterMs;
    };

    const isRetryableGeminiHttp = (statusCode, rateLimitCauseGuess = '') => {
      if (statusCode === 429 && rateLimitCauseGuess === 'quota-or-billing-limit') return false;
      return statusCode === 429 || statusCode === 500 || statusCode === 502 || statusCode === 503 || statusCode === 504;
    };

    const isRetryableGeminiTransportError = (errorText) => {
      const text = String(errorText ?? '').toLowerCase();
      if (!text) return false;
      return (
        text.includes('timeout') ||
        text.includes('deadline') ||
        text.includes('temporarily unavailable') ||
        text.includes('connection reset') ||
        text.includes('connection refused') ||
        text.includes('eof')
      );
    };

    const requestGeminiWithRetry = (geminiPayload, context) => {
      let lastStatusCode = 0;
      let lastResponseBody = '';
      let lastHeaders = {};
      let lastTransportError = '';
      let attempts = 0;

      while (attempts < geminiMaxAttempts) {
        attempts += 1;
        const attemptStartedAt = nowMs();

        try {
          const response = $http.send({
            url: `https://generativelanguage.googleapis.com/v1beta/models/${geminiModelName}:generateContent?key=${geminiApiKey}`,
            method: 'POST',
            timeout: 60,
            body: JSON.stringify(geminiPayload),
            headers: {
              'content-type': 'application/json',
            },
          });

          const elapsedMs = nowMs() - attemptStartedAt;
          const statusCode = Number(response.statusCode || 0);
          const responseBody = toString(response.body);
          const headers = response.headers ?? {};
          const retryAfter = getHeaderValues(headers, 'Retry-After')[0] ?? '';
          const parsedErrorBody = parseJsonSafely(responseBody, {});
          const geminiError = parsedErrorBody?.error ?? {};
          const geminiErrorMessage = String(geminiError?.message ?? '').trim();
          const geminiErrorDetailsText = stringifyGeminiErrorDetails(geminiError?.details);
          const rateLimitCauseGuess =
            statusCode === 429 ? inferGemini429Cause(geminiErrorMessage, geminiErrorDetailsText) : '';

          lastStatusCode = statusCode;
          lastResponseBody = responseBody;
          lastHeaders = headers;
          lastTransportError = '';

          const isSuccess = statusCode >= 200 && statusCode < 300;
          if (isSuccess) {
            return {
              statusCode,
              responseBody,
              headers,
              attempts,
              elapsedMs,
              transportError: '',
            };
          }

          const canRetry = attempts < geminiMaxAttempts && isRetryableGeminiHttp(statusCode, rateLimitCauseGuess);
          if (!canRetry) {
            return {
              statusCode,
              responseBody,
              headers,
              attempts,
              elapsedMs,
              transportError: '',
            };
          }

          const delayMs = computeRetryDelayMs(attempts, retryAfter);
          logger.warn(
            'gemini retry scheduled',
            'index',
            context.index,
            'dept',
            context.dept,
            'attempt',
            attempts,
            'statusCode',
            statusCode,
            'delay',
            toMsText(delayMs),
          );
          sleep(delayMs);
        } catch (error) {
          const elapsedMs = nowMs() - attemptStartedAt;
          const errorText = String(error ?? '').trim();

          lastStatusCode = 0;
          lastResponseBody = '';
          lastHeaders = {};
          lastTransportError = errorText;

          const canRetry = attempts < geminiMaxAttempts && isRetryableGeminiTransportError(errorText);
          if (!canRetry) {
            return {
              statusCode: 0,
              responseBody: '',
              headers: {},
              attempts,
              elapsedMs,
              transportError: errorText,
            };
          }

          const delayMs = computeRetryDelayMs(attempts);
          logger.warn(
            'gemini retry scheduled (transport)',
            'index',
            context.index,
            'dept',
            context.dept,
            'attempt',
            attempts,
            'error',
            errorText,
            'delay',
            toMsText(delayMs),
          );
          sleep(delayMs);
        }
      }

      return {
        statusCode: lastStatusCode,
        responseBody: lastResponseBody,
        headers: lastHeaders,
        attempts,
        elapsedMs: 0,
        transportError: lastTransportError,
      };
    };

    // ---------- 캐시 조회 키(일자+부서+원본+해시+프롬프트버전) 구성 ----------
    const buildCacheIdentityFilter = (params) => {
      const reportDateExact = String(params.reportDate ?? '').trim();
      const reportDateLike = `${reportDateExact}%`;
      return (
        `(reportDate = '${escapeFilterValue(reportDateExact)}' || reportDate ~ '${escapeFilterValue(reportDateLike)}')` +
        ` && dept = '${escapeFilterValue(params.dept)}'` +
        ` && printUrl = '${escapeFilterValue(params.printUrl)}'` +
        ` && sourceHash = '${escapeFilterValue(params.sourceHash)}'` +
        ` && promptVersion = ${Number(params.promptVersion) || 1}`
      );
    };

    const findSuccessCache = (params) => {
      const filter = `${buildCacheIdentityFilter(params)} && status = 'success'`;

      try {
        return $app.findFirstRecordByFilter(cacheCollectionName, filter);
      } catch {
        return null;
      }
    };

    const upsertSuccessCache = (params) => {
      try {
        const collection = $app.findCollectionByNameOrId(cacheCollectionName);
        const lookupFilter = buildCacheIdentityFilter(params);

        let record = null;
        try {
          record = $app.findFirstRecordByFilter(cacheCollectionName, lookupFilter);
        } catch {
          record = null;
        }

        const targetRecord = record || new Record(collection);
        targetRecord.set('reportDate', params.reportDate);
        targetRecord.set('dept', params.dept);
        targetRecord.set('staffName', params.staffName);
        targetRecord.set('printUrl', params.printUrl);
        targetRecord.set('sourceHash', params.sourceHash);
        targetRecord.set('promotion', params.promotion ?? []);
        targetRecord.set('vacation', params.vacation ?? []);
        targetRecord.set('special', params.special ?? []);
        targetRecord.set('recruiting', params.recruiting ?? {});
        targetRecord.set('status', 'success');
        targetRecord.set('errorMessage', '');
        targetRecord.set('model', geminiModelName);
        targetRecord.set('promptVersion', params.promptVersion);
        $app.save(targetRecord);
      } catch (error) {
        logger.warn('cache upsert skipped', 'dept', params.dept, 'reportDate', params.reportDate, 'error', `${error}`);
      }
    };

    // ---------- 메인 요청 처리 ----------
    try {
      const requestStartedAt = nowMs();

      // 1) 요청/권한/필수 설정값 검증
      const targets = Array.isArray(payload.targets) ? payload.targets : [];
      const reportDate = normalizeReportDate(payload.reportDate);
      if (!targets.length) {
        return e.error(400, 'targets가 필요합니다.', {});
      }
      if (targets.length > 50) {
        return e.error(400, 'targets는 최대 50개까지 지원합니다.', {});
      }

      const superuserEmail = String(e.auth.getString('email') ?? '').trim();
      if (!superuserEmail) {
        return e.error(400, '슈퍼유저 이메일 정보를 확인할 수 없습니다.', {});
      }

      let userRecord = null;
      try {
        userRecord = $app.findAuthRecordByEmail('users', superuserEmail);
      } catch {
        userRecord = null;
      }

      if (!userRecord) {
        return e.error(400, `users 컬렉션에서 로그인 계정(${superuserEmail})을 찾지 못했습니다.`, {});
      }

      const mngId = String(userRecord.getString('name') ?? '').trim();
      const mngPw = String(userRecord.getString('kjcaPw') ?? '').trim();
      if (!mngId || !mngPw) {
        return e.error(400, 'KJCA 계정 정보가 필요합니다. (users.name=mng_id, users.kjcaPw=mng_pw)', {});
      }

      if (!geminiApiKey) {
        return e.error(500, 'GEMINI_API_KEY (또는 GEMINI_AI_KEY)가 설정되지 않았습니다.', {});
      }

      logger.info('request started', 'targetsCount', targets.length);

      let sessionCookie = '';

      // 2) KJCA 로그인 세션 확보 (사전 auth 진입 -> 로그인)
      const authInitStartedAt = nowMs();
      const staffAuthInitResponse = $http.send({
        url: staffAuthUrl,
        method: 'GET',
        timeout: 20,
        headers: buildBrowserLikeHeaders(host, '', `${host}/`),
      });
      sessionCookie = mergeSetCookieIntoCookieHeader(sessionCookie, staffAuthInitResponse.headers);
      logger.info(
        'staff/auth init completed',
        'statusCode',
        staffAuthInitResponse.statusCode,
        'elapsed',
        toMsText(nowMs() - authInitStartedAt),
      );

      const loginBody =
        `url=${encodeURIComponent('/board/admin')}` +
        '&sf_mobile_key=' +
        '&sf_alarm_key=' +
        `&mng_id=${encodeURIComponent(mngId)}` +
        `&mng_pw=${encodeURIComponent(mngPw)}`;

      const loginStartedAt = nowMs();
      const loginResponse = $http.send({
        url: loginUrl,
        method: 'POST',
        timeout: 20,
        body: loginBody,
        headers: {
          ...buildBrowserLikeHeaders(host, sessionCookie, staffAuthUrl),
          'content-type': 'application/x-www-form-urlencoded',
          Origin: host,
        },
      });
      sessionCookie = mergeSetCookieIntoCookieHeader(sessionCookie, loginResponse.headers);
      logger.info(
        'login_check completed',
        'statusCode',
        loginResponse.statusCode,
        'setCookieCount',
        getHeaderValues(loginResponse.headers, 'Set-Cookie').length,
        'elapsed',
        toMsText(nowMs() - loginStartedAt),
      );

      if (!sessionCookie) {
        return e.error(500, '세션 쿠키를 확보하지 못했습니다.', {});
      }

      const results = [];
      let stoppedReason = '';
      let alertMessage = '';

      // 3) 타겟별 처리: 원문 조회 -> 본문 추출 -> 캐시 조회 -> AI 분석 -> 캐시 저장
      for (let i = 0; i < targets.length; i += 1) {
        const targetStartedAt = nowMs();
        const target = targets[i] || {};
        const dept = String(target.dept ?? '').trim();
        const position = String(target.position ?? '').trim();
        const staffName = String(target.staffName ?? '').trim();
        const printUrl = toAbsoluteKjcaUrl(host, String(target.printUrl ?? '').trim());

        if (!dept || !printUrl) {
          logger.warn('target skipped (missing dept/printUrl)', 'index', i, 'dept', dept);
          continue;
        }
        if (!isAllowedKjcaUrl(host, printUrl)) {
          logger.warn('target skipped (not allowed url)', 'index', i, 'dept', dept);
          continue;
        }

        logger.info(
          'target started',
          'index',
          i,
          'dept',
          dept,
          'position',
          position,
          'staffName',
          staffName,
          'printUrl',
          printUrl,
        );

        const detailStartedAt = nowMs();
        const detailResponse = $http.send({
          url: printUrl,
          method: 'GET',
          timeout: 20,
          headers: buildBrowserLikeHeaders(host, sessionCookie, printUrl),
        });
        sessionCookie = mergeSetCookieIntoCookieHeader(sessionCookie, detailResponse.headers);

        const detailHtml = toString(detailResponse.body);
        logger.info(
          'target page fetched',
          'index',
          i,
          'statusCode',
          detailResponse.statusCode,
          'htmlLength',
          detailHtml.length,
          'hasDocTextToken',
          detailHtml.includes('doc_text'),
          'hasEditorToken',
          detailHtml.includes('editor'),
          'elapsed',
          toMsText(nowMs() - detailStartedAt),
        );

        // 3-1) 페이지 접근 실패/인증 요구 처리
        if (detailResponse.statusCode < 200 || detailResponse.statusCode >= 300) {
          results.push(
            buildAnalyzeResult({
              dept,
              position,
              staffName,
              ok: false,
              error: `원본 페이지 조회 실패 (HTTP ${detailResponse.statusCode})`,
              printUrl,
            }),
          );
          continue;
        }

        if (detectAuthRequiredHtml(detailHtml)) {
          logger.warn('target auth required', 'index', i, 'dept', dept, 'elapsed', toMsText(nowMs() - targetStartedAt));
          results.push(
            buildAnalyzeResult({
              dept,
              position,
              staffName,
              ok: false,
              error: '로그인이 필요합니다.',
              printUrl,
            }),
          );
          continue;
        }

        // 3-2) 본문(doc_text) 추출 및 텍스트 정규화
        const extractStartedAt = nowMs();
        const docInnerHtml =
          extractDivInnerHtmlByClasses(detailHtml, ['doc_text', 'editor']) ||
          extractDivInnerHtmlByClasses(detailHtml, ['doc_text']);
        const docText = htmlToText(docInnerHtml);
        const sourceHash = hashText(docText);
        logger.info(
          'doc_text extracted',
          'index',
          i,
          'docInnerHtmlLength',
          String(docInnerHtml ?? '').length,
          'docTextLength',
          docText.length,
          'sourceHash',
          sourceHash,
          'elapsed',
          toMsText(nowMs() - extractStartedAt),
        );

        if (!docText) {
          logger.warn(
            'doc_text.editor not found/empty',
            'index',
            i,
            'dept',
            dept,
            'elapsed',
            toMsText(nowMs() - targetStartedAt),
          );
          results.push(
            buildAnalyzeResult({
              dept,
              position,
              staffName,
              ok: false,
              error: `본문 영역(doc_text)을 찾지 못했습니다. (HTTP ${detailResponse.statusCode})`,
              printUrl,
            }),
          );
          continue;
        }

        logger.info(
          'doc_text sample',
          'index',
          i,
          'sample',
          docText.length > 240 ? `${docText.slice(0, 240)}...` : docText,
        );

        // 3-3) 동일 원문 캐시 hit 시 AI 호출 없이 즉시 반환
        const cachedRecord = findSuccessCache({
          reportDate,
          dept,
          printUrl,
          sourceHash,
          promptVersion,
        });
        if (cachedRecord) {
          const cachedPromotion = normalizeJsonArrayField(cachedRecord.get('promotion'));
          const cachedVacation = normalizeJsonArrayField(cachedRecord.get('vacation'));
          const cachedSpecial = normalizeJsonArrayField(cachedRecord.get('special'));
          const cachedRecruiting = normalizeCachedRecruitingField(cachedRecord.get('recruiting'));
          logger.info(
            'cache hit',
            'index',
            i,
            'dept',
            dept,
            'reportDate',
            reportDate,
            'promotionCount',
            cachedPromotion.length,
            'vacationCount',
            cachedVacation.length,
            'specialCount',
            cachedSpecial.length,
            'dailyPlanCount',
            cachedRecruiting.dailyPlan.length,
            'dailyActualCount',
            cachedRecruiting.dailyActualCount,
          );
          results.push(
            buildAnalyzeResult({
              dept,
              position,
              staffName,
              ok: true,
              promotion: cachedPromotion,
              vacation: cachedVacation,
              special: cachedSpecial,
              recruiting: cachedRecruiting,
              printUrl,
            }),
          );
          continue;
        }

        // 3-4) AI 분석 요청
        const prompt = buildPrompt({
          dept,
          staffName,
          docText,
        });

        const geminiPayload = {
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
          },
        };

        const geminiStartedAt = nowMs();
        const geminiAttemptResult = requestGeminiWithRetry(geminiPayload, {
          index: i,
          dept,
        });
        const geminiElapsedMs = nowMs() - geminiStartedAt;

        const responseBody = String(geminiAttemptResult.responseBody ?? '');
        const geminiStatusCode = Number(geminiAttemptResult.statusCode || 0);
        const geminiHeaders = geminiAttemptResult.headers ?? {};
        const isSuccess = geminiStatusCode >= 200 && geminiStatusCode < 300;
        const parsedErrorBody = parseJsonSafely(responseBody, {});
        const geminiError = parsedErrorBody?.error ?? {};
        const geminiErrorStatus = String(geminiError?.status ?? '').trim();
        const geminiErrorMessage = String(geminiError?.message ?? '').trim();
        const geminiErrorDetailsText = stringifyGeminiErrorDetails(geminiError?.details);
        const retryAfter = getHeaderValues(geminiHeaders, 'Retry-After')[0] ?? '';
        const rateLimitRelatedHeaders = {
          retryAfter,
          xRateLimitLimit: getHeaderValues(geminiHeaders, 'X-RateLimit-Limit')[0] ?? '',
          xRateLimitRemaining: getHeaderValues(geminiHeaders, 'X-RateLimit-Remaining')[0] ?? '',
          xRateLimitReset: getHeaderValues(geminiHeaders, 'X-RateLimit-Reset')[0] ?? '',
          xRatelimitLimitRequests: getHeaderValues(geminiHeaders, 'x-ratelimit-limit-requests')[0] ?? '',
          xRatelimitRemainingRequests: getHeaderValues(geminiHeaders, 'x-ratelimit-remaining-requests')[0] ?? '',
          xRatelimitLimitTokens: getHeaderValues(geminiHeaders, 'x-ratelimit-limit-tokens')[0] ?? '',
          xRatelimitRemainingTokens: getHeaderValues(geminiHeaders, 'x-ratelimit-remaining-tokens')[0] ?? '',
        };
        logger.info(
          'gemini completed',
          'index',
          i,
          'statusCode',
          geminiStatusCode,
          'attempts',
          geminiAttemptResult.attempts,
          'elapsed',
          toMsText(geminiElapsedMs),
          'responseLength',
          responseBody.length,
          'retryAfter',
          retryAfter,
          'transportError',
          String(geminiAttemptResult.transportError ?? ''),
        );

        if (!isSuccess) {
          logger.warn(
            'gemini failed detail',
            'index',
            i,
            'statusCode',
            geminiStatusCode,
            'errorStatus',
            geminiErrorStatus,
            'errorMessage',
            geminiErrorMessage,
            'errorDetails',
            geminiErrorDetailsText,
            'transportError',
            String(geminiAttemptResult.transportError ?? ''),
            'rateLimitHeaders',
            JSON.stringify(rateLimitRelatedHeaders),
          );
        }

        const rateLimitCauseGuess =
          geminiStatusCode === 429 ? inferGemini429Cause(geminiErrorMessage, geminiErrorDetailsText) : '';

        if (geminiStatusCode === 429) {
          logger.warn(
            'gemini rate limit classified',
            'index',
            i,
            'causeGuess',
            rateLimitCauseGuess,
            'retryAfter',
            retryAfter,
          );
        }

        // 3-5) 실패 시 중단 조건(쿼터 소진) 확인
        if (!isSuccess) {
          const errorText =
            geminiStatusCode > 0
              ? `AI 요청 실패 (HTTP ${geminiStatusCode})`
              : `AI 요청 실패 (네트워크/타임아웃) ${String(geminiAttemptResult.transportError ?? '').trim()}`;

          results.push(
            buildAnalyzeResult({
              dept,
              position,
              staffName,
              ok: false,
              error: errorText,
              printUrl,
            }),
          );

          if (rateLimitCauseGuess === 'quota-or-billing-limit') {
            stoppedReason = 'quota-exceeded';
            alertMessage =
              'Gemini 무료 쿼터가 소진되어 분석을 중단했습니다. 잠시 후 다시 시도하거나 과금/플랜을 확인해주세요.';
            logger.warn(
              'analysis stopped by quota limit',
              'index',
              i,
              'resultsCount',
              results.length,
              'targetsCount',
              targets.length,
            );
            break;
          }

          continue;
        }

        // 3-6) AI 응답 파싱/정규화 후 캐시 저장
        const parseStartedAt = nowMs();
        const geminiPayloadJson = parseJsonSafely(responseBody, {});
        const geminiText = geminiPayloadJson?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        const normalizedJsonText = extractJsonObjectText(geminiText);
        const parsed = parseJsonSafely(normalizedJsonText, {});
        const promotion = normalizeStringArray(parsed?.promotion);
        const vacation = normalizeStringArray(parsed?.vacation);
        const special = normalizeStringArray(parsed?.special);
        const recruiting = normalizeRecruitingExtract(parsed?.recruiting);
        logger.info(
          'gemini parsed',
          'index',
          i,
          'elapsed',
          toMsText(nowMs() - parseStartedAt),
          'promotionCount',
          promotion.length,
          'vacationCount',
          vacation.length,
          'specialCount',
          special.length,
          'dailyPlanCount',
          recruiting.dailyPlan.length,
          'dailyActualCount',
          recruiting.dailyActualCount,
        );

        upsertSuccessCache({
          reportDate,
          dept,
          position,
          staffName,
          printUrl,
          sourceHash,
          promptVersion,
          promotion,
          vacation,
          special,
          recruiting,
        });

        results.push(
          buildAnalyzeResult({
            dept,
            position,
            staffName,
            ok: true,
            promotion,
            vacation,
            special,
            recruiting,
            printUrl,
          }),
        );

        logger.info('target completed', 'index', i, 'dept', dept, 'elapsed', toMsText(nowMs() - targetStartedAt));
      }

      logger.info('request completed', 'resultsCount', results.length, 'elapsed', toMsText(nowMs() - requestStartedAt));

      return e.json(200, {
        ok: true,
        results,
        stoppedReason,
        alertMessage,
      });
    } catch (error) {
      logger.error('request failed', 'error', `${error}`);
      return e.error(500, '분석 처리에 실패했습니다.', { cause: `${error}` });
    }
  },
  $apis.requireSuperuserAuth(),
);
