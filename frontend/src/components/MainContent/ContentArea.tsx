import { useSelector } from 'react-redux'
import { RootState } from '../../store/store';
import { DivisionList } from '../divisions/DivisionList/DivisionList';
import { Division } from '../../types';

interface ContentAreaProps {
  activeTab: string;
  viewTypes: Record<string, 'grid' | 'table'>;
  onSelectDivision: (division: Division) => void;
}

export function ContentArea({
  activeTab,
  viewTypes,
  onSelectDivision
}: ContentAreaProps) {
  if (activeTab !== 'divisions') {
    return null;
  }

  // const { divisions } = useSelector((state: RootState) => state.facilities);

  return (
    <DivisionList 
      // divisions={divisions}
      onSelectDivision={onSelectDivision}
      viewType={viewTypes.divisions}
    />
  );
}