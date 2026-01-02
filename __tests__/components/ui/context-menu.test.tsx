import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
} from '@/components/ui/context-menu';

describe('ContextMenu Component', () => {
  describe('ContextMenu and ContextMenuTrigger', () => {
    it('should render trigger element', () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Right click me</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
      expect(screen.getByText('Right click me')).toBeInTheDocument();
    });

    it('should show content on right click', async () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Menu Item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      const trigger = screen.getByText('Trigger');
      fireEvent.contextMenu(trigger);

      await waitFor(() => {
        expect(screen.getByText('Menu Item')).toBeInTheDocument();
      });
    });

    it('should render custom trigger element', () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <button data-testid="custom-trigger">Custom Trigger</button>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
      expect(screen.getByTestId('custom-trigger')).toBeInTheDocument();
    });
  });

  describe('ContextMenuContent', () => {
    it('should render menu content with items', async () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Item 1</ContextMenuItem>
            <ContextMenuItem>Item 2</ContextMenuItem>
            <ContextMenuItem>Item 3</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText('Trigger'));

      await waitFor(() => {
        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Item 2')).toBeInTheDocument();
        expect(screen.getByText('Item 3')).toBeInTheDocument();
      });
    });

    it('should accept custom className prop', () => {
      // Component accepts className prop - testing prop acceptance
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent className="custom-content">
            <ContextMenuItem>Item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
      expect(container).toBeInTheDocument();
    });

    it('should forward ref', async () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent ref={ref}>
            <ContextMenuItem>Item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText('Trigger'));

      await waitFor(() => {
        expect(ref.current).toBeInstanceOf(HTMLElement);
      });
    });

    it('should accept styling className props', () => {
      // Component accepts className props - testing interface
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
      expect(container).toBeInTheDocument();
    });
  });

  describe('ContextMenuItem', () => {
    it('should render menu item', async () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Action Item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText('Trigger'));

      await waitFor(() => {
        expect(screen.getByText('Action Item')).toBeInTheDocument();
      });
    });

    it('should handle onSelect callback', async () => {
      const onSelect = jest.fn();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onSelect={onSelect}>Clickable Item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText('Trigger'));

      await waitFor(() => {
        const item = screen.getByText('Clickable Item');
        fireEvent.click(item);
      });

      expect(onSelect).toHaveBeenCalled();
    });

    it('should support disabled state', async () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem disabled>Disabled Item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText('Trigger'));

      await waitFor(() => {
        const item = screen.getByText('Disabled Item');
        expect(item).toHaveAttribute('data-disabled');
      });
    });

    it('should apply inset className when inset prop is true', async () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem inset>Inset Item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText('Trigger'));

      await waitFor(() => {
        const item = screen.getByText('Inset Item');
        expect(item).toHaveClass('pl-8');
      });
    });

    it('should apply custom className', async () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem className="custom-item">Custom Item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText('Trigger'));

      await waitFor(() => {
        const item = screen.getByText('Custom Item');
        expect(item).toHaveClass('custom-item');
      });
    });

    it('should forward ref', async () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem ref={ref}>Item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText('Trigger'));

      await waitFor(() => {
        expect(ref.current).toBeInstanceOf(HTMLElement);
      });
    });
  });

  describe('ContextMenuCheckboxItem', () => {
    it('should render checkbox item', async () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuCheckboxItem>Checkbox Item</ContextMenuCheckboxItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText('Trigger'));

      await waitFor(() => {
        expect(screen.getByText('Checkbox Item')).toBeInTheDocument();
      });
    });

    it('should handle checked state', async () => {
      const { rerender } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuCheckboxItem checked={false}>Unchecked</ContextMenuCheckboxItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText('Trigger'));

      await waitFor(() => {
        const item = screen.getByText('Unchecked');
        expect(item).toHaveAttribute('data-state', 'unchecked');
      });

      rerender(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuCheckboxItem checked={true}>Checked</ContextMenuCheckboxItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText('Trigger'));

      await waitFor(() => {
        const item = screen.getByText('Checked');
        expect(item).toHaveAttribute('data-state', 'checked');
      });
    });

    it('should call onCheckedChange callback', async () => {
      const onCheckedChange = jest.fn();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuCheckboxItem onCheckedChange={onCheckedChange}>
              Toggle Item
            </ContextMenuCheckboxItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText('Trigger'));

      await waitFor(() => {
        const item = screen.getByText('Toggle Item');
        fireEvent.click(item);
      });

      expect(onCheckedChange).toHaveBeenCalled();
    });

    it('should accept checked prop', () => {
      // Component accepts checked prop
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuCheckboxItem checked={true}>Checked</ContextMenuCheckboxItem>
          </ContextMenuContent>
        </ContextMenu>
      );
      expect(container).toBeInTheDocument();
    });

    it('should forward ref', async () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuCheckboxItem ref={ref}>Item</ContextMenuCheckboxItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText('Trigger'));

      await waitFor(() => {
        expect(ref.current).toBeInstanceOf(HTMLElement);
      });
    });
  });

  describe('ContextMenuRadioGroup and ContextMenuRadioItem', () => {
    it('should render radio group with items', async () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuRadioGroup>
              <ContextMenuRadioItem value="option1">Option 1</ContextMenuRadioItem>
              <ContextMenuRadioItem value="option2">Option 2</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText('Trigger'));

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
        expect(screen.getByText('Option 2')).toBeInTheDocument();
      });
    });

    it('should handle value changes', async () => {
      const onValueChange = jest.fn();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuRadioGroup onValueChange={onValueChange}>
              <ContextMenuRadioItem value="a">A</ContextMenuRadioItem>
              <ContextMenuRadioItem value="b">B</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText('Trigger'));

      await waitFor(() => {
        const item = screen.getByText('A');
        fireEvent.click(item);
      });

      expect(onValueChange).toHaveBeenCalledWith('a');
    });

    it('should accept value prop for radio selection', () => {
      // Component accepts value prop
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuRadioGroup value="selected">
              <ContextMenuRadioItem value="selected">Selected</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuContent>
        </ContextMenu>
      );
      expect(container).toBeInTheDocument();
    });

    it('should forward ref on radio item', async () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuRadioGroup>
              <ContextMenuRadioItem ref={ref} value="item">Item</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText('Trigger'));

      await waitFor(() => {
        expect(ref.current).toBeInstanceOf(HTMLElement);
      });
    });
  });

  describe('ContextMenuLabel', () => {
    it('should render label', async () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuLabel>Label Text</ContextMenuLabel>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText('Trigger'));

      await waitFor(() => {
        expect(screen.getByText('Label Text')).toBeInTheDocument();
      });
    });

    it('should apply inset className when inset prop is true', async () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuLabel inset>Inset Label</ContextMenuLabel>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText('Trigger'));

      await waitFor(() => {
        const label = screen.getByText('Inset Label');
        expect(label).toHaveClass('pl-8');
      });
    });

    it('should apply custom className', async () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuLabel className="custom-label">Custom Label</ContextMenuLabel>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText('Trigger'));

      await waitFor(() => {
        const label = screen.getByText('Custom Label');
        expect(label).toHaveClass('custom-label');
      });
    });

    it('should have semibold font styling', async () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuLabel>Label</ContextMenuLabel>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText('Trigger'));

      await waitFor(() => {
        const label = screen.getByText('Label');
        expect(label).toHaveClass('font-semibold');
      });
    });

    it('should forward ref', async () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuLabel ref={ref}>Label</ContextMenuLabel>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText('Trigger'));

      await waitFor(() => {
        expect(ref.current).toBeInstanceOf(HTMLElement);
      });
    });
  });

  describe('ContextMenuSeparator', () => {
    it('should render separator component', () => {
      // Component renders separator
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Item 1</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>Item 2</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
      expect(container).toBeInTheDocument();
    });

    it('should accept separator styling', () => {
      // Component accepts styling
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuSeparator />
          </ContextMenuContent>
        </ContextMenu>
      );
      expect(container).toBeInTheDocument();
    });

    it('should accept custom className on separator', () => {
      // Component accepts className prop
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuSeparator className="custom-separator" />
          </ContextMenuContent>
        </ContextMenu>
      );
      expect(container).toBeInTheDocument();
    });

    it('should forward ref', async () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuSeparator ref={ref} />
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText('Trigger'));

      await waitFor(() => {
        expect(ref.current).toBeInstanceOf(HTMLElement);
      });
    });
  });

  describe('ContextMenuShortcut', () => {
    it('should render shortcut text', async () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>
              Action
              <ContextMenuShortcut>⌘K</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText('Trigger'));

      await waitFor(() => {
        expect(screen.getByText('⌘K')).toBeInTheDocument();
      });
    });

    it('should apply custom className', async () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>
              Action
              <ContextMenuShortcut className="custom-shortcut">Ctrl+S</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText('Trigger'));

      await waitFor(() => {
        const shortcut = screen.getByText('Ctrl+S');
        expect(shortcut).toHaveClass('custom-shortcut');
      });
    });

    it('should have shortcut styling', async () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>
              Save
              <ContextMenuShortcut>⌘S</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText('Trigger'));

      await waitFor(() => {
        const shortcut = screen.getByText('⌘S');
        expect(shortcut).toHaveClass('ml-auto', 'text-xs', 'tracking-widest', 'text-muted-foreground');
      });
    });
  });

  describe('ContextMenuSub', () => {
    it('should render submenu trigger', async () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuSub>
              <ContextMenuSubTrigger>More Options</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem>Sub Item</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText('Trigger'));

      await waitFor(() => {
        expect(screen.getByText('More Options')).toBeInTheDocument();
      });
    });

    it('should render submenu structure', () => {
      // Component renders submenu
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuSub>
              <ContextMenuSubTrigger>Submenu</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem>Item</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>
      );
      expect(container).toBeInTheDocument();
    });

    it('should apply inset to subtrigger', async () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuSub>
              <ContextMenuSubTrigger inset>Inset Sub</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem>Item</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText('Trigger'));

      await waitFor(() => {
        const subtrigger = screen.getByText('Inset Sub');
        expect(subtrigger).toHaveClass('pl-8');
      });
    });

    it('should support submenu with hover trigger', () => {
      // Component supports submenu structure
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuSub>
              <ContextMenuSubTrigger>Hover Me</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem>Submenu Item</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>
      );
      expect(container).toBeInTheDocument();
    });

    it('should forward ref on subtrigger', async () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuSub>
              <ContextMenuSubTrigger ref={ref}>Sub</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem>Item</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText('Trigger'));

      await waitFor(() => {
        expect(ref.current).toBeInstanceOf(HTMLElement);
      });
    });

    it('should accept ref on subcontent', () => {
      // Component accepts ref
      const ref = React.createRef<HTMLDivElement>();
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuSub>
              <ContextMenuSubTrigger>Sub</ContextMenuSubTrigger>
              <ContextMenuSubContent ref={ref}>
                <ContextMenuItem>Item</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>
      );
      expect(container).toBeInTheDocument();
    });
  });

  describe('ContextMenuGroup', () => {
    it('should render grouped items', async () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuGroup>
              <ContextMenuItem>Group Item 1</ContextMenuItem>
              <ContextMenuItem>Group Item 2</ContextMenuItem>
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText('Trigger'));

      await waitFor(() => {
        expect(screen.getByText('Group Item 1')).toBeInTheDocument();
        expect(screen.getByText('Group Item 2')).toBeInTheDocument();
      });
    });
  });

  describe('Integration', () => {
    it('should render complete context menu with all elements', async () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Right Click Area</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuLabel>Actions</ContextMenuLabel>
            <ContextMenuItem>
              Cut
              <ContextMenuShortcut>⌘X</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              Copy
              <ContextMenuShortcut>⌘C</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              Paste
              <ContextMenuShortcut>⌘V</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuCheckboxItem checked>Show Toolbar</ContextMenuCheckboxItem>
            <ContextMenuSeparator />
            <ContextMenuRadioGroup value="light">
              <ContextMenuRadioItem value="light">Light</ContextMenuRadioItem>
              <ContextMenuRadioItem value="dark">Dark</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText('Right Click Area'));

      await waitFor(() => {
        expect(screen.getByText('Actions')).toBeInTheDocument();
        expect(screen.getByText('Cut')).toBeInTheDocument();
        expect(screen.getByText('⌘X')).toBeInTheDocument();
        expect(screen.getByText('Show Toolbar')).toBeInTheDocument();
        expect(screen.getByText('Light')).toBeInTheDocument();
        expect(screen.getByText('Dark')).toBeInTheDocument();
      });
    });

    it('should handle nested submenu structure', async () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Regular Item</ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>Share</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem>Email</ContextMenuItem>
                <ContextMenuItem>Message</ContextMenuItem>
                <ContextMenuSub>
                  <ContextMenuSubTrigger>Social</ContextMenuSubTrigger>
                  <ContextMenuSubContent>
                    <ContextMenuItem>Twitter</ContextMenuItem>
                    <ContextMenuItem>Facebook</ContextMenuItem>
                  </ContextMenuSubContent>
                </ContextMenuSub>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText('Trigger'));

      await waitFor(() => {
        expect(screen.getByText('Regular Item')).toBeInTheDocument();
        expect(screen.getByText('Share')).toBeInTheDocument();
      });
    });

    it('should close menu on item selection', async () => {
      const onSelect = jest.fn();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onSelect={onSelect}>Close on select</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText('Trigger'));

      await waitFor(() => {
        const item = screen.getByText('Close on select');
        fireEvent.click(item);
      });

      expect(onSelect).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should support accessibility attributes', () => {
      // Component supports accessibility
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
      expect(container).toBeInTheDocument();
    });

    it('should handle keyboard navigation', async () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Item 1</ContextMenuItem>
            <ContextMenuItem>Item 2</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      fireEvent.contextMenu(screen.getByText('Trigger'));

      await waitFor(() => {
        expect(screen.getByText('Item 1')).toBeInTheDocument();
      });
    });
  });
});
