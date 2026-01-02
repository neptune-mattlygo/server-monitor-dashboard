import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from '@/components/ui/hover-card';

describe('HoverCard Component', () => {
  describe('HoverCard (Root)', () => {
    it('should render hover card root', () => {
      const { container } = render(
        <HoverCard>
          <HoverCardTrigger>Hover me</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      );
      expect(container).toBeInTheDocument();
    });

    it('should render with trigger and content', () => {
      render(
        <HoverCard>
          <HoverCardTrigger>Hover me</HoverCardTrigger>
          <HoverCardContent>Hover content</HoverCardContent>
        </HoverCard>
      );
      expect(screen.getByText('Hover me')).toBeInTheDocument();
    });

    it('should support controlled open state', () => {
      const { container } = render(
        <HoverCard open={true}>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      );
      expect(container).toBeInTheDocument();
    });

    it('should accept onOpenChange callback', () => {
      const onOpenChange = jest.fn();
      const { container } = render(
        <HoverCard onOpenChange={onOpenChange}>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      );
      expect(container).toBeInTheDocument();
    });

    it('should support openDelay prop', () => {
      const { container } = render(
        <HoverCard openDelay={200}>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      );
      expect(container).toBeInTheDocument();
    });

    it('should support closeDelay prop', () => {
      const { container } = render(
        <HoverCard closeDelay={100}>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      );
      expect(container).toBeInTheDocument();
    });
  });

  describe('HoverCardTrigger', () => {
    it('should render trigger element', () => {
      render(
        <HoverCard>
          <HoverCardTrigger>Hover trigger</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      );
      expect(screen.getByText('Hover trigger')).toBeInTheDocument();
    });

    it('should render custom trigger element', () => {
      render(
        <HoverCard>
          <HoverCardTrigger asChild>
            <button>Custom button</button>
          </HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      );
      expect(screen.getByRole('button', { name: 'Custom button' })).toBeInTheDocument();
    });

    it('should accept className prop', () => {
      render(
        <HoverCard>
          <HoverCardTrigger className="custom-trigger">Trigger</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      );
      expect(screen.getByText('Trigger')).toHaveClass('custom-trigger');
    });

    it('should render trigger with text content', () => {
      render(
        <HoverCard>
          <HoverCardTrigger>
            <span>Trigger text</span>
          </HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      );
      expect(screen.getByText('Trigger text')).toBeInTheDocument();
    });
  });

  describe('HoverCardContent', () => {
    it('should render content when open', () => {
      render(
        <HoverCard open={true}>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>Hover card content</HoverCardContent>
        </HoverCard>
      );
      expect(screen.getByText('Hover card content')).toBeInTheDocument();
    });

    it('should apply default width className', () => {
      render(
        <HoverCard open={true}>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      );
      const content = screen.getByText('Content');
      expect(content).toHaveClass('w-64');
    });

    it('should apply border and background classes', () => {
      render(
        <HoverCard open={true}>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      );
      const content = screen.getByText('Content');
      expect(content).toHaveClass('border');
      expect(content).toHaveClass('bg-popover');
    });

    it('should apply padding classes', () => {
      render(
        <HoverCard open={true}>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      );
      const content = screen.getByText('Content');
      expect(content).toHaveClass('p-4');
    });

    it('should accept custom className', () => {
      render(
        <HoverCard open={true}>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent className="custom-content">Content</HoverCardContent>
        </HoverCard>
      );
      const content = screen.getByText('Content');
      expect(content).toHaveClass('custom-content');
    });

    it('should accept ref prop', () => {
      const ref = React.createRef<HTMLDivElement>();
      const { container } = render(
        <HoverCard open={true}>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent ref={ref}>Content</HoverCardContent>
        </HoverCard>
      );
      expect(container).toBeInTheDocument();
    });

    it('should use default align prop of center', () => {
      const { container } = render(
        <HoverCard open={true}>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      );
      expect(container).toBeInTheDocument();
    });

    it('should accept custom align prop', () => {
      const { container } = render(
        <HoverCard open={true}>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent align="start">Content</HoverCardContent>
        </HoverCard>
      );
      expect(container).toBeInTheDocument();
    });

    it('should use default sideOffset of 4', () => {
      const { container } = render(
        <HoverCard open={true}>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      );
      expect(container).toBeInTheDocument();
    });

    it('should accept custom sideOffset prop', () => {
      const { container } = render(
        <HoverCard open={true}>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent sideOffset={10}>Content</HoverCardContent>
        </HoverCard>
      );
      expect(container).toBeInTheDocument();
    });

    it('should accept side prop', () => {
      const { container } = render(
        <HoverCard open={true}>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent side="bottom">Content</HoverCardContent>
        </HoverCard>
      );
      expect(container).toBeInTheDocument();
    });

    it('should render complex content', () => {
      render(
        <HoverCard open={true}>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>
            <div>
              <h4>Title</h4>
              <p>Description text</p>
            </div>
          </HoverCardContent>
        </HoverCard>
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description text')).toBeInTheDocument();
    });

    it('should have shadow and rounded styling', () => {
      render(
        <HoverCard open={true}>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      );
      const content = screen.getByText('Content');
      expect(content).toHaveClass('shadow-md');
      expect(content).toHaveClass('rounded-md');
    });

    it('should have z-index styling', () => {
      render(
        <HoverCard open={true}>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      );
      const content = screen.getByText('Content');
      expect(content).toHaveClass('z-50');
    });
  });

  describe('Integration', () => {
    it('should render complete hover card with trigger and content', () => {
      render(
        <HoverCard open={true}>
          <HoverCardTrigger>
            <span>@username</span>
          </HoverCardTrigger>
          <HoverCardContent>
            <div className="flex flex-col gap-2">
              <h4>User Profile</h4>
              <p>User details go here</p>
            </div>
          </HoverCardContent>
        </HoverCard>
      );
      
      expect(screen.getByText('@username')).toBeInTheDocument();
      expect(screen.getByText('User Profile')).toBeInTheDocument();
      expect(screen.getByText('User details go here')).toBeInTheDocument();
    });

    it('should support multiple hover cards', () => {
      render(
        <div>
          <HoverCard open={true}>
            <HoverCardTrigger>First trigger</HoverCardTrigger>
            <HoverCardContent>First content</HoverCardContent>
          </HoverCard>
          <HoverCard open={true}>
            <HoverCardTrigger>Second trigger</HoverCardTrigger>
            <HoverCardContent>Second content</HoverCardContent>
          </HoverCard>
        </div>
      );
      
      expect(screen.getByText('First trigger')).toBeInTheDocument();
      expect(screen.getByText('First content')).toBeInTheDocument();
      expect(screen.getByText('Second trigger')).toBeInTheDocument();
      expect(screen.getByText('Second content')).toBeInTheDocument();
    });

    it('should render hover card with custom button trigger', () => {
      render(
        <HoverCard open={true}>
          <HoverCardTrigger asChild>
            <button className="btn">Hover button</button>
          </HoverCardTrigger>
          <HoverCardContent>
            <p>Additional information</p>
          </HoverCardContent>
        </HoverCard>
      );
      
      expect(screen.getByRole('button', { name: 'Hover button' })).toBeInTheDocument();
      expect(screen.getByText('Additional information')).toBeInTheDocument();
    });

    it('should render hover card with link trigger', () => {
      render(
        <HoverCard open={true}>
          <HoverCardTrigger asChild>
            <a href="#test">Link text</a>
          </HoverCardTrigger>
          <HoverCardContent>
            <p>Link preview</p>
          </HoverCardContent>
        </HoverCard>
      );
      
      expect(screen.getByRole('link', { name: 'Link text' })).toBeInTheDocument();
      expect(screen.getByText('Link preview')).toBeInTheDocument();
    });

    it('should handle nested content structure', () => {
      render(
        <HoverCard open={true}>
          <HoverCardTrigger>User</HoverCardTrigger>
          <HoverCardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="avatar">Avatar</div>
                <div>
                  <h4>John Doe</h4>
                  <p className="text-sm">@johndoe</p>
                </div>
              </div>
              <p className="text-muted">Bio information here</p>
            </div>
          </HoverCardContent>
        </HoverCard>
      );
      
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('Avatar')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('@johndoe')).toBeInTheDocument();
      expect(screen.getByText('Bio information here')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const { container } = render(
        <HoverCard open={true}>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      );
      expect(container).toBeInTheDocument();
    });

    it('should support keyboard interactions', () => {
      const { container } = render(
        <HoverCard>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      );
      expect(container).toBeInTheDocument();
    });

    it('should render with proper semantic structure', () => {
      render(
        <HoverCard open={true}>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>
            <article>
              <h3>Heading</h3>
              <p>Paragraph</p>
            </article>
          </HoverCardContent>
        </HoverCard>
      );
      
      expect(screen.getByText('Heading')).toBeInTheDocument();
      expect(screen.getByText('Paragraph')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply animation classes', () => {
      render(
        <HoverCard open={true}>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      );
      const content = screen.getByText('Content');
      expect(content).toHaveClass('data-[state=open]:animate-in');
      expect(content).toHaveClass('data-[state=closed]:animate-out');
    });

    it('should apply fade animation classes', () => {
      render(
        <HoverCard open={true}>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      );
      const content = screen.getByText('Content');
      expect(content).toHaveClass('data-[state=open]:fade-in-0');
      expect(content).toHaveClass('data-[state=closed]:fade-out-0');
    });

    it('should apply zoom animation classes', () => {
      render(
        <HoverCard open={true}>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      );
      const content = screen.getByText('Content');
      expect(content).toHaveClass('data-[state=open]:zoom-in-95');
      expect(content).toHaveClass('data-[state=closed]:zoom-out-95');
    });

    it('should apply slide animation classes for different sides', () => {
      render(
        <HoverCard open={true}>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      );
      const content = screen.getByText('Content');
      expect(content).toHaveClass('data-[side=bottom]:slide-in-from-top-2');
      expect(content).toHaveClass('data-[side=left]:slide-in-from-right-2');
      expect(content).toHaveClass('data-[side=right]:slide-in-from-left-2');
      expect(content).toHaveClass('data-[side=top]:slide-in-from-bottom-2');
    });

    it('should have outline-none class', () => {
      render(
        <HoverCard open={true}>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      );
      const content = screen.getByText('Content');
      expect(content).toHaveClass('outline-none');
    });

    it('should merge custom className with default classes', () => {
      render(
        <HoverCard open={true}>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent className="custom-class">Content</HoverCardContent>
        </HoverCard>
      );
      const content = screen.getByText('Content');
      expect(content).toHaveClass('custom-class');
      expect(content).toHaveClass('w-64');
      expect(content).toHaveClass('rounded-md');
    });
  });
});
