import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { cn } from '../../utils/cn';

interface DatePickerProps {
  visible: boolean;
  value: Date | null;
  minDate?: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
}

const DAYS_OF_WEEK = ['Ня', 'Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя'];
const MONTHS = [
  '1-р сар', '2-р сар', '3-р сар', '4-р сар', '5-р сар', '6-р сар',
  '7-р сар', '8-р сар', '9-р сар', '10-р сар', '11-р сар', '12-р сар'
];

export function DatePicker({ visible, value, minDate, onChange, onClose }: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = value || new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  const days = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of the month (0 = Sunday, 1 = Monday ...)
    const firstDay = new Date(year, month, 1).getDay();
    // Number of days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Number of days in previous month
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const grid = [];
    
    // Pad previous month days
    for (let i = 0; i < firstDay; i++) {
      grid.push({ 
        date: new Date(year, month - 1, daysInPrevMonth - firstDay + i + 1), 
        isCurrentMonth: false 
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      grid.push({ 
        date: new Date(year, month, i), 
        isCurrentMonth: true 
      });
    }

    // Pad next month
    const remaining = 42 - grid.length; // 6 rows * 7 days
    for (let i = 1; i <= remaining; i++) {
      grid.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return grid;
  }, [currentMonth]);

  const isSameDay = (d1: Date, d2: Date | null) => {
    if (!d2) return false;
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
  };

  const isBeforeMin = (d: Date) => {
    if (!minDate) return false;
    const min = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    return d.getTime() < min.getTime();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable className="flex-1 bg-black/50 items-center justify-center p-4" onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View className="bg-popover border border-border rounded-xl p-4 w-[320px] shadow-lg">
            
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity onPress={prevMonth} className="h-7 w-7 items-center justify-center border border-border/50 rounded-md">
                <ChevronLeft size={16} className="text-foreground" />
              </TouchableOpacity>
              
              <Text className="text-sm font-semibold text-foreground">
                {currentMonth.getFullYear()} он {MONTHS[currentMonth.getMonth()]}
              </Text>

              <TouchableOpacity onPress={nextMonth} className="h-7 w-7 items-center justify-center border border-border/50 rounded-md">
                <ChevronRight size={16} className="text-foreground" />
              </TouchableOpacity>
            </View>

            {/* Weekdays */}
            <View className="flex-row mb-2">
              {DAYS_OF_WEEK.map((day, i) => (
                <Text key={i} className="flex-1 text-center text-[11px] font-medium text-muted-foreground w-9">
                  {day}
                </Text>
              ))}
            </View>

            {/* Grid */}
            <View className="flex-row flex-wrap">
              {days.map((item, i) => {
                const selected = isSameDay(item.date, value);
                const disabled = isBeforeMin(item.date);
                const isToday = isSameDay(item.date, new Date());

                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => {
                      if (!disabled) {
                        onChange(item.date);
                      }
                    }}
                    disabled={disabled}
                    className={cn(
                      "w-[14.28%] aspect-square items-center justify-center rounded-md",
                      selected ? "bg-primary" : "bg-transparent",
                    )}
                  >
                    <Text
                      className={cn(
                        "text-sm",
                        selected ? "text-primary-foreground font-semibold" 
                        : disabled ? "text-muted-foreground/30" 
                        : !item.isCurrentMonth ? "text-muted-foreground"
                        : "text-foreground",
                        isToday && !selected && !disabled && "underline font-bold"
                      )}
                    >
                      {item.date.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
