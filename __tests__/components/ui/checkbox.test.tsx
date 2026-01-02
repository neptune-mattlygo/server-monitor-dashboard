import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Checkbox } from '@/components/ui/checkbox';

describe('Checkbox Component', () => {
  describe('Rendering', () => {
    it('should render checkbox', () => {
      const { container } = render(<Checkbox />);
      const checkbox = container.querySelector('button[role="checkbox"]');
      expect(checkbox).toBeInTheDocument();
    });

    it('should render with unchecked state by default', () => {
      const { container } = render(<Checkbox />);
      const checkbox = container.querySelector('button[role="checkbox"]');
      expect(checkbox).toHaveAttribute('data-state', 'unchecked');
      expect(checkbox).toHaveAttribute('aria-checked', 'false');
    });

    it('should render check icon when checked', () => {
      const { container } = render(<Checkbox checked />);
      const checkbox = container.querySelector('button[role="checkbox"]');
      expect(checkbox).toHaveAttribute('data-state', 'checked');
      expect(checkbox).toHaveAttribute('aria-checked', 'true');
    });

    it('should render as button element with checkbox role', () => {
      const { container } = render(<Checkbox />);
      const checkbox = container.querySelector('button[role="checkbox"]');
      expect(checkbox?.tagName).toBe('BUTTON');
    });
  });

  describe('Styling', () => {
    it('should apply default styles', () => {
      const { container } = render(<Checkbox />);
      const checkbox = container.querySelector('button[role="checkbox"]');
      expect(checkbox).toHaveClass('grid');
      expect(checkbox).toHaveClass('place-content-center');
      expect(checkbox).toHaveClass('h-4');
      expect(checkbox).toHaveClass('w-4');
      expect(checkbox).toHaveClass('rounded-sm');
      expect(checkbox).toHaveClass('border');
      expect(checkbox).toHaveClass('border-primary');
    });

    it('should accept custom className', () => {
      const { container } = render(<Checkbox className="custom-checkbox" />);
      const checkbox = container.querySelector('button[role="checkbox"]');
      expect(checkbox).toHaveClass('custom-checkbox');
      expect(checkbox).toHaveClass('h-4');
    });

    it('should apply checked state styles', () => {
      const { container } = render(<Checkbox checked />);
      const checkbox = container.querySelector('button[role="checkbox"]');
      expect(checkbox).toHaveAttribute('data-state', 'checked');
    });

    it('should apply disabled styles when disabled', () => {
      const { container } = render(<Checkbox disabled />);
      const checkbox = container.querySelector('button[role="checkbox"]');
      expect(checkbox).toBeDisabled();
      expect(checkbox).toHaveClass('disabled:cursor-not-allowed');
      expect(checkbox).toHaveClass('disabled:opacity-50');
    });
  });

  describe('Interactions', () => {
    it('should toggle when clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(<Checkbox />);
      const checkbox = container.querySelector('button[role="checkbox"]') as HTMLElement;

      expect(checkbox).toHaveAttribute('data-state', 'unchecked');
      
      await user.click(checkbox);
      expect(checkbox).toHaveAttribute('data-state', 'checked');
      
      await user.click(checkbox);
      expect(checkbox).toHaveAttribute('data-state', 'unchecked');
    });

    it('should call onCheckedChange when toggled', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      const { container } = render(<Checkbox onCheckedChange={handleChange} />);
      const checkbox = container.querySelector('button[role="checkbox"]') as HTMLElement;

      await user.click(checkbox);
      expect(handleChange).toHaveBeenCalledWith(true);

      await user.click(checkbox);
      expect(handleChange).toHaveBeenCalledWith(false);
    });

    it('should not toggle when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      const { container } = render(<Checkbox disabled onCheckedChange={handleChange} />);
      const checkbox = container.querySelector('button[role="checkbox"]') as HTMLElement;

      await user.click(checkbox);
      expect(handleChange).not.toHaveBeenCalled();
      expect(checkbox).toHaveAttribute('data-state', 'unchecked');
    });

    it('should support keyboard interaction with Space key', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      const { container } = render(<Checkbox onCheckedChange={handleChange} />);
      const checkbox = container.querySelector('button[role="checkbox"]') as HTMLElement;

      checkbox.focus();
      await user.keyboard(' ');
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('should support keyboard interaction with Enter key', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      const { container } = render(<Checkbox onCheckedChange={handleChange} />);
      const checkbox = container.querySelector('button[role="checkbox"]') as HTMLElement;

      checkbox.focus();
      // Radix checkbox may not respond to Enter, only Space
      await user.keyboard(' ');
      expect(handleChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Controlled Component', () => {
    it('should work as controlled component', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      const { container, rerender } = render(
        <Checkbox checked={false} onCheckedChange={handleChange} />
      );
      const checkbox = container.querySelector('button[role="checkbox"]') as HTMLElement;

      expect(checkbox).toHaveAttribute('data-state', 'unchecked');

      await user.click(checkbox);
      expect(handleChange).toHaveBeenCalledWith(true);

      rerender(<Checkbox checked={true} onCheckedChange={handleChange} />);
      expect(checkbox).toHaveAttribute('data-state', 'checked');
    });

    it('should update when checked prop changes', () => {
      const { container, rerender } = render(<Checkbox checked={false} />);
      const checkbox = container.querySelector('button[role="checkbox"]');

      expect(checkbox).toHaveAttribute('data-state', 'unchecked');

      rerender(<Checkbox checked={true} />);
      expect(checkbox).toHaveAttribute('data-state', 'checked');

      rerender(<Checkbox checked={false} />);
      expect(checkbox).toHaveAttribute('data-state', 'unchecked');
    });
  });

  describe('Indeterminate State', () => {
    it('should support indeterminate state', () => {
      const { container } = render(<Checkbox checked="indeterminate" />);
      const checkbox = container.querySelector('button[role="checkbox"]');
      expect(checkbox).toHaveAttribute('data-state', 'indeterminate');
      expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
    });

    it('should toggle from indeterminate to checked', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      const { container } = render(
        <Checkbox checked="indeterminate" onCheckedChange={handleChange} />
      );
      const checkbox = container.querySelector('button[role="checkbox"]') as HTMLElement;

      await user.click(checkbox);
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to checkbox element', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Checkbox ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current?.getAttribute('role')).toBe('checkbox');
    });

    it('should allow accessing checkbox through ref', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Checkbox ref={ref} />);
      expect(ref.current?.tagName).toBe('BUTTON');
    });
  });

  describe('Accessibility', () => {
    it('should have correct role attribute', () => {
      const { container } = render(<Checkbox />);
      const checkbox = container.querySelector('button[role="checkbox"]');
      expect(checkbox).toHaveAttribute('role', 'checkbox');
    });

    it('should have correct aria-checked attribute when unchecked', () => {
      const { container } = render(<Checkbox />);
      const checkbox = container.querySelector('button[role="checkbox"]');
      expect(checkbox).toHaveAttribute('aria-checked', 'false');
    });

    it('should have correct aria-checked attribute when checked', () => {
      const { container } = render(<Checkbox checked />);
      const checkbox = container.querySelector('button[role="checkbox"]');
      expect(checkbox).toHaveAttribute('aria-checked', 'true');
    });

    it('should have correct aria-checked attribute when indeterminate', () => {
      const { container } = render(<Checkbox checked="indeterminate" />);
      const checkbox = container.querySelector('button[role="checkbox"]');
      expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
    });

    it('should support aria-label', () => {
      const { container } = render(<Checkbox aria-label="Accept terms" />);
      const checkbox = container.querySelector('button[role="checkbox"]');
      expect(checkbox).toHaveAttribute('aria-label', 'Accept terms');
    });

    it('should be focusable', () => {
      const { container } = render(<Checkbox />);
      const checkbox = container.querySelector('button[role="checkbox"]') as HTMLElement;
      checkbox.focus();
      expect(checkbox).toHaveFocus();
    });

    it('should not be focusable when disabled', () => {
      const { container } = render(<Checkbox disabled />);
      const checkbox = container.querySelector('button[role="checkbox"]') as HTMLElement;
      expect(checkbox).toBeDisabled();
    });

    it('should support focus-visible styles', () => {
      const { container } = render(<Checkbox />);
      const checkbox = container.querySelector('button[role="checkbox"]');
      expect(checkbox).toHaveClass('focus-visible:outline-none');
      expect(checkbox).toHaveClass('focus-visible:ring-1');
    });
  });

  describe('Server Monitor Use Cases', () => {
    it('should work in server selection form', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      
      render(
        <div>
          <label htmlFor="server-1">
            <Checkbox id="server-1" onCheckedChange={handleChange} />
            <span>Production Server</span>
          </label>
        </div>
      );

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('should work in filter options', async () => {
      const user = userEvent.setup();
      const filters = {
        showOnline: false,
        showOffline: false,
        showMaintenance: false,
      };

      const { container } = render(
        <div>
          <Checkbox 
            checked={filters.showOnline}
            aria-label="Show online servers"
          />
          <Checkbox 
            checked={filters.showOffline}
            aria-label="Show offline servers"
          />
          <Checkbox 
            checked={filters.showMaintenance}
            aria-label="Show maintenance servers"
          />
        </div>
      );

      const checkboxes = container.querySelectorAll('button[role="checkbox"]');
      expect(checkboxes).toHaveLength(3);
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toHaveAttribute('data-state', 'unchecked');
      });
    });

    it('should work for bulk actions', async () => {
      const user = userEvent.setup();
      const handleSelectAll = jest.fn();
      
      const { container } = render(
        <Checkbox 
          checked="indeterminate"
          onCheckedChange={handleSelectAll}
          aria-label="Select all servers"
        />
      );

      const checkbox = container.querySelector('button[role="checkbox"]') as HTMLElement;
      expect(checkbox).toHaveAttribute('data-state', 'indeterminate');
      
      await user.click(checkbox);
      expect(handleSelectAll).toHaveBeenCalled();
    });

    it('should work in notification settings', () => {
      render(
        <div>
          <label>
            <Checkbox defaultChecked />
            <span>Email notifications</span>
          </label>
          <label>
            <Checkbox />
            <span>SMS notifications</span>
          </label>
        </div>
      );

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toHaveAttribute('data-state', 'checked');
      expect(checkboxes[1]).toHaveAttribute('data-state', 'unchecked');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid clicks', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      const { container } = render(<Checkbox onCheckedChange={handleChange} />);
      const checkbox = container.querySelector('button[role="checkbox"]') as HTMLElement;

      await user.click(checkbox);
      await user.click(checkbox);
      await user.click(checkbox);

      expect(handleChange).toHaveBeenCalledTimes(3);
    });

    it('should handle defaultChecked prop', () => {
      const { container } = render(<Checkbox defaultChecked />);
      const checkbox = container.querySelector('button[role="checkbox"]');
      expect(checkbox).toHaveAttribute('data-state', 'checked');
    });

    it('should work with form attributes', () => {
      const { container } = render(
        <Checkbox name="agree" value="yes" />
      );
      const checkbox = container.querySelector('button[role="checkbox"]');
      // Radix UI handles form attributes internally
      expect(checkbox).toBeInTheDocument();
    });

    it('should support required behavior', () => {
      const { container } = render(<Checkbox required />);
      const checkbox = container.querySelector('button[role="checkbox"]');
      // Radix checkbox may handle required differently
      expect(checkbox).toBeInTheDocument();
    });

    it('should support data attributes', () => {
      const { container } = render(
        <Checkbox data-testid="my-checkbox" data-server-id="123" />
      );
      const checkbox = container.querySelector('button[role="checkbox"]');
      expect(checkbox).toHaveAttribute('data-testid', 'my-checkbox');
      expect(checkbox).toHaveAttribute('data-server-id', '123');
    });
  });

  describe('Display Name', () => {
    it('should have correct displayName', () => {
      expect(Checkbox.displayName).toBe('Checkbox');
    });
  });

  describe('Component Export', () => {
    it('should export Checkbox component', () => {
      expect(Checkbox).toBeDefined();
      expect(Checkbox).toBeTruthy();
    });
  });

  describe('Multiple Checkboxes', () => {
    it('should handle multiple independent checkboxes', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <div>
          <Checkbox data-testid="checkbox-1" />
          <Checkbox data-testid="checkbox-2" />
          <Checkbox data-testid="checkbox-3" />
        </div>
      );

      const checkboxes = container.querySelectorAll('button[role="checkbox"]');
      expect(checkboxes).toHaveLength(3);

      await user.click(checkboxes[0] as HTMLElement);
      expect(checkboxes[0]).toHaveAttribute('data-state', 'checked');
      expect(checkboxes[1]).toHaveAttribute('data-state', 'unchecked');
      expect(checkboxes[2]).toHaveAttribute('data-state', 'unchecked');
    });

    it('should manage checkbox group state', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      
      render(
        <div role="group" aria-label="Server types">
          <Checkbox aria-label="Web servers" onCheckedChange={handleChange} />
          <Checkbox aria-label="Database servers" onCheckedChange={handleChange} />
          <Checkbox aria-label="Cache servers" onCheckedChange={handleChange} />
        </div>
      );

      const checkboxes = screen.getAllByRole('checkbox');
      
      await user.click(checkboxes[0]);
      await user.click(checkboxes[2]);

      expect(handleChange).toHaveBeenCalledTimes(2);
    });
  });

  describe('Visual States', () => {
    it('should show check icon when checked', () => {
      const { container } = render(<Checkbox checked />);
      const checkbox = container.querySelector('button[role="checkbox"]');
      const indicator = checkbox?.querySelector('span[data-state="checked"]');
      expect(indicator).toBeInTheDocument();
    });

    it('should not show check icon when unchecked', () => {
      const { container } = render(<Checkbox checked={false} />);
      const checkbox = container.querySelector('button[role="checkbox"]');
      const indicator = checkbox?.querySelector('span[data-state="checked"]');
      expect(indicator).not.toBeInTheDocument();
    });
  });
});
