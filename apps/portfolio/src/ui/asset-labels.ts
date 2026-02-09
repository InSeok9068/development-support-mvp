import {
  AdminAssetsCategoryOptions,
  AdminAssetsGroupTypeOptions,
  AdminAssetsSectorsOptions,
  AdminAssetsTagsOptions,
} from '@/api/pocketbase-types';

export const categoryLabels: Record<string, string> = {
  [AdminAssetsCategoryOptions.cash]: '현금',
  [AdminAssetsCategoryOptions.deposit]: '예적금',
  [AdminAssetsCategoryOptions.stock]: '주식',
  [AdminAssetsCategoryOptions.etf]: 'ETF',
  [AdminAssetsCategoryOptions.bond]: '채권',
  [AdminAssetsCategoryOptions.fund]: '펀드',
  [AdminAssetsCategoryOptions.pension]: '연금',
  [AdminAssetsCategoryOptions.crypto]: '암호화폐',
  [AdminAssetsCategoryOptions.real_estate]: '부동산',
  [AdminAssetsCategoryOptions.reits]: '리츠',
  [AdminAssetsCategoryOptions.commodity_gold]: '원자재·금',
  [AdminAssetsCategoryOptions.insurance]: '보험',
  [AdminAssetsCategoryOptions.car]: '자동차',
  [AdminAssetsCategoryOptions.etc]: '기타',
};

export const groupTypeLabels: Record<string, string> = {
  [AdminAssetsGroupTypeOptions.liquid]: '현금성',
  [AdminAssetsGroupTypeOptions.risk]: '투자성',
  [AdminAssetsGroupTypeOptions.defensive]: '안정·이자형',
  [AdminAssetsGroupTypeOptions.real]: '실물·대체',
};

export const tagLabels: Record<string, string> = {
  [AdminAssetsTagsOptions.growth]: '성장',
  [AdminAssetsTagsOptions.income]: '인컴',
  [AdminAssetsTagsOptions.blend]: '혼합',
  [AdminAssetsTagsOptions.low_vol]: '저변동',
  [AdminAssetsTagsOptions.high_risk]: '고위험',
  [AdminAssetsTagsOptions.stable]: '안정',
  [AdminAssetsTagsOptions.theme]: '테마',
  [AdminAssetsTagsOptions.inflation_hedge]: '인플레이션 헤지',
  [AdminAssetsTagsOptions.retirement]: '노후',
  [AdminAssetsTagsOptions.tax_benefit]: '세제혜택',
};

export const sectorLabels: Record<string, string> = {
  [AdminAssetsSectorsOptions.it_software]: 'IT·소프트웨어',
  [AdminAssetsSectorsOptions.semiconductor]: '반도체',
  [AdminAssetsSectorsOptions.hardware_equipment]: '하드웨어·장비',
  [AdminAssetsSectorsOptions.telecom]: '통신',
  [AdminAssetsSectorsOptions.internet_platform]: '인터넷·플랫폼',
  [AdminAssetsSectorsOptions.finance]: '금융',
  [AdminAssetsSectorsOptions.bank]: '은행',
  [AdminAssetsSectorsOptions.insurance]: '보험',
  [AdminAssetsSectorsOptions.securities_asset_mgmt]: '증권·자산운용',
  [AdminAssetsSectorsOptions.healthcare]: '헬스케어',
  [AdminAssetsSectorsOptions.biotech_pharma]: '바이오·제약',
  [AdminAssetsSectorsOptions.consumer_discretionary]: '소비재(경기소비재)',
  [AdminAssetsSectorsOptions.consumer_staples]: '필수소비재',
  [AdminAssetsSectorsOptions.retail]: '유통·리테일',
  [AdminAssetsSectorsOptions.auto]: '자동차',
  [AdminAssetsSectorsOptions.industrials]: '산업재(기계·중공업)',
  [AdminAssetsSectorsOptions.materials]: '소재(화학·철강 등)',
  [AdminAssetsSectorsOptions.energy]: '에너지',
  [AdminAssetsSectorsOptions.utilities]: '유틸리티',
  [AdminAssetsSectorsOptions.real_estate]: '부동산(리츠 포함)',
  [AdminAssetsSectorsOptions.transportation_logistics]: '운송·물류',
  [AdminAssetsSectorsOptions.media_entertainment]: '미디어·엔터',
  [AdminAssetsSectorsOptions.education]: '교육',
  [AdminAssetsSectorsOptions.construction]: '건설',
};

export const resolveLabel = (value: string | null | undefined, labels: Record<string, string>) => {
  if (!value) {
    return '';
  }
  return labels[value] ?? value;
};

export const resolveLabelList = (
  values: string[] | null | undefined,
  labels: Record<string, string>,
) => {
  if (!values?.length) {
    return [];
  }
  return values.map((value) => labels[value] ?? value);
};
