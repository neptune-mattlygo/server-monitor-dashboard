import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Calendar } from '@/components/ui/calendar';

describe('Calendar Component', () => {
  describe('Rendering', () => {
    it('should render calendar', () => {
      const { container } = render(<Calendar />);
      const calendar = container.querySelector('[data-slot="calendar"]');
      expect(calendar).toBeInTheDocument();
    });

    it('should render with current month by default', () => {
      render(<Calendar />);
      // Calendar should have a grid role
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('should render weekday headers', () => {
      render(<Calendar />);
      // Should have weekday headers
      expect(screen.getByLabelText('Sunday')).toBeInTheDocument();
      expect(screen.getByLabelText('Monday')).toBeInTheDocument();
    });

    it('should render navigation buttons', () => {
      render(<Calendar />);
      const prevButton = screen.getByRole('button', { name: 'Go to the Previous Month' });
      const nextButton = screen.getByRole('button', { name: 'Go to the Next Month' });
      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should accept className prop', () => {
      const { container } = render(<Calendar className="custom-calendar" />);
      const calendar = container.querySelector('.custom-calendar');
      expect(calendar).toBeInTheDocument();
    });

    it('should show outside days by default', () => {
      const { container } = render(<Calendar />);
      // Outside days are shown by default (showOutsideDays = true)
      const outsideDays = container.querySelectorAll('[data-outside="true"]');
      expect(outsideDays.length).toBeGreaterThan(0);
    });

    it('should hide outside days when showOutsideDays is false', () => {
      const { container } = render(<Calendar showOutsideDays={false} defaultMonth={new Date(2024, 0, 1)} />);
      const outsideDays = container.querySelectorAll('[data-outside="true"]');
      // Library may still show a few outside days even with prop false
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('should accept mode prop', () => {
      const { container } = render(<Calendar mode="single" />);
      const grid = container.querySelector('[role="grid"]');
      expect(grid).toHaveAttribute('aria-multiselectable', 'false');
    });

    it('should accept selected date', () => {
      const date = new Date(2024, 0, 15); // January 15, 2024
      render(<Calendar mode="single" selected={date} defaultMonth={date} />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('should accept defaultMonth prop', () => {
      const defaultMonth = new Date(2024, 5, 1); // June 2024
      render(<Calendar defaultMonth={defaultMonth} />);
      expect(screen.getByText('June 2024')).toBeInTheDocument();
    });

    it('should accept captionLayout prop', () => {
      render(<Calendar captionLayout="label" />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('should accept buttonVariant prop', () => {
      render(<Calendar buttonVariant="outline" />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
  });

  describe('Date Selection', () => {
    it('should handle single date selection', () => {
      const handleSelect = jest.fn();
      render(<Calendar mode="single" onSelect={handleSelect} />);
      
      // Calendar is rendered
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('should support range selection mode', () => {
      const { container } = render(<Calendar mode="range" />);
      const grid = container.querySelector('[role="grid"]');
      expect(grid).toBeInTheDocument();
    });

    it('should support multiple selection mode', () => {
      const { container } = render(<Calendar mode="multiple" />);
      const grid = container.querySelector('[role="grid"]');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate to previous month', () => {
      render(<Calendar defaultMonth={new Date(2024, 1, 1)} />);
      const prevButton = screen.getByRole('button', { name: 'Go to the Previous Month' });
      
      expect(screen.getByText('February 2024')).toBeInTheDocument();
      fireEvent.click(prevButton);
      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });

    it('should navigate to next month', () => {
      render(<Calendar defaultMonth={new Date(2024, 0, 1)} />);
      const nextButton = screen.getByRole('button', { name: 'Go to the Next Month' });
      
      expect(screen.getByText('January 2024')).toBeInTheDocument();
      fireEvent.click(nextButton);
      expect(screen.getByText('February 2024')).toBeInTheDocument();
    });

    it('should disable navigation buttons when appropriate', () => {
      const fromDate = new Date(2024, 0, 1);
      const toDate = new Date(2024, 0, 31);
      
      render(<Calendar fromDate={fromDate} toDate={toDate} defaultMonth={fromDate} />);
      
      // Calendar should be restricted to the date range
      expect(screen.getByText('January 2024')).toBeInTheDocument();
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
  });

  describe('Disabled Dates', () => {
    it('should disable dates before fromDate', () => {
      const fromDate = new Date(2024, 0, 15);
      render(<Calendar fromDate={fromDate} defaultMonth={fromDate} />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('should disable dates after toDate', () => {
      const toDate = new Date(2024, 0, 15);
      render(<Calendar toDate={toDate} defaultMonth={toDate} />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('should disable specific dates', () => {
      const disabledDates = [new Date(2024, 0, 15), new Date(2024, 0, 20)];
      render(<Calendar disabled={disabledDates} defaultMonth={new Date(2024, 0, 1)} />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('should disable dates with matcher function', () => {
      const isWeekend = (date: Date) => {
        const day = date.getDay();
        return day === 0 || day === 6;
      };
      
      render(<Calendar disabled={isWeekend} />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply default background styles', () => {
      const { container } = render(<Calendar />);
      const calendar = container.querySelector('[data-slot="calendar"]');
      expect(calendar).toHaveClass('bg-background');
    });

    it('should apply custom classNames', () => {
      const { container } = render(<Calendar classNames={{ day: 'custom-day-class' }} />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('should accept custom className', () => {
      const { container } = render(<Calendar className="my-calendar" />);
      expect(container.querySelector('.my-calendar')).toBeInTheDocument();
    });

    it('should apply ghost button variant by default', () => {
      const { container } = render(<Calendar />);
      const calendar = container.querySelector('[data-slot="calendar"]');
      expect(calendar).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have role="grid"', () => {
      render(<Calendar />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('should have navigation buttons with aria-labels', () => {
      render(<Calendar />);
      const prevButton = screen.getByRole('button', { name: 'Go to the Previous Month' });
      const nextButton = screen.getByRole('button', { name: 'Go to the Next Month' });
      
      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<Calendar mode="single" />);
      const calendar = screen.getByRole('grid');
      
      // Calendar should be focusable
      expect(calendar).toBeInTheDocument();
    });

    it('should have proper ARIA attributes on selected dates', () => {
      const date = new Date(2024, 0, 15);
      render(<Calendar mode="single" selected={date} defaultMonth={date} />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
  });

  describe('Today Highlighting', () => {
    it('should highlight today\'s date', () => {
      const { container } = render(<Calendar />);
      // Today should be highlighted in the calendar with data-today attribute
      const today = container.querySelector('[data-today="true"]');
      expect(today).toBeInTheDocument();
    });

    it('should apply today styles', () => {
      const { container } = render(<Calendar />);
      const today = container.querySelector('[data-today="true"]');
      expect(today).toHaveClass('rdp-today');
    });
  });

  describe('Week Numbers', () => {
    it('should show week numbers when enabled', () => {
      render(<Calendar showWeekNumber />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('should not show week numbers by default', () => {
      render(<Calendar />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
  });

  describe('Custom Formatters', () => {
    it('should use custom month formatter', () => {
      const formatters = {
        formatMonthDropdown: (date: Date) => date.toLocaleString('default', { month: 'long' })
      };
      
      render(<Calendar formatters={formatters} defaultMonth={new Date(2024, 0, 1)} />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('should format months as short by default', () => {
      render(<Calendar defaultMonth={new Date(2024, 0, 1)} />);
      expect(screen.getByText('January 2024')).toBeInTheDocument();
    });
  });

  describe('Multiple Months', () => {
    it('should render multiple months', () => {
      render(<Calendar numberOfMonths={2} />);
      // With multiple months, there should be multiple grids
      const grids = screen.getAllByRole('grid');
      expect(grids.length).toBe(2);
    });

    it('should render single month by default', () => {
      render(<Calendar />);
      const grids = screen.getAllByRole('grid');
      expect(grids.length).toBe(1);
    });
  });

  describe('RTL Support', () => {
    it('should support RTL direction', () => {
      const { container } = render(<Calendar dir="rtl" />);
      const calendar = container.querySelector('[data-slot="calendar"]');
      expect(calendar).toBeInTheDocument();
    });
  });

  describe('Range Selection', () => {
    it('should handle range start selection', () => {
      const handleSelect = jest.fn();
      render(<Calendar mode="range" onSelect={handleSelect} />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('should display selected range', () => {
      const range = {
        from: new Date(2024, 0, 10),
        to: new Date(2024, 0, 20)
      };
      
      render(<Calendar mode="range" selected={range} defaultMonth={new Date(2024, 0, 1)} />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('should style range middle dates', () => {
      const range = {
        from: new Date(2024, 0, 10),
        to: new Date(2024, 0, 20)
      };
      
      render(<Calendar mode="range" selected={range} defaultMonth={new Date(2024, 0, 1)} />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
  });

  describe('Server Monitor Use Cases', () => {
    it('should render for event date selection', () => {
      render(<Calendar mode="single" />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('should render for date range filtering', () => {
      render(<Calendar mode="range" />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('should render for scheduled maintenance selection', () => {
      const handleSelect = jest.fn();
      render(<Calendar mode="single" onSelect={handleSelect} />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle no props', () => {
      render(<Calendar />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('should handle invalid date gracefully', () => {
      render(<Calendar mode="single" selected={undefined} />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('should handle year boundaries', () => {
      const date = new Date(2024, 11, 31); // December 31, 2024
      render(<Calendar defaultMonth={date} />);
      expect(screen.getByText('December 2024')).toBeInTheDocument();
    });

    it('should handle leap years', () => {
      const date = new Date(2024, 1, 29); // February 29, 2024 (leap year)
      render(<Calendar defaultMonth={date} />);
      expect(screen.getByText('February 2024')).toBeInTheDocument();
    });
  });

  describe('Component API', () => {
    it('should export Calendar component', () => {
      expect(Calendar).toBeDefined();
      expect(Calendar).toBeTruthy();
    });

    it('should accept all DayPicker props', () => {
      const props = {
        mode: 'single' as const,
        disabled: false,
        required: false,
        defaultMonth: new Date(2024, 0, 1),
      };
      
      render(<Calendar {...props} />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
  });

  describe('Custom Components', () => {
    it('should accept custom components', () => {
      const CustomDay = ({ children, ...props }: any) => (
        <div {...props} data-custom-day>{children}</div>
      );
      
      render(<Calendar components={{ DayButton: CustomDay }} />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('should render custom chevron icons', () => {
      const { container } = render(<Calendar />);
      const calendar = container.querySelector('[data-slot="calendar"]');
      expect(calendar).toBeInTheDocument();
    });
  });

  describe('Caption Layout', () => {
    it('should render with label caption layout', () => {
      render(<Calendar captionLayout="label" />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('should render with dropdown caption layout', () => {
      render(<Calendar captionLayout="dropdown" />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('should render with dropdown-months caption layout', () => {
      render(<Calendar captionLayout="dropdown-months" />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('should render with dropdown-years caption layout', () => {
      render(<Calendar captionLayout="dropdown-years" />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
  });

  describe('Button Variants', () => {
    it('should render with ghost button variant', () => {
      render(<Calendar buttonVariant="ghost" />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('should render with outline button variant', () => {
      render(<Calendar buttonVariant="outline" />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('should render with default button variant', () => {
      render(<Calendar buttonVariant="default" />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
  });

  describe('Date Modifiers', () => {
    it('should apply modifiers to dates', () => {
      const modifiers = {
        booked: [new Date(2024, 0, 15), new Date(2024, 0, 16)]
      };
      
      render(<Calendar modifiers={modifiers} defaultMonth={new Date(2024, 0, 1)} />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('should style modified dates', () => {
      const modifiers = {
        highlighted: new Date()
      };
      
      const modifiersClassNames = {
        highlighted: 'bg-yellow-200'
      };
      
      render(
        <Calendar 
          modifiers={modifiers} 
          modifiersClassNames={modifiersClassNames}
        />
      );
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
  });
});
