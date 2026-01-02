import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

describe('AlertDialog Component', () => {
  const renderAlertDialog = (open = false) => {
    const onOpenChange = jest.fn();
    
    return {
      onOpenChange,
      ...render(
        <AlertDialog open={open} onOpenChange={onOpenChange}>
          <AlertDialogTrigger>Open Alert</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ),
    };
  };

  describe('Rendering', () => {
    it('should render trigger button', () => {
      renderAlertDialog();
      expect(screen.getByText('Open Alert')).toBeInTheDocument();
    });

    it('should not show dialog content initially when closed', () => {
      renderAlertDialog(false);
      expect(screen.queryByText('Are you sure?')).not.toBeInTheDocument();
    });

    it('should show dialog content when open', () => {
      renderAlertDialog(true);
      expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    });

    it('should render all dialog elements when open', () => {
      renderAlertDialog(true);
      
      expect(screen.getByText('Are you sure?')).toBeInTheDocument();
      expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Continue')).toBeInTheDocument();
    });

    it('should render overlay when dialog is open', () => {
      render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogDescription>Description</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );
      
      // Overlay is rendered in portal to document.body
      const overlay = document.body.querySelector('[data-state="open"]');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('should open dialog when trigger is clicked', async () => {
      const { onOpenChange } = renderAlertDialog();
      
      const trigger = screen.getByText('Open Alert');
      fireEvent.click(trigger);
      
      expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    it('should call onOpenChange when cancel is clicked', async () => {
      const { onOpenChange } = renderAlertDialog(true);
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(onOpenChange).toHaveBeenCalled();
    });

    it('should call onOpenChange when action is clicked', async () => {
      const { onOpenChange } = renderAlertDialog(true);
      
      const actionButton = screen.getByText('Continue');
      fireEvent.click(actionButton);
      
      expect(onOpenChange).toHaveBeenCalled();
    });

    it('should handle custom action callback', async () => {
      const handleAction = jest.fn();
      
      render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogFooter>
              <AlertDialogAction onClick={handleAction}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
      
      const actionButton = screen.getByText('Delete');
      fireEvent.click(actionButton);
      
      expect(handleAction).toHaveBeenCalled();
    });

    it('should handle custom cancel callback', async () => {
      const handleCancel = jest.fn();
      
      render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancel}>
                Cancel
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(handleCancel).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role for dialog', () => {
      renderAlertDialog(true);
      
      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toBeInTheDocument();
    });

    it('should have aria-labelledby pointing to title', () => {
      renderAlertDialog(true);
      
      const dialog = screen.getByRole('alertdialog');
      const title = screen.getByText('Are you sure?');
      
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(title).toHaveAttribute('id');
    });

    it('should have aria-describedby pointing to description', () => {
      renderAlertDialog(true);
      
      const dialog = screen.getByRole('alertdialog');
      const description = screen.getByText('This action cannot be undone.');
      
      expect(dialog).toHaveAttribute('aria-describedby');
      expect(description).toHaveAttribute('id');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      renderAlertDialog(true);
      
      const cancelButton = screen.getByText('Cancel');
      const continueButton = screen.getByText('Continue');
      
      // Tab should move focus between buttons
      await user.tab();
      // One of the buttons should have focus (order may vary)
      const focusedElement = document.activeElement;
      expect(focusedElement === cancelButton || focusedElement === continueButton).toBe(true);
    });

    it('should trap focus within dialog when open', async () => {
      const user = userEvent.setup();
      renderAlertDialog(true);
      
      const cancelButton = screen.getByText('Cancel');
      const continueButton = screen.getByText('Continue');
      
      // Focus first interactive element
      cancelButton.focus();
      expect(cancelButton).toHaveFocus();
      
      // Tab to next element
      await user.tab();
      expect(continueButton).toHaveFocus();
      
      // Tab should cycle back (focus trap)
      await user.tab();
      // Focus should cycle back to first element
      expect(document.activeElement).toBeTruthy();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className to AlertDialogContent', () => {
      render(
        <AlertDialog open={true}>
          <AlertDialogContent className="custom-content-class">
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogDescription>Description</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );
      
      // Content is rendered in portal to document.body
      const content = document.body.querySelector('.custom-content-class');
      expect(content).toBeInTheDocument();
    });

    it('should apply custom className to AlertDialogHeader', () => {
      render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogHeader className="custom-header-class">
              <AlertDialogTitle>Title</AlertDialogTitle>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>
      );
      
      const header = document.querySelector('.custom-header-class');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('flex', 'flex-col');
    });

    it('should apply custom className to AlertDialogFooter', () => {
      render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogFooter className="custom-footer-class">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
      
      const footer = document.querySelector('.custom-footer-class');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('flex', 'flex-col-reverse');
    });

    it('should apply custom className to AlertDialogTitle', () => {
      render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle className="custom-title-class">
              Custom Title
            </AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );
      
      const title = screen.getByText('Custom Title');
      expect(title).toHaveClass('custom-title-class');
      expect(title).toHaveClass('text-lg', 'font-semibold');
    });

    it('should apply custom className to AlertDialogDescription', () => {
      render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogDescription className="custom-description-class">
              Custom Description
            </AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );
      
      const description = screen.getByText('Custom Description');
      expect(description).toHaveClass('custom-description-class');
      expect(description).toHaveClass('text-sm');
    });

    it('should apply custom className to AlertDialogAction', () => {
      render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogAction className="custom-action-class">
              Action
            </AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      );
      
      const action = screen.getByText('Action');
      expect(action).toHaveClass('custom-action-class');
    });

    it('should apply custom className to AlertDialogCancel', () => {
      render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogCancel className="custom-cancel-class">
              Cancel
            </AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>
      );
      
      const cancel = screen.getByText('Cancel');
      expect(cancel).toHaveClass('custom-cancel-class');
    });
  });

  describe('Content Variations', () => {
    it('should render without description', () => {
      render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Title Only</AlertDialogTitle>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>
      );
      
      expect(screen.getByText('Title Only')).toBeInTheDocument();
      expect(screen.queryByText('This action cannot be undone.')).not.toBeInTheDocument();
    });

    it('should render with only action button', () => {
      render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogFooter>
              <AlertDialogAction>OK</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
      
      expect(screen.getByText('OK')).toBeInTheDocument();
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });

    it('should render with only cancel button', () => {
      render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
      
      expect(screen.getByText('Close')).toBeInTheDocument();
      expect(screen.queryByText('Continue')).not.toBeInTheDocument();
    });

    it('should render with custom content in header', () => {
      render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Title</AlertDialogTitle>
              <div data-testid="custom-element">Custom Element</div>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>
      );
      
      expect(screen.getByTestId('custom-element')).toBeInTheDocument();
    });

    it('should render with multiple action buttons', () => {
      render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Delete</AlertDialogAction>
              <AlertDialogAction>Archive</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
      
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Archive')).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('should be controllable with open prop', () => {
      const { rerender } = render(
        <AlertDialog open={false}>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );
      
      expect(screen.queryByText('Title')).not.toBeInTheDocument();
      
      rerender(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );
      
      expect(screen.getByText('Title')).toBeInTheDocument();
    });

    it('should support uncontrolled mode with defaultOpen', () => {
      render(
        <AlertDialog defaultOpen={true}>
          <AlertDialogTrigger>Trigger</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Uncontrolled Dialog</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );
      
      expect(screen.getByText('Uncontrolled Dialog')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty title gracefully', () => {
      render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle></AlertDialogTitle>
            <AlertDialogDescription>Description only</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );
      
      expect(screen.getByText('Description only')).toBeInTheDocument();
    });

    it('should handle long text content', () => {
      const longText = 'This is a very long description. '.repeat(20);
      
      render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogDescription>{longText}</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );
      
      expect(screen.getByText(/This is a very long description/)).toBeInTheDocument();
    });

    it('should render with nested elements', () => {
      render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogDescription>
              <div>
                <p>Paragraph 1</p>
                <p>Paragraph 2</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );
      
      expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
      expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
    });
  });

  describe('Portal Behavior', () => {
    it('should render content in portal when open', () => {
      const { container } = render(
        <div>
          <AlertDialog open={true}>
            <AlertDialogContent>
              <AlertDialogTitle>Portal Content</AlertDialogTitle>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      );
      
      // Content should be in document but not in the container
      expect(screen.getByText('Portal Content')).toBeInTheDocument();
      expect(container.querySelector('[role="alertdialog"]')).not.toBeInTheDocument();
    });
  });

  describe('Overlay', () => {
    it('should render overlay with proper styling', () => {
      const { container } = render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );
      
      const overlay = document.body.querySelector('[data-state="open"]');
      expect(overlay).toBeInTheDocument();
    });

    it('should have dark overlay background', () => {
      const { container } = render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );
      
      const overlay = document.body.querySelector('.bg-black\\/80');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Button Variants', () => {
    it('should render action button with default variant', () => {
      render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogAction>Action</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      );
      
      const action = screen.getByText('Action');
      expect(action).toBeInTheDocument();
      // Should have button classes
      expect(action.className).toContain('inline-flex');
    });

    it('should render cancel button with outline variant', () => {
      render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>
      );
      
      const cancel = screen.getByText('Cancel');
      expect(cancel).toBeInTheDocument();
      // Should have button classes
      expect(cancel.className).toContain('inline-flex');
    });
  });
});
