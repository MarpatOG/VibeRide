import {HTMLAttributes} from 'react';
import clsx from 'clsx';

export default function Card({className, ...props}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('surface p-6', className)} {...props} />
  );
}
