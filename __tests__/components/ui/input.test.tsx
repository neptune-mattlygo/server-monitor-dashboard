import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/input';

describe('Input Component', () => {
  describe('Rendering', () => {
    it('should render input element', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should render with placeholder', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('should render with default value', () => {
      render(<Input defaultValue="Default text" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('Default text');
    });

    it('should render with controlled value', () => {
      render(<Input value="Controlled value" onChange={() => {}} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('Controlled value');
    });

    it('should render with name attribute', () => {
      render(<Input name="username" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.name).toBe('username');
    });

    it('should render with id attribute', () => {
      render(<Input id="test-input" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'test-input');
    });
  });

  describe('Types', () => {
    it('should render as textbox by default', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should render with email type', () => {
      render(<Input type="email" />);
      const input = document.querySelector('input[type="email"]');
      expect(input).toBeInTheDocument();
    });

    it('should render with password type', () => {
      render(<Input type="password" />);
      const input = document.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
    });

    it('should render with number type', () => {
      render(<Input type="number" />);
      const input = document.querySelector('input[type="number"]');
      expect(input).toBeInTheDocument();
    });

    it('should render with tel type', () => {
      render(<Input type="tel" />);
      const input = document.querySelector('input[type="tel"]');
      expect(input).toBeInTheDocument();
    });

    it('should render with url type', () => {
      render(<Input type="url" />);
      const input = document.querySelector('input[type="url"]');
      expect(input).toBeInTheDocument();
    });

    it('should render with search type', () => {
      render(<Input type="search" />);
      const input = document.querySelector('input[type="search"]');
      expect(input).toBeInTheDocument();
    });

    it('should render with date type', () => {
      render(<Input type="date" />);
      const input = document.querySelector('input[type="date"]');
      expect(input).toBeInTheDocument();
    });

    it('should render with file type', () => {
      render(<Input type="file" />);
      const input = document.querySelector('input[type="file"]');
      expect(input).toBeInTheDocument();
    });
  });

  describe('States', () => {
    it('should render disabled state', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('should apply disabled styling classes', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('disabled:cursor-not-allowed');
      expect(input).toHaveClass('disabled:opacity-50');
    });

    it('should render readonly state', () => {
      render(<Input readOnly />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('readonly');
    });

    it('should render required state', () => {
      render(<Input required />);
      const input = screen.getByRole('textbox');
      expect(input).toBeRequired();
    });

    it('should render with maxLength attribute', () => {
      render(<Input maxLength={10} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('maxLength', '10');
    });

    it('should render with minLength attribute', () => {
      render(<Input minLength={3} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('minLength', '3');
    });

    it('should render with pattern attribute', () => {
      render(<Input pattern="[0-9]*" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('pattern', '[0-9]*');
    });
  });

  describe('Styling', () => {
    it('should apply default styling classes', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('flex');
      expect(input).toHaveClass('h-9');
      expect(input).toHaveClass('w-full');
      expect(input).toHaveClass('rounded-md');
      expect(input).toHaveClass('border');
      expect(input).toHaveClass('border-input');
    });

    it('should apply background and padding classes', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('bg-transparent');
      expect(input).toHaveClass('px-3');
      expect(input).toHaveClass('py-1');
    });

    it('should apply text styling classes', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('text-base');
      expect(input).toHaveClass('md:text-sm');
    });

    it('should apply shadow and transition classes', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('shadow-sm');
      expect(input).toHaveClass('transition-colors');
    });

    it('should apply placeholder styling', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('placeholder:text-muted-foreground');
    });

    it('should apply focus styling classes', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('focus-visible:outline-none');
      expect(input).toHaveClass('focus-visible:ring-1');
      expect(input).toHaveClass('focus-visible:ring-ring');
    });

    it('should apply file input styling', () => {
      render(<Input type="file" />);
      const input = document.querySelector('input[type="file"]');
      expect(input).toHaveClass('file:border-0');
      expect(input).toHaveClass('file:bg-transparent');
      expect(input).toHaveClass('file:text-sm');
      expect(input).toHaveClass('file:font-medium');
      expect(input).toHaveClass('file:text-foreground');
    });

    it('should accept custom className', () => {
      render(<Input className="custom-input" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-input');
    });

    it('should merge custom className with default classes', () => {
      render(<Input className="custom-class" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class');
      expect(input).toHaveClass('flex');
      expect(input).toHaveClass('w-full');
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to input element', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('should allow ref to access input value', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} defaultValue="Test" />);
      expect(ref.current?.value).toBe('Test');
    });

    it('should allow ref to focus input', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);
      ref.current?.focus();
      expect(ref.current).toHaveFocus();
    });
  });

  describe('User Interactions', () => {
    it('should handle onChange event', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');
      
      await user.type(input, 'a');
      expect(handleChange).toHaveBeenCalled();
    });

    it('should update value on user input', async () => {
      const user = userEvent.setup();
      render(<Input />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      
      await user.type(input, 'Hello');
      expect(input.value).toBe('Hello');
    });

    it('should handle onFocus event', async () => {
      const handleFocus = jest.fn();
      const user = userEvent.setup();
      render(<Input onFocus={handleFocus} />);
      const input = screen.getByRole('textbox');
      
      await user.click(input);
      expect(handleFocus).toHaveBeenCalled();
    });

    it('should handle onBlur event', async () => {
      const handleBlur = jest.fn();
      const user = userEvent.setup();
      render(<Input onBlur={handleBlur} />);
      const input = screen.getByRole('textbox');
      
      await user.click(input);
      await user.tab();
      expect(handleBlur).toHaveBeenCalled();
    });

    it('should handle onKeyDown event', async () => {
      const handleKeyDown = jest.fn();
      const user = userEvent.setup();
      render(<Input onKeyDown={handleKeyDown} />);
      const input = screen.getByRole('textbox');
      
      input.focus();
      await user.keyboard('{Enter}');
      expect(handleKeyDown).toHaveBeenCalled();
    });

    it('should not allow typing when disabled', async () => {
      const user = userEvent.setup();
      render(<Input disabled defaultValue="" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      
      await user.type(input, 'test');
      expect(input.value).toBe('');
    });

    it('should not allow typing when readonly', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      render(<Input readOnly onChange={handleChange} defaultValue="Initial" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      
      await user.type(input, 'test');
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible role', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should support aria-label', () => {
      render(<Input aria-label="Username input" />);
      expect(screen.getByLabelText('Username input')).toBeInTheDocument();
    });

    it('should support aria-describedby', () => {
      render(<Input aria-describedby="helper-text" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'helper-text');
    });

    it('should support aria-invalid', () => {
      render(<Input aria-invalid="true" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should support aria-required', () => {
      render(<Input aria-required="true" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<Input />);
      const input = screen.getByRole('textbox');
      
      await user.tab();
      expect(input).toHaveFocus();
    });
  });

  describe('Number Input', () => {
    it('should accept min attribute', () => {
      render(<Input type="number" min={0} />);
      const input = document.querySelector('input[type="number"]');
      expect(input).toHaveAttribute('min', '0');
    });

    it('should accept max attribute', () => {
      render(<Input type="number" max={100} />);
      const input = document.querySelector('input[type="number"]');
      expect(input).toHaveAttribute('max', '100');
    });

    it('should accept step attribute', () => {
      render(<Input type="number" step={0.1} />);
      const input = document.querySelector('input[type="number"]');
      expect(input).toHaveAttribute('step', '0.1');
    });
  });

  describe('Integration', () => {
    it('should work in a form', () => {
      const handleSubmit = jest.fn((e) => e.preventDefault());
      render(
        <form onSubmit={handleSubmit}>
          <Input name="username" />
          <button type="submit">Submit</button>
        </form>
      );
      
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should submit form value', async () => {
      const handleSubmit = jest.fn((e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        return formData.get('username');
      });
      const user = userEvent.setup();
      
      render(
        <form onSubmit={handleSubmit}>
          <Input name="username" />
          <button type="submit">Submit</button>
        </form>
      );
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'testuser');
      await user.click(screen.getByRole('button'));
      
      expect(handleSubmit).toHaveBeenCalled();
    });

    it('should work with label', () => {
      render(
        <div>
          <label htmlFor="test-input">Username</label>
          <Input id="test-input" />
        </div>
      );
      
      const label = screen.getByText('Username');
      const input = screen.getByLabelText('Username');
      expect(label).toBeInTheDocument();
      expect(input).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string value', () => {
      render(<Input value="" onChange={() => {}} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('should handle undefined value', () => {
      render(<Input value={undefined} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('should handle autoComplete attribute', () => {
      render(<Input autoComplete="off" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('autoComplete', 'off');
    });

    it('should handle autoFocus attribute', () => {
      render(<Input autoFocus />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveFocus();
    });

    it('should handle multiple inputs', () => {
      render(
        <div>
          <Input placeholder="First" />
          <Input placeholder="Second" />
          <Input placeholder="Third" />
        </div>
      );
      
      expect(screen.getByPlaceholderText('First')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Second')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Third')).toBeInTheDocument();
    });
  });
});
