import React, { useEffect } from 'react';
import CryptoJS from 'crypto-js';

interface YMStatProps {
    counterId: number;
    userEmail: string;
}

export const ymHit = (props:YMStatProps) => {
  const { userEmail, counterId } = props;
  const salt = 'fsdfjsknvvu34630d0@e439(*(&#$lgjdla';
  const encryptedSalt = CryptoJS.algo.SHA256.create()
    .update(salt).finalize().toString(CryptoJS.enc.Hex);
  const saltedEmail = CryptoJS.algo.SHA256.create()
    .update(userEmail)
    .update(encryptedSalt)
    .finalize().toString(CryptoJS.enc.Hex);

  // @ts-expect-error some cases fails with YM typings
  window.ym?.(counterId, 'hit', window.location.pathname);
  // @ts-expect-error some cases fails with YM typings
  window.ym?.(counterId, 'userParams', { UserID: saltedEmail });
  // @ts-expect-error some cases fails with YM typings
  window.ym?.(counterId, 'params', { userId: saltedEmail });
};

export const YMStat: React.FC<YMStatProps> = ({ counterId, userEmail }) => {
  useEffect(() => {
    ymHit({ counterId, userEmail });
  }, [counterId]);

  return(<></>);
};
