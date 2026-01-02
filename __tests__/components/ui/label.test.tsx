import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Label } from '@/components/ui/label';

describe('Label Component', () => {
  describe('Rendering', () => {
    it('should render label element', () => {
      render(<Label>Test Label</Label>);
      expect(screen.getByText('Test Label')).toBeInTheDocument();
    });

    it('should render with children text', () => {
      render(<Label>Username</Label>);
      expect(screen.getByText('Username')).toBeInTheDocument();
    });

    it('should render with complex children', () => {
      render(
        <Label>
          <span>Required</span> Field
        </Label>
      );
      expect(screen.getByText('Required')).toBeInTheDocument();
      expect(screen.getByText(/Field/)).toBeInTheDocument();
    });

    it('should render with htmlFor attribute', () => {
      render(<Label htmlFor="input-id">Label Text</Label>);
      const label = screen.getByText('Label Text');
      expect(label).toHaveAttribute('for', 'input-id');
    });

    it('should render without htmlFor attribute', () => {
      render(<Label>Label Text</Label>);
      const label = screen.getByText('Label Text');
      expect(label).not.toHaveAttribute('for');
    });
  });

  describe('Styling', () => {
    it('should apply default styling classes', () => {
      render(<Label>Label</Label>);
      const label = screen.getByText('Label');
      expect(label).toHaveClass('text-sm');
      expect(label).toHaveClass('font-medium');
      expect(label).toHaveClass('leading-none');
    });

    it('should apply peer-disabled styling classes', () => {
      render(<Label>Label</Label>);
      const label = screen.getByText('Label');
      expect(label).toHaveClass('peer-disabled:cursor-not-allowed');
      expect(label).toHaveClass('peer-disabled:opacity-70');
    });

    it('should accept custom className', () => {
      render(<Label className="custom-label">Label</Label>);
      const label = screen.getByText('Label');
      expect(label).toHaveClass('custom-label');
    });

    it('should merge custom className with default classes', () => {
      render(<Label className="text-red-500">Label</Label>);
      const label = screen.getByText('Label');
      expect(label).toHaveClass('text-red-500');
      expect(label).toHaveClass('text-sm');
      expect(label).toHaveClass('font-medium');
    });

    it('should override default classes with custom className', () => {
      render(<Label className="text-lg">Label</Label>);
      const label = screen.getByText('Label');
      expect(label).toHaveClass('text-lg');
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to label element', () => {
      const ref = React.createRef<HTMLLabelElement>();
      render(<Label ref={ref}>Label</Label>);
      expect(ref.current).toBeInstanceOf(HTMLLabelElement);
    });

    it('should allow ref to access label properties', () => {
      const ref = React.createRef<HTMLLabelElement>();
      render(<Label ref={ref} htmlFor="test">Label</Label>);
      expect(ref.current?.htmlFor).toBe('test');
    });
  });

  describe('Association with Inputs', () => {
    it('should associate with input via htmlFor', () => {
      render(
        <div>
          <Label htmlFor="username-input">Username</Label>
          <input id="username-input" type="text" />
        </div>
      );
      
      const label = screen.getByText('Username');
      const input = document.getElementById('username-input');
      expect(label).toHaveAttribute('for', 'username-input');
      expect(input).toBeInTheDocument();
    });

    it('should enable clicking label to focus input', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Label htmlFor="click-input">Click Me</Label>
          <input id="click-input" type="text" />
        </div>
      );
      
      const label = screen.getByText('Click Me');
      const input = document.getElementById('click-input') as HTMLInputElement;
      
      await user.click(label);
      expect(input).toHaveFocus();
    });

    it('should work with multiple inputs', () => {
      render(
        <div>
          <Label htmlFor="first">First Name</Label>
          <input id="first" type="text" />
          <Label htmlFor="last">Last Name</Label>
          <input id="last" type="text" />
        </div>
      );
      
      expect(screen.getByText('First Name')).toHaveAttribute('for', 'first');
      expect(screen.getByText('Last Name')).toHaveAttribute('for', 'last');
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic HTML element', () => {
      const { container } = render(<Label>Label</Label>);
      const label = container.querySelector('label');
      expect(label).toBeInTheDocument();
    });

    it('should support aria attributes', () => {
      render(<Label aria-label="Custom aria label">Label</Label>);
      const label = screen.getByText('Label');
      expect(label).toHaveAttribute('aria-label', 'Custom aria label');
    });

    it('should support data attributes', () => {
      render(<Label data-testid="test-label">Label</Label>);
      expect(screen.getByTestId('test-label')).toBeInTheDocument();
    });

    it('should work with screen readers', () => {
      render(
        <div>
          <Label htmlFor="accessible-input">Accessible Label</Label>
          <input id="accessible-input" type="text" />
        </div>
      );
      
      const input = document.getElementById('accessible-input');
      expect(input).toHaveAccessibleName('Accessible Label');
    });
  });

  describe('Peer State Handling', () => {
    it('should apply peer-disabled styling when sibling is disabled', () => {
      render(
        <div>
          <input className="peer" disabled />
          <Label>Disabled Peer</Label>
        </div>
      );
      
      const label = screen.getByText('Disabled Peer');
      expect(label).toHaveClass('peer-disabled:cursor-not-allowed');
      expect(label).toHaveClass('peer-disabled:opacity-70');
    });

    it('should render correctly with peer pattern', () => {
      render(
        <div className="relative">
          <input id="peer-input" className="peer" type="text" />
          <Label htmlFor="peer-input">Peer Label</Label>
        </div>
      );
      
      expect(screen.getByText('Peer Label')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should work in a form context', () => {
      render(
        <form>
          <Label htmlFor="form-input">Email</Label>
          <input id="form-input" type="email" name="email" />
        </form>
      );
      
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(document.getElementById('form-input')).toBeInTheDocument();
    });

    it('should work with required fields', () => {
      render(
        <div>
          <Label htmlFor="required-input">
            Required Field <span className="text-red-500">*</span>
          </Label>
          <input id="required-input" type="text" required />
        </div>
      );
      
      expect(screen.getByText(/Required Field/)).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should work with textarea', () => {
      render(
        <div>
          <Label htmlFor="textarea-input">Description</Label>
          <textarea id="textarea-input" />
        </div>
      );
      
      const label = screen.getByText('Description');
      expect(label).toHaveAttribute('for', 'textarea-input');
    });

    it('should work with select', () => {
      render(
        <div>
          <Label htmlFor="select-input">Choose</Label>
          <select id="select-input">
            <option>Option 1</option>
          </select>
        </div>
      );
      
      const label = screen.getByText('Choose');
      expect(label).toHaveAttribute('for', 'select-input');
    });

    it('should work with checkbox', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Label htmlFor="checkbox-input">Accept Terms</Label>
          <input id="checkbox-input" type="checkbox" />
        </div>
      );
      
      const label = screen.getByText('Accept Terms');
      const checkbox = document.getElementById('checkbox-input') as HTMLInputElement;
      
      await user.click(label);
      expect(checkbox).toBeChecked();
    });

    it('should work with radio buttons', () => {
      render(
        <div>
          <div>
            <Label htmlFor="radio1">Option 1</Label>
            <input id="radio1" type="radio" name="options" value="1" />
          </div>
          <div>
            <Label htmlFor="radio2">Option 2</Label>
            <input id="radio2" type="radio" name="options" value="2" />
          </div>
        </div>
      );
      
      expect(screen.getByText('Option 1')).toHaveAttribute('for', 'radio1');
      expect(screen.getByText('Option 2')).toHaveAttribute('for', 'radio2');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      const { container } = render(<Label htmlFor="test" />);
      const label = container.querySelector('label');
      expect(label).toBeInTheDocument();
    });

    it('should handle numeric children', () => {
      render(<Label>{123}</Label>);
      expect(screen.getByText('123')).toBeInTheDocument();
    });

    it('should handle boolean htmlFor values', () => {
      // TypeScript would prevent this, but testing runtime behavior
      render(<Label htmlFor="">Empty</Label>);
      const label = screen.getByText('Empty');
      expect(label).toHaveAttribute('for', '');
    });

    it('should handle special characters in text', () => {
      render(<Label>Label & Special * Characters</Label>);
      expect(screen.getByText(/Label & Special \* Characters/)).toBeInTheDocument();
    });

    it('should handle long text content', () => {
      const longText = 'This is a very long label text that might wrap to multiple lines in the UI';
      render(<Label>{longText}</Label>);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should not break with undefined className', () => {
      render(<Label className={undefined}>Label</Label>);
      expect(screen.getByText('Label')).toBeInTheDocument();
    });

    it('should handle multiple className values', () => {
      render(<Label className="class1 class2 class3">Label</Label>);
      const label = screen.getByText('Label');
      expect(label).toHaveClass('class1');
      expect(label).toHaveClass('class2');
      expect(label).toHaveClass('class3');
    });
  });

  describe('Event Handling', () => {
    it('should handle onClick event', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      render(<Label onClick={handleClick}>Clickable</Label>);
      
      await user.click(screen.getByText('Clickable'));
      expect(handleClick).toHaveBeenCalled();
    });

    it('should handle onMouseEnter event', async () => {
      const handleMouseEnter = jest.fn();
      const user = userEvent.setup();
      render(<Label onMouseEnter={handleMouseEnter}>Hoverable</Label>);
      
      await user.hover(screen.getByText('Hoverable'));
      expect(handleMouseEnter).toHaveBeenCalled();
    });

    it('should handle onMouseLeave event', async () => {
      const handleMouseLeave = jest.fn();
      const user = userEvent.setup();
      render(<Label onMouseLeave={handleMouseLeave}>Hoverable</Label>);
      
      const label = screen.getByText('Hoverable');
      await user.hover(label);
      await user.unhover(label);
      expect(handleMouseLeave).toHaveBeenCalled();
    });
  });

  describe('Display Name', () => {
    it('should have correct display name', () => {
      expect(Label.displayName).toBeDefined();
    });
  });
});
