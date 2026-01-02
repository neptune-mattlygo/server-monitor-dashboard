import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

describe('Alert Component', () => {
  describe('Rendering', () => {
    it('should render basic alert', () => {
      render(<Alert>Test alert</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent('Test alert');
    });

    it('should render alert with title and description', () => {
      render(
        <Alert>
          <AlertTitle>Alert Title</AlertTitle>
          <AlertDescription>Alert description content</AlertDescription>
        </Alert>
      );
      
      expect(screen.getByText('Alert Title')).toBeInTheDocument();
      expect(screen.getByText('Alert description content')).toBeInTheDocument();
    });

    it('should render alert with only title', () => {
      render(
        <Alert>
          <AlertTitle>Just a title</AlertTitle>
        </Alert>
      );
      
      expect(screen.getByText('Just a title')).toBeInTheDocument();
    });

    it('should render alert with only description', () => {
      render(
        <Alert>
          <AlertDescription>Just a description</AlertDescription>
        </Alert>
      );
      
      expect(screen.getByText('Just a description')).toBeInTheDocument();
    });

    it('should render alert with children of any type', () => {
      render(
        <Alert>
          <span>Span child</span>
          <p>Paragraph child</p>
        </Alert>
      );
      
      expect(screen.getByText('Span child')).toBeInTheDocument();
      expect(screen.getByText('Paragraph child')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should render default variant', () => {
      render(<Alert variant="default">Default alert</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-background', 'text-foreground');
    });

    it('should render destructive variant', () => {
      render(<Alert variant="destructive">Destructive alert</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('border-destructive/50', 'text-destructive');
    });

    it('should use default variant when no variant specified', () => {
      render(<Alert>No variant alert</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-background', 'text-foreground');
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className to Alert', () => {
      render(<Alert className="custom-alert-class">Custom alert</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('custom-alert-class');
    });

    it('should apply custom className to AlertTitle', () => {
      render(
        <Alert>
          <AlertTitle className="custom-title-class">Title</AlertTitle>
        </Alert>
      );
      
      const title = screen.getByText('Title');
      expect(title).toHaveClass('custom-title-class');
    });

    it('should apply custom className to AlertDescription', () => {
      render(
        <Alert>
          <AlertDescription className="custom-desc-class">Description</AlertDescription>
        </Alert>
      );
      
      const description = screen.getByText('Description');
      expect(description).toHaveClass('custom-desc-class');
    });

    it('should merge custom className with default classes', () => {
      render(<Alert className="my-4">Alert</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('my-4', 'rounded-lg', 'border');
    });

    it('should apply base styles to Alert', () => {
      render(<Alert>Styled alert</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('relative', 'w-full', 'rounded-lg', 'border', 'px-4', 'py-3', 'text-sm');
    });

    it('should apply base styles to AlertTitle', () => {
      render(
        <Alert>
          <AlertTitle>Title</AlertTitle>
        </Alert>
      );
      
      const title = screen.getByText('Title');
      expect(title).toHaveClass('mb-1', 'font-medium', 'leading-none', 'tracking-tight');
    });

    it('should apply base styles to AlertDescription', () => {
      render(
        <Alert>
          <AlertDescription>Description</AlertDescription>
        </Alert>
      );
      
      const description = screen.getByText('Description');
      expect(description).toHaveClass('text-sm');
    });
  });

  describe('Accessibility', () => {
    it('should have role="alert"', () => {
      render(<Alert>Alert</Alert>);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should be accessible with title', () => {
      render(
        <Alert>
          <AlertTitle>Important Notice</AlertTitle>
          <AlertDescription>This is important information</AlertDescription>
        </Alert>
      );
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent('Important Notice');
    });

    it('should render AlertTitle as h5 element', () => {
      const { container } = render(
        <Alert>
          <AlertTitle>Title</AlertTitle>
        </Alert>
      );
      
      const h5 = container.querySelector('h5');
      expect(h5).toBeInTheDocument();
      expect(h5).toHaveTextContent('Title');
    });

    it('should render AlertDescription as div element', () => {
      const { container } = render(
        <Alert>
          <AlertDescription>Description</AlertDescription>
        </Alert>
      );
      
      const div = container.querySelector('div[class*="text-sm"]');
      expect(div).toBeInTheDocument();
      expect(div).toHaveTextContent('Description');
    });
  });

  describe('Icon Support', () => {
    const TestIcon = () => <svg data-testid="test-icon">Icon</svg>;

    it('should render with icon', () => {
      render(
        <Alert>
          <TestIcon />
          <AlertTitle>Alert with icon</AlertTitle>
          <AlertDescription>Description</AlertDescription>
        </Alert>
      );
      
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(screen.getByText('Alert with icon')).toBeInTheDocument();
    });

    it('should apply icon positioning styles', () => {
      render(<Alert><TestIcon />Content</Alert>);
      const alert = screen.getByRole('alert');
      // Check for SVG positioning classes
      expect(alert).toHaveClass('[&>svg]:absolute', '[&>svg]:left-4', '[&>svg]:top-4');
    });

    it('should apply icon text color styles', () => {
      render(<Alert><TestIcon />Content</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('[&>svg]:text-foreground');
    });

    it('should apply icon text color for destructive variant', () => {
      render(<Alert variant="destructive"><TestIcon />Content</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('[&>svg]:text-destructive');
    });

    it('should apply padding to content after icon', () => {
      render(<Alert><TestIcon />Content</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('[&>svg~*]:pl-7');
    });
  });

  describe('Content Variations', () => {
    it('should render HTML in AlertDescription', () => {
      render(
        <Alert>
          <AlertDescription>
            <p>Paragraph 1</p>
            <p>Paragraph 2</p>
          </AlertDescription>
        </Alert>
      );
      
      expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
      expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
    });

    it('should render multiple AlertDescriptions', () => {
      render(
        <Alert>
          <AlertDescription>First description</AlertDescription>
          <AlertDescription>Second description</AlertDescription>
        </Alert>
      );
      
      expect(screen.getByText('First description')).toBeInTheDocument();
      expect(screen.getByText('Second description')).toBeInTheDocument();
    });

    it('should render complex content structure', () => {
      render(
        <Alert>
          <AlertTitle>Complex Alert</AlertTitle>
          <AlertDescription>
            <p>First paragraph</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </AlertDescription>
        </Alert>
      );
      
      expect(screen.getByText('Complex Alert')).toBeInTheDocument();
      expect(screen.getByText('First paragraph')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });

  describe('Props and Attributes', () => {
    it('should pass through additional props to Alert', () => {
      render(<Alert data-testid="custom-alert" aria-label="Custom label">Alert</Alert>);
      const alert = screen.getByTestId('custom-alert');
      expect(alert).toHaveAttribute('aria-label', 'Custom label');
    });

    it('should pass through additional props to AlertTitle', () => {
      render(
        <Alert>
          <AlertTitle data-testid="custom-title" id="title-id">Title</AlertTitle>
        </Alert>
      );
      
      const title = screen.getByTestId('custom-title');
      expect(title).toHaveAttribute('id', 'title-id');
    });

    it('should pass through additional props to AlertDescription', () => {
      render(
        <Alert>
          <AlertDescription data-testid="custom-desc" id="desc-id">Description</AlertDescription>
        </Alert>
      );
      
      const description = screen.getByTestId('custom-desc');
      expect(description).toHaveAttribute('id', 'desc-id');
    });

    it('should handle onClick event', () => {
      const handleClick = jest.fn();
      render(<Alert onClick={handleClick}>Clickable alert</Alert>);
      
      const alert = screen.getByRole('alert');
      alert.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should render empty alert', () => {
      render(<Alert />);
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toBeEmptyDOMElement();
    });

    it('should render with null children', () => {
      render(<Alert>{null}</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should render with undefined children', () => {
      render(<Alert>{undefined}</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should render with conditional content', () => {
      const showDescription = false;
      render(
        <Alert>
          <AlertTitle>Title</AlertTitle>
          {showDescription && <AlertDescription>Description</AlertDescription>}
        </Alert>
      );
      
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.queryByText('Description')).not.toBeInTheDocument();
    });

    it('should handle very long content', () => {
      const longText = 'A'.repeat(1000);
      render(
        <Alert>
          <AlertDescription>{longText}</AlertDescription>
        </Alert>
      );
      
      expect(screen.getByText(longText)).toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to Alert div', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Alert ref={ref}>Alert</Alert>);
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toHaveTextContent('Alert');
    });

    it('should forward ref to AlertTitle', () => {
      const ref = React.createRef<HTMLParagraphElement>();
      render(
        <Alert>
          <AlertTitle ref={ref}>Title</AlertTitle>
        </Alert>
      );
      
      expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
      expect(ref.current).toHaveTextContent('Title');
    });

    it('should forward ref to AlertDescription', () => {
      const ref = React.createRef<HTMLParagraphElement>();
      render(
        <Alert>
          <AlertDescription ref={ref}>Description</AlertDescription>
        </Alert>
      );
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toHaveTextContent('Description');
    });
  });

  describe('Component Display Names', () => {
    it('should have correct display name for Alert', () => {
      expect(Alert.displayName).toBe('Alert');
    });

    it('should have correct display name for AlertTitle', () => {
      expect(AlertTitle.displayName).toBe('AlertTitle');
    });

    it('should have correct display name for AlertDescription', () => {
      expect(AlertDescription.displayName).toBe('AlertDescription');
    });
  });
});
