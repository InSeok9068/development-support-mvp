import {
  ClothesCategoryOptions,
  ClothesColorsOptions,
  ClothesContextsOptions,
  ClothesErrorCodeOptions,
  ClothesFitOptions,
  ClothesMaterialsOptions,
  ClothesSeasonsOptions,
  ClothesStateOptions,
  ClothesStylesOptions,
} from '@/api/pocketbase-types';

export type ClothesStateTagVariant = 'primary' | 'success' | 'neutral' | 'warning' | 'danger';
type UiOptionItem<T extends string> = {
  label: string;
  value: T;
};

// 상태값 영문 -> 한글 매핑 기준
// uploaded: 업로드됨
// preprocessing: 전처리 중
// analyzing: 분석 중
// embedding: 임베딩 중
// done: 완료
// failed: 실패
const CLOTHES_STATE_LABEL_MAP: Record<ClothesStateOptions, string> = {
  [ClothesStateOptions.uploaded]: '업로드됨',
  [ClothesStateOptions.preprocessing]: '전처리 중',
  [ClothesStateOptions.analyzing]: '분석 중',
  [ClothesStateOptions.embedding]: '임베딩 중',
  [ClothesStateOptions.done]: '완료',
  [ClothesStateOptions.failed]: '실패',
};

const CLOTHES_STATE_TAG_MAP: Record<ClothesStateOptions, ClothesStateTagVariant> = {
  [ClothesStateOptions.uploaded]: 'neutral',
  [ClothesStateOptions.preprocessing]: 'primary',
  [ClothesStateOptions.analyzing]: 'primary',
  [ClothesStateOptions.embedding]: 'primary',
  [ClothesStateOptions.done]: 'success',
  [ClothesStateOptions.failed]: 'danger',
};

// 실패 코드 영문 -> 한글 매핑 기준
// image_decode_error: 이미지 해석 실패
// ai_timeout: AI 응답 시간 초과
// ai_invalid_json: AI 응답 형식 오류
// embedding_error: 임베딩 생성 실패
const CLOTHES_ERROR_CODE_LABEL_MAP: Record<ClothesErrorCodeOptions, string> = {
  [ClothesErrorCodeOptions.image_decode_error]: '이미지 해석 실패',
  [ClothesErrorCodeOptions.ai_timeout]: 'AI 응답 시간 초과',
  [ClothesErrorCodeOptions.ai_invalid_json]: 'AI 응답 형식 오류',
  [ClothesErrorCodeOptions.embedding_error]: '임베딩 생성 실패',
};

export const clothesStateFilterOptionList: ReadonlyArray<{
  label: string;
  value: ClothesStateOptions;
}> = [
  { label: CLOTHES_STATE_LABEL_MAP[ClothesStateOptions.uploaded], value: ClothesStateOptions.uploaded },
  { label: CLOTHES_STATE_LABEL_MAP[ClothesStateOptions.preprocessing], value: ClothesStateOptions.preprocessing },
  { label: CLOTHES_STATE_LABEL_MAP[ClothesStateOptions.analyzing], value: ClothesStateOptions.analyzing },
  { label: CLOTHES_STATE_LABEL_MAP[ClothesStateOptions.embedding], value: ClothesStateOptions.embedding },
  { label: CLOTHES_STATE_LABEL_MAP[ClothesStateOptions.done], value: ClothesStateOptions.done },
  { label: CLOTHES_STATE_LABEL_MAP[ClothesStateOptions.failed], value: ClothesStateOptions.failed },
];

export const fetchClothesStateLabel = (state: ClothesStateOptions) => CLOTHES_STATE_LABEL_MAP[state];

export const fetchClothesStateTagVariant = (state: ClothesStateOptions) => CLOTHES_STATE_TAG_MAP[state];

export const fetchClothesErrorCodeLabel = (errorCode: ClothesErrorCodeOptions | null | undefined) => {
  if (!errorCode) {
    return '알 수 없는 오류';
  }

  return CLOTHES_ERROR_CODE_LABEL_MAP[errorCode] ?? '알 수 없는 오류';
};

const CLOTHES_CATEGORY_LABEL_MAP: Record<ClothesCategoryOptions, string> = {
  [ClothesCategoryOptions.top]: '상의',
  [ClothesCategoryOptions.bottom]: '하의',
  [ClothesCategoryOptions.shoes]: '신발',
  [ClothesCategoryOptions.accessory]: '악세사리',
};

const CLOTHES_SEASONS_LABEL_MAP: Record<ClothesSeasonsOptions, string> = {
  [ClothesSeasonsOptions.spring]: '봄',
  [ClothesSeasonsOptions.summer]: '여름',
  [ClothesSeasonsOptions.fall]: '가을',
  [ClothesSeasonsOptions.winter]: '겨울',
};

const CLOTHES_COLORS_LABEL_MAP: Record<ClothesColorsOptions, string> = {
  [ClothesColorsOptions.red]: '빨강',
  [ClothesColorsOptions.orange]: '주황',
  [ClothesColorsOptions.yellow]: '노랑',
  [ClothesColorsOptions.green]: '초록',
  [ClothesColorsOptions.blue]: '파랑',
  [ClothesColorsOptions.navy]: '네이비',
  [ClothesColorsOptions.purple]: '보라',
  [ClothesColorsOptions.pink]: '핑크',
  [ClothesColorsOptions.white]: '화이트',
  [ClothesColorsOptions.gray]: '그레이',
  [ClothesColorsOptions.black]: '블랙',
  [ClothesColorsOptions.brown]: '브라운',
  [ClothesColorsOptions.beige]: '베이지',
};

const CLOTHES_STYLES_LABEL_MAP: Record<ClothesStylesOptions, string> = {
  [ClothesStylesOptions.street]: '스트릿',
  [ClothesStylesOptions.casual]: '캐주얼',
  [ClothesStylesOptions.classic]: '클래식',
  [ClothesStylesOptions.minimal]: '미니멀',
  [ClothesStylesOptions.sporty]: '스포티',
  [ClothesStylesOptions.feminine]: '페미닌',
  [ClothesStylesOptions.vintage]: '빈티지',
  [ClothesStylesOptions.workwear]: '워크웨어',
  [ClothesStylesOptions.formal]: '포멀',
  [ClothesStylesOptions.chic]: '시크',
};

const CLOTHES_FIT_LABEL_MAP: Record<ClothesFitOptions, string> = {
  [ClothesFitOptions.oversized]: '오버핏',
  [ClothesFitOptions.slim]: '슬림핏',
  [ClothesFitOptions.wide]: '와이드핏',
  [ClothesFitOptions.loose]: '루즈핏',
  [ClothesFitOptions.regular]: '레귤러핏',
};

const CLOTHES_MATERIALS_LABEL_MAP: Record<ClothesMaterialsOptions, string> = {
  [ClothesMaterialsOptions.cotton]: '면',
  [ClothesMaterialsOptions.knit]: '니트',
  [ClothesMaterialsOptions.leather]: '가죽',
  [ClothesMaterialsOptions.denim]: '데님',
  [ClothesMaterialsOptions.wool]: '울',
  [ClothesMaterialsOptions.linen]: '린넨',
  [ClothesMaterialsOptions.polyester]: '폴리에스터',
  [ClothesMaterialsOptions.nylon]: '나일론',
  [ClothesMaterialsOptions.silk]: '실크',
};

const CLOTHES_CONTEXTS_LABEL_MAP: Record<ClothesContextsOptions, string> = {
  [ClothesContextsOptions.daily]: '일상',
  [ClothesContextsOptions.work]: '출근',
  [ClothesContextsOptions.wedding]: '결혼식',
  [ClothesContextsOptions.date]: '데이트',
  [ClothesContextsOptions.travel]: '여행',
  [ClothesContextsOptions.exercise]: '운동',
  [ClothesContextsOptions.party]: '파티',
  [ClothesContextsOptions.formal_event]: '격식있는 자리',
};

const mapOptionList = <T extends string>(labelMap: Record<T, string>): ReadonlyArray<UiOptionItem<T>> => {
  return (Object.keys(labelMap) as T[]).map((value) => ({
    label: labelMap[value],
    value,
  }));
};

const mapJoinedLabel = <T extends string>(values: T[] | null | undefined, labelMap: Record<T, string>) => {
  if (!values?.length) {
    return '-';
  }

  return values.map((value) => labelMap[value] ?? value).join(', ');
};

export const clothesCategoryOptionList = mapOptionList(CLOTHES_CATEGORY_LABEL_MAP);
export const clothesSeasonsOptionList = mapOptionList(CLOTHES_SEASONS_LABEL_MAP);
export const clothesColorsOptionList = mapOptionList(CLOTHES_COLORS_LABEL_MAP);
export const clothesStylesOptionList = mapOptionList(CLOTHES_STYLES_LABEL_MAP);
export const clothesFitOptionList = mapOptionList(CLOTHES_FIT_LABEL_MAP);
export const clothesMaterialsOptionList = mapOptionList(CLOTHES_MATERIALS_LABEL_MAP);
export const clothesContextsOptionList = mapOptionList(CLOTHES_CONTEXTS_LABEL_MAP);

export const fetchClothesCategoryLabel = (category: ClothesCategoryOptions | null | undefined) => {
  if (!category) {
    return '-';
  }

  return CLOTHES_CATEGORY_LABEL_MAP[category] ?? category;
};

export const fetchClothesSeasonsLabel = (values: ClothesSeasonsOptions[] | null | undefined) => {
  return mapJoinedLabel(values, CLOTHES_SEASONS_LABEL_MAP);
};

export const fetchClothesColorsLabel = (values: ClothesColorsOptions[] | null | undefined) => {
  return mapJoinedLabel(values, CLOTHES_COLORS_LABEL_MAP);
};

export const fetchClothesStylesLabel = (values: ClothesStylesOptions[] | null | undefined) => {
  return mapJoinedLabel(values, CLOTHES_STYLES_LABEL_MAP);
};

export const fetchClothesFitLabel = (fit: ClothesFitOptions | null | undefined) => {
  if (!fit) {
    return '-';
  }

  return CLOTHES_FIT_LABEL_MAP[fit] ?? fit;
};

export const fetchClothesMaterialsLabel = (values: ClothesMaterialsOptions[] | null | undefined) => {
  return mapJoinedLabel(values, CLOTHES_MATERIALS_LABEL_MAP);
};

export const fetchClothesContextsLabel = (values: ClothesContextsOptions[] | null | undefined) => {
  return mapJoinedLabel(values, CLOTHES_CONTEXTS_LABEL_MAP);
};
