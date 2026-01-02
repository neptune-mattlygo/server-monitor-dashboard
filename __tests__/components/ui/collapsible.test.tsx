import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';

describe('Collapsible Component', () => {
  describe('Rendering', () => {
    it('should render collapsible with trigger and content', () => {
      render(
        <Collapsible defaultOpen>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );

      expect(screen.getByText('Toggle')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should render in collapsed state by default', () => {
      const { container } = render(
        <Collapsible>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );

      const trigger = screen.getByText('Toggle');
      expect(trigger).toHaveAttribute('data-state', 'closed');
    });

    it('should render in open state when defaultOpen is true', () => {
      render(
        <Collapsible defaultOpen>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );

      const trigger = screen.getByText('Toggle');
      expect(trigger).toHaveAttribute('data-state', 'open');
    });

    it('should render trigger as button', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );

      const trigger = screen.getByText('Toggle');
      expect(trigger.tagName).toBe('BUTTON');
    });
  });

  describe('Interactions', () => {
    it('should expand content when trigger is clicked', async () => {
      const user = userEvent.setup();
      render(
        <Collapsible>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Collapsible Content</CollapsibleContent>
        </Collapsible>
      );

      const trigger = screen.getByText('Toggle');
      expect(trigger).toHaveAttribute('data-state', 'closed');

      await user.click(trigger);
      
      await waitFor(() => {
        expect(trigger).toHaveAttribute('data-state', 'open');
      });
    });

    it('should collapse content when trigger is clicked again', async () => {
      const user = userEvent.setup();
      render(
        <Collapsible defaultOpen>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );

      const trigger = screen.getByText('Toggle');
      expect(trigger).toHaveAttribute('data-state', 'open');

      await user.click(trigger);
      
      await waitFor(() => {
        expect(trigger).toHaveAttribute('data-state', 'closed');
      });
    });

    it('should call onOpenChange when toggled', async () => {
      const user = userEvent.setup();
      const handleOpenChange = jest.fn();
      
      render(
        <Collapsible onOpenChange={handleOpenChange}>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );

      const trigger = screen.getByText('Toggle');
      await user.click(trigger);

      expect(handleOpenChange).toHaveBeenCalledWith(true);

      await user.click(trigger);
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });

    it('should not toggle when disabled', async () => {
      const user = userEvent.setup();
      const handleOpenChange = jest.fn();
      
      render(
        <Collapsible disabled onOpenChange={handleOpenChange}>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );

      const trigger = screen.getByText('Toggle');
      await user.click(trigger);

      expect(handleOpenChange).not.toHaveBeenCalled();
      expect(trigger).toHaveAttribute('data-state', 'closed');
    });

    it('should support keyboard interaction with Space', async () => {
      const user = userEvent.setup();
      render(
        <Collapsible>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );

      const trigger = screen.getByText('Toggle');
      trigger.focus();
      
      await user.keyboard(' ');
      
      await waitFor(() => {
        expect(trigger).toHaveAttribute('data-state', 'open');
      });
    });

    it('should support keyboard interaction with Enter', async () => {
      const user = userEvent.setup();
      render(
        <Collapsible>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );

      const trigger = screen.getByText('Toggle');
      trigger.focus();
      
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(trigger).toHaveAttribute('data-state', 'open');
      });
    });
  });

  describe('Controlled Component', () => {
    it('should work as controlled component', async () => {
      const user = userEvent.setup();
      const handleOpenChange = jest.fn();
      
      const { rerender } = render(
        <Collapsible open={false} onOpenChange={handleOpenChange}>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );

      const trigger = screen.getByText('Toggle');
      expect(trigger).toHaveAttribute('data-state', 'closed');

      await user.click(trigger);
      expect(handleOpenChange).toHaveBeenCalledWith(true);

      rerender(
        <Collapsible open={true} onOpenChange={handleOpenChange}>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );

      expect(trigger).toHaveAttribute('data-state', 'open');
    });

    it('should update when open prop changes', () => {
      const { rerender } = render(
        <Collapsible open={false}>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );

      const trigger = screen.getByText('Toggle');
      expect(trigger).toHaveAttribute('data-state', 'closed');

      rerender(
        <Collapsible open={true}>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );

      expect(trigger).toHaveAttribute('data-state', 'open');
    });
  });

  describe('Content Visibility', () => {
    it('should show content when open', async () => {
      const user = userEvent.setup();
      render(
        <Collapsible>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Visible Content</CollapsibleContent>
        </Collapsible>
      );

      const trigger = screen.getByText('Toggle');
      await user.click(trigger);

      await waitFor(() => {
        const content = screen.getByText('Visible Content');
        expect(content).toBeVisible();
      });
    });

    it('should hide content when closed', async () => {
      const user = userEvent.setup();
      render(
        <Collapsible defaultOpen>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Hidden Content</CollapsibleContent>
        </Collapsible>
      );

      const trigger = screen.getByText('Toggle');
      await user.click(trigger);

      await waitFor(() => {
        // Content is removed from DOM when closed in Radix Collapsible
        const content = screen.queryByText('Hidden Content');
        expect(content).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have correct aria-expanded attribute when closed', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );

      const trigger = screen.getByText('Toggle');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('should have correct aria-expanded attribute when open', () => {
      render(
        <Collapsible defaultOpen>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );

      const trigger = screen.getByText('Toggle');
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('should update aria-expanded when toggled', async () => {
      const user = userEvent.setup();
      render(
        <Collapsible>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );

      const trigger = screen.getByText('Toggle');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      await user.click(trigger);
      
      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should be disabled when disabled prop is true', () => {
      render(
        <Collapsible disabled>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );

      const trigger = screen.getByText('Toggle');
      expect(trigger).toHaveAttribute('data-disabled', '');
    });

    it('should be focusable', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );

      const trigger = screen.getByText('Toggle') as HTMLElement;
      trigger.focus();
      expect(trigger).toHaveFocus();
    });
  });

  describe('Server Monitor Use Cases', () => {
    it('should work for server details section', async () => {
      const user = userEvent.setup();
      
      render(
        <Collapsible>
          <CollapsibleTrigger>
            <div>Production Server - Details</div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div>CPU: 45%</div>
            <div>Memory: 2.1GB</div>
            <div>Disk: 120GB</div>
          </CollapsibleContent>
        </Collapsible>
      );

      const trigger = screen.getByText('Production Server - Details');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('CPU: 45%')).toBeVisible();
        expect(screen.getByText('Memory: 2.1GB')).toBeVisible();
        expect(screen.getByText('Disk: 120GB')).toBeVisible();
      });
    });

    it('should work for event log expansion', async () => {
      const user = userEvent.setup();
      
      render(
        <Collapsible>
          <CollapsibleTrigger>Show Event History</CollapsibleTrigger>
          <CollapsibleContent>
            <div>Event 1: Server restarted</div>
            <div>Event 2: Backup completed</div>
            <div>Event 3: Alert triggered</div>
          </CollapsibleContent>
        </Collapsible>
      );

      const trigger = screen.getByText('Show Event History');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Event 1: Server restarted')).toBeVisible();
      });
    });

    it('should work for filter options', async () => {
      const user = userEvent.setup();
      
      render(
        <Collapsible>
          <CollapsibleTrigger>Advanced Filters</CollapsibleTrigger>
          <CollapsibleContent>
            <div>Status Filter</div>
            <div>Region Filter</div>
            <div>Date Range</div>
          </CollapsibleContent>
        </Collapsible>
      );

      const trigger = screen.getByText('Advanced Filters');
      expect(trigger).toHaveAttribute('data-state', 'closed');

      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Status Filter')).toBeVisible();
      });
    });

    it('should work for host group expansion', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <Collapsible>
            <CollapsibleTrigger>US East (3 servers)</CollapsibleTrigger>
            <CollapsibleContent>
              <div>Web Server 1</div>
              <div>Web Server 2</div>
              <div>Database Server</div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      );

      const trigger = screen.getByText('US East (3 servers)');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Web Server 1')).toBeVisible();
        expect(screen.getByText('Web Server 2')).toBeVisible();
        expect(screen.getByText('Database Server')).toBeVisible();
      });
    });
  });

  describe('Multiple Collapsibles', () => {
    it('should handle multiple independent collapsibles', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <Collapsible>
            <CollapsibleTrigger>Section 1</CollapsibleTrigger>
            <CollapsibleContent>Content 1</CollapsibleContent>
          </Collapsible>
          <Collapsible>
            <CollapsibleTrigger>Section 2</CollapsibleTrigger>
            <CollapsibleContent>Content 2</CollapsibleContent>
          </Collapsible>
          <Collapsible>
            <CollapsibleTrigger>Section 3</CollapsibleTrigger>
            <CollapsibleContent>Content 3</CollapsibleContent>
          </Collapsible>
        </div>
      );

      const trigger1 = screen.getByText('Section 1');
      const trigger2 = screen.getByText('Section 2');

      await user.click(trigger1);
      
      await waitFor(() => {
        expect(trigger1).toHaveAttribute('data-state', 'open');
      });
      
      expect(trigger2).toHaveAttribute('data-state', 'closed');
    });

    it('should allow multiple collapsibles to be open simultaneously', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <Collapsible>
            <CollapsibleTrigger>First</CollapsibleTrigger>
            <CollapsibleContent>First Content</CollapsibleContent>
          </Collapsible>
          <Collapsible>
            <CollapsibleTrigger>Second</CollapsibleTrigger>
            <CollapsibleContent>Second Content</CollapsibleContent>
          </Collapsible>
        </div>
      );

      const trigger1 = screen.getByText('First');
      const trigger2 = screen.getByText('Second');

      await user.click(trigger1);
      await user.click(trigger2);

      await waitFor(() => {
        expect(trigger1).toHaveAttribute('data-state', 'open');
        expect(trigger2).toHaveAttribute('data-state', 'open');
      });
    });
  });

  describe('Styling', () => {
    it('should accept className on trigger', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger className="custom-trigger">Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );

      const trigger = screen.getByText('Toggle');
      expect(trigger).toHaveClass('custom-trigger');
    });

    it('should accept className on content', () => {
      const { container } = render(
        <Collapsible defaultOpen>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent className="custom-content">Content</CollapsibleContent>
        </Collapsible>
      );

      const content = container.querySelector('.custom-content');
      expect(content).toBeInTheDocument();
    });

    it('should apply data-state attribute to trigger', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );

      const trigger = screen.getByText('Toggle');
      expect(trigger).toHaveAttribute('data-state', 'closed');
    });

    it('should update data-state when toggled', async () => {
      const user = userEvent.setup();
      render(
        <Collapsible>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );

      const trigger = screen.getByText('Toggle');
      expect(trigger).toHaveAttribute('data-state', 'closed');

      await user.click(trigger);
      
      await waitFor(() => {
        expect(trigger).toHaveAttribute('data-state', 'open');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent></CollapsibleContent>
        </Collapsible>
      );

      expect(screen.getByText('Toggle')).toBeInTheDocument();
    });

    it('should handle complex nested content', async () => {
      const user = userEvent.setup();
      
      render(
        <Collapsible>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>
            <div>
              <ul>
                <li>Item 1</li>
                <li>Item 2</li>
              </ul>
            </div>
          </CollapsibleContent>
        </Collapsible>
      );

      const trigger = screen.getByText('Toggle');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Item 1')).toBeVisible();
        expect(screen.getByText('Item 2')).toBeVisible();
      });
    });

    it('should handle rapid toggling', async () => {
      const user = userEvent.setup();
      
      render(
        <Collapsible>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );

      const trigger = screen.getByText('Toggle');
      
      await user.click(trigger);
      await user.click(trigger);
      await user.click(trigger);

      await waitFor(() => {
        expect(trigger).toHaveAttribute('data-state', 'open');
      });
    });

    it('should support data attributes', () => {
      render(
        <Collapsible data-testid="collapsible-root">
          <CollapsibleTrigger data-testid="trigger">Toggle</CollapsibleTrigger>
          <CollapsibleContent data-testid="content">Content</CollapsibleContent>
        </Collapsible>
      );

      expect(screen.getByTestId('collapsible-root')).toBeInTheDocument();
      expect(screen.getByTestId('trigger')).toBeInTheDocument();
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });

  describe('Component Exports', () => {
    it('should export Collapsible component', () => {
      expect(Collapsible).toBeDefined();
      expect(Collapsible).toBeTruthy();
    });

    it('should export CollapsibleTrigger component', () => {
      expect(CollapsibleTrigger).toBeDefined();
      expect(CollapsibleTrigger).toBeTruthy();
    });

    it('should export CollapsibleContent component', () => {
      expect(CollapsibleContent).toBeDefined();
      expect(CollapsibleContent).toBeTruthy();
    });
  });

  describe('Animation States', () => {
    it('should have data-state on content when open', () => {
      const { container } = render(
        <Collapsible defaultOpen>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );

      const content = screen.getByText('Content');
      expect(content).toHaveAttribute('data-state', 'open');
    });

    it('should have data-state on content when closed', () => {
      const { container } = render(
        <Collapsible>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );

      // Content is in DOM but hidden when closed
      const contentDiv = container.querySelector('[data-state="closed"][hidden]');
      expect(contentDiv).toBeInTheDocument();
      expect(contentDiv).toHaveAttribute('data-state', 'closed');
    });
  });
});
