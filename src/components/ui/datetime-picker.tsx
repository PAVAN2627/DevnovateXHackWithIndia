import { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateTimePickerProps {
  value: string; // ISO string format
  onChange: (value: string) => void;
  label?: string;
}

export function DateTimePicker({ value, onChange, label }: DateTimePickerProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const date = value ? new Date(value) : new Date();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleDateChange = (day: number) => {
    const newDate = new Date(currentMonth);
    newDate.setDate(day);
    newDate.setHours(parseInt(hours), parseInt(minutes));
    onChange(newDate.toISOString());
    setShowCalendar(false);
  };

  const handleTimeChange = (type: 'hours' | 'minutes', value: string) => {
    const newDate = new Date(date);
    if (type === 'hours') {
      newDate.setHours(parseInt(value) || 0);
    } else {
      newDate.setMinutes(parseInt(value) || 0);
    }
    onChange(newDate.toISOString());
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, () => null);

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <Popover open={showCalendar || showTime} onOpenChange={(open) => {
        if (!open) {
          setShowCalendar(false);
          setShowTime(false);
        }
      }}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal bg-background border-border"
            onClick={() => setShowCalendar(!showCalendar)}
          >
            {value ? formatDate(value) : 'Pick a date and time'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4 bg-card border-border">
          {showCalendar && (
            <div className="space-y-4">
              {/* Month/Year Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevMonth}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-semibold">
                  {currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNextMonth}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-xs font-semibold text-muted-foreground">
                    {day}
                  </div>
                ))}
                {emptyDays.map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {days.map((day) => (
                  <Button
                    key={day}
                    variant={date.getDate() === day && 
                             date.getMonth() === currentMonth.getMonth() &&
                             date.getFullYear() === currentMonth.getFullYear() 
                      ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleDateChange(day)}
                  >
                    {day}
                  </Button>
                ))}
              </div>

              {/* Time Picker Button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setShowCalendar(false);
                  setShowTime(true);
                }}
              >
                <Clock className="h-4 w-4 mr-2" />
                Set Time
              </Button>
            </div>
          )}

          {showTime && (
            <div className="space-y-4">
              <div className="text-sm font-semibold">Set Time</div>
              
              <div className="flex items-center gap-2 justify-center">
                <div className="space-y-2">
                  <label className="text-xs font-medium">Hours</label>
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    value={hours}
                    onChange={(e) => handleTimeChange('hours', e.target.value)}
                    className="w-16 text-center bg-background border-border"
                  />
                </div>
                <div className="text-2xl font-bold">:</div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Minutes</label>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={(e) => handleTimeChange('minutes', e.target.value)}
                    className="w-16 text-center bg-background border-border"
                  />
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setShowTime(false);
                  setShowCalendar(true);
                }}
              >
                Back to Calendar
              </Button>

              <Button
                variant="default"
                size="sm"
                className="w-full"
                onClick={() => {
                  setShowTime(false);
                  setShowCalendar(false);
                }}
              >
                Done
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
