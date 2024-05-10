/* eslint-disable @typescript-eslint/no-unused-vars */
export const WorkState = {
  Wait: {
    code: 'WAIT',
    display: '대기중',
  },
  Inprogress: {
    code: 'INPROGRESS',
    display: '진행중',
  },
} as const;
export type WorkState = (typeof WorkState)[keyof typeof WorkState];

export const getWorkStateByCode = (code: string) => {
  const findObj = Object.entries(WorkState).find(([_key, value]) => value.code === code)!;
  return findObj[1];
};
