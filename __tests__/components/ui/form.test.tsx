import React from 'react';
import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
  useFormField,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

// Helper component to test form fields
const TestFormComponent = ({ 
  defaultValues = { username: '', email: '' },
  errors = {},
}: { 
  defaultValues?: any;
  errors?: Record<string, string>;
}) => {
  const form = useForm({
    defaultValues,
  });

  // Manually set errors if provided
  React.useEffect(() => {
    Object.keys(errors).forEach((key) => {
      form.setError(key as any, { message: errors[key] });
    });
  }, [errors, form]);

  return (
    <Form {...form}>
      <form>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter username" {...field} />
              </FormControl>
              <FormDescription>This is your public display name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Enter email" type="email" {...field} />
              </FormControl>
              <FormDescription>We'll never share your email.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};

describe('Form Components', () => {
  describe('Form (FormProvider)', () => {
    it('should render form provider', () => {
      const { container } = render(<TestFormComponent />);
      expect(container).toBeInTheDocument();
    });

    it('should provide form context to children', () => {
      render(<TestFormComponent />);
      expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
    });

    it('should accept default values', () => {
      render(<TestFormComponent defaultValues={{ username: 'john', email: 'john@example.com' }} />);
      const usernameInput = screen.getByPlaceholderText('Enter username') as HTMLInputElement;
      const emailInput = screen.getByPlaceholderText('Enter email') as HTMLInputElement;
      expect(usernameInput.value).toBe('john');
      expect(emailInput.value).toBe('john@example.com');
    });
  });

  describe('FormField', () => {
    it('should render form field with controller', () => {
      render(<TestFormComponent />);
      expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
    });

    it('should provide field context', () => {
      render(<TestFormComponent />);
      const input = screen.getByPlaceholderText('Enter username');
      expect(input).toHaveAttribute('id');
    });

    it('should render multiple fields', () => {
      render(<TestFormComponent />);
      expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
    });
  });

  describe('FormItem', () => {
    it('should render form item container', () => {
      const TestComponent = () => {
        const form = useForm({ defaultValues: { test: '' } });
        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={() => (
                <FormItem data-testid="form-item">
                  <div>Content</div>
                </FormItem>
              )}
            />
          </Form>
        );
      };
      render(<TestComponent />);
      expect(screen.getByTestId('form-item')).toBeInTheDocument();
    });

    it('should apply default spacing className', () => {
      const TestComponent = () => {
        const form = useForm({ defaultValues: { test: '' } });
        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={() => (
                <FormItem data-testid="form-item">
                  <div>Content</div>
                </FormItem>
              )}
            />
          </Form>
        );
      };
      render(<TestComponent />);
      expect(screen.getByTestId('form-item')).toHaveClass('space-y-2');
    });

    it('should accept custom className', () => {
      const TestComponent = () => {
        const form = useForm({ defaultValues: { test: '' } });
        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={() => (
                <FormItem className="custom-form-item" data-testid="form-item">
                  <div>Content</div>
                </FormItem>
              )}
            />
          </Form>
        );
      };
      render(<TestComponent />);
      expect(screen.getByTestId('form-item')).toHaveClass('custom-form-item');
      expect(screen.getByTestId('form-item')).toHaveClass('space-y-2');
    });

    it('should accept ref prop', () => {
      const ref = React.createRef<HTMLDivElement>();
      const TestComponent = () => {
        const form = useForm({ defaultValues: { test: '' } });
        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={() => (
                <FormItem ref={ref}>
                  <div>Content</div>
                </FormItem>
              )}
            />
          </Form>
        );
      };
      const { container } = render(<TestComponent />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('FormLabel', () => {
    it('should render label text', () => {
      render(<TestFormComponent />);
      expect(screen.getByText('Username')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('should have correct htmlFor attribute', () => {
      render(<TestFormComponent />);
      const label = screen.getByText('Username');
      const input = screen.getByPlaceholderText('Enter username');
      expect(label).toHaveAttribute('for', input.id);
    });

    it('should apply error styling when field has error', () => {
      render(<TestFormComponent errors={{ username: 'Username is required' }} />);
      const label = screen.getByText('Username');
      expect(label).toHaveClass('text-destructive');
    });

    it('should not apply error styling when field has no error', () => {
      render(<TestFormComponent />);
      const label = screen.getByText('Username');
      expect(label).not.toHaveClass('text-destructive');
    });

    it('should accept custom className', () => {
      const TestComponent = () => {
        const form = useForm({ defaultValues: { test: '' } });
        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={() => (
                <FormItem>
                  <FormLabel className="custom-label">Custom Label</FormLabel>
                </FormItem>
              )}
            />
          </Form>
        );
      };
      render(<TestComponent />);
      expect(screen.getByText('Custom Label')).toHaveClass('custom-label');
    });
  });

  describe('FormControl', () => {
    it('should render form control with input', () => {
      render(<TestFormComponent />);
      expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
    });

    it('should have correct id attribute', () => {
      render(<TestFormComponent />);
      const input = screen.getByPlaceholderText('Enter username');
      expect(input).toHaveAttribute('id');
      expect(input.id).toMatch(/-form-item$/);
    });

    it('should have aria-describedby without error', () => {
      render(<TestFormComponent />);
      const input = screen.getByPlaceholderText('Enter username');
      expect(input).toHaveAttribute('aria-describedby');
      expect(input.getAttribute('aria-describedby')).toContain('form-item-description');
    });

    it('should have aria-describedby with error', () => {
      render(<TestFormComponent errors={{ username: 'Username is required' }} />);
      const input = screen.getByPlaceholderText('Enter username');
      expect(input).toHaveAttribute('aria-describedby');
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toContain('form-item-description');
      expect(describedBy).toContain('form-item-message');
    });

    it('should set aria-invalid when field has error', () => {
      render(<TestFormComponent errors={{ username: 'Username is required' }} />);
      const input = screen.getByPlaceholderText('Enter username');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should not set aria-invalid when field has no error', () => {
      render(<TestFormComponent />);
      const input = screen.getByPlaceholderText('Enter username');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });
  });

  describe('FormDescription', () => {
    it('should render description text', () => {
      render(<TestFormComponent />);
      expect(screen.getByText('This is your public display name.')).toBeInTheDocument();
      expect(screen.getByText("We'll never share your email.")).toBeInTheDocument();
    });

    it('should have correct id attribute', () => {
      render(<TestFormComponent />);
      const description = screen.getByText('This is your public display name.');
      expect(description).toHaveAttribute('id');
      expect(description.id).toMatch(/-form-item-description$/);
    });

    it('should have default text styling', () => {
      render(<TestFormComponent />);
      const description = screen.getByText('This is your public display name.');
      expect(description).toHaveClass('text-[0.8rem]');
      expect(description).toHaveClass('text-muted-foreground');
    });

    it('should accept custom className', () => {
      const TestComponent = () => {
        const form = useForm({ defaultValues: { test: '' } });
        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={() => (
                <FormItem>
                  <FormDescription className="custom-description">
                    Custom description
                  </FormDescription>
                </FormItem>
              )}
            />
          </Form>
        );
      };
      render(<TestComponent />);
      expect(screen.getByText('Custom description')).toHaveClass('custom-description');
    });

    it('should accept ref prop', () => {
      const ref = React.createRef<HTMLParagraphElement>();
      const TestComponent = () => {
        const form = useForm({ defaultValues: { test: '' } });
        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={() => (
                <FormItem>
                  <FormDescription ref={ref}>Description</FormDescription>
                </FormItem>
              )}
            />
          </Form>
        );
      };
      const { container } = render(<TestComponent />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('FormMessage', () => {
    it('should render error message when field has error', () => {
      render(<TestFormComponent errors={{ username: 'Username is required' }} />);
      expect(screen.getByText('Username is required')).toBeInTheDocument();
    });

    it('should not render when field has no error and no children', () => {
      const TestComponent = () => {
        const form = useForm({ defaultValues: { test: '' } });
        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={() => (
                <FormItem>
                  <FormMessage data-testid="form-message" />
                </FormItem>
              )}
            />
          </Form>
        );
      };
      render(<TestComponent />);
      expect(screen.queryByTestId('form-message')).not.toBeInTheDocument();
    });

    it('should render custom children when no error', () => {
      const TestComponent = () => {
        const form = useForm({ defaultValues: { test: '' } });
        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={() => (
                <FormItem>
                  <FormMessage>Custom message</FormMessage>
                </FormItem>
              )}
            />
          </Form>
        );
      };
      render(<TestComponent />);
      expect(screen.getByText('Custom message')).toBeInTheDocument();
    });

    it('should prioritize error message over children', () => {
      const TestComponent = () => {
        const form = useForm({ defaultValues: { test: '' } });
        
        React.useEffect(() => {
          form.setError('test', { message: 'Error message' });
        }, [form]);

        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={() => (
                <FormItem>
                  <FormMessage>Custom message</FormMessage>
                </FormItem>
              )}
            />
          </Form>
        );
      };
      render(<TestComponent />);
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.queryByText('Custom message')).not.toBeInTheDocument();
    });

    it('should have correct id attribute', () => {
      render(<TestFormComponent errors={{ username: 'Username is required' }} />);
      const message = screen.getByText('Username is required');
      expect(message).toHaveAttribute('id');
      expect(message.id).toMatch(/-form-item-message$/);
    });

    it('should have default error styling', () => {
      render(<TestFormComponent errors={{ username: 'Username is required' }} />);
      const message = screen.getByText('Username is required');
      expect(message).toHaveClass('text-[0.8rem]');
      expect(message).toHaveClass('font-medium');
      expect(message).toHaveClass('text-destructive');
    });

    it('should accept custom className', () => {
      render(<TestFormComponent errors={{ username: 'Username is required' }} />);
      const TestComponent = () => {
        const form = useForm({ defaultValues: { test: '' } });
        
        React.useEffect(() => {
          form.setError('test', { message: 'Error' });
        }, [form]);

        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={() => (
                <FormItem>
                  <FormMessage className="custom-error">Error</FormMessage>
                </FormItem>
              )}
            />
          </Form>
        );
      };
      render(<TestComponent />);
      expect(screen.getAllByText('Error')[0]).toHaveClass('custom-error');
    });

    it('should accept ref prop', () => {
      const ref = React.createRef<HTMLParagraphElement>();
      const TestComponent = () => {
        const form = useForm({ defaultValues: { test: '' } });
        
        React.useEffect(() => {
          form.setError('test', { message: 'Error' });
        }, [form]);

        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={() => (
                <FormItem>
                  <FormMessage ref={ref} />
                </FormItem>
              )}
            />
          </Form>
        );
      };
      const { container } = render(<TestComponent />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should render complete form with all components', () => {
      render(<TestFormComponent />);
      
      // Check all labels
      expect(screen.getByText('Username')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      
      // Check all inputs
      expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
      
      // Check all descriptions
      expect(screen.getByText('This is your public display name.')).toBeInTheDocument();
      expect(screen.getByText("We'll never share your email.")).toBeInTheDocument();
    });

    it('should handle multiple fields with errors', () => {
      render(
        <TestFormComponent 
          errors={{ 
            username: 'Username is required',
            email: 'Email is invalid'
          }} 
        />
      );
      
      expect(screen.getByText('Username is required')).toBeInTheDocument();
      expect(screen.getByText('Email is invalid')).toBeInTheDocument();
    });

    it('should link label to input via htmlFor and id', () => {
      render(<TestFormComponent />);
      
      const usernameLabel = screen.getByText('Username');
      const usernameInput = screen.getByPlaceholderText('Enter username');
      expect(usernameLabel).toHaveAttribute('for', usernameInput.id);
      
      const emailLabel = screen.getByText('Email');
      const emailInput = screen.getByPlaceholderText('Enter email');
      expect(emailLabel).toHaveAttribute('for', emailInput.id);
    });

    it('should connect description to input via aria-describedby', () => {
      render(<TestFormComponent />);
      
      const usernameInput = screen.getByPlaceholderText('Enter username');
      const usernameDescription = screen.getByText('This is your public display name.');
      expect(usernameInput.getAttribute('aria-describedby')).toContain(usernameDescription.id);
    });

    it('should connect error message to input via aria-describedby', () => {
      render(<TestFormComponent errors={{ username: 'Username is required' }} />);
      
      const usernameInput = screen.getByPlaceholderText('Enter username');
      const errorMessage = screen.getByText('Username is required');
      expect(usernameInput.getAttribute('aria-describedby')).toContain(errorMessage.id);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on form controls', () => {
      render(<TestFormComponent />);
      
      const input = screen.getByPlaceholderText('Enter username');
      expect(input).toHaveAttribute('aria-describedby');
      expect(input).toHaveAttribute('aria-invalid');
    });

    it('should set aria-invalid to true when field has error', () => {
      render(<TestFormComponent errors={{ username: 'Username is required' }} />);
      
      const input = screen.getByPlaceholderText('Enter username');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should have unique ids for form elements', () => {
      render(<TestFormComponent />);
      
      const usernameInput = screen.getByPlaceholderText('Enter username');
      const emailInput = screen.getByPlaceholderText('Enter email');
      
      expect(usernameInput.id).not.toBe(emailInput.id);
    });
  });
});
