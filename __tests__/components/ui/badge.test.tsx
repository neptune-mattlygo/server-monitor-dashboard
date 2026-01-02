import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Badge } from '@/components/ui/badge';

describe('Badge Component', () => {
  describe('Rendering', () => {
    it('should render basic badge', () => {
      render(<Badge>Test Badge</Badge>);
      expect(screen.getByText('Test Badge')).toBeInTheDocument();
    });

    it('should render badge with text content', () => {
      render(<Badge>Status: Active</Badge>);
      expect(screen.getByText('Status: Active')).toBeInTheDocument();
    });

    it('should render empty badge', () => {
      const { container } = render(<Badge />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render badge with children', () => {
      render(
        <Badge>
          <span>Custom</span> Content
        </Badge>
      );
      expect(screen.getByText('Custom')).toBeInTheDocument();
      expect(screen.getByText(/Content/)).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should render default variant', () => {
      const { container } = render(<Badge variant="default">Default</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-primary', 'text-primary-foreground', 'border-transparent');
    });

    it('should render secondary variant', () => {
      const { container } = render(<Badge variant="secondary">Secondary</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground', 'border-transparent');
    });

    it('should render destructive variant', () => {
      const { container } = render(<Badge variant="destructive">Destructive</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-destructive', 'text-destructive-foreground', 'border-transparent');
    });

    it('should render outline variant', () => {
      const { container } = render(<Badge variant="outline">Outline</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('text-foreground');
    });

    it('should render success variant', () => {
      const { container } = render(<Badge variant="success">Success</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-green-500', 'text-white', 'border-transparent');
    });

    it('should render warning variant', () => {
      const { container } = render(<Badge variant="warning">Warning</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-yellow-500', 'text-white', 'border-transparent');
    });

    it('should render info variant', () => {
      const { container } = render(<Badge variant="info">Info</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-blue-500', 'text-white', 'border-transparent');
    });

    it('should use default variant when no variant specified', () => {
      const { container } = render(<Badge>No Variant</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-primary', 'text-primary-foreground');
    });
  });

  describe('Base Styles', () => {
    it('should apply base styles', () => {
      const { container } = render(<Badge>Styled</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass(
        'inline-flex',
        'items-center',
        'rounded-md',
        'border',
        'px-2.5',
        'py-0.5',
        'text-xs',
        'font-semibold'
      );
    });

    it('should apply transition and focus styles', () => {
      const { container } = render(<Badge>Focus</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass(
        'transition-colors',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-ring',
        'focus:ring-offset-2'
      );
    });

    it('should apply shadow to appropriate variants', () => {
      const { container: container1 } = render(<Badge variant="default">Default</Badge>);
      expect(container1.firstChild).toHaveClass('shadow');

      const { container: container2 } = render(<Badge variant="destructive">Destructive</Badge>);
      expect(container2.firstChild).toHaveClass('shadow');

      const { container: container3 } = render(<Badge variant="success">Success</Badge>);
      expect(container3.firstChild).toHaveClass('shadow');
    });

    it('should apply hover styles to variants', () => {
      const { container } = render(<Badge variant="default">Hover</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('hover:bg-primary/80');
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(<Badge className="custom-badge">Custom</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('custom-badge');
    });

    it('should merge custom className with default classes', () => {
      const { container } = render(<Badge className="ml-2 font-bold">Merged</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('ml-2', 'font-bold', 'inline-flex', 'rounded-md');
    });

    it('should allow overriding variant styles with className', () => {
      const { container } = render(
        <Badge variant="default" className="bg-purple-500">
          Override
        </Badge>
      );
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-purple-500');
    });
  });

  describe('Props and Attributes', () => {
    it('should pass through data attributes', () => {
      const { container } = render(<Badge data-testid="badge-test">Badge</Badge>);
      expect(container.firstChild).toHaveAttribute('data-testid', 'badge-test');
    });

    it('should pass through aria attributes', () => {
      const { container } = render(<Badge aria-label="Status badge">Badge</Badge>);
      expect(container.firstChild).toHaveAttribute('aria-label', 'Status badge');
    });

    it('should pass through id attribute', () => {
      const { container } = render(<Badge id="my-badge">Badge</Badge>);
      expect(container.firstChild).toHaveAttribute('id', 'my-badge');
    });

    it('should handle onClick event', () => {
      const handleClick = jest.fn();
      const { container } = render(<Badge onClick={handleClick}>Clickable</Badge>);
      const badge = container.firstChild as HTMLElement;
      badge.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should pass through role attribute', () => {
      const { container } = render(<Badge role="status">Status</Badge>);
      expect(container.firstChild).toHaveAttribute('role', 'status');
    });

    it('should pass through title attribute', () => {
      const { container } = render(<Badge title="Badge tooltip">Hover me</Badge>);
      expect(container.firstChild).toHaveAttribute('title', 'Badge tooltip');
    });
  });

  describe('Content Variations', () => {
    it('should render with icon', () => {
      const Icon = () => <svg data-testid="icon">Icon</svg>;
      render(
        <Badge>
          <Icon /> With Icon
        </Badge>
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText(/With Icon/)).toBeInTheDocument();
    });

    it('should render with number', () => {
      render(<Badge>42</Badge>);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should render with multiple children', () => {
      render(
        <Badge>
          <span>Part 1</span>
          <span>Part 2</span>
        </Badge>
      );
      expect(screen.getByText('Part 1')).toBeInTheDocument();
      expect(screen.getByText('Part 2')).toBeInTheDocument();
    });

    it('should render with special characters', () => {
      render(<Badge>Status: ✓ Active</Badge>);
      expect(screen.getByText('Status: ✓ Active')).toBeInTheDocument();
    });

    it('should render with emoji', () => {
      render(<Badge>🔥 Hot</Badge>);
      expect(screen.getByText('🔥 Hot')).toBeInTheDocument();
    });
  });

  describe('Common Use Cases', () => {
    it('should render status badge', () => {
      render(<Badge variant="success">Active</Badge>);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should render count badge', () => {
      render(<Badge variant="secondary">99+</Badge>);
      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('should render notification badge', () => {
      render(<Badge variant="destructive">New</Badge>);
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('should render category badge', () => {
      render(<Badge variant="outline">Technology</Badge>);
      expect(screen.getByText('Technology')).toBeInTheDocument();
    });

    it('should render multiple badges in a group', () => {
      const { container } = render(
        <div>
          <Badge variant="default">Badge 1</Badge>
          <Badge variant="secondary">Badge 2</Badge>
          <Badge variant="success">Badge 3</Badge>
        </div>
      );
      expect(screen.getByText('Badge 1')).toBeInTheDocument();
      expect(screen.getByText('Badge 2')).toBeInTheDocument();
      expect(screen.getByText('Badge 3')).toBeInTheDocument();
    });

    it('should render inline with text', () => {
      render(
        <p>
          Status: <Badge variant="success">Online</Badge>
        </p>
      );
      expect(screen.getByText('Online')).toBeInTheDocument();
      const badge = screen.getByText('Online');
      expect(badge).toHaveClass('inline-flex');
    });
  });

  describe('Server Status Use Cases', () => {
    it('should render server up status', () => {
      const { container } = render(<Badge variant="success">Up</Badge>);
      expect(screen.getByText('Up')).toBeInTheDocument();
      expect(container.firstChild).toHaveClass('bg-green-500');
    });

    it('should render server down status', () => {
      const { container } = render(<Badge variant="destructive">Down</Badge>);
      expect(screen.getByText('Down')).toBeInTheDocument();
      expect(container.firstChild).toHaveClass('bg-destructive');
    });

    it('should render server warning status', () => {
      const { container } = render(<Badge variant="warning">Degraded</Badge>);
      expect(screen.getByText('Degraded')).toBeInTheDocument();
      expect(container.firstChild).toHaveClass('bg-yellow-500');
    });

    it('should render server info status', () => {
      const { container } = render(<Badge variant="info">Maintenance</Badge>);
      expect(screen.getByText('Maintenance')).toBeInTheDocument();
      expect(container.firstChild).toHaveClass('bg-blue-500');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null children', () => {
      const { container } = render(<Badge>{null}</Badge>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle undefined children', () => {
      const { container } = render(<Badge>{undefined}</Badge>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle boolean children', () => {
      const { container } = render(<Badge>{false}</Badge>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle conditional content', () => {
      const showContent = true;
      render(<Badge>{showContent && 'Conditional'}</Badge>);
      expect(screen.getByText('Conditional')).toBeInTheDocument();
    });

    it('should handle very long text', () => {
      const longText = 'A'.repeat(100);
      render(<Badge>{longText}</Badge>);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should handle numeric zero', () => {
      render(<Badge>0</Badge>);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle whitespace', () => {
      render(<Badge>   Trimmed   </Badge>);
      expect(screen.getByText(/Trimmed/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard focusable when interactive', () => {
      const { container } = render(
        <Badge onClick={() => {}} tabIndex={0}>
          Focusable
        </Badge>
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveAttribute('tabindex', '0');
    });

    it('should support aria-label for screenreaders', () => {
      const { container } = render(
        <Badge aria-label="3 unread notifications">3</Badge>
      );
      expect(container.firstChild).toHaveAttribute('aria-label', '3 unread notifications');
    });

    it('should support role attribute', () => {
      const { container } = render(<Badge role="status">Active</Badge>);
      expect(container.firstChild).toHaveAttribute('role', 'status');
    });

    it('should have proper focus styles', () => {
      const { container } = render(<Badge>Focus me</Badge>);
      expect(container.firstChild).toHaveClass('focus:outline-none', 'focus:ring-2');
    });
  });

  describe('Semantic HTML', () => {
    it('should render as div element', () => {
      const { container } = render(<Badge>Div Badge</Badge>);
      expect(container.firstChild?.nodeName).toBe('DIV');
    });

    it('should allow custom element through className', () => {
      const { container } = render(<Badge className="block">Block Badge</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('block');
    });
  });

  describe('Multiple Instances', () => {
    it('should render multiple badges independently', () => {
      render(
        <>
          <Badge variant="default">Badge 1</Badge>
          <Badge variant="secondary">Badge 2</Badge>
          <Badge variant="destructive">Badge 3</Badge>
          <Badge variant="outline">Badge 4</Badge>
          <Badge variant="success">Badge 5</Badge>
          <Badge variant="warning">Badge 6</Badge>
          <Badge variant="info">Badge 7</Badge>
        </>
      );

      expect(screen.getByText('Badge 1')).toBeInTheDocument();
      expect(screen.getByText('Badge 2')).toBeInTheDocument();
      expect(screen.getByText('Badge 3')).toBeInTheDocument();
      expect(screen.getByText('Badge 4')).toBeInTheDocument();
      expect(screen.getByText('Badge 5')).toBeInTheDocument();
      expect(screen.getByText('Badge 6')).toBeInTheDocument();
      expect(screen.getByText('Badge 7')).toBeInTheDocument();
    });

    it('should handle same variant multiple times', () => {
      render(
        <>
          <Badge variant="success">First</Badge>
          <Badge variant="success">Second</Badge>
          <Badge variant="success">Third</Badge>
        </>
      );

      const badges = screen.getAllByText(/First|Second|Third/);
      expect(badges).toHaveLength(3);
    });
  });

  describe('Component API', () => {
    it('should export Badge component', () => {
      expect(Badge).toBeDefined();
      expect(typeof Badge).toBe('function');
    });

    it('should accept BadgeProps', () => {
      // Type check - should compile without errors
      const props = {
        variant: 'success' as const,
        className: 'test',
        children: 'Test',
      };
      render(<Badge {...props} />);
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  describe('Styling Combinations', () => {
    it('should combine variant and custom styles', () => {
      const { container } = render(
        <Badge variant="success" className="text-lg">
          Large Success
        </Badge>
      );
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-green-500', 'text-lg');
    });

    it('should allow custom padding', () => {
      const { container } = render(
        <Badge className="px-4 py-2">Custom Padding</Badge>
      );
      const badge = container.firstChild;
      expect(badge).toHaveClass('px-4', 'py-2');
    });

    it('should allow custom border radius', () => {
      const { container } = render(
        <Badge className="rounded-full">Rounded</Badge>
      );
      const badge = container.firstChild;
      expect(badge).toHaveClass('rounded-full');
    });

    it('should allow custom font size', () => {
      const { container } = render(
        <Badge className="text-sm">Larger Text</Badge>
      );
      const badge = container.firstChild;
      expect(badge).toHaveClass('text-sm');
    });
  });
});
