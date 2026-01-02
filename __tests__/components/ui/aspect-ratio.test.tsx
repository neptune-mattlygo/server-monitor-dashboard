import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AspectRatio } from '@/components/ui/aspect-ratio';

describe('AspectRatio Component', () => {
  describe('Rendering', () => {
    it('should render AspectRatio with children', () => {
      const { container } = render(
        <AspectRatio ratio={16 / 9}>
          <img src="/test.jpg" alt="Test" />
        </AspectRatio>
      );
      
      const img = container.querySelector('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', '/test.jpg');
      expect(img).toHaveAttribute('alt', 'Test');
    });

    it('should render with text content', () => {
      const { container } = render(
        <AspectRatio ratio={1}>
          <div>Text content</div>
        </AspectRatio>
      );
      
      expect(container).toHaveTextContent('Text content');
    });

    it('should render with complex children', () => {
      const { container } = render(
        <AspectRatio ratio={4 / 3}>
          <div>
            <h2>Title</h2>
            <p>Description</p>
          </div>
        </AspectRatio>
      );
      
      expect(container).toHaveTextContent('Title');
      expect(container).toHaveTextContent('Description');
    });

    it('should render without children', () => {
      const { container } = render(<AspectRatio ratio={1} />);
      expect(container.querySelector('[style*="padding-bottom"]')).toBeInTheDocument();
    });
  });

  describe('Aspect Ratios', () => {
    it('should apply 16:9 aspect ratio', () => {
      const { container } = render(
        <AspectRatio ratio={16 / 9}>
          <div>Content</div>
        </AspectRatio>
      );
      
      const wrapper = container.querySelector('[style*="padding-bottom"]');
      expect(wrapper).toBeInTheDocument();
      // 9/16 * 100 = 56.25%
      expect(wrapper).toHaveStyle({ paddingBottom: '56.25%' });
    });

    it('should apply 4:3 aspect ratio', () => {
      const { container } = render(
        <AspectRatio ratio={4 / 3}>
          <div>Content</div>
        </AspectRatio>
      );
      
      const wrapper = container.querySelector('[style*="padding-bottom"]');
      expect(wrapper).toBeInTheDocument();
      // 3/4 * 100 = 75%
      expect(wrapper).toHaveStyle({ paddingBottom: '75%' });
    });

    it('should apply 1:1 square aspect ratio', () => {
      const { container } = render(
        <AspectRatio ratio={1}>
          <div>Square</div>
        </AspectRatio>
      );
      
      const wrapper = container.querySelector('[style*="padding-bottom"]');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveStyle({ paddingBottom: '100%' });
    });

    it('should apply 21:9 ultrawide aspect ratio', () => {
      const { container } = render(
        <AspectRatio ratio={21 / 9}>
          <div>Content</div>
        </AspectRatio>
      );
      
      const wrapper = container.querySelector('[style*="padding-bottom"]');
      expect(wrapper).toBeInTheDocument();
      // 9/21 * 100 ≈ 42.857%
      expect(wrapper).toHaveStyle({ paddingBottom: '42.857142857142854%' });
    });

    it('should apply 2:1 aspect ratio', () => {
      const { container } = render(
        <AspectRatio ratio={2 / 1}>
          <div>Content</div>
        </AspectRatio>
      );
      
      const wrapper = container.querySelector('[style*="padding-bottom"]');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveStyle({ paddingBottom: '50%' });
    });

    it('should apply 9:16 portrait aspect ratio', () => {
      const { container } = render(
        <AspectRatio ratio={9 / 16}>
          <div>Content</div>
        </AspectRatio>
      );
      
      const wrapper = container.querySelector('[style*="padding-bottom"]');
      expect(wrapper).toBeInTheDocument();
      // 16/9 * 100 ≈ 177.778%
      expect(wrapper).toHaveStyle({ paddingBottom: '177.77777777777777%' });
    });

    it('should handle decimal ratios', () => {
      const { container } = render(
        <AspectRatio ratio={1.5}>
          <div>Content</div>
        </AspectRatio>
      );
      
      const wrapper = container.querySelector('[style*="padding-bottom"]');
      expect(wrapper).toBeInTheDocument();
      // 1/1.5 * 100 ≈ 66.667% - check that it's approximately correct
      const paddingBottom = wrapper?.getAttribute('style')?.match(/padding-bottom:\s*([\d.]+)%/)?.[1];
      expect(parseFloat(paddingBottom || '0')).toBeCloseTo(66.67, 1);
    });
  });

  describe('Image Rendering', () => {
    it('should render image with object-fit cover', () => {
      const { container } = render(
        <AspectRatio ratio={16 / 9}>
          <img 
            src="/cover.jpg" 
            alt="Cover" 
            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
          />
        </AspectRatio>
      );
      
      const img = container.querySelector('img');
      expect(img).toHaveStyle({ objectFit: 'cover' });
    });

    it('should render image with object-fit contain', () => {
      const { container } = render(
        <AspectRatio ratio={1}>
          <img 
            src="/contain.jpg" 
            alt="Contain" 
            style={{ objectFit: 'contain', width: '100%', height: '100%' }}
          />
        </AspectRatio>
      );
      
      const img = container.querySelector('img');
      expect(img).toHaveStyle({ objectFit: 'contain' });
    });

    it('should render multiple images', () => {
      const { container } = render(
        <AspectRatio ratio={16 / 9}>
          <div>
            <img src="/img1.jpg" alt="Image 1" />
            <img src="/img2.jpg" alt="Image 2" />
          </div>
        </AspectRatio>
      );
      
      const images = container.querySelectorAll('img');
      expect(images).toHaveLength(2);
    });
  });

  describe('Video Rendering', () => {
    it('should render video element', () => {
      const { container } = render(
        <AspectRatio ratio={16 / 9}>
          <video src="/video.mp4" controls />
        </AspectRatio>
      );
      
      const video = container.querySelector('video');
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute('src', '/video.mp4');
    });

    it('should render iframe for embedded videos', () => {
      const { container } = render(
        <AspectRatio ratio={16 / 9}>
          <iframe 
            src="https://www.youtube.com/embed/test" 
            title="Video"
            allowFullScreen
          />
        </AspectRatio>
      );
      
      const iframe = container.querySelector('iframe');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/test');
    });
  });

  describe('Custom Styling', () => {
    it('should accept and apply className', () => {
      const { container } = render(
        <AspectRatio ratio={16 / 9} className="custom-aspect-ratio">
          <div>Content</div>
        </AspectRatio>
      );
      
      const element = container.querySelector('.custom-aspect-ratio');
      expect(element).toBeInTheDocument();
    });

    it('should accept and apply inline styles', () => {
      const { container } = render(
        <AspectRatio ratio={1} style={{ border: '2px solid red' }}>
          <div>Content</div>
        </AspectRatio>
      );
      
      const element = container.querySelector('[style*="border"]');
      expect(element).toBeInTheDocument();
    });

    it('should combine custom styles with aspect ratio styles', () => {
      const { container } = render(
        <AspectRatio ratio={4 / 3} style={{ maxWidth: '500px' }}>
          <div>Content</div>
        </AspectRatio>
      );
      
      const element = container.querySelector('[style*="max-width"]');
      expect(element).toBeInTheDocument();
    });
  });

  describe('Props and Attributes', () => {
    it('should pass through data attributes', () => {
      const { container } = render(
        <AspectRatio ratio={1} data-testid="aspect-ratio-test">
          <div>Content</div>
        </AspectRatio>
      );
      
      const element = container.querySelector('[data-testid="aspect-ratio-test"]');
      expect(element).toBeInTheDocument();
    });

    it('should pass through aria attributes', () => {
      const { container } = render(
        <AspectRatio ratio={16 / 9} aria-label="Video container">
          <div>Content</div>
        </AspectRatio>
      );
      
      const element = container.querySelector('[aria-label="Video container"]');
      expect(element).toBeInTheDocument();
    });

    it('should pass through id attribute', () => {
      const { container } = render(
        <AspectRatio ratio={1} id="my-aspect-ratio">
          <div>Content</div>
        </AspectRatio>
      );
      
      const element = container.querySelector('#my-aspect-ratio');
      expect(element).toBeInTheDocument();
    });
  });

  describe('Container Structure', () => {
    it('should create proper container structure', () => {
      const { container } = render(
        <AspectRatio ratio={16 / 9}>
          <div className="child">Content</div>
        </AspectRatio>
      );
      
      // Should have wrapper with position relative
      const wrapper = container.querySelector('[style*="position"]');
      expect(wrapper).toBeInTheDocument();
    });

    it('should position children absolutely', () => {
      const { container } = render(
        <AspectRatio ratio={1}>
          <div>Content</div>
        </AspectRatio>
      );
      
      // Radix AspectRatio uses a specific structure
      const aspectRatioRoot = container.firstChild;
      expect(aspectRatioRoot).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small ratios', () => {
      const { container } = render(
        <AspectRatio ratio={0.1}>
          <div>Tall content</div>
        </AspectRatio>
      );
      
      const wrapper = container.querySelector('[style*="padding-bottom"]');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveStyle({ paddingBottom: '1000%' });
    });

    it('should handle very large ratios', () => {
      const { container } = render(
        <AspectRatio ratio={10}>
          <div>Wide content</div>
        </AspectRatio>
      );
      
      const wrapper = container.querySelector('[style*="padding-bottom"]');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveStyle({ paddingBottom: '10%' });
    });

    it('should handle null children gracefully', () => {
      const { container } = render(
        <AspectRatio ratio={1}>
          {null}
        </AspectRatio>
      );
      
      expect(container.querySelector('[style*="padding-bottom"]')).toBeInTheDocument();
    });

    it('should handle undefined children gracefully', () => {
      const { container } = render(
        <AspectRatio ratio={1}>
          {undefined}
        </AspectRatio>
      );
      
      expect(container.querySelector('[style*="padding-bottom"]')).toBeInTheDocument();
    });

    it('should handle conditional children', () => {
      const showContent = true;
      const { container } = render(
        <AspectRatio ratio={16 / 9}>
          {showContent && <div>Conditional content</div>}
        </AspectRatio>
      );
      
      expect(container).toHaveTextContent('Conditional content');
    });
  });

  describe('Responsive Behavior', () => {
    it('should maintain aspect ratio with different container widths', () => {
      const { container, rerender } = render(
        <div style={{ width: '800px' }}>
          <AspectRatio ratio={16 / 9}>
            <img src="/test.jpg" alt="Test" />
          </AspectRatio>
        </div>
      );
      
      const wrapper = container.querySelector('[style*="padding-bottom"]');
      expect(wrapper).toHaveStyle({ paddingBottom: '56.25%' });
      
      // Re-render with different width - aspect ratio should stay the same
      rerender(
        <div style={{ width: '400px' }}>
          <AspectRatio ratio={16 / 9}>
            <img src="/test.jpg" alt="Test" />
          </AspectRatio>
        </div>
      );
      
      expect(wrapper).toHaveStyle({ paddingBottom: '56.25%' });
    });

    it('should work within flexbox containers', () => {
      const { container } = render(
        <div style={{ display: 'flex' }}>
          <AspectRatio ratio={1}>
            <div>Content</div>
          </AspectRatio>
        </div>
      );
      
      const wrapper = container.querySelector('[style*="padding-bottom"]');
      expect(wrapper).toBeInTheDocument();
    });

    it('should work within grid containers', () => {
      const { container } = render(
        <div style={{ display: 'grid' }}>
          <AspectRatio ratio={4 / 3}>
            <div>Content</div>
          </AspectRatio>
        </div>
      );
      
      const wrapper = container.querySelector('[style*="padding-bottom"]');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Common Use Cases', () => {
    it('should work for thumbnail images', () => {
      const { container } = render(
        <AspectRatio ratio={1} className="thumbnail">
          <img 
            src="/thumbnail.jpg" 
            alt="Thumbnail" 
            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
          />
        </AspectRatio>
      );
      
      expect(container.querySelector('.thumbnail')).toBeInTheDocument();
      expect(container.querySelector('img')).toHaveAttribute('alt', 'Thumbnail');
    });

    it('should work for hero banners', () => {
      const { container } = render(
        <AspectRatio ratio={21 / 9} className="hero-banner">
          <img 
            src="/hero.jpg" 
            alt="Hero" 
            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
          />
        </AspectRatio>
      );
      
      expect(container.querySelector('.hero-banner')).toBeInTheDocument();
    });

    it('should work for video embeds', () => {
      const { container } = render(
        <AspectRatio ratio={16 / 9}>
          <iframe 
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            title="YouTube video"
            style={{ width: '100%', height: '100%' }}
          />
        </AspectRatio>
      );
      
      const iframe = container.querySelector('iframe');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('title', 'YouTube video');
    });

    it('should work for card images', () => {
      const { container } = render(
        <AspectRatio ratio={16 / 9}>
          <div style={{ background: 'url(/card.jpg)', backgroundSize: 'cover' }}>
            Card content
          </div>
        </AspectRatio>
      );
      
      expect(container).toHaveTextContent('Card content');
    });
  });

  describe('Multiple Instances', () => {
    it('should render multiple AspectRatio components independently', () => {
      const { container } = render(
        <div>
          <AspectRatio ratio={16 / 9}>
            <div>First</div>
          </AspectRatio>
          <AspectRatio ratio={1}>
            <div>Second</div>
          </AspectRatio>
          <AspectRatio ratio={4 / 3}>
            <div>Third</div>
          </AspectRatio>
        </div>
      );
      
      expect(container).toHaveTextContent('First');
      expect(container).toHaveTextContent('Second');
      expect(container).toHaveTextContent('Third');
      
      const wrappers = container.querySelectorAll('[style*="padding-bottom"]');
      expect(wrappers).toHaveLength(3);
    });
  });
});
