
import { ArrowLeft } from 'lucide-react';

interface InterviewHeaderProps {
  onBackToModeSelector: () => void;
}

export const InterviewHeader: React.FC<InterviewHeaderProps> = ({
  onBackToModeSelector
}) => {
  return (
    <div className="mb-2">
      <button
        onClick={onBackToModeSelector}
        className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
    </div>
  );
};

export default InterviewHeader;