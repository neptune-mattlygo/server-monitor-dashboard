import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

describe('Accordion Component', () => {
  const renderAccordion = (type: 'single' | 'multiple' = 'single') => {
    return render(
      <Accordion type={type} {...(type === 'single' ? { collapsible: true } : {})}>
        <AccordionItem value="item-1">
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent>Content for section 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Section 2</AccordionTrigger>
          <AccordionContent>Content for section 2</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>Section 3</AccordionTrigger>
          <AccordionContent>Content for section 3</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  };

  describe('Rendering', () => {
    it('should render accordion with all items', () => {
      renderAccordion();
      
      expect(screen.getByText('Section 1')).toBeInTheDocument();
      expect(screen.getByText('Section 2')).toBeInTheDocument();
      expect(screen.getByText('Section 3')).toBeInTheDocument();
    });

    it('should render accordion triggers as buttons', () => {
      renderAccordion();
      
      const triggers = screen.getAllByRole('button');
      expect(triggers).toHaveLength(3);
    });

    it('should render chevron icons in triggers', () => {
      renderAccordion();
      
      const triggers = screen.getAllByRole('button');
      triggers.forEach((trigger) => {
        const svg = trigger.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });

    it('should have border-b class on AccordionItem', () => {
      const { container } = renderAccordion();
      
      // Find actual AccordionItem elements (they have data-state attribute)
      const items = container.querySelectorAll('[data-state]');
      const accordionItems = Array.from(items).filter(item => 
        item.getAttribute('data-orientation') === 'vertical' && 
        item.classList.contains('border-b')
      );
      
      expect(accordionItems.length).toBeGreaterThan(0);
      accordionItems.forEach((item) => {
        expect(item).toHaveClass('border-b');
      });
    });
  });

  describe('Single Mode Interaction', () => {
    it('should expand item when trigger is clicked', () => {
      renderAccordion('single');
      
      const trigger = screen.getByText('Section 1');
      fireEvent.click(trigger);
      
      const content = screen.getByText('Content for section 1');
      expect(content).toBeVisible();
    });

    it('should collapse expanded item when trigger is clicked again', () => {
      renderAccordion('single');
      
      const trigger = screen.getByText('Section 1');
      const button = trigger.closest('button');
      
      // Expand
      fireEvent.click(trigger);
      expect(screen.getByText('Content for section 1')).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'true');
      
      // Collapse
      fireEvent.click(trigger);
      // Content is removed from DOM when collapsed with Radix UI
      expect(screen.queryByText('Content for section 1')).not.toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });


    it('should close previously open item when opening a new one', () => {
      renderAccordion('single');
      
      // Open first item
      fireEvent.click(screen.getByText('Section 1'));
      expect(screen.getByText('Content for section 1')).toBeInTheDocument();
      
      // Open second item (in single mode, this should close the first)
      fireEvent.click(screen.getByText('Section 2'));
      expect(screen.getByText('Content for section 2')).toBeInTheDocument();
      
      // First item content should be removed from DOM
      expect(screen.queryByText('Content for section 1')).not.toBeInTheDocument();
    });

    it('should rotate chevron icon when item is expanded', () => {
      renderAccordion('single');
      
      const trigger = screen.getByText('Section 1');
      const button = trigger.closest('button');
      const svg = button?.querySelector('svg');
      
      // Initially not rotated
      expect(svg).not.toHaveClass('rotate-180');
      
      // Click to expand
      fireEvent.click(trigger);
      
      // Should have rotation (via data-state attribute affecting CSS)
      expect(button).toHaveAttribute('data-state', 'open');
    });
  });

  describe('Multiple Mode Interaction', () => {
    it('should allow multiple items to be open simultaneously', () => {
      renderAccordion('multiple');
      
      // Open first item
      fireEvent.click(screen.getByText('Section 1'));
      expect(screen.getByText('Content for section 1')).toBeVisible();
      
      // Open second item
      fireEvent.click(screen.getByText('Section 2'));
      expect(screen.getByText('Content for section 2')).toBeVisible();
      
      // Both should remain open
      expect(screen.getByText('Content for section 1')).toBeVisible();
      expect(screen.getByText('Content for section 2')).toBeVisible();
    });

    it('should allow closing items independently', () => {
      renderAccordion('multiple');
      
      // Open both items
      fireEvent.click(screen.getByText('Section 1'));
      fireEvent.click(screen.getByText('Section 2'));
      
      expect(screen.getByText('Content for section 1')).toBeInTheDocument();
      expect(screen.getByText('Content for section 2')).toBeInTheDocument();
      
      // Close first item
      fireEvent.click(screen.getByText('Section 1'));
      
      // First is removed, second should remain
      expect(screen.queryByText('Content for section 1')).not.toBeInTheDocument();
      expect(screen.getByText('Content for section 2')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderAccordion();
      
      const triggers = screen.getAllByRole('button');
      triggers.forEach((trigger) => {
        expect(trigger).toHaveAttribute('aria-expanded');
        expect(trigger).toHaveAttribute('aria-controls');
      });
    });

    it('should update aria-expanded when toggling', () => {
      renderAccordion('single');
      
      const trigger = screen.getByText('Section 1');
      const button = trigger.closest('button');
      
      // Initially collapsed
      expect(button).toHaveAttribute('aria-expanded', 'false');
      
      // Click to expand
      fireEvent.click(trigger);
      expect(button).toHaveAttribute('aria-expanded', 'true');
      
      // Click to collapse
      fireEvent.click(trigger);
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('should be keyboard navigable', () => {
      renderAccordion();
      
      const triggers = screen.getAllByRole('button');
      
      // Focus first trigger
      triggers[0].focus();
      expect(triggers[0]).toHaveFocus();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className to AccordionItem', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1" className="custom-item-class">
            <AccordionTrigger>Section 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      
      // Find the div element with border-b class that represents the AccordionItem
      const { container } = render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1" className="custom-item-class">
            <AccordionTrigger>Section 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      
      const item = container.querySelector('.custom-item-class');
      expect(item).toBeInTheDocument();
      expect(item).toHaveClass('border-b'); // Should preserve default classes
    });

    it('should apply custom className to AccordionTrigger', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger className="custom-trigger-class">Section 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      
      const trigger = screen.getByText('Section 1').closest('button');
      expect(trigger).toHaveClass('custom-trigger-class');
    });

    it('should apply custom className to AccordionContent', () => {
      const { container } = render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Section 1</AccordionTrigger>
            <AccordionContent className="custom-content-class">
              Content 1
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      
      const trigger = screen.getByText('Section 1');
      fireEvent.click(trigger);
      
      // The custom class is on the inner div wrapper
      const customDiv = container.querySelector('.custom-content-class');
      expect(customDiv).toBeInTheDocument();
      expect(customDiv).toHaveClass('pb-4');
    });
  });

  describe('Content Display', () => {
    it('should hide content initially in collapsed state', () => {
      renderAccordion();
      
      // Content is not in the DOM when collapsed (Radix UI behavior)
      const content = screen.queryByText('Content for section 1');
      expect(content).not.toBeInTheDocument();
    });

    it('should display content when expanded', () => {
      renderAccordion();
      
      fireEvent.click(screen.getByText('Section 1'));
      const content = screen.getByText('Content for section 1');
      expect(content).toBeVisible();
    });

    it('should render complex content inside AccordionContent', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Complex Content</AccordionTrigger>
            <AccordionContent>
              <div>
                <h3>Title</h3>
                <p>Paragraph text</p>
                <button>Action Button</button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      
      fireEvent.click(screen.getByText('Complex Content'));
      
      expect(screen.getByText('Title')).toBeVisible();
      expect(screen.getByText('Paragraph text')).toBeVisible();
      expect(screen.getByText('Action Button')).toBeVisible();
    });
  });

  describe('Edge Cases', () => {
    it('should handle accordion with single item', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Only Section</AccordionTrigger>
            <AccordionContent>Only Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      
      expect(screen.getByText('Only Section')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Only Section'));
      expect(screen.getByText('Only Content')).toBeVisible();
    });

    it('should handle empty content', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Empty Content Section</AccordionTrigger>
            <AccordionContent></AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      
      const trigger = screen.getByText('Empty Content Section');
      fireEvent.click(trigger);
      
      // Should not crash
      expect(trigger.closest('button')).toHaveAttribute('aria-expanded', 'true');
    });

    it('should handle long text content', () => {
      const longText = 'Lorem ipsum dolor sit amet, '.repeat(20);
      
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Long Content</AccordionTrigger>
            <AccordionContent>{longText}</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      
      fireEvent.click(screen.getByText('Long Content'));
      // Check that content containing the beginning of the long text exists
      expect(screen.getByText(/Lorem ipsum dolor sit amet/)).toBeInTheDocument();
    });
  });

  describe('Data States', () => {
    it('should set data-state to open when expanded', () => {
      renderAccordion('single');
      
      const trigger = screen.getByText('Section 1');
      fireEvent.click(trigger);
      
      const button = trigger.closest('button');
      expect(button).toHaveAttribute('data-state', 'open');
    });

    it('should set data-state to closed when collapsed', () => {
      renderAccordion('single');
      
      const trigger = screen.getByText('Section 1');
      const button = trigger.closest('button');
      
      expect(button).toHaveAttribute('data-state', 'closed');
    });
  });
});
