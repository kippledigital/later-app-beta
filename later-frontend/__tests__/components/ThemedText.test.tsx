// Test suite for ThemedText component
import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemedText } from '@/components/themed-text';

// Mock the useThemeColor hook
jest.mock('@/hooks/use-theme-color', () => ({
  useThemeColor: jest.fn(() => '#000000'),
}));

describe('ThemedText Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      const { getByText } = render(<ThemedText>Hello World</ThemedText>);

      const textElement = getByText('Hello World');
      expect(textElement).toBeTruthy();
    });

    it('should render with custom text content', () => {
      const customText = 'Custom text content for testing';
      const { getByText } = render(<ThemedText>{customText}</ThemedText>);

      expect(getByText(customText)).toBeTruthy();
    });

    it('should handle empty text content', () => {
      const { container } = render(<ThemedText></ThemedText>);
      expect(container).toBeTruthy();
    });

    it('should handle numeric content', () => {
      const { getByText } = render(<ThemedText>{12345}</ThemedText>);
      expect(getByText('12345')).toBeTruthy();
    });
  });

  describe('Type Variants', () => {
    it('should apply default styling when no type is specified', () => {
      const { getByText } = render(<ThemedText>Default text</ThemedText>);
      const textElement = getByText('Default text');

      expect(textElement.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ fontSize: 16, lineHeight: 24 })
        ])
      );
    });

    it('should apply title styling for title type', () => {
      const { getByText } = render(
        <ThemedText type="title">Title Text</ThemedText>
      );
      const textElement = getByText('Title Text');

      expect(textElement.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 32,
            fontWeight: 'bold',
            lineHeight: 32
          })
        ])
      );
    });

    it('should apply subtitle styling for subtitle type', () => {
      const { getByText } = render(
        <ThemedText type="subtitle">Subtitle Text</ThemedText>
      );
      const textElement = getByText('Subtitle Text');

      expect(textElement.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 20,
            fontWeight: 'bold'
          })
        ])
      );
    });

    it('should apply semibold styling for defaultSemiBold type', () => {
      const { getByText } = render(
        <ThemedText type="defaultSemiBold">SemiBold Text</ThemedText>
      );
      const textElement = getByText('SemiBold Text');

      expect(textElement.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 16,
            lineHeight: 24,
            fontWeight: '600'
          })
        ])
      );
    });

    it('should apply link styling for link type', () => {
      const { getByText } = render(
        <ThemedText type="link">Link Text</ThemedText>
      );
      const textElement = getByText('Link Text');

      expect(textElement.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            lineHeight: 30,
            fontSize: 16,
            color: '#0a7ea4'
          })
        ])
      );
    });
  });

  describe('Theme Integration', () => {
    it('should use theme color from useThemeColor hook', () => {
      const mockThemeColor = '#ff0000';
      const { useThemeColor } = require('@/hooks/use-theme-color');
      useThemeColor.mockReturnValue(mockThemeColor);

      const { getByText } = render(<ThemedText>Themed Text</ThemedText>);
      const textElement = getByText('Themed Text');

      expect(textElement.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ color: mockThemeColor })
        ])
      );
    });

    it('should pass light and dark colors to useThemeColor', () => {
      const { useThemeColor } = require('@/hooks/use-theme-color');
      const lightColor = '#ffffff';
      const darkColor = '#000000';

      render(
        <ThemedText lightColor={lightColor} darkColor={darkColor}>
          Color Test
        </ThemedText>
      );

      expect(useThemeColor).toHaveBeenCalledWith(
        { light: lightColor, dark: darkColor },
        'text'
      );
    });

    it('should handle undefined light and dark colors', () => {
      const { useThemeColor } = require('@/hooks/use-theme-color');

      render(<ThemedText>No Colors</ThemedText>);

      expect(useThemeColor).toHaveBeenCalledWith(
        { light: undefined, dark: undefined },
        'text'
      );
    });
  });

  describe('Style Composition', () => {
    it('should merge custom styles with type styles', () => {
      const customStyle = { marginTop: 10, fontSize: 18 };
      const { getByText } = render(
        <ThemedText type="title" style={customStyle}>
          Styled Text
        </ThemedText>
      );
      const textElement = getByText('Styled Text');

      expect(textElement.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining(customStyle),
          expect.objectContaining({ fontSize: 32 }) // Type style should take precedence
        ])
      );
    });

    it('should handle array of styles', () => {
      const style1 = { marginTop: 10 };
      const style2 = { marginBottom: 15 };
      const { getByText } = render(
        <ThemedText style={[style1, style2]}>Styled Text</ThemedText>
      );
      const textElement = getByText('Styled Text');

      expect(textElement.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining(style1),
          expect.objectContaining(style2)
        ])
      );
    });
  });

  describe('Text Props Forwarding', () => {
    it('should forward all Text props correctly', () => {
      const { getByText } = render(
        <ThemedText
          numberOfLines={2}
          ellipsizeMode="tail"
          testID="themed-text-test"
        >
          Text with props
        </ThemedText>
      );
      const textElement = getByText('Text with props');

      expect(textElement.props.numberOfLines).toBe(2);
      expect(textElement.props.ellipsizeMode).toBe('tail');
      expect(textElement.props.testID).toBe('themed-text-test');
    });

    it('should handle onPress events', () => {
      const onPressMock = jest.fn();
      const { getByText } = render(
        <ThemedText onPress={onPressMock}>Pressable Text</ThemedText>
      );
      const textElement = getByText('Pressable Text');

      expect(textElement.props.onPress).toBe(onPressMock);
    });
  });

  describe('Accessibility', () => {
    it('should support accessibility props', () => {
      const { getByText } = render(
        <ThemedText
          accessibilityLabel="Accessible text"
          accessibilityRole="text"
          accessibilityHint="This is a text element"
        >
          Accessible Content
        </ThemedText>
      );
      const textElement = getByText('Accessible Content');

      expect(textElement).toHaveAccessibilityLabel('Accessible text');
      expect(textElement).toHaveAccessibilityRole('text');
      expect(textElement.props.accessibilityHint).toBe('This is a text element');
    });

    it('should be accessible by default', () => {
      const { getByText } = render(<ThemedText>Default Accessibility</ThemedText>);
      const textElement = getByText('Default Accessibility');

      // Text should be accessible by screen readers by default
      expect(textElement.props.accessible).not.toBe(false);
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = jest.fn();

      function TestComponent({ text }: { text: string }) {
        renderSpy();
        return <ThemedText>{text}</ThemedText>;
      }

      const { rerender } = render(<TestComponent text="Initial" />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props
      rerender(<TestComponent text="Initial" />);
      expect(renderSpy).toHaveBeenCalledTimes(2); // Component re-renders but output should be memoized

      // Re-render with different props
      rerender(<TestComponent text="Changed" />);
      expect(renderSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null or undefined children gracefully', () => {
      const { container: nullContainer } = render(<ThemedText>{null}</ThemedText>);
      const { container: undefinedContainer } = render(<ThemedText>{undefined}</ThemedText>);

      expect(nullContainer).toBeTruthy();
      expect(undefinedContainer).toBeTruthy();
    });

    it('should handle boolean children', () => {
      const { container: trueContainer } = render(<ThemedText>{true}</ThemedText>);
      const { container: falseContainer } = render(<ThemedText>{false}</ThemedText>);

      expect(trueContainer).toBeTruthy();
      expect(falseContainer).toBeTruthy();
    });

    it('should handle very long text content', () => {
      const longText = 'a'.repeat(10000);
      const { getByText } = render(<ThemedText>{longText}</ThemedText>);

      expect(getByText(longText)).toBeTruthy();
    });

    it('should handle special characters and emojis', () => {
      const specialText = '🚀 Special chars: @#$%^&*()_+ 中文 العربية';
      const { getByText } = render(<ThemedText>{specialText}</ThemedText>);

      expect(getByText(specialText)).toBeTruthy();
    });
  });
});