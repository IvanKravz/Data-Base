import React from 'react';

interface ProgressCircleProps {
  staffCount: number;
  actualCount: number;
  showOnlyActual?: boolean;
  noActiveColor?: boolean;
}

// export const ProgressCircle = ({ 
//   staffCount, 
//   actualCount, 
//   showOnlyActual = false, 
//   noActiveColor = false 
// }: ProgressCircleProps) => {
//   const staffPercentage = (actualCount / staffCount) * 100;
//   const actualPercentage = (actualCount / staffCount) * 100;

//   return (
//     <div 
//       className={`progress-circle ${showOnlyActual ? 'show-only-actual' : ''} ${noActiveColor ? 'no-active-color' : ''}`}
//       style={{
//         '--staff-percentage': `${staffPercentage}%`,
//         '--actual-percentage': `${actualPercentage}%`,
//       } as React.CSSProperties}
//       data-staff-count={showOnlyActual ? `${actualCount}` : `${staffCount}/${actualCount}`}
//     >
//       <div className="tooltip">
//         {!showOnlyActual && <>По штату: {staffCount}<br /></>}
//         По списку: {actualCount}
//       </div>
//     </div>
//   );
// };