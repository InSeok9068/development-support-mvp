// @ts-nocheck
/// <reference path="types.d.ts" />

routerAdd(
  'POST',
  '/api/staff-auth-probe',
  (e) => {
    const logger = $app.logger().with('hook', 'staff-auth-probe');

    const host = 'http://www.kjca.co.kr';
    const loginUrl = `${host}/staff/auth/login_check`;
    const staffAuthUrl = `${host}/staff/auth`;

    const payload = new DynamicModel({
      scDay: '',
    });
    e.bindBody(payload);

    const {
      getHeaderValues,
      mergeSetCookieIntoCookieHeader,
      detectAuthRequiredHtml,
      parseTeamLeadRowsFromDiaryHtml,
      buildBrowserLikeHeaders,
    } = require(`${__hooks}/utils.ts`);

    try {
      const scDay = String(payload.scDay ?? '').trim();

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

      let sessionCookie = '';
      let loginStatusCode = null;
      let loginSetCookieCount = 0;
      let loginRedirectTo = '';

      logger.info('request started', 'scDay', scDay);

      // 브라우저처럼 먼저 /staff/auth로 진입해서 기본 세션 쿠키를 확보한다.
      const staffAuthInitResponse = $http.send({
        url: staffAuthUrl,
        method: 'GET',
        timeout: 20,
        headers: buildBrowserLikeHeaders(host, '', `${host}/`),
      });
      sessionCookie = mergeSetCookieIntoCookieHeader(sessionCookie, staffAuthInitResponse.headers);

      const loginBody =
        `url=${encodeURIComponent('/board/admin')}` +
        '&sf_mobile_key=' +
        '&sf_alarm_key=' +
        `&mng_id=${encodeURIComponent(mngId)}` +
        `&mng_pw=${encodeURIComponent(mngPw)}`;

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

      loginStatusCode = loginResponse.statusCode;
      const loginResponseBody = toString(loginResponse.body);
      loginSetCookieCount = getHeaderValues(loginResponse.headers, 'Set-Cookie').length;
      sessionCookie = mergeSetCookieIntoCookieHeader(sessionCookie, loginResponse.headers);

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

      if (!sessionCookie) {
        return e.error(500, '세션 쿠키를 확보하지 못했습니다.', {});
      }

      if (!scDay) {
        return e.error(400, '조회 날짜(scDay)가 필요합니다.', {});
      }

      const diaryListUrl =
        `${host}/diary/?site=groupware&mn=1450&bd_type=1&sc_sort=bd_insert_date&sc_ord=desc` +
        `&sc_day_start=${encodeURIComponent(scDay)}` +
        `&sc_day_end=${encodeURIComponent(scDay)}` +
        '&sc_my_insert=Y&sc_my_appr=Y&sc_appr_type1=&sc_appr_type2=&sc_appr_type3=&sc_sf_name=';

      const diaryResponse = $http.send({
        url: diaryListUrl,
        method: 'GET',
        timeout: 20,
        headers: buildBrowserLikeHeaders(host, sessionCookie, diaryListUrl),
      });

      sessionCookie = mergeSetCookieIntoCookieHeader(sessionCookie, diaryResponse.headers);

      const diaryHtml = toString(diaryResponse.body);
      const diaryAuthRequired = detectAuthRequiredHtml(diaryHtml);
      const isDiaryAccessible = diaryResponse.statusCode >= 200 && diaryResponse.statusCode < 300 && !diaryAuthRequired;

      const parsed = isDiaryAccessible
        ? parseTeamLeadRowsFromDiaryHtml(diaryHtml, host)
        : { rows: [], departments: [] };

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
  },
  $apis.requireSuperuserAuth(),
);
