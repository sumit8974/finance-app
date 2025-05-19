
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface MonthPickerProps {
  date: Date;
  onChange: (date: Date) => void;
}

const MonthPicker: React.FC<MonthPickerProps> = ({ date, onChange }) => {
  const handlePrevious = () => {
    const previousMonth = new Date(date);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    onChange(previousMonth);
  };
  
  const handleNext = () => {
    const nextMonth = new Date(date);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    onChange(nextMonth);
  };
  
  return (
    <div className="flex items-center space-x-2">
      <Button variant="outline" size="icon" onClick={handlePrevious}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="font-medium text-lg min-w-[150px] text-center">
        {format(date, 'MMMM yyyy')}
      </div>
      
      <Button variant="outline" size="icon" onClick={handleNext} disabled={date >= new Date()}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default MonthPicker;
