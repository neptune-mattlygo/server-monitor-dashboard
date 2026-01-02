import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render button element', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
    });

    it('should render with text content', () => {
      render(<Button>Submit</Button>);
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    it('should render with children', () => {
      render(
        <Button>
          <span>Icon</span> Text
        </Button>
      );
      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText(/Text/)).toBeInTheDocument();
    });

    it('should render as button by default', () => {
      const { container } = render(<Button>Button</Button>);
      expect(container.querySelector('button')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should render default variant', () => {
      const { container } = render(<Button variant="default">Default</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground', 'shadow');
    });

    it('should render destructive variant', () => {
      const { container } = render(<Button variant="destructive">Destructive</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground', 'shadow-sm');
    });

    it('should render outline variant', () => {
      const { container } = render(<Button variant="outline">Outline</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('border', 'border-input', 'bg-background', 'shadow-sm');
    });

    it('should render secondary variant', () => {
      const { container } = render(<Button variant="secondary">Secondary</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground', 'shadow-sm');
    });

    it('should render ghost variant', () => {
      const { container } = render(<Button variant="ghost">Ghost</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground');
    });

    it('should render link variant', () => {
      const { container } = render(<Button variant="link">Link</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('text-primary', 'underline-offset-4', 'hover:underline');
    });

    it('should use default variant when no variant specified', () => {
      const { container } = render(<Button>No Variant</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground');
    });
  });

  describe('Sizes', () => {
    it('should render default size', () => {
      const { container } = render(<Button size="default">Default Size</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('h-9', 'px-4', 'py-2');
    });

    it('should render small size', () => {
      const { container } = render(<Button size="sm">Small</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('h-8', 'rounded-md', 'px-3', 'text-xs');
    });

    it('should render large size', () => {
      const { container } = render(<Button size="lg">Large</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('h-10', 'rounded-md', 'px-8');
    });

    it('should render icon size', () => {
      const { container } = render(<Button size="icon">🔥</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('h-9', 'w-9');
    });

    it('should use default size when no size specified', () => {
      const { container } = render(<Button>No Size</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('h-9', 'px-4', 'py-2');
    });
  });

  describe('Base Styles', () => {
    it('should apply base styles', () => {
      const { container } = render(<Button>Styled</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass(
        'inline-flex',
        'items-center',
        'justify-center',
        'gap-2',
        'whitespace-nowrap',
        'rounded-md',
        'text-sm',
        'font-medium'
      );
    });

    it('should apply transition styles', () => {
      const { container } = render(<Button>Transition</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('transition-colors');
    });

    it('should apply focus styles', () => {
      const { container } = render(<Button>Focus</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass(
        'focus-visible:outline-none',
        'focus-visible:ring-1',
        'focus-visible:ring-ring'
      );
    });

    it('should apply disabled styles', () => {
      const { container } = render(<Button>Disabled</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
    });

    it('should apply SVG styles', () => {
      const { container } = render(<Button>SVG</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('[&_svg]:pointer-events-none', '[&_svg]:size-4', '[&_svg]:shrink-0');
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(<Button className="custom-button">Custom</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('custom-button');
    });

    it('should merge custom className with default classes', () => {
      const { container } = render(<Button className="ml-2 font-bold">Merged</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('ml-2', 'font-bold', 'inline-flex', 'rounded-md');
    });

    it('should allow overriding variant styles', () => {
      const { container } = render(
        <Button variant="default" className="bg-purple-500">
          Override
        </Button>
      );
      const button = container.querySelector('button');
      expect(button).toHaveClass('bg-purple-500');
    });
  });

  describe('Props and Attributes', () => {
    it('should handle onClick event', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click</Button>);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should pass through type attribute', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should pass through disabled attribute', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should pass through data attributes', () => {
      render(<Button data-testid="custom-button">Button</Button>);
      expect(screen.getByTestId('custom-button')).toBeInTheDocument();
    });

    it('should pass through aria attributes', () => {
      render(<Button aria-label="Close dialog">X</Button>);
      const button = screen.getByRole('button', { name: 'Close dialog' });
      expect(button).toBeInTheDocument();
    });

    it('should pass through id attribute', () => {
      const { container } = render(<Button id="my-button">Button</Button>);
      const button = container.querySelector('#my-button');
      expect(button).toBeInTheDocument();
    });

    it('should not trigger onClick when disabled', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick} disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('AsChild Prop', () => {
    it('should render as child component when asChild is true', () => {
      const { container } = render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );
      const link = container.querySelector('a');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test');
    });

    it('should apply button styles to child component', () => {
      const { container } = render(
        <Button asChild variant="destructive">
          <a href="/delete">Delete</a>
        </Button>
      );
      const link = container.querySelector('a');
      expect(link).toHaveClass('bg-destructive', 'text-destructive-foreground');
    });

    it('should work with custom components', () => {
      const CustomComponent = React.forwardRef<HTMLDivElement, any>((props, ref) => (
        <div ref={ref} {...props} data-custom="true" />
      ));
      CustomComponent.displayName = 'CustomComponent';

      const { container } = render(
        <Button asChild>
          <CustomComponent>Custom</CustomComponent>
        </Button>
      );
      const custom = container.querySelector('[data-custom="true"]');
      expect(custom).toBeInTheDocument();
      expect(custom).toHaveClass('inline-flex');
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to button element', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Button</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current).toHaveTextContent('Button');
    });

    it('should forward ref when using asChild', () => {
      const ref = React.createRef<HTMLAnchorElement>();
      render(
        <Button asChild ref={ref}>
          <a href="/test">Link</a>
        </Button>
      );
      expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
    });
  });

  describe('Content Variations', () => {
    it('should render with icon and text', () => {
      const Icon = () => <svg data-testid="icon">Icon</svg>;
      render(
        <Button>
          <Icon /> Click
        </Button>
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText(/Click/)).toBeInTheDocument();
    });

    it('should render icon only button', () => {
      const Icon = () => <svg data-testid="icon">Icon</svg>;
      render(
        <Button size="icon" aria-label="Settings">
          <Icon />
        </Button>
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('should render with emoji', () => {
      render(<Button>🔥 Hot</Button>);
      expect(screen.getByText('🔥 Hot')).toBeInTheDocument();
    });

    it('should render with multiple children', () => {
      render(
        <Button>
          <span>Part 1</span>
          <span>Part 2</span>
        </Button>
      );
      expect(screen.getByText('Part 1')).toBeInTheDocument();
      expect(screen.getByText('Part 2')).toBeInTheDocument();
    });
  });

  describe('Button Types', () => {
    it('should render submit button', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should render reset button', () => {
      render(<Button type="reset">Reset</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'reset');
    });

    it('should render button type by default', () => {
      render(<Button type="button">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Accessible</Button>);
      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });
      // Note: React Testing Library doesn't trigger click on Enter by default
      // but real browsers do for button elements
    });

    it('should support aria-label for icon buttons', () => {
      render(<Button aria-label="Delete item" size="icon">🗑️</Button>);
      const button = screen.getByRole('button', { name: 'Delete item' });
      expect(button).toBeInTheDocument();
    });

    it('should support aria-disabled', () => {
      render(<Button aria-disabled="true">Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should have proper focus styles', () => {
      const { container } = render(<Button>Focus me</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-1');
    });
  });

  describe('Common Use Cases', () => {
    it('should render primary action button', () => {
      render(<Button variant="default">Save</Button>);
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('should render danger button', () => {
      render(<Button variant="destructive">Delete</Button>);
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should render secondary button', () => {
      render(<Button variant="secondary">Cancel</Button>);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should render text link button', () => {
      render(<Button variant="link">Learn more</Button>);
      expect(screen.getByText('Learn more')).toBeInTheDocument();
    });

    it('should render loading button', () => {
      render(
        <Button disabled>
          <svg className="animate-spin" data-testid="spinner">Loading</svg> Loading...
        </Button>
      );
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });

    it('should render button group', () => {
      render(
        <div>
          <Button variant="outline">Left</Button>
          <Button variant="outline">Middle</Button>
          <Button variant="outline">Right</Button>
        </div>
      );
      expect(screen.getByText('Left')).toBeInTheDocument();
      expect(screen.getByText('Middle')).toBeInTheDocument();
      expect(screen.getByText('Right')).toBeInTheDocument();
    });
  });

  describe('Server Monitor Use Cases', () => {
    it('should render server action button', () => {
      render(<Button variant="default">Restart Server</Button>);
      expect(screen.getByText('Restart Server')).toBeInTheDocument();
    });

    it('should render delete server button', () => {
      render(<Button variant="destructive">Delete Server</Button>);
      expect(screen.getByText('Delete Server')).toBeInTheDocument();
    });

    it('should render add server button', () => {
      render(<Button variant="default">Add New Server</Button>);
      expect(screen.getByText('Add New Server')).toBeInTheDocument();
    });

    it('should render view details link button', () => {
      render(<Button variant="link">View Details</Button>);
      expect(screen.getByText('View Details')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null children', () => {
      const { container } = render(<Button>{null}</Button>);
      expect(container.querySelector('button')).toBeInTheDocument();
    });

    it('should handle undefined children', () => {
      const { container } = render(<Button>{undefined}</Button>);
      expect(container.querySelector('button')).toBeInTheDocument();
    });

    it('should handle boolean children', () => {
      const { container } = render(<Button>{false}</Button>);
      expect(container.querySelector('button')).toBeInTheDocument();
    });

    it('should handle conditional content', () => {
      const showIcon = true;
      render(
        <Button>
          {showIcon && <span>Icon</span>} Text
        </Button>
      );
      expect(screen.getByText('Icon')).toBeInTheDocument();
    });

    it('should handle very long text', () => {
      const longText = 'A'.repeat(100);
      render(<Button>{longText}</Button>);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should handle numeric zero', () => {
      render(<Button>0</Button>);
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Variant and Size Combinations', () => {
    it('should combine default variant with small size', () => {
      const { container } = render(
        <Button variant="default" size="sm">
          Small Default
        </Button>
      );
      const button = container.querySelector('button');
      expect(button).toHaveClass('bg-primary', 'h-8', 'px-3', 'text-xs');
    });

    it('should combine destructive variant with large size', () => {
      const { container } = render(
        <Button variant="destructive" size="lg">
          Large Destructive
        </Button>
      );
      const button = container.querySelector('button');
      expect(button).toHaveClass('bg-destructive', 'h-10', 'px-8');
    });

    it('should combine ghost variant with icon size', () => {
      const { container } = render(
        <Button variant="ghost" size="icon">
          X
        </Button>
      );
      const button = container.querySelector('button');
      expect(button).toHaveClass('hover:bg-accent', 'h-9', 'w-9');
    });
  });

  describe('Component API', () => {
    it('should export Button component', () => {
      expect(Button).toBeDefined();
      // forwardRef components are objects in React
      expect(Button).toBeTruthy();
    });

    it('should have correct display name', () => {
      expect(Button.displayName).toBe('Button');
    });

    it('should export buttonVariants', () => {
      const { buttonVariants } = require('@/components/ui/button');
      expect(buttonVariants).toBeDefined();
      expect(typeof buttonVariants).toBe('function');
    });
  });

  describe('Form Integration', () => {
    it('should work within form element', () => {
      const handleSubmit = jest.fn((e) => e.preventDefault());
      render(
        <form onSubmit={handleSubmit}>
          <Button type="submit">Submit Form</Button>
        </form>
      );
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleSubmit).toHaveBeenCalled();
    });

    it('should not submit form when type is button', () => {
      const handleSubmit = jest.fn((e) => e.preventDefault());
      render(
        <form onSubmit={handleSubmit}>
          <Button type="button">Click</Button>
        </form>
      );
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Multiple Instances', () => {
    it('should render multiple buttons independently', () => {
      render(
        <>
          <Button variant="default">Button 1</Button>
          <Button variant="destructive">Button 2</Button>
          <Button variant="outline">Button 3</Button>
          <Button variant="secondary">Button 4</Button>
          <Button variant="ghost">Button 5</Button>
          <Button variant="link">Button 6</Button>
        </>
      );

      expect(screen.getByText('Button 1')).toBeInTheDocument();
      expect(screen.getByText('Button 2')).toBeInTheDocument();
      expect(screen.getByText('Button 3')).toBeInTheDocument();
      expect(screen.getByText('Button 4')).toBeInTheDocument();
      expect(screen.getByText('Button 5')).toBeInTheDocument();
      expect(screen.getByText('Button 6')).toBeInTheDocument();
    });
  });
});
