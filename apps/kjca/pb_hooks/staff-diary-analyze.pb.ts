// eslint-disable-next-line @typescript-eslint/triple-slash-reference
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
    const parseJsonSafely = (text, fallback) => {
      try {
        return JSON.parse(text);
      } catch {
        return fallback;
      }
    };

    const extractJsonObjectText = (text) => {
      const normalized = String(text ?? '')
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```$/i, '')
        .trim();
      const objectStart = normalized.indexOf('{');
      const objectEnd = normalized.lastIndexOf('}');
      if (objectStart === -1 || objectEnd === -1 || objectEnd <= objectStart) {
        return '{}';
      }
      return normalized.slice(objectStart, objectEnd + 1).trim();
    };

    // ---------- HTTP 헤더/쿠키 처리 유틸 ----------
    const getHeaderValues = (headers, key) => {
      if (!headers) return [];

      const direct = headers[key] ?? headers[key.toLowerCase()] ?? headers[key.toUpperCase()];
      if (Array.isArray(direct)) return direct.map((item) => String(item));
      if (direct !== undefined && direct !== null) return [String(direct)];

      const matchedKey = Object.keys(headers).find((headerKey) => headerKey.toLowerCase() === key.toLowerCase());
      if (!matchedKey) return [];

      const matchedValue = headers[matchedKey];
      if (Array.isArray(matchedValue)) return matchedValue.map((item) => String(item));
      if (matchedValue !== undefined && matchedValue !== null) return [String(matchedValue)];

      return [];
    };

    const normalizeCookieHeader = (cookieHeader) => {
      if (!cookieHeader) return '';

      const cookieMap = {};
      String(cookieHeader)
        .split(';')
        .map((chunk) => chunk.trim())
        .filter((chunk) => !!chunk)
        .forEach((cookiePair) => {
          const separatorIndex = cookiePair.indexOf('=');
          if (separatorIndex === -1) return;
          const name = cookiePair.slice(0, separatorIndex).trim();
          const value = cookiePair.slice(separatorIndex + 1).trim();
          if (!name) return;
          cookieMap[name] = value;
        });

      return Object.keys(cookieMap)
        .map((name) => `${name}=${cookieMap[name]}`)
        .join('; ');
    };

    const extractCookieHeaderFromSetCookie = (setCookieHeaders) => {
      const cookieMap = {};

      setCookieHeaders.forEach((header) => {
        const cookiePair = String(header).split(';')[0].trim();
        if (!cookiePair) return;

        const separatorIndex = cookiePair.indexOf('=');
        if (separatorIndex === -1) return;

        const name = cookiePair.slice(0, separatorIndex).trim();
        const value = cookiePair.slice(separatorIndex + 1).trim();
        if (!name) return;

        cookieMap[name] = value;
      });

      return Object.keys(cookieMap)
        .map((name) => `${name}=${cookieMap[name]}`)
        .join('; ');
    };

    const mergeSetCookieIntoCookieHeader = (cookieHeader, responseHeaders) => {
      const setCookieHeaders = getHeaderValues(responseHeaders, 'Set-Cookie');
      if (!setCookieHeaders.length) return cookieHeader;

      const nextCookie = normalizeCookieHeader(extractCookieHeaderFromSetCookie(setCookieHeaders));
      if (!nextCookie) return cookieHeader;

      const merged = cookieHeader ? `${cookieHeader}; ${nextCookie}` : nextCookie;
      return normalizeCookieHeader(merged);
    };

    const detectAuthRequiredHtml = (html) => {
      const text = String(html ?? '');
      if (text.includes('/staff/auth/login_check') || text.includes('id="mng_id"')) return true;

      const redirectRegex = /location\.href\s*=\s*(?:'|")\s*\/staff\/auth\s*(?:'|")/i;
      return redirectRegex.test(text);
    };

    // ---------- 날짜/필터/해시 유틸 ----------
    const decodeHtmlEntities = (text) => {
      const source = String(text ?? '');
      return source
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    };

    const buildTodayDateText = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = `${now.getMonth() + 1}`.padStart(2, '0');
      const day = `${now.getDate()}`.padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const normalizeReportDate = (value) => {
      const text = String(value ?? '').trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
      return buildTodayDateText();
    };

    const escapeFilterValue = (value) => {
      return String(value ?? '')
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'");
    };

    const hashText = (text) => {
      const source = String(text ?? '');
      let hash = 0x811c9dc5;
      for (let i = 0; i < source.length; i += 1) {
        hash ^= source.charCodeAt(i);
        hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
        hash >>>= 0;
      }
      return `${hash.toString(16).padStart(8, '0')}-${source.length}`;
    };

    // ---------- URL/요청 헤더 구성 유틸 ----------
    const toAbsoluteUrl = (maybeRelativeUrl) => {
      const url = String(maybeRelativeUrl ?? '').trim();
      if (!url) return '';
      if (/^https?:\/\//i.test(url)) return url;
      // printUrl이 `?site=...` 형태로 들어오는 케이스는 `/diary/` 기준으로 보정한다.
      if (url.startsWith('?')) return `${host}/diary/${url}`;
      if (url.startsWith('/?') && url.includes('bd_idx=')) return `${host}/diary${url}`;
      if (url.startsWith('/')) return `${host}${url}`;
      return `${host}/${url}`;
    };

    const isAllowedKjcaUrl = (url) => {
      const normalized = String(url ?? '').trim();
      return (
        normalized.startsWith(`${host}/`) ||
        normalized.startsWith('http://www.kjca.co.kr/') ||
        normalized.startsWith('https://www.kjca.co.kr/')
      );
    };

    const buildBrowserLikeHeaders = (cookieHeader, referer) => {
      const headers = {
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Encoding': 'identity',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
        Host: 'www.kjca.co.kr',
      };

      if (cookieHeader) headers.Cookie = cookieHeader;
      if (referer) headers.Referer = referer;
      return headers;
    };

    // ---------- HTML 본문 추출/정규화 유틸 ----------
    const extractDivInnerHtmlByClasses = (html, requiredClasses) => {
      const source = String(html ?? '');
      if (!source) return '';

      const divStartRegex = /<div\b[^>]*class\s*=\s*(['"])([^'"]*)\1[^>]*>/gi;
      let match = null;
      while ((match = divStartRegex.exec(source))) {
        const classValue = String(match[2] ?? '');
        const ok = requiredClasses.every((cls) => new RegExp(`\\b${cls}\\b`).test(classValue));
        if (!ok) continue;

        const openTagEndIndex = match.index + match[0].length;
        const tokenRegex = /<\/?div\b/gi;
        tokenRegex.lastIndex = openTagEndIndex;
        let depth = 1;

        let tokenMatch = null;
        while ((tokenMatch = tokenRegex.exec(source))) {
          const token = String(tokenMatch[0] ?? '').toLowerCase();
          if (token === '<div') {
            depth += 1;
            continue;
          }

          if (token === '</div') {
            depth -= 1;
            if (depth === 0) {
              const closeTagStartIndex = tokenMatch.index;
              return source.slice(openTagEndIndex, closeTagStartIndex);
            }
          }
        }

        return '';
      }

      return '';
    };

    const htmlToText = (html) => {
      const normalized = String(html ?? '')
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(td|th)>/gi, '\t')
        .replace(/<\/tr>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<li\b[^>]*>/gi, '- ');
      return decodeHtmlEntities(normalized.replace(/<[^>]*>/g, ' '))
        .replace(/\r/g, '')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n[ \t]+/g, '\n')
        .replace(/\t+/g, ' | ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    };

    const normalizeStringArray = (value) => {
      if (!Array.isArray(value)) return [];
      return value.map((v) => String(v ?? '').trim()).filter((v) => !!v);
    };

    const normalizeJsonArrayField = (value) => {
      if (Array.isArray(value)) return normalizeStringArray(value);
      if (value === null || value === undefined) return [];
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return [];
        const parsed = parseJsonSafely(trimmed, null);
        if (Array.isArray(parsed)) return normalizeStringArray(parsed);
        return normalizeStringArray([trimmed]);
      }
      return [];
    };

    // ---------- 분석/결과 정규화 유틸 ----------
    const inferGemini429Cause = (message, detailsText) => {
      const source = `${String(message ?? '')} ${String(detailsText ?? '')}`.toLowerCase();
      if (!source.trim()) return 'unknown';

      const hasQuotaSignal =
        source.includes('quota') ||
        source.includes('billing') ||
        source.includes('free tier') ||
        source.includes('resource_exhausted');
      if (hasQuotaSignal) return 'quota-or-billing-limit';

      const hasRateSignal =
        source.includes('rate') ||
        source.includes('too many requests') ||
        source.includes('per minute') ||
        source.includes('retry');
      if (hasRateSignal) return 'request-rate-limit';

      return 'unknown';
    };

    const stringifyGeminiErrorDetails = (details) => {
      if (!Array.isArray(details)) return '';
      return details
        .map((detail) => {
          if (detail === null || detail === undefined) return '';
          const text = `${detail}`;
          return text === '[object Object]' ? JSON.stringify(detail) : text;
        })
        .join(' | ');
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
        printUrl: params.printUrl,
      };
    };

    const buildPrompt = (params) => {
      return (
        '아래는 업무일지 본문 텍스트야. 부서별로 "홍보", "휴가", "특이사항"을 최대한 빠짐없이 추출해.\n' +
        '반드시 코드펜스 없이 JSON 객체만 반환해.\n' +
        '추출할 내용이 없으면 해당 배열은 빈 배열([])로 반환.\n' +
        '\n' +
        '응답 스키마:\n' +
        '{\n' +
        '  "promotion": ["string"],\n' +
        '  "vacation": ["string"],\n' +
        '  "special": ["string"]\n' +
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

    // ---------- 캐시 조회 키(일자+부서+원본+해시) 구성 ----------
    const buildCacheIdentityFilter = (params) => {
      return (
        `reportDate = '${escapeFilterValue(params.reportDate)}'` +
        ` && dept = '${escapeFilterValue(params.dept)}'` +
        ` && printUrl = '${escapeFilterValue(params.printUrl)}'` +
        ` && sourceHash = '${escapeFilterValue(params.sourceHash)}'`
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
        targetRecord.set('position', params.position);
        targetRecord.set('staffName', params.staffName);
        targetRecord.set('printUrl', params.printUrl);
        targetRecord.set('sourceHash', params.sourceHash);
        targetRecord.set('promotion', params.promotion ?? []);
        targetRecord.set('vacation', params.vacation ?? []);
        targetRecord.set('special', params.special ?? []);
        targetRecord.set('status', 'success');
        targetRecord.set('errorMessage', '');
        targetRecord.set('model', geminiModelName);
        targetRecord.set('promptVersion', 1);
        $app.save(targetRecord);
      } catch (error) {
        logger.warn(
          'cache upsert skipped',
          'dept',
          params.dept,
          'reportDate',
          params.reportDate,
          'error',
          `${error}`,
        );
      }
    };

    // ---------- 메인 요청 처리 ----------
    try {
      const requestStartedAt = nowMs();

      // 1) 요청/권한/필수 설정값 검증
      if (!e.auth) {
        return e.error(401, '인증이 필요합니다.', {});
      }

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

      const geminiApiKey = process.env.GEMINI_API_KEY ?? process.env.GEMINI_AI_KEY;
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
        headers: buildBrowserLikeHeaders('', `${host}/`),
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
        body: loginBody,
        headers: {
          ...buildBrowserLikeHeaders(sessionCookie, staffAuthUrl),
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
        const printUrl = toAbsoluteUrl(String(target.printUrl ?? '').trim());

        if (!dept || !printUrl) {
          logger.warn('target skipped (missing dept/printUrl)', 'index', i, 'dept', dept);
          continue;
        }
        if (!isAllowedKjcaUrl(printUrl)) {
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
          headers: buildBrowserLikeHeaders(sessionCookie, printUrl),
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
        });
        if (cachedRecord) {
          const cachedPromotion = normalizeJsonArrayField(cachedRecord.get('promotion'));
          const cachedVacation = normalizeJsonArrayField(cachedRecord.get('vacation'));
          const cachedSpecial = normalizeJsonArrayField(cachedRecord.get('special'));
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
        const geminiResponse = $http.send({
          url: `https://generativelanguage.googleapis.com/v1beta/models/${geminiModelName}:generateContent?key=${geminiApiKey}`,
          method: 'POST',
          body: JSON.stringify(geminiPayload),
          headers: {
            'content-type': 'application/json',
          },
        });
        const geminiElapsedMs = nowMs() - geminiStartedAt;

        const responseBody = toString(geminiResponse.body);
        const isSuccess = geminiResponse.statusCode >= 200 && geminiResponse.statusCode < 300;
        const parsedErrorBody = parseJsonSafely(responseBody, {});
        const geminiError = parsedErrorBody?.error ?? {};
        const geminiErrorStatus = String(geminiError?.status ?? '').trim();
        const geminiErrorMessage = String(geminiError?.message ?? '').trim();
        const geminiErrorDetailsText = stringifyGeminiErrorDetails(geminiError?.details);
        const retryAfter = getHeaderValues(geminiResponse.headers, 'Retry-After')[0] ?? '';
        const rateLimitRelatedHeaders = {
          retryAfter,
          xRateLimitLimit: getHeaderValues(geminiResponse.headers, 'X-RateLimit-Limit')[0] ?? '',
          xRateLimitRemaining: getHeaderValues(geminiResponse.headers, 'X-RateLimit-Remaining')[0] ?? '',
          xRateLimitReset: getHeaderValues(geminiResponse.headers, 'X-RateLimit-Reset')[0] ?? '',
          xRatelimitLimitRequests: getHeaderValues(geminiResponse.headers, 'x-ratelimit-limit-requests')[0] ?? '',
          xRatelimitRemainingRequests:
            getHeaderValues(geminiResponse.headers, 'x-ratelimit-remaining-requests')[0] ?? '',
          xRatelimitLimitTokens: getHeaderValues(geminiResponse.headers, 'x-ratelimit-limit-tokens')[0] ?? '',
          xRatelimitRemainingTokens: getHeaderValues(geminiResponse.headers, 'x-ratelimit-remaining-tokens')[0] ?? '',
        };
        logger.info(
          'gemini completed',
          'index',
          i,
          'statusCode',
          geminiResponse.statusCode,
          'elapsed',
          toMsText(geminiElapsedMs),
          'responseLength',
          responseBody.length,
          'retryAfter',
          retryAfter,
        );

        if (!isSuccess) {
          logger.warn(
            'gemini failed detail',
            'index',
            i,
            'statusCode',
            geminiResponse.statusCode,
            'errorStatus',
            geminiErrorStatus,
            'errorMessage',
            geminiErrorMessage,
            'errorDetails',
            geminiErrorDetailsText,
            'rateLimitHeaders',
            JSON.stringify(rateLimitRelatedHeaders),
          );
        }

        const rateLimitCauseGuess =
          geminiResponse.statusCode === 429 ? inferGemini429Cause(geminiErrorMessage, geminiErrorDetailsText) : '';

        if (geminiResponse.statusCode === 429) {
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
          results.push(
            buildAnalyzeResult({
              dept,
              position,
              staffName,
              ok: false,
              error: `AI 요청 실패 (HTTP ${geminiResponse.statusCode})`,
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
        );

        upsertSuccessCache({
          reportDate,
          dept,
          position,
          staffName,
          printUrl,
          sourceHash,
          promotion,
          vacation,
          special,
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
