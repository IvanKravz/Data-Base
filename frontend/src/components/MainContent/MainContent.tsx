import { DivisionList } from '../divisions/DivisionList/DivisionList';

interface MainContentProps {
  activeTab: string;
  viewTypes: Record<string, 'grid' | 'table'>;
  onSetActiveTab: (tab: string) => void;
  onSetViewType: (type: 'grid' | 'table') => void;
  onSelectDivision: (division: any) => void;
}

export function MainContent({
  viewTypes,
  onSelectDivision
}: MainContentProps) {

    return (
      <DivisionList
        onSelectDivision={onSelectDivision}
        viewType={viewTypes.divisions}
      />
    );
  };
