// eslint-disable-next-line @typescript-eslint/triple-slash-reference
// @ts-nocheck

routerAdd('POST', '/api/staff-auth-probe', (e) => {
  const logger = $app.logger().with('hook', 'staff-auth-probe');

  const host = 'http://www.kjca.co.kr';
  const loginUrl = `${host}/staff/auth/login_check`;
  const staffAuthUrl = `${host}/staff/auth`;

  const payload = new DynamicModel({
    scDayStart: '',
    scDayEnd: '',
  });
  e.bindBody(payload);

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

      // 같은 이름 쿠키는 마지막 값으로 덮어쓴다.
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

    // 인증 필요 시 Message 페이지로 내려오면서 JS로 /staff/auth로 이동시키는 케이스가 있다.
    const redirectRegex = /location\.href\s*=\s*(?:'|")\s*\/staff\/auth\s*(?:'|")/i;
    return redirectRegex.test(text);
  };

  const decodeHtmlEntities = (text) => {
    const source = String(text ?? '');
    // 필요한 최소 범위만 처리 (MVP)
    return source
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  };

  const stripTags = (html) => {
    return decodeHtmlEntities(String(html ?? '').replace(/<[^>]*>/g, '')).trim();
  };

  const toAbsoluteUrl = (maybeRelativeUrl) => {
    const url = String(maybeRelativeUrl ?? '').trim();
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    // 목록의 "인쇄" 링크는 `?site=...` 처럼 쿼리만 내려오는 케이스가 있어 `/diary/`를 기준으로 붙인다.
    if (url.startsWith('?')) return `${host}/diary/${url}`;
    // `/?site=...&...&bd_idx=...` 형태도 실사용은 `/diary/?...`인 케이스가 있어 보정한다.
    if (url.startsWith('/?') && url.includes('bd_idx=')) return `${host}/diary${url}`;
    if (url.startsWith('/')) return `${host}${url}`;
    return `${host}/${url}`;
  };

  const extractPrintUrlFromCell = (cellHtml) => {
    const source = decodeHtmlEntities(String(cellHtml ?? ''));
    if (!source) return '';

    const candidates = [];
    const quotedUrlRegex = /['"]((?:https?:\/\/|\/|\?)[^'"]+)['"]/gi;
    let urlMatch = null;
    while ((urlMatch = quotedUrlRegex.exec(source))) {
      const candidate = String(urlMatch[1] ?? '').trim();
      if (!candidate) continue;
      candidates.push(candidate);
    }

    const normalized = candidates
      .map((candidate) => candidate.trim())
      .filter((candidate) => !!candidate)
      .filter((candidate) => candidate !== '#')
      .filter((candidate) => !/^javascript:/i.test(candidate))
      .filter((candidate) => !/^void\(0\)/i.test(candidate));

    if (!normalized.length) return '';

    const preferred =
      normalized.find((candidate) => candidate.includes('bd_idx=')) ??
      normalized.find((candidate) => candidate.includes('/diary/') || candidate.startsWith('?site=')) ??
      normalized[0];

    return toAbsoluteUrl(preferred);
  };

  const parseTeamLeadRowsFromDiaryHtml = (diaryHtml) => {
    const html = String(diaryHtml ?? '');

    const rows = [];
    const trRegex = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
    let trMatch = null;
    while ((trMatch = trRegex.exec(html))) {
      const trInner = trMatch[1] || '';
      if (!trInner.includes('data-label')) continue;

      const cellHtmlByLabel = {};
      const tdRegex = /<td\b[^>]*data-label\s*=\s*(['"])([^'"]+)\1[^>]*>([\s\S]*?)<\/td>/gi;
      let tdMatch = null;
      while ((tdMatch = tdRegex.exec(trInner))) {
        const label = stripTags(tdMatch[2]);
        const cellInner = tdMatch[3] || '';
        if (!label) continue;
        cellHtmlByLabel[label] = cellInner;
      }

      const position = stripTags(cellHtmlByLabel['직책'] ?? '');
      if (position !== '팀장') continue;

      const dept = stripTags(cellHtmlByLabel['부서'] ?? '');
      const org = stripTags(cellHtmlByLabel['소속'] ?? '');
      const staffName = stripTags(cellHtmlByLabel['성명'] ?? '');
      const createdAt = stripTags(cellHtmlByLabel['등록일시'] ?? '');

      const printCell = String(cellHtmlByLabel['인쇄'] ?? '');
      const printUrl = extractPrintUrlFromCell(printCell);

      rows.push({
        org,
        dept,
        position,
        staffName,
        createdAt,
        printUrl,
      });
    }

    const seen = {};
    const departments = [];
    const uniqueRows = [];
    rows.forEach((row) => {
      const key = row.dept || '';
      if (!key) return;
      if (seen[key]) return;
      seen[key] = true;
      departments.push(key);
      uniqueRows.push(row);
    });

    return { rows: uniqueRows, departments };
  };

  const buildBrowserLikeHeaders = (cookieHeader, referer) => {
    const headers = {
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      // gzip로 내려오면 body를 문자열로 다룰 때 깨지므로 identity로 고정한다.
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

  try {
    const scDayStart = String(payload.scDayStart ?? '').trim();
    const scDayEnd = String(payload.scDayEnd ?? '').trim();

    if (!e.auth) {
      return e.error(401, '인증이 필요합니다.', {});
    }

    // users.name = KJCA mng_id, users.kjcaPw = KJCA mng_pw (평문 저장)
    const mngId = String(e.auth.getString('name') ?? '').trim();
    const mngPw = String(e.auth.getString('kjcaPw') ?? '').trim();

    let sessionCookie = '';
    let loginStatusCode = null;
    let loginSetCookieCount = 0;
    let loginRedirectTo = '';

    logger.info(
      'request started',
      'scDayStart',
      scDayStart,
      'scDayEnd',
      scDayEnd,
    );

    // 브라우저처럼 먼저 /staff/auth로 진입해서 기본 세션 쿠키를 확보한다.
    const staffAuthInitResponse = $http.send({
      url: staffAuthUrl,
      method: 'GET',
      headers: buildBrowserLikeHeaders('', `${host}/`),
    });
    sessionCookie = mergeSetCookieIntoCookieHeader(sessionCookie, staffAuthInitResponse.headers);

    const loginAndUpdateCookie = () => {
      if (!mngId || !mngPw) {
        return e.error(
          400,
          'KJCA 계정 정보가 필요합니다. (users.name=mng_id, users.kjcaPw=mng_pw)',
          {},
        );
      }

      const loginBody =
        `url=${encodeURIComponent('/board/admin')}` +
        '&sf_mobile_key=' +
        '&sf_alarm_key=' +
        `&mng_id=${encodeURIComponent(mngId)}` +
        `&mng_pw=${encodeURIComponent(mngPw)}`;

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

      loginStatusCode = loginResponse.statusCode;
      const loginResponseBody = toString(loginResponse.body);

      const setCookieHeaders = getHeaderValues(loginResponse.headers, 'Set-Cookie');
      loginSetCookieCount = setCookieHeaders.length;
      const cookieFromLogin = normalizeCookieHeader(extractCookieHeaderFromSetCookie(setCookieHeaders));
      sessionCookie = normalizeCookieHeader(sessionCookie ? `${sessionCookie}; ${cookieFromLogin}` : cookieFromLogin);

      if (/location\.href\s*=\s*(?:'|")\s*\/\?site=groupware\s*(?:'|")/i.test(loginResponseBody)) {
        loginRedirectTo = '/?site=groupware';
      } else if (/location\.href\s*=\s*(?:'|")\s*\/staff\/auth\s*(?:'|")/i.test(loginResponseBody)) {
        loginRedirectTo = '/staff/auth';
      } else {
        loginRedirectTo = '';
      }

      logger.info(
        'login_check completed',
        'statusCode',
        loginStatusCode,
        'setCookieCount',
        loginSetCookieCount,
        'redirectTo',
        loginRedirectTo,
      );
    };

    const maybeErrorResponse = loginAndUpdateCookie();
    if (maybeErrorResponse) return maybeErrorResponse;

    if (!sessionCookie) {
      return e.error(500, '세션 쿠키를 확보하지 못했습니다.', {});
    }

    if (!scDayStart || !scDayEnd) {
      return e.error(400, '조회 날짜(scDayStart, scDayEnd)가 필요합니다.', {});
    }

    const diaryListUrl =
      `${host}/diary/?site=groupware&mn=1450&bd_type=1&sc_sort=bd_insert_date&sc_ord=desc` +
      `&sc_day_start=${encodeURIComponent(scDayStart)}` +
      `&sc_day_end=${encodeURIComponent(scDayEnd)}` +
      '&sc_my_insert=Y&sc_my_appr=Y&sc_appr_type1=&sc_appr_type2=&sc_appr_type3=&sc_sf_name=';

    const diaryResponse = $http.send({
      url: diaryListUrl,
      method: 'GET',
      headers: buildBrowserLikeHeaders(sessionCookie, diaryListUrl),
    });

    sessionCookie = mergeSetCookieIntoCookieHeader(sessionCookie, diaryResponse.headers);

    const diaryHtml = toString(diaryResponse.body);
    const diaryAuthRequired = detectAuthRequiredHtml(diaryHtml);
    const isDiaryAccessible = diaryResponse.statusCode >= 200 && diaryResponse.statusCode < 300 && !diaryAuthRequired;

    const parsed = isDiaryAccessible ? parseTeamLeadRowsFromDiaryHtml(diaryHtml) : { rows: [], departments: [] };

    logger.info(
      'request completed',
      'diaryStatusCode',
      diaryResponse.statusCode,
      'diaryAuthRequired',
      diaryAuthRequired,
      'isDiaryAccessible',
      isDiaryAccessible,
      'teamLeadRowsCount',
      parsed.rows.length,
      'teamLeadDepartmentsCount',
      parsed.departments.length,
    );

    return e.json(200, {
      ok: true,
      isDiaryAccessible,
      teamLeadRows: parsed.rows.map((row) => ({
        dept: row.dept,
        position: row.position,
        staffName: row.staffName,
        printUrl: row.printUrl,
      })),
    });
  } catch (error) {
    logger.error('request failed', 'error', `${error}`);
    return e.error(500, 'diary 호출 처리에 실패했습니다.', { cause: `${error}` });
  }
}, $apis.requireAuth());
