import { FC } from 'react';
import { IChatBrandIconProps } from '../Definitions/IChatBrandIconProps';

export const ChatBrandIcon: FC<IChatBrandIconProps> = ({ size = 32, className }) =>
{
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M7 13C7 9.13401 10.134 6 14 6H18C21.866 6 25 9.13401 25 13V16C25 19.866 21.866 23 18 23H13L8.5 26.5V22.4C7.58 21.4 7 20.08 7 18.6V13Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="14.5" r="1.5" fill="currentColor" />
      <circle cx="16" cy="14.5" r="1.5" fill="currentColor" />
      <circle cx="20" cy="14.5" r="1.5" fill="currentColor" />
    </svg>
  );
};
