import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

describe('Card Component', () => {
  describe('Card', () => {
    it('should render card', () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('should apply default styles', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('rounded-xl');
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('bg-card');
      expect(card).toHaveClass('text-card-foreground');
      expect(card).toHaveClass('shadow');
    });

    it('should accept custom className', () => {
      const { container } = render(<Card className="custom-class">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('custom-class');
      expect(card).toHaveClass('rounded-xl');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Card ref={ref}>Content</Card>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should render as div element', () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.firstChild?.nodeName).toBe('DIV');
    });

    it('should accept HTML div attributes', () => {
      render(<Card data-testid="card" id="test-card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('id', 'test-card');
    });

    it('should render children correctly', () => {
      render(
        <Card>
          <div>Child 1</div>
          <div>Child 2</div>
        </Card>
      );
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });

    it('should have correct displayName', () => {
      expect(Card.displayName).toBe('Card');
    });
  });

  describe('CardHeader', () => {
    it('should render card header', () => {
      render(<CardHeader>Header content</CardHeader>);
      expect(screen.getByText('Header content')).toBeInTheDocument();
    });

    it('should apply default styles', () => {
      const { container } = render(<CardHeader>Content</CardHeader>);
      const header = container.firstChild as HTMLElement;
      expect(header).toHaveClass('flex');
      expect(header).toHaveClass('flex-col');
      expect(header).toHaveClass('space-y-1.5');
      expect(header).toHaveClass('p-6');
    });

    it('should accept custom className', () => {
      const { container } = render(
        <CardHeader className="custom-header">Content</CardHeader>
      );
      const header = container.firstChild as HTMLElement;
      expect(header).toHaveClass('custom-header');
      expect(header).toHaveClass('flex');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardHeader ref={ref}>Content</CardHeader>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should render as div element', () => {
      const { container } = render(<CardHeader>Content</CardHeader>);
      expect(container.firstChild?.nodeName).toBe('DIV');
    });

    it('should have correct displayName', () => {
      expect(CardHeader.displayName).toBe('CardHeader');
    });
  });

  describe('CardTitle', () => {
    it('should render card title', () => {
      render(<CardTitle>Title text</CardTitle>);
      expect(screen.getByText('Title text')).toBeInTheDocument();
    });

    it('should apply default styles', () => {
      const { container } = render(<CardTitle>Title</CardTitle>);
      const title = container.firstChild as HTMLElement;
      expect(title).toHaveClass('font-semibold');
      expect(title).toHaveClass('leading-none');
      expect(title).toHaveClass('tracking-tight');
    });

    it('should accept custom className', () => {
      const { container } = render(
        <CardTitle className="custom-title">Title</CardTitle>
      );
      const title = container.firstChild as HTMLElement;
      expect(title).toHaveClass('custom-title');
      expect(title).toHaveClass('font-semibold');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardTitle ref={ref}>Title</CardTitle>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should render as div element', () => {
      const { container } = render(<CardTitle>Title</CardTitle>);
      expect(container.firstChild?.nodeName).toBe('DIV');
    });

    it('should have correct displayName', () => {
      expect(CardTitle.displayName).toBe('CardTitle');
    });
  });

  describe('CardDescription', () => {
    it('should render card description', () => {
      render(<CardDescription>Description text</CardDescription>);
      expect(screen.getByText('Description text')).toBeInTheDocument();
    });

    it('should apply default styles', () => {
      const { container } = render(<CardDescription>Description</CardDescription>);
      const description = container.firstChild as HTMLElement;
      expect(description).toHaveClass('text-sm');
      expect(description).toHaveClass('text-muted-foreground');
    });

    it('should accept custom className', () => {
      const { container } = render(
        <CardDescription className="custom-description">Description</CardDescription>
      );
      const description = container.firstChild as HTMLElement;
      expect(description).toHaveClass('custom-description');
      expect(description).toHaveClass('text-sm');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardDescription ref={ref}>Description</CardDescription>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should render as div element', () => {
      const { container } = render(<CardDescription>Description</CardDescription>);
      expect(container.firstChild?.nodeName).toBe('DIV');
    });

    it('should have correct displayName', () => {
      expect(CardDescription.displayName).toBe('CardDescription');
    });
  });

  describe('CardContent', () => {
    it('should render card content', () => {
      render(<CardContent>Content text</CardContent>);
      expect(screen.getByText('Content text')).toBeInTheDocument();
    });

    it('should apply default styles', () => {
      const { container } = render(<CardContent>Content</CardContent>);
      const content = container.firstChild as HTMLElement;
      expect(content).toHaveClass('p-6');
      expect(content).toHaveClass('pt-0');
    });

    it('should accept custom className', () => {
      const { container } = render(
        <CardContent className="custom-content">Content</CardContent>
      );
      const content = container.firstChild as HTMLElement;
      expect(content).toHaveClass('custom-content');
      expect(content).toHaveClass('p-6');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardContent ref={ref}>Content</CardContent>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should render as div element', () => {
      const { container } = render(<CardContent>Content</CardContent>);
      expect(container.firstChild?.nodeName).toBe('DIV');
    });

    it('should have correct displayName', () => {
      expect(CardContent.displayName).toBe('CardContent');
    });
  });

  describe('CardFooter', () => {
    it('should render card footer', () => {
      render(<CardFooter>Footer content</CardFooter>);
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });

    it('should apply default styles', () => {
      const { container } = render(<CardFooter>Footer</CardFooter>);
      const footer = container.firstChild as HTMLElement;
      expect(footer).toHaveClass('flex');
      expect(footer).toHaveClass('items-center');
      expect(footer).toHaveClass('p-6');
      expect(footer).toHaveClass('pt-0');
    });

    it('should accept custom className', () => {
      const { container } = render(
        <CardFooter className="custom-footer">Footer</CardFooter>
      );
      const footer = container.firstChild as HTMLElement;
      expect(footer).toHaveClass('custom-footer');
      expect(footer).toHaveClass('flex');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardFooter ref={ref}>Footer</CardFooter>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should render as div element', () => {
      const { container } = render(<CardFooter>Footer</CardFooter>);
      expect(container.firstChild?.nodeName).toBe('DIV');
    });

    it('should have correct displayName', () => {
      expect(CardFooter.displayName).toBe('CardFooter');
    });
  });

  describe('Card Composition', () => {
    it('should render complete card with all sections', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>Main content</CardContent>
          <CardFooter>Footer content</CardFooter>
        </Card>
      );

      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card Description')).toBeInTheDocument();
      expect(screen.getByText('Main content')).toBeInTheDocument();
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });

    it('should render card without header', () => {
      render(
        <Card>
          <CardContent>Content only</CardContent>
        </Card>
      );

      expect(screen.getByText('Content only')).toBeInTheDocument();
    });

    it('should render card without footer', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
          <CardContent>Content</CardContent>
        </Card>
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should render multiple cards', () => {
      render(
        <>
          <Card>
            <CardTitle>Card 1</CardTitle>
          </Card>
          <Card>
            <CardTitle>Card 2</CardTitle>
          </Card>
        </>
      );

      expect(screen.getByText('Card 1')).toBeInTheDocument();
      expect(screen.getByText('Card 2')).toBeInTheDocument();
    });
  });

  describe('Server Monitor Use Cases', () => {
    it('should render server status card', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Production Server</CardTitle>
            <CardDescription>Last checked: 2 minutes ago</CardDescription>
          </CardHeader>
          <CardContent>
            <div>Status: Online</div>
            <div>Uptime: 99.9%</div>
          </CardContent>
          <CardFooter>
            <button>View Details</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByText('Production Server')).toBeInTheDocument();
      expect(screen.getByText('Last checked: 2 minutes ago')).toBeInTheDocument();
      expect(screen.getByText('Status: Online')).toBeInTheDocument();
      expect(screen.getByText('Uptime: 99.9%')).toBeInTheDocument();
      expect(screen.getByText('View Details')).toBeInTheDocument();
    });

    it('should render event log card', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>Latest server events</CardDescription>
          </CardHeader>
          <CardContent>
            <div>Server restarted</div>
            <div>Backup completed</div>
          </CardContent>
        </Card>
      );

      expect(screen.getByText('Recent Events')).toBeInTheDocument();
      expect(screen.getByText('Server restarted')).toBeInTheDocument();
      expect(screen.getByText('Backup completed')).toBeInTheDocument();
    });

    it('should render dashboard stats card', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div>Total Servers: 12</div>
            <div>Active: 10</div>
            <div>Down: 2</div>
          </CardContent>
        </Card>
      );

      expect(screen.getByText('Statistics')).toBeInTheDocument();
      expect(screen.getByText('Total Servers: 12')).toBeInTheDocument();
      expect(screen.getByText('Active: 10')).toBeInTheDocument();
      expect(screen.getByText('Down: 2')).toBeInTheDocument();
    });

    it('should render alert card', () => {
      const { container } = render(
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle>Critical Alert</CardTitle>
            <CardDescription>Server Down</CardDescription>
          </CardHeader>
          <CardContent>Database server is not responding</CardContent>
          <CardFooter>
            <button>Acknowledge</button>
            <button>Details</button>
          </CardFooter>
        </Card>
      );

      const card = container.querySelector('.border-destructive');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('border-destructive');
      expect(screen.getByText('Critical Alert')).toBeInTheDocument();
      expect(screen.getByText('Server Down')).toBeInTheDocument();
      expect(screen.getByText('Database server is not responding')).toBeInTheDocument();
    });
  });

  describe('Styling Variations', () => {
    it('should support custom border styles', () => {
      const { container } = render(
        <Card className="border-2 border-primary">Content</Card>
      );
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('border-2');
      expect(card).toHaveClass('border-primary');
    });

    it('should support custom background', () => {
      const { container } = render(
        <Card className="bg-secondary">Content</Card>
      );
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-secondary');
    });

    it('should support hover effects', () => {
      const { container } = render(
        <Card className="hover:shadow-lg">Content</Card>
      );
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('hover:shadow-lg');
    });

    it('should support different shadow sizes', () => {
      const { container } = render(
        <Card className="shadow-xl">Content</Card>
      );
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('shadow-xl');
    });

    it('should support custom padding in header', () => {
      const { container } = render(
        <CardHeader className="p-4">Header</CardHeader>
      );
      const header = container.firstChild as HTMLElement;
      expect(header).toHaveClass('p-4');
    });

    it('should support custom padding in content', () => {
      const { container } = render(
        <CardContent className="p-8">Content</CardContent>
      );
      const content = container.firstChild as HTMLElement;
      expect(content).toHaveClass('p-8');
    });

    it('should support flex layout in footer', () => {
      const { container } = render(
        <CardFooter className="justify-between">Footer</CardFooter>
      );
      const footer = container.firstChild as HTMLElement;
      expect(footer).toHaveClass('justify-between');
    });
  });

  describe('Edge Cases', () => {
    it('should render empty card', () => {
      const { container } = render(<Card />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render card with only title', () => {
      render(
        <Card>
          <CardTitle>Only Title</CardTitle>
        </Card>
      );
      expect(screen.getByText('Only Title')).toBeInTheDocument();
    });

    it('should handle long content', () => {
      const longText = 'Lorem ipsum '.repeat(100);
      const { container } = render(<CardContent>{longText}</CardContent>);
      const content = container.firstChild as HTMLElement;
      expect(content).toBeInTheDocument();
      expect(content.textContent).toBe(longText);
    });

    it('should handle nested elements', () => {
      render(
        <Card>
          <CardContent>
            <div>
              <div>
                <span>Nested content</span>
              </div>
            </div>
          </CardContent>
        </Card>
      );
      expect(screen.getByText('Nested content')).toBeInTheDocument();
    });

    it('should handle multiple children in footer', () => {
      render(
        <CardFooter>
          <button>Cancel</button>
          <button>Save</button>
          <button>Submit</button>
        </CardFooter>
      );
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    it('should handle special characters in content', () => {
      render(<CardContent>&lt;Special&gt; &amp; Characters!</CardContent>);
      expect(screen.getByText('<Special> & Characters!')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should support ARIA attributes on card', () => {
      render(
        <Card aria-label="Server status card" role="article">
          Content
        </Card>
      );
      const card = screen.getByLabelText('Server status card');
      expect(card).toHaveAttribute('role', 'article');
    });

    it('should support ARIA attributes on title', () => {
      render(<CardTitle aria-level="2" role="heading">Title</CardTitle>);
      const title = screen.getByRole('heading');
      expect(title).toHaveAttribute('aria-level', '2');
    });

    it('should support data attributes', () => {
      render(
        <Card data-testid="test-card" data-status="online">
          Content
        </Card>
      );
      const card = screen.getByTestId('test-card');
      expect(card).toHaveAttribute('data-status', 'online');
    });
  });

  describe('Component Exports', () => {
    it('should export all card components', () => {
      expect(Card).toBeDefined();
      expect(CardHeader).toBeDefined();
      expect(CardTitle).toBeDefined();
      expect(CardDescription).toBeDefined();
      expect(CardContent).toBeDefined();
      expect(CardFooter).toBeDefined();
    });

    it('should have correct component types', () => {
      expect(Card).toBeTruthy();
      expect(CardHeader).toBeTruthy();
      expect(CardTitle).toBeTruthy();
      expect(CardDescription).toBeTruthy();
      expect(CardContent).toBeTruthy();
      expect(CardFooter).toBeTruthy();
    });
  });
});
