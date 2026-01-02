import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from '@/components/ui/breadcrumb';

describe('Breadcrumb Components', () => {
  describe('Breadcrumb', () => {
    it('should render breadcrumb nav element', () => {
      const { container } = render(<Breadcrumb />);
      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();
    });

    it('should have aria-label="breadcrumb"', () => {
      const { container } = render(<Breadcrumb />);
      const nav = container.querySelector('nav');
      expect(nav).toHaveAttribute('aria-label', 'breadcrumb');
    });

    it('should render with children', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>Test</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('should pass through className', () => {
      const { container } = render(<Breadcrumb className="custom-breadcrumb" />);
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('custom-breadcrumb');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLElement>();
      const { container } = render(<Breadcrumb ref={ref} />);
      expect(ref.current).toBe(container.querySelector('nav'));
    });

    it('should have correct display name', () => {
      expect(Breadcrumb.displayName).toBe('Breadcrumb');
    });
  });

  describe('BreadcrumbList', () => {
    it('should render as ol element', () => {
      const { container } = render(<BreadcrumbList />);
      const ol = container.querySelector('ol');
      expect(ol).toBeInTheDocument();
    });

    it('should apply default classes', () => {
      const { container } = render(<BreadcrumbList />);
      const ol = container.querySelector('ol');
      expect(ol).toHaveClass(
        'flex',
        'flex-wrap',
        'items-center',
        'gap-1.5',
        'break-words',
        'text-sm',
        'text-muted-foreground'
      );
    });

    it('should render with children', () => {
      render(
        <BreadcrumbList>
          <BreadcrumbItem>Item 1</BreadcrumbItem>
          <BreadcrumbItem>Item 2</BreadcrumbItem>
        </BreadcrumbList>
      );
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('should merge custom className', () => {
      const { container } = render(<BreadcrumbList className="custom-list" />);
      const ol = container.querySelector('ol');
      expect(ol).toHaveClass('custom-list', 'flex', 'items-center');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLOListElement>();
      const { container } = render(<BreadcrumbList ref={ref} />);
      expect(ref.current).toBe(container.querySelector('ol'));
    });

    it('should have correct display name', () => {
      expect(BreadcrumbList.displayName).toBe('BreadcrumbList');
    });
  });

  describe('BreadcrumbItem', () => {
    it('should render as li element', () => {
      const { container } = render(<BreadcrumbItem />);
      const li = container.querySelector('li');
      expect(li).toBeInTheDocument();
    });

    it('should apply default classes', () => {
      const { container } = render(<BreadcrumbItem />);
      const li = container.querySelector('li');
      expect(li).toHaveClass('inline-flex', 'items-center', 'gap-1.5');
    });

    it('should render with children', () => {
      render(<BreadcrumbItem>Item Content</BreadcrumbItem>);
      expect(screen.getByText('Item Content')).toBeInTheDocument();
    });

    it('should merge custom className', () => {
      const { container } = render(<BreadcrumbItem className="custom-item" />);
      const li = container.querySelector('li');
      expect(li).toHaveClass('custom-item', 'inline-flex');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLLIElement>();
      const { container } = render(<BreadcrumbItem ref={ref} />);
      expect(ref.current).toBe(container.querySelector('li'));
    });

    it('should have correct display name', () => {
      expect(BreadcrumbItem.displayName).toBe('BreadcrumbItem');
    });
  });

  describe('BreadcrumbLink', () => {
    it('should render as anchor element by default', () => {
      const { container } = render(<BreadcrumbLink href="/test">Link</BreadcrumbLink>);
      const link = container.querySelector('a');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test');
    });

    it('should apply default classes', () => {
      const { container } = render(<BreadcrumbLink href="/test">Link</BreadcrumbLink>);
      const link = container.querySelector('a');
      expect(link).toHaveClass('transition-colors', 'hover:text-foreground');
    });

    it('should render with children', () => {
      render(<BreadcrumbLink href="/test">Click Me</BreadcrumbLink>);
      expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    it('should merge custom className', () => {
      const { container } = render(
        <BreadcrumbLink href="/test" className="custom-link">
          Link
        </BreadcrumbLink>
      );
      const link = container.querySelector('a');
      expect(link).toHaveClass('custom-link', 'transition-colors');
    });

    it('should support asChild prop', () => {
      const { container } = render(
        <BreadcrumbLink asChild>
          <button type="button">Custom Element</button>
        </BreadcrumbLink>
      );
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Custom Element');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLAnchorElement>();
      const { container } = render(<BreadcrumbLink ref={ref} href="/test">Link</BreadcrumbLink>);
      expect(ref.current).toBe(container.querySelector('a'));
    });

    it('should have correct display name', () => {
      expect(BreadcrumbLink.displayName).toBe('BreadcrumbLink');
    });
  });

  describe('BreadcrumbPage', () => {
    it('should render as span element', () => {
      const { container } = render(<BreadcrumbPage>Current Page</BreadcrumbPage>);
      const span = container.querySelector('span');
      expect(span).toBeInTheDocument();
    });

    it('should have role="link"', () => {
      const { container } = render(<BreadcrumbPage>Current Page</BreadcrumbPage>);
      const span = container.querySelector('span');
      expect(span).toHaveAttribute('role', 'link');
    });

    it('should have aria-disabled="true"', () => {
      const { container } = render(<BreadcrumbPage>Current Page</BreadcrumbPage>);
      const span = container.querySelector('span');
      expect(span).toHaveAttribute('aria-disabled', 'true');
    });

    it('should have aria-current="page"', () => {
      const { container } = render(<BreadcrumbPage>Current Page</BreadcrumbPage>);
      const span = container.querySelector('span');
      expect(span).toHaveAttribute('aria-current', 'page');
    });

    it('should apply default classes', () => {
      const { container } = render(<BreadcrumbPage>Current Page</BreadcrumbPage>);
      const span = container.querySelector('span');
      expect(span).toHaveClass('font-normal', 'text-foreground');
    });

    it('should render with children', () => {
      render(<BreadcrumbPage>Active Page</BreadcrumbPage>);
      expect(screen.getByText('Active Page')).toBeInTheDocument();
    });

    it('should merge custom className', () => {
      const { container } = render(
        <BreadcrumbPage className="custom-page">Current Page</BreadcrumbPage>
      );
      const span = container.querySelector('span');
      expect(span).toHaveClass('custom-page', 'font-normal');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLSpanElement>();
      const { container } = render(<BreadcrumbPage ref={ref}>Page</BreadcrumbPage>);
      expect(ref.current).toBe(container.querySelector('span'));
    });

    it('should have correct display name', () => {
      expect(BreadcrumbPage.displayName).toBe('BreadcrumbPage');
    });
  });

  describe('BreadcrumbSeparator', () => {
    it('should render as li element', () => {
      const { container } = render(<BreadcrumbSeparator />);
      const li = container.querySelector('li');
      expect(li).toBeInTheDocument();
    });

    it('should have role="presentation"', () => {
      const { container } = render(<BreadcrumbSeparator />);
      const li = container.querySelector('li');
      expect(li).toHaveAttribute('role', 'presentation');
    });

    it('should have aria-hidden="true"', () => {
      const { container } = render(<BreadcrumbSeparator />);
      const li = container.querySelector('li');
      expect(li).toHaveAttribute('aria-hidden', 'true');
    });

    it('should render default ChevronRightIcon when no children provided', () => {
      const { container } = render(<BreadcrumbSeparator />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render custom separator when children provided', () => {
      render(<BreadcrumbSeparator>/</BreadcrumbSeparator>);
      expect(screen.getByText('/')).toBeInTheDocument();
    });

    it('should apply default classes', () => {
      const { container } = render(<BreadcrumbSeparator />);
      const li = container.querySelector('li');
      expect(li).toHaveClass('[&>svg]:w-3.5', '[&>svg]:h-3.5');
    });

    it('should merge custom className', () => {
      const { container } = render(<BreadcrumbSeparator className="custom-separator" />);
      const li = container.querySelector('li');
      expect(li).toHaveClass('custom-separator');
    });

    it('should have correct display name', () => {
      expect(BreadcrumbSeparator.displayName).toBe('BreadcrumbSeparator');
    });
  });

  describe('BreadcrumbEllipsis', () => {
    it('should render as span element', () => {
      const { container } = render(<BreadcrumbEllipsis />);
      const span = container.querySelector('span[role="presentation"]');
      expect(span).toBeInTheDocument();
    });

    it('should have role="presentation"', () => {
      const { container } = render(<BreadcrumbEllipsis />);
      const span = container.querySelector('span');
      expect(span).toHaveAttribute('role', 'presentation');
    });

    it('should have aria-hidden="true"', () => {
      const { container } = render(<BreadcrumbEllipsis />);
      const span = container.querySelector('span');
      expect(span).toHaveAttribute('aria-hidden', 'true');
    });

    it('should render DotsHorizontalIcon', () => {
      const { container } = render(<BreadcrumbEllipsis />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render screen reader text', () => {
      render(<BreadcrumbEllipsis />);
      expect(screen.getByText('More')).toHaveClass('sr-only');
    });

    it('should apply default classes', () => {
      const { container } = render(<BreadcrumbEllipsis />);
      const span = container.querySelector('span[role="presentation"]');
      expect(span).toHaveClass('flex', 'h-9', 'w-9', 'items-center', 'justify-center');
    });

    it('should merge custom className', () => {
      const { container } = render(<BreadcrumbEllipsis className="custom-ellipsis" />);
      const span = container.querySelector('span[role="presentation"]');
      expect(span).toHaveClass('custom-ellipsis', 'flex');
    });

    it('should have correct display name', () => {
      expect(BreadcrumbEllipsis.displayName).toBe('BreadcrumbElipssis');
    });
  });

  describe('Complete Breadcrumb Navigation', () => {
    it('should render simple breadcrumb navigation', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Current Page</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Current Page')).toBeInTheDocument();
    });

    it('should render multi-level breadcrumb', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/category">Category</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/category/sub">Subcategory</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Current</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Subcategory')).toBeInTheDocument();
      expect(screen.getByText('Current')).toBeInTheDocument();
    });

    it('should render breadcrumb with ellipsis', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbEllipsis />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Current</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('More')).toBeInTheDocument();
      expect(screen.getByText('Current')).toBeInTheDocument();
    });

    it('should render breadcrumb with custom separator', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>Page</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );

      expect(screen.getByText('/')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for navigation', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );

      const nav = container.querySelector('nav');
      expect(nav).toHaveAttribute('aria-label', 'breadcrumb');
    });

    it('should mark current page with aria-current', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Current</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );

      const currentPage = container.querySelector('[aria-current="page"]');
      expect(currentPage).toBeInTheDocument();
    });

    it('should hide separators from screen readers', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </BreadcrumbList>
        </Breadcrumb>
      );

      const separator = container.querySelector('[role="presentation"]');
      expect(separator).toHaveAttribute('aria-hidden', 'true');
    });

    it('should hide ellipsis from screen readers but provide sr-only text', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbEllipsis />
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );

      const srText = screen.getByText('More');
      expect(srText).toHaveClass('sr-only');
    });
  });

  describe('Props Forwarding', () => {
    it('should forward props to Breadcrumb', () => {
      const { container } = render(<Breadcrumb data-testid="breadcrumb-nav" />);
      const nav = container.querySelector('nav');
      expect(nav).toHaveAttribute('data-testid', 'breadcrumb-nav');
    });

    it('should forward props to BreadcrumbList', () => {
      const { container } = render(<BreadcrumbList data-testid="breadcrumb-list" />);
      const ol = container.querySelector('ol');
      expect(ol).toHaveAttribute('data-testid', 'breadcrumb-list');
    });

    it('should forward props to BreadcrumbItem', () => {
      const { container } = render(<BreadcrumbItem data-testid="breadcrumb-item" />);
      const li = container.querySelector('li');
      expect(li).toHaveAttribute('data-testid', 'breadcrumb-item');
    });

    it('should forward props to BreadcrumbLink', () => {
      const { container } = render(
        <BreadcrumbLink href="/" data-testid="breadcrumb-link">
          Link
        </BreadcrumbLink>
      );
      const link = container.querySelector('a');
      expect(link).toHaveAttribute('data-testid', 'breadcrumb-link');
    });

    it('should forward props to BreadcrumbPage', () => {
      const { container } = render(<BreadcrumbPage data-testid="breadcrumb-page">Page</BreadcrumbPage>);
      const span = container.querySelector('span');
      expect(span).toHaveAttribute('data-testid', 'breadcrumb-page');
    });
  });

  describe('Edge Cases', () => {
    it('should render empty breadcrumb', () => {
      const { container } = render(<Breadcrumb />);
      expect(container.querySelector('nav')).toBeInTheDocument();
    });

    it('should handle single breadcrumb item', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Only Page</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );

      expect(screen.getByText('Only Page')).toBeInTheDocument();
    });

    it('should handle very long breadcrumb trail', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            {Array.from({ length: 10 }, (_, i) => (
              <React.Fragment key={i}>
                <BreadcrumbItem>
                  {i < 9 ? (
                    <BreadcrumbLink href={`/level${i}`}>Level {i}</BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>Level {i}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {i < 9 && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      );

      expect(screen.getByText('Level 0')).toBeInTheDocument();
      expect(screen.getByText('Level 9')).toBeInTheDocument();
    });

    it('should handle multiple separators in a row', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Page</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );

      const separators = container.querySelectorAll('[role="presentation"]');
      expect(separators.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Server Monitor Use Cases', () => {
    it('should render dashboard breadcrumb', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('should render server details breadcrumb', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/servers">Servers</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Server-001</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );

      expect(screen.getByText('Servers')).toBeInTheDocument();
      expect(screen.getByText('Server-001')).toBeInTheDocument();
    });

    it('should render admin breadcrumb', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Users</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );

      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByText('Users')).toBeInTheDocument();
    });
  });
});
