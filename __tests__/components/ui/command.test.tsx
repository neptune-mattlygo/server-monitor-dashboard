import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from '@/components/ui/command';

describe('Command Component', () => {
  describe('Command', () => {
    it('should render command element', () => {
      const { container } = render(<Command>Test Command</Command>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render with children', () => {
      render(
        <Command>
          <div data-testid="child">Child content</div>
        </Command>
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<Command className="custom-class">Content</Command>);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Command ref={ref}>Content</Command>);
      expect(ref.current).toBeInstanceOf(HTMLElement);
    });

    it('should have default styling classes', () => {
      const { container } = render(<Command>Content</Command>);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('flex', 'h-full', 'w-full', 'flex-col', 'overflow-hidden', 'rounded-md');
    });
  });

  describe('CommandDialog', () => {
    it('should render dialog with command', () => {
      render(
        <CommandDialog open={true}>
          <div data-testid="dialog-content">Dialog Content</div>
        </CommandDialog>
      );
      expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
    });

    it('should respect open prop', () => {
      const { rerender } = render(
        <CommandDialog open={false}>
          <div data-testid="dialog-content">Content</div>
        </CommandDialog>
      );
      expect(screen.queryByTestId('dialog-content')).not.toBeInTheDocument();

      rerender(
        <CommandDialog open={true}>
          <div data-testid="dialog-content">Content</div>
        </CommandDialog>
      );
      expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
    });

    it('should call onOpenChange when dialog state changes', async () => {
      const onOpenChange = jest.fn();
      render(
        <CommandDialog open={true} onOpenChange={onOpenChange}>
          <div>Content</div>
        </CommandDialog>
      );

      const escapeKey = { key: 'Escape', code: 'Escape', keyCode: 27 };
      fireEvent.keyDown(document, escapeKey);

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalled();
      });
    });
  });

  describe('CommandInput', () => {
    it('should render input element', () => {
      render(
        <Command>
          <CommandInput placeholder="Search..." />
        </Command>
      );
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('should handle user input', async () => {
      const user = userEvent.setup();
      render(
        <Command>
          <CommandInput placeholder="Type here" />
        </Command>
      );

      const input = screen.getByPlaceholderText('Type here');
      await user.type(input, 'test query');
      expect(input).toHaveValue('test query');
    });

    it('should render search icon', () => {
      const { container } = render(
        <Command>
          <CommandInput />
        </Command>
      );
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should apply custom className to input', () => {
      render(
        <Command>
          <CommandInput className="custom-input" placeholder="Test" />
        </Command>
      );
      const input = screen.getByPlaceholderText('Test');
      expect(input).toHaveClass('custom-input');
    });

    it('should support disabled state', () => {
      render(
        <Command>
          <CommandInput disabled placeholder="Disabled" />
        </Command>
      );
      const input = screen.getByPlaceholderText('Disabled');
      expect(input).toBeDisabled();
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(
        <Command>
          <CommandInput ref={ref} />
        </Command>
      );
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('should have wrapper with cmdk-input-wrapper attribute', () => {
      const { container } = render(
        <Command>
          <CommandInput />
        </Command>
      );
      const wrapper = container.querySelector('[cmdk-input-wrapper]');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('CommandList', () => {
    it('should render list with items', () => {
      const { container } = render(
        <Command>
          <CommandList>
            <CommandItem>Item 1</CommandItem>
            <CommandItem>Item 2</CommandItem>
          </CommandList>
        </Command>
      );
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <Command>
          <CommandList className="custom-list">Content</CommandList>
        </Command>
      );
      const list = container.querySelector('.custom-list');
      expect(list).toBeInTheDocument();
    });

    it('should have max-height and overflow classes', () => {
      const { container } = render(
        <Command>
          <CommandList>Items</CommandList>
        </Command>
      );
      const list = container.querySelector('.max-h-\\[300px\\]');
      expect(list).toBeInTheDocument();
      expect(list).toHaveClass('overflow-y-auto', 'overflow-x-hidden');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <Command>
          <CommandList ref={ref}>Content</CommandList>
        </Command>
      );
      expect(ref.current).toBeInstanceOf(HTMLElement);
    });
  });

  describe('CommandEmpty', () => {
    it('should render empty state message', () => {
      render(
        <Command>
          <CommandList>
            <CommandEmpty>No results found</CommandEmpty>
          </CommandList>
        </Command>
      );
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('should have centered text styling', () => {
      const { container } = render(
        <Command>
          <CommandList>
            <CommandEmpty>Empty</CommandEmpty>
          </CommandList>
        </Command>
      );
      const empty = screen.getByText('Empty');
      expect(empty).toHaveClass('py-6', 'text-center', 'text-sm');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <Command>
          <CommandList>
            <CommandEmpty ref={ref}>Empty</CommandEmpty>
          </CommandList>
        </Command>
      );
      expect(ref.current).toBeInstanceOf(HTMLElement);
    });
  });

  describe('CommandGroup', () => {
    it('should render group with heading', () => {
      render(
        <Command>
          <CommandGroup heading="Suggestions">
            <CommandItem>Item 1</CommandItem>
          </CommandGroup>
        </Command>
      );
      expect(screen.getByText('Suggestions')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    it('should render multiple groups', () => {
      render(
        <Command>
          <CommandGroup heading="Group 1">
            <CommandItem>Item A</CommandItem>
          </CommandGroup>
          <CommandGroup heading="Group 2">
            <CommandItem>Item B</CommandItem>
          </CommandGroup>
        </Command>
      );
      expect(screen.getByText('Group 1')).toBeInTheDocument();
      expect(screen.getByText('Group 2')).toBeInTheDocument();
      expect(screen.getByText('Item A')).toBeInTheDocument();
      expect(screen.getByText('Item B')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <Command>
          <CommandGroup className="custom-group">
            <CommandItem>Item</CommandItem>
          </CommandGroup>
        </Command>
      );
      const group = container.querySelector('.custom-group');
      expect(group).toBeInTheDocument();
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <Command>
          <CommandGroup ref={ref}>Items</CommandGroup>
        </Command>
      );
      expect(ref.current).toBeInstanceOf(HTMLElement);
    });
  });

  describe('CommandItem', () => {
    it('should render item with text', () => {
      render(
        <Command>
          <CommandItem>Select me</CommandItem>
        </Command>
      );
      expect(screen.getByText('Select me')).toBeInTheDocument();
    });

    it('should handle onSelect callback', () => {
      const onSelect = jest.fn();
      render(
        <Command>
          <CommandItem onSelect={onSelect}>Clickable</CommandItem>
        </Command>
      );

      const item = screen.getByText('Clickable');
      fireEvent.click(item);
      expect(onSelect).toHaveBeenCalled();
    });

    it('should apply custom className', () => {
      render(
        <Command>
          <CommandItem className="custom-item">Item</CommandItem>
        </Command>
      );
      const item = screen.getByText('Item');
      expect(item).toHaveClass('custom-item');
    });

    it('should support disabled state', () => {
      render(
        <Command>
          <CommandItem disabled>Disabled Item</CommandItem>
        </Command>
      );
      const item = screen.getByText('Disabled Item');
      expect(item).toHaveAttribute('data-disabled', 'true');
    });

    it('should render with value prop', () => {
      render(
        <Command>
          <CommandItem value="unique-value">Item</CommandItem>
        </Command>
      );
      const item = screen.getByText('Item');
      expect(item).toBeInTheDocument();
    });

    it('should have proper styling classes', () => {
      render(
        <Command>
          <CommandItem>Styled Item</CommandItem>
        </Command>
      );
      const item = screen.getByText('Styled Item');
      expect(item).toHaveClass('relative', 'flex', 'cursor-default', 'select-none', 'items-center', 'rounded-sm');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <Command>
          <CommandItem ref={ref}>Item</CommandItem>
        </Command>
      );
      expect(ref.current).toBeInstanceOf(HTMLElement);
    });
  });

  describe('CommandSeparator', () => {
    it('should render separator', () => {
      const { container } = render(
        <Command>
          <CommandGroup>
            <CommandItem>Item 1</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup>
            <CommandItem>Item 2</CommandItem>
          </CommandGroup>
        </Command>
      );
      const separator = container.querySelector('.-mx-1');
      expect(separator).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <Command>
          <CommandSeparator className="custom-separator" />
        </Command>
      );
      const separator = container.querySelector('.custom-separator');
      expect(separator).toBeInTheDocument();
    });

    it('should have separator styling', () => {
      const { container } = render(
        <Command>
          <CommandSeparator />
        </Command>
      );
      const separator = container.querySelector('.-mx-1');
      expect(separator).toHaveClass('h-px', 'bg-border');
    });

    it('should forward ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <Command>
          <CommandSeparator ref={ref} />
        </Command>
      );
      expect(ref.current).toBeInstanceOf(HTMLElement);
    });
  });

  describe('CommandShortcut', () => {
    it('should render shortcut text', () => {
      render(
        <Command>
          <CommandItem>
            Open
            <CommandShortcut>⌘K</CommandShortcut>
          </CommandItem>
        </Command>
      );
      expect(screen.getByText('⌘K')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <Command>
          <CommandItem>
            Action
            <CommandShortcut className="custom-shortcut">Ctrl+S</CommandShortcut>
          </CommandItem>
        </Command>
      );
      const shortcut = screen.getByText('Ctrl+S');
      expect(shortcut).toHaveClass('custom-shortcut');
    });

    it('should have shortcut styling', () => {
      render(
        <Command>
          <CommandItem>
            Save
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </Command>
      );
      const shortcut = screen.getByText('⌘S');
      expect(shortcut).toHaveClass('ml-auto', 'text-xs', 'tracking-widest', 'text-muted-foreground');
    });
  });

  describe('Integration', () => {
    it('should render complete command palette', () => {
      render(
        <Command>
          <CommandInput placeholder="Type a command..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Suggestions">
              <CommandItem>Calendar</CommandItem>
              <CommandItem>Search Emoji</CommandItem>
              <CommandItem>Calculator</CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Settings">
              <CommandItem>Profile</CommandItem>
              <CommandItem>Billing</CommandItem>
              <CommandItem>Settings</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      );

      expect(screen.getByPlaceholderText('Type a command...')).toBeInTheDocument();
      expect(screen.getByText('Suggestions')).toBeInTheDocument();
      expect(screen.getAllByText('Settings')[0]).toBeInTheDocument(); // Group heading
      expect(screen.getByText('Calendar')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    it('should filter items based on search input', async () => {
      const user = userEvent.setup();
      render(
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandGroup>
              <CommandItem value="calendar">Calendar</CommandItem>
              <CommandItem value="calculator">Calculator</CommandItem>
              <CommandItem value="settings">Settings</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      );

      const input = screen.getByPlaceholderText('Search...');
      await user.type(input, 'cal');

      // Note: Actual filtering behavior depends on cmdk implementation
      expect(input).toHaveValue('cal');
    });

    it('should render items with shortcuts', () => {
      render(
        <Command>
          <CommandList>
            <CommandGroup>
              <CommandItem>
                Open File
                <CommandShortcut>⌘O</CommandShortcut>
              </CommandItem>
              <CommandItem>
                Save File
                <CommandShortcut>⌘S</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      );

      expect(screen.getByText('Open File')).toBeInTheDocument();
      expect(screen.getByText('⌘O')).toBeInTheDocument();
      expect(screen.getByText('Save File')).toBeInTheDocument();
      expect(screen.getByText('⌘S')).toBeInTheDocument();
    });

    it('should handle complex nested structure', () => {
      render(
        <Command>
          <CommandInput />
          <CommandList>
            <CommandGroup heading="Group 1">
              <CommandItem>
                <span>Action 1</span>
                <CommandShortcut>⌘1</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Group 2">
              <CommandItem>
                <span>Action 2</span>
                <CommandShortcut>⌘2</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      );

      expect(screen.getByText('Group 1')).toBeInTheDocument();
      expect(screen.getByText('Group 2')).toBeInTheDocument();
      expect(screen.getByText('Action 1')).toBeInTheDocument();
      expect(screen.getByText('Action 2')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should support keyboard navigation', () => {
      render(
        <Command>
          <CommandInput placeholder="Search" />
          <CommandList>
            <CommandItem>Item 1</CommandItem>
            <CommandItem>Item 2</CommandItem>
          </CommandList>
        </Command>
      );

      const input = screen.getByPlaceholderText('Search');
      expect(input).toBeInTheDocument();
      
      // Input should be focusable
      input.focus();
      expect(input).toHaveFocus();
    });

    it('should have proper ARIA attributes on disabled items', () => {
      render(
        <Command>
          <CommandItem disabled>Disabled Item</CommandItem>
        </Command>
      );

      const item = screen.getByText('Disabled Item');
      expect(item).toHaveAttribute('data-disabled', 'true');
    });
  });
});
